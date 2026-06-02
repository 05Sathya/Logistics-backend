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
exports.OrderSchema = exports.Order = exports.OrderTimelineStepSchema = exports.OrderTimelineStep = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../../users/schemas/user.schema");
const rider_schema_1 = require("../../riders/schemas/rider.schema");
let OrderTimelineStep = class OrderTimelineStep {
    status;
    timestamp;
};
exports.OrderTimelineStep = OrderTimelineStep;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], OrderTimelineStep.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: Date.now }),
    __metadata("design:type", Date)
], OrderTimelineStep.prototype, "timestamp", void 0);
exports.OrderTimelineStep = OrderTimelineStep = __decorate([
    (0, mongoose_1.Schema)()
], OrderTimelineStep);
exports.OrderTimelineStepSchema = mongoose_1.SchemaFactory.createForClass(OrderTimelineStep);
let Order = class Order {
    client;
    assignedRider;
    pickupAddress;
    dropAddress;
    packageDetails;
    priority;
    status;
    proofPhoto;
    failureReason;
    failedByRiderName;
    timeTaken;
    timeline;
    createdAt;
    updatedAt;
};
exports.Order = Order;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", user_schema_1.User)
], Order.prototype, "client", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Rider' }),
    __metadata("design:type", rider_schema_1.Rider)
], Order.prototype, "assignedRider", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Order.prototype, "pickupAddress", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Order.prototype, "dropAddress", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Order.prototype, "packageDetails", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['normal', 'urgent'], default: 'normal' }),
    __metadata("design:type", String)
], Order.prototype, "priority", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: ['pending', 'assigned', 'picked_up', 'delivered', 'failed'],
        default: 'pending',
    }),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Order.prototype, "proofPhoto", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Order.prototype, "failureReason", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Order.prototype, "failedByRiderName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Order.prototype, "timeTaken", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.OrderTimelineStepSchema], default: [] }),
    __metadata("design:type", Array)
], Order.prototype, "timeline", void 0);
exports.Order = Order = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Order);
exports.OrderSchema = mongoose_1.SchemaFactory.createForClass(Order);
//# sourceMappingURL=order.schema.js.map