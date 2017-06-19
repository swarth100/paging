/* Controller to handle the search bar on the home screen */
app.controller('homeCtrl', function($scope, $filter, $http, $location, Data, NgMap) {
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
    $scope.dropdownOpen = false;

    $scope.unitWidth = () => {
        width = $scope.homeSearch.radius > 0 ? $scope.homeSearch.radius.toString().length * 10 + 15 : 25;
        width += 36;
        return {'width': width + 'px'};
    };

    /* ---------------------------------------------------------------------------------------------------------------*/
    /* */

    /* */
    $scope.isSmallScreen = function() {
        switch (findBootstrapEnvironment()) {
            case 'sm':
            case 'xs':
                return true;
        }
        return false;
    };

    /* Determines the size of the current bootstrap environment.
     * Should be dynamic */
    const findBootstrapEnvironment = function() {
        /* Credits:
         * https://stackoverflow.com/questions/14441456/how-to-detect-which-device-view-youre-on-using-twitter-bootstrap-api */
        let envs = ['xs', 'sm', 'md', 'lg'];

        let $el = $('<div>');
        $el.appendTo($('body'));

        for (let i = envs.length - 1; i >= 0; i--) {
            let env = envs[i];

            $el.addClass('hidden-'+env);
            if ($el.is(':hidden')) {
                $el.remove();
                return env;
            }
        }
    };

    /* ---------------------------------------------------------------------------------------------------------------*/
    /* */

    /* */
    $scope.dropDownToggle = function() {
        /* Clicks on the button disable body overflowing temporarily */
        $('#body').toggleClass('hide-overflow');

        console.log($scope.isSmallScreen());

        $scope.dropdownOpen = !$scope.dropdownOpen;
        $('.search-top-sm').removeClass('lower-search-bar-sm').addClass('raise-search-bar-sm');
    };

    /* 'raise-search-bar': dropdownOpen && !isSmallScreen(), 'lower-search-bar': !dropdownOpen && !isSmallScreen(), 'raise-search-bar-sm': dropdownOpen && isSmallScreen(), 'lower-search-bar-sm': !dropdownOpen && isSmallScreen() */

    /* */
    $(document).click(function() {
        console.log($scope.dropdownOpen);
        if ($scope.dropdownOpen) {
            $('.search-top-sm').removeClass('raise-search-bar-sm').addClass('lower-search-bar-sm');
        }
    });

    /* ---------------------------------------------------------------------------------------------------------------*/
    /* */

    /* */
    $(window).resize(function() {
        $scope.$apply();
    });

    /* ---------------------------------------------------------------------------------------------------------------*/
    /* */

    /* Select the leftBavBar by ID to add listeners */
    let searchBar = document.querySelector('#search-bar');

    /* Listener bound to animationStarts */
    searchBar.addEventListener('animationstart', function(e) {
        /* Must check in case animation was triggered by offClick and not by button click */
        if (!$('#body').hasClass('hide-overflow')) {
            $('#body').toggleClass('hide-overflow');
        }
    }, false);

    /* Listener bound to animationEnds */
    searchBar.addEventListener('animationend', function() {
        $('#body').toggleClass('hide-overflow');
    }, false);

    /* ---------------------------------------------------------------------------------------------------------------*/
    /* */

    /* */
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

    /* ---------------------------------------------------------------------------------------------------------------*/
    /* */

    /* */
    $scope.editOptions = (type) => {
        type.isSelected = !type.isSelected;
    };

    /* ---------------------------------------------------------------------------------------------------------------*/
});
