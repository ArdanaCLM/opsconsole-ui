// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
/**
 * This is to handle the directive <alarmcard-service></alarmcard-service>
 */
(function(){
    'use strict';
    angular.module('operations-ui').directive("alarmcardService", [
        '$translate',
        'isUndefined',
        function($translate, isUndefined) {
            return {
                restrict: "E",
                scope: {
                    data : '=',
                    services: '=',
                    vclick:'='
                },
                templateUrl: 'components/alarmcard_service.html',
                bindToController: true,
                controllerAs: 'ctrl',
                controller: function() {},

                link: function(scope, el, attr) {
                    scope.$watch('ctrl.data', function() {
                        scope.ctrl.service_summary = [];
                        var service_total = {}; //tmp for calculation
                        if (!isUndefined(scope.ctrl.services)) {
                            //init first
                            scope.ctrl.services.forEach(function(sName){
                                service_total[sName] = 0;
                            });
                            //do summarize
                            //Note: in the long run, need get summarized data from BLL
                            scope.ctrl.data.forEach(function(datum) {
                                var total = service_total[datum.service];
                                //we know the service or service is undefined
                                if (!isUndefined(total)) {
                                    service_total[datum.service] = total + 1;
                                }
                                else { //the name is not in our services list, group into others
                                    total = service_total.others;
                                    service_total.others = total + 1;
                                }
                            });

                            for (var idx in scope.ctrl.services) {
                                var service_key = scope.ctrl.services[idx];
                                var tol = service_total[service_key];
                                var d = {
                                    'service_key': service_key,
                                    'total': tol,
                                    'service_name': $translate.instant('alarm.service.' + service_key)
                                };
                                scope.ctrl.service_summary.push (d);
                            }
                        }
                    }, true);

                    scope.dataClick = function($event, val) {
                        if (!isUndefined(scope.ctrl.vclick) && $.isFunction(scope.ctrl.vclick )) {
                            scope.ctrl.vclick($event, val);
                        }
                    };
                }
            };
        }
    ]);
})();