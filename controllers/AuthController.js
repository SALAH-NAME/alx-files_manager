import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import userUtils from '../utils/user';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.header('Authorization') || '';
    const encodedCredentials = authHeader.split(' ')[1];
    if (!encodedCredentials) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('utf-8');
    const [email, password] = decodedCredentials.split(':');
    if (!email || !password) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const hashedPassword = sha1(password);
    const user = await userUtils.getUser({ email, password: hashedPassword });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const authToken = uuidv4();
    const authKey = `auth_${authToken}`;
    const expirationTime = 24 * 3600; // 24 hours
    await redisClient.set(authKey, user._id.toString(), expirationTime);
    return res.status(200).send({ token: authToken });
  }

  static async getDisconnect(req, res) {
    const { userId, authKey } = await userUtils.getUserIdAndKey(req);
    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    await redisClient.del(authKey);
    return res.status(204).send();
  }
}

export default AuthController;
