// apps/backend/src/services/redis.service.ts
import { createClient, RedisClientType } from 'redis';

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  async connect(): Promise<void> {
    // If already connected, return
    if (this.isConnected && this.client) {
      return;
    }

    // If connection is in progress, wait for it
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Start new connection
    this.connectionPromise = this._connect();
    return this.connectionPromise;
  }

  private async _connect(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      const redisPassword = process.env.REDIS_PASSWORD;

      console.log('🔄 Connecting to Redis...', { 
        url: redisUrl, 
        hasPassword: !!redisPassword 
      });

      const redisConfig: any = {
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > 10) {
              console.error('Redis: Too many retries, giving up');
              return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000); // Max 3 second delay
          }
        }
      };

      // Add password if provided
      if (redisPassword) {
        redisConfig.password = redisPassword;
        console.log('🔐 Redis password configured');
      }

      this.client = createClient(redisConfig);

      this.client.on('error', (err) => {
        console.error('❌ Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('🔌 Redis socket connected');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis client ready and authenticated');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...');
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('🔌 Redis connection closed');
        this.isConnected = false;
      });

      // Connect and wait for ready state
      await this.client.connect();
      
      // Wait a bit for authentication to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Test the connection with a ping
      const pingResult = await this.client.ping();
      console.log('🏓 Redis ping result:', pingResult);

      console.log('✅ Redis connected with authentication');
      this.isConnected = true;
      this.connectionPromise = null;

    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      this.client = null;
      this.isConnected = false;
      this.connectionPromise = null;
      throw error;
    }
  }

  private async ensureConnected(): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      console.warn('⚠️ Redis not connected, attempting to connect...');
      try {
        await this.connect();
        return this.isConnected;
      } catch (error) {
        console.error('❌ Failed to ensure Redis connection:', error);
        return false;
      }
    }
    return true;
  }

  async get(key: string): Promise<string | null> {
    try {
      if (!(await this.ensureConnected())) {
        console.warn('⚠️ Redis not available for GET operation');
        return null;
      }
      return await this.client!.get(key);
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      // If it's an auth error, try to reconnect
      if (error instanceof Error && error.message.includes('NOAUTH')) {
        console.log('🔄 Attempting to reconnect due to auth error...');
        this.isConnected = false;
        await this.connect();
      }
      return null;
    }
  }

  async set(key: string, value: string, expiryInSeconds?: number): Promise<void> {
    try {
      if (!(await this.ensureConnected())) {
        console.warn('⚠️ Redis not available for SET operation');
        return;
      }
      if (expiryInSeconds) {
        await this.client!.setEx(key, expiryInSeconds, value);
      } else {
        await this.client!.set(key, value);
      }
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      // If it's an auth error, try to reconnect
      if (error instanceof Error && error.message.includes('NOAUTH')) {
        console.log('🔄 Attempting to reconnect due to auth error...');
        this.isConnected = false;
        await this.connect();
      }
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (!(await this.ensureConnected())) {
        console.warn('⚠️ Redis not available for DEL operation');
        return;
      }
      await this.client!.del(key);
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error);
      // If it's an auth error, try to reconnect
      if (error instanceof Error && error.message.includes('NOAUTH')) {
        console.log('🔄 Attempting to reconnect due to auth error...');
        this.isConnected = false;
        await this.connect();
      }
    }
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const data = await this.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Redis JSON parse error for key ${key}:`, error);
      return null;
    }
  }

  async setJSON<T>(key: string, value: T, expiryInSeconds?: number): Promise<void> {
    try {
      const jsonString = JSON.stringify(value);
      await this.set(key, jsonString, expiryInSeconds);
    } catch (error) {
      console.error(`Redis JSON stringify error for key ${key}:`, error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        this.isConnected = false;
        console.log('✅ Redis disconnected gracefully');
      } catch (error) {
        console.error('❌ Error disconnecting Redis:', error);
        // Force disconnect if graceful quit fails
        await this.client.disconnect();
      }
    }
  }

  isActive(): boolean {
    return this.isConnected && this.client !== null;
  }
}

export const redisService = new RedisService();