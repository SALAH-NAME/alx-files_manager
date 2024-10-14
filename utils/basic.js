import { ObjectId } from 'mongodb';

const basicUtils = {
  isValidMongoId(id) {
    try {
      ObjectId(id);
    } catch (error) {
      return false;
    }
    return true;
  },
};

export default basicUtils;
