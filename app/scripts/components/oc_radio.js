// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
  'use strict';

  ng.module('operations-ui').directive('ocRadio', ['$parse', function($parse) {
    return {
      restrict: "E",
      require: "ngModel",
      templateUrl: "components/oc_radio.html",
      scope: {
          "ocDisabled": "&",
          "name": "@",
          "label": "@",
          "value": "@"
      },
      link: function(scope, element, attributes, ngModel) {
        scope.modelValue = ngModel.$modelValue;

        scope.$watch(function() {
          return ngModel.$modelValue;
        }, function() {
          scope.modelValue = ngModel.$viewValue;
        });

        scope.$watch('modelValue', function() {
          ngModel.$setViewValue(scope.modelValue);
        });

        //inspired by ngClick: https://github.com/angular/angular.js/blob/master/src/ng/directive/ngEventDirs.js#L60
        scope.select = function(event) {
          scope.modelValue = scope.value;
          if(attributes.select) {
            var select = $parse(attributes.select, null, true);
            scope.$evalAsync(function() {
              select(scope.$parent, {$event:event});
            });
          }
        };
      }
    };
  }]);
})(angular);
