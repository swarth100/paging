var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

/* Connect to mongoDB users database */

var Schema = mongoose.Schema;
var userDBName = '/users';
mongoose.Promise = global.Promise;
var userDB = mongoose.createConnection('mongodb://cloud-vm-45-124.doc.ic.ac.uk:27017' + userDBName);

// TODO: Add validation

/* Handling connection errors */

userDB.on('error', console.error.bind(console, 'connection error:'));
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
        required : true,
        index: true
    },
    email: {
        type: String,
        set: toLower
    },
    password: {
        type: String,
        required: true
    }
});

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
    this.save(function (err) {
        if (err) console.log('Error while saving.');
        else console.log('Success while saving.');
    });
}

/* ------------------------------------------------------------------------------------------------------------------ */

var User = userDB.model('User', userSchema);

/* Pre save function [AUTORUN] */
userSchema.pre('save', function(next) {
    // TODO: Add pre-saving function to initialise fields
    next();
});
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

