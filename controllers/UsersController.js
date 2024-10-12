import sha1 from 'sha1';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(request, response) {
    const { email, password } = request.body;

    if (!email) {
      return response.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return response.status(400).json({ error: 'Missing password' });
    }

    const hashedPassword = sha1(password);
    try {
      const collection = dbClient.db.collection('users');
      const existingUser = await collection.findOne({ email });

      if (existingUser) {
        return response.status(400).json({ error: 'Already exist' });
      }

      const result = await collection.insertOne({ email, password: hashedPassword });
      return response.status(201).json({ id: result.insertedId, email });
    } catch (error) {
      console.error(error);
      return response.status(500).json({ error: 'Server error' });
    }
  }
}

export default UsersController;
