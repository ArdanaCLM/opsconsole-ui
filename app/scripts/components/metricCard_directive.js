(function(){
    'use strict';
    angular.module('operations-ui').directive("metriccard", [
        '$translate',
        'styleutils',
        '$parse',
        function($translate, styleutils, $parse) {
            return {
                restrict: "E",

                scope: {
                    type : '=',
                    data : '=',
                    ctitle : '=',
                    showcondition : '=',
                    cmenu : '=',
                    ctitleback : "=",
                    slideover : "=",
                    altsummary : "="
                },

                templateUrl: 'components/metricCard.html',

                bindToController: true,
                controllerAs : 'ctrl',
                controller : function() {
                },

                link : function(scope, el, attr) {
                    var iconCondMap = {
                        'ok' : 'ardana-icon-Active_L',
                        'warn' : 'ardana-icon-Alert_pressed',
                        'critical' : 'ardana-icon-Critical_L',
                        'unknown' : 'ardana-icon-Unknown_L'
                    };
                    scope.condIcon = 'none';
                    scope.$watch('scope.ctrl.data', function() {
                        if(scope.ctrl.data && scope.ctrl.data.condition) {
                            scope.condIcon = iconCondMap[scope.ctrl.data.condition];
                        }
                        if (scope.ctrl.data && scope.ctrl.data.ok && scope.ctrl.data.ok.count > 999999) {
                            scope.ctrl.data.ok.alt = true;
                            scope.ctrl.data.ok.altCount = Math.round(scope.ctrl.data.ok.count / 1000000);
                        }
                        if (scope.ctrl.data && scope.ctrl.data.warning && scope.ctrl.data.warning.count > 999999) {
                            scope.ctrl.data.warning.alt = true;
                            scope.ctrl.data.warning.altCount = Math.round(scope.ctrl.data.warning.count / 1000000);
                        }
                        if (scope.ctrl.data && scope.ctrl.data.critical && scope.ctrl.data.critical.count > 999999) {
                            scope.ctrl.data.critical.alt = true;
                            scope.ctrl.data.critical.altCount = Math.round(scope.ctrl.data.critical.count / 1000000);
                        }
                        if (scope.ctrl.data && scope.ctrl.data.unknown && scope.ctrl.data.unknown.count > 999999) {
                            scope.ctrl.data.unknown.alt = true;
                            scope.ctrl.data.unknown.altCount = Math.round(scope.ctrl.data.unknown.count / 1000000);
                        }
                    }, true);

                    scope.click = attr.click;

                    scope.action = function(event) {
                        if(attr.click) {
                            var action = $parse(attr.click, null, true);
                            scope.$evalAsync(function() {
                                action(scope.$parent, {$event:event});
                            });
                        }
                    };

                    scope.setSelectedColor = function(color) {
                        scope.$parent.$parent.metricCardSelectedColor = color;
                    };
                },
            };
        }
    ]);
})();
