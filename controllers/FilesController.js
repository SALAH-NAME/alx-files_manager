import Queue from 'bull';
import { ObjectId } from 'mongodb';
import UserUtils from '../utils/user';
import FileUtils from '../utils/file';
import BasicUtils from '../utils/basic';

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
}

export default FilesController;
