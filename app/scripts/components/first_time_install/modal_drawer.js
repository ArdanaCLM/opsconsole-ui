// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
  'use strict';

  ng.module('operations-ui').directive('modalDrawer', ['isUndefined', function(isUndefined) {
    return {
      restrict: "E",
      templateUrl: "components/first_time_install/modal_drawer.html",
      scope: {
        noHeader: "="
      },
      link: function(scope, element, attributes) {
        scope.presented = false;
        scope.titleKey = undefined;

        var show = function(config) {
          scope.config = config;

          scope.this_data = config.data;
          scope.read_only = config.read_only;//will not show the update button
          if (angular.isDefined(config.disablecommit)) {
            scope.disablecommit = config.disablecommit;
          }

          if(isUndefined(scope.deferred )) {
            scope.deferred = jQuery.Deferred();
          }
          if(!scope.presented) {
            scope.currentConfig = config;
            scope.presented = true;
          }
          return scope.deferred.promise();
        };

        var setDisableCommit = function(disablecommit) {
            scope.disablecommit = disablecommit;
        };

          /**
           * unpresent hides the drawer without resetting the config
           */
        var unpresent = function(){
          if(scope.presented) {
            scope.presented = false;
          }
        };

          /**
           * hide hides the drawer AND resets the config to undefined
           */
        var hide = function() {
          if(scope.presented) {
            scope.config = scope.currentConfig = undefined;
            unpresent();
          }
        };

        scope.commit = function() {
          if(angular.isUndefined(scope.config.commitaction) || scope.config.commitaction(scope.config)){
            if(angular.isDefined(scope.deferred)) {
                scope.deferred.resolve(scope.this_data);
            }
            hide();
            scope.deferred = undefined;
          }
        };

        scope.validateDataRow =  function(drow){
          drow.duplicateError = false;
          angular.forEach(scope.this_data.rows, function(row){
            if(row != drow && row.vm_name === drow.vm_name){
              drow.duplicateError = true;
              return;
            }
          });
        };

        scope.cancel = function() {
          if((angular.isDefined(scope.config)) &&
              (angular.isUndefined(scope.config.cancelaction) || scope.config.cancelaction())) {
              if(angular.isDefined(scope.deferred)) {
                  scope.deferred.reject("cancel");
              }
              hide();
              scope.deferred = undefined;
              scope.$broadcast("drawerCanceled");//broadcast to all children
          }
        };

        //export to parent controller/component the necessary functions
        if(attributes.name) {
          scope.$parent[attributes.name] = {
            show: show,
            hide: hide,
            unpresent: unpresent,
            setDisableCommit: setDisableCommit
          };
        }

        scope.$on('modalIsClosing', function(event){
            scope.cancel();
        });
      }
    };
  }]);
})(angular);
