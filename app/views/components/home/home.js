/* */

/* Controller to handle the search bar on the home screen */
app.controller('homeController', function($scope, $filter, $http, $location, $sessionStorage, socket) {
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
});
