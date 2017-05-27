/* EXAMPLES for mongoose modules */

/* ------------------------------------------------------------------------------------------------------------------ */
/* location.js -- general*/

/* Require the module */
var mongooseLocation = require('./server/mongoose/location');

/* Create a new location */
var location = mongooseLocation.createNewLocation(0, 120, 100, 100);

/* Print the fields of the newly created location */
console.log(location.id);
console.log(location.latitude);
console.log(location.longitude);

/* Apply functions to the newly created location */
console.log(location.debugPrinting());

/* ------------------------------------------------------------------------------------------------------------------ */
/* location.js -- mongooseLocation.saveLocation */

/* Save the location to the database */
var savePromise = mongooseLocation.saveLocation(location);
savePromise
    .then(function (location) {
        console.log(location.debugPrinting());
    })
    .catch(function (err) {
        console.log('Error occurred while saving to the database');
    });

/* ------------------------------------------------------------------------------------------------------------------ */
/* location.js -- mongooseLocation.find */

/* Retrieve 1 location from the database */
var findPromise1 = mongooseLocation.find({id : 0});
findPromise1
    .then(function (location) {
        console.log(location.debugPrinting());
    })
    .catch(function (err) {
        console.log('No element in the database meets the search criteria');
    });

/* Retrieve 1 location from the database with multiple search criteria */
var findPromise2 = mongooseLocation.find({latitude : 100, longitude : 100});
findPromise2
    .then(function (location) {
        console.log(location.debugPrinting());
    })
    .catch(function (err) {
        console.log('No element in the database meets the search criteria');
    });

/* ------------------------------------------------------------------------------------------------------------------ */
/* location.js -- mongooseLocation.findMultiple */

/* Retrieve multiple locations from the database with multiple search criteria */
var findPromise3 = mongooseLocation.findMultiple({latitude : 100, longitude : 100});
findPromise3
    .then(function (locations) {
        for (var i = 0; i < locations.length; i++) {
            console.log(locations[i].debugPrinting());
        }
    })
    .catch(function (err) {
        console.log('No element in the database meets the search criteria');
    });

/* Retrieve multiple locations from the database with multiple search criteria. Throws error */
var findPromise4 = mongooseLocation.findMultiple({latitude : 100, longitude : 100});
findPromise4
    .then(function (locations) {
        for (var i = 0; i < locations.length; i++) {
            console.log(locations[i].debugPrinting());
        }
    })
    .catch(function (err) {
        console.log('No element in the database meets the search criteria');
    });

/* ------------------------------------------------------------------------------------------------------------------ */
/* location.js -- mongooseLocation.removeLocation */

/* Remove the first entry from the database matching the search criteria */
var removePromise1 = mongooseLocation.removeLocation({id : 0});
removePromise1
    .then(function () {
        console.log('Location removed');
    })
    .catch(function (err) {
        console.log('No element in the database meets the deletion criteria');
    });

/* ------------------------------------------------------------------------------------------------------------------ */
/* location.js -- mongooseLocation.removeMultiple */

/* Removes all entries from the database matching the search criteria */
var removePromise2 = mongooseLocation.removeMultiple({latitude : 100});
removePromise2
    .then(function () {
        console.log('Locations removed');
    })
    .catch(function (err) {
        console.log('No element in the database meets the deletion criteria');
    });

/* Clears the database */
var removePromise3 = mongooseLocation.removeMultiple({});
removePromise3
    .then(function () {
        console.log('Database cleared');
    })
    .catch(function (err) {
        console.log('No element in the database meets the deletion criteria');
    });