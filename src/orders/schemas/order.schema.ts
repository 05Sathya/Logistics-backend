import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Rider } from '../../riders/schemas/rider.schema';

export type OrderDocument = Order & Document;

@Schema()
export class OrderTimelineStep {
  @Prop({ required: true })
  status: string;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;
}

export const OrderTimelineStepSchema = SchemaFactory.createForClass(OrderTimelineStep);

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  client: User;

  @Prop({ type: Types.ObjectId, ref: 'Rider' })
  assignedRider?: Rider;

  @Prop({ required: true })
  pickupAddress: string;

  @Prop({ required: true })
  dropAddress: string;

  @Prop({ required: true })
  packageDetails: string;

  @Prop({ required: true, enum: ['normal', 'urgent'], default: 'normal' })
  priority: string;

  @Prop({
    required: true,
    enum: ['pending', 'assigned', 'picked_up', 'delivered', 'failed'],
    default: 'pending',
  })
  status: string;

  @Prop()
  proofPhoto?: string;

  @Prop()
  failureReason?: string;

  @Prop()
  failedByRiderName?: string;

  @Prop()
  timeTaken?: number; // in minutes

  @Prop({ type: [OrderTimelineStepSchema], default: [] })
  timeline: OrderTimelineStep[];

  createdAt: Date;
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
