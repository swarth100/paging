var mongoose = require('mongoose');

/* Connect to mongoDB entry database */

var Schema = mongoose.Schema;
var entryDBName = '/entries';
mongoose.Promise = global.Promise;
var entryDB = mongoose.createConnection('mongodb://cloud-vm-45-124.doc.ic.ac.uk:27017' + entryDBName);

// TODO: Add validation

/* Handling connection errors */
var db = mongoose.connection;
entryDB.on('error', console.error.bind(console, 'Cannot connect to entryDB:'));
entryDB.once('open', function() {
    console.log('Entry DB Active');
});

// Initialise the exported modules
var exports = module.exports = {};

var entrySchema = new Schema({
    id : {
        type : Number,
        unique : true,
        required : true
    },
    avgtime : {
        type : Number,
        required : true
    },
    feedbackcount : {
        type : Number,
        required : true,
        default : 1
    },
    latitude : {
        type : Number,
        required : true
    },
    longitude : {
        type : Number,
        required : true
    }
});

/* Helper methods on entrySchema */
entrySchema.methods.debugPrinting = function() {
    return 'name: ' + this.name + ', city: ' + this.city;
};

var Entry = entryDB.model('Entry', entrySchema);

/* Creates and returns a new database entry */
exports.createNewEntry = function (a, b) {
    return new Entry({
        name : a,
        city : b
    });
};

/* Saves a new database entry */

