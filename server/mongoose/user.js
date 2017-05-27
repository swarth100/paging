/* EXAMPLE USER CODE

var mongooseUser = require('./server/mongoose/user');

// Create a new user with the following fields //
var user = mongooseUser.createNewUser('Anne', 'EXAMPLE@example.com', '12345', '1234');

// Fields of the user can be accessed directly //
console.log(user.debugPrinting());
console.log(user.name);
console.log(user.email);

// Save the user to the database. Returns a Promise to handle success/failure //
var promise = user.saveUser();

// promise.then() for success
// promise.then.catch() for failure
promise
    .then(function (user) {
        console.log(user.name);
        console.log('Promise saved with success');
    })
    .catch(function (err) {
        console.log('Promise returned an error');
    });

// Users can also be saved without accessing promises
var user2 = mongooseUser.createNewUser('Bobby', 'EXAMPLE@example.com', 'abcdef', 'admin');
user2.saveUser();
*/

/* ------------------------------------------------------------------------------------------------------------------ */

var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

/* Connect to mongoDB users database */

var Schema = mongoose.Schema;
var userDBName = '/users';
mongoose.Promise = global.Promise;
var userDB = mongoose.createConnection('mongodb://cloud-vm-45-124.doc.ic.ac.uk:27017' + userDBName);
// var userDB = mongoose.createConnection('mongodb://localhost:27017' + userDBName);

// TODO: Add validation

/* Handling connection errors */

userDB.on('error', console.error.bind(console, 'Cannot connect to userDB:'));
userDB.once('open', function() {
    console.log('User DB Active');
});

/* ------------------------------------------------------------------------------------------------------------------ */
/* Initialise the exported modules */

var exports = module.exports = {};

/* Setters for the fields */

function toLower (v) {
    return v.toLowerCase();
}

var userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type : String ,
        unique : true,
        required : true
    },
    email: {
        type: String,
        set: toLower
    },
    password: {
        type: String,
        required: true
    },
    time: {
        type: Date
    }
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
    return 'name: ' + this.name + ', email: ' + this.email + ', password: ' + this.password;
};

/* Saves the current User onto the DB
 * Parameters:
 *   none
 * Returns:
 *   none */
userSchema.methods.saveUser = function () {
    return this.save(function (err) {
        if (err) console.log('Error while saving.');
        else console.log('Success while saving.');
    });
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

var User = userDB.model('User', userSchema);

/* Creates and returns a new database entry
* Parameters:
*   n = name
*   e = email
*   p = password
* Returns:
*   new User instance */
exports.createNewUser = function (n, e, p, u) {
    return new User({
        name : n,
        email : e,
        password : p,
        username: u
    });
};

exports.userModel = User;

