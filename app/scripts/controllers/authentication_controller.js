// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(ng) {
    'use strict';

    ng.module('operations-ui')
        .controller('AuthenticationController', ['$scope', '$rootScope', '$location', 'authrequest', 'ApplicationNotifications', '$translate',
            function($scope, $rootScope, $location, authrequest, ApplicationNotifications, $translate) {
            $scope.authenticating = false;
            $scope.auth_error = false;
            $scope.auth_error_message = undefined;
            //if there is an auth_token skip login
            if($rootScope.auth_token) {
                $location.path("/");
            }

            $scope.authenticate = function(){
                $scope.authenticating = true;
                authrequest($scope.user.name, $scope.user.password).then(
                    function (success) {//this is the method called when the authentication is successful
                        $scope.authenticating = false;
                        $scope.auth_error = false;
                        $scope.auth_error_message = undefined;
                    },
                    function (error_msg) {
                        if(error_msg === $translate.instant('common.login_error')) {
                            $scope.authenticating = false;
                            $scope.auth_error = true;
                            $scope.auth_error_message = error_msg;
                            // clear password input
                            $scope.user.password = '';
                        } else {
                            $scope.authenticating = false;
                            ApplicationNotifications.add('error', error_msg);
                        }
                    }
                );
            };

            $scope.checkEnter=function($event) {
                if($event.keyCode === 13 && $scope.user) {
                    $scope.authenticate();
                }
            };

        }]);
})(angular);
