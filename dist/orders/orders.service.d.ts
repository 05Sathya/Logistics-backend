import * as mongoose from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { RiderDocument } from '../riders/schemas/rider.schema';
import { UserDocument } from '../users/schemas/user.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { EventsGateway } from '../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '../redis/redis.service';
export declare class OrdersService {
    private orderModel;
    private userModel;
    private riderModel;
    private eventsGateway;
    private notificationsService;
    private redisService;
    constructor(orderModel: mongoose.Model<OrderDocument>, userModel: mongoose.Model<UserDocument>, riderModel: mongoose.Model<RiderDocument>, eventsGateway: EventsGateway, notificationsService: NotificationsService, redisService: RedisService);
    create(clientUserId: string, createOrderDto: CreateOrderDto): Promise<OrderDocument>;
    findAll(filters: {
        status?: string;
        priority?: string;
        zone?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        orders: (mongoose.Document<unknown, {}, OrderDocument, {}, mongoose.DefaultSchemaOptions> & Order & mongoose.Document<mongoose.Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findMyOrders(clientUserId: string): Promise<OrderDocument[]>;
    findRiderOrders(riderUserId: string): Promise<OrderDocument[]>;
    updateStatus(id: string, riderUserId: string, status: string, proofPhoto?: string, failureReason?: string): Promise<OrderDocument>;
    private reassignOrder;
    reassignRiderOrders(riderId: string): Promise<number>;
}
