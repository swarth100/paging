/* Redirects upon entry to the correct screen */
app.controller('indexRedirect', function($http, $location) {
    $location.url('/home');
});