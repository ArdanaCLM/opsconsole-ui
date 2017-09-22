// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {

    'use strict';

    var p = ng.module('plugins');

    p.controller('ComputeNodesArdanaController', [
        '$scope', '$translate', '$q', '$timeout', 'addNotification',
        'bllApiRequest', 'ArdanaService', 'AnsiColoursService',
        'updateEmptyDataPage', 'getClusterGrouping', 'getHostAlarmCountForGroup',
        'getHostWorstAlarmForGroup','computeHostHelperService', 'getComputeHostStateString',
        function ($scope, $translate, $q, $timeout, addNotification,
                  bllApiRequest, ArdanaService, AnsiColoursService,
                  updateEmptyDataPage, getClusterGrouping,  getHostAlarmCountForGroup,
                  getHostWorstAlarmForGroup, computeHostHelperService, getComputeHostStateString) {
            $scope.computeDataLoading = true;
            $scope.compute_nodes_data = [];
            $scope.compute_id_data_mapping = {};
            $scope.compute_nodes_table_config = {};

            //deal with empty data page for compute host
            $scope.showEmptyDataPageComputeHostFlag = false;
            $scope.emptyDataPage = {'computeHost': {}};
            $scope.initComputeDataLoading = true;

            $scope.actionMenuPermissionsCheck = function (data, actionName) {
                var actionPermissions = {
                    enabled: true,
                    hidden: false
                };

                //if it is not valid to show, hide it
                if (!computeHostHelperService.isValidToShowComputeHostAction(data, actionName)) {
                    actionPermissions = {
                        enabled: false,
                        hidden: true //hide it
                    };
                } else if (actionName === "activate" &&
                    (data.state === "activated" || data.state === "deleted")) {
                    actionPermissions = {
                        enabled: false,
                        hidden: true
                    };
                }else if (actionName === "deactivate" &&
                    data.state === 'provisioned' && data.type === 'esxcluster') {
                    actionPermissions = {
                        enabled: true,
                        hidden: false
                    };
                }

                return actionPermissions;
            };

            $scope.globalActionPermissionsCheck = function (data, actionName) {
                if (computeHostHelperService.isValidToEnableGlobalAction(data, actionName)) {
                    return false; //false to disable
                }
                else {
                    return true; //true to disable
                }
            };

            $scope.checkNotApplicable = function (data, header) {
                if (data[header.displayfield] === 'unknown' && header.displayfield !== 'ping_status') {
                    return true;
                } else if (header.displayfield === 'allocated_cpu' || header.displayfield === 'allocated_memory' ||
                    header.displayfield === 'allocated_storage') {
                    if (data[header.fieldNaCondition] === 'imported') {
                        return true;
                    }
                }
                return false;
            };

            $scope.compute_nodes_table_config = {
                headers: [{
                    name: $translate.instant("compute.compute_nodes.table.header.name"),
                    type: "caselessString",
                    displayfield: "name",
                    sortfield: 'name',
                    highlightExpand: true
                }, {
                    name: $translate.instant("compute.compute_nodes.table.header.status"),
                    type: "string",
                    displayfield: "ping_status",
                    sortfield: 'ping_status',
                    filter: 'uppercase',
                    filterOptions: [{
                        displayLabel: $translate.instant('compute.compute_nodes.filter.status.unknown'),
                        value: 'unknown'
                    }, {
                        displayLabel: $translate.instant('common.system.status.up'),
                        value: 'up'
                    }, {
                        displayLabel: $translate.instant('common.system.status.down'),
                        value: 'down'
                    }]
                }, {
                    name: $translate.instant("compute.compute_nodes.table.header.type"),
                    type: "string",
                    displayfield: "hypervisor",
                    sortfield: 'hypervisor',
                    filter: "customCase",
                    filterOptions: [{
                        displayLabel: $translate.instant('compute.compute_nodes.filter.hypervisor.hyperv'),
                        value: 'hyperv'
                    }, {
                        displayLabel: $translate.instant('compute.compute_nodes.filter.hypervisor.kvm'),
                        value: 'kvm'
                    }, {
                        displayLabel: $translate.instant('compute.compute_nodes.filter.hypervisor.esx'),
                        value: 'esx'
                    }, {
                        displayLabel: $translate.instant('compute.compute_nodes.filter.hypervisor.vcenter'),
                        value: 'vmware vcenter server'
                    }]
                }, {
                    name: $translate.instant("compute.compute_nodes.table.header.state"),
                    type: "string",
                    displayfield: "state",
                    sortfield: 'state',
                    specialColumnType: 'custom',
                    customDisplayFilter: getComputeHostStateString,
                    filterOptions: [{
                        displayLabel: $translate.instant('compute.compute_nodes.state.activated'),
                        value: 'activated'
                    }, {
                        displayLabel: $translate.instant('compute.compute_nodes.state.activating'),
                        value: 'activating'
                    }, {
                        displayLabel: $translate.instant('compute.compute_nodes.state.imported'),
                        value: 'imported'
                    }, {
                        displayLabel: $translate.instant('compute.compute_nodes.state.importing'),
                        value: 'importing'
                    }, {
                        displayLabel: $translate.instant('compute.compute_nodes.state.deactivated'),
                        value: 'deactivated'
                    }, {
                        displayLabel: $translate.instant('compute.compute_nodes.state.deactivating'),
                        value: 'deactivating'
                    }, {
                        displayLabel: $translate.instant('compute.compute_nodes.state.deleting'),
                        value: 'deleting'
                    }]
                }, {
                    name: $translate.instant("compute.compute_nodes.table.header.cpu"),
                    type: "number",
                    displayfield: "allocated_cpu",
                    sortfield: 'allocated_cpu',
                    specialTotalField: 'total_cpu',
                    specialColumnType: "percentmeter"
                }, {
                    name: $translate.instant("compute.compute_nodes.table.header.memory"),
                    type: "number",
                    displayfield: "allocated_memory",
                    sortfield: 'allocated_memory',
                    specialTotalField: 'total_memory',
                    specialColumnType: "percentmeter"
                }, {
                    name: $translate.instant("compute.compute_nodes.table.header.storage"),
                    type: "number",
                    displayfield: "allocated_storage",
                    sortfield: 'allocated_storage',
                    specialTotalField: 'total_storage',
                    specialColumnType: "percentmeter"
                }, {
                    name: 'compute.hardware.alarm_state',
                    type: 'string',
                    displayfield: 'alarm_state',
                    sortfield: 'alarm_state',
                    hidden: true,
                    filterOptions: [
                        {displayLabel: 'alarm.filter.status.unknown', value: 'UNKNOWN'},
                        {displayLabel: 'alarm.filter.status.ok', value: 'OK'},
                        {displayLabel: 'alarm.filter.status.warn', value: 'WARNING'},
                        {displayLabel: 'alarm.filter.status.critical', value: 'CRITICAL'}
                    ]
                }, {
                    name: 'compute.hardware.control_plane',
                    type: 'string',
                    displayfield: 'control_plane',
                    sortfield: 'control_plane',
                    hidden: true
                }, {
                    name: 'compute.hardware.cluster',
                    type: 'string',
                    displayfield: 'cluster',
                    sortfield: 'cluster',
                    hidden: true
                }, {
                    name: $translate.instant("compute.details.service_host.header"),
                    type: 'string',
                    displayfield: 'service_host',
                    sortfield: 'service_host',
                    hidden: true
                }],
                pageConfig: {
                    pageSize: 20
                },
                naValueCheck: $scope.checkNotApplicable,
                actionMenuConfigFunction: $scope.actionMenuPermissionsCheck,
                actionMenuConfig: [],
                globalActionsConfig: []
            };

            // Set the actions menu for Ardana Ops to the action menu items, if Ardana Service is unavailable
            ArdanaService.readyPromise
                .then(ArdanaService.updateIsConfigEncrypted)
                .then(function () {
                    if (ArdanaService.isAvailable()) {
                        $scope.compute_nodes_table_config.actionMenuConfig = [
                            {
                                label: $translate.instant("compute.compute_nodes.ardana.button.activate"),
                                name: "activate",
                                action: function (data) {
                                    activateCompute_Ardana(angular.copy(data));
                                }
                            },
                            {
                                label: $translate.instant("compute.compute_nodes.ardana.button.deactivate"),
                                name: "deactivate",
                                action: function (data) {
                                    deactivateCompute_Ardana(angular.copy(data));
                                }
                            },
                            {
                                label: $translate.instant("compute.compute_nodes.ardana.button.delete"),
                                name: "delete",
                                action: function (data) {
                                    deleteCompute_Ardana(angular.copy(data));
                                }
                            }];
                        $scope.compute_nodes_table_config.globalActionsConfigFunction =
                            $scope.globalActionPermissionsCheck;
                        $scope.compute_nodes_table_config.globalActionsConfig = [
                            {
                                label: $translate.instant("compute.compute_nodes.ardana.button.create_host"),
                                name: 'globalActionAddCompute',
                                action: function () {
                                    addComputeNode_Ardana();
                                },
                                disabled: true
                            }
                        ];
                    }
                });

            function setComputeData(ardanaOverride) {
                $scope.computeDataLoading = true;

                // Overwrite the monasca state for nodes with in play or recently completed Ardana processes. Monasca
                // status will lag behind the Ardana action. In order to avoid flip-flopping of state on refresh, or new
                // clients seeing stale state, check active or recently completed plays and overwrite any laggy value.
                // This is only applicable for 60 seconds, afterwards the monasca state will be reported again
                // regardless.
                var ardanaOverrides = {
                    stop: {},
                    start: {}
                };
                // If we don't override values make promise a no-op with empty collections (functionality as before)
                var ardanaOverridesPromise = ardanaOverride && ArdanaService.isAvailable() ?
                    ArdanaService.findStartStopRuns(120 * 1000).catch(function () {
                        return ardanaOverrides;
                    }) : $q.when(ardanaOverrides);

                var request = {operation: 'get_compute_list'};

                $scope.emptyDataPage.computeHost = {};

                // Wait for completion in parallel to help with load time
                $q.all([bllApiRequest.get("compute", request), ardanaOverridesPromise])
                    .then(function (results) {
                        $scope.hostData = results[0];
                        ardanaOverrides = results[1];

                        //show empty data page
                        if (!angular.isDefined($scope.hostData) || !angular.isDefined($scope.hostData.data) ||
                            $scope.hostData.data.length === 0) {
                            $scope.showEmptyDataPageComputeHostFlag = true;
                            $scope.computeDataLoading = false;
                            updateEmptyDataPage(
                                $scope.emptyDataPage.computeHost,
                                'nodata',
                                $translate.instant('compute.host.empty.data'),
                                '',
                                'compute.host.empty.data.action_label',
                                $scope.addComputeNodeStackableModal
                            );
                        }
                        else { //show table
                            $scope.compute_nodes_data = [];
                                // get cluster information
                            getClusterGrouping().then(function(clusters) {
                                $scope.clusterGroups = clusters;
                                addHiddenClusterColumnFilterOptions();
                                $scope.worstAlarmStateForHosts = [];
                                $scope.worstAlarmStateForHostCount = 0;

                                var promises = $scope.clusterGroups.map(getHostAlarmCountForGroup);
                                $q.all(promises).then(function(results) {
                                  $scope.computeDataLoading = false;
                                    results.forEach(function(res) {
                                        var groupAlarmData = getHostWorstAlarmForGroup(res.alarms, res.group.nodes);
                                        $scope.worstAlarmStateForHosts.push(groupAlarmData.hostAlarmData);
                                        $scope.worstAlarmStateForHostCount++;

                                        if ($scope.worstAlarmStateForHostCount === $scope.clusterGroups.length) {
                                            $scope.hostData.data.forEach(function(compute_data) {
                                                var clusterInfo = getClusterInfo(compute_data.service_host);
                                                if (angular.isDefined(clusterInfo)) {
                                                    compute_data.control_plane = clusterInfo.control_plane;
                                                    compute_data.cluster = clusterInfo.cluster;
                                                }
                                                var worstAlarm = getWorstAlarmStateForHost(compute_data.service_host);
                                                if (angular.isDefined(worstAlarm)) {
                                                    compute_data.alarm_state = worstAlarm;
                                                }
                                                processComputeData(compute_data, ardanaOverrides);
                                            });
                                        }
                                    });
                                });
                            });
                        }

                        //only show initComputeDataLoading at very first time
                        if ($scope.initComputeDataLoading === true) {
                            $scope.initComputeDataLoading = false;
                        }
                    })
                    .catch(function (error_data) {
                        $scope.computeDataLoading = false;

                        var errorReason =
                            error_data.data ? error_data.data[0].data : '';
                        var errorMsg = $translate.instant(
                            "compute.compute_nodes.messages.compute_list.error",
                            {'reason': errorReason}
                        );
                        addNotification('error', errorMsg);

                        //show empty data page for error
                        $scope.showEmptyDataPageComputeHostFlag = true;
                        updateEmptyDataPage(
                            $scope.emptyDataPage.computeHost,
                            'servererror',
                            errorMsg,
                            'common.empty.data.checkbackend',
                            'common.reload.table',
                            setComputeData
                        );

                        //only show initComputeDataLoading at very first time
                        if ($scope.initComputeDataLoading === true) {
                            $scope.initComputeDataLoading = false;
                        }
                    });
            }

            function processComputeData(compute_data, ardanaOverrides) {
                var state;
                // Check if ardana_start or ardana_stop has run/is running on this node. If so override the
                // monasca state until it has had a chance to catch up
                if (angular.isDefined(ardanaOverrides.start[compute_data.name])) {
                    // If the process is alive, 'ing' it. Otherwise 'ed' it.
                    state = ardanaOverrides.start[compute_data.name] ? 'activating' : 'activated';
                    // Only override if state is stale
                    compute_data.state = compute_data.state === 'deactivated' ? state : compute_data.state;
                } else if (angular.isDefined(ardanaOverrides.stop[compute_data.name])) {
                    // If the process is alive, 'ing' it. Otherwise 'ed' it.
                    state = ardanaOverrides.stop[compute_data.name] ? 'deactivating' : 'deactivated';
                    // Only override if state is stale
                    compute_data.state = compute_data.state === 'activated' ? state : compute_data.state;
                }

                var progress_data = compute_data.progress !== undefined ? compute_data.progress : "0";
                compute_data.progress_data = [{
                    label: $translate.instant("compute.compute_nodes.state." + compute_data.state.toLowerCase()),
                    value: '',
                    type: 'info'
                }];
                if (compute_data.state === 'activated' || compute_data.state === 'imported') {
                    compute_data.progress_data.value = '0';
                } else {
                    compute_data.progress_data.type = progress_data;
                }
                $scope.compute_id_data_mapping[compute_data.id] = compute_data;
                $scope.compute_nodes_data.push(compute_data);
            }

            function getClusterInfo(hostToSearch) {
                var not_found;
                for (var i=0; i<$scope.clusterGroups.length; i++) {
                    var hosts = $scope.clusterGroups[i].nodes;
                    for (var j=0; j<hosts.length; j++) {
                        if (hostToSearch === hosts[j]) {
                            return {control_plane: $scope.clusterGroups[i].control_plane,
                                    cluster: $scope.clusterGroups[i].cluster};
                        }
                    }
                }
                return not_found;
            }

            function addHiddenClusterColumnFilterOptions() {
                var clusterFilters = [];
                $scope.clusterGroups.forEach(function(group) {
                    clusterFilters.push({displayLabel: group.cluster, value: group.cluster});
                });
                for (var i=0; i<$scope.compute_nodes_table_config.headers.length; i++) {
                    if ($scope.compute_nodes_table_config.headers[i].sortfield === 'cluster') {
                        $scope.compute_nodes_table_config.headers[i].filterOptions = clusterFilters;
                        break;
                    }
                }
            }

            function getWorstAlarmStateForHost(hostToSearch) {
                var not_found;
                for (var i=0; i<$scope.worstAlarmStateForHosts.length; i++) {
                    for (var j=0; j<$scope.worstAlarmStateForHosts[i].length; j++) {
                        if (hostToSearch === $scope.worstAlarmStateForHosts[i][j].hostname) {
                            return ($scope.worstAlarmStateForHosts[i][j].state).toUpperCase();
                        }
                    }
                }
                return not_found;
            }

            // Initial load - wait until we know if the Ardana Service is available
            ArdanaService.readyPromise.then(function () {
                setComputeData(true);
            });

            //pass service reference to scope
            $scope.computeHostService = computeHostHelperService;

            //callback functions that will be used in service
            var broadcastRestInputs = function() {
                $scope.$broadcast('ocInputReset');
            };

            //this function is used to set the table state during progress
            //especially for Ardana that the transition state is not persisted.
            var setProgressState = function(id, state) {
                if(!angular.isDefined(id)) {
                    return;
                }
                if (angular.isDefined($scope.compute_id_data_mapping[id])) {
                    $scope.compute_id_data_mapping[id].state = state;
                }
            };

            //pass refresh table and set state
            computeHostHelperService.initService({
                'refreshTableFunc': setComputeData,
                'setProgressStateFunc': setProgressState,
                'broadcastResetInputFunc': broadcastRestInputs
            });

            //actions code moved to compute_host_helper_service.js
            //so they could be shared across pages.

            function addComputeNode_Ardana() {
                computeHostHelperService.addCompute_Ardana();
            }

            function activateCompute_Ardana (data) {
                computeHostHelperService.activateCompute_Ardana(data);
            }

            function deactivateCompute_Ardana (data) {
                computeHostHelperService.deactivateCompute_Ardana(data);
            }

            function deleteCompute_Ardana(data) {
                computeHostHelperService.deleteCompute_Ardana(data);
            }
        }
    ]);
})(angular);
