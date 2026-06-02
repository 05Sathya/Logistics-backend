import { Model } from 'mongoose';
import { OrderDocument } from '../orders/schemas/order.schema';
import { RiderDocument } from '../riders/schemas/rider.schema';
import { RedisService } from '../redis/redis.service';
export declare class AnalyticsService {
    private orderModel;
    private riderModel;
    private redisService;
    constructor(orderModel: Model<OrderDocument>, riderModel: Model<RiderDocument>, redisService: RedisService);
    getSummary(): Promise<any>;
}
