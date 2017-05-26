var mongoose = require('mongoose');

/* Connect to mongoDB entry database */
var userDB = '/users';
mongoose.createConnection('mongodb://cloud-vm-45-124.doc.ic.ac.uk:27017' + userDB);

// TODO: Add validation

/* Handling connection errors */
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

var Schema = mongoose.Schema;

/* Initialise the exported modules */
var exports = module.exports = {};

/* Setters for the fields */

function toLower (v) {
    return v.toLowerCase();
}

var userSchema = new Schema({
    name: String,
    email: {type: String, set: toLower},
    password: String
});

/* Helper methods on the userSchema */

/* Prints the fields of a User
* Parameters:
*   none
* Returns:
*   none*/
userSchema.methods.debugPrinting = function() {
    return 'name: ' + this.name + ', email: ' + this.email + ', password: ' + this.password;
};


var User = mongoose.model('User', userSchema);

/* Creates and returns a new database entry
* Parameters:
*   n = name
*   e = email
*   p = password
* Returns:
*   new User instance*/
exports.createNewUser = function (n, e, p) {
    return new User({
        name : n,
        email : e,
        password : p
    });
};

/* Saves a new database entry */

// TODO

