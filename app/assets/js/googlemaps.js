function searchAroundLocation(location, cb) {

    let googleMapsClient = require('@google/maps').createClient({
        key: 'AIzaSyCAYorWuqzvRAPmNRs8C95Smp7hhdATzc8',
    });

    let query = {
        location: location,
        radius: 2000,
        type: 'museum',
    };

    googleMapsClient.placesRadar(query, function (err, response) {
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

