/* */

/* Controller to handle the search bar on the home screen */
app.controller('homeCtrl', function($scope, $filter, $http, $location, $sessionStorage) {
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
            type: [],
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

    /* TODO: Try to make this work using GoogleMaps/AngularJS! */
    let searchBox = new google.maps.places.SearchBox(document.getElementById('searchBox'));
    searchBox.addListener('places_changed', function() {
        // Get all the information from the search box.
        let temporaryResult = searchBox.getPlaces();
        // Find the long name of the specified location and use it for the
        // search.
        $scope.homeSearch.location = temporaryResult[0].address_components[0].long_name;
    });
    $scope.submitFields = () => {
        $scope.$broadcast('submit');

        /*  */
        $http.get('/users/roomID')
            .then(function(response) {
                /* Data is packaged into a nasty JSON format.
                 * To access it first one must retrieve the *.data part to distinguish from header */
                $location.url('/app/' + response.data);
            }, function(response) {
                console.log('Failure when accessing users/roomID');
            });
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
