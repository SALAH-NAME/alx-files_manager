import dbClient from './db';
import redisClient from './redis';

class UserUtils {
  static async getUserIdAndKey(req) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    return { userId, key };
  }

  static async getUser(filter) {
    const usersCollection = await dbClient.usersCollection();
    const user = await usersCollection.findOne(filter);
    return user;
  }
}

export default UserUtils;
