const request = require('supertest');
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const app = require('../server');

describe('Routing Test', () => {
    it('Root page gives html file with status 200', (done) => {
        request(app).get('/')
            .expect('Content-Type', /html/)
            .expect(200, done);
    });
    it('Error when accessing non-root url', (done) => {
        request(app).get('/hello')
            .expect('Content-Type', /html/)
            .expect(404, done);
    });
    it('GET /user/index returns url for home', (done) => {
        request(app).get('/users/index')
            .expect(200)
            .then((response) => {
                expect(response.text).to.deep.equal('{"url":"/home"}');
                done();
            });
    });
});
