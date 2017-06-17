/*
 * postLocation controller for the googleMaps module.
 * Handles communication between client sided rendering and server sided
 * location analysis
 */

app.controller('appCtrl', function($scope, $http, $routeParams, $filter, $uibModal, $location, $compile, socket, Data) {
    /* -----------------------------------------------------------------------*/
    /* Initialise fields used by the controller */
    console.log(location.href);
    $scope.types = Data.types;
    $scope.colors = Data.colors;
    $scope.appSearch = Data.query;
    $scope.roomID = $routeParams.room;
    $scope.newSession = true;
    $scope.issueSearch = false;
    let resultLocations = [];
    /* Checks if chat window is open */
    $scope.isChatting = true;
    /* the global list of all messages */
    $scope.messages = [];
    /* message the user is sending */
    $scope.message = '';
    /* messages specific to the current room */
    $scope.roomMessages = [];
    /* number of unread messages */
    $scope.numMessages = 0;
    /* the users room which one is inside now */
    $scope.currentRoom = 'General';
    /* list of message rooms we have currently */
    $scope.messageRooms = ['General'];
    /* determine whether to be in room list view or be inside chat view */
    $scope.insideRoom = false;

    $scope.accordionOptions = true;
    $scope.accordionUsers = false;
    $scope.accordionChat = false;

    $scope.mapSize = true;
    $scope.sideBarShow = false;
    $scope.sideBarOpening = false;

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
    let mapObjects = [];
    let users;
    let lastOpenedInfoBubble = undefined;

    /*
     * This is the marker of the user. Used to update his location upon
     * click events.
     */
    let userMarker;

    /* -----------------------------------------------------------------------*/
    /* Scope fields for handling location labels */

    $scope.selectedResultIndex = 0;
    $scope.hoveredResultIndex = 0;
    $scope.transportType = 'Null';
    $scope.transports = [
    {
        name: 'Foot',
        type: 'WALKING',
        icon: 'fa fa-male',
        index: 1,
    },
    {
        name: 'Bicycle',
        type: 'BICYCLING',
        icon: 'fa fa-bicycle',
        index: 2,
    },
    {
        name: 'Public',
        type: 'TRANSIT',
        icon: 'fa fa-bus',
        index: 3,
    },
    {
        name: 'Car',
        type: 'DRIVING',
        icon: 'fa fa-car',
        index: 0,
    },
    ];

    $scope.unitWidth = () => {
        width = $scope.appSearch.radius > 0 ? $scope.appSearch.radius.toString().length * 10 + 15 : 25;
        return {'width': width + 'px'};
    };

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

    /* Given an index of a location  */
    $scope.getResultFromIndex = function(index) {
        return resultLocations[index];
    };

    /* Given an index of a location  */
    $scope.getMarkerFromIndex = function(index) {
        return markers[index];
    };

    /* Diplays the like status of a location
     * DEPRECATED */
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

    /* Generates a string containing a list of users which have liked a specific location */
    $scope.printUsers = function(users) {
        if (users) {
            let userString = '';
            for (let i = 0; i < users.length; i ++) {
                if (userString) {
                    userString += ', ' + users[i];
                } else {
                    userString = users[i];
                }
            }
            return userString;
        }
        return '';
    };

    /* Determines if a marker has had the travel times determined already */
    $scope.hasTime = function(marker) {
        if (marker) {
            return marker.transportTimes;
        }
        return false;
    };

    /* Determines the content of the travel time to a marker */
    $scope.getTime = function(marker, transport) {
        if (marker) {
            if (marker.transportTimes) {
                return marker.transportTimes.content[transport.index].travelTime[0].duration.text;
            }
        }
    };

    /* Function invoked whenever pressing the like button of a location */
    $scope.toggleLike = function(result) {
        changeMarkers(result);
    };

    /* Template according to which precompile infoBubble */
    let generateInfoBubbleTemplate = function(result) {
        return (
                `<div>
                    <div class="input-group">
                        <span class="input-group-btn bubble-header">
                            <button class="btn btn-like input-lg" ng-click=\"toggleLike(getResultFromIndex(` + result + `))\" type="submit">
                                <i class="fa fa-thumbs-up"></i>
                            </button>
                        </span>
                        <div type="text" class="form-control centre-text text-field-colour input-lg square bubbleHeaderText">{{getResultFromIndex(` + result + `).name}}</div>
                    </div>
                    <div class="bubble-separator"></div>
                    <div class="btn-group btn-group-justified">
                        <label class="btn bubble-btn square" ng-repeat="transport in transports" ng-value="transport.name" ng-click="printTransport(transport)">
                            <i class="{{transport.icon}}"></i>
                            <br>
                            <div ng-show=\"!hasTime(getMarkerFromIndex(` + result + `))\">
                                <p style="margin: 0">{{transport.name}}</p>
                            </div>
                            <div ng-show=\"hasTime(getMarkerFromIndex(` + result + `))\">
                                <p style="margin: 0">{{getTime(getMarkerFromIndex(` + result + `), transport)}}</p>
                            </div>
                        </label>
                    </div>
                    <div class="bubble-separator"></div>
                    <div class="like-text-field">
                        <div style="display: inline; color: blue;">Liked By: </div>
                        {{printUsers(getResultFromIndex(` + result + `).users)}}
                    </div>
                </div>`
            );
    };

    /* Precompile HTML files for infoBubble */
    let compiledSelectedHTML = $compile(generateInfoBubbleTemplate('selectedResultIndex'))($scope);
    let compiledHoveredHTML = $compile(generateInfoBubbleTemplate('hoveredResultIndex'))($scope);

    /* -----------------------------------------------------------------------*/
    /* Handle type toggleing */

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
        }
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
                            // alert('Geocode was not successful for the following' +
                                    // ' reason: ' + status);
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
    /* Send information to socket.io room */

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
        // console.log('Gonna broadcast types');

        let toSend = {
            'types': angular.toJson(Data.types),
            'duration': Data.query.duration,
            'date': Data.query.datetime,
        };
        // console.log(toSend);
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

    /* */
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

            $scope.appSearch = Data.query;
            Data.types = $scope.types;

            $scope.$apply();

            if (room.users.length === 1 && $scope.newSession) {
                $scope.newSession = false;
                $scope.performSearch();
            }
        }
    };

    /* */
    let socketUpdateTransportTime = function(transportTimes) {
        if (resultLocations[$scope.selectedResultIndex].id === transportTimes.id) {
            markers[$scope.selectedResultIndex].transportTimes = transportTimes;
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
        /* when the likes update, we need to update the room as well */
        addRooms();
        $scope.$apply();

        for (let i = 0; i < locationData.length; i++) {
            changeColoursOfMarkers(i, locationData[i].users);
        }
    };

    /* On recieve */
    function socketRecieveMessage(messages) {
        /* if there is no update in message, reject */
        if ($scope.messages.length === messages.length) {
            return;
        }
        let initial = false;
        if ($scope.messages.length === 0 && messages.length >= 1) {
            /* differentiate between the first message recieved and initial message recieve on refresh */
            initial = !messages.slice(-1)[0].isFirst;
        }
        /* number of messages received */
        let diff = $scope.messages.length - messages.length;
        messages.slice(diff).forEach((mes, i) => {
            if (mes.location === $scope.currentRoom) {
                $scope.roomMessages.push(mes);
            }
        });
        $scope.messages = messages;
        if (!initial && $scope.messages.slice(-1)[0].username !== Data.user.username) {
            /* only increment if you are not the sender and you don't have chat open */
            if (!$scope.accordionChat) {
                $scope.numMessages += 1;
            }
        }
        $scope.$apply();
    }

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

    socket.removeAllListeners('receiveTransportTime', function() {
        socket.once('receiveTransportTime', socketUpdateTransportTime);
    });

    /* Add socket listener for messaging */
    socket.removeAllListeners('recieveChatMessage', function() {
        socket.once('recieveChatMessage', socketRecieveMessage);
    });

    socket.on('joinSuccess', function(number) {
        console.log('Join Success');

        if (!Data.user.username) {
            Data.user.username = 'Guest-' + number;
        }

        /* update the messages */
        socket.emit('chatMessage', {});

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
        // console.log($scope.users[index].username);
        socket.emit('deleteUser', $scope.users[index].username);
    };

    /* handle message exhange */
    $scope.sendMessage = () => {
        /* no empty message */
        if ($scope.message !== '') {
            socket.emit('chatMessage', {
                username: Data.user.username,
                location: $scope.currentRoom,
                message: $scope.message,
            });
            $scope.message = '';
        }
    };

    /* */
    function changeMarkers(result) {
        let packagedData = [{
            id: result.id,
            username: Data.user.username,
        }];

        socket.emit('changeMarkers', packagedData);
    }

    /* */
    function socketSendTimeRequest() {
        $scope.getLocation(function(currLoc) {
            socket.emit('calculateTransportTime', {
                source: currLoc,
                destination: resultLocations[$scope.selectedResultIndex],
            });
        });
    }

    /* -----------------------------------------------------------------------*/
    /* Functions called upon entry */

    $scope.joinRoom();
    let map;
    $scope.getLocation(function(currLoc) {
        map = createMap(currLoc);
        directionsDisplay.setMap(map);

        /* Add click event listener. Used to allow user to change their
         location just by clicking. */
        google.maps.event.addListener(map, 'click', function(event) {
            let latLng = event.latLng;

            geocoder.geocode({'location': latLng}, function(results, status) {
                if (status === 'OK') {
                    if (results[1]) {
                        /* Used to update the location field. */
                        Data.query.location = results[0].formatted_address;
                        broadcastUserData();
                    } else {
                        window.alert('No results found');
                    }
                } else {
                    // window.alert('Geocoder failed due to: ' + status);
                }
            });
        });

        document.getElementById('map').style.visibility = 'hidden';
    });

    /* -----------------------------------------------------------------------*/
    /* Map rendering functions with helpers */

    /* Initialise the client-sided rendering of the map */
    $scope.initMap = function(location, room) {
        for (let i = 0; i < mapObjects.length; i++) {
            mapObjects[i].setMap(null);
        }

        /* Obtain new map bounds. */
        let mapBounds = new google.maps.LatLngBounds(null);

        /* Hook for rendering of directions API */
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
            let radius = initRadius(radLoc, users[i], map, marker);

            /* Add the radius to the map bounds in order to control the map
             zoom. */
            mapBounds = mapBounds.union(radius.getBounds());

            mapObjects.push(marker);
            mapObjects.push(radius);

            let userBubble = createUserInfoBubble(users[i]);

            markerAddInfo(map, marker, userBubble);
        }

        /*
         * This code iterates through all returned positions, setting them up on
         * the map.
         */
        if (room.results) {
            for (let i = 0; i < markers.length; i++) {
                markers[i].setMap(null);
                markers[i].typeMarker.setMap(null);
                for (let j = 0; j < markers[i].colouredDots.length; j++) {
                    markers[i].colouredDots[j].setMap(null);
                }
            }

            /* Reset the markers array when new results are received. */
            markers = [];

            for (let i = 0; i < room.results.length; i++) {
                let infoBubble = createLocationInfoBubble(i);

                let marker = markResult(room.results[i], map);

                markers.push(marker);

                markerAddInfo(map, marker, infoBubble);
            }
        }

        /* Draws coloured dots over locations if needed. */
        for (let i = 0; i < room.results.length; i++) {
            changeColoursOfMarkers(i, room.results[i].users);
        }
        /* Initialise the map via the Google API */
        if (!(room.users.length === 1 && $scope.newSession)) {
            console.log('Here?');
            document.getElementById('map').style.visibility = 'visible';
        }

        /* Update the map bounds to incorporate all users in the viewport. */
        map.fitBounds(mapBounds);
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

    /* TODO: Add comment */
    markUser = function(location, user, map) {
        let icon = {
            path: 'M365.027,44.5c-30-29.667-66.333-44.5-109-44.5s-79,14.833-109,44.5s-45,65.5-45,107.5c0,25.333,12.833,67.667,38.5,127c25.667,59.334,51.333,113.334,77,162s38.5,72.334,38.5,71c4-7.334,9.5-17.334,16.5-30s19.333-36.5,37-71.5s33.167-67.166,46.5-96.5c13.334-29.332,25.667-59.667,37-91s17-55,17-71C410.027,110,395.027,74.167,365.027,44.5z M289.027,184c-9.333,9.333-20.5,14-33.5,14c-13,0-24.167-4.667-33.5-14s-14-20.5-14-33.5s4.667-24,14-33c9.333-9,20.5-13.5,33.5-13.5c13,0,24.167,4.5,33.5,13.5s14,20,14,33S298.36,174.667,289.027,184z',
            fillColor: user.color,
            fillOpacity: 1,
            anchor: new google.maps.Point(255, 510),
            strokeWeight: 1,
            scale: .12,
        };

        let marker = new google.maps.Marker({
            position: location,
            map: map,
            icon: icon,
            opacity: 0.2,
            // optimized: false,
            // zIndex: 0,
        });

        // let marker2 = new google.maps.Marker({
        //     position: location,
        //     map: map,
        //     optimized: false,
        //     zIndex: 1,
        //     // icon: icon,
        // });

        if (Data.user.username === user.username) {
            userMarker = marker;
        }

        return marker;
    };

    /* TODO: Add comment */
    initRadius = function(location, user, map, marker) {
        let circle = new google.maps.Circle({
            strokeColor: user.color,
            strokeOpacity: 0.8,
            strokeWeight: 1,
            fillColor: user.color,
            fillOpacity: 0.1,
            map: map,
            center: location,
            radius: user.radius,
            /* Clickable is set to false, because otherwise the circle
             prevents the user from clicking on POIs inside the circle. */
            /* The above comment held true until we decided that we would
             like to use this as a fail-safe feature. Furthermore, it is
             needed if the user's pin is going to fade in and out upon
             hovering over the circle.*/
            clickable: true,
        });

        circle.addListener('mouseover', function() {
            marker.setOpacity(0.8);
        });

        circle.addListener('mouseout', function() {
            marker.setOpacity(0.2);
        });

        return circle;
    };

    /* TODO: Add comment */
    createDefaultInfoBubble = function() {
        return new InfoBubble({
            content: '',
            shadowStyle: 0,
            padding: 0,
            backgroundColor: 'rgb(236, 239, 241)',
            borderRadius: 0,
            arrowSize: 10,
            borderWidth: 1,
            borderColor: 'rgb(120, 144, 156)',
            maxWidth: 300,
            minHeight: 'calc(100% + 2px)',
            disableAutoPan: true,
            hideCloseButton: false,
            disableAnimation: true,
            arrowPosition: 30,
            backgroundClassName: 'infoBubbleText',
            arrowStyle: 2,
            result: '',
        });
    };

    /* TODO: Add comment */
    createLocationInfoBubble = function(index) {
        let infoBubble = createDefaultInfoBubble();

        infoBubble.index = index;
        infoBubble.locationBubble = true;

        return infoBubble;
    };

    /* TODO: Add comment */
    createUserInfoBubble = function(user) {
        let infoBubble = createDefaultInfoBubble();

        infoBubble.content = '<div class="infoBubbleUser" style=\"color: ' + user.color + '\">' + user.username + '</div>';

        return infoBubble;
    };

    /* TODO: Add comment */
    markResult = function(result, map) {
        let icon = createDefaultRedIcon();

        let marker = new google.maps.Marker({
            position: result.location,
            map: map,
            icon: icon,
            /* The optimized property is needed for the zIndex to work. */
            optimized: false,
            zIndex: 0,

        });

        /* This property is used to keep track of the colours used to
         * represent which users have clicked on the marker. */
        marker['colouredDots'] = [];

        /* Generate additional type markers. */
        let typeIcon = createTypeIcon(result.type);
        let typeMarker = new google.maps.Marker({
            position: result.location,
            map: map,
            icon: typeIcon,
            /* The optimized property is needed for the zIndex to work. */
            optimized: false,
            zIndex: 0,
            /* Prevents this marker from capturing the cursor when a user is
             * hovering over a location marker. */
            clickable: false,
        });

        marker['typeMarker'] = typeMarker;
        marker['type'] = result.type;

        return marker;
    };

    /* TODO: Add comment */
    function createTypeIcon(type) {
        return {
            url: findImageByType(type),
            anchor: new google.maps.Point(11, 35),
            scaledSize: new google.maps.Size(20, 20),
        };
    }

    /* TODO: Add comment */
    function findImageByType(type) {
        let types = $scope.types;

        for (let i = 0; i < types.length; i++) {
            if (type === types[i].name.toLowerCase().split(' ').join('_')) {
                return types[i].image;
            }
        }
    }

    let pathToIcon = 'M238,0c-40,0-74,13.833-102,41.5S94,102.334,94,141c0,23.333,13.333,65.333,40,126s48,106,64,136s29.333,54.667,40,74c10.667-19.333,24-44,40-74s37.5-75.333,64.5-136S383,164.333,383,141c0-38.667-14.167-71.833-42.5-99.5S278,0,238,0L238,0z';

    /* TODO: Add comment */
    function createDefaultRedIcon() {
        return {
            path: pathToIcon,
            fillColor: '#ff3700',
            fillOpacity: 1,
            anchor: new google.maps.Point(250, 400),
            strokeWeight: 1,
            scale: .10,
        };
    }

    function closeInfoBubble(infoBubble) {
        infoBubble.opened = false;
        infoBubble.close();
        lastOpenedInfoBubble = undefined;
    }

    /* TODO: Add comment */
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

                /* */
                if (!$scope.hasTime(resultLocations[$scope.selectedResultIndex])) {
                    socketSendTimeRequest();
                }
            } else if (infoBubble.opened) {
                closeInfoBubble(infoBubble);
            }
        });

        google.maps.event.addListener(infoBubble, 'closeclick', function() {
            closeInfoBubble(infoBubble);
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
    /* -----------------------------------------------------------------------*/
    /* TODO: Add comment */

    /* TODO: Add comment */
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
        /* Find the marker, whose dots need to be updated. */
        let currentMarker = markers[index];

        clearPreviousColouredDots(currentMarker);

        let colouredDots = [];

        /* If no users clicked then just exit, otherwise enter the if statement. */
        if (usersWhoClicked.length !== 0) {
            /* Find the middle user's index. If there are 2 users in the array,
             * then the middle user's index will be 1. If there are 3 users in
             * the array then the middle user's index will be 1 again. */
            let middleUserIndex = Math.floor(usersWhoClicked.length / 2);

            /* The algorithm differs if there is an odd or even number of users. */
            if (usersWhoClicked.length % 2 !== 0) {
                for (let i = 0; i < usersWhoClicked.length; i++) {
                    /* Generate the offset of the coloured dot for the
                     * current user in the loop. */
                    let anchor = new google.maps.Point(-3 * (middleUserIndex - i), 12);

                    let colouredDot = generateColouredDot(currentMarker, anchor, usersWhoClicked[i]);

                    colouredDots.push(colouredDot);
                }
            } else {
                for (let i = 0; i < usersWhoClicked.length; i++) {
                    let anchor;

                    /* Generate the offset of the coloured dot for the
                     * current user in the loop. */
                    if (i < middleUserIndex) {
                        anchor = new google.maps.Point(2 - (3 * (middleUserIndex - i)), 12);
                    } else {
                        anchor = new google.maps.Point(2 + 3 * (i - middleUserIndex), 12);
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
    /* Functions to handle messages */

    /* checks if message was sent by the user */
    $scope.isMyMessage = (username) => {
        return username === Data.user.username;
    };

    /* Functions to handle room entry */
    $scope.enterRoom = (index) => {
        let room = $scope.messageRooms[index].name;
        $scope.currentRoom = room;
        /* empty the room messages */
        $scope.roomMessages = [];
        $scope.messages.forEach((mes, i) => {
            /* fill the messages with relavant ones */
            if (mes.location === room) {
                $scope.roomMessages.push(mes);
            }
        });
        /* switch view to room */
        $scope.insideRoom = true;
    };

    const getImageURL = (type) => {
        let ts = angular.copy(Data.types);
        for (let i = 0; i < ts.length; i++) {
            let t = ts[i];
            t.name = t.name.split(' ').join('_').toLowerCase();
            if(t.name === type) {
                console.log(Data.types);
                return t.image;
            }
        }
        console.log('could not find the image url');
        return '';
    };

    const addRooms = () => {
        $scope.messageRooms = [
            {
                name: 'General',
                image: '',
            },
        ];
        resultLocations.forEach((l, i) => {
            if (l.users.length > 0) {
                let url = getImageURL(l.type);
                $scope.messageRooms.push({
                    name: l.name,
                    image: url,
                });
            }
        });
    };
    /* -----------------------------------------------------------------------*/
    /* -----------------------------------------------------------------------*/

    /*
     * This function is called when a user clicks on a type which has
     * already been selected as a search criteria. It fades out all markers
     * not belonging to the type.
     */
    $scope.filterByType = filterByType;

    /*
     * Since functions are objects, a property has been added to this
     * function (lastSelectedType) to perform the functions of a static
     * variable (not changing between function calls).
     */
    function filterByType(typeName) {
        let type = typeName.toLowerCase().split(' ').join('_');

        if (filterByType.lastSelectedTypes === undefined) {
            filterByType.lastSelectedTypes = [];
        }

        let index = filterByType.lastSelectedTypes.indexOf(type);

        if (index === (-1)) {
            filterByType.lastSelectedTypes.push(type);
        } else {
            filterByType.lastSelectedTypes.splice(index, 1);
        }

        for (let i = 0; i < markers.length; i++) {
            let fadeOutOpacity = 1;

            if (filterByType.lastSelectedTypes.length !== 0 &&
                filterByType.lastSelectedTypes.indexOf(markers[i].type) === (-1)) {
                fadeOutOpacity = 0.2;
            }

            markers[i].setOpacity(fadeOutOpacity);
            markers[i].typeMarker.setOpacity(fadeOutOpacity);
            for (let j = 0; j < markers[i].colouredDots.length; j++) {
                markers[i].colouredDots[j].setOpacity(fadeOutOpacity);
            }
        }
    }

    $scope.toggleHighlight = (index) => {
        /* toggle is highlighted */
        console.log('highlight');
        $scope.types[index].isHighlighted = !$scope.types[index].isHighlighted;
    };
    /* -----------------------------------------------------------------------*/
    /* Functions to handle accordion */
    /* allow only one type at a type */
    $scope.setAccordionOptions = (type) => {
        $scope.insideRoom = false;
        $scope.accordionOptions = false;
        $scope.accordionUsers = false;
        $scope.accordionChat = false;
        if (type === 'options') {
            $scope.accordionOptions = true;
        } else if(type === 'users') {
            $scope.accordionUsers = true;
        } else if(type === 'chat') {
            $scope.numMessages = 0;
            $scope.accordionChat = true;
            addRooms();
        } else {
            console.log('accordion type mismatch');
        }
    };

    /* -----------------------------------------------------------------------*/

    $scope.toggleMapSize = function() {
        console.log('click');

        $scope.sideBarOpening = !$scope.sideBarOpening;
        $scope.sideBarShow = true;

        console.log($scope.sideBarOpening);

        if ($scope.sideBarOpening) {
            console.log('Slide in');
            $('.custom-animate').addClass('slide-in').removeClass('slide-out');
        } else {
            $('.custom-animate').addClass('slide-out').removeClass('slide-in');
        }

        $scope.mapSize = !$scope.mapSize;
    };

    let monkey = document.querySelector('#rightNav');

    monkey.addEventListener('animationstart', function(e) {
        console.log('log at start of monkey animation');
    }, false);

    const myScript = function() {
        console.log('log at end of monkey animation');

        $scope.sideBarShow = $scope.sideBarOpening;

        console.log($scope.sideBarOpening);
        console.log($scope.sideBarShow);

        $scope.$apply();
    };

    monkey.addEventListener('webkitAnimationEnd', myScript);
    monkey.addEventListener('animationend', myScript);

    monkey.addEventListener('animationiteration', function(e) {
        console.log('log at beginning of each subsequent iteration');
    }, false);

    $('#tmpButton').click(function() {
        $('.custom-animate').toggleClass('slide-in');
    });

    /* -----------------------------------------------------------------------*/
});

/* */
app.controller('modalController', function($scope, $location) {
    console.log('location: ', location.href);
    $scope.message = location.href;
});

