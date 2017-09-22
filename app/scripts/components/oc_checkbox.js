// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
  'use strict';

  ng.module('operations-ui').directive('ocCheckbox', function() {
    return {
      restrict: "E",
      require: "ngModel",
      templateUrl: "components/oc_checkbox.html",
      scope: {
          "ocDisabled": "&",
          "disabledClear": "&"
      },
      link: function(scope, element, attributes, ngModel) {
        scope.value = ngModel.$modelValue || true;

        scope.$watch(function() {
          return ngModel.$modelValue;
        }, function() {
          scope.value = ngModel.$viewValue;
        });

        if(scope.disabledClear && scope.disabledClear()) {
          scope.$watch(function() {
            return scope.ocDisabled();
          }, function() {
            if(scope.ocDisabled()) {
              ngModel.$setViewValue(false);
            }
          });
        }

        scope.$watch('value', function() {
          ngModel.$setViewValue(scope.value);
        });
      }
    };
  });
})(angular);
