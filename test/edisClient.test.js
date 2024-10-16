/* eslint-disable jest/prefer-expect-assertions */
/* eslint-disable no-unused-expressions */
/* eslint-disable jest/valid-expect */
import { expect } from 'chai';
import redisClient from '../utils/redis';

describe('redisClient', () => {
  it('should be alive', () => {
    expect(redisClient.isAlive()).to.be.true;
  });

  it('should set and get a value', async () => {
    await redisClient.set('testKey', 'testValue', 10);
    const value = await redisClient.get('testKey');
    expect(value).to.equal('testValue');
  });

  it('should delete a value', async () => {
    await redisClient.set('testKey', 'testValue', 10);
    await redisClient.del('testKey');
    const value = await redisClient.get('testKey');
    expect(value).to.be.null;
  });
});
