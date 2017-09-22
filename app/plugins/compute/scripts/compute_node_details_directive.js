// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
    'use strict';

    angular.module('plugins').directive('computeNodeDetails', [
        'bllApiRequest', '$translate', 'log', 'addNotification', '$filter', 'getHostAlarmData',
        'computeHostHelperService', '$rootScope', '$q', 'getKeyFromScope', 'bytesToSize',
        'getComputeHostStateString',
        function(bllApiRequest, $translate, log, addNotification, $filter, getHostAlarmData,
                 computeHostHelperService, $rootScope, $q, getKeyFromScope, bytesToSize,
                 getComputeHostStateString) {
            return {
                restrict: 'E',

                scope: {
                    selectedhost: '='
                },
                templateUrl: 'compute/templates/compute_node_details.html',

                link: function(scope, element) {

                    if (angular.isDefined(element.attr('is-drilldown'))) {
                         //pass service reference to scope
                        scope.computeHostServiceFromDetail = computeHostHelperService;
                    }

                    scope.getComputeExpandDetails = function(data) {
                        scope.loadingDetailsDataFlag = true;
                        var computeData = data;
                        scope.computeDetails = {};
                        scope.computeDetails.hostData = data;
                        scope.computeDetails.hostData.stateStr = getComputeHostStateString(data);
                        scope.computeDetails.hostUtilsData_memory = {
                            count: undefined,
                            max: undefined,
                            label: $translate.instant('common.selectioncount.total.generic'),
                            unit: $translate.instant('common.unit.GB'),
                            title: $translate.instant('common.label.memory')
                        };
                        scope.computeDetails.hostUtilsData_storage = {
                            count: undefined,
                            max: undefined,
                            label: $translate.instant('common.selectioncount.total.generic'),
                            unit: $translate.instant('common.unit.GB'),
                            title: $translate.instant('common.label.storage')
                        };
                        scope.computeDetails.hostUtilsData_compute = {
                            count: undefined,
                            max: undefined,
                            label: '%',
                            unit: '',
                            title: $translate.instant('common.label.compute')
                        };
                        var request = {
                            'operation': 'details',
                            "data": {
                                "id": data.id,
                                "type": data.type
                            }
                        };
                        var option;
                        if (angular.isDefined(data.region)) {
                            option = { 'region': data.region };
                        }
                        bllApiRequest.get("compute", request, option).then(
                            function(data) {
                                if (data.status === 'complete') {
                                    scope.computeDetails.details = data;
                                    var adata = data.data;
                                    if (angular.isDefined(adata) && angular.isDefined(adata.monasca)) {
                                        scope.computeDetails.hostUtilsData_memory.count =
                                            scope.convertMBToGB(adata.monasca.used_memory_mb);
                                        scope.computeDetails.hostUtilsData_memory.max =
                                            scope.convertMBToGB(adata.monasca.total_memory_mb);
                                        scope.computeDetails.hostUtilsData_storage.count =
                                            scope.convertMBToGB(adata.monasca.used_storage_mb);
                                        scope.computeDetails.hostUtilsData_storage.max =
                                            scope.convertMBToGB(adata.monasca.total_storage_mb);
                                        scope.computeDetails.hostUtilsData_compute.count =
                                            parseFloat(scope.checkNoData(adata.monasca.used_cpu_perc)).toFixed(2);
                                        if (!angular.isDefined(adata.monasca.used_cpu_perc) ||
                                            adata.monasca.used_cpu_perc === -1) {
                                            scope.computeDetails.hostUtilsData_compute.max = 0;
                                        } else {
                                            scope.computeDetails.hostUtilsData_compute.max = 100;
                                        }
                                    }
                                } else {
                                    addNotification("error",
                                        $translate.instant("compute.table.expand.error", {data: computeData.name}));
                                }
                                scope.loadingDetailsDataFlag = false;
                            },
                            function(error_data) {
                                addNotification("error",
                                    $translate.instant("compute.compute_nodes.messages.compute_details.error", {
                                        name: computeData.name,
                                        error: error_data.data[0].data
                                    }));
                                scope.loadingDetailsDataFlag = false;
                            }
                        );
                    };

                    scope.checkNoData = function(data) {
                        if (!angular.isDefined(data) || data === -1) {
                            return 0;
                        }
                        return data;
                    };

                    scope.convertMBToGB = function(data){
                        if (data === -1 || data === undefined){
                            return 0;
                        }else{
                            return (data/1024).toFixed(2);
                        }
                    };

                    scope.getDetailsData = function() {
                        if (angular.isDefined(scope.selectedhost)) {
                            scope.getComputeExpandDetails(scope.selectedhost);

                            scope.computeDetails.allotted_cpu = {
                                count: scope.checkNoData(scope.selectedhost.allocated_cpu),
                                max: scope.checkNoData(scope.selectedhost.total_cpu),
                                label: $translate.instant('compute.compute_nodes.table.row.label.cores_2'),
                                unit: '',
                                title: $translate.instant('common.label.compute')
                            };

                            scope.computeDetails.allotted_memory = {
                                count: Math.round(scope.checkNoData(scope.selectedhost.allocated_memory) / 1024),
                                max: Math.round(scope.checkNoData(scope.selectedhost.total_memory / 1024)),
                                label: $translate.instant('common.selectioncount.total.generic'),
                                unit: $translate.instant('common.unit.GB'),
                                title: $translate.instant('common.label.memory')
                            };

                            scope.computeDetails.allotted_storage = {
                                count: scope.checkNoData(scope.selectedhost.allocated_storage),
                                max: scope.checkNoData(scope.selectedhost.total_storage),
                                label: $translate.instant('common.selectioncount.total.generic'),
                                unit: $translate.instant('common.unit.GB'),
                                title: $translate.instant('common.label.storage')
                            };

                            scope.computeDetails.hostAlarmData = {};
                            scope.computeDetails.hostAlarmData.data = {
                                critical: {count: 0},
                                warning: {count: 0},
                                unknown: {count: 0},
                                ok: {count: 0},
                                count: 0
                            };

                            //hosts that are not activated will not have alarm data
                            //hyperv hosts are not supported by monasca
                            if(scope.selectedhost.state === 'activated' && scope.selectedhost.type.toLowerCase() !== "hyperv"){
                                var hypervisor_hostname = scope.selectedhost.hypervisor_hostname;
                                if(!hypervisor_hostname && scope.selectedhost.type && scope.selectedhost.type.toLowerCase() === "esxcluster") {
                                    hypervisor_hostname = scope.selectedhost.cluster_moid + "." + scope.selectedhost.resource_mgr_id;
                                }
                                // if hypervisor_hostname not yet set, then try the service_host
                                if(!hypervisor_hostname) {
                                    hypervisor_hostname = scope.selectedhost.service_host;
                                }
                                getHostAlarmData(hypervisor_hostname, scope.selectedhost.type).then(function(res) {
                                    scope.computeDetails.hostAlarmData.data = res;
                                    scope.computeDetails.hostAlarmData.title = scope.selectedhost.name + ': ' + res.count + ' ' +
                                        $filter('uppercase')($translate.instant("common.details.alarms.subtitle"));
                                });
                            }
                        }
                    };

                    scope.$watch('selectedhost', scope.getDetailsData);


                    //call back functions that the service need to use
                    var broadcastRestInputs = function() {
                        scope.$broadcast('ocInputReset');
                    };

                    //this function is used to set the table state during progress
                    //especially for ardana that the transition state is not persisted.
                    var setProgressState = function(id, state) {
                        if(!angular.isDefined(id)) {
                            return;
                        }
                        scope.computeDetails.hostData.state = state;
                    };

                    //deal with button actions in the details
                    scope.isValidToShowComputeHostButton= function(data, actionName) {
                        if(!angular.isDefined(data)) {
                            return false;
                        }

                        return computeHostHelperService.isValidToShowComputeHostAction(data, actionName);
                    };

                    var closeDetailModal = function() {
                        var detailModal =
                                getKeyFromScope(
                                    'tableDetails',
                                    scope.$parent.$parent.$parent.$parent);
                        if(angular.isDefined(detailModal)) {
                            detailModal.closeModal();
                        }
                        else {
                            detailModal =
                                getKeyFromScope(
                                    'heatmapDrilldownModal',
                                    scope.$parent.$parent.$parent.$parent);
                            if(angular.isDefined(detailModal)) {
                                detailModal.closeModal();
                            }
                        }
                    };

                    var refreshSummaryPage = function() {
                        if (angular.isDefined(scope.$parent.$parent.$parent.$parent.refreshSummaryPage)){
                            scope.$parent.$parent.$parent.$parent.refreshSummaryPage();
                        }
                    };

                    //pass refresh detail and set state when we do drilldown
                    //compute inventory summary
                    if(angular.isDefined(scope.computeHostServiceFromDetail)) {
                        computeHostHelperService.initService({
                            'setProgressStateFunc': setProgressState,
                            'broadcastResetInputFunc': broadcastRestInputs,
                            'closeDetailModalFunc': closeDetailModal,
                            'refreshSummaryFunc': refreshSummaryPage
                        });
                    }

                    scope.activateComputeHost = function(data) {
                        //TODO need a better way to diff envs
                        if($rootScope.appConfig.env === 'stdcfg') {
                            if(!angular.isDefined(scope.computeHostServiceFromDetail)) {
                                closeDetailModal();
                            }
                            computeHostHelperService.activateCompute_Ardana(data);
                        }
                    };

                    scope.deactivateComputeHost = function(data) {
                        //TODO need better way to diff envs
                        if($rootScope.appConfig.env === 'stdcfg') {
                            if(!angular.isDefined(scope.computeHostServiceFromDetail)) {
                                closeDetailModal();
                            }
                            computeHostHelperService.deactivateCompute_Ardana(data);
                        }
                    };

                    scope.deleteComputeHost = function(data) {
                        //TODO need better way to diff envs
                        if($rootScope.appConfig.env === 'stdcfg') {
                            if(!angular.isDefined(scope.computeHostServiceFromDetail)) {
                                closeDetailModal();
                            }
                            computeHostHelperService.deleteCompute_Ardana(data);
                        }
                    };
                }
            };
        }
    ]);
})();
