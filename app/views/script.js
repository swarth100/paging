angular.module('googleMaps', []).controller('postLocation', function($scope, $http) {

    let url = '/googlemaps';

    console.log("Triggered");

    console.log(navigator);
    console.log(navigator.geolocation);

    /* DO NOT use firefox browser.
     * Geolocalisation seems to not be supported :/ */
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {

            console.log("Navigator?");

            let location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            console.log("Sad :(");

            $http.post(url, location)
                .then(function (response) {
                    console.log("Success?");
                }, function (response) {
                    console.log("Failure?");
                });
        });
    } else {
        console.log("GeoLoc not supported by browser");
    }
});

