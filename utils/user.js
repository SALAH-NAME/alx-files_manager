import redisClient from './redis';
import dbClient from './db';

const userUtils = {
  async getUserIdAndRedisKey(req) {
    const result = { userId: null, key: null };
    const authToken = req.header('X-Token');
    if (!authToken) return result;
    result.key = `auth_${authToken}`;
    result.userId = await redisClient.get(result.key);
    return result;
  },

  async getUserFromDb(query) {
    return dbClient.usersCollection.findOne(query);
  },
};

export default userUtils;
