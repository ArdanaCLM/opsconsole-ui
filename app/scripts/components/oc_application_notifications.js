// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
  'use strict';

  ng.module('operations-ui').directive('ocApplicationNotifications', ['ApplicationNotifications', function(ApplicationNotifications) {
    return {
      restrict: "E",
      templateUrl: "components/application_notifications.html",
      scope: {
          "notifications": "="
      },
      link: function(scope, element, attributes, ngModel) {
          scope.remove = ApplicationNotifications.remove;
      }
    };
  }]);
})(angular);
