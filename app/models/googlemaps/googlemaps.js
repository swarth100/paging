let mongooseLocation = require('../mongoose/location');
let avgTimes = require('./average-times');

let googleMapsClient;
let location;
let radius;

/*
 * Given a location JSON and a callback function,
 * Performs a radar search via the Google API, updates the database and
 * returns the necessary information.
 */
function searchAroundLocation(queryData, cb) {
    googleMapsClient = require('@google/maps').createClient({
        key: 'AIzaSyCAYorWuqzvRAPmNRs8C95Smp7hhdATzc8',
        Promise: Promise,
    });

    let query = extractQueryData(queryData);

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
    let name = 'random string';

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

    let unnamedPlaces = [];

    for (let i = 0; i < randomPlaces.length; i++) {
        promises[i]
            .then(function(result) {
                unnamedPlaces.push(result);
                if (unnamedPlaces.length === randomPlaces.length) {
                    // addNames(unnamedPlaces, cb);
                    cb(unnamedPlaces);
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
 * This function is not tested.
 */
/*
 * If a location is not found in the database this function tries to insert
 * it. If the insertion fails, then something has gone horribly wrong.
 */
// function saveInDatabase(unnamedPlaces, randomPlaces, randomPlace, cb) {
//     let promise = mongooseLocation.saveLocation(randomPlace);
//
//     promise
//         .then(function(result) {
//             unnamedPlaces.push(result);
//             if (unnamedPlaces.length === randomPlaces.length) {
//                 addNames(unnamedPlaces, cb);
//             }
//         })
//         .catch(function(err) {
//             console.log(err);
//             console.log('Something has gone horribly wrong');
//         });
// }

function saveInDatabase(unnamedPlaces, randomPlaces, randomPlace, cb) {
    console.log('in here');

    let promiseOfName = findName(randomPlace);

    promiseOfName.then(function(response) {
        let name = response.json.result.name;

        randomPlace['name'] = name;

        console.log(randomPlace);

        let promiseOfSave = mongooseLocation.saveLocation(randomPlace);

        promiseOfSave.then(function(response) {
            unnamedPlaces.push(response);
            if (unnamedPlaces.length === randomPlaces.length) {
                cb(unnamedPlaces);
            }
        });
    })
        .catch(function(error) {
            console.log(error);
            console.log('Something has gone horribly wrong');
        });
}

function findName(unnamedPlace) {
    return googleMapsClient.place({placeid: unnamedPlace.id}).asPromise();
}

/*
 * This function is not tested.
 */
/*
 * Given a list of unnamed places, this function will try to find their
 * respective names and return all information to the user.
 */
function addNames(unnamedPlaces, cb) {
    let finalPlaces = [];

    for (let i = 0; i < unnamedPlaces.length; i++) {
        let finalPlace = {
            id: unnamedPlaces[i].id,
            avgtime: unnamedPlaces[i].avgtime,
            feedbackcount: unnamedPlaces[i].feedbackcount,
            // latitude: unnamedPlaces[i].latitude,
            // longitude: unnamedPlaces[i].longitude,
            location: unnamedPlaces[i].location,
        };

        googleMapsClient.place({placeid: finalPlace.id}).asPromise()
            .then(function(response) {
                finalPlace['name'] = response.json.result.name;
                finalPlaces.push(finalPlace);
                if (finalPlaces.length === unnamedPlaces.length) {
                    console.log(finalPlaces);
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

