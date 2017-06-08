/*
 * postLocation controller for the googleMaps module.
 * Handles communication between client sided rendering and server sided
 * location analysis
 */

app.controller('appCtrl', function($scope, $http, $sessionStorage, $localStorage, $routeParams, $filter, socket) {
    /* -----------------------------------------------------------------------*/

    /* Initialise fields used by the controller */
    $scope.types = $sessionStorage.types;
    $scope.appSearch = $sessionStorage.queryData;
    $scope.roomID = $routeParams.room;
    $scope.newSession = true;

    let geocoder = new google.maps.Geocoder();

    $scope.toggleSelected = ((index) => {
        $scope.types[index].isSelected = !$scope.types[index].isSelected;
        $sessionStorage.types = $scope.types;
    });

    /* -----------------------------------------------------------------------*/
    /* getLocation monster function */

    /* Generalised getLocation function for A GIVE USER
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

    /* -----------------------------------------------------------------------*/
    /* Broadcast information to socket.io room */

    /* Private controller function
     * Broadcasts the user data (username, location and radius) to the socket's room */
    let broadcastUserData = function() {
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

    let broadcastFieldsData = function() {
        console.log('Gonna broadcast types');

        console.log($sessionStorage.types);

        /* Broadcast location to all socket listeners */
        socket.emit('options', {
            'types': angular.toJson($sessionStorage.types),
            'duration': $sessionStorage.queryData.duration,
            'date': $sessionStorage.queryData.datetime,
        });
    };

    /* -----------------------------------------------------------------------*/
    /* Helper functions for update/refresh listeners */

    /* Redefine socket fields for updatingLocation */

    /* Socket update helper function */
    let socketUpdate = function(room) {
        $scope.getLocation(function(location) {
            $scope.initMap(location, room);
        });
    };

    let socketRefresh = function(room) {
        console.log('Socket Refresh');

        if (!room.duration) {
            console.log('top');
            broadcastFieldsData();
        } else {
            console.log('bot');
            $sessionStorage.queryData.duration = room.duration;
            $sessionStorage.queryData.datetime = room.date;
            $sessionStorage.types = room.types;

            $scope.appSearch = $sessionStorage.queryData;

            $scope.$apply();

            /* ADD TYPE REFRESHING */
        }
    };

    /* -----------------------------------------------------------------------*/
    /* Socket.io LISTENERS */

    /* DO NOT
     * UNDER ANY CIRCUMSTANCE
     * NOT EVEN IF DRUNK
     * EVER
     * REMOVE
     * THIS
     * FUNCTION
     * It removes and re-adds the update listener. It just works, OKAY? Now go back to work. */
    socket.removeAllListeners('update', function() {
        socket.once('update', socketUpdate);
    });

    socket.removeAllListeners('refresh', function() {
        socket.once('refresh', socketRefresh);
    });

    socket.on('joinSuccess', function() {
        console.log('Join Success');

        if (!$sessionStorage.queryData) {
            $sessionStorage.queryData = {
                location: '',
                radius: 1000,
            };
        }

        broadcastUserData();
    });

    /* -----------------------------------------------------------------------*/
    /* Socket.io helper wrappers */

    /* Joins a room upon entry.
     * Room name is given by the roomID in $scope */
    $scope.joinRoom = function() {
        /* Upon entry, join the correspondent room. */
        socket.join($scope.roomID);
    };

    /* Handles clicking on the submit button
     * Submission also occurs via pressing enter */
    $scope.submitLocation = () => {
        broadcastUserData();
    };

    /* Handles clicking on the submit button
     * Submission also occurs via pressing enter */
    $scope.submitFields = () => {
        broadcastFieldsData();
    };

    /* Button on-click method
    * Queries a search request to the backend */
    $scope.performSearch = () => {
        socket.emit('search', {});
    };

    /* -----------------------------------------------------------------------*/
    /* Functions to handle input/refreshing of input */

    /* Handles ... clicking? */
    $scope.handleClick = () => {
        $sessionStorage.queryData = $scope.appSearch;
    };

    /* -----------------------------------------------------------------------*/
    /* Functions called upon entry */

    $scope.joinRoom();

    /* -----------------------------------------------------------------------*/
    /* Map rendering functions with helpers */

    /* Initialise the client-sided rendering of the map */
    $scope.initMap = function(location, room) {
         document.getElementById('map').style.visibility = 'visible';

         /* Initialise the map via the Google API */
         let map = createMap(location);

         let users = room.users;

         socketRefresh(room);

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

        if (users.length === 1 && $scope.newSession) {
            $scope.newSession = false;
            $scope.performSearch();
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