let mongooseLocation = require('../mongoose/location');
let avgTimes = require('./average-times');
let geolib = require('geolib');

let googleMapsClient = require('@google/maps').createClient({
    // key: 'AIzaSyCAYorWuqzvRAPmNRs8C95Smp7hhdATzc8',
    // key: 'AIzaSyD_UOu_gSsRAFFSmEEKmR7fZqgDmvmMJIg',
    key: 'AIzaSyDZfSnQBIu3V5N9GWbpKGtAUYmDDyxPonU',
    // key: 'AIzaSyD7c_7yNAAQc6mhE_JremnfrnUyxvFvfz4',
    Promise: Promise,
});

let location;

const numberOfResults = 5;

// Dummy Data
let dummyUser1 = {
    // Evelyn
    location: {lat: 51.4887063, lng: -0.18198},
    username: 'dummyUser1',
    radius: 2000,
};

let dummyUser2 = {
    // Imperial
    location: {lat: 51.4988633, lng: -0.176642},
    username: 'dummyUser2',
    radius: 2000,
};

let dummyUser3 = {
    // Kensington
    location: {lat: 51.4941387, lng: -0.1760984},
    username: 'dummyUser3',
    radius: 2000,
};

/*
let room = {
    id: 'dummyRoom',
    users: [dummyUser1, dummyUser2, dummyUser3],
    types: ['Art Gallery', 'Museum', 'Cafe'],
}; */

function temporaryFunction(room, cb) {
    /*
     * 1. Find center point.
     * 2. Find bounds.
     * 3. Do concurrent searches.
     * 4. Return results.
     */

    // console.log(room);

    let allUserLocations = getAllLocations(room.users);

    let center = geolib.getCenter(allUserLocations);

    let limits = geolib.getBounds(allUserLocations);

    let radius = determineSearchRadius(limits);

    let queryData = exportQueryData(center, radius, room.types);

    searchAroundLocation(queryData, cb);
}

function getAllLocations(users) {
    let locations = [];

    for (let i = 0; i < users.length; i++) {
        let temporaryLocation = users[i];
        let convertedLocation = {
            latitude: temporaryLocation.lat,
            longitude: temporaryLocation.lng,
        };

        locations.push(convertedLocation);
    }

    return locations;
}

function determineSearchRadius(limits) {
    let difference = geolib.getDistance({
        latitude: limits.minLat,
        longitude: limits.minLng,
    }, {
        latitude: limits.maxLat,
        longitude: limits.maxLng,
    });

    return 1000;

    // return difference / 2;
}

/*
 * Given a location JSON and a callback function,
 * Performs a radar search via the Google API, updates the database and
 * returns the necessary information.
 */
function searchAroundLocation(queryData, cb) {
    let queries = extractQueryData(queryData);

    let promises = [];

    for (let i = 0; i < queries.length; i++) {
        promises.push(queryOnce(queries[i], queryData.radius));
    }

    Promise.all(promises)
        .then(function(responses) {
            let finalPlaces = [];

            if (responses.length > 0) {
                // Flatten the array of arrays into an array of results.
                finalPlaces = [].concat.apply(...responses);
            }
            cb(finalPlaces);
        })
        .catch(function(error) {
            console.log(error);
        });
}

/*
 * This function is not tested.
 */
function queryOnce(query, radius) {
    let results;

    return googleMapsClient.placesNearby(query).asPromise()
        .then(function(value) {
            results = value.json.results;

            /* Find the distances for all of the given results's coordinates */
            let response = findDistances(results);

            /* Limit the actual number of results used */
            let prunedResults = pruneResults(results, response, radius);

            /* Pick a max amount of places from the pruned results */
            let randomPlaces = chooseRandomPlaces(prunedResults);

            // When looking for the type replace whitespaces with underscores.
            let type = query.name.split(' ').join('_');
            let convertedPlaces = convertFormatOfPlaces(randomPlaces, type);

            return Promise.all(convertedPlaces.map(function(convertedPlace) {
                return findInDatabase(convertedPlace);
            }));
        })
        .then(function(responses) {
            // Return an always resolving promise.
            return Promise.resolve(responses);
        })
        .catch(function(error) {
            console.log(error);
        });
}

function exportQueryData(location, radius, types) {
    return {
        location: {
            lat: location.latitude,
            lng: location.longitude,
        },
        radius: radius,
        type: types,
    };
}

function extractQueryData(queryData) {
    /* TODO: Previous version is better? */
    location = queryData.location;
    // location = JSON.parse(queryData.location);

    let queries = [];

    for (let i = 0; i < queryData.type.length; i++) {
        queries.push({
            /* TODO: Previous version is better? */
            location: queryData.location, // JSON.parse(queryData.location),
            radius: queryData.radius,
            name: queryData.type[i].toLowerCase(),
        });
    }

    return queries;
}

/*
 * This function is not tested.
 */
function findDistances(results) {
    let arrayLocation = [];

    /* Use geolib to determine meter distances given coordinates */
    for (let i = 0; i < results.length; i++) {
        arrayLocation.push(
            geolib.getDistance(
                {
                    'latitude': results[i].geometry.location.lat,
                    'longitude': results[i].geometry.location.lng,
                },
                {
                    'latitude': location.lat,
                    'longitude': location.lng,
                }
            )

        );
    }

    return arrayLocation;
}

function pruneResults(results, response, radius) {
    let prunedResults = [];

    for (let i = 0; i < response.length; i++) {
        if (response[i] <= radius) {
            prunedResults.push(results[i]);
        }
    }

    return prunedResults;
}

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

/*
 * This function is not tested.
 */
/*
 * Tries to locate the chosen random places in the database. If a place is
 * not located it tries to save it to the database.
 */
function findInDatabase(randomPlace) {
    let promiseOfLocation = mongooseLocation.find({id: randomPlace.id});

    return promiseOfLocation
        .then(function(result) {
            return result;
        })
        .catch(function(err) {
            return saveInDatabase(randomPlace);
        });
}

/*
 * This function is not tested.
 */
function saveInDatabase(randomPlace) {
    let promiseOfName = findName(randomPlace);

    return promiseOfName.then(function(response) {
        randomPlace['name'] = response.json.result.name;
        return mongooseLocation.saveLocation(randomPlace);
    });
}

/*
 * This function is not tested.
 */
function findName(unnamedPlace) {
    return googleMapsClient.place({placeid: unnamedPlace.id}).asPromise();
}

module.exports = {
    temporaryFunction,
    searchAroundLocation,
    extractQueryData,
    findDistances,
    pruneResults,
    chooseRandomPlaces,
    convertFormat,
    convertFormatOfPlaces,
    findInDatabase,
    saveInDatabase,
    findName,
};

