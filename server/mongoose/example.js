/* EXAMPLES for mongoose modules */

/* ------------------------------------------------------------------------------------------------------------------ */
/* user.js -- general*/

/* Require the module */
var mongooseUser = require('./server/mongoose/user');

/* Create a new user */
var user = mongooseUser.createNewUser('Anne', 'EXAMPLE@example.com', '12345', 'anne123');

/* Print the fields of the newly created user */
console.log(user.name);
console.log(user.email);

/* Apply functions to the newly created user */
console.log(user.debugPrinting());

/* ------------------------------------------------------------------------------------------------------------------ */
/* user.js -- mongooseUser.saveUser */

/* Save the user to the database */
var savePromise = mongooseUser.saveUser(user);
savePromise
    .then(function (user) {
        console.log(user.debugPrinting());
    })
    .catch(function (err) {
        console.log('Error occurred while calling save');
    });

/* ------------------------------------------------------------------------------------------------------------------ */
/* user.js -- mongooseUser.find */

/* Retrieve 1 user from the database */
var findPromise1 = mongooseUser.find({name : 'Anne'});
findPromise1
    .then(function (user) {
        console.log(user.debugPrinting());
    })
    .catch(function (err) {
        console.log('No element in the database meets the search criteria');
    });

/* Retrieve 1 user from the database with multiple search criteria */
var findPromise2 = mongooseUser.find({name : 'Anne', email: 'example@example.com'});
findPromise2
    .then(function (user) {
        console.log(user.debugPrinting());
    })
    .catch(function (err) {
        console.log('No element in the database meets the search criteria');
    });

/* ------------------------------------------------------------------------------------------------------------------ */
/* user.js -- mongooseUser.findMultiple */

/* Retrieve multiple users from the database with multiple search criteria */
var findPromise3 = mongooseUser.findMultiple({name : 'Anne', email: 'example@example.com'});
findPromise3
    .then(function (users) {
        for (var i = 0; i < users.length; i++) {
            console.log(users[i].debugPrinting());
        }
    })
    .catch(function (err) {
        console.log('No element in the database meets the search criteria');
    });

/* Retrieve multiple users from the database with multiple search criteria. Throws error */
var findPromise4 = mongooseUser.findMultiple({name : 'Anne', email: 'invalid@example.com'});
findPromise4
    .then(function (users) {
        for (var i = 0; i < users.length; i++) {
            console.log(users[i].debugPrinting());
        }
    })
    .catch(function (err) {
        console.log('No element in the database meets the search criteria');
    });

/* ------------------------------------------------------------------------------------------------------------------ */
/* user.js -- mongooseUser.removeUser */

/* Remove the first entry from the database matching the search criteria */
var removePromise1 = mongooseUser.removeUser({name : 'Anne'});
removePromise
    .then(function () {
        console.log('User removed');
    })
    .catch(function (err) {
        console.log('No element in the database meets the deletion criteria');
    });

/* ------------------------------------------------------------------------------------------------------------------ */
/* user.js -- mongooseUser.removeMultiple */

/* Removes all entries from the database matching the search criteria */
var removePromise2 = mongooseUser.removeMultiple({name : 'Bobby'});
removePromise2
    .then(function () {
        console.log('Users removed');
    })
    .catch(function (err) {
        console.log('No element in the database meets the deletion criteria');
    });

/* Clears the database */
var removePromise3 = mongooseUser.removeMultiple({});
removePromise3
    .then(function () {
        console.log('Database cleared');
    })
    .catch(function (err) {
        console.log('No element in the database meets the deletion criteria');
    });