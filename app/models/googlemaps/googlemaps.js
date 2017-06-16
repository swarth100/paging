let mongooseLocation = require('../mongoose/location');
let avgTimes = require('./average-times');
let geolib = require('geolib');
const co = require('co');

let googleMapsClient = require('@google/maps').createClient({
    // key: 'AIzaSyCAYorWuqzvRAPmNRs8C95Smp7hhdATzc8',
    key: 'AIzaSyD_UOu_gSsRAFFSmEEKmR7fZqgDmvmMJIg',
    // key: 'AIzaSyDZfSnQBIu3V5N9GWbpKGtAUYmDDyxPonU',
    // key: 'AIzaSyD7c_7yNAAQc6mhE_JremnfrnUyxvFvfz4',
    Promise: Promise,
});

let location;

const numberOfResults = 5;

let users;

function temporaryFunction(room, cb) {
    /*
     * 1. Find center point.
     * 2. Find bounds.
     * 3. Do concurrent searches.
     * 4. Return results.
     */
    users = room.users;
    let tmpResults;

    /* Override the types array for the purpose of googlemaps */
    let parseTypes = function(condFunc) {
        let result = [];
        for (let i = 0; i < room.types.length; i++) {
            if (condFunc(room.types[i])) {
                result.push(room.types[i].name);
            }
        }
        return result;
    };

    tmpResults = parseTypes(function(elem) {
        return elem.isSelected;
    });

    // if (!tmpResults.length) {
    //     tmpResults = parseTypes(function(elem) {
    //         return true;
    //     });
    // }

    room.types = tmpResults;

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
    if (users.length === 1) {
        return users[0].radius;
    }

    let min = Infinity;
    users.forEach((user, index) => {
        if (min > user.radius) {
            min = user.radius;
        }
    });

    return min;
}

function pruneRenewed(results) {
    /*
     * 1. Iterate through results.
     * 2. For each check whether it is part of all user's circles.
     * 3. If true push.
     */

    let numberOfCoincidingCirlces = 1;

    let comparisonUserPoint = fromNormalToRidiculous(users[0]);
    let comparisonUserRadius = users[0].radius;

    /* Find the maximum number of coinciding circles. */
    for (let i = 1; i < users.length; i++) {
        let comparedUserPoint = fromNormalToRidiculous(users[i]);
        let comparedUserRadius = users[i].radius;

        if (geolib.getDistance(comparisonUserPoint, comparedUserPoint) < Math.abs(comparisonUserRadius + comparedUserRadius)) {
            numberOfCoincidingCirlces++;
        }
    }

    let prunedResults = [];

    for (let i = 0; i < results.length; i++) {
        // let inAll = true;
        let inHowManyCircles = 0;
        for (let j = 0; j < users.length; j++) {
            let point = fromNormalToRidiculous(results[i].location);
            let center = fromNormalToRidiculous(users[j]);
            let radius = users[j].radius;
            // if (!geolib.isPointInCircle(point, center, radius)) {
            if (geolib.isPointInCircle(point, center, radius)) {
                // inAll = false;
                /* Count how many circles is the location part of. */
                inHowManyCircles++;
            }
        }

        // if (inAll) {
        /* If the location is in as many circles as the maximum number of
         coinciding circles, then return the location. */
        if (inHowManyCircles === numberOfCoincidingCirlces) {
            // console.log('inHowManyCircles ' + inHowManyCircles);
            // console.log('numberOfCoincidingCirlces ' + numberOfCoincidingCirlces);

            prunedResults.push(results[i]);
        }
    }

    return prunedResults;
}

function fromNormalToRidiculous(location) {
    return {
        latitude: location.lat,
        longitude: location.lng,
    };
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
                finalPlaces = [].concat.apply([], responses);
            }

            getTravelTime(queryData.location, finalPlaces[0], (res) => {
            });

            /* Set the users field for each location to empty */
            /* TODO: Refactor so that users are sent around searches */
            for (let i = 0; i < finalPlaces.length; i ++) {
                /*
                 * The conversion to JSON has been moved to the second .then
                 * in queryOnce, because the type was required to be added
                 * to the location.
                 */
                // finalPlaces[i] = finalPlaces[i].toJSON();
                finalPlaces[i].users = [];
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

    let type;

    return googleMapsClient.placesNearby(query).asPromise()
        .then(function(value) {
            results = value.json.results;

            // When looking for the type replace whitespaces with underscores.
            type = query.name.split(' ').join('_');
            let convertedPlaces = convertFormatOfPlaces(results, type);

            /* Limit the actual number of results used */
            let prunedResults = pruneRenewed(convertedPlaces);

            /* Pick a max amount of places from the pruned results */
            let randomPlaces = chooseRandomPlaces(prunedResults);

            return Promise.all(randomPlaces.map(function(randomPlace) {
                return findInDatabase(randomPlace);
            }));
        })
    .then(function(responses) {
        for (let i = 0; i < responses.length; i++) {
            responses[i] = responses[i].toJSON();
            responses[i].type = type;
        }

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
    location = queryData.location;

    let queries = [];

    for (let i = 0; i < queryData.type.length; i++) {
        queries.push({
            /* TODO: Previous version is better? */
            location: queryData.location,
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
            result['type'] = 'faceless-one';
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

const appendTravelTime = (travelTimes, dest, modes) => {
    let result = [];
    travelTimes.forEach((time, i) => {
        const res = {
            mode: modes[i],
            location: dest,
            travelTime: time.json.rows[0].elements,
        };
        result.push(res);
    });
    return result;
};

/* pass in origin as lat-lng and dest as single places object */
const getTravelTime = co.wrap(function* (origin, dest, callback) {
    /* format origin into google format, NO SPACE */
    origin = origin.lat + ',' + origin.lng;
    /* format the destination into google format, dest should be in similar format to finalPlaces */
    const destination = 'place_id:' + dest.id;
    /* these are the options avaliable for travel methods */
    const diffModes = ['driving', 'walking', 'bicycling', 'transit'];
    let results = [];
    diffModes.forEach((mode, index) => {
        results.push(googleMapsClient.distanceMatrix({
            origins: origin,
            destinations: destination,
            mode: mode,
        }).asPromise());
    });
    /* wait for promise to resolve */
    results = yield results;
    /* attach destination data to the result */
    results = appendTravelTime(results, dest, diffModes);
    callback(results);
});

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
    getTravelTime,
};

