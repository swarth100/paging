var mongooseUser = require('./server/mongoose/user');
var mongooseEntry = require('./server/mongoose/entry');

var user = mongooseUser.createNewUser('Anne', 'EXAMPLE@example.com', '12345', 'unique 7');

var savePromise = user.saveUser();
savePromise
    .then(function (user) {
        console.log(user.debugPrinting());
})
    .catch(function (err) {
        console.log('Error occurred while calling save');
});

var findPromise  = user.findMultiple({name : 'Anne', email: 'example@example.com'});
findPromise
    .then(function (users) {
        for (var i = 0; i < users.length; i++) {
            console.log(users[i].debugPrinting());
        }
    })
    .catch(function (err) {
        console.log('No element in the database meets the search criteria');
    });
