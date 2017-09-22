// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
  'use strict';

  ng.module('plugins').directive('dashboardAlarmCard', [
    'bllApiRequest', 'filterAlarmCount', '$rootScope',
    '$location', 'animationLoop', 'addNotification',
    function(bllApiRequest, filterAlarmCount, $rootScope, $location, animationLoop, addNotification) {
    return {
      restrict: "E",
      templateUrl: "alarm/templates/dashboard/dashboard_alarm_card.html",
      scope: {
        card: '='
      },
      link: function(scope, element, attributes, ngModel) {
        //wrap the actions to pass back more than the index
        scope.menu = scope.card.menu.map(function(menu) {
          return {
            label: menu.label,
            show: function() {
              if(typeof menu.show === 'function') {
                return menu.show(scope.card.config);
              } else if(typeof menu.show !== 'undefined') {
                return menu.show;
              } else {
                return true;
              }
            },
            action: function() {
              menu.action(scope.card.config);
            }
          };
        });

        var req_alarms = {
            "operation": "alarm_count",
            "group_by": "dimension_name, dimension_value, state, severity"
        };

        var defaultData = {
          critical: 0,
          ok: 0,
          total: 0,
          unknown: 0,
          warning: 0
        };

        function getData() {
          bllApiRequest.get('monitor', req_alarms).then(function(res) {
            var list  = filterAlarmCount(res.data);
            scope.data = scope.card.config.services.map(function(service) {
              return list.service[service];
            }).reduce(function(a,b) {
              a = a || defaultData;
              b = b || defaultData;
              return {
                critical: a.critical + b.critical,
                ok: a.ok + b.ok,
                total: a.total + b.total,
                unknown: a.unknown + b.unknown,
                warning: a.warning + b.warning
              };
            }, defaultData);
          }, function(error) {
            addNotification('error', $translate.instant('monitoring_dashboard.load.error', {details: error}));
          });
        }
        getData();

        scope.$on('metricChartDeleted', function(event) {
            scope.deleted = true;
        });

        animationLoop(60*1000, getData, function() {
          return $rootScope.auth_token && !scope.deleted && $location.path() === '/alarm/dashboard';
        });

      }
    };
  }]);
})(angular);
