let mongooseLocation = require('../mongoose/location');
let avgTimes = require('./average-times');

let googleMapsClient;
let location;
let radius;
let type;

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
    googleMapsClient.placesNearby(query, function(err, response) {
        if (err) {
            console.log(err);
        } else {
            // Location can be found in
            // response.json.result[index].geometry.location.{lat/lng};

            let results = response.json.results;

            // console.log(results);

            let prunedResults = pruneResults(results, queryData, cb);

            console.log(prunedResults);

            // let randomPlaces = chooseRandomPlaces(prunedResults);
            //
            // let convertedPlaces = convertFormatOfPlaces(randomPlaces, queryData.type);
            //
            // findInDatabase(convertedPlaces, cb);
        }
    });
}

function secondPart(prunedResults, queryData, cb) {
    console.log('In here!');
    console.log(prunedResults);

    let randomPlaces = chooseRandomPlaces(prunedResults);

    let convertedPlaces = convertFormatOfPlaces(randomPlaces, queryData.type);

    findInDatabase(convertedPlaces, cb);
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

    // let loopCeiling = Math.min(numberOfResults, results.length);
    let loopCeiling = results.length;

    console.log(loopCeiling);

    for (let i = 0; i < loopCeiling; i++) {
        let randomIndex = Math.floor(Math.random() * (results.length - 1));
        let randomElementArray = results.splice(randomIndex, 1);
        randomPlaces.push(randomElementArray[0]);
    }

    return randomPlaces;
}

function pruneResults(results, queryData, cb) {
    let prunedResults = [];

    let arrayLocation = [];

    for (let i = 0; i < results.length; i++) {
        arrayLocation.push(results[i].geometry.location);
    }

    googleMapsClient.distanceMatrix({
        origins: [location],
        destinations: arrayLocation,
    }).asPromise()
        .then(function(response) {
            // console.log(response.json.rows[0].elements[0].distance.value);
            let elements = response.json.rows[0].elements;

            for (let i = 0; i < elements.length; i++) {
                if (elements[i].distance.value <= radius) {
                    prunedResults.push(results[i]);
                }
            }

            secondPart(prunedResults, queryData, cb);
        })
        .catch(function(error) {
            console.log('Error');
            console.log(error);
        });
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
        // type: queryData.type,
        // keyword: queryData.type,
        name: queryData.type,
    };
}

/*
 * Tries to locate the chosen random places in the database. Ends up
 * returning the results to the user.
 */
function findInDatabase(randomPlaces, cb) {
    // console.log(randomPlaces);

    let promises = randomPlaces.map(function(entry) {
        return mongooseLocation.find({id: entry.id});
    });

    let finalPlaces = [];

    for (let i = 0; i < randomPlaces.length; i++) {
        promises[i]
            .then(function(result) {
                finalPlaces.push(result);
                if (finalPlaces.length === randomPlaces.length) {
                    addNames(finalPlaces, cb);
                    // cb(finalPlaces);
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
 * If a location is not found in the database this function tries to insert
 * it. If the insertion fails, then something has gone horribly wrong.
 */
function saveInDatabase(finalPlaces, randomPlaces, randomPlace, cb) {
    let promise = mongooseLocation.saveLocation(randomPlace);

    promise
        .then(function(result) {
            finalPlaces.push(result);
            if (finalPlaces.length === randomPlaces.length) {
                addNames(finalPlaces, cb);
                // cb(finalPlaces);
            }
        })
        .catch(function(err) {
            console.log(err);
            console.log('Something has gone horribly wrong');
        });
}

function addNames(finalPlaces, cb) {
    let finalFinalPlaces = [];

    for (let i = 0; i < finalPlaces.length; i++) {
        let newPlace = {
            id: finalPlaces[i].id,
            avgtime: finalPlaces[i].avgtime,
            feedbackcount: finalPlaces[i].feedbackcount,
            latitude: finalPlaces[i].latitude,
            longitude: finalPlaces[i].longitude,
        };

        googleMapsClient.place({placeid: newPlace.id}, function(err, response) {
            if (err) {
                console.log('Could not find name');
            } else {
                // console.log(response);
                newPlace['name'] = response.json.result.name;
                finalFinalPlaces.push(newPlace);
                if (finalFinalPlaces.length === finalPlaces.length) {
                    cb(finalFinalPlaces);
                }
            }
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

