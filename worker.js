import Queue from 'bull';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import { ObjectId } from 'mongodb';
import dbClient from './utils/db';

const fileQueue = new Queue('fileQueue');

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;
  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  const filesCollection = dbClient.db().collection('files');
  const file = await filesCollection.findOne(
    { _id: new ObjectId(fileId), userId: new ObjectId(userId) },
  );

  if (!file) throw new Error('File not found');

  const options = { responseType: 'buffer' };
  const sizes = [500, 250, 100];
  const thumbnails = sizes.map((size) => imageThumbnail(
    file.localPath, { ...options, width: size },
  ));

  try {
    const results = await Promise.all(thumbnails);
    results.forEach((thumbnail, index) => {
      const size = sizes[index];
      const thumbnailPath = `${file.localPath}_${size}`;
      fs.writeFileSync(thumbnailPath, thumbnail);
    });
  } catch (error) {
    console.error(error);
  }
});

const userQueue = new Queue('userQueue');

userQueue.process(async (job) => {
  const { userId } = job.data;
  if (!userId) throw new Error('Missing userId');

  const usersCollection = dbClient.db().collection('users');
  const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

  if (!user) throw new Error('User not found');

  console.log(`Welcome ${user.email}!`);
});
