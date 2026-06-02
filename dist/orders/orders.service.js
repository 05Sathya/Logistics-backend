"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose = __importStar(require("mongoose"));
const order_schema_1 = require("./schemas/order.schema");
const rider_schema_1 = require("../riders/schemas/rider.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const events_gateway_1 = require("../events/events.gateway");
const notifications_service_1 = require("../notifications/notifications.service");
const redis_service_1 = require("../redis/redis.service");
let OrdersService = class OrdersService {
    orderModel;
    userModel;
    riderModel;
    eventsGateway;
    notificationsService;
    redisService;
    constructor(orderModel, userModel, riderModel, eventsGateway, notificationsService, redisService) {
        this.orderModel = orderModel;
        this.userModel = userModel;
        this.riderModel = riderModel;
        this.eventsGateway = eventsGateway;
        this.notificationsService = notificationsService;
        this.redisService = redisService;
    }
    async create(clientUserId, createOrderDto) {
        const client = await this.userModel.findById(clientUserId);
        if (!client) {
            throw new common_1.NotFoundException('Client not found');
        }
        const onlineRiders = await this.riderModel.find({ status: 'available', activeOrders: 0 });
        if (onlineRiders.length === 0) {
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.SERVICE_UNAVAILABLE,
                message: 'No riders available. Please try again later.',
                retryAfter: 60,
            }, common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        let selectedRider;
        if (createOrderDto.priority === 'urgent') {
            onlineRiders.sort((a, b) => a.activeOrders - b.activeOrders);
            selectedRider = onlineRiders[0];
        }
        else {
            selectedRider = onlineRiders[Math.floor(Math.random() * onlineRiders.length)];
        }
        selectedRider.activeOrders += 1;
        selectedRider.status = 'busy';
        await selectedRider.save();
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
        const populatedOrder = await this.orderModel
            .findById(order._id)
            .populate('client', 'name email')
            .populate({
            path: 'assignedRider',
            populate: { path: 'user', select: 'name email' },
        })
            .exec();
        if (!populatedOrder) {
            throw new common_1.NotFoundException('Order could not be verified after creation');
        }
        const riderName = populatedOrder.assignedRider?.user?.name || 'Rider';
        const estimatedTime = createOrderDto.priority === 'urgent' ? '15 mins' : '30 mins';
        this.eventsGateway.emitOrderAssigned({
            orderId: order._id.toString(),
            riderName,
            estimatedTime,
        });
        await this.redisService.del('analytics:summary');
        this.notificationsService.notifyClient(client.name, order._id.toString(), `has been assigned to Rider ${riderName} (Est. Delivery: ${estimatedTime})`);
        this.notificationsService.notifyRider(riderName, order._id.toString(), `New order assigned to you (Pickup: ${createOrderDto.pickupAddress})`);
        return populatedOrder;
    }
    async findAll(filters) {
        const query = {};
        if (filters.status)
            query.status = filters.status;
        if (filters.priority)
            query.priority = filters.priority;
        if (filters.zone) {
            query.$or = [
                { pickupAddress: new RegExp(filters.zone, 'i') },
                { dropAddress: new RegExp(filters.zone, 'i') },
            ];
        }
        if (filters.startDate || filters.endDate) {
            query.createdAt = {};
            if (filters.startDate)
                query.createdAt.$gte = new Date(filters.startDate);
            if (filters.endDate)
                query.createdAt.$lte = new Date(filters.endDate);
        }
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            this.orderModel
                .find(query)
                .sort({ priority: -1, createdAt: -1 })
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
    async findMyOrders(clientUserId) {
        return this.orderModel
            .find({ client: clientUserId })
            .sort({ createdAt: -1 })
            .populate('client', 'name email')
            .populate({
            path: 'assignedRider',
            populate: { path: 'user', select: 'name email' },
        })
            .exec();
    }
    async findRiderOrders(riderUserId) {
        const rider = await this.riderModel.findOne({ user: riderUserId });
        if (!rider) {
            throw new common_1.NotFoundException('Rider profile not found');
        }
        return this.orderModel
            .find({ assignedRider: rider._id })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('client', 'name email')
            .populate({
            path: 'assignedRider',
            populate: { path: 'user', select: 'name email' },
        })
            .exec();
    }
    async updateStatus(id, riderUserId, status, proofPhoto, failureReason) {
        const rider = await this.riderModel.findOne({ user: riderUserId }).populate('user', 'name');
        if (!rider) {
            throw new common_1.NotFoundException('Rider profile not found');
        }
        const order = await this.orderModel.findById(id).populate('client', 'name email');
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.assignedRider?.toString() !== rider._id.toString()) {
            throw new common_1.BadRequestException('You are not assigned to this order');
        }
        const statusFlow = {
            pending: ['assigned'],
            assigned: ['picked_up', 'failed'],
            picked_up: ['delivered', 'failed'],
            delivered: [],
            failed: [],
        };
        const currentStatus = order.status;
        const validNextStatuses = statusFlow[currentStatus] || [];
        if (!validNextStatuses.includes(status)) {
            throw new common_1.BadRequestException(`Cannot transition from ${currentStatus} to ${status}`);
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
            const assignedStep = order.timeline.find((t) => t.status === 'assigned');
            const startTime = assignedStep ? assignedStep.timestamp.getTime() : order.createdAt.getTime();
            const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 60000));
            order.timeTaken = timeTaken;
            rider.activeOrders = Math.max(0, rider.activeOrders - 1);
            const oldDelivered = rider.totalDelivered;
            rider.totalDelivered += 1;
            rider.avgDeliveryTime = Math.round((rider.avgDeliveryTime * oldDelivered + timeTaken) / rider.totalDelivered);
            if (rider.activeOrders === 0 && rider.status === 'busy') {
                rider.status = 'available';
            }
            await rider.save();
            this.notificationsService.notifyClient(clientName, order._id.toString(), `has been delivered! Time taken: ${timeTaken} mins.`);
            this.notificationsService.notifyAdmin(order._id.toString(), `delivered successfully by ${riderUserId}`);
            await this.redisService.del('analytics:summary');
        }
        if (status === 'failed') {
            if (failureReason) {
                order.failureReason = failureReason;
            }
            order.failedByRiderName = rider.user?.name || 'Previous Rider';
            rider.activeOrders = Math.max(0, rider.activeOrders - 1);
            rider.totalFailed += 1;
            if (rider.activeOrders === 0 && rider.status === 'busy') {
                rider.status = 'available';
            }
            await rider.save();
            this.notificationsService.notifyClient(clientName, order._id.toString(), `failed to deliver. Reason: ${failureReason || 'unknown'}`);
            await this.redisService.del('analytics:summary');
            await order.save();
            await this.reassignOrder(order);
            const populated = await this.orderModel.findById(order._id).populate('client', 'name email').populate({
                path: 'assignedRider',
                populate: { path: 'user', select: 'name email' },
            }).exec();
            if (!populated) {
                throw new common_1.NotFoundException('Failed to load order after assignment update');
            }
            return populated;
        }
        await order.save();
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
            throw new common_1.NotFoundException('Failed to load order after status update');
        }
        return populated;
    }
    async reassignOrder(order) {
        const getRiderIdString = (riderField) => {
            if (!riderField)
                return null;
            if (typeof riderField === 'object' && riderField._id)
                return riderField._id.toString();
            return riderField.toString();
        };
        const currentRiderId = getRiderIdString(order.assignedRider);
        const onlineRiders = await this.riderModel.find({
            status: 'available',
            activeOrders: 0,
            ...(currentRiderId ? { _id: { $ne: currentRiderId } } : {}),
        });
        if (onlineRiders.length === 0) {
            order.status = 'failed';
            order.timeline.push({ status: 'failed', timestamp: new Date() });
            await order.save();
            this.eventsGateway.emitOrderStatusChange({
                orderId: order._id.toString(),
                status: 'failed',
                timestamp: new Date(),
            });
            this.notificationsService.notifyAdmin(order._id.toString(), 'failed and reverted to pending - no available riders for auto-reassignment.');
            return;
        }
        let nextRider;
        if (order.priority === 'urgent') {
            onlineRiders.sort((a, b) => a.activeOrders - b.activeOrders);
            nextRider = onlineRiders[0];
        }
        else {
            nextRider = onlineRiders[Math.floor(Math.random() * onlineRiders.length)];
        }
        nextRider.activeOrders += 1;
        nextRider.status = 'busy';
        await nextRider.save();
        order.status = 'assigned';
        order.assignedRider = nextRider;
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
            throw new common_1.NotFoundException('Reassigned order details not found');
        }
        const newRiderName = populatedOrder.assignedRider?.user?.name || 'Rider';
        this.eventsGateway.emitOrderAssigned({
            orderId: order._id.toString(),
            riderName: newRiderName,
            estimatedTime: order.priority === 'urgent' ? '15 mins' : '30 mins',
        });
        this.notificationsService.notifyAdmin(order._id.toString(), `failed — auto reassigned to Rider ${newRiderName}`);
    }
    async reassignRiderOrders(riderId) {
        const activeOrders = await this.orderModel.find({
            assignedRider: riderId,
            status: { $in: ['assigned', 'picked_up'] },
        });
        if (activeOrders.length === 0) {
            return 0;
        }
        let reassignedCount = 0;
        for (const order of activeOrders) {
            const otherRiders = await this.riderModel.find({
                status: 'available',
                activeOrders: 0,
                _id: { $ne: riderId },
            });
            if (otherRiders.length === 0) {
                order.status = 'pending';
                order.assignedRider = undefined;
                order.timeline.push({ status: 'pending', timestamp: new Date() });
                await order.save();
                this.eventsGateway.emitOrderStatusChange({
                    orderId: order._id.toString(),
                    status: 'pending',
                    timestamp: new Date(),
                });
                this.notificationsService.notifyAdmin(order._id.toString(), 'rider went offline - order reverted to pending due to no other online riders.');
            }
            else {
                let nextRider;
                if (order.priority === 'urgent') {
                    otherRiders.sort((a, b) => a.activeOrders - b.activeOrders);
                    nextRider = otherRiders[0];
                }
                else {
                    nextRider = otherRiders[Math.floor(Math.random() * otherRiders.length)];
                }
                nextRider.activeOrders += 1;
                nextRider.status = 'busy';
                await nextRider.save();
                order.status = 'assigned';
                order.assignedRider = nextRider;
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
                    throw new common_1.NotFoundException('Reassigned offline order not found');
                }
                const newRiderName = populatedOrder.assignedRider?.user?.name || 'Rider';
                this.eventsGateway.emitOrderAssigned({
                    orderId: order._id.toString(),
                    riderName: newRiderName,
                    estimatedTime: order.priority === 'urgent' ? '15 mins' : '30 mins',
                });
                this.notificationsService.notifyAdmin(order._id.toString(), `rider went offline — auto reassigned to Rider ${newRiderName}`);
                reassignedCount++;
            }
        }
        return reassignedCount;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(2, (0, mongoose_1.InjectModel)(rider_schema_1.Rider.name)),
    __metadata("design:paramtypes", [mongoose.Model, mongoose.Model, mongoose.Model, events_gateway_1.EventsGateway,
        notifications_service_1.NotificationsService,
        redis_service_1.RedisService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map