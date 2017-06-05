const should = require('should');
const sinon = require('sinon');
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const friendlist = require('./../app/models/friendlist/friendlist');
const userDB = require('./../app/models/mongoose/user');
const _ = require('underscore');

describe('Friendlist', () => {
    it('Adding friend calls userDB addFriend', (done) => {
        let addFriend = sinon.stub(userDB, 'addFriends')
            .returns(Promise.resolve([true, 'success']));
        friendlist.addFriend('a', 'b',
            (res, msg) => {
                assert(res === true, 'response should be true');
                assert(msg === 'success', 'got wrong message');
                sinon.assert.calledOnce(addFriend);
                done();
            });
    });
    it('Accepting friend calls userDB acceptFriend', (done) => {
        let acceptFriendReq = sinon.stub(userDB, 'acceptFriendReq')
            .returns(Promise.resolve([true, 'success']));
        friendlist.acceptFriendReq('a', 'b',
        (res, msg) => {
            assert(res === true, 'response should be true');
            assert(msg === 'success', 'got wrong message');
            sinon.assert.calledOnce(acceptFriendReq);
            done();
        });
    });
    it('Getting friend usernames calls userDB getFriendUsernames', (done) => {
        let getFriendUsernames = sinon.stub(userDB, 'getFriendUsernames')
            .returns(Promise.resolve(['b', 'c']));
        friendlist.getFriendUsernames('a', (res) => {
            assert(_.isEqual(res, ['b', 'c']), 'response does not match expected friend list');
            sinon.assert.calledOnce(getFriendUsernames);
            done();
        });
    });
});