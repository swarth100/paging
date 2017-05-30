angular.module('paging', []).controller('MainController', function($scope, $filter) {
    $scope.location = 'Current Location';
    $scope.datetime = $filter('date')(new Date(), 'yyyy-MM-dd HH:mm');
    $scope.duration = 60;
    $scope.radius = 1000;
    $scope.submitFields = () => {
        $scope.$broadcast('submit');
    };
});
