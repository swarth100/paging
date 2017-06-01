/* Redirects upon entry to the correct screen */
app.controller('indexRedirect', function($http, $location) {
    $http.get('/users/index')
        .then(function(response) {
            /* Data is packaged into a nasty JSON format.
             * To access it first one must retrieve the *.data part to distinguish from header */
            $location.url(response.data.url);
        }, function(response) {
            console.log('Failure when accessing /users/index');
        });
});