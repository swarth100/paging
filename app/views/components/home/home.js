/* */

/* Controller to handle the search bar on the home screen */
app.controller('homeCtrl',
    function($scope, $filter, $http, $location, $sessionStorage, NgMap) {
    /* Initialises the following fields to the following default values */

    $scope.setDate = function() {
        console.log($scope.tmpTime);
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
        $scope.tmpDate = new Date();
        $scope.tmpTime = new Date();
        /* There is no session storage, initialise the fields */
        $scope.homeSearch = {
            location: '',
            datetime: '',
            duration: 60,
            radius: 1000,
            selectedTypes: [],
        };
        $scope.setDate();
        $sessionStorage.queryData = $scope.homeSearch;
        $sessionStorage.date = $scope.tmpDate;
        $sessionStorage.time = $scope.tmpTime;
    } else {
        /* There is session storage, set the temp time using datetime as it removes the functions */
        $scope.tmpDate = new Date($sessionStorage.date);
        $scope.tmpTime = new Date($sessionStorage.time);
        $scope.homeSearch = $sessionStorage.queryData;
    }

    if(!$sessionStorage.types) {
        $scope.types = [
            {
                name: 'Amusement Park',
                image: '../../assets/images/types/amusement_park.png',
                isSelected: false,
            },
            {
                name: 'Art Gallery',
                image: '../../assets/images/types/art_gallery.png',
                isSelected: false,
            },
            {
                name: 'Museum',
                image: '../../assets/images/types/museum.png',
                isSelected: false,
            },
            {
                name: 'Aquarium',
                image: '../../assets/images/types/aquarium.png',
                isSelected: false,
            },
            {
                name: 'Bar',
                image: '../../assets/images/types/bar.png',
                isSelected: false,
            },
            {
                name: 'Cafe',
                image: '../../assets/images/types/cafe.png',
                isSelected: false,
            },
            {
                name: 'Bowling Alley',
                image: '../../assets/images/types/bowling.png',
                isSelected: false,
            },
            {
                name: 'Casino',
                image: '../../assets/images/types/casino.png',
                isSelected: false,
            },
            {
                name: 'Zoo',
                image: '../../assets/images/types/zoo.png',
                isSelected: false,
            },
            {
                name: 'Night Club',
                image: '../../assets/images/types/night_club.png',
                isSelected: false,
            },
            {
                name: 'Shopping Mall',
                image: '../../assets/images/types/mall.png',
                isSelected: false,
            },
            {
                name: 'Restaurant',
                image: '../../assets/images/types/restaurant.png',
                isSelected: false,
            },
            {
                name: 'Gym',
                image: '../../assets/images/types/gym.png',
                isSelected: false,
            },
            {
                name: 'Movie Theater',
                image: '../../assets/images/types/cinema.png',
                isSelected: false,
            },
            {
                name: 'Park',
                image: '../../assets/images/types/park.png',
                isSelected: false,
            },
            {
                name: 'Spa',
                image: '../../assets/images/types/spa.png',
                isSelected: false,
            },
            {
                name: 'Bakery',
                image: '../../assets/images/types/bakery.png',
                isSelected: false,
            },
            {
                name: 'Library',
                image: '../../assets/images/types/library.png',
                isSelected: false,
            },
        ];
        $sessionStorage.types = $scope.types;
    } else {
        $scope.types = $sessionStorage.types;
    }

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
        $sessionStorage.types = $scope.types;
    };

    $scope.editOptions = (type) => {
        let lcName = type.name.toLowerCase();
        if(!type.isSelected) {
            $scope.homeSearch.selectedTypes.push(lcName);
            type.isSelected = true;
        } else {
            let index = $scope.homeSearch.selectedTypes.indexOf(lcName);
            $scope.homeSearch.selectedTypes.splice(index, 1);
            type.isSelected = false;
        }
        console.log($scope.homeSearch.selectedTypes);
    };
});
