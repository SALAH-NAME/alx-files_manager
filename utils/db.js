import { MongoClient } from 'mongodb';

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 27017;
const dbName = process.env.DB_DATABASE || 'files_manager';
const dbUrl = `mongodb://${dbHost}:${dbPort}`;

class DBClient {
  constructor() {
    MongoClient.connect(dbUrl, { useUnifiedTopology: true }, (error, client) => {
      if (!error) {
        this.db = client.db(dbName);
        this.usersCollection = this.db.collection('users');
        this.filesCollection = this.db.collection('files');
      } else {
        console.log(error.message);
        this.db = false;
      }
    });
  }

  isAlive() {
    return Boolean(this.db);
  }

  async countUsers() {
    const numberOfUsers = this.usersCollection.countDocuments();
    return numberOfUsers;
  }

  async countFiles() {
    const numberOfFiles = this.filesCollection.countDocuments();
    return numberOfFiles;
  }
}

const dbClientInstance = new DBClient();
export default dbClientInstance;
