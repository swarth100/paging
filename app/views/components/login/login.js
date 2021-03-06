/* Controllers for login.html */

/* The following controller is used to submit the loginForm to /users/login
 * The returned address is used to redirect to the correct failure/passing page */
app.controller('loginFormCtrl', function($scope, $location, $http, $localStorage) {
    /* For default text */
    $scope.master = {};

    $scope.alerts = [];

    /* Closes the alert */
    $scope.closeAlert = function() {
        $scope.alerts.splice(0, 1);
    };

    $scope.register = function() {
        $location.url('/register');
    };

    $scope.submit = function() {
        $http.post('/users/login', {username: $scope.username, password: $scope.password})
            .then(function(response) {
                $localStorage.isLoggedIn = true;
                $localStorage.username = $scope.username;
                $localStorage.name = response.data.name;
                $localStorage.email = response.data.email;
                $location.url('/');
            }, function(response) {
                $scope.alerts[0] = ({msg: 'Invalid username or password'});
            });
    };
});
