angular.module('paging').controller('FormController', ['$scope', function($scope) {
  $scope.location = 'Current Location';
  $scope.datetime = '';
  $scope.duration = 1;
  $scope.radius = 2;
  $scope.submitFields = () => {
    alert('Hello');
  };
}]);
