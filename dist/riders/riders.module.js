"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RidersModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const riders_controller_1 = require("./riders.controller");
const riders_service_1 = require("./riders.service");
const rider_schema_1 = require("./schemas/rider.schema");
const users_module_1 = require("../users/users.module");
const orders_module_1 = require("../orders/orders.module");
const events_module_1 = require("../events/events.module");
const redis_module_1 = require("../redis/redis.module");
let RidersModule = class RidersModule {
};
exports.RidersModule = RidersModule;
exports.RidersModule = RidersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: rider_schema_1.Rider.name, schema: rider_schema_1.RiderSchema }]),
            users_module_1.UsersModule,
            events_module_1.EventsModule,
            redis_module_1.RedisModule,
            (0, common_1.forwardRef)(() => orders_module_1.OrdersModule),
        ],
        controllers: [riders_controller_1.RidersController],
        providers: [riders_service_1.RidersService],
        exports: [riders_service_1.RidersService, mongoose_1.MongooseModule],
    })
], RidersModule);
//# sourceMappingURL=riders.module.js.map