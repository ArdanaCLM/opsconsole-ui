// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';
    var p = ng.module('plugins');
    p.controller('LoggingController', ['$scope', '$rootScope' ,'$window', '$http','$location',
        function ($scope, $rootScope, $window, $http,  $location) {

            var get_logging_base_url = function() {
                var protocol = $location.protocol();
                var host = $location.host();
                var delimeter =":";
                var separator = "//";
                var port = "5601"; //default port
                var new_url = protocol + delimeter + separator + host + delimeter + port +"/";
                return new_url;
            };

            //Integrated Logging URL
            //on production it could be http://192.168.139.18:5601
            //on dev it could be index.html#/dashboard/file/logstash.json
            $scope.redirectToLoggingInterface = function() {
                var new_url;
                var inputUrl= $rootScope.appConfig.integerated_logging_url;
                //it is a full url, use it as it is
                if(angular.isDefined(inputUrl) && inputUrl.indexOf('http') !== -1){
                    new_url = inputUrl;
                } else { //it is a partial url, assemble one
                    new_url = get_logging_base_url() + inputUrl;
                }
                $window.open(new_url, "_blank");
            };

            //Integrated audit logging URL
            //http://localhost:81/#/dashboard/file/audit
            $scope.redirectToAuditInterface = function() {
                var new_url = get_logging_base_url()  + $rootScope.appConfig.integerated_audit_url;
                $window.open(new_url, "_blank");
            };
        }
    ]);
})(angular);