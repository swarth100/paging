// TODO: Add description

/* ------------------------------------------------------------------------------------------------------------------ */

var mongoose = require('mongoose');
var helper = require('./mongoose');

var uniqueValidator = require('mongoose-unique-validator');

/* Connect to mongoDB location database */

var Schema = mongoose.Schema;
var locationsDBName = '/locations';
mongoose.Promise = global.Promise;
var locationsDB = mongoose.createConnection('mongodb://cloud-vm-45-124.doc.ic.ac.uk:27017' + locationsDBName);

// TODO: Add validation

/* Handling connection errors */
locationsDB.on('error', console.error.bind(console, 'Cannot connect to entryDB:'));
locationsDB.once('open', function() {
    console.log('Locations DB Active');
});

/* Initialise the exported modules */
var exports = module.exports = {};

var locationsSchema = new Schema({
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

/* Plugin that validates unique entries */
locationsSchema.plugin(uniqueValidator);

/* Helper methods on entrySchema */
locationsSchema.methods.debugPrinting = function() {
    return 'id: ' + this.id + ', latitude: ' + this.latitude + ', longitude: ' + this.longitude;
};

/* Pre save function [AUTORUN]
 * Used to initialise fields upon saving
 * */
locationsSchema.pre('save', function(next) {
    this.time = Date.now();

    // TODO: Handle checks before invoking next
    // Next can be invoked with an error to make it cascade through
    // i.e. new Error('something went wrong')
    next();
});

/* ------------------------------------------------------------------------------------------------------------------ */

var Location = locationsDB.model('Location', locationsSchema);

/* Creates and returns a new database entry
 * Parameters:
 *   a = id
 *   b = avgtime
 *   c = latitude
 *   d = longitude
 * Returns:
 *   new Location instance */
exports.createNewLocation = function (a, b, c, d) {
    return new Location({
        id : a,
        avgtime : b,
        latitude : c,
        longitude : d
    });
};

/* Saves the current Location onto the DB
 * Parameters:
 *   user
 * Returns:
 *   Promise */
exports.saveLocation = function (loc) {
    return helper.saveHelper(loc);
};

/* Retrieves one Location from the DB
 * Parameters:
 *   Search parameters : { id : 34 }
 * Returns:
 *   Promise */
exports.find = function (p) {
    return helper.findHelper(Location, p);
};

/* Retrieves multiple Locations from the DB
 * Parameters:
 *   Search parameters : { id : 34 }
 * Returns:
 *   Promise */
exports.findMultiple = function (p) {
    return helper.findMultipleHelper(Location, p);
};

/* Removes a single Location from the DB
 * Parameters:
 *   Search parameters : { id : 34 }
 * Returns:
 *   Promise */
exports.removeLocation = function (p) {
    return helper.removeElem(Location, p);
};

/* Removes multiple Locations from the DB
 * Parameters:
 *   Search parameters : { id : 34 }
 * Returns:
 *   Promise */
exports.removeMultiple = function (p) {
    return helper.removeMultipleHelper(Location, p);
};

/* Export the User model */
exports.locationModel = Location;

