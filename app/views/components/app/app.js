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
app.controller('postLocation', function($scope, $http, $sessionStorage, socket) {
    let geocoder = new google.maps.Geocoder();

    /*
     * DO NOT use firefox browser.
     * Geolocalisation seems to not be supported and confused:
     */
    /* TODO: Error handler is UNUSED */
    let obtainLocation = function() {
        document.getElementById('map').style.visibility = 'hidden';
        $scope.getLocation(function(location) {
            let fields = createJSON(location);

            postThePackage(location, fields);
        }, errorHandler);
    };

    obtainLocation();

    $scope.$on('submit', obtainLocation);

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
    /*
     * Angular HTTP post
     * Given a URL and a JSON (location), issues a post request on the given URL.
     * Returns a Promise, thus the .then() function
     */
    function postThePackage(location, fields) {
        console.log(fields);

        socket.emit('search', {});

        /*
        $http.post('/googlemaps', fields)
            .then(function(response) {
                $scope.initMap(location, response.data);
                $sessionStorage.googleData = response.data;

                console.log('Following is the google data which was found');
                console.log($sessionStorage.googleData);
            }, function(reason) {
                console.log('Failure when accessing googleMaps');
                console.log(reason);
            }); */
    }

    function errorHandler(error) {
        if (error.code === error.PERMISSION_DENIED) {
            alert('You will need to enable geolocation.');
        } else {
            alert('An error has occured and the programmer has been too lazy' +
                ' to inform you of the nature of the error...');
        }
    }
});

app.controller('appCtrl', function($scope, $http, $sessionStorage, $localStorage, $routeParams, socket) {
    $scope.appSearch = $sessionStorage.queryData;
    $scope.roomID = $routeParams.room;

    let geocoder = new google.maps.Geocoder();

    /* Generalised getLocation function
     * Determines, according to the current field, whether to use geolocation or parse the location field */
    $scope.getLocation = function(callback) {
        if ($sessionStorage.queryData.location === '') {
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

    /* Private controller function
     * Broadcasts the user data (username, location and radius) to the socket's room */
    broadcastUserData = function() {
        /* Broadcast location to all socket listeners */
        $scope.getLocation(function(location) {
            socket.emit('location', {
                'username': $localStorage.username,
                'lat': location.lat,
                'lng': location.lng,
                'radius': $sessionStorage.queryData.radius,
            });
        });
    };

    /* Redefine socket fields for updatingLocation */
    socket.on('update', function(room) {
        console.log(room);

        console.log('RECEIVED AN UPDATE');

        $scope.getLocation(function(location) {
            $scope.initMap(location, room);
        });
    });

    socket.on('joinSuccess', function() {
        console.log('Join Success');
        broadcastUserData();
    });

    /* Joins a room upon entry.
     * Room name is given by the roomID in $scope */
    $scope.joinRoom = function() {
        /* Upon entry, join the correspondent room. */
        socket.join($scope.roomID);
    };
    $scope.joinRoom();

    /* Handles ... clicking? */
    $scope.handleClick = () => {
        $sessionStorage.queryData = $scope.appSearch;
    };

    /* Handles clicking on the submit button
     * Submission also occurs via pressing enter */
    $scope.submitFields = () => {
        broadcastUserData();
    };

    $scope.performSearch = () => {
        $scope.$broadcast('submit');
    };

    /* Initialise the client-sided rendering of the map */
    $scope.initMap = function(location, room) {
        document.getElementById('map').style.visibility = 'visible';

        console.log('Update fields:');
        console.log(room);

        /* Initialise the map via the Google API */
        let map = createMap(location);

         let users = room.users;

         console.log(users);

         for (i = 0; i < users.length; i++) {
             let radLoc = {
                 'lat': users[i].lat,
                 'lng': users[i].lng,
             };

             /* Initialise the marker */
             let marker = markUser(radLoc, users[i], map);

             /* Initialise the radius */
             let radius = initRadius(radLoc, users[i], map);

             let userwindow = createUserWindow(users[i]);


             markerAddInfo(marker, userwindow);
         }
        /*
         * Responses, returned by the googlemaps.js are packaged
         * as follows:
         * response.json.result[index].geometry.location.{lat/lng}.
         * This code iterates through all returned positions, setting them up on
         * the map
         */
        if (room.results) {
            for (let i = 0; i < room.results.length; i++) {
                let infowindow = createInfoWindow(room.results[i]);

                let marker = markResult(room.results[i], map);

                markerAddInfo(marker, infowindow);
            }
        }
    };

    /* InitMap helper functions: */
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

    markUser = function(location, user, map) {
        return new google.maps.Marker({
            position: location,
            map: map,
            icon: {
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: 10,
                strokeWeight: 5,
                strokeColor: user.color,
            },
        });
    };

    initRadius = function(location, user, map) {
        return new google.maps.Circle({
            strokeColor: user.color,
            strokeOpacity: 0.8,
            strokeWeight: 1,
            fillColor: user.color,
            fillOpacity: 0.3,
            map: map,
            center: location,
            radius: user.radius,
        });
    };

    createInfoWindow = function(result) {
        return new google.maps.InfoWindow({
            content: '<p>Name: ' + result.name + '</p>' +
            '<p>Average time spent: ' + result.avgtime.toString() + ' minutes.</p>',
        });
    };

    createUserWindow = function(user) {
        return new google.maps.InfoWindow({
            content: '<div style=\"color: ' + user.color + '\">' + user.username + '</div>',
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

    markerAddInfo = function(marker, infowindow) {
        marker.addListener('mouseover', function() {
            infowindow.open(map, marker);
        });

        marker.addListener('mouseout', function() {
            infowindow.close(map, marker);
        });
    };
});