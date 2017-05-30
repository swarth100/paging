/* Given a location JSON and a callback function,
 * Performs a radar search via the Google API around the given location.
 * On return calls the callback function */
function searchAroundLocation(location, cb) {
    let googleMapsClient = require('@google/maps').createClient({
        key: 'AIzaSyCAYorWuqzvRAPmNRs8C95Smp7hhdATzc8',
    });

    /* Package a JSON format query for the radar */
    let query = {
        location: location,
        radius: 2000,
        type: 'museum',
    };

    /* Place the radar and return the result to the callback function */
    googleMapsClient.placesRadar(query, function(err, response) {
        if (err) {
            console.log(err);
        } else {
            // Location can be found in
            // response.json.result[index].geometry.location.{lat/lng};
            cb(response);
        }
    });
}

module.exports = {searchAroundLocation};

