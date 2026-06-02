import { Model } from 'mongoose';
import { RiderDocument } from './schemas/rider.schema';
import { RedisService } from '../redis/redis.service';
import { EventsGateway } from '../events/events.gateway';
export declare class RidersService {
    private riderModel;
    private redisService;
    private eventsGateway;
    constructor(riderModel: Model<RiderDocument>, redisService: RedisService, eventsGateway: EventsGateway);
    getAvailableRiders(): Promise<RiderDocument[]>;
    incrementActiveOrders(riderId: string): Promise<void>;
    updateLocation(riderId: string, lat: number, lng: number): Promise<{
        success: boolean;
    }>;
    create(userId: string): Promise<RiderDocument>;
    findAll(): Promise<RiderDocument[]>;
    findOneByUserId(userId: string): Promise<RiderDocument | null>;
    updateStatus(id: string, status: string): Promise<RiderDocument>;
}
