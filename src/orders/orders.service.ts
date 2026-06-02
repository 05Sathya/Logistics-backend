import {
  Injectable,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { Rider, RiderDocument } from '../riders/schemas/rider.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { EventsGateway } from '../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '../redis/redis.service';
import { RidersService } from '../riders/riders.service';

type OrderQuery = {
  status?: string;
  priority?: string;
  $or?: Array<{ pickupAddress?: RegExp; dropAddress?: RegExp }>;
  createdAt?: { $gte?: Date; $lte?: Date };
  client?: User;
  assignedRider?: Rider;
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: mongoose.Model<OrderDocument>,
    @InjectModel(User.name) private userModel: mongoose.Model<UserDocument>,
    @InjectModel(Rider.name) private riderModel: mongoose.Model<RiderDocument>,
    private eventsGateway: EventsGateway,
    private notificationsService: NotificationsService,
    private redisService: RedisService,
  ) {}

  async create(clientUserId: string, createOrderDto: CreateOrderDto): Promise<OrderDocument> {
    const client = await this.userModel.findById(clientUserId);
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Find available riders (not offline, and no active orders)
    const onlineRiders = await this.riderModel.find({ status: 'available', activeOrders: 0 });

    if (onlineRiders.length === 0) {
      // Throw 503 with retryAfter
      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'No riders available. Please try again later.',
          retryAfter: 60,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // Smart assignment logic
    let selectedRider: RiderDocument;
    if (createOrderDto.priority === 'urgent') {
      // assign rider with least active orders
      onlineRiders.sort((a, b) => a.activeOrders - b.activeOrders);
      selectedRider = onlineRiders[0];
    } else {
      // assign any available rider
      selectedRider = onlineRiders[Math.floor(Math.random() * onlineRiders.length)];
    }

    // Update rider active orders
    selectedRider.activeOrders += 1;
    selectedRider.status = 'busy';
    await selectedRider.save();

    // Create order
    const order = new this.orderModel({
      client: clientUserId,
      assignedRider: selectedRider._id,
      pickupAddress: createOrderDto.pickupAddress,
      dropAddress: createOrderDto.dropAddress,
      packageDetails: createOrderDto.packageDetails,
      priority: createOrderDto.priority,
      status: 'assigned',
      timeline: [
        { status: 'pending', timestamp: new Date() },
        { status: 'assigned', timestamp: new Date() },
      ],
    });

    await order.save();

    // Load user profile details for socket/notifications
    const populatedOrder = await this.orderModel
      .findById(order._id)
      .populate('client', 'name email')
      .populate({
        path: 'assignedRider',
        populate: { path: 'user', select: 'name email' },
      })
      .exec();

    if (!populatedOrder) {
      throw new NotFoundException('Order could not be verified after creation');
    }

    const riderName = populatedOrder.assignedRider?.user?.name || 'Rider';
    const estimatedTime = createOrderDto.priority === 'urgent' ? '15 mins' : '30 mins';

    // Emit Socket.io event
    this.eventsGateway.emitOrderAssigned({
      orderId: order._id.toString(),
      riderName,
      estimatedTime,
    });

    // Invalidate analytics cache
    await this.redisService.del('analytics:summary');

    // Trigger Notification
    this.notificationsService.notifyClient(
      client.name,
      order._id.toString(),
      `has been assigned to Rider ${riderName} (Est. Delivery: ${estimatedTime})`,
    );
    this.notificationsService.notifyRider(
      riderName,
      order._id.toString(),
      `New order assigned to you (Pickup: ${createOrderDto.pickupAddress})`,
    );

    return populatedOrder;
  }

  async findAll(filters: {
    status?: string;
    priority?: string;
    zone?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const query: OrderQuery = {};
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.zone) {
      query.$or = [
        { pickupAddress: new RegExp(filters.zone, 'i') },
        { dropAddress: new RegExp(filters.zone, 'i') },
      ];
    }
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(query)
        .sort({ priority: -1, createdAt: -1 }) // urgent first
        .skip(skip)
        .limit(limit)
        .populate('client', 'name email')
        .populate({
          path: 'assignedRider',
          populate: { path: 'user', select: 'name email' },
        })
        .exec(),
      this.orderModel.countDocuments(query),
    ]);

    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findMyOrders(clientUserId: string): Promise<OrderDocument[]> {
    return this.orderModel
      .find({ client: clientUserId as unknown as User })
      .sort({ createdAt: -1 })
      .populate('client', 'name email')
      .populate({
        path: 'assignedRider',
        populate: { path: 'user', select: 'name email' },
      })
      .exec();
  }

  async findRiderOrders(riderUserId: string): Promise<OrderDocument[]> {
    const rider = await this.riderModel.findOne({ user: riderUserId as unknown as User });
    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }
    return this.orderModel
      .find({ assignedRider: rider._id as unknown as Rider })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('client', 'name email')
      .populate({
        path: 'assignedRider',
        populate: { path: 'user', select: 'name email' },
      })
      .exec();
  }

  async updateStatus(
    id: string,
    riderUserId: string,
    status: string,
    proofPhoto?: string,
    failureReason?: string,
  ): Promise<OrderDocument> {
    const rider = await this.riderModel.findOne({ user: riderUserId as unknown as User }).populate('user', 'name');
    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    const order = await this.orderModel.findById(id).populate('client', 'name email');
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Ensure this rider is assigned to the order
    if (order.assignedRider?.toString() !== rider._id.toString()) {
      throw new BadRequestException('You are not assigned to this order');
    }

    const statusFlow: Record<string, string[]> = {
      pending: ['assigned'],
      assigned: ['picked_up', 'failed'],
      picked_up: ['delivered', 'failed'],
      delivered: [],
      failed: [],
    };

    const currentStatus = order.status;
    const validNextStatuses = statusFlow[currentStatus] || [];

    if (!validNextStatuses.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${currentStatus} to ${status}`);
    }

    order.status = status;
    order.timeline.push({ status, timestamp: new Date() });

    const clientName = order.client?.name || 'Client';

    if (status === 'picked_up') {
      this.notificationsService.notifyClient(clientName, order._id.toString(), 'is picked up');
    }

    if (status === 'delivered') {
      if (proofPhoto) {
        order.proofPhoto = proofPhoto;
      }
      // Calculate timeTaken in minutes
      const assignedStep = order.timeline.find((t) => t.status === 'assigned');
      const startTime = assignedStep ? assignedStep.timestamp.getTime() : order.createdAt.getTime();
      const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 60000));
      order.timeTaken = timeTaken;

      // Update rider performance metrics
      rider.activeOrders = Math.max(0, rider.activeOrders - 1);
      const oldDelivered = rider.totalDelivered;
      rider.totalDelivered += 1;
      rider.avgDeliveryTime = Math.round(
        (rider.avgDeliveryTime * oldDelivered + timeTaken) / rider.totalDelivered,
      );
      if (rider.activeOrders === 0 && rider.status === 'busy') {
        rider.status = 'available';
      }
      await rider.save();

      this.notificationsService.notifyClient(
        clientName,
        order._id.toString(),
        `has been delivered! Time taken: ${timeTaken} mins.`,
      );
      this.notificationsService.notifyAdmin(order._id.toString(), `delivered successfully by ${riderUserId}`);

      // Invalidate analytics cache
      await this.redisService.del('analytics:summary');
    }

    if (status === 'failed') {
      if (failureReason) {
        order.failureReason = failureReason;
      }
      order.failedByRiderName = (rider.user as any)?.name || 'Previous Rider';
      rider.activeOrders = Math.max(0, rider.activeOrders - 1);
      rider.totalFailed += 1;
      if (rider.activeOrders === 0 && rider.status === 'busy') {
        rider.status = 'available';
      }
      await rider.save();

      this.notificationsService.notifyClient(
        clientName,
        order._id.toString(),
        `failed to deliver. Reason: ${failureReason || 'unknown'}`,
      );

      // Invalidate analytics cache
      await this.redisService.del('analytics:summary');

      // Auto reassign
      await order.save(); // Save before reassigning
      await this.reassignOrder(order);
      
      const populated = await this.orderModel.findById(order._id).populate('client', 'name email').populate({
        path: 'assignedRider',
        populate: { path: 'user', select: 'name email' },
      }).exec();
      
      if (!populated) {
        throw new NotFoundException('Failed to load order after assignment update');
      }
      return populated;
    }

    await order.save();

    // Emit socket event for real-time updates
    this.eventsGateway.emitOrderStatusChange({
      orderId: id,
      status,
      timestamp: new Date(),
    });

    const populated = await this.orderModel.findById(order._id).populate('client', 'name email').populate({
      path: 'assignedRider',
      populate: { path: 'user', select: 'name email' },
    }).exec();

    if (!populated) {
      throw new NotFoundException('Failed to load order after status update');
    }
    return populated;
  }

  private async reassignOrder(order: OrderDocument): Promise<void> {
    const getRiderIdString = (riderField: any): string | null => {
      if (!riderField) return null;
      if (typeof riderField === 'object' && riderField._id) return riderField._id.toString();
      return riderField.toString();
    };
    const currentRiderId = getRiderIdString(order.assignedRider);

    // Find available riders except the current failed one
    const onlineRiders = await this.riderModel.find({
      status: 'available',
      activeOrders: 0,
      ...(currentRiderId ? { _id: { $ne: currentRiderId } } : {}),
    });

    if (onlineRiders.length === 0) {
      // Keep status as failed if no riders are available
      order.status = 'failed';
      // keep the assignedRider as the one who failed it
      order.timeline.push({ status: 'failed', timestamp: new Date() });
      await order.save();

      this.eventsGateway.emitOrderStatusChange({
        orderId: order._id.toString(),
        status: 'failed',
        timestamp: new Date(),
      });

      this.notificationsService.notifyAdmin(
        order._id.toString(),
        'failed and reverted to pending - no available riders for auto-reassignment.',
      );
      return;
    }

    // Select new rider
    let nextRider: RiderDocument;
    if (order.priority === 'urgent') {
      onlineRiders.sort((a, b) => a.activeOrders - b.activeOrders);
      nextRider = onlineRiders[0];
    } else {
      nextRider = onlineRiders[Math.floor(Math.random() * onlineRiders.length)];
    }

    // Assign to new rider
    nextRider.activeOrders += 1;
    nextRider.status = 'busy';
    await nextRider.save();

    order.status = 'assigned';
    order.assignedRider = nextRider as Rider;
    order.timeline.push({ status: 'assigned', timestamp: new Date() });
    await order.save();

    const populatedOrder = await this.orderModel
      .findById(order._id)
      .populate({
        path: 'assignedRider',
        populate: { path: 'user', select: 'name email' },
      })
      .exec();

    if (!populatedOrder) {
      throw new NotFoundException('Reassigned order details not found');
    }

    const newRiderName = populatedOrder.assignedRider?.user?.name || 'Rider';

    // Emit event
    this.eventsGateway.emitOrderAssigned({
      orderId: order._id.toString(),
      riderName: newRiderName,
      estimatedTime: order.priority === 'urgent' ? '15 mins' : '30 mins',
    });

    this.notificationsService.notifyAdmin(
      order._id.toString(),
      `failed — auto reassigned to Rider ${newRiderName}`,
    );
  }

  // Handle all active orders reassignment when a rider goes offline
  async reassignRiderOrders(riderId: string): Promise<number> {
    // Find all active orders for this rider
    const activeOrders = await this.orderModel.find({
      assignedRider: riderId as unknown as Rider,
      status: { $in: ['assigned', 'picked_up'] },
    });

    if (activeOrders.length === 0) {
      return 0;
    }

    let reassignedCount = 0;

    for (const order of activeOrders) {
      // Find other available riders
      const otherRiders = await this.riderModel.find({
        status: 'available',
        activeOrders: 0,
        _id: { $ne: riderId as unknown as mongoose.Types.ObjectId },
      });

      if (otherRiders.length === 0) {
        // No riders available: revert order to pending
        order.status = 'pending';
        order.assignedRider = undefined;
        order.timeline.push({ status: 'pending', timestamp: new Date() });
        await order.save();

        this.eventsGateway.emitOrderStatusChange({
          orderId: order._id.toString(),
          status: 'pending',
          timestamp: new Date(),
        });
        
        this.notificationsService.notifyAdmin(
          order._id.toString(),
          'rider went offline - order reverted to pending due to no other online riders.',
        );
      } else {
        // Reassign to other rider
        let nextRider: RiderDocument;
        if (order.priority === 'urgent') {
          otherRiders.sort((a, b) => a.activeOrders - b.activeOrders);
          nextRider = otherRiders[0];
        } else {
          nextRider = otherRiders[Math.floor(Math.random() * otherRiders.length)];
        }

        nextRider.activeOrders += 1;
        nextRider.status = 'busy';
        await nextRider.save();

        order.status = 'assigned';
        order.assignedRider = nextRider as Rider;
        order.timeline.push({ status: 'assigned', timestamp: new Date() });
        await order.save();

        const populatedOrder = await this.orderModel
          .findById(order._id)
          .populate({
            path: 'assignedRider',
            populate: { path: 'user', select: 'name email' },
          })
          .exec();

        if (!populatedOrder) {
          throw new NotFoundException('Reassigned offline order not found');
        }

        const newRiderName = populatedOrder.assignedRider?.user?.name || 'Rider';

        this.eventsGateway.emitOrderAssigned({
          orderId: order._id.toString(),
          riderName: newRiderName,
          estimatedTime: order.priority === 'urgent' ? '15 mins' : '30 mins',
        });

        this.notificationsService.notifyAdmin(
          order._id.toString(),
          `rider went offline — auto reassigned to Rider ${newRiderName}`,
        );

        reassignedCount++;
      }
    }

    return reassignedCount;
  }
}
