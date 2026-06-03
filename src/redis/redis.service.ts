import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private readonly logger = new Logger('RedisService');
  private isConnected = false;
  private errorLogged = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get('REDIS_HOST') || 'localhost';
    const port = this.configService.get('REDIS_PORT') || 6379;

    this.client = createClient({
      url: `redis://${host}:${port}`,
      socket: {
        reconnectStrategy: (retries) => {
          // After 3 retries, stop trying and go silent
          if (retries >= 3) {
            if (!this.errorLogged) {
              this.logger.warn(
                `Redis unavailable at redis://${host}:${port}. Caching disabled — app will run without it.`,
              );
              this.errorLogged = true;
            }
            return false; // stop reconnecting
          }
          return Math.min(retries * 500, 2000);
        },
      },
    });

    // Suppress per-event error spam; reconnectStrategy handles logging
    this.client.on('error', () => {});

    try {
      await this.client.connect();
      this.isConnected = true;
      this.logger.log(`Connected to Redis at redis://${host}:${port}`);
    } catch {
      this.isConnected = false;
      if (!this.errorLogged) {
        this.logger.warn(
          `Redis unavailable at redis://${host}:${port}. Caching disabled — app will run without it.`,
        );
        this.errorLogged = true;
      }
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected) return;
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, { EX: ttlSeconds });
      } else {
        await this.client.set(key, value);
      }
    } catch {
      // silently ignore
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client.del(key);
    } catch {
      // silently ignore
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

