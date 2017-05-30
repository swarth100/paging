let app = angular.module('paging', []);

app.config(function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);

    $routeProvider
        .when('/',
            {
                templateUrl: 'components/home/home.html',
            })
        .when('/login',
            {
                templateUrl: 'components/login/login.html',
            })
        .when('/register',
            {
                templateUrl: 'components/register/register.html',
            })
        .otherwise( );

    /* TODO: Handle default redirection */
    // .otherwise( {redirectTo: '/'} );
});
