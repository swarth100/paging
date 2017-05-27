var mongooseUser = require('./server/mongoose/user');
var mongooseEntry = require('./server/mongoose/entry');

var user = mongooseUser.createNewUser('Anne', 'EXAMPLE@example.com', '123456', 'anne_1');

var savePromise = mongooseUser.saveUser(user);
savePromise
    .then(function (user) {
        console.log(user.debugPrinting());
    })
    .catch(function (err) {
        console.log('Error occurred while calling save');
    });
