import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rider, RiderDocument } from './schemas/rider.schema';
import { RedisService } from '../redis/redis.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class RidersService {
  constructor(
    @InjectModel(Rider.name) private riderModel: Model<RiderDocument>,
    private redisService: RedisService,
    private eventsGateway: EventsGateway,
  ) {}

  async getAvailableRiders(): Promise<RiderDocument[]> {
    return this.riderModel.find({ status: 'available' }).populate('user').exec();
  }

  async incrementActiveOrders(riderId: string): Promise<void> {
    await this.riderModel.findByIdAndUpdate(riderId, { $inc: { activeOrders: 1 }, status: 'busy' });
  }

  async updateLocation(riderId: string, lat: number, lng: number) {
    const rider = await this.riderModel.findById(riderId);
    if (!rider) throw new NotFoundException('Rider not found');

    const locationData = JSON.stringify({ lat, lng, timestamp: new Date() });
    
    // Store in Redis (expires in 5 minutes if not updated)
    await this.redisService.set(`rider:${riderId}:location`, locationData, 300);

    // Emit live location over Socket.io
    this.eventsGateway.emitLocationUpdate({ riderId, lat, lng });

    return { success: true };
  }

  async create(userId: string): Promise<RiderDocument> {
    const newRider = new this.riderModel({ user: userId });
    return newRider.save();
  }

  async findAll(): Promise<RiderDocument[]> {
    return this.riderModel.find().populate('user', '-password').exec();
  }

  async findOneByUserId(userId: string): Promise<RiderDocument | null> {
    return this.riderModel.findOne({ user: userId as any }).populate('user', '-password').exec();
  }

  async updateStatus(id: string, status: string): Promise<RiderDocument> {
    const rider = await this.riderModel.findById(id);
    if (!rider) throw new NotFoundException('Rider not found');
    rider.status = status;
    await rider.save();
    
    // If going offline, let the OrdersService handle reassignment if needed
    if (status === 'offline') {
      this.eventsGateway.emitRiderOffline({ riderId: id, reassignedOrders: 0 });
    }
    
    return rider;
  }
}
