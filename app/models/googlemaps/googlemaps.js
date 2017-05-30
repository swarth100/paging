let mongooseLocation = require('../mongoose/location');

/* Given a location JSON and a callback function,
 * Performs a radar search via the Google API around the given location.
 * On return calls the callback function */
function searchAroundLocation(queryData, cb) {
    let googleMapsClient = require('@google/maps').createClient({
        key: 'AIzaSyCAYorWuqzvRAPmNRs8C95Smp7hhdATzc8',
    });

    const numberOfResults = 5;

    let query = queryData;

    /* Place the radar and return the result to the callback function */
    googleMapsClient.placesRadar(query, function (err, response) {
        if (err) {
            console.log(err);
        } else {
            // Location can be found in
            // response.json.result[index].geometry.location.{lat/lng};
            let arrayResults = response.json.results;
            let randomResults = [];

            for (let i = 0; i < numberOfResults; i++) {
                let randomIndex = Math.floor(Math.random() * arrayResults.length);
                randomResults.push(convertFormat(arrayResults[i]));
                arrayResults.splice(randomIndex, 1);
            }

            let promises = randomResults.map(function (entry) {
                return mongooseLocation.find({id: entry.id});
            });

            let finalResults = [];

            for (let i = 0; i < randomResults.length; i++) {
                promises[i]
                    .then(function (result) {
                        finalResults.push(result);
                        if (finalResults.length === randomResults.length) {
                            console.log(finalResults);
                            cb(finalResults);
                        }
                    })
                    .catch(function (err) {
                        let r = randomResults[i];
                        r.avgtime = 2.5;
                        let location = mongooseLocation.createNewLocation(r.id, r.avgtime, r.lat, r.lng);
                        let promise = mongooseLocation.saveLocation(location);
                        promise
                            .then(function (result) {
                                console.log('Saving entry to database');
                                finalResults.push(result);
                                if (finalResults.length === randomResults.length - 1) {
                                    console.log(finalResults);
                                    cb(finalResults);
                                }
                            })
                            .catch(function (err) {
                                console.log('Give up');
                            });
                    });
            }
        }
    })
}

const avgTimes = {
    museum: 2.5,
};

function convertFormat(searchResult) {
    return convertedResult = {
        id: searchResult.place_id,
        avgtime: undefined,
        feedbackcount:undefined,
        lat: searchResult.geometry.location.lat,
        lng: searchResult.geometry.location.lng,
    };
}

module.exports = {searchAroundLocation};

