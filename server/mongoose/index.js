var mongoose = require('mongoose');

mongoose.connect('mongodb://cloud-vm-45-124.doc.ic.ac.uk:27017');

var Schema = mongoose.Schema;

var exports = module.exports = {};

var entrySchema = new Schema({
    name: String,
    city: String,
    updated: { type: Date, default: Date.now },
    coordinates : { latitude: Number, longitude: Number}
});

// Helper methods on entrySchema
entrySchema.methods.doSomething = function() {

    return this.name;
}



var Entry = mongoose.model('Entry', entrySchema);

exports.createNewEntry = function (a, b) {
    var newEntry = new Entry({
        name : a,
        city : b
    });

    return newEntry;
};

