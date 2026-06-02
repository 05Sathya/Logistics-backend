import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Rider, RiderDocument } from '../riders/schemas/rider.schema';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Rider.name) private riderModel: Model<RiderDocument>,
    private redisService: RedisService,
  ) {}

  async getSummary() {
    const cacheKey = 'analytics:summary';
    const cachedSummary = await this.redisService.get(cacheKey);

    if (cachedSummary) {
      return JSON.parse(cachedSummary);
    }

    // Compute fresh summary
    const orders = await this.orderModel.find().exec();
    const riders = await this.riderModel.find().populate('user', 'name').exec();

    const totalOrders = orders.length;
    const delivered = orders.filter((o) => o.status === 'delivered').length;
    const failed = orders.filter((o) => o.status === 'failed').length;
    const pending = orders.filter((o) => o.status !== 'delivered' && o.status !== 'failed').length;

    // Average delivery time (in minutes)
    const deliveredOrders = orders.filter((o) => o.status === 'delivered');
    const totalTime = deliveredOrders.reduce((sum, o) => sum + (o.timeTaken || 0), 0);
    const avgDeliveryTime = deliveredOrders.length > 0 ? Math.round(totalTime / deliveredOrders.length) : 0;

    // Success rate
    const finishedOrders = delivered + failed;
    const successRate = finishedOrders > 0 ? Math.round((delivered / finishedOrders) * 1000) / 10 : 0;

    // Peak Hour calculation
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

    // Rider Performance list
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

    // Zone-wise summary
    const definedZones = ['Downtown', 'West End', 'East Side', 'North', 'South'];
    const zoneCounts: { [key: string]: { total: number; delivered: number; failed: number } } = {};

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
      } else if (order.status === 'failed') {
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

    // Cache result in Redis for 60 seconds
    await this.redisService.set(cacheKey, JSON.stringify(summary), 60);

    return summary;
  }
}
