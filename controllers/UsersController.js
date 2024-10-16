import sha1 from 'sha1';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const hashedPassword = sha1(password);

    try {
      const collection = dbClient.db().collection('users');
      const existingUser = await collection.findOne({ email });

      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      await collection.insertOne({ email, password: hashedPassword });
      const newUser = await collection.findOne(
        { email },
        { projection: { email: 1 } },
      );

      return res.status(201).json({ id: newUser._id, email: newUser.email });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Server error' });
    }
  }
}

export default UsersController;
