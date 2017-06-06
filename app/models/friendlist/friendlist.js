const userDB = require('../mongoose/user');
const co = require('co');
module.exports = {
    addFriend: co.wrap(function* (username, friendUsername, callback) {
        try {
            let [res, msg] = yield userDB.addFriends(username, friendUsername);
            callback(res, msg);
        } catch (err) {
            /* something went very wrong */
            callback(false, 'Failed to add friend: ' + err);
        }
    }),
    acceptFriendReq: co.wrap(function* (username, friendUsername, callback) {
        try {
            let [res, msg] = yield userDB.acceptFriendReq(username, friendUsername);
            callback(res, msg);
        } catch (err) {
            /* something went very wrong */
            callback(false, 'Failed to accept friend request: ' + err);
        }
    }),
    getFriendUsernames: co.wrap(function* (username, callback) {
        try {
            let res = yield userDB.getFriendUsernames(username);
            callback(res);
        } catch (err) {
            /* something went very wrong */
            console.log(err);
        }
    }),
};
