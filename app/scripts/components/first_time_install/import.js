// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
  'use strict';

  var ops = ng.module('operations-ui');
  //based on: http://stackoverflow.com/questions/19746809/angularjs-manual-two-way-binding
  ops.factory('twoWay', ['$parse', '$rootScope', function($parse, $rootScope) {
    return function(scope, scopeName, parentName ) {
         var parentScope = scope,
             lastValue,
             parentGet,
             parentSet,
             compare;

         parentGet = $parse(parentName);
         if (parentGet.literal) {
           compare = angular.equals;
         } else {
           compare = function(a,b) { return a === b; };
         }
         parentSet = parentGet.assign || function() {
           // reset the change, or we will throw this exception on every $digest
           lastValue = scope[scopeName] = parentGet(parentScope);
           throw new Error( "Expression '" + parentName + "' is non-assignable!" );
         };
         lastValue = scope[scopeName] = parentGet(parentScope);
         var unwatch = parentScope.$watch($parse(parentName, function parentValueWatch(parentValue) {
           if (!compare(parentValue, scope[scopeName])) {
             // we are out of sync and need to copy
             if (!compare(parentValue, lastValue)) {
               // parent changed and it has precedence
               scope[scopeName] = parentValue;
             } else {
               // if the parent can be assigned then do so
               parentSet(parentScope, parentValue = scope[scopeName]);
             }
           }
           lastValue = parentValue;
           return parentValue;
         }), null, parentGet.literal);
         scope.$on('$destroy', unwatch);
     };
  }]);

  ops.directive('import', ['twoWay','getKeyFromScope',
    function(twoWay, getKeyFromScope) {
    return {
      restrict: "E",
      link: function(scope, element, attributes, ngModel) {
        var target = attributes.target || "imported";
        //deal with need to switch the import src based on
        if(angular.isDefined(attributes.alt)) {
          if(getKeyFromScope(attributes.src, scope)) {
            twoWay(scope, target, attributes.src);
          }
          else {
            twoWay(scope, target, attributes.alt);
          }
        }
        else {
          twoWay(scope, target, attributes.src);
        }
      }
    };
  }]);
})(angular);
