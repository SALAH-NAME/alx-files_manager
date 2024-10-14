/* eslint-disable no-return-await */
import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.client.on('error', (error) => {
      console.log(`Redis client not connected to the server: ${error.message}`);
    });
    this.client.on('connect', () => {
    });
  }

  isAlive() {
    return this.client.connected;
  }

  async getValue(key) {
    return await this.getAsync(key);
  }

  async setValue(key, value, duration) {
    this.client.setex(key, duration, value);
  }

  async deleteValue(key) {
    this.client.del(key);
  }
}

const redisClientInstance = new RedisClient();
export default redisClientInstance;
