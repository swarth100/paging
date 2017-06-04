let _ = require('underscore');
/* Add friend to the friendlist. Callback should accept boolean */
const userDB = require('../mongoose/user');

module.exports = {
    addFriend: (username, friendUsername, callback) => {
        userDB.addFriends(username, friendUsername).then((res, msg) => {
            callback(res, msg);
        });
    },
    acceptFriendReq: (username, friendUsername, callback) => {
        userDB.acceptFriendReq(username, friendUsername).then((res, msg) => {
            callback(res, msg);
        });
    },
};
