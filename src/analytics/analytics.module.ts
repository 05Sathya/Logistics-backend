import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { OrdersModule } from '../orders/orders.module';
import { RidersModule } from '../riders/riders.module';

@Module({
  imports: [OrdersModule, RidersModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
