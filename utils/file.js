import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import dbClient from './db';

class FileUtils {
  static async validateBody(req) {
    const {
      name, type, parentId = '0', isPublic = false, data,
    } = req.body;

    if (!name) return { error: 'Missing name' };
    if (!type || !['folder', 'file', 'image'].includes(type)) return { error: 'Missing type' };
    if (type !== 'folder' && !data) return { error: 'Missing data' };

    return {
      fileParams: {
        name, type, parentId, isPublic, data,
      },
    };
  }

  static async saveFile(userId, fileParams, folderPath) {
    const {
      name, type, parentId, isPublic, data,
    } = fileParams;
    const filesCollection = await dbClient.usersCollection().collection('files');

    if (parentId !== '0') {
      const parentFile = await filesCollection.findOne({ _id: new ObjectId(parentId) });
      if (!parentFile) return { error: { error: 'Parent not found' }, code: 400 };
      if (parentFile.type !== 'folder') return { error: { error: 'Parent is not a folder' }, code: 400 };
    }

    const fileDocument = {
      userId: new ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === '0' ? '0' : new ObjectId(parentId),
      localPath: '',
    };

    if (type === 'folder') {
      const result = await filesCollection.insertOne(fileDocument);
      return {
        newFile: {
          id: result.insertedId, userId, name, type, isPublic, parentId,
        },
      };
    }

    const localPath = path.join(folderPath, uuidv4());

    try {
      if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

      const fileData = Buffer.from(data, 'base64');
      fs.writeFileSync(localPath, fileData);

      fileDocument.localPath = localPath;
      const result = await filesCollection.insertOne(fileDocument);

      return {
        newFile: {
          id: result.insertedId, userId, name, type, isPublic, parentId,
        },
      };
    } catch (error) {
      return { error: { error: 'Server error' }, code: 500 };
    }
  }
}

export default FileUtils;
