/* Controller to handle the search bar on the home screen */
app.controller('homeCtrl',
    function($scope, $filter, $http, $location, Data, NgMap) {
    $scope.setDate = function() {
        $scope.homeSearch.datetime = $filter('date')(new Date(
            $scope.tmpDate.getFullYear(),
            $scope.tmpDate.getMonth(),
            $scope.tmpDate.getDate(),
            $scope.tmpTime.getHours(),
            $scope.tmpTime.getMinutes()
        ), 'yyyy-MM-dd HH:mm');
        Data.query.datetime = $scope.homeSearch.datetime;
    };

    /* Initialises the following fields to the following default values */
    $scope.tmpDate = new Date();
    $scope.tmpTime = new Date();
    $scope.homeSearch = Data.query;
    $scope.types = Data.types;
    $scope.setDate();

    $scope.unitWidth = () => {
        width = $scope.homeSearch.radius > 0 ? $scope.homeSearch.radius.toString().length * 10 + 15 : 25;
        return {'width': width + 'px'};
    };

    $scope.submitFields = () => {
        $scope.$broadcast('submit');

        /*  */
        $http.get('/users/roomID')
            .then(function(response) {
                /* Iterate through all types to see if they are all non-selected */
                let noTypes = true;
                for (let i = 0; i < Data.types.length; i ++) {
                    if (Data.types[i].isSelected) {
                        noTypes = false;
                        break;
                    }
                }

                /* If no type has been selected, default to cafes */
                if (noTypes) {
                    Data.types[5].isSelected = true;
                }

                /* Data is packaged into a nasty JSON format.
                 * To access it first one must retrieve the *.data part to distinguish from header */
                $location.url('/app/' + response.data);
            }, function(response) {
                console.log('Failure when accessing users/roomID');
            });
    };

    $scope.editOptions = (type) => {
        type.isSelected = !type.isSelected;
    };
});
