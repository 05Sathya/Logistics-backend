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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiderSchema = exports.Rider = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../../users/schemas/user.schema");
let Rider = class Rider {
    user;
    status;
    activeOrders;
    totalDelivered;
    totalFailed;
    avgDeliveryTime;
};
exports.Rider = Rider;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, unique: true }),
    __metadata("design:type", user_schema_1.User)
], Rider.prototype, "user", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: ['available', 'busy', 'offline'],
        default: 'offline',
    }),
    __metadata("design:type", String)
], Rider.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Rider.prototype, "activeOrders", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Rider.prototype, "totalDelivered", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Rider.prototype, "totalFailed", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Rider.prototype, "avgDeliveryTime", void 0);
exports.Rider = Rider = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Rider);
exports.RiderSchema = mongoose_1.SchemaFactory.createForClass(Rider);
//# sourceMappingURL=rider.schema.js.map