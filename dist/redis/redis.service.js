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
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_1 = require("redis");
let RedisService = class RedisService {
    configService;
    client;
    logger = new common_1.Logger('RedisService');
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        const host = this.configService.get('REDIS_HOST') || 'localhost';
        const port = this.configService.get('REDIS_PORT') || 6379;
        this.client = (0, redis_1.createClient)({
            url: `redis://${host}:${port}`,
        });
        this.client.on('error', (err) => this.logger.error(`Redis Client Error: ${err}`));
        try {
            await this.client.connect();
            this.logger.log(`Connected to Redis at redis://${host}:${port}`);
        }
        catch (err) {
            this.logger.error(`Failed to connect to Redis: ${err}`);
        }
    }
    async onModuleDestroy() {
        if (this.client) {
            await this.client.disconnect();
        }
    }
    async get(key) {
        try {
            return await this.client.get(key);
        }
        catch (err) {
            this.logger.error(`Redis GET error for key ${key}: ${err}`);
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            if (ttlSeconds) {
                await this.client.set(key, value, { EX: ttlSeconds });
            }
            else {
                await this.client.set(key, value);
            }
        }
        catch (err) {
            this.logger.error(`Redis SET error for key ${key}: ${err}`);
        }
    }
    async del(key) {
        try {
            await this.client.del(key);
        }
        catch (err) {
            this.logger.error(`Redis DEL error for key ${key}: ${err}`);
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map