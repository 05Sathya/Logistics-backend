import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type RiderDocument = Rider & Document;

@Schema({ timestamps: true })
export class Rider {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  user: User;

  @Prop({
    required: true,
    enum: ['available', 'busy', 'offline'],
    default: 'offline',
  })
  status: string;

  @Prop({ default: 0 })
  activeOrders: number;

  @Prop({ default: 0 })
  totalDelivered: number;

  @Prop({ default: 0 })
  totalFailed: number;

  @Prop({ default: 0 })
  avgDeliveryTime: number; // in minutes
}

export const RiderSchema = SchemaFactory.createForClass(Rider);
