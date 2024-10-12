import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(request, response) {
    const {
      name,
      type,
      parentId = 0,
      isPublic = false,
      data,
    } = request.body;
    const token = request.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    if (!name) {
      return response.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return response.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return response.status(400).json({ error: 'Missing data' });
    }

    if (parentId !== 0) {
      const parentFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });
      if (!parentFile) {
        return response.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return response.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const fileDocument = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId !== 0 ? ObjectId(parentId) : 0,
    };

    if (type === 'folder') {
      await dbClient.db.collection('files').insertOne(fileDocument);
      return response.status(201).json(fileDocument);
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const localPath = path.join(folderPath, uuidv4());
    const decodedData = Buffer.from(data, 'base64');

    fs.writeFileSync(localPath, decodedData);

    fileDocument.localPath = localPath;
    await dbClient.db.collection('files').insertOne(fileDocument);

    return response.status(201).json(fileDocument);
  }

  static async getShow(request, response) {
    const token = request.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = request.params.id;
    const file = await dbClient.db.collection('files').findOne({
      _id: ObjectId(fileId),
      userId: ObjectId(userId),
    });

    if (!file) {
      return response.status(404).json({ error: 'Not found' });
    }

    return response.status(200).json(file);
  }

  static async getIndex(request, response) {
    const token = request.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const parentId = request.query.parentId || 0;
    const page = parseInt(request.query.page, 10) || 0;

    const files = await dbClient.db.collection('files')
      .aggregate([
        { $match: { parentId: parentId === '0' ? 0 : ObjectId(parentId), userId: ObjectId(userId) } },
        { $skip: page * 20 },
        { $limit: 20 }
      ])
      .toArray();

    return response.status(200).json(files);
  }
}

export default FilesController;
