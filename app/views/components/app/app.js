/*
 * postLocation controller for the googleMaps module.
 * Handles communication between client sided rendering and server sided
 * location analysis
 */

app.controller('appCtrl', function($scope, $http, $routeParams, $filter, $uibModal, $location, $compile, socket, Data) {
    /* -----------------------------------------------------------------------*/
    /* Initialise fields used by the controller */
    console.log(location.href);
    $scope.messages = [];
    $scope.types = Data.types;
    $scope.colors = Data.colors;
    $scope.appSearch = Data.query;
    $scope.roomID = $routeParams.room;
    $scope.newSession = true;
    $scope.issueSearch = false;
    let resultLocations = [];
    $scope.isChatting = false;
    $scope.message = '';

    Data.user.username = Data.updateUsername();

    let geocoder = new google.maps.Geocoder();
    let directionsDisplay = new google.maps.DirectionsRenderer(
            {
                suppressMarkers: true,
            });
    let directionsService = new google.maps.DirectionsService;

    /*
     * As far as observed, these global variables are used in conjunction of
     * changing the coloured dots over locations.
     */
    let markers = [];
    let users;
    let lastOpenedInfoBubble = undefined;

    /* -----------------------------------------------------------------------*/
    /* Scope fields for handling location labels */

    $scope.selectedResultIndex = 0;
    $scope.hoveredResultIndex = 0;
    $scope.transportType = 'Null';
    $scope.transports = [
    {
        name: 'Foot',
        type: 'WALKING',
    },
    {
        name: 'Bicycle',
        type: 'BICYCLING',
    },
    {
        name: 'Transport',
        type: 'TRANSIT',
    },
    {
        name: 'Car',
        type: 'DRIVING',
    },
    ];

    /* -----------------------------------------------------------------------*/
    /* Scope HTML templates for labels. Must be precompiled to inject angular correctly down */

    /* Displays a given route onto the map */
    function calculateAndDisplayRoute(directionsService, directionsDisplay) {
        $scope.getLocation(function(currLoc) {
            directionsService.route({
                origin: currLoc,
                destination: $scope.getResultFromIndex($scope.selectedResultIndex).location,
                travelMode: google.maps.TravelMode[$scope.transportType.type],
            }, function(response, status) {
                if (status == 'OK') {
                    directionsDisplay.setDirections(response);
                } else {
                    window.alert('Directions request failed due to ' + status);
                }
            });
        });
    }

    /* Handles clicking on the submit button
     * Submission also occurs via pressing enter */
    $scope.printTransport = (transport) => {
        $scope.transportType = transport;
        calculateAndDisplayRoute(directionsService, directionsDisplay);
    };

    $scope.getResultFromIndex = function(index) {
        return resultLocations[index];
    };

    $scope.displayLike = function(result) {
        if (result) {
            for (let i = 0; i < result.users.length; i++) {
                if (result.users[i] === Data.user.username) {
                    return 'UNLIKE';
                }
            }
            return 'LIKE';
        }
        return '';
    };

    $scope.toggleLike = function(result) {
        changeMarkers(result);
    };

    let generateInfoBubbleTemplate = function(result) {
        return (
        '<div>' +
        '<div class="infoBubbleLocation">Name: ' + '{{getResultFromIndex(' + result + ').name}}' + '<br> Average time spent: ' + '{{getResultFromIndex(' + result + ').avgtime}}' + ' minutes.</div>' +
            '<label ng-repeat="transport in transports">' +
                '<button type="button" class="btn btn-search" ng-value="transport.name" ng-click="printTransport(transport)">{{transport.name}}</button>' +
            '</label>' +
            '<br>' +
            '<button type="button" class="btn btn-block btn-primary" ng-click=\"toggleLike(getResultFromIndex(' + result + '))\">{{displayLike(getResultFromIndex(' + result + '))}}</button>' +
        '</div>'
        );
    };

    let compiledSelectedHTML = $compile(generateInfoBubbleTemplate('selectedResultIndex'))($scope);
    let compiledHoveredHTML = $compile(generateInfoBubbleTemplate('hoveredResultIndex'))($scope);

    /* -----------------------------------------------------------------------*/

    $scope.toggleSelected = ((index) => {
        $scope.types[index].isSelected = !$scope.types[index].isSelected;
        Data.types = $scope.types;
    });

    /* ------------------------------------------------------------------------*/
    /* A function to change the users colour */

    $scope.changeUserColour = ((colour) => {
        if (!$scope.issueSearch) {
            $scope.issueSearch = true;
            socket.emit('changeColour', {username: Data.user.username,
                                      colour: colour});
        };
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

    /*
     * Error handler used in conjunction with the geolocation function above.
     */
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

    /*
     * Receives a list of locations whose coloured dots need to be
     * refreshed. Sends them one by one to the function which takes care of
     * actually refreshing the coloured dots.
     */
    let issueOneByOne = function(locationData) {
        resultLocations = locationData;
        $scope.$apply();

        for (let i = 0; i < locationData.length; i++) {
            changeColoursOfMarkers(i, locationData[i].users);
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

        if (!Data.user.username) {
            Data.user.username = 'Guest-' + number;
        }

        broadcastUserData();
    });

    /*
     * Note to self: This should work if one uses only socket.on. However,
     * it does not. It would appear that the event is only triggered once.
     * This behaviour leads me to believe that the listener is either
     * destroyed or it listens only once.
     */
    socket.removeAllListeners('updateMarkers', function() {
        socket.once('updateMarkers', issueOneByOne);
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

    /* Initialise the client-sided rendering of the map */
    $scope.initMap = function(location, room) {
        document.getElementById('map').style.visibility = 'visible';

        /* Initialise the map via the Google API */
        map = createMap(location);

        /* Hook for rendering of directions API */
        directionsDisplay.setMap(map);
        directionsDisplay.setDirections({routes: []});

        users = room.users;
        resultLocations = room.results;

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
         * This code iterates through all returned positions, setting them up on
         * the map.
         */
        if (room.results) {
            /* Reset the markers array when new results are received. */
            markers = [];

            for (let i = 0; i < room.results.length; i++) {
                let infoBubble = createLocationInfoBubble(i);

                let marker = markResult(room.results[i], map);

                markers.push(marker);

                markerAddInfo(map, marker, infoBubble);
            }
        }

        // Draws coloured dots over locations if needed.
        for (let i = 0; i < room.results.length; i++) {
            changeColoursOfMarkers(i, room.results[i].users);
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
            hideCloseButton: false,
            disableAnimation: true,
            arrowPosition: 30,
            backgroundClassName: 'infoBubbleText',
            arrowStyle: 2,
            result: '',
        });
    };

    createLocationInfoBubble = function(index) {
        let infoBubble = createDefaultInfoBubble();

        infoBubble.index = index;
        infoBubble.locationBubble = true;

        return infoBubble;
    };

    createUserInfoBubble = function(user) {
        let infoBubble = createDefaultInfoBubble();

        infoBubble.content = '<div class="infoBubbleUser" style=\"color: ' + user.color + '\">' + user.username + '</div>';

        return infoBubble;
    };

    markResult = function(result, map) {
        let icon = createDefaultRedIcon();

        let marker = new google.maps.Marker({
            position: result.location,
            map: map,
            icon: icon,
        });

        // This property is used to keep track of the colours used to
        // represent which users have clicked on the marker.
        marker['colouredDots'] = [];

        return marker;
    };

    let pathToIcon = 'M238,0c-40,0-74,13.833-102,41.5S94,102.334,94,141c0,23.333,13.333,65.333,40,126s48,106,64,136s29.333,54.667,40,74c10.667-19.333,24-44,40-74s37.5-75.333,64.5-136S383,164.333,383,141c0-38.667-14.167-71.833-42.5-99.5S278,0,238,0L238,0z';

    function createDefaultRedIcon() {
        return {
            path: pathToIcon,
            fillColor: '#ff3700',
            fillOpacity: 1,
            anchor: new google.maps.Point(250, 400),
            labelOrigin: new google.maps.Point(240, 150),
            strokeWeight: 1,
            scale: .08,
        };
    }

    markerAddInfo = function(map, marker, infoBubble) {
        /* Handle mouse click events over labels */
        google.maps.event.addListener(marker, 'click', function() {
            if (!infoBubble.opened) {
                infoBubble.opened = true;
                infoBubble.open(map, marker);

                /* Change the template of the selected label to use the 'selected' style
                 * Then change the $scope field and apply the angular changes */
                if (infoBubble.locationBubble) {
                    infoBubble.content = compiledSelectedHTML[0];
                    $scope.selectedResultIndex = infoBubble.index;
                    $scope.$apply();
                }

                /* Close the last opened label if necessary */
                if (lastOpenedInfoBubble) {
                    lastOpenedInfoBubble.opened = false;
                    lastOpenedInfoBubble.close();
                }
                lastOpenedInfoBubble = infoBubble;
            } else if (infoBubble.opened) {
                infoBubble.opened = false;
                infoBubble.close();
                lastOpenedInfoBubble = undefined;
            }
        });

        /* Handle mouse hovering over labels */
        google.maps.event.addListener(marker, 'mouseover', function() {
            if (!infoBubble.opened) {
                /* Change the template of the hovered label to use the hovering style
                 * Then change the $scope field and apply the angular changes */
                if (infoBubble.locationBubble) {
                    infoBubble.content = compiledHoveredHTML[0];
                    $scope.hoveredResultIndex = infoBubble.index;
                    $scope.$apply();
                }

                infoBubble.open(map, marker);
            }
        });

        /* Handle mouse UN-hovering over labels */
        google.maps.event.addListener(marker, 'mouseout', function() {
            if (!infoBubble.opened) {
                infoBubble.close();
            }
        });
    };

    function changeMarkers(result) {
        let packagedData = [{
            id: result.id,
            username: Data.user.username,
        }];

        socket.emit('changeMarkers', packagedData);
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

    /* -----------------------------------------------------------------------*/
    /* Functions used in order to change colours of markers. */

    /*
     * Handles the chaning of the coloured dots above a marker
     * denoting a location.
     */
    function changeColoursOfMarkers(index, usersWhoClicked) {
        // Find the marker, whose dots need to be updated.
        let currentMarker = markers[index];

        console.log(currentMarker.colouredDots);

        clearPreviousColouredDots(currentMarker);

        let colouredDots = [];

        // If no users clicked then just exit, otherwise enter the if statement.
        if (usersWhoClicked.length !== 0) {
            // Find the middle user's index. If there are 2 users in the array,
            // then the middle user's index will be 1. If there are 3 users in
            // the array then the middle user's index will be 1 again.
            let middleUserIndex = Math.floor(usersWhoClicked.length / 2);

            // The algorithm differs if there is an odd or even number of users.
            if (usersWhoClicked.length % 2 !== 0) {
                for (let i = 0; i < usersWhoClicked.length; i++) {
                    // Generate the offset of the coloured dot for the
                    // current user in the loop.
                    let anchor = new google.maps.Point(-3 * (middleUserIndex - i), 10);

                    let colouredDot = generateColouredDot(currentMarker, anchor, usersWhoClicked[i]);

                    colouredDots.push(colouredDot);
                }
            } else {
                for (let i = 0; i < usersWhoClicked.length; i++) {
                    let anchor;

                    // Generate the offset of the coloured dot for the
                    // current user in the loop.
                    if (i < middleUserIndex) {
                        anchor = new google.maps.Point(2 - (3 * (middleUserIndex - i)), 10);
                    } else {
                        anchor = new google.maps.Point(2 + 3 * (i - middleUserIndex), 10);
                    }

                    let colouredDot = generateColouredDot(currentMarker, anchor, usersWhoClicked[i]);

                    colouredDots.push(colouredDot);
                }
            }
        }

        currentMarker.colouredDots = colouredDots;
    }

    /*
     * Clears the previous array of coloured dots on a specific location.
     */
    function clearPreviousColouredDots(currentMarker) {
        let colouredDots = currentMarker.colouredDots;

        for (let i = 0; i < colouredDots.length; i++) {
            colouredDots[i].setMap(null);
        }
    }

    /*
     * Finds the colour of the user who clicked on a specific location.
     */
    function findColourOfUserWhoClicked(username) {
        for (let i = 0; i < users.length; i++) {
            if (users[i].username === username) {
                return users[i].color;
            }
        }
    }

    /*
     * Generates a new coloured dot over the currentMarker at anchor offset.
     */
    function generateColouredDot(currentMarker, anchor, userWhoClicked) {
        return new google.maps.Marker({
            position: currentMarker.getPosition(),
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 4,
                anchor: anchor,
                fillColor: findColourOfUserWhoClicked(userWhoClicked),
                fillOpacity: 1,
                strokeColor: 'black',
                strokeWeight: 1,
            },
            map: currentMarker.getMap(),
        });
    }

    /* -----------------------------------------------------------------------*/

    /* On recieve */
    function socketRecieveMessage(messages) {
        $scope.messages = messages;
        $scope.$apply();
    }

    /* Add socket listener for messaging */
    socket.removeAllListeners('recieveChatMessage', function() {
        socket.once('recieveChatMessage', socketRecieveMessage);
    });

    /* handle message exhange */
    $scope.sendMessage = () => {
        /* no empty message */
        if ($scope.message !== '') {
            // $scope.messages.push({
            // username: Data.user.username,
            // location: '',
            // message: $scope.message,
            // });
            socket.emit('chatMessage', {
                username: Data.user.username,
                location: '',
                message: $scope.message,
            });
            $scope.message = '';
        }
    };
    /* -----------------------------------------------------------------------*/
});

app.controller('modalController', function($scope, $location) {
    console.log('location: ', location.href);
    $scope.message = location.href;
});

