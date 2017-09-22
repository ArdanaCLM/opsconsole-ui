// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';

    var p = ng.module('plugins');

    p.controller('BllTestController', ['$scope', '$rootScope', 'bllApiRequest',
        function ($scope, $rootScope, bllApiRequest) {

            var initData = function() {
                var default_data = {"api_version":"v1"};
                $scope.bll_request_body_content = JSON.stringify(default_data, null, 3);
                $scope.bll_x_auth_token = $rootScope.auth_token;
                $scope.bll_response_body_content = "";
                $scope.bll_target = "ldap_service";
                $scope.bll_operation = "get_settings";
            };

            // Make the BLL call and update the response section
            $scope.testBll = function(){
                var data;
                try {
                    data = JSON.parse($scope.bll_request_body_content);
                } catch (e) {
                    $scope.bll_response_body_content = "JSON parse Error- " + e.message;
                    return;
                }
                // add operation to data
                var operation = $scope.bll_operation;
                data.operation = operation;
                var service = $scope.bll_target;
                bllApiRequest.get(service, data).then(function(res) {
                    $scope.bll_response_body_content = JSON.stringify(res, null, 3);
                }, function(error) {
                    $scope.bll_response_body_content = "BLL Error: \n" + JSON.stringify(res, null, 3);
                    addNotification("error", $translate.instant("bll_test.update_response_error"));
                });
            };

            if($rootScope.auth_token) {
                initData();
            }

        }]);
})(angular);
