/*
 * postLocation controller for the googleMaps module.
 * Handles communication between client sided rendering and server sided
 * location analysis
 */

app.controller('appCtrl', function($scope, $http, $localStorage, $routeParams, $filter, $uibModal, $location, Data, socket) {
    /* -----------------------------------------------------------------------*/
    console.log(location.href);
    /* Initialise fields used by the controller */
    $scope.types = Data.types;
    $scope.appSearch = Data.query;
    $scope.roomID = $routeParams.room;
    $scope.newSession = true;
    $scope.issueSearch = false;

    let geocoder = new google.maps.Geocoder();

    $scope.toggleSelected = ((index) => {
        $scope.types[index].isSelected = !$scope.types[index].isSelected;
        Data.types = $scope.types;
    });

    /* -----------------------------------------------------------------------*/
    /* getLocation monster function */

    /* Generalised getLocation function for A GIVE USER
     * Determines, according to the current field, whether to use geolocation or parse the location field */
    $scope.getLocation = function(callback) {
        if (Data.query.location === '') {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    let location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };

                    callback(location);
                }, errorHandler);
            } else {
                alert('Geolocation is not supported by this browser.');
            }
        } else {
            geocoder.geocode({'address': Data.query.location},
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

    function errorHandler(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                alert('If you want to use your current location you will' +
                    ' need to share your current location.');
                break;
            default:
                alert('Unhandled error.');
                break;
        }
    }

    /* -----------------------------------------------------------------------*/
    /* Broadcast information to socket.io room */

    /* Private controller function
     * Broadcasts the user data (username, location and radius) to the socket's room */
    let broadcastUserData = function() {
        /* Broadcast location to all socket listeners */
        $scope.getLocation(function(location) {
            socket.emit('location', {
                'username': Data.user.username,
                'lat': location.lat,
                'lng': location.lng,
                'radius': Data.query.radius,
            });
        });
    };

    let broadcastFieldsData = function() {
        console.log('Gonna broadcast types');

       let toSend = {
            'types': angular.toJson(Data.types),
            'duration': Data.query.duration,
            'date': Data.query.datetime,
        };
        console.log(toSend);
        /* Broadcast location to all socket listeners */
        socket.emit('options', toSend);
    };

    /* -----------------------------------------------------------------------*/
    /* Helper functions for update/refresh listeners */

    /* Redefine socket fields for updatingLocation */

    /* Socket update helper function */
    let socketUpdate = function(room) {
        $scope.issueSearch = false;
        $scope.users = room.users;
        if (Data.user.username !== '') {
            let i = $scope.users.reduce(( cur, val, index ) => {
                if (val.username === Data.user.username && cur === -1 ) {
                    return index;
                }
                return cur;
            }, -1 );
            if (i === -1) {
                /* The user does not exist in the room (kicked out) */
                $location.url('/home');
            }
        }
        $scope.$apply();
        $scope.getLocation(function(location) {
            $scope.initMap(location, room);
        });
    };

    let socketRefresh = function(room) {
        if (!room.duration) {
            broadcastFieldsData();
        } else {
            Data.query.duration = room.duration;
            Data.query.datetime = room.date;

            /* TYPE REFRESHING */
            for (let i = 0; i < room.types.length; i++) {
                $scope.types[i].isSelected = room.types[i].isSelected;
            }
            console.log($scope.types);
            console.log(Data.types);

            $scope.appSearch = Data.query;
            Data.types = $scope.types;

            $scope.$apply();
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

    socket.on('joinSuccess', function(number) {
        console.log('Join Success');

        if (!$localStorage.username) {
            Data.user.username = 'Guest-' + number;
        }

        broadcastUserData();
    });

    /*
     * Note to self: This should work if one uses only socket.on. However,
     * it does not. It would appear that the event is only triggered once.
     * This behaviour leads me to believe that the listener is either
     * destroyed or it is made to only listen once.
     */
    socket.removeAllListeners('evolve', function() {
        socket.once('evolve', swapMarkers);
    });

    let indexOflastSelectedMarker = undefined;

    function swapMarkers(index) {
        let newMarker = resultMarkers[index];

        newMarker.setIcon(createBlueIcon());

        if (indexOflastSelectedMarker !== undefined) {
            let oldMarker = resultMarkers[indexOflastSelectedMarker];

            oldMarker.setIcon(createRedIcon());
        }

        indexOflastSelectedMarker = index;
    }

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
        if (!$scope.issueSearch) {
            $scope.issueSearch = true;
            socket.emit('search', {});
        }
    };

    $scope.deleteUser = (index) => {
        console.log($scope.users[index].username);
        socket.emit('deleteUser', $scope.users[index].username);
    };

    /* -----------------------------------------------------------------------*/
    /* Functions called upon entry */

    $scope.joinRoom();

    /* -----------------------------------------------------------------------*/
    /* Map rendering functions with helpers */

    let resultMarkers = [];

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

             let userBubble = createUserInfoBubble(users[i]);

             markerAddInfo(map, marker, userBubble);
         }

        /*
         * Responses, returned by the googlemaps.js are packaged
         * as follows:
         * response.json.result[index].geometry.location.{lat/lng}.
         * This code iterates through all returned positions, setting them up on
         * the map
         */
        if (room.results) {
            /* Reset the resultMarkers array when new results are received. */
            resultMarkers = [];

            for (let i = 0; i < room.results.length; i++) {
                let infoBubble = createLocationInfoBubble(room.results[i]);

                let marker = markResult(room.results[i], map);

                resultMarkers.push(marker);

                markerAddInfo(map, marker, infoBubble);
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
        let icon = {
            path: 'M365.027,44.5c-30-29.667-66.333-44.5-109-44.5s-79,14.833-109,44.5s-45,65.5-45,107.5c0,25.333,12.833,67.667,38.5,127c25.667,59.334,51.333,113.334,77,162s38.5,72.334,38.5,71c4-7.334,9.5-17.334,16.5-30s19.333-36.5,37-71.5s33.167-67.166,46.5-96.5c13.334-29.332,25.667-59.667,37-91s17-55,17-71C410.027,110,395.027,74.167,365.027,44.5z M289.027,184c-9.333,9.333-20.5,14-33.5,14c-13,0-24.167-4.667-33.5-14s-14-20.5-14-33.5s4.667-24,14-33c9.333-9,20.5-13.5,33.5-13.5c13,0,24.167,4.5,33.5,13.5s14,20,14,33S298.36,174.667,289.027,184z',
            fillColor: user.color,
            fillOpacity: 1,
            anchor: new google.maps.Point(250, 400),
            strokeWeight: 1,
            scale: .12,
        };

        return new google.maps.Marker({
            position: location,
            map: map,
            icon: icon,
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

    createDefaultInfoBubble = function() {
        return new InfoBubble({
            content: '',
            shadowStyle: 1,
            padding: 0,
            backgroundColor: 'rgb(221, 218, 215)',
            borderRadius: 0,
            arrowSize: 10,
            borderWidth: 1,
            borderColor: 'rgb(193, 173, 150)',
            disableAutoPan: true,
            hideCloseButton: true,
            disableAnimation: true,
            arrowPosition: 30,
            backgroundClassName: 'infoBubbleText',
            arrowStyle: 2,
        });
    };

    createLocationInfoBubble = function(result) {
        let infoBubble = createDefaultInfoBubble();

        infoBubble.content = '<div class="infoBubbleLocation">Name: ' + result.name + '<br> Average time spent: ' + result.avgtime.toString() + ' minutes.</div>';

        return infoBubble;
    };

    createUserInfoBubble = function(user) {
        let infoBubble = createDefaultInfoBubble();

        infoBubble.content = '<div class="infoBubbleUser" style=\"color: ' + user.color + '\">' + user.username + '</div>';

        return infoBubble;
    };

    markResult = function(result, map) {
        let icon = createRedIcon();

        return new google.maps.Marker({
            position: result.location,
            map: map,
            icon: icon,
        });
    };

    let pathToIcon = 'M238,0c-40,0-74,13.833-102,41.5S94,102.334,94,141c0,23.333,13.333,65.333,40,126s48,106,64,136s29.333,54.667,40,74c10.667-19.333,24-44,40-74s37.5-75.333,64.5-136S383,164.333,383,141c0-38.667-14.167-71.833-42.5-99.5S278,0,238,0L238,0z';

    function createRedIcon() {
        return {
            path: pathToIcon,
            fillColor: '#ff3700',
            fillOpacity: 1,
            anchor: new google.maps.Point(250, 400),
            strokeWeight: 1,
            scale: .08,
        };
    }

    function createBlueIcon() {
        return {
            path: pathToIcon,
            fillColor: '#0000ff',
            fillOpacity: 1,
            anchor: new google.maps.Point(250, 400),
            strokeWeight: 1,
            scale: .08,
        };
    }

    markerAddInfo = function(map, marker, infoBubble) {
        google.maps.event.addListener(marker, 'click', function() {
            if (!infoBubble.opened) {
                infoBubble.opened = true;
                infoBubble.open(map, marker);
            } else if (infoBubble.opened) {
                infoBubble.opened = false;
                infoBubble.close();
            }

            changeMarkerToBlue(marker);
        });

        google.maps.event.addListener(marker, 'mouseover', function() {
            infoBubble.open(map, marker);
        });

        google.maps.event.addListener(marker, 'mouseout', function() {
            if (!infoBubble.opened) {
                infoBubble.close();
            }
        });
    };

    function changeMarkerToBlue(marker) {
        let index = resultMarkers.indexOf(marker);

        socket.emit('change', index);
    }
    /* -----------------------------------------------------------------------*/
    $scope.openLink = function() {
      $uibModal.open({
            template: `<div class="modal-body">
                        Send the link below to your friends to start the group session! <br>
                        <a href="{{message}}">{{message}}</a> <br>
                        </div>`,
            backdrop: true,
            controller: 'modalController',
            scope: $scope,
            size: 'lg',
            windowClass: 'centre-modal',
      });
    };
});

app.controller('modalController', function($scope, $location) {
    console.log('location: ', location.href);
    $scope.message = location.href;
});
