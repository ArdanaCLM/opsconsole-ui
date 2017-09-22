// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';

    ng.module('operations-ui').controller('MastheadNotificationController',
        [
            '$scope',
            '$rootScope',
            '$translate',
            'bllApiRequest',
            'addNotification',
            'clearNotifications',
            'markNotificationsRead',
            function ($scope, $rootScope, $translate, bllApiRequest, addNotification, clearNotifications, markNotificationsRead) {
                //Do something!

                $scope.notification = $rootScope.notification;
                $scope.filterString="";

                $rootScope.$watch("notification", function() {
                    $scope.notification = $rootScope.notification;
                }, true);

                $scope.load = function () {
                    return;
                };

                $scope.markViewed = function () {
                    markNotificationsRead();
                };

                $scope.clear = function () {
                    clearNotifications();
                };

                $scope.clearFilter = function () {
                    $scope.filterString = "";
                };
                $scope.load();

            }
        ])
        .filter('reverseNotifications', function() {
            return function(input) {
                if (!input) {
                    return;
                }
                return input.slice().reverse();
            };
        });
})(angular);
