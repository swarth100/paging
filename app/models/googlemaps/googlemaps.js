let mongooseLocation = require('../mongoose/location');
let avgTimes = require('./average-times');

/* Given a location JSON and a callback function,
 * Performs a radar search via the Google API around the given location.
 * On return calls the callback function. */
function searchAroundLocation(queryData, cb) {
    let googleMapsClient = require('@google/maps').createClient({
        key: 'AIzaSyCAYorWuqzvRAPmNRs8C95Smp7hhdATzc8',
    });

    let query = extractQueryData(queryData);

    /* Place the radar and return the result to the callback function */
    googleMapsClient.placesRadar(query, function(err, response) {
        if (err) {
            console.log(err);
        } else {
            // Location can be found in
            // response.json.result[index].geometry.location.{lat/lng};

            let results = response.json.results;
            let randomPlaces = chooseRandomPlaces(results);

            let convertedPlaces = convertFormatOfPlaces(randomPlaces, query.type);

            findInDatabase(convertedPlaces, cb);
        }
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

    for (let i = 0; i < loopCeiling; i++) {
        let randomIndex = Math.floor(Math.random() * (results.length - 1));
        let randomElementArray = results.splice(randomIndex, 1);
        randomPlaces.push(randomElementArray[0]);
    }

    return randomPlaces;
}

function convertFormatOfPlaces(randomPlaces, type) {
    let convertedPlaces = [];

    for (let i = 0; i < randomPlaces.length; i++) {
        convertedPlaces.push(convertFormat(randomPlaces[i], type));
    }

    return convertedPlaces;
}

function extractQueryData(queryData) {
    return {
        location: JSON.parse(queryData.location),
        radius: queryData.radius,
        type: queryData.type,
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
                    cb(finalPlaces);
                }
            })
            .catch(function(err) {
                console.log();
                console.log(err);
                console.log(i);
                console.log();
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
                cb(finalPlaces);
            }
        })
        .catch(function(err) {
            // console.log(randomPlace);
            console.log('Something has gone horribly wrong');
        });
}

module.exports = {
    searchAroundLocation,
    cleanDatabase,
    convertFormat,
    chooseRandomPlaces,
    convertFormatOfPlaces,
    extractQueryData,
};

