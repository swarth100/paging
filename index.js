var mongooseUser = require('./server/mongoose/user');
var mongooseEntry = require('./server/mongoose/entry');

var user = mongooseUser.createNewUser('Anne', 'EXAMPLE@example.com', '12345', 'unique 7');

var promise = user.saveUser();

promise
    .then(function (user) {
    console.log(user.time);
    console.log('Promise saved with success');
})
    .catch(function (err) {
    console.log('Promise returned an error');
});
