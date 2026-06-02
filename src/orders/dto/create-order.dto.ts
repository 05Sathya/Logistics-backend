import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  pickupAddress: string;

  @IsString()
  @IsNotEmpty()
  dropAddress: string;

  @IsString()
  @IsNotEmpty()
  packageDetails: string;

  @IsEnum(['normal', 'urgent'])
  priority: string;
}
