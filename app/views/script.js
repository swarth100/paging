angular.module('paging', []).controller('MainController', function($scope) {
    $scope.location = 'Current Location';
    $scope.datetime = '';
    $scope.duration = 1;
    $scope.radius = 3;
});
