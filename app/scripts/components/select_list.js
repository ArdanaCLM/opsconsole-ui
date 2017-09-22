// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
  'use strict';

  ng.module('operations-ui').directive('selectList', function() {
    return {
      restrict: "E",
      require: "ngModel",
      templateUrl: "components/select_list.html",
      scope: {
        "options": "=",
        "ngModel": "="
      },
      link: function(scope, element, attributes, ngModel) {
        scope.value = ngModel.$modelValue;

        if(scope.options) {
          scope.model = scope.options.map(function() { return false; });
        }

        scope.$watch('model', function() {
          var newValue = [];
          //generate list of options selected based on selected elements
          if(scope.model) {
            scope.model.forEach(function(item, idx) {
              if(item) {
                newValue.push(scope.options[idx].value);
              }
            });
          }
          scope.value = newValue;
        }, true); //watch all elements for equality

        scope.$watch('ngModel', function() {
          scope.value = ngModel.$modelValue;
          //generate model based on array of options selected
          if(scope.options) {
            scope.model = scope.options.map(function(option) {
              return scope.value.indexOf(option.value) !== -1;
            });
          }
        }, true);

        scope.$watch('value', function() {
          ngModel.$setViewValue(scope.value);
        });
      }
    };
  });
})(angular);