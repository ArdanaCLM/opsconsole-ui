// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';

    ng.module('operations-ui').controller('SearchDrawerController',
        [
            '$scope',
            '$translate',
            'bllApiRequest',
            'addNotification',
            function ($scope, $translate, bllApiRequest, addNotification) {

                // clear the search box

                $scope.clearSearch = function () {
                    $scope.searchText = "";
                };

                // Initiate the search

                $scope.search = function () {
                    $scope.searchStatus = "Searching for " + $scope.searchText + "...";

                    // initiate the search
                    
                    bllApiRequest.get("search", $scope.searchText).then(
                        function (data) {//this is the method called when the bll call is successful
                            $scope.searchResults = data.data;
                        },
                        function (error_data) {//this is the method called when the bll call fails with error
                            console.log("-------search-----------------  ERROR" + JSON.stringify(error_data));
                            addNotification('error', 'Search failed');
                        },
                        function (progress_data) {//this is the method called when the bll call updates status
                            console.log("-------search----------------- IN PROGRESS: " + progress_data.progress.percentComplete);
                        }
                    );
                };

            }
        ]);
})(angular);
