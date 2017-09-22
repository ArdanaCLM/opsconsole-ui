// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';

    ng.module('operations-ui').service('ToastNotifications', [
      '$rootScope', '$q', '$timeout', 'genRandomString',
      function ($rootScope, $q, $timeout, genRandomString) {
        $rootScope.toastNotifications = [];

        this.removeToast = function(id) {
          var toRemove = $rootScope.toastNotifications.filter(function(notification) {
            return notification.id === id;
          })[0];
          if(toRemove) {
            toRemove.remove = true;
            //wait for animation
            $timeout(function() {
              var thisNotification = $rootScope.toastNotifications.filter(function(notification) {
                return notification.id === id;
              })[0];
              $rootScope.toastNotifications.splice($rootScope.toastNotifications.indexOf(thisNotification), 1);
            }, 250);
          }
        };

        var self = this;

        this.addToast = function(type, message) {
          var id = genRandomString(5);
          $rootScope.toastNotifications.push({
            type: type,
            text: message,
            id: id
          });
          //wait a minute and remove
          $timeout(function() {
            self.removeToast(id);
          }, 60 * 1000);
          return id;
        };
      }
    ]);
})(angular);
