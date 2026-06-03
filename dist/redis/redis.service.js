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
    isConnected = false;
    errorLogged = false;
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        const host = this.configService.get('REDIS_HOST') || 'localhost';
        const port = this.configService.get('REDIS_PORT') || 6379;
        this.client = (0, redis_1.createClient)({
            url: `redis://${host}:${port}`,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries >= 3) {
                        if (!this.errorLogged) {
                            this.logger.warn(`Redis unavailable at redis://${host}:${port}. Caching disabled — app will run without it.`);
                            this.errorLogged = true;
                        }
                        return false;
                    }
                    return Math.min(retries * 500, 2000);
                },
            },
        });
        this.client.on('error', () => { });
        try {
            await this.client.connect();
            this.isConnected = true;
            this.logger.log(`Connected to Redis at redis://${host}:${port}`);
        }
        catch {
            this.isConnected = false;
            if (!this.errorLogged) {
                this.logger.warn(`Redis unavailable at redis://${host}:${port}. Caching disabled — app will run without it.`);
                this.errorLogged = true;
            }
        }
    }
    async onModuleDestroy() {
        if (this.client && this.isConnected) {
            await this.client.disconnect();
        }
    }
    async get(key) {
        if (!this.isConnected)
            return null;
        try {
            return await this.client.get(key);
        }
        catch {
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        if (!this.isConnected)
            return;
        try {
            if (ttlSeconds) {
                await this.client.set(key, value, { EX: ttlSeconds });
            }
            else {
                await this.client.set(key, value);
            }
        }
        catch {
        }
    }
    async del(key) {
        if (!this.isConnected)
            return;
        try {
            await this.client.del(key);
        }
        catch {
        }
    }
    get connected() {
        return this.isConnected;
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map