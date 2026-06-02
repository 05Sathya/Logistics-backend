import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import * as express from 'express';
import { RidersService } from './riders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces';

@Controller('riders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RidersController {
  constructor(private readonly ridersService: RidersService) {}

  @Get()
  @Roles('admin')
  async findAll() {
    return this.ridersService.findAll();
  }

  @Patch('my/status')
  @Roles('rider')
  async updateMyStatus(
    @Req() req: express.Request,
    @Body('status') status: 'available' | 'offline',
  ) {
    const authReq = req as unknown as AuthenticatedRequest;
    const rider = await this.ridersService.findOneByUserId(authReq.user.userId);
    if (!rider) {
      throw new ForbiddenException('User does not have a rider profile');
    }
    return this.ridersService.updateStatus(rider._id.toString(), status);
  }

  @Patch(':id/status')
  @Roles('admin')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'available' | 'offline',
  ) {
    return this.ridersService.updateStatus(id, status);
  }

  @Patch('location')
  @Roles('rider')
  async updateLocation(
    @Req() req: express.Request,
    @Body('lat') lat: number,
    @Body('lng') lng: number,
  ) {
    const authReq = req as unknown as AuthenticatedRequest;
    const rider = await this.ridersService.findOneByUserId(authReq.user.userId);
    if (!rider) {
      throw new ForbiddenException('User does not have a rider profile');
    }
    await this.ridersService.updateLocation(rider._id.toString(), lat, lng);
    return { success: true };
  }
}
