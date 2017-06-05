/* postLocation controller for the googleMaps module
 * Handles communication between client sided rendering and server sided location analysis */
app.controller('postLocation', function($scope, $http, $sessionStorage) {
    /* Post requests for googlemaps go to the following URL */
    let url = '/googlemaps';

    /* DO NOT use firefox browser.
     * Geolocalisation seems to not be supported :confused: */
    let displayMap = function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(postFields);
        } else {
            /* Muhahahaha someone used Firefox */
            // console.log('GeoLoc not supported by browser');
            geocoder.geocode();
        }
    };

    displayMap();

    $scope.$on('submit', displayMap);

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

        /* Initialise the radius */
        let radius = new google.maps.Circle({
            strokeColor: '#FF0000 ',
            strokeOpacity: 0.1,
            strokeWeight: 1,
            fillColor: '#FF0000 ',
            fillOpacity: 0.1,
            map: map,
            center: location,
            radius: $scope.appSearch.radius,
        });

        /* Responses, returned by the googlemaps.js (assets/js) are packaged as follow:
         * response.json.result[index].geometry.location.{lat/lng}.
         * This code iterates through all returned positions, setting them up on the map */
        for (let i = 0; i < results.length; i++) {
            let infowindow = new google.maps.InfoWindow({
                content: '<p>Name: ' + results[i].name + '</p>' +
                    '<p>Average time spent: ' +
                    results[i].avgtime.toString() + ' minutes.</p>',
            });

            let marker = new google.maps.Marker({
                position: results[i].location,
                map: map,
                icon: {
                    path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                    scale: 3,
                },
            });

            marker.addListener('mouseover', function() {
                infowindow.open(map, marker);
            });

            marker.addListener('mouseout', function() {
                infowindow.close(map, marker);
            });
        }
    }

    function postFields(position) {
        /* Initialise the location JSON */
        let location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
        };

        let fields = JSON.stringify({
            location: JSON.stringify(location),
            datetime: $sessionStorage.queryData.datetime,
            avgtime: $sessionStorage.queryData.duration,
            radius: $sessionStorage.queryData.radius,
            type: $sessionStorage.queryData.type,
        });

        postThePackage(location, fields);
    }

    function postThePackage(location, fields) {
        /* Angular HTTP post
         * Given a URL and a JSON (location), issues a post request on the given URL.
         * Returns a Promise, thus the .then() function */
        $http.post(url, fields)
            .then(function(response) {
                /* Data is packaged into a nasty JSON format.
                 * To access it first one must retrieve the *.data part to distinguish from header */
                initMap(location, response.data);
            }, function(response) {
                console.log('Failure when accessing googleMaps');
            });
    }
});

app.controller('appController', function($scope, $sessionStorage) {
    $scope.appSearch = $sessionStorage.queryData;
    $scope.handleClick = () => {
        $sessionStorage.queryData = $scope.appSearch;
    };
    $scope.submitFields = () => {
        $scope.$broadcast('submit');
    };
});