/* eslint-disable jest/expect-expect */
/* eslint-disable no-undef */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/order */
/* eslint-disable jest/prefer-expect-assertions */
/* eslint-disable no-unused-expressions */
/* eslint-disable jest/valid-expect */
import { expect } from 'chai';
import app from '../server';
import request from 'supertest';

describe('aPI Tests', () => {
  let token;

  before((done) => {
    request(app)
      .get('/connect')
      .set('Authorization', 'Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=') // Assuming this encodes to "bob@dylan.com:toto1234!"
      .end((err, res) => {
        token = res.body.token;
        done();
      });
  });

  it('should get status', () => new Promise((done) => {
    request(app)
      .get('/status')
      .expect(200)
      .end((err, res) => {
        expect(res.body).to.have.property('redis');
        expect(res.body).to.have.property('db');
        done();
      });
  }));

  it('should get stats', () => new Promise((done) => {
    request(app)
      .get('/stats')
      .expect(200)
      .end((err, res) => {
        expect(res.body).to.have.property('users');
        expect(res.body).to.have.property('files');
        done();
      });
  }));

  it('should create a new user', () => new Promise((done) => {
    request(app)
      .post('/users')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(201)
      .end((err, res) => {
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('email');
        done();
      });
  }));

  it('should connect a user', () => new Promise((done) => {
    request(app)
      .get('/connect')
      .set('Authorization', 'Basic dGVzdEBleGFtcGxlLmNvbTpwYXNzd29yZDEyMw==') // Assuming this encodes to "test@example.com:password123"
      .expect(200)
      .end((err, res) => {
        expect(res.body).to.have.property('token');
        token = res.body.token;
        done();
      });
  }));

  it('should get the current user', () => new Promise((done) => {
    request(app)
      .get('/users/me')
      .set('X-Token', token)
      .expect(200)
      .end((err, res) => {
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('email');
        done();
      });
  }));

  it('should disconnect a user', () => new Promise((done) => {
    request(app)
      .get('/disconnect')
      .set('X-Token', token)
      .expect(204, done);
  }));

  it('should create a new file', () => new Promise((done) => {
    request(app)
      .post('/files')
      .set('X-Token', token)
      .send({ name: 'test.txt', type: 'file', data: 'dGVzdCBmaWxlIGNvbnRlbnQ=' })
      .expect(201)
      .end((err, res) => {
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('name');
        done();
      });
  }));

  it('should get a file by ID', () => new Promise((done) => {
    request(app)
      .get('/files/your-file-id')
      .set('X-Token', token)
      .expect(200)
      .end((err, res) => {
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('name');
        done();
      });
  }));

  it('should get files with pagination', () => new Promise((done) => {
    request(app)
      .get('/files?page=0')
      .set('X-Token', token)
      .expect(200)
      .end((err, res) => {
        expect(res.body).to.be.an('array');
        done();
      });
  }));

  it('should publish a file', () => new Promise((done) => {
    request(app)
      .put('/files/your-file-id/publish')
      .set('X-Token', token)
      .expect(200)
      .end((err, res) => {
        expect(res.body).to.have.property('isPublic', true);
        done();
      });
  }));

  it('should unpublish a file', () => new Promise((done) => {
    request(app)
      .put('/files/your-file-id/unpublish')
      .set('X-Token', token)
      .expect(200)
      .end((err, res) => {
        expect(res.body).to.have.property('isPublic', false);
        done();
      });
  }));

  it('should get file data', () => new Promise((done) => {
    request(app)
      .get('/files/your-file-id/data')
      .set('X-Token', token)
      .expect(200)
      .end((err, res) => {
        expect(res.headers['content-type']).to.match(/text\/plain/); // Adjust based on MIME type of your file
        done();
      });
  }));

  it('should get file thumbnail data', () => new Promise((done) => {
    request(app)
      .get('/files/your-file-id/data?size=100')
      .set('X-Token', token)
      .expect(200)
      .end((err, res) => {
        expect(res.headers['content-type']).to.match(/image\/png/); // Adjust based on MIME type of your file
        done();
      });
  }));
});
