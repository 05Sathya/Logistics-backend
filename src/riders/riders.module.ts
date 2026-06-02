import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RidersController } from './riders.controller';
import { RidersService } from './riders.service';
import { Rider, RiderSchema } from './schemas/rider.schema';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { EventsModule } from '../events/events.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Rider.name, schema: RiderSchema }]),
    UsersModule,
    EventsModule,
    RedisModule,
    forwardRef(() => OrdersModule),
  ],
  controllers: [RidersController],
  providers: [RidersService],
  exports: [RidersService, MongooseModule],
})
export class RidersModule {}
