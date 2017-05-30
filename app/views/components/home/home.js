/* */

/* postLocation controller for the googleMaps module
 * Handles communication between client sided rendering and server sided location analysis */
app.controller('postLocation', function($scope, $http) {
    /* Post requests for googlemaps go to the following URL */
    let url = '/googlemaps';

    console.log('Got here');

    /* DO NOT use firefox browser.
     * Geolocalisation seems to not be supported :/ */
    $scope.$on('submit', function() {
        if (navigator.geolocation) {
            console.log('Submit pressed');
            navigator.geolocation.getCurrentPosition(postFields);
        } else {
            /* Muhahahaha someone used Firefox */
            console.log('GeoLoc not supported by browser');
        }
    });

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

    function postFields(position) {
        console.log('Post Fields called');

        /* Initialise the location JSON */
        let location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
        };

        let fields = JSON.stringify({
            location: JSON.stringify(location),
            datetime: $scope.datetime,
            avgtime: $scope.duration,
            radius: $scope.radius,
            type: 'museum',
        });

        /* Angular HTTP post
         * Given a URL and a JSON (location), issues a post request on the given URL.
         * Returns a Promise, thus the .then() function */
        $http.post(url, fields)
            .then(function(response) {
                /* Data is packaged into a nasty JSON format.
                 * To access it first one must retrieve the *.data part to distinguish from header */
                console.log('Attempting to initMap');
                initMap(location, response.data);
            }, function(response) {
                console.log('Failure when accessing googleMaps');
            });
    };
});


app.controller('mainController', function($scope, $filter) {
    $scope.location = 'Current Location';
    $scope.datetime = $filter('date')(new Date(), 'yyyy-MM-dd HH:mm');
    $scope.duration = 60;
    $scope.radius = 1000;
    $scope.submitFields = () => {
        $scope.$broadcast('submit');
    };
});

/* Issues a get request to check login credentials.
 * Accordingly redirects user to app or login screen */
app.controller('entryRedirect', function($http, $location) {
    $http.get('/users/index')
        .then(function(response) {
            /* Data is packaged into a nasty JSON format.
             * To access it first one must retrieve the *.data part to distinguish from header */
            $location.url(response.data.url);
        }, function(response) {
            console.log('Failure when accessing /users/index');
        });
});