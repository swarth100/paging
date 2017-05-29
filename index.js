let mongooseLocation = require('./server/mongoose/location');

/* Create a new location */
let location = mongooseLocation.createNewLocation(2, 200, 100, 100);

/* Print the fields of the newly created location */
console.log(location.id);
console.log(location.latitude);
console.log(location.longitude);

/* Apply functions to the newly created location */
console.log(location.debugPrinting());

/* Save the location to the database */
let savePromise = mongooseLocation.saveLocation(location);
savePromise
    .then(function(location) {
        console.log(location.debugPrinting());
    })
    .catch(function(err) {
        console.log('Error occurred while saving to the database');
    });

let findPromise3 = mongooseLocation.findMultiple({});
findPromise3
    .then(function(locations) {
        for (let i = 0; i < locations.length; i++) {
            console.log(locations[i].debugPrinting());
        }
    })
    .catch(function(err) {
        console.log('No element in the database meets the search criteria');
    });
