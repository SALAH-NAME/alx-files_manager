import sha1 from 'sha1';
import Queue from 'bull/lib/queue';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const userQueue = new Queue('email sending');

class UsersController {
  static async postNew(req, res) {
    const email = req.body ? req.body.email : null;
    const password = req.body ? req.body.password : null;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      const usersCollection = await dbClient.usersCollection();
      const existingUser = await usersCollection.findOne({ email });

      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      const hashedPassword = sha1(password);
      const insertionInfo = await usersCollection.insertOne({ email, password: hashedPassword });
      const userId = insertionInfo.insertedId.toString();

      userQueue.add({ userId });
      return res.status(201).json({ email, id: userId });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  static async getMe(request, response) {
    const token = request.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const userObjId = new ObjectId(userId);
    const users = dbClient.db().collection('users');
    const existingUser = await users.findOne({ _id: userObjId });

    if (!existingUser) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    return response.status(200).json({ id: userId, email: existingUser.email });
  }
}

export default UsersController;
