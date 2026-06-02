import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private logger;
    afterInit(server: Server): void;
    handleConnection(client: Socket, ...args: unknown[]): void;
    handleDisconnect(client: Socket): void;
    emitOrderAssigned(data: {
        orderId: string;
        riderName: string;
        estimatedTime: string;
    }): void;
    emitOrderStatusChange(data: {
        orderId: string;
        status: string;
        timestamp: Date;
    }): void;
    emitRiderOffline(data: {
        riderId: string;
        reassignedOrders: number;
    }): void;
    emitLocationUpdate(data: {
        riderId: string;
        lat: number;
        lng: number;
    }): void;
}
