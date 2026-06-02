export declare class NotificationsService {
    private readonly logger;
    notifyClient(clientName: string, orderId: string, message: string): void;
    notifyRider(riderName: string, orderId: string, message: string): void;
    notifyAdmin(orderId: string, message: string): void;
}
