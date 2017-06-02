/* */

/* Controller to handle the search bar on the home screen */
app.controller('homeController', function($scope, $filter, $http, $location, Search) {
    $scope.homeSearch = Search;

    $scope.tmpDate = new Date();
    $scope.tmpTime = new Date();

    /* Initiaalises the following fields to the following default values */
    $scope.homeSearch.location = 'Current Location';
    $scope.homeSearch.datetime = '';
    $scope.homeSearch.duration = 60;
    $scope.homeSearch.radius = 1000;
    $scope.homeSearch.type = 'cafe';

    $scope.setDate = function() {
        $scope.homeSearch.datetime = $filter('date')(new Date(
            $scope.tmpDate.getFullYear(),
            $scope.tmpDate.getMonth(),
            $scope.tmpDate.getDate(),
            $scope.tmpTime.getHours(),
            $scope.tmpTime.getMinutes()
        ), 'yyyy-MM-dd HH:mm');
    };

    $scope.setDate();

    $scope.submitFields = () => {
        $scope.$broadcast('submit');
        $location.url('/app');
    };
});
