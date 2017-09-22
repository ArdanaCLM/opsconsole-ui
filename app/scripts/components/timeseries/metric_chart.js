// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(){
    'use strict';

    angular.module('operations-ui').directive('metricChart', [
        'bllApiRequest', 'isUndefined', 'getUniqueList', '$rootScope',
        'addNotification', '$translate', '$location', 'styleutils', '$q',
        'animationLoop', '$timeout', '$moment', 'round', 'd3Service',
        'booleanValuesAnd',
        function(bllApiRequest, isUndefined, getUniqueList, $rootScope,
        addNotification, $translate, $location, styleutils, $q,
        animationLoop, $timeout, $moment, round, d3Service,
        booleanValuesAnd) {
            return {
                restrict: 'E',

                scope: {
                    metric: '=',
                    nonActionable: '@'
                },

                templateUrl: 'components/metric_chart.html',

                link: function(scope, element) {
                    var colors = styleutils.ocGraphColors();
                    scope.config = scope.metric.config;
                    scope.wide = scope.metric.wide;
                    scope.rightCol = scope.metric.rightCol;
                    scope.data = [];

                    var mapAxis = {
                      1: {
                          range: "minutes",
                          rangeHours: 1,
                          interval: [10, "minutes"],
                          tickFormat: "default"
                      },
                      2: {
                          range: "minutes",
                          rangeHours: 2,
                          interval: [15, "minutes"],
                          tickFormat: "default"
                      },
                      4: {
                          range: "minutes",
                          rangeHours: 4,
                          interval: [30, "minutes"],
                          tickFormat: "default"
                      },
                      8: {
                          range: "hours",
                          rangeHours: 8,
                          interval: [1, "hours"],
                          tickFormat: "default"
                      },
                      24: {
                          range: "hours",
                          rangeHours: 24,
                          interval: [2, "hours"],
                          tickFormat: "default"
                      },
                      168: {
                          range: "days",
                          rangeHours: 168,
                          interval: [1, "days"],
                          tickFormat: "default"
                      },
                      720: {
                          range: "days",
                          rangeHours: 720,
                          interval: [1, "days"],
                          tickFormat: "default"
                      },
                      1080: {
                          range: "days",
                          rangeHours: 1080,
                          //In order for x-axis ticks to display evenly -1 is required.
                          interval: [-1, "days"],
                          tickFormat: "default"
                      }
                    };

                    var mapTypes = {
                      'line': 'multiline',
                      'bar': 'multibar',
                      'stackedBar': 'stackbar',
                      'area': 'multiarea',
                      'stackedArea': 'stackarea'
                    };

                    var formatYAxisLabels = function(value, index) {
                      var adjusted = parseFloat(value);
                      if(scope.config.yAxisFormat.unitType === 'dynamic') {
                        if(scope.config.yAxisFormat.baseTypeMultiplier) {
                          adjusted = scope.config.yAxisFormat.baseTypeMultiplier * adjusted;
                        }
                        var parsed = d3Service.format('s')(adjusted);
                        //extract numeric value and SI prefix
                        var matches = /^(-?)([\d]+(?:\.[\d]*)?)([a-zA-Z])??$/.exec(parsed);
                        if(matches ) {
                          var numeric = scope.config.yAxisFormat.round ? round(parseFloat(matches[2]), scope.config.yAxisFormat.round) : matches[2];
                          adjusted = matches[1] + (matches[3] ? numeric + matches[3] : numeric);
                        }
                      } else {
                        if(scope.config.yAxisFormat.multiplier) {
                          adjusted = adjusted * scope.config.yAxisFormat.multiplier;
                        }
                        if(scope.config.yAxisFormat.round) {
                          adjusted = round(adjusted, scope.config.yAxisFormat.round);
                        }
                      }
                      if(scope.config.yAxisFormat.unit) {
                        return adjusted + scope.config.yAxisFormat.unit;
                      }
                      return adjusted;
                    };

                    var labels = getChartLabels(scope.metric.elements);

                    function generateChartConfig() {
                      labels = getChartLabels(scope.metric.elements);
                      var theseColors = scope.metric.elements.map(function(element, index) {
                        element.order = angular.isDefined(element.order) ? element.order : index;
                        return element;
                      }).sort(function(a,b) {
                        return a.order - b.order;
                      }).map(function(element, index) {
                        return element.color || colors[index];
                      });
                      if(typeof scope.chart_config === 'undefined') {
                        scope.chart_config = {
                            id: scope.metric.config.id,
                            loading: true,
                            tabIndex: scope.metric.config.tabIndex,
                            type: mapTypes[scope.config.chartType],
                            legendConfig: {
                                legendButtons: scope.metric.config.legendButtons || [],
                                legendButtonsValue: scope.metric.config.legendButtonsValue,
                                legendLabels: labels,
                                'y-label': scope.config.yLabel
                            },
                            graphOptions: {
                                graphTitleConfig: {
                                    name: scope.config.title,
                                    styleClass: "chartTitle"
                                },
                                graphColors: {
                                    fill: colors[0],
                                    stroke: colors[0],
                                    stackColors: theseColors
                                },
                                graphAxisConfig: {
                                    xAxis: mapAxis[scope.metric.range]
                                },
                            },
                            actionMenu: scope.config.actionMenu
                        };
                      } else {
                        scope.chart_config.graphOptions = {
                            graphTitleConfig: {
                                name: scope.config.title,
                                styleClass: "chartTitle"
                            },
                            graphColors: {
                                fill: colors[0],
                                stroke: colors[0],
                                stackColors: theseColors
                            },
                            graphAxisConfig: {
                                xAxis: mapAxis[scope.metric.range]
                            }
                        };
                      }
                      if(scope.config.yAxisFormat || scope.config.yAxisMin) {
                        scope.chart_config.graphOptions.graphAxisConfig.yAxis = {};
                        if (scope.config.yAxisFormat) {
                          scope.chart_config.graphOptions.graphAxisConfig.yAxis.format = typeof scope.config.yAxisFormat === 'string' ?
                            scope.config.yAxisFormat : formatYAxisLabels;
                        }
                        if (scope.config.yAxisMin) {
                          scope.chart_config.graphOptions.graphAxisConfig.yAxis.min = scope.config.yAxisMin;
                        }
                      }
                      if(scope.nonActionable && scope.chart_config.actionMenu) {
                        delete scope.chart_config.actionMenu;
                      }
                    }
                    generateChartConfig();

                    var firstFrame = true;
                    animationLoop(scope.metric.interval * 60 * 1000, function() {
                      if(scope.metric.skipFirstFrame && firstFrame) {
                        return;
                      }
                      if(firstFrame) {
                        firstFrame = false;
                      }
                      getData();
                    }, function() {
                      return $rootScope.auth_token && !scope.deleted && $location.path() === '/alarm/dashboard';
                    });

                    var periods = {
                      1: 60,
                      2: 65,
                      4: 70,
                      8: 90,
                      24: 240,
                      168: 500,
                      720: 1980,
                      1080: 8000
                    };

                    function getByDate(date, array) {
                      for(var ii=0;ii<array.length;ii++) {
                        if(array[ii][0] === date) {
                          return array[ii][1];
                        }
                      }
                      return -1;
                    }

                    function getData() {
                        scope.showOverlay = true;
                        scope.chart_config.loading = true;
                        scope.enabled = true;
                        var promises = scope.metric.elements.map(function(element, index) {
                            var request = {
                                name: element.metric,
                                dimensions: getDimensionDict(element.dimensions),
                                start_time: getISODate(scope.metric.range),
                                merge_metrics: true,
                                operation: 'metric_statistics',
                                statistics: element.mathFunction,
                                period: periods[scope.metric.range]
                            },
                            deffered = $q.defer();
                            if (scope.metric.config.type === 'bar' || scope.metric.config.type === 'stackedBar') {
                                request.period = Math.floor(scope.metric.range * 60 / 7) * 60;  //shows 7 bars
                            }
                            bllApiRequest.get('monitor', request).then(
                                function(res) {
                                    var idx = angular.isDefined(element.order) ? element.order : index;
                                    deffered.resolve({
                                        order: idx,
                                        label: labels[idx],
                                        data: res.data.length > 0 ? res.data[0].statistics : [[new Date().toISOString(), 0, {}]]
                                    });
                                },
                                function(error) {
                                    addNotification('error', $translate.instant('monitoring_dashboard.load.error', {details: error}));
                                    var idx = angular.isDefined(element.order) ? element.order : index;
                                    deffered.resolve({
                                        order: idx,
                                        label: labels[idx],
                                        error: true,
                                        data: [[new Date().toISOString(), 0, {}]]
                                    });
                                }
                            );
                            return deffered.promise;
                        });
                        $q.all(promises).then(function(resolvedValues) {
                            var allError = resolvedValues.map(function(datum) {
                              return datum.error;
                            }).reduce(booleanValuesAnd);
                            if(allError) {
                              scope.chart_config.loading = false;
                              scope.chart_config.no_data = true;
                            } else {
                                scope.data = resolvedValues.sort(function(a,b) {
                                  return a.order - b.order;
                                });
                                scope.metric.elements.forEach(function(element, idx) {
                                    var index = angular.isDefined(element.order) ? element.order : idx;
                                    var dataCount = scope.data[index].data.length;
                                    var oldestDataPointDate = moment(scope.data[index].data[0][0]),
                                        newestDataPointDate = moment(scope.data[index].data[dataCount-1][0]),
                                        timeDiff = newestDataPointDate.diff(oldestDataPointDate, 'hours'),
                                        timeDiffToNow = moment().diff(newestDataPointDate, 'hours');
                                    if(timeDiffToNow > 0) {
                                      scope.data[index].data.push([moment().toISOString(), -1, {}]);
                                    }
                                    if(scope.metric.range > timeDiff) { //add a dummy value so the x-range will show the full width
                                      scope.data[index].data.splice(0,0,[newestDataPointDate.subtract(scope.metric.range, 'hours').toISOString(), -1, {}]);
                                    }
                                    if(angular.isDefined(element.multiplier)) {
                                      scope.data[index].data = scope.data[index].data.map(function(datum) {
                                        return [
                                          datum[0],
                                          datum[1] !== -1 ? datum[1] * element.multiplier : datum[1],
                                          datum[2]
                                        ];
                                      });
                                    }
                                });
                                //compute differences if needed after multipliers have be applied
                                scope.metric.elements.forEach(function(element, idx) {
                                    if(element.difference) {
                                        var index = angular.isDefined(element.order) ? element.order : idx;
                                        scope.data[index].data = scope.data[index].data.map(function (datum) {
                                            var otherValue = getByDate(datum[0], scope.data[element.differenceElement].data);
                                            return [
                                                datum[0],
                                                otherValue !== -1 ?
                                                element.calcDifference(
                                                    datum[1],
                                                    otherValue
                                                ) : -1,
                                                datum[2]
                                            ];
                                        });
                                    }
                                });
                                scope.$emit('metricChartUpdated');
                                scope.showOverlay = false;
                                scope.chart_config.loading = false;
                            }
                        });
                    }

                    //if config changes refresh data
                    scope.$watch('metric', function() {
                        if(!scope.chart_config.loading) {
                            //it is not loading
                            generateChartConfig();
                            getData();
                        }
                    }, true);

                    // stop all requestAnimationFrame loops every time the page is changed/updated
                    scope.$on('metricChartDeleted', function(event) {
                        scope.deleted = true;
                    });

                    function getDimensionDict(dimensions) {
                        var dimDict = {};
                        if(dimensions) {
                            dimensions.forEach(function(dimension) {
                                dimDict[dimension.key] = dimension.value;
                            });
                        }
                        return dimDict;
                    }

                    function getISODate(timeRange) {
                        var nowDate = new Date();
                        if (angular.isUndefined(timeRange)) {
                            return nowDate.toISOString();
                        } else {
                            var beginDate = new Date(nowDate.getTime() - (timeRange * 60 * 60 * 1000));
                            //console.log('beginDate: ' + beginDate);
                            return beginDate.toISOString();
                        }
                    }

                    function getChartLabels(chartElements) {
                        var labels = [];
                        if (chartElements.length === 1) {
                            labels.push(chartElements[0].metric);
                        } else {
                            var metricList = [];
                            chartElements.forEach(function(element) {
                                metricList.push(element.metric);
                            });
                            var uniqueMetricList = getUniqueList(metricList);
                            labels = chartElements.map(function(element) {
                                if (element.dimensions && element.dimensions.length > 0) {
                                    return element.metric + ' - ' + getDimensionString(element.dimensions);
                                } else {
                                    return element.metric;
                                }
                            });
                        }
                        return labels.map(function(label, index) {
                            return {
                              label: chartElements[index].label || label + ' - ' + chartElements[index].mathFunction,
                              color: chartElements[index].color || colors[index],
                              order: chartElements[index].order || index,
                            };
                        }).sort(function(a,b) {
                          return a.order - b.order;
                        });
                    }

                    function getDimensionString(dimensions) {
                        var dimStr = '';
                        if(dimensions) {
                            for (var i=0; i<dimensions.length; i++) {
                                if (i > 0) {
                                    dimStr = dimStr.concat(', ');
                                }
                                dimStr = dimStr.concat(dimensions[i].key + ':' + dimensions[i].value);
                            }
                        }
                        return dimStr;
                    }
                }
            };
        }
    ]);
})();
