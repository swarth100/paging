let mongooseLocation = require('../mongoose/location');
let avgTimes = require('./average-times');
let geolib = require('geolib');
const co = require('co');

let googleMapsClient = require('@google/maps').createClient({
    // key: 'AIzaSyCAYorWuqzvRAPmNRs8C95Smp7hhdATzc8',
    // key: 'AIzaSyD_UOu_gSsRAFFSmEEKmR7fZqgDmvmMJIg',
    // key: 'AIzaSyDZfSnQBIu3V5N9GWbpKGtAUYmDDyxPonU',
    key: 'AIzaSyD7c_7yNAAQc6mhE_JremnfrnUyxvFvfz4',
    Promise: Promise,
});

let location;

let numberOfResults = 5;

let users;

/* Added to enable location pinning. */
let pinnedList;

function temporaryFunction(room, cb) {
    /* Reset the numberOfResults and the pinnedList on each search. */
    pinnedList = [];

    /* Added to enable location pinning. */
    for (let i = 0; i < room.results.length; i++) {
        if (room.results[i].pinned) {
            pinnedList.push(room.results[i]);
        }
    }

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

    room.types = tmpResults;

    let allUserLocations = getAllLocations(room.users);

    let center = geolib.getCenter(allUserLocations);

    let radius = determineSearchRadiusRenewed(center, allUserLocations, users);

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

function determineSearchRadiusRenewed(center, allUserLocations, users) {
    /* Both center and allUserLocations should be in the format used by
     geolib. */

    /* Used to store the distances between the center and allUserLocations. */
    let distances = [];

    for (let i = 0; i < allUserLocations.length; i++) {
        distances.push(geolib.getDistance(center, allUserLocations[i]));
    }

    let radius = 0;

    for (let i = 0; i < distances.length; i++) {
        let concideredRadius = distances[i] + users[i].radius;

        if (concideredRadius > radius) {
            radius = concideredRadius;
        }
    }

    return radius;
}

function pruneRenewed(results) {
    /*
     * 1. Find the maximum number of coinciding circles.
     * 2. For each result check whether it falls in as many circles as the
     * maximum number of coinciding circles.
     * 3. If true push.
     */

    /* Added to enable location pinning.
     * This is used to remove results from the search that are already
     * pinned. */
    for (let i = 0; i < results.length; i++) {
        for (let j = 0; j < pinnedList.length; j++) {
            if (results[i].id === pinnedList[j].id) {
                results.splice(i, 1);
            }
        }
    }

    let overallNumberOfCoincidingCircles = 0;

    for (let j = 0; j < users.length; j++) {
        let numberOfCoincidingCircles = 1;

        let comparisonUserPoint = fromNormalToRidiculous(users[j]);
        let comparisonUserRadius = users[j].radius;

        /* Find the maximum number of coinciding circles. */
        for (let i = 0; i < users.length; i++) {
            if (users[j] === users[i]) {
                continue;
            }

            let comparedUserPoint = fromNormalToRidiculous(users[i]);
            let comparedUserRadius = users[i].radius;

            if (geolib.getDistance(comparisonUserPoint, comparedUserPoint) < Math.abs(comparisonUserRadius + comparedUserRadius)) {
                numberOfCoincidingCircles++;
            }
        }

        if (numberOfCoincidingCircles > overallNumberOfCoincidingCircles) {
            overallNumberOfCoincidingCircles = numberOfCoincidingCircles;
        }
    }

    let prunedResults = [];

    for (let i = 0; i < results.length; i++) {
        let inHowManyCircles = 0;
        for (let j = 0; j < users.length; j++) {
            let point = fromNormalToRidiculous(results[i].location);
            let center = fromNormalToRidiculous(users[j]);
            let radius = users[j].radius;

            if (geolib.isPointInCircle(point, center, radius)) {
                /* Count how many circles is the location part of. */
                inHowManyCircles++;
            }
        }

        /* If the location is in as many circles as the maximum number of
         coinciding circles, then return the location. */
        if (inHowManyCircles === overallNumberOfCoincidingCircles) {
            prunedResults.push(results[i]);
        }
    }

    return prunedResults;
}

/* Used to convert from Google's location format to Geolib's location format. */
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
        promises.push(queryOnce(queries[i]));
    }

    Promise.all(promises)
        .then(function(responses) {
            let finalPlaces = [];

            if (responses.length > 0) {
                // Flatten the array of arrays into an array of results.
                finalPlaces = [].concat.apply([], responses);
            }

            /* Added to enable location pinning. */
            finalPlaces = finalPlaces.concat(pinnedList);

            /* Set the users field for each location to empty */
            /* TODO: Refactor so that users are sent around searches */
            for (let i = 0; i < finalPlaces.length; i ++) {
                /*
                 * The conversion to JSON has been moved to the second .then
                 * in queryOnce, because the type was required to be added
                 * to the location.
                 */
                if (finalPlaces[i].users === undefined) {
                    finalPlaces[i].users = [];
                }

                /* Added to enable location pinning. */
                if (finalPlaces[i].pinned === undefined) {
                    finalPlaces[i].pinned = false;
                }
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
function queryOnce(query) {
    let results;

    let type;

    return googleMapsClient.placesRadar(query).asPromise()
        .then(function(value) {
            results = value.json.results;

            /* When looking for the type replace whitespaces with
             underscores. */
            type = query.name.split(' ').join('_');
            let convertedPlaces = convertFormatOfPlaces(results, type);

            /* Limit the actual number of results used */
            let prunedResults = pruneRenewed(convertedPlaces);

            /* Pick a max amount of places from the pruned results */
            let randomPlaces = chooseRandomPlaces(prunedResults, type);

            return Promise.all(randomPlaces.map(function(randomPlace) {
                return findInDatabase(randomPlace);
            }));
        })
    .then(function(responses) {
        for (let i = 0; i < responses.length; i++) {
            responses[i] = responses[i].toJSON();
            responses[i].type = type;
        }

        /* Return an always resolving promise. */
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

/*
 * Chooses random places from the results returned by Google.
 */
function chooseRandomPlaces(results, type) {
    let randomPlaces = [];

    /* Added to enable location pinning.
     * Decide how many results need to be chosen based on how many results
     * of the same type have already been pinned. */
    for (let i = 0; i < pinnedList.length; i++) {
        if (pinnedList[i].type === type) {
            numberOfResults--;
        }
    }

     let loopCeiling = Math.min(numberOfResults, results.length);

    /* Restore the original value of numberOfResults */
    numberOfResults = 5;

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
    chooseRandomPlaces,
    convertFormat,
    convertFormatOfPlaces,
    findInDatabase,
    saveInDatabase,
    findName,
    getTravelTime,
};

