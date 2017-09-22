// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
  'use strict';

  ng.module('plugins').factory('monascaHasData', [function() {
    return function(res) {
      return res.data[0] && (
        (res.data[0].statistics && res.data[0].statistics[0]) ||
        (res.data[0].measurements && res.data[0].measurements[0]));
    };
  }]);

  ng.module('plugins').factory('extractMetricData', [function() {
    return function(res) {
      return (res.data[0].statistics || res.data[0].measurements)[0];
    };
  }]);



  ng.module('plugins').directive('dashboardMetricCard', [
    'bllApiRequest', 'filterAlarmCount', '$rootScope',
    '$location', '$q', 'round', 'animationLoop', 'ArdanaService', 'filterOutComputeRoles', 'monascaHasData', 'extractMetricData', 'bytesToSize',
    function(bllApiRequest, filterAlarmCount, $rootScope, $location, $q, round, animationLoop, ArdanaService, filterOutComputeRoles, monascaHasData, extractMetricData, bytesToSize) {
    return {
      restrict: "E",
      templateUrl: "alarm/templates/dashboard/dashboard_metric_card.html",
      scope: {
        card: '='
      },
      link: function(scope, element, attributes, ngModel) {
        //wrap the actions to pass back more than the index
        if(scope.card.menu) {
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
        }

        scope.data = {
            value: 0,
            range: 'The last hour.'
        };

        scope.loading = true;

        if(scope.card.config.units) {
          scope.data.unit = scope.card.config.units;
        }

        var getMeasurements = scope.card.measurements;

        var getRequest = function(name, dimensions, statFunction) {
            var req = {
                name: name,
                start_time: moment().subtract(1, 'hour').toISOString(),
                merge_metrics: true,
                operation: getMeasurements ? 'measurement_list' : 'metric_statistics',
                statistics: statFunction || 'MAX',
                period: 3600
            };
            if(dimensions) {
                req.dimensions = dimensions;
            }
            return req;
        };

        var makeMonascaRequest = function(name, dimensions) {
          var request = dimensions ? getRequest(name, dimensions) : getRequest(name);
          return bllApiRequest.get('monitor', request);
        };

        var typeMap = {
          metric: 'range',
          percentage: 'horseshoeGraph',
          computeHosts: 'alarmList',
          computeHostResource: 'horseshoeGraph',
          computeHostsAlarms: 'alarmList',
          applianceSummary: 'alarmList',
          servicesSummary: 'alarmList',
          computeCapacityCard: 'range',
        };

        var applianceStatesMapSeverity = {
          'up': 'HIGH',
          'down': 'HIGH',
          'warn': 'MEDIUM',
          'error': 'HIGH',
          'unknown': 'HIGH'
        };
        var applianceStatesMapState = {
          'up': 'OK',
          'down': 'ALARM',
          'warn': 'ALARM',
          'error': 'ALARM',
          'unknown': 'UNDETERMINED'
        };

        scope.type = typeMap[scope.card.config.subType];

        if(scope.card.config.subType === 'computeCapacityCard') {
          scope.capacity = true;
        }

        function getCompute() {
            var request = {operation: 'get_compute_list'};
            return [bllApiRequest.get('compute', request)];
        }

        var makeRequest = {
            metric: function() {
                return [makeMonascaRequest(scope.card.config.id)];
            },
            percentage: function() {
                var deferred = $q.defer();
                var total = typeof scope.card.config.total === 'number' ?
                  scope.card.config.total :
                  getRequest(
                    scope.card.config.total,
                    scope.card.config.dimensions || scope.card.config.total_dimensions,
                    scope.card.config.statFunction),
                fraction = getRequest(
                  scope.card.config.fraction,
                  scope.card.config.dimensions || scope.card.config.fraction_dimensions,
                  scope.card.config.statFunction);
                deferred.resolve(total);
                return [typeof total === 'number' ? deferred.promise : bllApiRequest.get('monitor', total), bllApiRequest.get('monitor', fraction)];
            },
            computeHosts: getCompute,
            computeHostResource: getCompute,
            computeHostsAlarms: function() {
                var deferred = $q.defer();
                var promises = getCompute();
                promises.push(bllApiRequest.get('monitor', {
                    "operation": "alarm_count",
                    "group_by": "dimension_name, dimension_value, severity, state"
                }));
                $q.all(promises).then(function(res) {
                    var  compute_res = res[0],
                         alarm_count_res = res[1],
                         compute_hosts = compute_res.data.map(function(host) {
                             return host.name || host.hostname;
                         }),
                         alarm_counts = alarm_count_res.data.counts.filter(function(count) {
                             return count[1] === 'hostname' && compute_hosts.indexOf(count[2]) !== -1;
                         });
                         deferred.resolve({
                           data: {
                               counts: alarm_counts
                           }
                         });
                });
                return [deferred.promise];
            },
            applianceSummary: function() {
              var deferred = $q.defer();
              ArdanaService.getServerInfo().then(function(servers_dict) {
                  var appliances = filterOutComputeRoles(servers_dict).map(
                      function(server) {
                          //only need the hostname
                          return server.hostname;
                      }
                  );
                  bllApiRequest.get('monitor', {
                      'operation': 'get_appliances_status',
                      'hostnames': appliances
                  }).then(function(resStates) {
                    var counts = appliances.map(function(appliance) {
                      var state = resStates.data[appliance];
                      return [
                        0,
                        'hostname',
                        appliance,
                        applianceStatesMapSeverity[state],
                        applianceStatesMapState[state],
                      ];
                    });
                    deferred.resolve({
                      data: {
                        counts: counts
                      }
                    });
                  }, deferred.reject);
              }, deferred.reject);
              return [deferred.promise];
            },
            servicesSummary: function() {
              return [bllApiRequest.get('monitor', {
                  "operation": "alarm_count",
                  "group_by": "dimension_name, dimension_value, severity, state"
              })];
            },
            computeCapacityCard: function() {
              return makeRequest.percentage();
            }
        };

        var processAlarmLists = function(filter) {
          return function(results) {
            var data = {}, alarmList = {
              ok:{count:0},
              warning:{count:0},
              critical:{count:0},
              unknown:{count:0}};
            results.data.counts.filter(filter).forEach(function(count) {
              var dimension_name = count[1],
                  dimension_value = count[2],
                  severity = count[3],
                  state = count[4];
                  data[dimension_value] = data[dimension_value] || {};
                  data[dimension_value][state] = data[dimension_value][state] || {};
                  data[dimension_value][state][severity] = (data[dimension_value][state][severity] || 0) + count[0];

            });
            angular.forEach(data, function(value, key) {
              if(value.OK && !value.ALARM && !value.UNDETERMINED) { //ok
                alarmList.ok.count++;
              } else if(!value.ALARM && value.UNDETERMINED) { //unknown
                alarmList.unknown.count++;
              } else if(value.ALARM) { //alarm
                if(!value.ALARM.HIGH && !value.ALARM.CRITICAL && (value.ALARM.LOW || value.ALARM.MEDIUM)) {
                  alarmList.warning.count++;
                } else {
                  alarmList.critical.count++;
                }
              } else {
                  console.log('alarm found in state of ok AND unknown');
              }
            });
            scope.data = alarmList;
          };
        };

        var handlePercent = function(total_results, fraction_results) {
            var total = 0, fraction = 0;
            scope.noData = false;
            if((typeof total_results !== 'number' && total_results.data.length === 0) || fraction_results.data.length === 0) {
              //we got nothing from monasca
              scope.data.data = {
                  count: undefined
              };
              if(scope.card.config.visibility === 'data') {
                  //we need data to display ourselves
                  element.css('display', 'none');
                  element.parent().css('display', 'none');
              }
              if(scope.capacity) {
                  scope.noData = true;
              }
              return;
            }
            if(typeof total_results === 'number') {
                total = total_results;
            } else if(monascaHasData(total_results)) {
                total = round(extractMetricData(total_results)[1]);
            }
            if(monascaHasData(fraction_results)) {
                fraction = round(extractMetricData(fraction_results)[1]);
            }
            if(scope.card.config.fractionUnitConversion || scope.card.config.unitConversion) {
              fraction = round(fraction * (scope.card.config.fractionUnitConversion || scope.card.config.unitConversion));
            }
            if(scope.card.config.totalUnitConversion || scope.card.config.unitConversion) {
              total = scope.data.max = round(total * (scope.card.config.totalUnitConversion || scope.card.config.unitConversion));
            } else {
              total = scope.data.max = round(total);
            }
            if(scope.card.config.fractionPercent && scope.card.config.inverseFraction) {
                scope.data.data = {
                    count: Math.ceil(total * ((100 - fraction) / 100))
                };
            } else if(scope.card.config.fractionPercent) {
                scope.data.data = {
                    count: round(total * (fraction / 100))
                };
            } else if(scope.card.config.inverseFraction) {
                scope.data.data = {
                    count: round(total - fraction)
                };
            } else {
                scope.data.data = {
                    count: fraction
                };
            }
            if(scope.card.config.round) {
                scope.data.data.count = round(scope.data.data.count, scope.card.config.round);
            }if(scope.card.config.altsummary) {
                scope.data.altsummary = scope.card.config.altsummary;
            }
            scope.data.percent = round(scope.data.data.count / scope.data.max * 100);
            if(scope.card.dynamicBytes) {
                scope.data.max = bytesToSize(scope.data.max);
                scope.data.data.count = bytesToSize(scope.data.data.count);
            }
        };

        var handleComputeResource = function(res) {
            scope.data.max = 0;
            scope.data.data = {count: 0};
            res.data.forEach(function(computeHost) {
                scope.data.max += computeHost[scope.card.config.total];
                scope.data.data.count += computeHost[scope.card.config.fraction];
            });
            if(scope.card.config.unitConversion) {
                scope.data.max = round(scope.data.max * scope.card.config.unitConversion);
                scope.data.data.count = round(scope.data.data.count * scope.card.config.unitConversion);
            }
        };

        var handleData = {
            metric: function(res) {
                if(monascaHasData(res)) {
                    scope.data.value = round(extractMetricData(res)[1]);
                }
            },
            percentage: handlePercent,
            computeHosts: function(res) {
                scope.data = {
                    ok:{count:0},
                    warning:{count:0},
                    critical:{count:0},
                    unknown:{count:0}};
                res.data.forEach(function(computeHost) {
                    scope.data[mapStatusSeverity[computeHost.status || computeHost.state]].count += 1;
                });
            },
            computeHostResource: handleComputeResource,
            computeHostsAlarms: processAlarmLists(function(count) {
              return count[1] === 'hostname';
            }),
            applianceSummary:  processAlarmLists(function(count) {
              return count[1] === 'hostname';
            }),
            servicesSummary: processAlarmLists(function(count) {
              return count[1] === 'service';
            }),
            computeCapacityCard: handlePercent
        };

        var mapStatusSeverity = {
          warn: 'warning',
          unknown: 'unknown',
          error: 'critical',
          ok: 'ok',

          activated: 'ok',
          activating: 'warning',
          deactivated: 'critical',
          deactivating: 'critical',
          deleting: 'critical',
          provisioned: 'warning',
          importing: 'warning',
          imported: 'warning'
        };


        function getData() {
            if(typeof makeRequest[scope.card.config.subType] === 'function') {
                scope.loading = true;
                //make the requests and resolve them
                $q.all(makeRequest[scope.card.config.subType]()).then(function(results) {
                    handleData[scope.card.config.subType].apply(null, results);
                    scope.loading = false;
                });
            }
        }

        //when config changes redraw
        scope.$watch('card', getData, true);

        scope.action = function() {
          if(scope.card.config.subType === 'applianceSummary') {
            $location.path("/system/appliance_list");
          } else if(scope.card.config.subType === 'computeHosts') {
            $location.path("/compute/compute_nodes");
          }
        };

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
