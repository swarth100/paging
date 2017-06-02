app.controller('layoutController', function($scope, $location, $http, LoginData) {
    $scope.loginData = LoginData;
    $scope.logout = function() {
        $scope.loginData.isLoggedIn = false;
        $http.get('/users/logout')
            .then(function(response) {
                $location.url('/');
            }, function(response) {
                $location.url('/');
            });
    };
});
