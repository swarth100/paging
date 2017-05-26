var mongoose = require('mongoose');

mongoose.connect('mongodb://cloud-vm-45-124.doc.ic.ac.uk:27017');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

var Schema = mongoose.Schema;

// Initialise the exported modules
var exports = module.exports = {};

var entrySchema = new Schema({
    name: String,
    city: String,
    // updated: { type: Date, default: Date.now },
    coordinates : { latitude: Number, longitude: Number}
});

// Helper methods on entrySchema
entrySchema.methods.debugPrinting = function() {
    return 'name: ' + this.name + ', city: ' + this.city;
};



var Entry = mongoose.model('Entry', entrySchema);

exports.createNewEntry = function (a, b) {
    return new Entry({
        name : a,
        city : b
    });
};

