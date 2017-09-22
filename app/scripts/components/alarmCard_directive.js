// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(){
    'use strict';
    angular.module('operations-ui').directive("alarmcard", [
        '$translate',
        'styleutils',
        function($translate, styleutils) {
            return {
                restrict: "E",

                scope: {
                    data   : '=',
                    ctitle : '=',
                    vclick : '=',
                    amenu  : '=',
                    idx    : '=',
                    static : '='
                },

                templateUrl: 'components/alarmCard.html',

                bindToController: true,
                controllerAs : 'ctrl',
                controller : function() {
                },

                link : function(scope, el, attr) {
                    scope.dataClick = function($event,val) {
                        if($.isFunction( scope.ctrl.vclick ))
                            scope.ctrl.vclick($event,val,scope.ctrl.data);
                    };


                    scope.$watch('ctrl.data', function() {
                    }, true);
                },
            };
        }
    ]);
})();
