import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(request, response) {
    const authHeader = request.header('Authorization');
    if (!authHeader) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    if (typeof authHeader !== 'string' || !authHeader.startsWith('Basic ')) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const authHeaderDetails = authHeader.slice(6);
    const decodedDetails = Buffer.from(authHeaderDetails, 'base64').toString('utf8');
    const [email, password] = decodedDetails.split(':');

    if (!email || !password) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const hashedPassword = sha1(password);
    const users = dbClient.db().collection('users');
    const desiredUser = await users.findOne({ email, password: hashedPassword });

    if (!desiredUser) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const token = uuidv4();
    const key = `auth_${token}`;
    await redisClient.set(key, desiredUser._id.toString(), 24 * 60 * 60); // 24 hours

    return response.status(200).json({ token });
  }

  static async getDisconnect(request, response) {
    const token = request.header('X-Token');
    const key = `auth_${token}`;
    const id = await redisClient.get(key);

    if (id) {
      await redisClient.del(key);
      return response.status(204).json({});
    }
    return response.status(401).json({ error: 'Unauthorized' });
  }
}

export default AuthController;
