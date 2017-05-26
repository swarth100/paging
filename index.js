console.log("Hello");

var mongooseUser = require('./server/mongoose/user');
var mongooseEntry = require('./server/mongoose/entry');

var user = mongooseUser.createNewUser('Anne 10', 'EXAMPLE@example.com', '12345', 'admin 10000000');

console.log(user.debugPrinting());
console.log(user.name);
console.log(user.email);

user.saveUser();

var user2 = mongooseUser.createNewUser('Anne 4', 'EXAMPLE@example.com', '12345', 'admin');
user2.saveUser();
