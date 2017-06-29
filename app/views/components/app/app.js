/*
 * postLocation controller for the googleMaps module.
 * Handles communication between client sided rendering and server sided
 * location analysis
 */

app.controller('appCtrl', function($scope, $http, $routeParams, $filter, $uibModal, $location, $compile, $timeout, socket, Data) {
    /* ---------------------------------------------------------------------------------------------------------------*/
    /* Initialise fields used by the controller */

    $scope.types = Data.types;             /* Array. Keeps tract of the active types of the room */
    $scope.colors = Data.colors;           /* Array. Holds available colors */
    $scope.appSearch = Data.query;         /* Copy over the query made in home page */
    Data.user.username = '';               /* String. Holds current user's username */

    $scope.newSession = true;              /* Boolean. Initialised to true upon entry */
    $scope.issueSearch = false;            /* Boolean. Use to load loading GIF whilst search is conducted */
    $scope.isChatting = true;              /* Boolean. Checks if chat window is open */
    $scope.insideRoom = false;             /* Boolean. Determines whether to be in room list view or be inside chat view */

    $scope.numMessages = 0;                /* Integer. Holds number of unread messages */
    $scope.selectedResultIndex = 0;        /* Integer. Holds the result of the selected infoBubble */
    $scope.hoveredResultIndex = 0;         /* Integer. Holds the result of the hovered upon infoBubble */

    $scope.roomID = $routeParams.room;     /* String. Socket.io roomID */
    $scope.message = '';                   /* String. The message the user is sending */
    $scope.currentRoom = 'Chat';           /* String. Holds the users room which one is inside now */
    $scope.transportType = 'Null';         /* String. Holds the user-selected transport type */

    $scope.messages = [];                  /* Array. Holds the global list of all messages */
    $scope.roomMessages = [];              /* Array. Lists messages specific to the current room */
    $scope.transports = [];                /* Array. Holds list of available transport types */
    $scope.roomMap = new Map();            /* Holds mapping between location and message count */
    $scope.roomMap.set('General', 0);
    $scope.messageRooms =                  /* Array. Contains list of message rooms we have currently */
        [{name: 'General', image: '', count: 0}];
    $scope.messageCount =
        [{location: 'General', count: 0}]; /* Array. Contains list of message rooms we have currently */

    $scope.sideRightBarShow = false;       /* Boolean. Stores ng-show for rightNavBar */
    $scope.sideRightBarOpening = false;    /* Boolean. Stores opening status for rightNavBar */
    $scope.sideRightBarAnimating = false;  /* Boolean. Stores animation status of rightNavBar */
    $scope.sideLeftBarShow = false;        /* Boolean. Stores ng-show for leftNavBar */
    $scope.sideLeftBarOpening = false;     /* Boolean. Stores opening status for leftNavBar */
    $scope.sideLeftBarAnimating = false;   /* Boolean. Stores animation status of leftNavBar */

    let resultLocations = [];              /* Array. Contains displayed resulted locations */
    let markers = [];                      /* Array. Contains list of live markers */
    let mapObjects = [];

    let map;                               /* Object. Contains an instance of the map */
    let lastOpenedInfoBubble;              /* Object. Contains last opened infoBubble */

    let geocoder;                          /* Object. Used by googleMaps */
    geocoder = new google.maps.Geocoder(); /* Initialise googleMaps required fields */
    let directionsDisplay;                 /* Object. Used by googleMaps */
    let directionsService;                 /* Object. Used by googleMaps */

    let compiledSelectedHTML;              /* HTML. Precompiled for infoBubbles */
    let compiledHoveredHTML;               /* HTML. Precompiled for infoBubbles */

    let rightNav;                          /* Object. Holds instance of rightNavBar */
    let leftNav;                           /* Object. Holds instance of leftNavBar */

    /* ---------------------------------------------------------------------------------------------------------------*/

    /* ---------------------------------------------------------------------------------------------------------------*/
    /* Scope fields for handling location labels */

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

    /* ---------------------------------------------------------------------------------------------------------------*/
    /* Scope HTML templates for labels. Must be precompiled to inject angular correctly down */

    /* Displays a given route onto the map */
    const calculateAndDisplayRoute = function(directionsService, directionsDisplay) {
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
    };

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


    $scope.hasWebsite = function(marker) {
        if (marker) {
            if (marker.website) {
                return true;
            }
        }
        return false;
    };

    $scope.getWebsite = function(marker) {
        if (marker) {
            if (marker.website) {
                return marker.website;
            }
            return 'https://www.google.co.uk';
        }
    };

    $scope.hasRating = function(marker) {
        if (marker) {
            return marker.rating;
        }
        return false;
    };

    $scope.getRating = function(marker) {
        if (marker) {
            return marker.rating;
        }
    };

    $scope.getPicture = function(marker) {
        if (marker) {
            return marker.photo;
        }
    };

    $scope.hasPicture = function(marker) {
        if (marker) {
            return marker.photo;
        }
        return false;
    };


    /* Function invoked whenever pressing the like button of a location */
    $scope.toggleLike = function(result) {
        changeMarkers(result);
    };

    /* Template according to which precompile infoBubble */
    const generateInfoBubbleTemplate = function(result) {
        return (
                `<div style="background-color: #eceff1;">
                    <div class="input-group">
                        <span class="input-group-btn bubble-header">
                            <button class="btn btn-like input-lg" ng-click=\"toggleLike(getResultFromIndex(` + result + `))\" type="submit">
                                <i class="fa fa-thumbs-up"></i>
                            </button>
                        </span>
                        <a type="text" target="_blank" href="{{getWebsite(getMarkerFromIndex(` + result + `))}}" class="form-control centre-text text-field-colour input-lg square bubbleHeaderText" ng-show=\"hasWebsite(getMarkerFromIndex(` + result + `))\">{{getResultFromIndex(` + result + `).name}}</a>
                        <p class="form-control centre-text text-field-colour input-lg square bubbleHeaderText"
                        ng-show=\"!hasWebsite(getMarkerFromIndex(` + result + `))\">{{getResultFromIndex(` + result + `).name}}</p>
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
                    <div ng-show=\"hasRating(getMarkerFromIndex(` + result + `))\">
                        <span uib-rating ng-model="getMarkerFromIndex(` + result + `).rating" max="5" read-only="!isReadonly" state-on="'glyphicon-star'" style="color: darkorange; position: absolute; width: 100%; text-align: center;"></span>
                        <div class="bubble-separator" style="padding-top: 20px"></div>
                    </div>
                    <div ng-show=\"hasPicture(getMarkerFromIndex(` + result + `))\">
                        <img class="image-center" src="{{getPicture(getMarkerFromIndex(` + result + `))}}" style="max-height: 200px; width: 100%; object-fit: cover;" />
                        <div class="bubble-separator"></div>
                    </div>
                    <div class="like-text-field">
                        <div style="display: inline; color: blue;">Liked By: </div>
                        {{printUsers(getResultFromIndex(` + result + `).users)}}
                    </div>
                </div>`
            );
    };

    /* ---------------------------------------------------------------------------------------------------------------*/
    /* Handle type toggleing */

    $scope.toggleSelected = ((index) => {
        $scope.types[index].isSelected = !$scope.types[index].isSelected;
        if (!$scope.types[index].isSelected) {
            $scope.types[index].isHighlighted = false;
        }
        Data.types = $scope.types;
    });

    /* ---------------------------------------------------------------------------------------------------------------*/
    /* A function to change the users colour */

    $scope.changeUserColour = ((colour) => {
        if (!$scope.issueSearch) {
            $scope.issueSearch = true;
            socket.emit('changeColour', {username: Data.user.username,
                colour: colour});
        }
    });

    /* ---------------------------------------------------------------------------------------------------------------*/
    /* getLocation monster function */

    /* Generalised getLocation function for A GIVE USER
     * Determines, according to the current field, whether to use
     * geolocation or parse the location field. */
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
    const errorHandler = function(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                alert('If you want to use your current location you will' +
                        ' need to share your current location.');
                break;
            default:
                alert('Unhandled error: ' + error);
                break;
        }
    };

    /* ---------------------------------------------------------------------------------------------------------------*/
    /* Send information to socket.io room */

    /* Private controller function
     * Broadcasts the user data (username, location and radius) to the socket's room */
    const broadcastUserData = function() {
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

    const broadcastFieldsData = function() {
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

    /* ---------------------------------------------------------------------------------------------------------------*/
    /* Helper functions for update/refresh listeners */

    /* Redefine socket fields for updatingLocation */

    /* Socket update helper function */
    const socketUpdate = function(room) {
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
            /* On update refresh the data */
            socketRefresh(room);

            /* Discarding initial refresh (for submission), update the Map */
            if (room.duration) {
                $scope.initMap(location, room);
            }
        });
        $scope.issueSearch = false;
    };

    /* */
    const socketRefresh = function(room) {
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
    const socketUpdateTransportTime = function(transportTimes) {
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
    const issueOneByOne = function(locationData) {
        resultLocations = locationData;
        /* when the likes update, we need to update the room as well */
        addRooms();
        $scope.$apply();

        for (let i = 0; i < locationData.length; i++) {
            changeColoursOfMarkers(i, locationData[i].users);
        }
    };

    /* On recieve */
    const socketRecieveMessage = function(messages) {
        /* we have ...
         * list of messages, one for each room
         * message count is tracked by a set roomMap
         * we recieve
         * all of the messages on connection (via empty '')
         * one message at a time after initial connection
         */

        /* on inital connection we retrive all of the messages */
        if (Array.isArray(messages)) {
            /* copy over the message on backend to the client */
            $scope.messages = messages;
            /* reset the counter for all the rooms */
            $scope.roomMap.clear();
            /* put messages accordingly into rooms */
            $scope.messages.forEach((m, i) => {
                if (m.location === $scope.currentRoom) {
                    $scope.roomMessages = m.messages;
                }
            });
        } else {
            let isIncluded = false;
            for (let i = 0; i < $scope.messages.length; i++) {
                if ($scope.messages[i].location === messages.location) {
                    isIncluded = true;
                    break;
                }
            }
            if (!isIncluded) {
                $scope.messages.push({
                    location: messages.location,
                    messages: [],
                });
            }
            /* this is a indivisual messages */
            $scope.messages.forEach((m, i) => {
                if (m.location === messages.location) {
                    m.messages.push(messages.messages);
                    /* check if the message is sent by the user */
                    if (m.messages[m.messages.length - 1].username !== Data.user.username) {
                        /* if the user is inside the room, dont update the counter */
                        if (!($scope.insideRoom && $scope.currentRoom === messages.location)) {
                            /* do we keep the room count? if so increment */
                            if ($scope.roomMap.has(messages.location)) {
                                $scope.roomMap.set(messages.location, $scope.roomMap.get(messages.location) + 1);
                            } else {
                                $scope.roomMap.set(messages.location, 1);
                            }
                        }
                    }
                }
                if (m.location === $scope.currentRoom) {
                    $scope.roomMessages = m.messages;
                }
            });
        }
        addRooms();
        $scope.$apply();
    };

    /* ---------------------------------------------------------------------------------------------------------------*/
    /* Socket.io LISTENERS */

    /* Listener handlers. Listeners for multiple identical messages handled as follows: */
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
        // console.log('Join Success');

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

    /* ---------------------------------------------------------------------------------------------------------------*/
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
                location: $scope.currentRoom,
                messages: {
                    username: Data.user.username,
                    message: $scope.message,
                },
            });
            $scope.message = '';
        }
    };

    /* */
    const changeMarkers = function(result) {
        let packagedData = [{
            id: result.id,
            username: Data.user.username,
        }];

        socket.emit('changeMarkers', packagedData);
    };

    /* */
    const socketSendTimeRequest = function() {
        $scope.getLocation(function(currLoc) {
            socket.emit('calculateTransportTime', {
                source: currLoc,
                destination: resultLocations[$scope.selectedResultIndex],
            });
        });
    };

    function socketSendDetailsRequest() {
        socket.emit('getPlaceDetails', resultLocations[$scope.selectedResultIndex]);
    }

    /* -----------------------------------------------------------------------*/
    /* Functions called upon entry */

    $scope.joinRoom();
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

    /* ---------------------------------------------------------------------------------------------------------------*/
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

        resultLocations = room.results;

        for (i = 0; i < $scope.users.length; i++) {
            let radLoc = {
                'lat': $scope.users[i].lat,
                'lng': $scope.users[i].lng,
            };

            /* Initialise the marker */
            let marker = markUser(radLoc, $scope.users[i], map);

            /* Initialise the radius */
            let radius = initRadius(radLoc, $scope.users[i], map, marker);

            /* Add the radius to the map bounds in order to control the map
               zoom. */
            mapBounds = mapBounds.union(radius.getBounds());

            mapObjects.push(marker);
            mapObjects.push(radius);

            let userBubble = createUserInfoBubble($scope.users[i]);

            addHoveringListeners(map, marker, userBubble);
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
            document.getElementById('map').style.visibility = 'visible';
        }

        /* Update chat-room with the new results */
        addRooms();

        /* Update the map bounds to incorporate all users in the viewport. */
        map.fitBounds(mapBounds);
        $scope.mapHookCenter(true, 2);
    };

    /* InitMap helper functions: */
    const createMap = function(location) {
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

    /* Helper function to hook the map when expanding it to the left */
    $scope.mapHookCenter = function(sign, value) {
        if (map) {
            /* Credits to:
             * https://stackoverflow.com/questions/3437786/get-the-size-of-the-screen-current-web-page-and-browser-window */
            let ratio = 0;

            /* Determine the bootstrap environment and accordingly switch for the radius */
            switch(findBootstrapEnvironment()) {
                case 'lg':
                case 'md':
                    ratio = 4;
                    break;
                case 'sm':
                    ratio = 3;
                    break;
                case 'xs':
                    ratio = 1;
                    break;
            }

            ratio *= value;

            /* Scale accordingly if right navBar is open */
            if ($scope.sideRightBarShow) {
                ratio *= ratio;
                ratio *= ratio;
            }

            /* Adjust the sign for positive/negative shifts */
            if (!sign) {
                ratio *= -1;
            }

            /* Retrieve the current center form the map */
            let latlng = map.getCenter();

            /* Determine the offsets */
            let offsetx = $(window).width() / ratio;
            let offsety = 0;

            /* Mathemagical scaling magic */
            let scale = Math.pow(2, map.getZoom());

            /* Convert to real world locations and scale */
            let worldCoordinateCenter = map.getProjection().fromLatLngToPoint(latlng);
            let pixelOffset = new google.maps.Point((offsetx / scale) || 0, (offsety / scale) || 0);

            /* Create a new gMaps scale dpoint */
            let worldCoordinateNewCenter = new google.maps.Point(
                    worldCoordinateCenter.x - pixelOffset.x,
                    worldCoordinateCenter.y + pixelOffset.y
                    );

            /* Adjust that as a new centre */
            let newCenter = map.getProjection().fromPointToLatLng(worldCoordinateNewCenter);

            /* Apply the new center */
            map.setCenter(newCenter);
        }
    };

    /* TODO: Add comment */
    const markUser = function(location, user, map) {
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
        });

        return marker;
    };

    /* TODO: Add comment */
    const initRadius = function(location, user, map, marker) {
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
    const createDefaultInfoBubble = function() {
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

    /* Styles differently the user info bubble compared to the locations
     info bubble. */
    const createUserStyledInfoBubble = function() {
        return new InfoBubble({
            content: 'Madness',
            shadowStyle: 0,
            padding: 0,
            backgroundColor: 'rgb(236, 239, 241)',
            borderRadius: 35,
            arrowSize: 5,
            borderWidth: 1,
            borderColor: 'rgb(120, 144, 156)',
            minWidth: 80,
            maxWidth: 300,
            minHeight: 'calc(100% + 2px)',
            maxHeight: 80,
            disableAutoPan: true,
            hideCloseButton: true,
            disableAnimation: true,
            arrowPosition: 50,
            arrowStyle: 0,
            result: '',
        });
    };

    /* TODO: Add comment */
    const createLocationInfoBubble = function(index) {
        let infoBubble = createDefaultInfoBubble();

        infoBubble.index = index;
        infoBubble.locationBubble = true;

        return infoBubble;
    };

    /* Creates the info bubble which is displayed above the user's location. */
    const createUserInfoBubble = function(user) {
        let infoBubble = createUserStyledInfoBubble();

        infoBubble.content =
            '<div' +
            ' style=\"font-size: 140%;' +
            ' text-align: center;' +
            // ' background-color: #eceff1' +
            ' padding-top: 5px;' +
            ' padding-bottom: 5px;' + '\">' +
            '<img src="../../assets/images/user.png"/>' +
            '<p style="color: ' + user.color + '\">' +
            conditionalUsername(user) + '</p>' + '</div>';

        return infoBubble;
    };

    /* If the username of the user is too long, only display part of it in the
     user's info bubble. */
    const conditionalUsername = function(user) {
        if (user.username.length <= 10) {
            return user.username;
        } else {
            return user.username.substring(0, 7) + '...';
        }
    };

    /* TODO: Add comment */
    const markResult = function(result, map) {
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
        marker['website'] = result.website;
        marker['rating'] = result.rating;

        let request = {
            placeId: result.id,
        };

        service = new google.maps.places.PlacesService(map);
        service.getDetails(request, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                if (marker && place.photos) {
                    marker['photo'] = (place.photos[0].getUrl({maxWidth: 300}));
                }
            }
        });

        return marker;
    };

    /* TODO: Add comment */
    const createTypeIcon = function(type) {
        return {
            url: findImageByType(type),
            anchor: new google.maps.Point(11, 35),
            scaledSize: new google.maps.Size(20, 20),
        };
    };

    /* TODO: Add comment */
    const findImageByType = function(type) {
        let types = $scope.types;

        for (let i = 0; i < types.length; i++) {
            if (type === types[i].name.toLowerCase().split(' ').join('_')) {
                return types[i].image;
            }
        }
    };

    let pathToIcon = 'M238,0c-40,0-74,13.833-102,41.5S94,102.334,94,141c0,23.333,13.333,65.333,40,126s48,106,64,136s29.333,54.667,40,74c10.667-19.333,24-44,40-74s37.5-75.333,64.5-136S383,164.333,383,141c0-38.667-14.167-71.833-42.5-99.5S278,0,238,0L238,0z';

    /* TODO: Add comment */
    const createDefaultRedIcon = function() {
        return {
            path: pathToIcon,
            fillColor: '#ff3700',
            fillOpacity: 1,
            anchor: new google.maps.Point(250, 400),
            strokeWeight: 1,
            scale: .10,
        };
    };

    /* TODO: Add comment */
    const closeInfoBubble = function(infoBubble) {
        infoBubble.opened = false;
        infoBubble.close();
        lastOpenedInfoBubble = undefined;
    };

    /* TODO: Add comment */
    const markerAddInfo = function(map, marker, infoBubble) {
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

        /* Redirect clicks to the closing 'X' in infoBubbles */
        google.maps.event.addListener(infoBubble, 'closeclick', function() {
            closeInfoBubble(infoBubble);
        });

        addHoveringListeners(map, marker, infoBubble);
    };

    /* Adds listeners to the info bubble to monitor when a mouse is hovered
     over the marker. */
    const addHoveringListeners = function(map, marker, infoBubble) {
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
    /* ---------------------------------------------------------------------------------------------------------------*/
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

    /* ---------------------------------------------------------------------------------------------------------------*/
    /* Functions used in order to change colours of markers. */

    /*
     * Handles the chaning of the coloured dots above a marker
     * denoting a location.
     */
    const changeColoursOfMarkers = function(index, usersWhoClicked) {
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
    };

    /*
     * Clears the previous array of coloured dots on a specific location.
     */
    const clearPreviousColouredDots = function(currentMarker) {
        let colouredDots = currentMarker.colouredDots;

        for (let i = 0; i < colouredDots.length; i++) {
            colouredDots[i].setMap(null);
        }
    };

    /*
     * Finds the colour of the user who clicked on a specific location.
     */
    const findColourOfUserWhoClicked = function(username) {
        for (let i = 0; i < $scope.users.length; i++) {
            if ($scope.users[i].username === username) {
                return $scope.users[i].color;
            }
        }
    };

    /*
     * Generates a new coloured dot over the currentMarker at anchor offset.
     */
    const generateColouredDot = function(currentMarker, anchor, userWhoClicked) {
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
    };

    /* ---------------------------------------------------------------------------------------------------------------*/
    /* Functions to handle messages */

    /* checks if message was sent by the user */
    $scope.isMyMessage = (username) => {
        return username === Data.user.username;
    };

    /* Function to dynamically set height of chat bar */
    const setChatBodyHeight = () => {
        let height = 'calc(100vh - 170px - ' + ($('#chat-title').height() - 42).toString() + 'px)';
        // console.log(height);
        $('#message-board').css('height', height);
    };


    /* Functions to handle room entry */
    $scope.enterRoom = (index) => {
        let room = $scope.messageRooms[index].name;
        $scope.currentRoom = room;
        for (let i = 0; i < $scope.messages.length; i++) {
            if ($scope.messages[i].location === $scope.currentRoom) {
                $scope.roomMessages = $scope.messages[i].messages;
            }
        }
        $scope.insideRoom = true;
        $timeout(function() {
            setChatBodyHeight();
        }, 0, false);
    };

    /* Functions to handle room entry */
    $scope.exitRoom = (index) => {
        let room = $scope.currentRoom;
        $scope.roomMap.delete(room);
        $scope.currentRoom = 'Chat';
        $scope.roomMessages = [];
        addRooms();
        /* switch view to room */
        $scope.insideRoom = false;
        setChatBodyHeight();
    };

    const getImageURL = (type) => {
        let ts = angular.copy(Data.types);
        for (let i = 0; i < ts.length; i++) {
            let t = ts[i];
            t.name = t.name.split(' ').join('_').toLowerCase();
            if(t.name === type) {
                return t.image;
            }
        }
        return '';
    };

    const addRooms = () => {
        $scope.messageRooms = [{name: 'General', image: '', count: $scope.roomMap.get('General')}];
        resultLocations.forEach((l, i) => {
            if (l.users.length > 0) {
                let url = getImageURL(l.type);
                let count;
                if ($scope.roomMap.has(l.name)) {
                    count = $scope.roomMap.get(l.name);
                } else {
                    count = 0;
                    $scope.roomMap.set(l.name, 0);
                }
                $scope.messageRooms.push({
                    name: l.name,
                    image: url,
                    count: count,
                });
            }
        });
    };
    /* ---------------------------------------------------------------------------------------------------------------*/

    /*
     * This function is called when a user clicks on a type which has
     * already been selected as a search criteria. It fades out all markers
     * not belonging to the type.
     */
    // $scope.filterByType = filterByType;

    /*
     * Since functions are objects, a property has been added to this
     * function (lastSelectedType) to perform the functions of a static
     * variable (not changing between function calls).
     */
    $scope.filterByType = function(typeName) {
        let type = typeName.toLowerCase().split(' ').join('_');

        if ($scope.filterByType.lastSelectedTypes === undefined) {
            $scope.filterByType.lastSelectedTypes = [];
        }

        let index = $scope.filterByType.lastSelectedTypes.indexOf(type);

        if (index === (-1)) {
            $scope.filterByType.lastSelectedTypes.push(type);
        } else {
            $scope.filterByType.lastSelectedTypes.splice(index, 1);
        }

        for (let i = 0; i < markers.length; i++) {
            let fadeOutOpacity = 1;

            if ($scope.filterByType.lastSelectedTypes.length !== 0 &&
                    $scope.filterByType.lastSelectedTypes.indexOf(markers[i].type) === (-1)) {
                fadeOutOpacity = 0.2;
            }

            markers[i].setOpacity(fadeOutOpacity);
            markers[i].typeMarker.setOpacity(fadeOutOpacity);
            for (let j = 0; j < markers[i].colouredDots.length; j++) {
                markers[i].colouredDots[j].setOpacity(fadeOutOpacity);
            }
        }
    };

    /* TODO: Add comment */
    $scope.toggleHighlight = (index) => {
        /* Toggle is highlighted */
        $scope.types[index].isHighlighted = !$scope.types[index].isHighlighted;
    };
    /* ---------------------------------------------------------------------------------------------------------------*/
    /* Functions to handle accordion */

    /* Allow only one type at a type */
    $scope.setAccordionOptions = (type) => {
        if (type === 'options') {
            let height = document.getElementById('options-body').scrollHeight;
            $('#left-nav-options > .option > .panel-body').css('max-height', height.toString() + 'px');

            $('#left-nav-users > .user > .panel-body').css('max-height', '0px');
            $('#left-nav-credit > .credit > .panel-body').css('max-height', '0px');
        } else if(type === 'users') {
            let height = document.getElementById('users-body').scrollHeight;
            $('#left-nav-users > .user > .panel-body').css('max-height', height.toString() + 'px');

            $('#left-nav-options > .option > .panel-body').css('max-height', '0px');
            $('#left-nav-credit > .credit > .panel-body').css('max-height', '0px');
        } else if(type === 'credit') {
            let height = document.getElementById('credits-body').scrollHeight;
            $('#left-nav-credit > .credit > .panel-body').css('max-height', height.toString() + 'px');

            $('#left-nav-options > .option > .panel-body').css('max-height', '0px');
            $('#left-nav-users > .user > .panel-body').css('max-height', '0px');
        } else {
            // console.log('accordion type mismatch');
        }
    };

    /* ---------------------------------------------------------------------------------------------------------------*/
    /* Bootstrap helper functions */

    /* Determines the size of the current bootstrap environment.
     * Should be dynamic */
    const findBootstrapEnvironment = function() {
        /* Credits:
         * https://stackoverflow.com/questions/14441456/how-to-detect-which-device-view-youre-on-using-twitter-bootstrap-api */
        let envs = ['xs', 'sm', 'md', 'lg'];

        let $el = $('<div>');
        $el.appendTo($('body'));

        for (let i = envs.length - 1; i >= 0; i--) {
            let env = envs[i];

            $el.addClass('hidden-'+env);
            if ($el.is(':hidden')) {
                $el.remove();
                return env;
            }
        }
    };

    /* ---------------------------------------------------------------------------------------------------------------*/
    /* Side nav-bar helpers */

    /* Determine which size the map should have
     * All navbar elements increase the size of the map by one. Higher the 'size', the smaller the map.
     * Counter-intuitive? Yeah. */
    $scope.getMapSize = function() {
        let count = 0;

        /* Checks if the rightNavBar has been expanded */
        if ($scope.sideRightBarShow && !$scope.sideRightBarAnimating) {
            count ++;
        }

        /* Returns the determined count */
        return count;
    };

    /* Handles toggleing of rightNav */
    $scope.toggleRightNav = function() {
        if (!$scope.sideRightBarAnimating) {
            /* When rightNavbar is opened, refresh roomms */
            addRooms();

            /* Sets the rightNavBar to a true animating state */
            $scope.sideRightBarAnimating = true;

            /* Set the opening status accordingly and ng-show the navbar */
            $scope.sideRightBarOpening = !$scope.sideRightBarOpening;
            $scope.sideRightBarShow = true;

            /* Toggle the navBar into absolute mode for animating */
            $('#rightNav').toggleClass('right-nav-absolute');

            /* Accordingly set the animation to slide-in/out for the navbar */
            if ($scope.sideRightBarOpening) {
                $('.nav-right-animate').addClass('slide-in-right').removeClass('slide-out-right');
            } else {
                $('.nav-right-animate').addClass('slide-out-right').removeClass('slide-in-right');
            }
        }
    };

    /* Select the rightBavBar by ID to add listeners */
    rightNav = document.querySelector('#rightNav');

    /* Listener bound to animationStarts */
    rightNav.addEventListener('animationstart', function(e) {
        /* Triggered by the start of an animation. Might be useful in the future */
    }, false);

    /* Listener bound to animationEnds */
    rightNav.addEventListener('animationend', function(e) {
        /* Only update if the animation is for slide */
        if (e.animationName === 'slide-in-right' || e.animationName === 'slide-out-right') {
            /* Trigger the ng-show of the navBar. If it was closing, hide it */
            $scope.sideRightBarShow = $scope.sideRightBarOpening;

            /* Sets the rightNavBar to a false animating state */
            $scope.sideRightBarAnimating = false;

            /* Remove absolute properties from the navBar. Needed for animation */
            $('#rightNav').toggleClass('right-nav-absolute');

            /* Apply the changes to the scope. Triggers ng-shows */
            $scope.$apply();
        }
    });

    /* ---------------------------------------------------------------------------------------------------------------*/

    /* Handles toggleing of leftNav */
    $scope.toggleLeftNav = function() {
        if (!$scope.sideLeftBarAnimating) {
            /* Recalculated the map's centre in order to hook it.
             * This prevents the map from being shifted after the recalculation of the navBar */
            // if ($scope.sideLeftBarShow) {
            //     $scope.mapHookCenter(true, 1);
            // }

            /* Sets the leftNavBar to a true animating state */
            $scope.sideLeftBarAnimating = true;

            /* Set the opening status accordingly and ng-show the navbar */
            $scope.sideLeftBarOpening = !$scope.sideLeftBarOpening;
            $scope.sideLeftBarShow = true;

            /* Toggle the navBar into absolute mode for animating */
            $('#leftNav').toggleClass('left-nav-absolute');

            /* Accordingly set the animation to slide-in/out for the navbar */
            if ($scope.sideLeftBarOpening) {
                $('.nav-left-animate').addClass('slide-in-left').removeClass('slide-out-left');
            } else {
                $('.nav-left-animate').addClass('slide-out-left').removeClass('slide-in-left');
            }
        }
    };

    /* Select the leftBavBar by ID to add listeners */
    leftNav = document.querySelector('#leftNav');

    /* Listener bound to animationStarts */
    leftNav.addEventListener('animationstart', function(e) {
        /* Triggered by the start of an animation. Might be useful in the future */
    }, false);

    /* Listener bound to animationEnds */
    leftNav.addEventListener('animationend', function(e) {
        /* Only update if the animation is for slide */
        if (e.animationName === 'slide-in-left' || e.animationName === 'slide-out-left') {
            /* Trigger the ng-show of the navBar. If it was closing, hide it */
            $scope.sideLeftBarShow = $scope.sideLeftBarOpening;

            /* Recalculated the map's centre in order to hook it.
             * This prevents the map from being shifted after the recalculation of the navBar */
            // if ($scope.sideLeftBarShow) {
            //     $scope.mapHookCenter(false, 1);
            // }

            /* Sets the leftNavBar to a false animating state */
            $scope.sideLeftBarAnimating = false;

            /* Remove absolute properties from the navBar. Needed for animation */
            $('#leftNav').toggleClass('left-nav-absolute');

            /* Apply the changes to the scope. Triggers ng-shows */
            $scope.$apply();
            $scope.setAccordionOptions('options');
        }
    });

    /* ---------------------------------------------------------------------------------------------------------------*/
    /* Functions called upon entry */

    /* Initialise the username field */
    Data.user.username = Data.updateUsername();

    directionsDisplay = new google.maps.DirectionsRenderer(
            {
                suppressMarkers: true,
            });
    directionsService = new google.maps.DirectionsService;

    /* Precompile HTML files for infoBubble */
    compiledSelectedHTML = $compile(generateInfoBubbleTemplate('selectedResultIndex'))($scope);
    compiledHoveredHTML = $compile(generateInfoBubbleTemplate('hoveredResultIndex'))($scope);

    /* Joins the given socket.IO room */
    $scope.joinRoom();

    /* Upon Entry, toggle the Left NavBar to be opened */
    $scope.toggleLeftNav();

    $scope.getLocation(function(currLoc) {
        map = createMap(currLoc);
        directionsDisplay.setMap(map);

        /* Add click event listener. Used to allow user to change their
           location just by clicking. */
        google.maps.event.addListener(map, 'dblclick', function(event) {
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

        google.maps.event.addListenerOnce(map, 'idle', function() {
            /* Triggered on complete initialisation */
            /* map.addListener('center_changed', function() {
               console.log('Centre Changed');
               }); */
        });

        google.maps.event.addListenerOnce(map, 'projection_changed', function() {
            /* Triggered when projection viewport can be called */
        });
    });

    /* ---------------------------------------------------------------------------------------------------------------*/
});

/* */
app.controller('modalController', function($scope, $location) {
    $scope.message = location.href;
});

