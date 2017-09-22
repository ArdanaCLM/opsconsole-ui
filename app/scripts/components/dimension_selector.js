// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(ng){
  'use strict';

  ng.module('operations-ui').directive('dimensionSelector', [function () {
    return {
      restrict: 'E',
      scope: {
        'dropdownOptions': '=',
        'dropdownSelector': '=',
        'selectedOptions': '=',
        'modalDrawer': '=drawer',
        'allMetrics': '='
      },
      templateUrl: 'components/dimension_selector.html',
      link: function(scope, element) {
        scope.selectedOptions = scope.selectedOptions || [];

        var isSelected = function(key, value) {
          if(scope.selectedOptions) {
            return scope.selectedOptions.map(function(dimension) {
              return dimension.key === key && dimension.value === value;
            }).reduce(function(a, b) {
              return a || b;
            }, false);
          } else {
            return false;
          }
        };

        var drawerTableConfig = {
          headers: [{
              name: 'dimension_type',
              type: 'string',
              displayfield: 'key',
              sortfield: 'key'
          }, {
              name: 'dimension_value',
              type: 'string',
              displayfield: 'value',
              sortfield: 'value'
          }],
          rowSelectionCheck: function(dimension, dimensions) {
            if(dimension.$rowSelected) {
              //this is a deselection, its allowed ;)
              return true;
            }
            var isNotSameKey = dimensions.filter(function (d){
              return dimension.key === d.key;
            }).map(function(d) {
              return !d.$rowSelected;
            }).reduce(function(a, b) {
              return a && b;
            }, true),
            selectedDimensions = dimensions.filter(function(d) {
              return d.$rowSelected;
            }),
            canBeSelected = scope.allMetrics.filter(function(m) {
              return m.name === scope.dropdownSelector;
            }).filter(function(m) { //Filter to metrics based on what is selected
              return selectedDimensions.map(function(d) {
                return m.dimensions.hasOwnProperty(d.key) &&  m.dimensions[d.key] === d.value;
              }).reduce(function(a, b) {
                return a && b;
              }, true);
            }).map(function(m) {
              return m.dimensions[dimension.key] === dimension.value;
            }).reduce(function(a, b) {
              return a || b;
            }, false);
            return isNotSameKey && canBeSelected;
          }
        };

        scope.showDrawer = function() {
          var currentDimensionScope = scope.dropdownOptions[scope.dropdownSelector];
          var dimensions = [];

          angular.forEach(currentDimensionScope, function(value, key) {
              value.forEach(function(inner_value) {
                dimensions.push({
                  key: key,
                  value: inner_value,
                  '$rowSelected': isSelected(key, inner_value)
                });
              });
          });
          scope.modalDrawer.show({
            template: "components/dimension_selector_drawer.html",
            titleKey: "Select Dimensions",
            data: {
              dimensions: dimensions,
              table_config: drawerTableConfig
            },
            cancel: "common.cancel",
            commit: "common.complete_selection"
          }).then(function(data) {
            //remove them all, if there was no change they will be readded
            scope.selectedOptions = scope.selectedOptions || [];
            scope.selectedOptions.splice(0, scope.selectedOptions.length);
            data.dimensions.forEach(function(dimension) {
              if(dimension.$rowSelected) {
                scope.selectedOptions.push(dimension);
              }
            });
          });
        };

        scope.removeDimension = function(index) {
          scope.selectedOptions.splice(index, 1);
        };
      }
    };
  }]);
})(angular);
