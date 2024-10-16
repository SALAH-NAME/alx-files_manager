import fs from 'fs';
import Queue from 'bull';
import mime from 'mime-types';
import { ObjectId } from 'mongodb';
import UserUtils from '../utils/user';
import FileUtils from '../utils/file';
import BasicUtils from '../utils/basic';
import dbClient from '../utils/db';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
const fileQueue = new Queue('fileQueue');

class FilesController {
  static async postUpload(req, res) {
    const { userId } = await UserUtils.getUserIdAndKey(req);
    if (!BasicUtils.isValidId(userId)) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const user = await UserUtils.getUser({ _id: new ObjectId(userId) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const { error: validationError, fileParams } = await FileUtils.validateBody(req);
    if (validationError) return res.status(400).send({ error: validationError });

    if (fileParams.parentId !== '0' && !BasicUtils.isValidId(fileParams.parentId)) {
      return res.status(400).send({ error: 'Parent not found' });
    }

    const { error, code, newFile } = await FileUtils.saveFile(userId, fileParams, FOLDER_PATH);
    if (error) return res.status(code).send(error);

    if (fileParams.type === 'image') {
      await fileQueue.add({ fileId: newFile.id.toString(), userId: newFile.userId.toString() });
    }

    return res.status(201).send(newFile);
  }

  static async getShow(req, res) {
    const { userId } = await UserUtils.getUserIdAndKey(req);
    if (!BasicUtils.isValidId(userId)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await UserUtils.getUser({ _id: new ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const fileId = req.params.id;
    if (!BasicUtils.isValidId(fileId)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const filesCollection = dbClient.db().collection('files');
    const file = await filesCollection.findOne(
      { _id: new ObjectId(fileId), userId: new ObjectId(userId) },
    );

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file);
  }

  static async getIndex(req, res) {
    const { userId } = await UserUtils.getUserIdAndKey(req);
    if (!BasicUtils.isValidId(userId)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await UserUtils.getUser({ _id: new ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const parentId = req.query.parentId || '0';
    const page = parseInt(req.query.page, 10) || 0;
    const pageSize = 20;

    const filesCollection = dbClient.db().collection('files');
    const pipeline = [
      { $match: { parentId: parentId === '0' ? '0' : new ObjectId(parentId), userId: new ObjectId(userId) } },
      { $skip: page * pageSize },
      { $limit: pageSize },
    ];

    const files = await filesCollection.aggregate(pipeline).toArray();
    return res.status(200).json(files);
  }

  static async putPublish(req, res) {
    const { userId } = await UserUtils.getUserIdAndKey(req);
    if (!BasicUtils.isValidId(userId)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    if (!BasicUtils.isValidId(fileId)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const filesCollection = dbClient.db().collection('files');
    const file = await filesCollection.findOneAndUpdate(
      { _id: new ObjectId(fileId), userId: new ObjectId(userId) },
      { $set: { isPublic: true } },
      { returnOriginal: false },
    );

    if (!file.value) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file.value);
  }

  static async putUnpublish(req, res) {
    const { userId } = await UserUtils.getUserIdAndKey(req);
    if (!BasicUtils.isValidId(userId)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    if (!BasicUtils.isValidId(fileId)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const filesCollection = dbClient.db().collection('files');
    const file = await filesCollection.findOneAndUpdate(
      { _id: new ObjectId(fileId), userId: new ObjectId(userId) },
      { $set: { isPublic: false } },
      { returnOriginal: false },
    );

    if (!file.value) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file.value);
  }

  static async getFile(req, res) {
    const fileId = req.params.id;
    if (!BasicUtils.isValidId(fileId)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const filesCollection = dbClient.db().collection('files');
    const file = await filesCollection.findOne({ _id: new ObjectId(fileId) });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    if (!file.isPublic) {
      const { userId } = await UserUtils.getUserIdAndKey(req);
      if (!BasicUtils.isValidId(userId)) {
        return res.status(404).json({ error: 'Not found' });
      }

      const user = await UserUtils.getUser({ _id: new ObjectId(userId) });
      if (!user || file.userId.toString() !== userId) {
        return res.status(404).json({ error: 'Not found' });
      }
    }

    const { size } = req.query;
    let { localPath } = file;

    if (size && [100, 250, 500].includes(parseInt(size, 10))) {
      localPath = `${file.localPath}_${size}`;
    }

    if (!fs.existsSync(localPath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const mimeType = mime.lookup(file.name);
    res.setHeader('Content-Type', mimeType);
    return res.status(200).sendFile(localPath);
  }
}

export default FilesController;
