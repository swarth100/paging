const expressValidator = require('express-validator')();
const sinon = require('sinon');
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const authentication = require('../app/models/authentication/authentication');

let checkMsg = (list, param, msg) => {
    for (let i = 0; i < list.length; i++) {
        if (list[i].param == param) {
            return expect(list[i].msg).to.deep.equal(msg);
        }
    }
};

let stubForValidation = (done) => {
    let req = {
        query: {},
        body: {
            name: '',
            username: '',
            email: '',
            password: '',
            password2: '',
        },
        params: {},
        param: function(name) {
            return this.params[name];
        },
    };
    expressValidator(req, {}, function() {
        done(req);
    });
};

describe('Authentication Test', () => {
    let req = null;
    let error = null;
    beforeEach((done) => {
        stubForValidation((r) => {
            req = r;
            authentication.checkRegisterFields(req, (e) => {
                error = e;
                done();
            });
        });
    });
    it('Reject empty name field', (done) => {
        checkMsg(error, 'name', 'name is required');
        done();
    });
    it('Reject empty username fields', (done) => {
        checkMsg(error, 'username', 'username is required');
        done();
    });
    it('Reject empty email fields', (done) => {
        checkMsg(error, 'email', 'email is required');
        done();
    });
    it('Reject empty password fields', (done) => {
        checkMsg(error, 'password', 'password is required');
        done();
    });
    it('Reject invalid email (no @ mark)', (done) => {
        req.body.email = 'email';
        authentication.checkRegisterFields(req, (e) => {
            error = e;
            done();
        });
        checkMsg(error, 'email', 'email is invalid');
        done();
    });
    it('Reject password mismatch', (done) => {
        req.body.password = 'password';
        req.body.password2 = 'password2';
        authentication.checkRegisterFields(req, (e) => {
            error = e;
            done();
        });
        checkMsg(error, 'password', 'passwords does not match');
        done();
    });
    it('Accepts valid user detail', (done) => {
        req.body.name = 'test_name';
        req.body.username = 'test_username';
        req.body.email = 'test@test.com';
        req.body.password = 'password';
        req.body.password2 = 'password';
        authentication.checkRegisterFields(req, (e) => {
            error = e;
            done();
        });
        assert.isFalse(error, 'Must allow valid user detail to register');
    });
});
