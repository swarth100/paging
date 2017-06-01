/* Controllers for register.html */

/* The following controller is used to submit the loginForm to /users/register
 * The returned address is used to redirect to the correct failure/passing page */
app.controller('registerFormCtrl', function($scope, $location, $http) {
    /* For default text */
    $scope.master = {};

    $scope.submit = function() {
        $http.post('/users/register', {
            name: $scope.name,
            username: $scope.username,
            email: $scope.email,
            password: $scope.password,
            password2: $scope.password2,
        }).then(function(response) {
                /* Data is packaged into a nasty JSON format.
                 * To access it first one must retrieve the *.data part to distinguish from header */
                $location.url('/login');
            }, function(response) {
                console.log('Failure when accessing /users/register');
                $location.url('/register');
            });
    };
});
