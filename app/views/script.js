/* postLocation controller for the googleMaps module
 * Handles communication between client sided rendering and server sided location analysis */
angular.module('googleMaps', []).controller('postLocation', function($scope, $http) {
    /* Post requests for googlemaps go to the following URL */
    let url = '/googlemaps';

    /* DO NOT use firefox browser.
     * Geolocalisation seems to not be supported :/ */
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            /* Initialise the location JSON */
            let location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };

            /* Angular HTTP post
             * Given a URL and a JSON (location), issues a post request on the given URL.
             * Returns a Promise, thus the .then() function */
            $http.post(url, location)
                .then(function(response) {
                    /* Data is packaged into a nasty JSON format.
                     * To access it first one must retrieve the *.data part to distinguish from header */
                    initMap(location, response.data);
                }, function(response) {
                    console.log('Failure when accessing googleMaps');
                });
        });
    } else {
        /* Muhahahaha someone used Firefox */
        console.log('GeoLoc not supported by browser');
    }

    /* Initialise the client-sided rendering of the map */
    function initMap(location, results) {
        /* Initialise the map via the Google API */
        let map = new google.maps.Map(document.getElementById('map'), {
            center: location,
            zoom: 14,
        });

        /* Initialise the marker */
        let marker = new google.maps.Marker({
            position: location,
            map: map,
        });

        /* Responses, returned by the googlemaps.js (assets/js) are packaged as follow:
         * response.json.result[index].geometry.location.{lat/lng}.
         * This code iterates through all returned positions, setting them up on the map */
        for (let i = 0; i < results.json.results.length; i++) {
            let marker = new google.maps.Marker({
                position: results.json.results[i].geometry.location,
                map: map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                },
            });
        }
    }
});
