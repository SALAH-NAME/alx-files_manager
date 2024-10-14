import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { promises as fsPromises } from 'fs';
import dbClient from './db';
import userUtils from './user';
import basicUtils from './basic';

const fileUtils = {
  async validateBody(req) {
    const {
      name, type, isPublic = false, data,
    } = req.body;
    let { parentId = 0 } = req.body;
    const allowedTypes = ['file', 'image', 'folder'];
    let errorMessage = null;

    if (parentId === '0') parentId = 0;
    if (!name) {
      errorMessage = 'Missing name';
    } else if (!type || !allowedTypes.includes(type)) {
      errorMessage = 'Missing type';
    } else if (!data && type !== 'folder') {
      errorMessage = 'Missing data';
    } else if (parentId && parentId !== '0') {
      let parentFile;
      if (basicUtils.isValidMongoId(parentId)) {
        parentFile = await this.getFile({ _id: ObjectId(parentId) });
      } else {
        parentFile = null;
      }
      if (!parentFile) {
        errorMessage = 'Parent not found';
      } else if (parentFile.type !== 'folder') {
        errorMessage = 'Parent is not a folder';
      }
    }

    return {
      error: errorMessage,
      fileParams: {
        name,
        type,
        parentId,
        isPublic,
        data,
      },
    };
  },

  async getFile(query) {
    return dbClient.filesCollection.findOne(query);
  },

  async getFilesByParentId(query) {
    return dbClient.filesCollection.aggregate(query);
  },

  async saveFile(userId, fileParams, folderPath) {
    const {
      name, type, isPublic, data,
    } = fileParams;
    let { parentId } = fileParams;
    if (parentId !== 0) parentId = ObjectId(parentId);

    const fileData = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId,
    };

    if (type !== 'folder') {
      const fileNameUUID = uuidv4();
      const decodedData = Buffer.from(data, 'base64');
      const filePath = `${folderPath}/${fileNameUUID}`;
      fileData.localPath = filePath;

      try {
        await fsPromises.mkdir(folderPath, { recursive: true });
        await fsPromises.writeFile(filePath, decodedData);
      } catch (error) {
        return { error: error.message, code: 400 };
      }
    }

    const result = await dbClient.filesCollection.insertOne(fileData);
    const savedFile = this.processFile(fileData);
    return { error: null, newFile: { id: result.insertedId, ...savedFile } };
  },

  async updateFile(query, update) {
    return dbClient.filesCollection.findOneAndUpdate(query, update, { returnOriginal: false });
  },

  async publishUnpublishFile(req, setPublic) {
    const { id: fileId } = req.params;
    if (!basicUtils.isValidMongoId(fileId)) return { error: 'Unauthorized', code: 401 };

    const { userId } = await userUtils.getUserIdAndKey(req);
    if (!basicUtils.isValidMongoId(userId)) return { error: 'Unauthorized', code: 401 };

    const user = await userUtils.getUser({ _id: ObjectId(userId) });
    if (!user) return { error: 'Unauthorized', code: 401 };

    const file = await this.getFile({ _id: ObjectId(fileId), userId: ObjectId(userId) });
    if (!file) return { error: 'Not found', code: 404 };

    const result = await this.updateFile(
      { _id: ObjectId(fileId), userId: ObjectId(userId) },
      { $set: { isPublic: setPublic } },
    );

    const {
      _id: id, userId: ownerUserId, name, type, isPublic, parentId,
    } = result.value;
    const updatedFile = {
      id, userId: ownerUserId, name, type, isPublic, parentId,
    };
    return { error: null, code: 200, updatedFile };
  },

  processFile(doc) {
    const file = { id: doc._id, ...doc };
    delete file.localPath;
    delete file._id;
    return file;
  },

  isOwnerAndPublic(file, userId) {
    return (file.isPublic || file.userId.toString() === userId);
  },

  async getFileData(file, size) {
    let { localPath } = file;
    if (size) localPath = `${localPath}_${size}`;
    try {
      const data = await fsPromises.readFile(localPath);
      return { data };
    } catch (error) {
      return { error: 'Not found', code: 404 };
    }
  },
};

export default fileUtils;
