"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const order_schema_1 = require("../orders/schemas/order.schema");
const rider_schema_1 = require("../riders/schemas/rider.schema");
const redis_service_1 = require("../redis/redis.service");
let AnalyticsService = class AnalyticsService {
    orderModel;
    riderModel;
    redisService;
    constructor(orderModel, riderModel, redisService) {
        this.orderModel = orderModel;
        this.riderModel = riderModel;
        this.redisService = redisService;
    }
    async getSummary() {
        const cacheKey = 'analytics:summary';
        const cachedSummary = await this.redisService.get(cacheKey);
        if (cachedSummary) {
            return JSON.parse(cachedSummary);
        }
        const orders = await this.orderModel.find().exec();
        const riders = await this.riderModel.find().populate('user', 'name').exec();
        const totalOrders = orders.length;
        const delivered = orders.filter((o) => o.status === 'delivered').length;
        const failed = orders.filter((o) => o.status === 'failed').length;
        const pending = orders.filter((o) => o.status !== 'delivered' && o.status !== 'failed').length;
        const deliveredOrders = orders.filter((o) => o.status === 'delivered');
        const totalTime = deliveredOrders.reduce((sum, o) => sum + (o.timeTaken || 0), 0);
        const avgDeliveryTime = deliveredOrders.length > 0 ? Math.round(totalTime / deliveredOrders.length) : 0;
        const finishedOrders = delivered + failed;
        const successRate = finishedOrders > 0 ? Math.round((delivered / finishedOrders) * 1000) / 10 : 0;
        const hours = new Array(24).fill(0);
        orders.forEach((o) => {
            if (o.createdAt) {
                const hr = new Date(o.createdAt).getHours();
                hours[hr]++;
            }
        });
        let peakHr = 0;
        let maxOrders = 0;
        for (let i = 0; i < 24; i++) {
            if (hours[i] > maxOrders) {
                maxOrders = hours[i];
                peakHr = i;
            }
        }
        const peakHour = `${peakHr.toString().padStart(2, '0')}:00`;
        const riderPerformance = riders.map((rider) => {
            const rDelivered = rider.totalDelivered || 0;
            const rFailed = rider.totalFailed || 0;
            const rTotal = rDelivered + rFailed;
            const rating = rTotal > 0 ? Math.round((rDelivered / rTotal) * 50) / 10 : 5.0;
            return {
                riderName: rider.user?.name || 'Rider',
                delivered: rDelivered,
                failed: rFailed,
                avgTime: rider.avgDeliveryTime || 0,
                rating,
            };
        });
        const definedZones = ['Downtown', 'West End', 'East Side', 'North', 'South'];
        const zoneCounts = {};
        definedZones.forEach((z) => {
            zoneCounts[z] = { total: 0, delivered: 0, failed: 0 };
        });
        zoneCounts['Others'] = { total: 0, delivered: 0, failed: 0 };
        orders.forEach((order) => {
            let matchedZone = 'Others';
            for (const z of definedZones) {
                const regex = new RegExp(z, 'i');
                if (regex.test(order.pickupAddress) || regex.test(order.dropAddress)) {
                    matchedZone = z;
                    break;
                }
            }
            zoneCounts[matchedZone].total++;
            if (order.status === 'delivered') {
                zoneCounts[matchedZone].delivered++;
            }
            else if (order.status === 'failed') {
                zoneCounts[matchedZone].failed++;
            }
        });
        const zoneWiseSummary = Object.keys(zoneCounts).map((z) => {
            const zDelivered = zoneCounts[z].delivered;
            const zFailed = zoneCounts[z].failed;
            const zFinished = zDelivered + zFailed;
            const zSuccessRate = zFinished > 0 ? Math.round((zDelivered / zFinished) * 1000) / 10 : 0;
            return {
                zone: z,
                totalOrders: zoneCounts[z].total,
                successRate: zSuccessRate,
            };
        });
        const summary = {
            totalOrders,
            delivered,
            failed,
            pending,
            avgDeliveryTime,
            successRate,
            peakHour,
            riderPerformance,
            zoneWiseSummary,
        };
        await this.redisService.set(cacheKey, JSON.stringify(summary), 60);
        return summary;
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __param(1, (0, mongoose_1.InjectModel)(rider_schema_1.Rider.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        redis_service_1.RedisService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map