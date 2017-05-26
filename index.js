console.log("Hello");

var mongoose = require('./server/mongoose/index');

var entry = mongoose.createNewEntry('Bob', 'London');

console.log(entry.doSomething());