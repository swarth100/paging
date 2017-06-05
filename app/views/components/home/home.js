/* */

/* Controller to handle the search bar on the home screen */
app.controller('homeController', function($scope, $filter, $http, $location, $sessionStorage, socket) {
    $scope.homeSearch = Search;

    $scope.tmpDate = new Date();
    $scope.tmpTime = new Date();

    /* Initialises the following fields to the following default values */
    $scope.homeSearch.location = 'Current Location';
    $scope.homeSearch.datetime = '';
    $scope.homeSearch.duration = 60;
    $scope.homeSearch.radius = 1000;
    $scope.homeSearch.type = [];

    socket.on('connect', (data) => {
        socket.join('hello-world');
        socket.broadcast('hello-world', 'messages', 'broadcast');
    });
    socket.on('messages', function(data) {
        console.log('Incoming message:', data);
    });

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

    $scope.editOptions = (name) => {
        let index = $scope.homeSearch.type.indexOf(name);
        if(index == -1) {
            $scope.homeSearch.type.push(name);
        } else {
            $scope.homeSearch.type.splice(index, 1);
        }
    };

    $scope.types = [
        {
            name: 'Amusment Park',
            image: '../../assets/images/types/amusement_park.png',
        },
        {
            name: 'Art Gallery',
            image: '../../assets/images/types/art_gallery.png',
        },
        {
            name: 'Museum',
            image: '../../assets/images/types/museum.png',
        },
        {
            name: 'Aquarium',
            image: '../../assets/images/types/aquarium.png',
        },
        {
            name: 'Bar',
            image: '../../assets/images/types/bar.png',
        },
        {
            name: 'Cafe',
            image: '../../assets/images/types/cafe.png',
        },
        {
            name: 'Bowling Alley',
            image: '../../assets/images/types/bowling.png',
        },
        {
            name: 'Casino',
            image: '../../assets/images/types/casino.png',
        },
        {
            name: 'Zoo',
            image: '../../assets/images/types/zoo.png',
        },
        {
            name: 'Night Club',
            image: '../../assets/images/types/night_club.png',
        },
        {
            name: 'Shopping Mall',
            image: '../../assets/images/types/mall.png',
        },
        {
            name: 'Restaurant',
            image: '../../assets/images/types/restaurant.png',
        },
        {
            name: 'Gym',
            image: '../../assets/images/types/gym.png',
        },
        {
            name: 'Cinema',
            image: '../../assets/images/types/cinema.png',
        },
        {
            name: 'Park',
            image: '../../assets/images/types/park.png',
        },
        {
            name: 'Spa',
            image: '../../assets/images/types/spa.png',
        },
        {
            name: 'Landmarks',
            image: '../../assets/images/types/landmarks.png',
        },
        {
            name: 'Library',
            image: '../../assets/images/types/library.png',
        },
    ];
});
