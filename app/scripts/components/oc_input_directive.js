// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
  'use strict';

  ng.module('operations-ui').directive('ocInput', [
   'loadAllMetrics',
   '$translate',
   '$parse',
   'log',
   '$rootScope',
   function(loadAllMetrics, $translate, $parse, log, $rootScope) {
    return {
      restrict: "E",
      templateUrl: "components/oc_input.html",
      scope: {
        "value": "=",
        "label": "@",
        "name": "@",
        "placeholder": "@",
        "selectOptions": "=",
        "validate": "=",
        "validateText": "@",
        "customValidateText": "=",
        "ocDisabled": "=",
        "ocRequired": "=",
        "buttonLabel": "@",
        "modal": "=",
        "metric": "=",
        "selectValue": "@",
        "dimensions": "=",
        "collection": "=",
        "ranges": "=",
        "type": "@",
        "readonly": "=",
        "ocTooltip": "="
      },
      link: function(scope, element, attributes) {
        scope.select_active = false;

        /*  Keep type up to date  */
        attributes.$observe('type', function() {
          scope.type = attributes.type;

          if(scope.type === "dimension") {
            scope.label = 'common.dimension_selector_title';
            scope.buttonLabel = 'common.dimention_selector_button_label';
          } else if(scope.type === "matchby") {
              scope.label = 'common.dimension_matchby_title';
              scope.buttonLabel = 'common.dimension_matchby_buttonlabel';
          }

          if(scope.type === "select") {
            //only allow one to be open at a time.
            $rootScope.$on("ocInputSelectOpen", function($event) {
              if(scope.$id !== $event.targetScope.$id) {
                scope.select_active = false;
              }
            });
            //when told close select
            scope.$on('ocInputSelectClose', function() {
              scope.select_active = false;
            });
          }

        });

        var updateRequired = function() {
          scope.required = (scope.ocRequired === 'true' || scope.ocRequired === 'false') ? (scope.ocRequired === 'true') : !!scope.ocRequired;
          if(angular.isDefined(scope.visible)) {
              scope.required = scope.required && scope.visible;
          }
        };

        /*  Keep disabled/required values up to date  */
        scope.$watch('ocDisabled', function() {
          scope.disabled = (scope.ocDisabled === 'true' || scope.ocDisabled === 'false') ? (scope.ocDisabled === 'true') : !!scope.ocDisabled;
        });
        scope.$watch('ocRequired', updateRequired);

        // Get called back on things that should cause the visibility of things
        // input to change.
        var handleEvent = function() {
            var visible = element.is(':visible');
            if(angular.isUndefined(scope.visible) || scope.visible !== visible) {
                scope.$apply(function() {
                    scope.visible = visible;
                    updateRequired();
                });
            }
        };
        ['click', 'keyUp'].forEach(function(ev) {
            $(document).on(ev, handleEvent);
        });

        scope.$watch('value', function() {
          if(scope.type === "select" && scope.selectOptions && scope.selectOptions.length > 0) {
            scope.selectedOption = scope.selectOptions.filter(function(option) {
              return option.value === scope.value;
            })[0];
          }
        });

        scope.$on('ocInputReset', function() {
            // if(ngModel) {
            //   scope.ngModel = scope.value = $parse(attributes.ngModel)(scope.$parent);
              scope.inputForm.$setPristine();
              scope.inputForm.$setUntouched();
              scope.inputForm.$setValidity('required', true);
            //   ngModel.$setPristine();
            //   ngModel.$setUntouched();
            //   ngModel.$setValidity('required', true);
            // }
        });

        /*  try to read the validate value from the attribute if it is not passed in via scope  */
        if(ng.isUndefined(scope.validate) && ng.isDefined(attributes.validate)) {
          scope.validate = attributes.validate;
        }

        /*  Functions to handle select type  */
        scope.selectOption = function(option) {
          scope.selectedOption = option;
          scope.select_active = false;
          scope.value = option.value || option;
        };
        scope.showList = function() {
          if(!scope.disabled) {
            scope.$emit("ocInputSelectOpen");
            scope.select_active = !scope.select_active;
          }
        };

        //inspired by ngClick: https://github.com/angular/angular.js/blob/master/src/ng/directive/ngEventDirs.js#L60
        scope.action = function(event) {
          if(attributes.action &&
            (scope.type === 'button' || scope.type === 'dimension' || scope.type === 'matchby' ||
             scope.type === 'collection' || scope.type === 'iprange' || scope.type === 'gatewayip')) {
            var action = $parse(attributes.action, null, true);
            scope.$evalAsync(function() {
              action(scope.$parent, {$event:event});
            });
          } else {
            log('error', 'Button type requires action to wire the button');
          }
        };

        scope.removeDimension = function(dimension) {
          var idx;
          if(scope.type === 'matchby') {
              for (var kk = 0; kk < scope.dimensions.length; kk++){
                  if(scope.dimensions[kk] === dimension){
                      idx = kk;
                      break;
                  }
              }
          } else {
              for (var ii = 0; ii < scope.dimensions.length; ii++) {
                  var dim = scope.dimensions[ii];
                  if (dim.key === dimension.key && dim.value === dimension.value) {
                      idx = ii;
                      break;
                  }
              }
          }
          var removedElements = scope.dimensions.splice(idx, 1);

          if(scope.type === 'matchby') {
            scope.$emit('removedMatchByElement', removedElements);
          } else if(scope.type === 'dimension'){
            scope.$emit('removedDimensionElement', removedElements);
          }
        };

        scope.falsifyFromCollection = function(item) {
          var idx;
          for(var iii=0;iii<scope.collection.length;iii++) {
            var dim = scope.collection[iii];
            if(dim.title === item.title) {
              idx = iii;
              break;
            }
          }
          scope.collection[idx].value = false;
        };

        scope.removeRange = function(item) {
          var idx;
          for(var iii=0; iii<scope.ranges.length; iii++) {
            var range = scope.ranges[iii];
            if(range.range === item.range && !item.isreadonly) {
              idx = iii;
              break;
            }
          }
          scope.ranges.splice(idx,1);
        };
      }
    };
  }]);
})(angular);
