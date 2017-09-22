// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';

    ng.module('operations-ui').service('ApplicationNotifications', [
      '$rootScope', 'genRandomString',
      function ($rootScope, genRandomString) {
        $rootScope.applicationNotifications = [];

        this.remove = function(id) {
          var thisNotification = $rootScope.applicationNotifications.filter(function(notification) {
            return notification.id === id;
          })[0];
          $rootScope.applicationNotifications.splice($rootScope.applicationNotifications.indexOf(thisNotification), 1);
        };

        var self = this;

        this.add = function(type, message) {
          var id = genRandomString(5);
          $rootScope.applicationNotifications.push({
            type: type,
            text: message,
            id: id
          });
          return id;
        };
      }
    ]);
})(angular);
