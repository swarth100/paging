let mongooseLocation = require('../mongoose/location');
let avgTimes = require('./average-times');

let googleMapsClient;
let location;
let radius;

/* Given a location JSON and a callback function,
 * Performs a radar search via the Google API around the given location.
 * On return calls the callback function. */
function searchAroundLocation(queryData, cb) {
    googleMapsClient = require('@google/maps').createClient({
        key: 'AIzaSyCAYorWuqzvRAPmNRs8C95Smp7hhdATzc8',
        Promise: Promise,
    });

    let query = extractQueryData(queryData);

    /* Place the radar and return the result to the callback function */
    googleMapsClient.placesNearby(query).asPromise()
        .then(function(response) {
            let results = response.json.results;

            let distances = findDistances(results);

            distances.then(function(response) {
                let prunedResults = pruneResults(results, response);

                let randomPlaces = chooseRandomPlaces(prunedResults);

                let convertedPlaces = convertFormatOfPlaces(randomPlaces, queryData.type);

                findInDatabase(convertedPlaces, cb);
            });
        })
        .catch(function(error) {
            console.log(error);
        });
}

function cleanDatabase(cleanFunction) {
    let cleanDatabase = cleanFunction();
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
    let latitude = searchResult.geometry.location.lat;
    let longitude = searchResult.geometry.location.lng;

    return mongooseLocation.createNewLocation(id, avgtime, latitude, longitude);
}

const numberOfResults = 5;

/*
 * Chooses random places from the results returned by Google.
 * Returns them formatted in a way that can be used by the database.
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
 * Tries to locate the chosen random places in the database. Ends up
 * returning the results to the user.
 */
function findInDatabase(randomPlaces, cb) {
    let promises = randomPlaces.map(function(entry) {
        return mongooseLocation.find({id: entry.id});
    });

    let unnamedPlaces = [];

    for (let i = 0; i < randomPlaces.length; i++) {
        promises[i]
            .then(function(result) {
                unnamedPlaces.push(result);
                if (unnamedPlaces.length === randomPlaces.length) {
                    addNames(unnamedPlaces, cb);
                }
            })
            .catch(function(err) {
                saveInDatabase(unnamedPlaces, randomPlaces, randomPlaces[i], cb);
            });
    }

    if (!randomPlaces.length) {
        cb({});
    }
}

/*
 * If a location is not found in the database this function tries to insert
 * it. If the insertion fails, then something has gone horribly wrong.
 */
function saveInDatabase(unnamedPlaces, randomPlaces, randomPlace, cb) {
    let promise = mongooseLocation.saveLocation(randomPlace);

    promise
        .then(function(result) {
            unnamedPlaces.push(result);
            if (unnamedPlaces.length === randomPlaces.length) {
                addNames(unnamedPlaces, cb);
            }
        })
        .catch(function(err) {
            console.log(err);
            console.log('Something has gone horribly wrong');
        });
}

function addNames(unnamedPlaces, cb) {
    let finalPlaces = [];

    for (let i = 0; i < unnamedPlaces.length; i++) {
        let finalPlace = {
            id: unnamedPlaces[i].id,
            avgtime: unnamedPlaces[i].avgtime,
            feedbackcount: unnamedPlaces[i].feedbackcount,
            latitude: unnamedPlaces[i].latitude,
            longitude: unnamedPlaces[i].longitude,
        };

        googleMapsClient.place({placeid: finalPlace.id}).asPromise()
            .then(function(response) {
                finalPlace['name'] = response.json.result.name;
                finalPlaces.push(finalPlace);
                if (finalPlaces.length === unnamedPlaces.length) {
                    cb(finalPlaces);
                }
            })
            .catch(function(error) {
                console.log(error);
            });
    }
}

module.exports = {
    searchAroundLocation,
    cleanDatabase,
    convertFormat,
    chooseRandomPlaces,
    convertFormatOfPlaces,
    extractQueryData,
};

