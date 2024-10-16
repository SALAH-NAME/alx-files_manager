import redis from 'redis';
import util from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.client.on('error', (err) => console.error(`Redis client not connected to the server: ${err.message}`));
    this.client.get = util.promisify(this.client.get);
    this.client.set = util.promisify(this.client.set);
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    return this.client.get(key);
  }

  async set(key, value, duration) {
    await this.client.set(key, value, 'EX', duration);
  }

  async del(key) {
    return this.client.del(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
