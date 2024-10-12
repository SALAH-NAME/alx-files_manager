import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import { ObjectId } from 'mongodb';

class AppController {
  static getStatus(req, res) {
    const status = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };
    res.status(200).json(status);
  }

  static async getStats(req, res) {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();
    const stats = {
      users,
      files,
    };
    res.status(200).json(stats);
  }

  static async getMe(request, response) {
    try {
      const token = request.header('X-Token');
      const userId = await redisClient.get(`auth_${token}`);

      if (!userId) {
        return response.status(401).json({ error: 'Unauthorized' });
      }

      const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
      return response.status(200).json({ id: user._id, email: user.email });
    } catch (err) {
      console.error(err);
      return response.status(500).json({ error: 'Server error' });
    }
  }
}

export default AppController;
