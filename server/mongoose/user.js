var mongoose = require('mongoose');

/* Connect to mongoDB entry database */

var Schema = mongoose.Schema;
var userDBName = '/users';
mongoose.Promise = global.Promise;
var userDB = mongoose.createConnection('mongodb://cloud-vm-45-124.doc.ic.ac.uk:27017' + userDBName);

// TODO: Add validation

/* Handling connection errors */

userDB.on('error', console.error.bind(console, 'connection error:'));
userDB.once('open', function() {
    console.log('User DB Used');
});

/* Initialise the exported modules */

var exports = module.exports = {};

/* Setters for the fields */

function toLower (v) {
    return v.toLowerCase();
}

var userSchema = new Schema({
    name: { type: String, required: true },
    email: {type: String, set: toLower},
    password: { type: String, required: true }
});

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
        if (err) return handleError(err);
        // Saved!
    });
}

var User = userDB.model('User', userSchema);

/* Creates and returns a new database entry
* Parameters:
*   n = name
*   e = email
*   p = password
* Returns:
*   new User instance */
exports.createNewUser = function (n, e, p) {
    return new User({
        name : n,
        email : e,
        password : p
    });
};

exports.userModel = User;

