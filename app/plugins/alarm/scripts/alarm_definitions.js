// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(ng) {
    'use strict';
    var p = ng.module('plugins');
    p.controller('AlarmDefinitionsController', [
        '$scope', '$translate', 'bllApiRequest', 'addNotification',
        'loadAllMetrics', '$q', 'getUniqueList', '$window', '$timeout',
        'generateDimensionsForSelection', 'dimensionCanSelect', 'arrayContains',
        'booleanValuesOr', 'booleanValuesAnd', 'loadDimensions',
        'alarmDefinition.getExpression', 'alarmDefinition.getNotificationsList',
        'alarmDefinition.getAlarmDefinitionsData', 'alarmDefinition.buildNotification',
        'arrayContainsKey', 'arrayContainsString', '$rootScope',
        'updateEmptyDataPage','log',
        function($scope, $translate, bllApiRequest, addNotification,
                 loadAllMetrics, $q, getUniqueList, $window, $timeout,
                 generateDimensionsForSelection, dimensionCanSelect, arrayContains,
                 booleanValuesOr, booleanValuesAnd, loadDimensions,
                 getExpression, getNotificationsList,
                 getAlarmDefinitionsData, buildNotification,
                 arrayContainsKey, arrayContainsString, $rootScope,
                 updateEmptyDataPage, log) {


            /*
            =========================== Locals ===========================
            */
            $scope.dimensionCanSelect = dimensionCanSelect;
            $scope.alarmDefinitionData = [];
            $scope.notificationList = [];
            $scope.selectedData = [];
            $scope.alarmDefinitionDataLoadingFlag = true;
            $scope.showDeleteModalFlag = false;
            $scope.disableDeleteButtonFlag = true;
            $scope.disableEdit = true;
            $scope.disableCreate = true;
            $scope.modalEditing = false;
            $scope.deleteSelectionCount = 0;

            //deal with empty data page
            $scope.showEmptyDataPageFlag = false;
            $scope.emptyDataPage = {};
            $scope.initAlarmDefinitionDataLoadingFlag = true;

            /*
            =========================== Table Configs ===========================
            */
            var tableConfig = [{
                    name: 'alarm_definitions.table.header.name',
                    type: 'string',
                    displayfield: 'name',
                    sortfield: 'name',
                    highlightExpand: true,
                    isNotHtmlSafe: true
                }, {
                    name: 'alarm_explorer.table.header.id',
                    type: 'string',
                    displayfield: 'id',
                    sortfield: 'id',
                    hidden: true,
                    nosort: true
                }, {
                    name: 'alarm_definitions.table.header.description',
                    type: 'string',
                    displayfield: 'description',
                    sortfield: 'description'
                }, {
                    name: 'alarm_definitions.table.header.notifications',
                    type: 'string',
                    specialColumnType: 'custom',
                    displayfield: 'notifications',
                    sortfield: 'notifications',
                    nosort: true,
                    customDisplayFilter: function(data) {
                        return data.alarm_actions.map(function(notification_id) {
                            var notification_label;
                            for(var index in $scope.notificationList) {
                                if($scope.notificationList[index].key === notification_id) {
                                    notification_label = $scope.notificationList[index].label;
                                    break;
                                }
                            }
                            return notification_label;
                        }).join(', ');
                    }
                }
            ];

            // Set table headers and paging
            $scope.alarmTableConfig = {
                headers: tableConfig,
                pageConfig: {
                    pageSize: 20
                },
                rowSelectionCheck: function(data) {
                    return true;
                },
                expandAction: showEditModal,
                actionMenuConfig: [{
                    label: 'common.edit',
                    name: 'edit',
                    action: showEditModal
                }, {
                    label: 'common.delete',
                    name: 'delete',
                    action: showDeleteModal
                },{
                    label: 'alarm_definitions.view_alarms',
                    name: 'viewAlarm',
                    action: function(data) {
                        var drillPath = '#/alarm/alarm_explorer?tabname=explorer&filterField0=alarmDefId&filterValue0=' + data.id;
                        $window.open(drillPath, "_self");
                    }
                }],

                actionMenuConfigFunction: function(data, name) {
                  if(name === 'edit' && $scope.disableEdit) {
                    return {hidden: false, enabled: false};
                  } else {
                    return {hidden: false, enabled: true};
                  }
                },

                multiSelectActionMenuConfig: [{
                    label: 'alarm_definitions.action.multi_delete',
                    name: 'delete',
                    action: showDeleteModal
                }],

                globalActionsConfig: [{
                    label: 'alarm_definitions.action.create',
                    name: 'create',
                    action: function() {
                        $scope.modalEditing = false;
                        $scope.showExpressionFlag = false;
                        $scope.showDefinitionCreate();
                    },
                    disable: $scope.disableCreate
                }],
                globalActionsConfigFunction: function(data, name) {
                    if(name === 'create' && $scope.disableCreate) {
                      return true;
                    } else {
                      return false;
                    }
                },

                selectionLabel: "alarm.selection.selected",
                selectionTotalLabel: "alarm.selection.total"
            };

            $scope.$on('tableSelectionChanged', function($event, selections) {
                var main_table_scope = angular.element('octable[modelname="alarmDefinitionData"]:not(.modal_edit_table) .octable').scope(),
                    delete_table_scope = angular.element('octable[modelname="alarmDefinitionData"].modal_edit_table .octable').scope(),
                    target_scop_id = $event.targetScope.$id;
                //make sure we are listening to events only from the main table or delete modal
                if(main_table_scope.$id === target_scop_id || delete_table_scope.$id === target_scop_id) {
                    $scope.selectedCount = selections.length;
                    $scope.disableDeleteButtonFlag = selections.length > 0 ? false : true;
                }
            });

            /*
            =========================== Data Loading ===========================
            */

            var getAllAlarmDefData = function() {
                $scope.emptyDataPage = {};

                loadAllMetrics().then(
                    function(metricList) {
                        $scope.metricList = metricList;
                        $scope.disableEdit = false;
                        $scope.disableCreate = false;
                    }
                );

                $q.all([getAlarmDefinitionsData(), getNotificationsList()]).then(
                    function(res) {
                        $scope.notificationList = res[1];
                        $scope.alarmDefinitionData = res[0];
                        $scope.alarmDefinitionDataLoadingFlag = false;

                        //show the page loading at the very first time
                        if($scope.initAlarmDefinitionDataLoadingFlag === true) {
                            $scope.initAlarmDefinitionDataLoadingFlag = false;
                        }
                    },
                    function(error_data) {
                        var errorReason =
                            error_data.data ? error_data.data[0].data : '';
                        var errorMsg = $translate.instant(
                            "alarm.definitions.table.data.error",
                            {'reason': errorReason}
                        );
                        addNotification("error", errorMsg);
                        log('error', 'Failed to get alarm definition table data');
                        log('error', 'error data = ' + JSON.stringify(error_data));

                        //show empty data page for error
                        $scope.showEmptyDataPageFlag = true;
                        updateEmptyDataPage(
                            $scope.emptyDataPage,
                            'servererror',
                            errorMsg,
                            'common.empty.data.checkbackend',
                            'common.reload.table',
                            getAllAlarmDefData
                        );
                        $scope.alarmDefinitionDataLoadingFlag = false;

                         //show the page loading at the very first time
                        if($scope.initAlarmDefinitionDataLoadingFlag === true) {
                            $scope.initAlarmDefinitionDataLoadingFlag = false;
                        }
                    }
                );
            };

            //init loading
            getAllAlarmDefData();


            function reloadAlarmDefinitionTable() {
                $scope.alarmDefinitionDataLoadingFlag = true;
                getAlarmDefinitionsData().then(function(data) {
                    $scope.alarmDefinitionData = data;
                    $scope.alarmDefinitionDataLoadingFlag = false;
                });
            }

            $rootScope.$on('alarmDefinitionsNeedsReload', reloadAlarmDefinitionTable);

            $rootScope.$on('notificationListNeedsRefresh', function() {
                $scope.disableEdit = true;
                $scope.disableCreate = true;
                getNotificationsList().then(function(notifications) {
                    $scope.notificationList = notifications;
                    $scope.disableEdit = false;
                    $scope.disableCreate = false;
                });
            });

            /*
            =========================== Delete Modal ===========================
            */
            $scope.showDeleteModal = function(selection) {
                $scope.hideDefinitionCreate();
                $timeout(function() {
                  showDeleteModal(selection);
                }, 250);
            };

            function showDeleteModal(selection) {
                if(angular.isArray(selection)){
                    $scope.deleteSelectionCount = selection.length;
                } else {
                    $scope.deleteSelectionCount = 1;
                }

                $scope.alarmDefinitionData.forEach(function(definition) {
                    definition.removeSelection = definition.$rowSelected;
                    if(selection.id == definition.id) {
                        definition.removeSelection = true;
                    }
                });
                $scope.showDeleteModalFlag = true;
            }

            //only used for test ugh.
            $scope.closeDeleteModal = function() {
                $scope.showDeleteModalFlag = false;
            };

            $scope.confirmDefinitionDelete = function() {
                $scope.showDeleteModalOverlayFlag = true;
                var removeSelections = $scope.alarmDefinitionData.filter(function(definition) {
                    return definition.removeSelection;
                });
                var promises = removeSelections.map(function(datum) {
                  return bllApiRequest.post('monitor', {operation: 'alarm_definition_delete', id: datum.id}).then(angular.noop,
                    function(error) {
                      addNotification('error', $translate.instant('alarm_definitions.delete.error',
                                    {details: error}));
                      removeSelections.forEach(function(definition, index) {
                          if(definition.id === datum.id) {
                              removeSelections.splice(index, 1);
                          }
                      });
                  });
                });
                var dismissModal = function() {
                    $scope.showDeleteModalFlag = false;
                    $scope.showDeleteModalOverlayFlag = false;
                    //remove deleted items from the table
                    removeSelections.forEach(function(definition) {
                        $scope.alarmDefinitionData.forEach(function(datum, index) {
                            if(datum.id === definition.id) {
                                $scope.alarmDefinitionData.splice(index, 1);
                            }
                        });
                    });
                };
                $q.all(promises).then(dismissModal, dismissModal);
            };

            /*
            =========================== Create Modal ===========================
            */
            $scope.closeCreateModal = function() {
                $scope.alarmDefinitionErrorFlag = false;
                $scope.hideDefinitionCreate();
            };

            /*
            =========================== Edit Modal ===========================
            */
            function showEditModal(selectedDefinition) {
                populateEditModal(selectedDefinition);
                $scope.modalEditing = true;
                $scope.showDefinitionCreate();
            }

            function populateEditModal(datum) {
                $scope.editModalLoadedFlag = false;
                $scope.definition = {
                    id: datum.id,
                    name: datum.name,
                    description: datum.description,
                    severity: datum.severity,
                    actions_enabled: true,
                    alarm_actions: datum.alarm_actions,
                    ok_actions: datum.ok_actions,
                    undetermined_actions: datum.undetermined_actions,
                    dimension: [],
                    matchBy: datum.match_by
                };

                $scope.notificationList.forEach(function(notification) {
                    notification.$ok = arrayContainsString($scope.definition.ok_actions, notification.key);
                    notification.$alarm = arrayContainsString($scope.definition.alarm_actions, notification.key);
                    notification.$undetermined = arrayContainsString($scope.definition.undetermined_actions, notification.key);
                });

                var exp = datum.expression;
                $scope.definition.expression = exp;
                $scope.showExpressionFlag = false;
                if ((exp.indexOf(' or ') > -1) || (exp.indexOf(' and ') > -1) ||
                    (exp.indexOf(' || ') > -1) || (exp.indexOf(' && ') >-1)) {
                    // this is a complex expression, will go directly to the expression text area
                    $scope.showExpressionFlag = true;
                } else {
                    // parse simple expression
                    var operators = ['<=', '>=', '<', '>', '='];
                    $scope.operatorFound = false;
                    for (var i=0; i<operators.length; i++) {
                        if ((exp.indexOf(operators[i]) > -1) && !$scope.operatorFound) {
                            parseExpression(exp, operators[i]);
                            break;
                        }
                    }
                    var metricPhrase = $scope.definition.metric;
                    if (exp.indexOf('(') > -1) {
                        var tokens1 = exp.split('(');
                        $scope.definition.mathFunction = tokens1[0].toUpperCase();
                        var metricMatches = exp.match(/\(([^)]+)\)/);  // get value between parentheses
                        metricPhrase = metricMatches[1];
                    }
                    var tokens2 = metricPhrase.split('{');
                    $scope.definition.metric = tokens2[0];
                    var dimensionMatches = metricPhrase.match(/\{([^}]+)\}/);  // get value between curly braces
                    if (dimensionMatches && dimensionMatches.length > 0) {
                      $scope.definition.dimension = dimensionMatches[1]
                        .replace('{', '')
                        .replace('}', '')
                        .split(',')
                        .map(function(dimension) {
                          var parts = dimension.split('=');
                          return {
                            key: parts[0],
                            value: parts[1]
                          };
                        });
                    }
                    $scope.$broadcast('ocInputReset');
                }
                $scope.currentMetric = $scope.definition.metric;
                $scope.loadingDimensions = true;
                loadDimensions($scope.currentMetric).then(function(res) {
                    $scope.currentDimensions = generateDimensionsForSelection(res.dimensions);
                    $scope.currentAllMetrics = res.allMetrics;
                    $scope.currentDimensions.forEach(function(dimension) {
                        dimension.$rowSelected = arrayContains($scope.definition.dimension, dimension);
                        dimension.$matchBy = arrayContainsKey($scope.definition.matchBy, dimension);
                    });
                    $scope.loadingDimensions = false;
                });
                $scope.editingDefinition = angular.copy($scope.definition);
                $scope.editModalLoadedFlag = true;
            }

            $scope.closeEditModal = function() {
                $scope.hideDefinitionCreate();
                $scope.alarmDefinitionErrorFlag = false;
            };

            $scope.editAlarmDefinition = function() {
                var newAlarmDefinition = {operation: 'alarm_definition_patch', id: $scope.editingDefinition.id};
                if ($scope.definition.name != $scope.editingDefinition.name) {
                    newAlarmDefinition.name = $scope.definition.name;
                }
                if ($scope.definition.description != $scope.editingDefinition.description) {
                    newAlarmDefinition.description = $scope.definition.description;
                }
                newAlarmDefinition.match_by = $scope.definition.matchBy;
                if ($scope.definition.severity != $scope.editingDefinition.severity) {
                    newAlarmDefinition.severity = $scope.definition.severity;
                }
                newAlarmDefinition.alarm_actions = buildNotification($scope.notificationList, 'alarm');
                newAlarmDefinition.ok_actions = buildNotification($scope.notificationList, 'ok');
                newAlarmDefinition.undetermined_actions = buildNotification($scope.notificationList, 'undetermined');
                var newExpression = getExpression($scope.definition);
                var currentExpression = getExpression($scope.editingDefinition);
                if (newExpression != currentExpression) {
                    newAlarmDefinition.expression = newExpression;
                }
                bllApiRequest.patch('monitor', newAlarmDefinition).then(
                    function(data) {
                        addNotification('info', $translate.instant('alarm_definitions.edit.success',
                                        {name: $scope.definition.name}));
                        reloadAlarmDefinitionTable();
                        $scope.hideDefinitionCreate();
                    },
                    function(error) {
                        $scope.alarmDefinitionErrorFlag = true;
                        var msg = error.data[0].data;
                        if (error.statusCode < 500) {
                            $scope.errorMessage = $translate.instant('alarm_definitions.edit.error.banner.400',
                                                  {details: msg});
                        } else {
                            $scope.errorMessage = $translate.instant('alarm_definitions.create.error.banner.500',
                                                  {details: msg});
                            addNotification('error', $translate.instant('alarm_definitions.edit.error', {details: msg}));
                        }
                    }
                );
            };

            /*
            =========================== Helpers ===========================
            */

            function parseExpression(phrase, key) {
                var tokens = phrase.split(key);
                $scope.definition.operator = key;
                $scope.definition.metric = tokens[0].trim();
                $scope.definition.value = tokens[1].trim();
                $scope.operatorFound = true;
            }
        }
    ]);
})(angular);
