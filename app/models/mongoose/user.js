// TODO: Add description

/* ------------------------------------------------------------------------------------------------------------------ */

let mongoose = require('mongoose');
let helper = require('./mongoose');
const co = require('co');
const _ = require('underscore');

/* Load the database address from the config file
 * Removesthe double quotation mark using replace function
 */
let config = require('config');
let dbConfig = JSON.stringify(config.get('dbConfig').host).replace(/\"/g, '');

let uniqueValidator = require('mongoose-unique-validator');

/* Connect to mongoDB users database */

let Schema = mongoose.Schema;
let userDBName = '/users';
mongoose.Promise = global.Promise;
let userDB = mongoose.createConnection(dbConfig + userDBName);

// TODO: Add validation

/* Handling connection errors */

userDB.on('error', console.error.bind(console, 'Cannot connect to userDB:'));
userDB.once('open', function() {
    console.log('Users DB Active');
});

/* ------------------------------------------------------------------------------------------------------------------ */

/* Setters for the fields */

function toLower(v) {
    return v.toLowerCase();
}

let userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        unique: true,
        required: true,
    },
    email: {
        type: String,
        set: toLower,
    },
    password: {
        type: String,
        required: true,
    },
    time: {
        type: Date,
    },
    friends: [{type: Schema.ObjectId, ref: 'User'}],
    friendRequests: [{type: Schema.ObjectId, ref: 'User'}],
});

/* Plugin that validates unique entries */
userSchema.plugin(uniqueValidator);

/* Helper methods on the userSchema */

/* Prints the fields of a User
* Parameters:
*   none
* Returns:
*   none */
userSchema.methods.debugPrinting = function() {
    return 'name: ' + this.name + ', email: ' + this.email + ', password: ' + this.password +
        ', time: ' + this.time + ', username ' + this.username + ', friends ' + this.friends;
};

/* Pre save function [AUTORUN]
 * Used to initialise fields upon saving
 * */
userSchema.pre('save', function(next) {
    this.time = Date.now();

    // TODO: Handle checks before invoking next
    // Next can be invoked with an error to make it cascade through
    // i.e. new Error('something went wrong')
    next();
});

/* ------------------------------------------------------------------------------------------------------------------ */

let User = userDB.model('User', userSchema);

/* Creates and returns a new database entry
* Parameters:
*   n = name
*   e = email
*   p = password
* Returns:
*   new User instance */
exports.createNewUser = function(n, e, p, u) {
    return new User({
        name: n,
        email: e,
        password: p,
        username: u,
    });
};

/* Saves the current User onto the DB
 * Parameters:
 *   user
 * Returns:
 *   Promise */
exports.saveUser = function(user) {
    return helper.saveHelper(user);
};

/* Retrieves one User from the DB
 * Parameters:
 *   Search parameters : { name : 'Anne' }
 * Returns:
 *   Promise */
exports.find = function(p) {
    return helper.findHelper(User, p);
};

/* Retrieves multiple Users from the DB
 * Parameters:
 *   Search parameters : { name : 'Anne' }
 * Returns:
 *   Promise */
exports.findMultiple = function(p) {
    return helper.findMultipleHelper(User, p);
};

/* Removes a single User from the DB
 * Parameters:
 *   Search parameters : { name : 'Anne' }
 * Returns:
 *   Promise */
exports.removeUser = function(p) {
    return helper.removeElem(User, p);
};

/* Removes multiple Users from the DB
 * Parameters:
 *   Search parameters : { name : 'Anne' }
 * Returns:
 *   Promise */
exports.removeMultiple = function(p) {
    return helper.removeMultipleHelper(User, p);
};

/* send friend request to the friend */
exports.addFriends = co.wrap(function* (username, friendUsername) {
    if (username === friendUsername) {
        return (false, 'username friend username is equal');
    }

    let u = User.findOne({username: username}).exec();
    let f = User.findOne({username: friendUsername}).exec();
    /* waits for the promise to be resolved */
    [u, f] = yield [u, f];

    let isAlreadyFriend = u.friends.some(function(friend) {
        return friend.equals(f._id);
    });
    let isAlreadySentFriendReq = f.friendRequests.some(function(req) {
        return req.equals(u._id);
    });
    if (isAlreadyFriend) {
        return (false, 'already friends');
    }
    if (isAlreadySentFriendReq) {
        return (false, 'already sent friend request');
    }
    User.update({_id: f._id}, {$addToSet: {friendRequests: u._id}}).exec();
    return (true, 'success');
});

/* user accepts friend request from friend */
exports.acceptFriendReq = co.wrap(function* (username, friendUsername) {
    if (username === friendUsername) {
        return (false, 'username friend username is equal');
    }

    let u = User.findOne({username: username}).exec();
    let f = User.findOne({username: friendUsername}).exec();
    /* waits for the promise to be resolved */
    [u, f] = yield [u, f];

    let isAlreadyFriend = u.friends.some(function(friend) {
        return friend.equals(f._id);
    });

    let haveFriendReq = u.friendRequests.some(function(req) {
        return req.equals(f._id);
    });

    if (isAlreadyFriend) {
        return (false, 'already friends');
    }

    if (haveFriendReq) {
        return (false, 'friend request not found');
    }

    u.friendRequests.pull({_id: f._id});
    User.update({_id: u._id}, {$addToSet: {friends: f._id}}).exec();
    User.update({_id: f._id}, {$addToSet: {friends: u._id}}).exec();
    return (true, 'success');
});

exports.getFriendUsernames = co.wrap(function* (username) {
    let u = User.findOne({username: username}).exec();
    u = yield u;
    let friends = [];
    u.friends.forEach((e) => {
        friends.push(User.findOne({_id: e}).exec());
    });
    friends = yield friends;
    let friendUsernames = friends.map((e) => {
        return e.username;
    });
    return friendUsernames;
});
/* Export the User model *
exports.userModel = User;
*/
