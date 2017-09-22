// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(ng) {
    'use strict';

    ng.module('operations-ui').controller('MastheadDrillDownController',
    [
        '$scope',
        '$rootScope',
        '$http',
        'getLocale',
        'baseUrl',
        '$location',
        '$window',
        'hideActiveMastheadPopover',
        function($scope, $rootScope, $http, getLocale, baseUrl, $location, $window,
                 hideActiveMastheadPopover) {

            $scope.openTenantConsole = function() {
                var new_url;
                new_url = $rootScope.appConfig.tenant_console_url;
                $window.open(new_url, "_blank");
                hideActiveMastheadPopover();
            };

            $scope.openApplicationConsole = function() {
                // var new_url;
                //new_url = $rootScope.appConfig.tenant_console_url;
                // $window.open(new_url, "_blank");
            };

            $scope.openCicdConsole = function() {
                // var new_url;
                //new_url = $rootScope.appConfig.tenant_console_url;
                // $window.open(new_url, "_blank");
            };

            $scope.openLifecycleConsole = function() {
                // var new_url;
                //new_url = $rootScope.appConfig.tenant_console_url;
                // $window.open(new_url, "_blank");
            };

            $scope.openLoggingConsole = function() {
                var new_url;
                new_url = $rootScope.appConfig.integerated_logging_url;
                $window.open(new_url, "_blank");
                hideActiveMastheadPopover();
            };

            $scope.openTimeSeriesConsole = function() {
                // var new_url;
                // new_url = $rootScope.appConfig.tenant_console_url;
                // $window.open(new_url, "_blank");
            };

        }

    ]);

})(angular);