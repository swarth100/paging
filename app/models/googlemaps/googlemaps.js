let mongooseLocation = require('../mongoose/location');
let avgTimes = require('./average-times');

let googleMapsClient = require('@google/maps').createClient({
    key: 'AIzaSyCAYorWuqzvRAPmNRs8C95Smp7hhdATzc8',
    Promise: Promise,
});
let location;
let radius;

/*
 * Given a location JSON and a callback function,
 * Performs a radar search via the Google API, updates the database and
 * returns the necessary information.
 */
function searchAroundLocation(queryData, cb) {
    let query = extractQueryData(queryData);

    let results;

    googleMapsClient.placesNearby(query).asPromise()
        .then(function(response) {
            results = response.json.results;

            return findDistances(results);
        })
        .then(function(response) {
            let prunedResults = pruneResults(results, response);

            let randomPlaces = chooseRandomPlaces(prunedResults);

            let convertedPlaces = convertFormatOfPlaces(randomPlaces, queryData.type);

            findInDatabase(convertedPlaces, cb);
        })
        .catch(function(error) {
            console.log(error);
        });
}

/*
 * This function appears to be unsafe. Drop the database through mongo.
 */
function cleanDatabase(cleanFunction) {
    let cleanDatabase = cleanFunction({});
    cleanDatabase
        .then(function(resolveData) {
            console.log('Database cleared');
        })
        .catch(function(err) {
            console.log('No element in the database meets the deletion criteria');
        });
}

/*
 * Given a result returned by Google, converts it to a format usable by our
 * database.
 */
function convertFormat(searchResult, type) {
    let id = searchResult.place_id;
    let avgtime = avgTimes[type];
    let location = searchResult.geometry.location;
    let name = 'easy_to_trace_string';

    return mongooseLocation.createNewLocation(id, avgtime, location, name);
}

const numberOfResults = 5;

/*
 * Chooses random places from the results returned by Google.
 */
function chooseRandomPlaces(results) {
    let randomPlaces = [];

    let loopCeiling = Math.min(numberOfResults, results.length);
    // let loopCeiling = results.length;

    for (let i = 0; i < loopCeiling; i++) {
        let randomIndex = Math.floor(Math.random() * (results.length - 1));
        let randomElementArray = results.splice(randomIndex, 1);
        randomPlaces.push(randomElementArray[0]);
    }

    return randomPlaces;
}

/*
 * This function is not tested.
 */
function findDistances(results) {
    let arrayLocation = [];

    for (let i = 0; i < results.length; i++) {
        arrayLocation.push(results[i].geometry.location);
    }

    return googleMapsClient.distanceMatrix({
        origins: [location],
        destinations: arrayLocation,
    }).asPromise();
}

/*
 * This function is not tested.
 */
function pruneResults(results, response) {
    let elements = response.json.rows[0].elements;

    let prunedResults = [];

    for (let i = 0; i < elements.length; i++) {
        if (elements[i].distance.value <= radius) {
            prunedResults.push(results[i]);
        }
    }

    return prunedResults;
}

/*
 * Converts a list of results returned by Google to a list of results that
 * we can use in our database.
 */
function convertFormatOfPlaces(randomPlaces, type) {
    let convertedPlaces = [];

    for (let i = 0; i < randomPlaces.length; i++) {
        convertedPlaces.push(convertFormat(randomPlaces[i], type));
    }

    return convertedPlaces;
}

function extractQueryData(queryData) {
    location = JSON.parse(queryData.location);
    radius = queryData.radius;

    return {
        location: JSON.parse(queryData.location),
        radius: queryData.radius,
        name: queryData.type,
    };
}

/*
 * This function is not tested.
 */
/*
 * Tries to locate the chosen random places in the database. If a place is
 * not located it tries to save it to the database.
 */
function findInDatabase(randomPlaces, cb) {
    let promises = randomPlaces.map(function(entry) {
        return mongooseLocation.find({id: entry.id});
    });

    let finalPlaces = [];

    for (let i = 0; i < randomPlaces.length; i++) {
        promises[i]
            .then(function(result) {
                finalPlaces.push(result);
                if (finalPlaces.length === randomPlaces.length) {
                    cb(finalPlaces);
                }
            })
            .catch(function(err) {
                saveInDatabase(finalPlaces, randomPlaces, randomPlaces[i], cb);
            });
    }

    if (!randomPlaces.length) {
        cb({});
    }
}

/*
 * This function is not tested.
 */
/*
 * If a location is not found in the database this function tries to insert
 * it. If the insertion fails, then something has gone horribly wrong.
 */
function saveInDatabase(finalPlaces, randomPlaces, randomPlace, cb) {
    let promiseOfName = findName(randomPlace);

    promiseOfName.then(function(response) {
        randomPlace['name'] = response.json.result.name;
        return mongooseLocation.saveLocation(randomPlace);
    }).then(function(response) {
        finalPlaces.push(response);
        if (finalPlaces.length === randomPlaces.length) {
            cb(finalPlaces);
        }
    }).catch(function(error) {
        console.log(error);
        console.log('Something has gone horribly wrong');
    });
}

/*
 * This function is not tested.
 */
function findName(unnamedPlace) {
    return googleMapsClient.place({placeid: unnamedPlace.id}).asPromise();
}

module.exports = {
    searchAroundLocation,
    cleanDatabase,
    convertFormat,
    chooseRandomPlaces,
    convertFormatOfPlaces,
    extractQueryData,
};

