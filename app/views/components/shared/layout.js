app.controller('layoutController', function($scope, $location, $http, $localStorage) {
    $scope.getEmail = () => {
        return $localStorage.email;
    };
    $scope.getName = () => {
        return $localStorage.name;
    };
    $scope.getUserName = () => {
        return $localStorage.username;
    };
    $scope.isLoggedIn = () => {
        return $localStorage.isLoggedIn;
    };
    $scope.logout = function() {
        $localStorage.isLoggedIn = false;
        $localStorage.username = '';
        $localStorage.name = '';
        $localStorage.email = '';
        $http.get('/users/logout')
            .then(function(response) {
                $location.url('/');
            }, function(response) {
                $location.url('/');
            });
    };
});
