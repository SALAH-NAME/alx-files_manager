import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static async getConnect(request, response) {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [email, password] = credentials.split(':');
      const hashedPassword = sha1(password);
      const user = await dbClient.getUser({ email });

      if (!user || user.password !== hashedPassword) {
        return response.status(401).json({ error: 'Unauthorized' });
      }

      const token = uuidv4();
      const key = `auth_${token}`;
      await redisClient.set(key, user._id.toString(), 60 * 60 * 24); // 24 hours

      return response.status(200).json({ token });
    } catch (err) {
      console.error(err);
      return response.status(500).json({ error: 'Server error' });
    }
  }

  static async getDisconnect(request, response) {
    try {
      const token = request.header('X-Token');

      if (!token) {
        return response.status(401).json({ error: 'Unauthorized' });
      }

      const userId = await redisClient.get(`auth_${token}`);

      if (!userId) {
        return response.status(401).json({ error: 'Unauthorized' });
      }

      await redisClient.del(`auth_${token}`);
      return response.status(204).send('Disconnected');
    } catch (err) {
      console.error(err);
      return response.status(500).json({ error: 'Server error' });
    }
  }
}

export default AuthController;
