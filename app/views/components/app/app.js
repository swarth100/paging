/*
 * postLocation controller for the googleMaps module.
 * Handles communication between client sided rendering and server sided
 * location analysis
 */

/*
 * postLocation controller for the googleMaps module.
 * Handles communication between client sided rendering and server sided
 * location analysis
 */
app.controller('postLocation', function($scope, $http, $sessionStorage) {
    let geocoder = new google.maps.Geocoder();

    /*
     * DO NOT use firefox browser.
     * Geolocalisation seems to not be supported and confused:
     */
    let obtainLocation = function() {
        if ($sessionStorage.queryData.location === 'Current Location') {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(postCurrentPosition, errorHandler);
            } else {
                alert('Geolocation is not supported by this browser.');
            }
        } else {
            fireGeocoder();
        }
    };

    obtainLocation();

    $scope.$on('submit', obtainLocation);

    function postCurrentPosition(position) {
        /* Initialise the location JSON */
        let location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
        };

        let fields = createJSON(location);

        postThePackage(location, fields);
    }

    function createJSON(location) {
        return JSON.stringify({
            location: JSON.stringify(location),
            datetime: $sessionStorage.queryData.datetime,
            avgtime: $sessionStorage.queryData.duration,
            radius: $sessionStorage.queryData.radius,
            type: getTypes($sessionStorage.queryData.selectedTypes),
        });
    }

    function getTypes(selections) {
        let result = [];
        console.log(selections);
        if(selections.length == 0) {
            $sessionStorage.types.forEach(function(element) {
                result.push(element.name.toLowerCase());
            }, this);
        } else {
            result = selections;
        }
        return result;
    };

    function postThePackage(location, fields) {
        /*
         * Angular HTTP post
         * Given a URL and a JSON (location), issues a post request on the given URL.
         * Returns a Promise, thus the .then() function
         */
        $http.post('/googlemaps', fields)
            .then(function(response) {
                /* Data is packaged into a nasty JSON format.
                 * To access it first one must retrieve the *.data part to distinguish from header */
                $scope.initMap(location, response.data);
                $sessionStorage.googleData = response.data;

                console.log('Following is the google data which was found');
                console.log($sessionStorage.googleData);
            }, function(reason) {
                console.log('Failure when accessing googleMaps');
                console.log(reason);
            });
    }

    function errorHandler(error) {
        if (error.code === error.PERMISSION_DENIED) {
            alert('You will need to enable geolocation.');
        } else {
            alert('An error has occured and the programmer has been too lazy' +
                ' to inform you of the nature of the error...');
        }
    }

    function fireGeocoder() {
        geocoder.geocode({'address': $sessionStorage.queryData.location},
            function(results, status) {
                if (status === 'OK') {
                    let location = results[0].geometry.location;

                    let fields = createJSON(location);

                    postThePackage(location, fields);
                } else {
                    alert('Geocode was not successful for the following' +
                        ' reason: ' + status);
                }
            });
    }
});

app.controller('appCtrl', function($scope, $http, $sessionStorage, $localStorage, $routeParams, socket) {
    $scope.appSearch = $sessionStorage.queryData;
    $scope.roomID = $routeParams.room;

    let geocoder = new google.maps.Geocoder();

    $scope.getLocation = function(callback) {
        if ($sessionStorage.queryData.location === 'Current Location') {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    let location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };

                    callback(location);
                });
            } else {
                alert('Geolocation is not supported by this browser.');
            }
        } else {
            geocoder.geocode({'address': $sessionStorage.queryData.location},
                function(results, status) {
                    if (status === 'OK') {
                        let locTmp = results[0].geometry.location;

                        let location = {
                            'lat': locTmp.lat(),
                            'lng': locTmp.lng(),
                        };

                        callback(location);
                    } else {
                        alert('Geocode was not successful for the following' +
                            ' reason: ' + status);
                    }
                });
        }
    };

    broadcastUserData = function() {
        /* Broadcast location to all socket listeners */
        $scope.getLocation(function(location) {
            socket.broadcast($scope.roomID, 'location', {
                'username': $localStorage.username,
                'latitude': location.lat,
                'longitude': location.lng,
            });
        });
    };

    /* Redefine socket fields for updatingLocation */
    socket.on('location', function(data) {
        $scope.getLocation(function(location) {
            // console.log('Got bobby here');
            // console.log($sessionStorage.googleData);
            $scope.initMap(location, $sessionStorage.googleData);
        });
    });

    $scope.joinRoom = function() {
        /* Upon entry, join the correspondent room. */
        socket.join($scope.roomID);

        broadcastUserData();
    };
    $scope.joinRoom();

    $scope.handleClick = () => {
        $sessionStorage.queryData = $scope.appSearch;
    };

    $scope.submitFields = () => {
        $scope.$broadcast('submit');

        broadcastUserData();
    };

    /* Initialise the client-sided rendering of the map */
    $scope.initMap = function(location, results) {
        /* Initialise the map via the Google API */
        let map = createMap(location);

         $http.get('/' + $scope.roomID + '/users')
             .then(function(response) {
                 let users = response.data;

                 for (i = 0; i < users.length; i++) {
                     let radLoc = {
                         'lat': users[i].latitude,
                         'lng': users[i].longitude,
                     };

                     /* Initialise the marker */
                     let marker = markUser(radLoc, map);

                     /* Initialise the radius */
                     let radius = initRadius(radLoc, map);
                 }
             },
             function(response) {
                console.log('Failure when accessing users/roomID');
         });

        /*
         * Responses, returned by the googlemaps.js are packaged
         * as follows:
         * response.json.result[index].geometry.location.{lat/lng}.
         * This code iterates through all returned positions, setting them up on
         * the map
         */
        if (results) {
            for (let i = 0; i < results.length; i++) {
                let infowindow = createInfoWindow(results[i]);

                let marker = markResult(results[i], map);

                marker.addListener('mouseover', function() {
                    infowindow.open(map, marker);
                });

                marker.addListener('mouseout', function() {
                    infowindow.close(map, marker);
                });
            }
        }
    };

    createMap = function(location) {
        let zoom = 14;

        /* TODO: Fix centering upon refresh */

        if ($scope.map) {
            zoom = $scope.map.getZoom();
        }

        $scope.map = new google.maps.Map(document.getElementById('map'), {
            center: location,
            zoom: zoom,
        });

        return $scope.map;
    };

    markUser = function(location, map) {
        return new google.maps.Marker({
            position: location,
            map: map,
        });
    };

    initRadius = function(location, map) {
        return new google.maps.Circle({
            strokeColor: '#FF0000 ',
            strokeOpacity: 0.1,
            strokeWeight: 1,
            fillColor: '#FF0000 ',
            fillOpacity: 0.1,
            map: map,
            center: location,
            radius: $scope.appSearch.radius,
        });
    };

    createInfoWindow = function(result) {
        return new google.maps.InfoWindow({
            content: '<p>Name: ' + result.name + '</p>' +
            '<p>Average time spent: ' + result.avgtime.toString() + ' minutes.</p>',
        });
    };

    markResult = function(result, map) {
        return new google.maps.Marker({
            position: result.location,
            map: map,
            icon: {
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: 3,
            },
        });
    };
});