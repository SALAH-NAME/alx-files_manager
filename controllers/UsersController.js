import { ObjectId } from 'mongodb';
import sha1 from 'sha1';
import Queue from 'bull';
import dbClient from '../utils/db';
import userUtils from '../utils/user';

const userQueue = new Queue('userQueue');

class UsersController {
  static async postNewUser(req, res) {
    const { email, password } = req.body;
    if (!email) return res.status(400).send({ error: 'Missing email' });
    if (!password) return res.status(400).send({ error: 'Missing password' });

    const emailExists = await dbClient.usersCollection.findOne({ email });
    if (emailExists) return res.status(400).send({ error: 'Already exist' });

    const hashedPassword = sha1(password);
    let result;
    try {
      result = await dbClient.usersCollection.insertOne({
        email,
        password: hashedPassword,
      });
    } catch (error) {
      await userQueue.add({});
      return res.status(500).send({ error: 'Error creating user.' });
    }

    const newUser = {
      id: result.insertedId,
      email,
    };
    await userQueue.add({ userId: result.insertedId.toString() });
    return res.status(201).send(newUser);
  }

  static async getCurrentUser(req, res) {
    const { userId } = await userUtils.getUserIdAndKey(req);
    const user = await userUtils.getUser({ _id: ObjectId(userId) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const processedUser = { id: user._id, ...user };
    delete processedUser._id;
    delete processedUser.password;
    return res.status(200).send(processedUser);
  }
}

export default UsersController;
