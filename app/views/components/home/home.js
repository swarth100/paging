/* */

/* Controller to handle the search bar on the home screen */
app.controller('homeController', function($scope, $filter, $http, $location, $sessionStorage) {
    /* Initialises the following fields to the following default values */
    $scope.setDate = function() {
        $scope.homeSearch.datetime = $filter('date')(new Date(
            $scope.tmpDate.getFullYear(),
            $scope.tmpDate.getMonth(),
            $scope.tmpDate.getDate(),
            $scope.tmpTime.getHours(),
            $scope.tmpTime.getMinutes()
        ), 'yyyy-MM-dd HH:mm');
    };
    if (!$sessionStorage.queryData) {
        $scope.homeSearch = {
            location: 'Current Location',
            datetime: '',
            duration: 60,
            radius: 1000,
            type: 'cafe',
        };

        $scope.tmpDate = new Date();
        $scope.tmpTime = new Date();
        $scope.setDate();

        $sessionStorage.queryData = $scope.homeSearch;
   } else {
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
