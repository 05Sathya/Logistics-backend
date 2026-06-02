import * as express from 'express';
import { RidersService } from './riders.service';
export declare class RidersController {
    private readonly ridersService;
    constructor(ridersService: RidersService);
    findAll(): Promise<import("./schemas/rider.schema").RiderDocument[]>;
    updateMyStatus(req: express.Request, status: 'available' | 'offline'): Promise<import("./schemas/rider.schema").RiderDocument>;
    updateStatus(id: string, status: 'available' | 'offline'): Promise<import("./schemas/rider.schema").RiderDocument>;
    updateLocation(req: express.Request, lat: number, lng: number): Promise<{
        success: boolean;
    }>;
}
