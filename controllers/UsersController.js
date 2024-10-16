import sha1 from 'sha1';
import Queue from 'bull';
import dbClient from '../utils/db';

const userQueue = new Queue('send welcome email');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Missing email' });
    } else if (!password) {
      res.status(400).json({ error: 'Missing password' });
    } else {
      const emailExists = await dbClient.db().collection('users').findOne({ email });
      if (emailExists) {
        res.status(400).json({ error: 'Already exist' });
      } else {
        const hashedPassword = sha1(password);
        const newUser = await dbClient.db().collection('users').insertOne({ email, password: hashedPassword });
        userQueue.add({ userId: newUser.insertedId });
        res.status(201).json({ id: newUser.insertedId, email });
      }
    }
  }
}

export default UsersController;
