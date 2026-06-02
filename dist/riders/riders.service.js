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
exports.RidersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const rider_schema_1 = require("./schemas/rider.schema");
const redis_service_1 = require("../redis/redis.service");
const events_gateway_1 = require("../events/events.gateway");
let RidersService = class RidersService {
    riderModel;
    redisService;
    eventsGateway;
    constructor(riderModel, redisService, eventsGateway) {
        this.riderModel = riderModel;
        this.redisService = redisService;
        this.eventsGateway = eventsGateway;
    }
    async getAvailableRiders() {
        return this.riderModel.find({ status: 'available' }).populate('user').exec();
    }
    async incrementActiveOrders(riderId) {
        await this.riderModel.findByIdAndUpdate(riderId, { $inc: { activeOrders: 1 }, status: 'busy' });
    }
    async updateLocation(riderId, lat, lng) {
        const rider = await this.riderModel.findById(riderId);
        if (!rider)
            throw new common_1.NotFoundException('Rider not found');
        const locationData = JSON.stringify({ lat, lng, timestamp: new Date() });
        await this.redisService.set(`rider:${riderId}:location`, locationData, 300);
        this.eventsGateway.emitLocationUpdate({ riderId, lat, lng });
        return { success: true };
    }
    async create(userId) {
        const newRider = new this.riderModel({ user: userId });
        return newRider.save();
    }
    async findAll() {
        return this.riderModel.find().populate('user', '-password').exec();
    }
    async findOneByUserId(userId) {
        return this.riderModel.findOne({ user: userId }).populate('user', '-password').exec();
    }
    async updateStatus(id, status) {
        const rider = await this.riderModel.findById(id);
        if (!rider)
            throw new common_1.NotFoundException('Rider not found');
        rider.status = status;
        await rider.save();
        if (status === 'offline') {
            this.eventsGateway.emitRiderOffline({ riderId: id, reassignedOrders: 0 });
        }
        return rider;
    }
};
exports.RidersService = RidersService;
exports.RidersService = RidersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(rider_schema_1.Rider.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        redis_service_1.RedisService,
        events_gateway_1.EventsGateway])
], RidersService);
//# sourceMappingURL=riders.service.js.map