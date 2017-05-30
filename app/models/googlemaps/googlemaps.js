let mongooseLocation = require('../mongoose/location');

/* Given a location JSON and a callback function,
 * Performs a radar search via the Google API around the given location.
 * On return calls the callback function. */
function searchAroundLocation(queryData, cb) {
    let googleMapsClient = require('@google/maps').createClient({
        key: 'AIzaSyCAYorWuqzvRAPmNRs8C95Smp7hhdATzc8',
    });

    let temporaryQueryData = {
        location: JSON.parse(queryData.location),
        radius: queryData.radius,
        type: queryData.type,
    };

    /* Place the radar and return the result to the callback function */
    googleMapsClient.placesRadar(temporaryQueryData, function(err, response) {
        if (err) {
            console.log(err);
        } else {
            // Location can be found in
            // response.json.result[index].geometry.location.{lat/lng};

            let randomPlaces = chooseRandomPlaces(response, temporaryQueryData.type);

            findInDatabase(randomPlaces, cb);
        }
    });
}

const avgTimes = {
    amusement_park: 180,
    aquarium: 100,
    art_gallery: 90,
    bakery: 20,
    bar: 60,
    book_store: 15,
    bowling_alley: 90,
    cafe: 40,
    casino: 120,
    gym: 60,
    library: 45,
    meal_takeaway: 15,
    movie_theater: 150,
    museum: 150,
    night_club: 240,
    park: 90,
    restaurant: 90,
    shopping_mall: 60,
    spa: 60,
    stadium: 120,
    zoo: 180,
};

const numberOfResults = 5;

function cleanLocationDatabase() {
    let cleanDatabase = mongooseLocation.removeMultiple({});
    cleanDatabase
        .then(function() {
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

/*
 * Chooses random places from the results returned by Google.
 * Returns them formatted in a way that can be used by the database.
 */
function chooseRandomPlaces(response, type) {
    let places = response.json.results;
    let randomPlaces = [];

    for (let i = 0; i < numberOfResults; i++) {
        let randomIndex = Math.floor(Math.random() * places.length);
        randomPlaces.push(convertFormat(places[i], type));
        places.splice(randomIndex, 1);
    }

    return randomPlaces;
}

/*
 * Tries to locate the chosen random places in the database. Ends up
 * returning the results to the user.
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
            console.log(randomPlace);
            console.log('Something has gone horribly wrong');
        });
}

module.exports = {searchAroundLocation};

