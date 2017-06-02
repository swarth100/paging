const request = require('supertest');
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const app = require('../server');
const userDB = require('../app/models/mongoose/user');

describe('Routing Test', () => {
    it('Root page gives html file with status 200', (done) => {
        request(app).get('/')
            .expect('Content-Type', /html/)
            .expect(200, done);
    });

    it('Redirect if accessing invalid url', (done) => {
        request(app).get('/hello')
            .expect('Content-Type', /html/)
            .expect(200, done);
    });

    it('POST /users/register registers new user and POST /users/login succeeds with valid data', (done) => {
        request(app).post('/users/register')
            .send({
                name: 'abc',
                username: 'test_account_abc',
                email: 'abc@mail.com',
                password: 'abc',
                password2: 'abc',
            })
            .expect(200, () => {
            request(app).post('/users/login')
                .send({
                    username: 'test_account_abc',
                    password: 'abc',
                })
                .expect(200, done);
            });
    });

    it('POST /users/login fails with invalid data', (done) => {
        request(app).post('/users/login')
            .send({
                username: 'HORnRew1jusJSdZPXCLDcqYBTlmm5E',
                password: 'LAVSzDAzhLiHFVBkxWtWmjjc39AWa44XnVo1JWOU',
            })
            .expect(401, done);
    });
});
