import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const uri = `mongodb://${host}:${port}/${database}`;
    this.client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    this.client.connect((err) => {
      if (err) {
        console.error(`MongoDB client not connected to the server: ${err.message}`);
      } else {
        console.log('MongoDB client connected to the server');
      }
    });
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    return this.client.db().collection('users').countDocuments();
  }

  async nbFiles() {
    return this.client.db().collection('files').countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;
