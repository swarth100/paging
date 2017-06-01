const expressValidator = require('express-validator')({
    customValidators: {
        isUnique: function(username) {
            return new Promise((resolve, reject) => {
                let findPromise = userDB.find({username: username});
                findPromise
                    .then(function(user) {
                        reject();
                    })
                    .catch(function(err) {
                        resolve();
                    });
            });
        },
    },
});
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
            authentication.checkRegisterFields(req, null, null, (e, req, res) => {
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
});
