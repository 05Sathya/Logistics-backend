import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import * as express from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles('client')
  async create(@Req() req: express.Request, @Body() createOrderDto: CreateOrderDto) {
    const authReq = req as unknown as AuthenticatedRequest;
    return this.ordersService.create(authReq.user.userId, createOrderDto);
  }

  @Get()
  @Roles('admin')
  async findAll(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('zone') zone?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.findAll({
      status,
      priority,
      zone,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('my')
  @Roles('client')
  async findMyOrders(@Req() req: express.Request) {
    const authReq = req as unknown as AuthenticatedRequest;
    return this.ordersService.findMyOrders(authReq.user.userId);
  }

  @Get('rider/my')
  @Roles('rider')
  async findRiderOrders(@Req() req: express.Request) {
    const authReq = req as unknown as AuthenticatedRequest;
    return this.ordersService.findRiderOrders(authReq.user.userId);
  }

  @Patch(':id/status')
  @Roles('rider')
  async updateStatus(
    @Param('id') id: string,
    @Req() req: express.Request,
    @Body('status') status: string,
    @Body('proofPhoto') proofPhoto?: string,
    @Body('failureReason') failureReason?: string,
  ) {
    const authReq = req as unknown as AuthenticatedRequest;
    return this.ordersService.updateStatus(
      id,
      authReq.user.userId,
      status,
      proofPhoto,
      failureReason,
    );
  }
}
