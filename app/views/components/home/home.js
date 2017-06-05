/* */

/* Controller to handle the search bar on the home screen */
app.controller('homeController', function($scope, $filter, $http, $location, $sessionStorage, socket) {
    socket.on('connect', (data) => {
        socket.join('hello-world');
        socket.broadcast('hello-world', 'messages', 'broadcast');
    });
    socket.on('messages', function(data) {
        console.log('Incoming message:', data);
    });
    /* Initialises the following fields to the following default values */
    $scope.setDate = function() {
        $scope.homeSearch.datetime = $filter('date')(new Date(
            $scope.tmpDate.getFullYear(),
            $scope.tmpDate.getMonth(),
            $scope.tmpDate.getDate(),
            $scope.tmpTime.getHours(),
            $scope.tmpTime.getMinutes()
        ), 'yyyy-MM-dd HH:mm');
        $sessionStorage.date = $scope.tmpDate;
        $sessionStorage.time = $scope.tmpTime;
    };
    if (!$sessionStorage.queryData) {
        /* There is no session storage, initialise the fields */
        $scope.tmpDate = new Date();
        $scope.tmpTime = new Date();
        $scope.homeSearch = {
            location: 'Current Location',
            datetime: '',
            duration: 60,
            radius: 1000,
            type: 'cafe',
        };
        $scope.setDate();
        $sessionStorage.queryData = $scope.homeSearch;
        $sessionStorage.date = $scope.tmpDate;
        $sessionStorage.time = $scope.tmpTime;
    } else {
        /* There is session storage, set the temp time using datetime as it removes the functions */
        $scope.tmpDate = $sessionStorage.date;
        $scope.tmpTime = $sessionStorage.time;
        $scope.homeSearch = $sessionStorage.queryData;
    }
    $scope.submitFields = () => {
        $scope.$broadcast('submit');
        $location.url('/app');
    };

    $scope.handleClick = () => {
        $sessionStorage.queryData = $scope.homeSearch;
    };

    $scope.types = [
        {
            type: 'Amusment Park',
            image: '../../assets/images/types/amusement_park.png',
        },
        {
            type: 'Art Gallery',
            image: '../../assets/images/types/art_gallery.png',
        },
        {
            type: 'Museum',
            image: '../../assets/images/types/museum.png',
        },
        {
            type: 'Aquarium',
            image: '../../assets/images/types/aquarium.png',
        },
        {
            type: 'Bar',
            image: '../../assets/images/types/bar.png',
        },
        {
            type: 'Cafe',
            image: '../../assets/images/types/cafe.png',
        },
        {
            type: 'Bowling Alley',
            image: '../../assets/images/types/bowling.png',
        },
        {
            type: 'Casino',
            image: '../../assets/images/types/casino.png',
        },
        {
            type: 'Zoo',
            image: '../../assets/images/types/zoo.png',
        },
        {
            type: 'Night Club',
            image: '../../assets/images/types/night_club.png',
        },
        {
            type: 'Shopping Mall',
            image: '../../assets/images/types/mall',
        },
        {
            type: 'Restaurant',
            image: '../../assets/images/types/restaurant.png',
        },
        {
            type: 'Gym',
            image: '../../assets/images/types/gym.png',
        },
        {
            type: 'Cinema',
            image: '../../assets/images/types/cinema.png',
        },
        {
            type: 'Park',
            image: '../../assets/images/types/park.png',
        },
        {
            type: 'Spa',
            image: '../../assets/images/types/spa.png',
        },
        {
            type: 'Landmarks',
            image: '../../assets/images/types/landmarks.png',
        },
        {
            type: 'Library',
            image: '../../assets/images/types/library.png',
        },
    ];
});
