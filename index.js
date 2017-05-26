console.log("Hello");

var mongooseEntry = require('./server/mongoose/entry');
var mongooseUser = require('./server/mongoose/user');

var user = mongooseUser.createNewUser('Bob', 'EXAMPLE@example.com', '1234');

console.log(user.debugPrinting());
console.log(user.name);
console.log(user.email);