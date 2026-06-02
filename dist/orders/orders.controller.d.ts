import * as express from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(req: express.Request, createOrderDto: CreateOrderDto): Promise<import("./schemas/order.schema").OrderDocument>;
    findAll(status?: string, priority?: string, zone?: string, startDate?: string, endDate?: string, page?: string, limit?: string): Promise<{
        orders: (import("mongoose").Document<unknown, {}, import("./schemas/order.schema").OrderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
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
    findMyOrders(req: express.Request): Promise<import("./schemas/order.schema").OrderDocument[]>;
    findRiderOrders(req: express.Request): Promise<import("./schemas/order.schema").OrderDocument[]>;
    updateStatus(id: string, req: express.Request, status: string, proofPhoto?: string, failureReason?: string): Promise<import("./schemas/order.schema").OrderDocument>;
}
