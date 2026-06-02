import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('NotificationService');

  notifyClient(clientName: string, orderId: string, message: string) {
    const logMsg = `[NOTIFY] Client ${clientName}: Your order #${orderId} ${message}`;
    this.logger.log(logMsg);
    console.log(logMsg);
  }

  notifyRider(riderName: string, orderId: string, message: string) {
    const logMsg = `[NOTIFY] Rider ${riderName}: ${message} #${orderId}`;
    this.logger.log(logMsg);
    console.log(logMsg);
  }

  notifyAdmin(orderId: string, message: string) {
    const logMsg = `[NOTIFY] Admin: Order #${orderId} ${message}`;
    this.logger.log(logMsg);
    console.log(logMsg);
  }
}
