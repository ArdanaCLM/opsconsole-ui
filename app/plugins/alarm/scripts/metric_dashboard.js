// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';
    var p = ng.module('plugins');

    p.controller('MonitoringDashboardController', [
          '$scope', 'bllApiRequest', 'loadAllMetrics', 'getUniqueList',
          'addNotification', '$translate', '$rootScope', 'Blob', 'FileSaver',
          '$moment', 'generateDimensionsForSelection', 'dimensionCanSelect',
          'arrayContains', 'booleanValuesOr', 'prefSaver', 'genRandomString',
          'booleanValuesAnd', 'loadDimensions', '$timeout', 'watchDimensionSelection',
        function (
          $scope, bllApiRequest, loadAllMetrics, getUniqueList,
          addNotification, $translate, $rootScope, Blob, FileSaver, $moment,
          generateDimensionsForSelection, dimensionCanSelect, arrayContains,
          booleanValuesOr, prefSaver, genRandomString, booleanValuesAnd,
          loadDimensions, $timeout, watchDimensionSelection) {
            $scope.showCreate = false;
            $scope.loadingMetrics = true;
            $scope.chartEditing = false;

            var default_widgets = [{
                id: 'MY.DASHBOARD.MEMORY_USAGE',
                title: $translate.instant('monitoring_dashboard.memory_card_title'),
                translatedTitle: $translate.instant('monitoring_dashboard.memory_card_title'),
                menu: actions,
                type: 'metric',
                subType: 'percentage',
                total: 'mem.total_mb',
                fraction: 'mem.free_mb',
                units: 'GB',
                unitConversion: 0.001,
                inverseFraction: true,
                $rowSelected: false
            },{
                id: 'MY.DASHBOARD.DISK_USAGE',
                title: $translate.instant('monitoring_dashboard.disk_card_title'),
                translatedTitle: $translate.instant('monitoring_dashboard.disk_card_title'),
                menu: actions,
                type: 'metric',
                subType: 'percentage',
                total: 'disk.total_space_mb',
                fraction: 'disk.space_used_perc',
                units: 'GB',
                unitConversion: 0.001,
                fractionPercent: true,
                $rowSelected: false
            },{
                id: 'MY.DASHBOARD.COMPUTE_HOSTS',
                title: $translate.instant('monitoring_dashboard.compute_hosts_card_title'),
                translatedTitle: $translate.instant('monitoring_dashboard.compute_hosts_card_title'),
                menu: actions,
                type: 'metric',
                subType: 'computeHosts',
                $rowSelected: false
            },{
                id: 'MY.DASHBOARD.VIRTUAL_MEMORY',
                title: $translate.instant('monitoring_dashboard.virtual_memory_hosts_card_title'),
                translatedTitle: $translate.instant('monitoring_dashboard.virtual_memory_hosts_card_title'),
                menu: actions,
                type: 'metric',
                subType: 'computeHostResource',
                total: 'total_memory',
                fraction: 'allocated_memory',
                units: 'GB',
                unitConversion: 0.001,
                $rowSelected: false
            },{
                id: 'MY.DASHBOARD.VIRTUAL_CPU',
                title: $translate.instant('monitoring_dashboard.virtual_cpu_hosts_card_title'),
                translatedTitle: $translate.instant('monitoring_dashboard.virtual_cpu_hosts_card_title'),
                menu: actions,
                type: 'metric',
                subType: 'computeHostResource',
                total: 'total_cpu',
                fraction: 'allocated_cpu',
                $rowSelected: false
            },{
                id: 'MY.DASHBOARD.VIRTUAL_STORAGE',
                title: $translate.instant('monitoring_dashboard.virtual_storage_hosts_card_title'),
                translatedTitle: $translate.instant('monitoring_dashboard.virtual_storage_hosts_card_title'),
                menu: actions,
                type: 'metric',
                subType: 'computeHostResource',
                total: 'total_storage',
                fraction: 'allocated_storage',
                units: 'GB',
                $rowSelected: false
            },{
              id: 'MY.DASHBOARD.APPLIANCES',
              title: $translate.instant('monitoring_dashboard.appliance_summary_card_title'),
              translatedTitle: $translate.instant('monitoring_dashboard.appliance_summary_card_title'),
              menu: actions,
              type: 'metric',
              subType: 'applianceSummary',
              $rowSelected: false
            },{
              id: 'MY.DASHBOARD.SERVICES',
              title: $translate.instant('monitoring_dashboard.services_summary_card_title'),
              translatedTitle: $translate.instant('monitoring_dashboard.services_summary_card_title'),
              menu: actions,
              type: 'metric',
              subType: 'servicesSummary',
              $rowSelected: false
            }];


            /*
            =========================== Manage item order ===========================
            */
            function move(calcDirection) {
                return function(config) {
                    if (config.id) {
                        var oldLocation = findItemById(config.tabIndex, config.id);
                        var newLocation = calcDirection(oldLocation);
                        $scope.currentTab = config.tabIndex;
                        if (oldLocation !== -1) {
                            var chartToMove = $scope.tabs[config.tabIndex].items[oldLocation];
                            $scope.tabs[config.tabIndex].items.splice(oldLocation, 1);
                            $scope.tabs[config.tabIndex].items.splice(newLocation, 0, chartToMove);
                            drawItems();
                            updateSavedPrefs();
                        } else {
                            addNotification('error', $translate.instant('monitoring_dashboard.move.error'));
                        }
                    } else {
                        addNotification('error', $translate.instant('monitoring_dashboard.move.error'));
                    }
                };
            }
            var moveItemUp = move(function(location) {
                return location-1;
            });
            var moveItemDown = move(function(location) {
                return location+1;
            });

            /* drag and drop end */
            $scope.$on('dashboard-items.drop-model', function() {
                $scope.prefs.dashboards['OC.MY.DASHBOARD'].TABS = $scope.tabList.map(function(tab) {
                    return {
                        name: tab.name,
                        items: tab.items.map(function(item) {
                            return item.config.id;
                        })
                    };
                });
                createTabs();
                updateSavedPrefs();
            });


            /*
            =========================== Actions ===========================
            */
            var shouldShow = function(calcCompare) {
                return function(config) {
                   if (config.id) {
                       // don't show this menu only on first chart
                       var currentLocation = findItemById(config.tabIndex, config.id);
                       return currentLocation !== calcCompare(config);
                   } else {
                       return false;
                   }
                };
            };
            var actions = [{
                label: 'common.delete',
                action: showDeleteConfirmModal
            }, {
                label: 'common.move.up',
                action: moveItemUp,
                show: shouldShow(function() {return 0;})
            }, {
                label: 'common.move.down',
                action: moveItemDown,
                show: shouldShow(function(config) {return $scope.tabs[config.tabIndex].items.length - 1;})
            }];

            var chartActions = angular.copy(actions);
            chartActions.splice(0, 0, {
                label: 'common.edit',
                action: showEditModal
            });
            chartActions.splice(2, 0, {
              label: 'monitoring_dashboard.download_csv',
              action: function(config) {
                $scope.currentTab = config.tabIndex;
                $scope.showDownloadCsv = true;
                //find the chart data
                var thisChart = $scope.tabList[$scope.currentTab].items.filter(function(c) {
                  return c.config && c.config.id === config.id;
                })[0];
                var thisChartIndex = $scope.tabList[$scope.currentTab].items.indexOf(thisChart);
                $scope.currentChartDownloadTarget = {
                  data: angular.copy(angular.element('.content-form[ng-repeat="tabbedpage in pagelist"]:eq(' + $scope.currentTab + ') [ng-repeat="item in tabbedpage.items"]:eq(' + thisChartIndex + ') metric-chart span').scope().data),
                  fileName: thisChart.config.title + '.csv'
                };
              }
            });

            /*
            =========================== Enums ===========================
            */
            $scope.chartTypes = [
                {value: 'line',         label: 'monitoring_dashboard.line'},
                {value: 'bar',          label: 'monitoring_dashboard.bar'},
                {value: 'stackedBar',  label: 'monitoring_dashboard.stacked_bar'},
                {value: 'area',         label: 'monitoring_dashboard.area'},
                {value: 'stackedArea', label: 'monitoring_dashboard.stacked_area'}
            ];
            $scope.chartSizes = [
                {value: 'small', label: 'monitoring_dashboard.small'},
                {value: 'large', label: 'monitoring_dashboard.large'}
            ];
            $scope.chartUpdateRates = [
                {value: 1,  label: 'monitoring_dashboard.1_minute'},
                {value: 5,  label: 'monitoring_dashboard.5_minute'},
                {value: 10, label: 'monitoring_dashboard.10_minute'},
                {value: 30, label: 'monitoring_dashboard.30_minute'},
                {value: 60, label: 'monitoring_dashboard.1_hour'}
            ];
            $scope.chartTimeRanges = [
                {value: 1,     label: 'monitoring_dashboard.last_1_hour'},
                {value: 2,     label: 'monitoring_dashboard.last_2_hour'},
                {value: 4,     label: 'monitoring_dashboard.last_4_hour'},
                {value: 8,     label: 'monitoring_dashboard.last_8_hour'},
                {value: 24,    label: 'monitoring_dashboard.last_24_hour'},
                {value: 7*24,  label: 'monitoring_dashboard.last_7_day'},
                {value: 30*24, label: 'monitoring_dashboard.last_30_day'},
                {value: 45*24, label: 'monitoring_dashboard.last_45_day'}
            ];
            $scope.functionList = [
                {value: 'MIN',   label: 'MIN'},
                {value: 'MAX',   label: 'MAX'},
                {value: 'SUM',   label: 'SUM'},
                {value: 'COUNT', label: 'COUNT'},
                {value: 'AVG',   label: 'AVG'}
            ];

            /*
            =========================== Chart metric/Dimension handling ===========================
            */
            loadAllMetrics().then(function(metricList) {
                $scope.metricList = metricList;
                $scope.loadingMetrics = false;
            });

            $scope.dimensionCanSelect = dimensionCanSelect;

            $scope.addStack = function() {
                $scope.chartCreateModal.addStack.apply(null, arguments);
            };

            $scope.selectMetric = function(metric) {
                $scope.currentMetric = metric;
                $scope.loadingDimensions = true;
                loadDimensions(metric).then(function(res) {
                    $scope.currentDimensions = generateDimensionsForSelection(res.dimensions);
                    $scope.currentAllMetrics = res.allMetrics;
                    $scope.loadingDimensions = false;
                    $scope.selectedCurrentDimensions = $scope.currentDimensions.map(function() {return false;});
                    $scope.selectedDimensions = [];
                });
                $scope.chartCreateModal.closeModal();
            };

            $scope.$watch('selectedCurrentDimensions', watchDimensionSelection($scope), true);

            $scope.selectDimension = function() {
                $scope.selectedDimensions = $scope.currentDimensions.filter(function(dimension) {
                    return dimension.$rowSelected;
                });
                $scope.chartCreateModal.closeModal();
            };

            $scope.$watch('selectedDimensions', function() {
                if($scope.currentDimensions) {
                    $scope.currentDimensions.forEach(function(dimension) {
                        dimension.$rowSelected = arrayContains($scope.selectedDimensions, dimension);
                    });
                }
            }, true);


            /*
            =========================== Saved Prefs ===========================
            */
            prefSaver.load().then(function(prefs) {
                $scope.prefs = prefs;
                createTabs();
                drawItems();
            }, function(error) {
                addNotification('error', $translate.instant('monitoring_dashboard.load.error', {details: error}));
            });

            function createTabs() {
                var needsSave = false;
                if(angular.isDefined($scope.prefs.dashboards['OC.MY.DASHBOARD']) === false){
                  $scope.prefs.dashboards['OC.MY.DASHBOARD'] = prefSaver.getDefaultPrefs().dashboards['OC.MY.DASHBOARD'];
                }
                if(Array.isArray($scope.prefs.dashboards['OC.MY.DASHBOARD'].DEFAULT) && !Array.isArray($scope.prefs.dashboards['OC.MY.DASHBOARD'].TABS)) {
                    //upgrade to tabbed dashboard
                    var newDashboardTab = {
                        name: 'DEFAULT',
                        items: $scope.prefs.dashboards['OC.MY.DASHBOARD'].DEFAULT
                    };
                    $scope.prefs.dashboards['OC.MY.DASHBOARD'].TABS = [newDashboardTab];
                    needsSave = true;
                }
                $scope.tabs = $scope.prefs.dashboards['OC.MY.DASHBOARD'].TABS.map(function(tab) {
                  return {
                      name: tab.name,
                      items: tab.items.map(function(itemId) {
                          var item = angular.copy($scope.prefs.cardAndChartStore[itemId]);
                          item.id = itemId;
                          item.type = !item.type ? 'chart' : item.type;
                          return item;
                      })
                  };
                });
                if(needsSave) {
                    updateSavedPrefs();
                }
            }

            function updateSavedPrefs() {
                $scope.prefs.dashboards['OC.MY.DASHBOARD'].TABS = $scope.tabs.map(function(tab) {
                    return {
                        name: tab.name,
                        items: tab.items.map(function(item) {
                            var thisItem = angular.copy(item);
                            delete thisItem.id;
                            $scope.prefs.cardAndChartStore[item.id] = thisItem;
                            return item.id;
                        })
                    };
                });
                prefSaver.save($scope.prefs).then(function() {
                    // noting to do?
                }, function(error) {
                    addNotification('error', $translate.instant('monitoring_dashboard.update.error', {details: error}));
                });
            }

            /*
            =========================== Rendering ===========================
            */
            function drawItems() {
                $scope.$broadcast('metricChartDeleted');
                $scope.tabList = $scope.tabs.map(function(tab, tabIndex) {
                    return {
                        name: tab.name,
                        header: tab.name,
                        tabname: tab.name,
                        template: 'alarm/templates/dashboard/main_tab.html',
                        items: tab.items.map(function(item) {
                            item.tabIndex = tabIndex;
                            return item.type !== 'chart' ? {
                                type: item.type,
                                config: item,
                                menu: actions
                            } : {
                                config: {
                                    title: item.name,
                                    type: item.chartType,
                                    chartType: item.chartType,
                                    actionMenu: chartActions,
                                    tabIndex: tabIndex,
                                    id: item.id
                                },
                                type: 'chart',
                                wide: (item.chartSize === 'small') ? false : true,
                                interval: item.updateRate,
                                range: item.timeRange,
                                elements: item.chartElements.map(function(element) {
                                    element.mathFunction = element.mathFunction || 'AVG';
                                    return element;
                                }),
                                data: [[new Date().getTime(), 0]]
                            };
                        })
                    };
                });
                if($scope.currentTab) {
                    $timeout(function() {
                        $scope.tabedPage.showTab($scope.currentTab);
                    });
                }
            }

            /*
            =========================== Chart creation ===========================
            */
            $scope.initiateChartCreation = function($index) {
                $scope.currentTab = $index;
                $scope.newChart = {
                    chartType: $scope.chartTypes[0].value,
                    chartSize: $scope.chartSizes[0].value,
                    timeRange: $scope.chartTimeRanges[0].value,
                    updateRate: $scope.chartUpdateRates[0].value,
                    chartElements: [],
                    type: 'chart'
                };
                $scope.definition = $scope.currentMetric = undefined;
                $scope.selectedFunction = $scope.functionList[$scope.functionList.length-1].value;
                $scope.chartEditing = false;
                $scope.showCreate = true;
                $scope.chartErrorFlag = false;
            };

            $scope.$watch('newChart.selectedMetric', function() {
                if($scope.newChart) {
                    $scope.newChart.selectedDimensions = [];
                }
            });

            $scope.addDataToChart = function(metric, dimensions, mathFunction) {
                $scope.newChart.chartElements.push({
                    metric: metric,
                    dimensions: dimensions,
                    mathFunction: mathFunction
                });
            };

            $scope.removeChartElement = function(index) {
                $scope.newChart.chartElements.splice(index, 1);
            };

            $scope.createChart = function() {
                if(!$scope.newChart.id) {
                    $scope.newChart.id = genRandomString(15);
                }
                if (findItemById($scope.currentTab, $scope.newChart.id) === -1) {
                    $scope.tabs[$scope.currentTab].items.splice(0, 0, $scope.newChart);
                    $scope.showCreate = false;
                    drawItems();
                    updateSavedPrefs();
                } else {
                    $scope.errorMessage = $translate.instant('monitoring_dashboard.duplicate.error');
                    $scope.chartErrorFlag = true;
                }
            };

            /*
            =========================== Delete chart ===========================
            */
            function showDeleteConfirmModal(config) {
                if (config.id) {
                    $scope.chartToDelete = config.id;
                    $scope.currentTab = config.tabIndex;
                    $scope.showDeleteConfirm = true;
                } else {
                    addNotification('error', $translate.instant('monitoring_dashboard.delete.error'));
                    $scope.showDeleteConfirm = false;
                }
            }

            $scope.deleteChart = function() {
                var location = findItemById($scope.currentTab, $scope.chartToDelete);
                if (location !== -1) {
                    $scope.showDeleteConfirm = false;
                    $scope.tabs[$scope.currentTab].items.splice(location, 1);
                    drawItems();
                    updateSavedPrefs();
                } else {
                    addNotification('error', $translate.instant('monitoring_dashboard.delete.error'));
                    $scope.showDeleteConfirm = false;
                }
            };

            $scope.closeDeleteConfirmModal = function() {
                $scope.showDeleteConfirm = false;
            };


            /*
            =========================== Edit chart ===========================
            */
            function showEditModal(config) {
                $scope.showCreate = true;
                $scope.chartEditing = true;
                $scope.currentTab = config.tabIndex;
                $scope.selectedFunction = $scope.functionList[$scope.functionList.length-1].value;
                if (config.id) {
                    var location = findItemById($scope.currentTab, config.id);
                    if (location !== -1) {
                        $scope.currentChart = angular.copy($scope.tabs[$scope.currentTab].items[location]);
                        $scope.newChart = angular.copy($scope.tabs[$scope.currentTab].items[location]);
                        $scope.chartChanged = false;
                    }
                }
            }

            $scope.$watch('newChart', function() {
                if ($scope.chartEditing) {
                    $scope.chartChanged = ($scope.newChart.name !== $scope.currentChart.name) ||
                                          ($scope.newChart.chartType !== $scope.currentChart.chartType) ||
                                          ($scope.newChart.chartSize !== $scope.currentChart.chartSize) ||
                                          ($scope.newChart.timeRange !== $scope.currentChart.timeRange) ||
                                          ($scope.newChart.updateRate !== $scope.currentChart.updateRate) ||
                                          !angular.equals($scope.newChart.chartElements, $scope.currentChart.chartElements);
                }
            }, true);

            $scope.editChart = function() {
                var location = findItemById($scope.currentTab, $scope.currentChart.id);
                if (location !== -1) {
                    $scope.tabs[$scope.currentTab].items.splice(location, 1);
                    $scope.tabs[$scope.currentTab].items.splice(location, 0, $scope.newChart);
                    $scope.showCreate = false;
                    drawItems();
                    updateSavedPrefs();
                } else {
                    addNotification('error', $translate.instant('monitoring_dashboard.edit.error'));
                }
            };

            /*
            =========================== Utils ===========================
            */
            function findItemById(currentTab, chartId) {
                for (var i=0; i<$scope.tabs[currentTab].items.length; i++) {
                    if ($scope.tabs[currentTab].items[i].id === chartId) return i;
                }
                return -1;
            }

            function getDateString() {
                return moment().format('MMMM D, YYYY').toUpperCase() + ' ' + moment().format('h:mmA');
            }

            function getUTCString() {
                return moment().format('Z') + 'UTC';
            }

            $scope.downloadCSV = function() {
              var data = $scope.currentChartDownloadTarget.data.map(function(d) {
                var newRow = $scope.currentChartDownloadTarget.includeTimes ? ['datetime', d.label.label] : [d.label.label];
                d.data.splice(0,0,newRow);
                return d.data;
              });

              var arrays = data.map(function(d) {
                return $scope.currentChartDownloadTarget.includeTimes ? [d.map(function(dd, index) {
                  return index === 0 ? dd[0] : '"' + $moment(dd[0]).format('YYYY/MM/DD HH:mm:ss.SSS') + '"';
                }),
              d.map(function(dd, index) {
                  return dd[1];
                })] : [d.map(function(dd, index) {
                    return index === 0 ? dd[0] : dd[1];
                  })];
              });

              data = [].concat.apply([], arrays);

              var longest = 0;

              data.forEach(function(datum) {
                if(datum.length > longest) {
                  longest = datum.length;
                }
              });
              var result = "";
              for(var ii=0;ii<longest;ii++) {
                for(var qq=0;qq<data.length;qq++) {
                  if(angular.isDefined(data[qq][ii])) {
                    result += data[qq][ii];
                  }
                  if(qq < data.length-1) {
                     result += ',';
                  }

                }
                result += '\n';
              }
              var blob = new Blob([result], {type: 'text/csv'});
              FileSaver.saveAs(blob, $scope.currentChartDownloadTarget.fileName);
              $scope.showDownloadCsv = false;
            };


            /*
            =========================== Widgets ===========================
            */
            function getCurrentDashboardItems() {
              if($scope.prefs) {
                $scope.currentDashboardItems = Object.keys($scope.prefs.cardAndChartStore).map(function(itemKey) {
                  var item = angular.copy($scope.prefs.cardAndChartStore[itemKey]);
                  item.translatedTitle = $translate.instant('monitoring_dashboard.alarm_card_title', {type:$translate.instant(item.title)});
                  item.title = item.title;
                  item.id = itemKey;
                  item.menu = actions;
                  item.$rowSelected = false;
                  return item;
                }).filter(function(item) {
                  return item.type === 'card';
                });
              }
              $scope.currentDashboardItems = ($scope.currentDashboardItems || []).concat(angular.copy(default_widgets));
              if($scope.metricList) {
                var metricCards = $scope.metricList.map(function(metric) {
                  return {
                    id: metric,
                    title: metric,
                    translatedTitle: $translate.instant('monitoring_dashboard.metric_card_title', {type:metric}),
                    menu: actions,
                    type: 'metric',
                    subType: 'metric',
                    $rowSelected: false
                  };
                });
                $scope.currentDashboardItems = $scope.currentDashboardItems.concat(metricCards);
              }
            }

            $scope.showAddWidgetModal = function($index) {
              $scope.showAddWidget = true;
              $scope.currentTab = $index;
              getCurrentDashboardItems();
            };

            $scope.addDashboardItems = function() {
              var toAdd = $scope.currentDashboardItems.filter(function(item) {
                return item.$rowSelected;
              });
              toAdd.forEach(function(item) {
                $scope.tabs[$scope.currentTab].items.splice(0, 0, item);
              });
              $scope.showAddWidget = false;
              drawItems();
              updateSavedPrefs();
              getCurrentDashboardItems();
            };

            $scope.disableDashboardItemSelect = function(item) {
              // return itemStore.map(function(thisItem) {
              //   return thisItem.id === item.id;
              // }).reduce(booleanValuesOr, false);
              return false;
            };

            $scope.$watch('prefs', getCurrentDashboardItems, true);


            /*
            =========================== Tabs ===========================
            */

            $scope.initTabCreate = function() {
              $scope.showCreateTab = true;
              $scope.currentTabName = '';
              $scope.$broadcast('ocInputReset');
            };

            $scope.createTab = function() {
                var tab = {
                    name: $scope.currentTabName,
                    items: []
                };
                $scope.currentTabName = undefined;
                $scope.tabs.push(tab);
                tab.tabname = tab.name;
                tab.header = tab.name;
                tab.template = 'alarm/templates/dashboard/main_tab.html';
                $scope.tabList.push(tab);
                updateSavedPrefs();
                $scope.showCreateTab = false;
            };

            $scope.initDeleteTab = function($index) {
                $scope.showTabDeleteConfirm = true;
                $scope.currentTab = $index;
            };

            $scope.deleteTab = function() {
                $scope.tabs.splice($scope.currentTab, 1);
                $scope.tabList.splice($scope.currentTab, 1);
                $scope.tabedPage.showTab($scope.currentTab >= $scope.tabList.length && $scope.currentTab !== 0 ? $scope.currentTab-1 : $scope.currentTab);
                updateSavedPrefs();
                $scope.showTabDeleteConfirm = false;
            };

            $scope.editTab = function($index) {
              $scope.currentTabName = $scope.tabs[$index].name;
              $scope.currentTab = $index;
              $scope.showEditeTab = true;
            };

            $scope.commitEditTab = function() {
              $scope.tabs[$scope.currentTab].name = $scope.currentTabName;
              $scope.tabList[$scope.currentTab].tabname = $scope.currentTabName;
              $scope.tabList[$scope.currentTab].name = $scope.currentTabName;
              $scope.tabList[$scope.currentTab].header = $scope.currentTabName;
              $scope.showEditeTab = false;
              updateSavedPrefs();
            };

        }]);
})(angular);
