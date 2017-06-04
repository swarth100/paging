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
    getFriendUsernames: (username, callback) => {
        userDB.getFriendUsernames(username).then((res) => {
           callback(res);
        });
    },
};
