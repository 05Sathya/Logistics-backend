import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket, ...args: unknown[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Helper method to emit order assigned
  emitOrderAssigned(data: { orderId: string; riderName: string; estimatedTime: string }) {
    this.server.emit('order_assigned', data);
  }

  // Helper method to emit general order status updates
  emitOrderStatusChange(data: { orderId: string; status: string; timestamp: Date }) {
    this.server.emit('order_status_change', data);
  }

  // Helper method to emit rider offline
  emitRiderOffline(data: { riderId: string; reassignedOrders: number }) {
    this.server.emit('rider_offline', data);
  }

  // Helper method for live location
  emitLocationUpdate(data: { riderId: string; lat: number; lng: number }) {
    this.server.emit('location_update', data);
  }
}
