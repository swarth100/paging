let app = angular.module('paging', []);

app.controller('MainController', function($scope, $filter) {
    $scope.location = 'Current Location';
    $scope.datetime = $filter('date')(new Date(), 'yyyy-MM-dd HH:mm');
    $scope.duration = 60;
    $scope.radius = 1000;
    $scope.submitFields = () => {
        $scope.$broadcast('submit');
    };

app.config(function ($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);

    $routeProvider
        .when('/',
            {
                templateUrl: 'components/home/home.html'
            })
        .when('/login',
            {
                templateUrl: 'components/login/login.html'
            })
        .when('/register',
            {
                templateUrl: 'components/register/register.html'
            })
        .otherwise( {redirectTo: '/'});
});
