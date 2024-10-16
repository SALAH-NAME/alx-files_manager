/* eslint-disable jest/prefer-expect-assertions */
/* eslint-disable no-unused-expressions */
/* eslint-disable jest/valid-expect */
import { expect } from 'chai';
import dbClient from '../utils/db';

describe('dbClient', () => {
  it('should be alive', () => {
    expect(dbClient.isAlive()).to.be.true;
  });

  it('should count users', async () => {
    const count = await dbClient.nbUsers();
    expect(count).to.be.a('number');
  });

  it('should count files', async () => {
    const count = await dbClient.nbFiles();
    expect(count).to.be.a('number');
  });
});
