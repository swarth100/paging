/* Controllers for login.html */

/* The following controller is used to submit the loginForm to /users/login
 * The returned address is used to redirect to the correct failure/passing page */
app.controller('loginFormCtrl', function($scope, $location, $http) {
    /* For default text */
    $scope.master = {};

    $scope.submit = function() {
        $http.post('/users/login', {username: $scope.username, password: $scope.password})
            .then(function(response) {
                /* Data is packaged into a nasty JSON format.
                 * To access it first one must retrieve the *.data part to distinguish from header */
                $location.url(response.data.url);
            }, function(response) {
                console.log('Failure when accessing /users/login');
            });
    };
});
