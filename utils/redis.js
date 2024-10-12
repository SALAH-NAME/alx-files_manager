import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.redisInstance = createClient();
    this.redisInstance.on('error', (error) => {
      console.log(`Redis client not connected to server: ${error}`);
    });
  }

  isAlive() {
    if (this.redisInstance.connected) {
      return true;
    }
    return false;
  }

  async getValue(key) {
    const getCommand = promisify(this.redisInstance.get).bind(this.redisInstance);
    const value = await getCommand(key);
    return value;
  }

  async setKey(key, value, time) {
    const setCommand = promisify(this.redisInstance.set).bind(this.redisInstance);
    await setCommand(key, value);
    await this.redisInstance.expire(key, time);
  }

  async deleteKey(key) {
    const delCommand = promisify(this.redisInstance.del).bind(this.redisInstance);
    await delCommand(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
