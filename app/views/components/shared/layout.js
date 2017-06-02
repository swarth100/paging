app.controller('layoutController', function($scope, $filter, LoginData) {
    $scope.loginData = LoginData;
    console.log($scope.loginData);
});
