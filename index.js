console.log("Hello");

var mongooseUser = require('./server/mongoose/user');
/* var mongooseEntry = require('./server/mongoose/entry'); */

var user = mongooseUser.createNewUser('Anne', 'EXAMPLE@example.com', '98765');

console.log(user.debugPrinting());
console.log(user.name);
console.log(user.email);

user.saveUser();