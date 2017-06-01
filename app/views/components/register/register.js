/* Controllers for register.html */

/* The following controller is used to submit the loginForm to /users/register
 * The returned address is used to redirect to the correct failure/passing page */
app.controller('registerFormCtrl', function($scope, $location, $http) {
    /* For default text */
    $scope.master = {};

    $scope.alerts = [];

    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.submit = function() {
        $scope.alerts = [];
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
                $scope.password = '';
                $scope.password2 = '';

                for (let i = 0; i < response.data.length; i ++) {
                    $scope.alerts.push(response.data[i]);
                }
            });
    };
});
