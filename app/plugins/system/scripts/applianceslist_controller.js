// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(ng) {
    'use strict';

    var p = ng.module('plugins');

    p.controller('AppliancesListController', ['$scope', '$http', '$translate', 'bllApiRequest', 'ocValidators',
        '$timeout', 'addNotification', 'log', '$q', 'isUndefined', 'ArdanaService', 'filterOutComputeRoles',
        function($scope, $http, $translate, bllApiRequest, ocValidators, $timeout, addNotification, log, $q, isUndefined, ArdanaService, filterOutComputeRoles) {
            $scope.selectedAppliances = [];

            $scope.tableConfig = {
                headers: [{
                    name: $translate.instant('system.applianceslist.field.name'),
                    type: 'caselessString',
                    sortfield: 'hostname',
                    displayfield: 'hostname',
                    highlightExpand: true,
                    isNotHtmlSafe: true
                }, {
                    name: $translate.instant('system.applianceslist.field.role'),
                    type: 'string',
                    sortfield: 'role',
                    displayfield: 'role',
                    specialColumnType: 'custom',
                    customDisplayFilter: function(data) {
                        var roleValue = $translate.instant('system.filter.role.' + (data.role).toLowerCase());
                        return roleValue.indexOf('system.filter.role.') === 0 ? data.role : roleValue;
                    },
                    filterOptions: [{
                        displayLabel: $translate.instant('system.filter.role.management-role'),
                        value: 'MANAGEMENT-ROLE'
                    }, {
                        displayLabel: $translate.instant('system.filter.role.controller-role'),
                        value: 'CONTROLLER-ROLE'
                    }, {
                        displayLabel: $translate.instant('system.filter.role.enterprise-role'),
                        value: 'ENTERPRISE-ROLE'
                    }, {
                        displayLabel: $translate.instant('system.filter.role.ardana-role'),
                        value: 'ARDANA-ROLE'
                    }, {
                        displayLabel: $translate.instant('system.filter.role.db_rabbit-role'),
                        value: 'DB_RABBIT-ROLE'
                    }, {
                        displayLabel: $translate.instant('system.filter.role.monitoring-role'),
                        value: 'MONITORING-ROLE'
                    }, {
                        displayLabel: $translate.instant('system.filter.role.network-role'),
                        value: 'NETWORK-ROLE'
                    }, {
                        displayLabel: $translate.instant('system.filter.role.osd-role'),
                        value: 'OSD-ROLE'
                    }, {
                        displayLabel: $translate.instant('system.filter.role.rgw-role'),
                        value: 'GSW-ROLE'
                    }, {
                        displayLabel: $translate.instant('system.filter.role.vsa-role'),
                        value: 'VSA-ROLE'
                    }, {
                        displayLabel: $translate.instant('system.filter.role.swpac-role'),
                        value: 'SWPAC-ROLE'
                    }, {
                        displayLabel: $translate.instant('system.filter.role.swobj-role'),
                        value: 'SWOBJ-ROLE'
                    }]
                }, {
                    name: $translate.instant('system.applianceslist.field.status'),
                    type: 'status',
                    sortfield: 'status_display',
                    displayfield: 'status_display',
                    specialColumnType: 'custom',
                    customDisplayFilter: function(data) {
                        var roleValue = data.status_display ? $translate.instant('common.system.status.' + data.status_display.toLowerCase()) : '';
                        return roleValue.indexOf('common.system.status.') === 0 ? data.status_display : roleValue;
                    },
                    filterOptions: [{
                        displayLabel: $translate.instant('common.system.status.unknown'),
                        value: 'UNKNOWN'
                    }, {
                        displayLabel: $translate.instant('common.system.status.up'),
                        value: 'UP'
                    }, {
                        displayLabel: $translate.instant('common.system.status.down'),
                        value: 'DOWN'
                    }, {
                        displayLabel: $translate.instant('common.system.status.warn'),
                        value: 'WARN'
                    }, {
                        displayLabel: $translate.instant('common.system.status.error'),
                        value: 'ERROR'
                    }]
                }],


                //since these are selected by default, include them in the list
                filters: [],
                pageConfig: {
                    page: 1, //1 is the default
                    pageSize: 25 //1000 is the default
                },
                methods: [],
                actionMenuConfig: [],
                globalActionsConfig: []
            };

            //
            // appliance monasca details
            //
            var resetDetails = function() {
                $scope.details = {};
                $scope.details.memory = {
                    'data': {
                        'count': 0
                    },
                    'max': 0,
                    'label': $translate.instant('common.selectioncount.total.generic'),
                    'unit': $translate.instant('common.unit.GB'),
                    'title': $translate.instant('common.label.memory')
                };
                $scope.details.storage = {
                    'data': {
                        'count': 0
                    },
                    'max': 0,
                    'label': $translate.instant('common.selectioncount.total.generic'),
                    'unit': $translate.instant('common.unit.GB'),
                    'title': $translate.instant('common.label.storage')
                };
                $scope.details.compute = {
                    'data': {
                        'count': 0
                    },
                    'max': 0,
                    'label': '%',
                    'unit': '',
                    'title': $translate.instant('common.label.compute')
                };
            };

            $scope.showDetailsModal = false;
            $scope.showEditModal = false;

            $scope.$on('tableSelectionChanged', function($event, selections) {
                $scope.selectedAppliances = selections;
            });

            //kvm status is different from esx status
            //try to map some of the kvm status to match esx
            //http://wiki.libvirt.org/page/VM_lifecycle
            //sudo virsh list --all
            var applStatusMap = {
                'OK': 'UP',
                'UNDETERMINED': 'UNKNOWN',
                'ALARMED': 'DOWN'
            };

            var getStartTime = function() {
                var now_utc = (new Date()).getTime();
                //go back to 1 minute so we can have data
                var backtime_utc = now_utc - Number(60 * 1000);
                return new Date(backtime_utc).toISOString();
            };

            var getAverageMeasurementData = function(data) {
                var total = 0;
                var average = 0;
                if (!Array.isArray(data) || data.length === 0) {
                    return average;
                }
                var measurements = data[0].measurements;

                if (!isUndefined(measurements) &&
                    Array.isArray(measurements) &&
                    measurements.length !== 0) {
                    for (var idx in measurements) {
                        total = total + measurements[idx][1];
                    }
                    average = total / measurements.length;
                }
                return average;
            };

            var total_mem = 0;
            var used_mem = 0;

            var getHostFreeMemoryData = function(host) {
                used_mem = 0;
                var req_params = {
                    'operation': 'measurement_list',
                    'dimensions': {
                        'hostname': host
                    },
                    'name': 'mem.free_mb',
                    'start_time': getStartTime()
                };

                return bllApiRequest.get('monitor', req_params).then(
                    function(response) {
                        log('info', 'Successfully finished getting the host mem.free_mb data for host=' + host);
                        var free_mem = getAverageMeasurementData(response.data);
                        used_mem = total_mem - free_mem;
                        $scope.details.memory.data.count =
                            Math.round(used_mem / 1024);
                        $scope.details.memory.max =
                            Math.round(total_mem / 1024);
                    },
                    function(error_data) {
                        addNotification(
                            "error",
                            $translate.instant("alarm.summary.details.host.memory.error"));
                        log('error', 'Failed to get host mem.free_mb data for host=' + host);
                        log('error', 'error data = ' + JSON.stringify(error_data));
                    }
                );
            };

            var getHostTotalMemoryData = function(host) {
                total_mem = 0;

                var req_params = {
                    'operation': 'measurement_list',
                    'dimensions': {
                        'hostname': host
                    },
                    'name': 'mem.total_mb',
                    'start_time': getStartTime()
                };

                return bllApiRequest.get('monitor', req_params).then(
                    function(response) {
                        log('info', 'Successfully finished getting the host mem.total_mb data for host=' + host);
                        total_mem = getAverageMeasurementData(response.data);
                        getHostFreeMemoryData(host);
                    },
                    function(error_data) {
                        addNotification(
                            "error",
                            $translate.instant("alarm.summary.details.host.memory.error"));
                        log('error', 'Failed to get host mem.total_mb for host=' + host);
                        log('error', 'error data = ' + JSON.stringify(error_data));
                    }
                );
            };

            var total_disk = 0;
            var used_disk = 0;

            var getHostUsedStorageData = function(host) {
                used_disk = 0;
                var req_params = {
                    'operation': 'measurement_list',
                    'dimensions': {
                        'hostname': host
                    },
                    'name': 'disk.total_used_space_mb',
                    'start_time': getStartTime()
                };

                return bllApiRequest.get('monitor', req_params).then(
                    function(response) {
                        log('info', 'Successfully finished getting the host disk.total_space_mb for host=' + host);
                        used_disk = getAverageMeasurementData(response.data);
                        $scope.details.storage.data.count =
                            Math.round(used_disk / 1024);
                    },
                    function(error_data) {
                        addNotification(
                            "error",
                            $translate.instant("alarm.summary.details.host.storage.error"));
                        log('error', 'Failed to get host storage disk.total_used_space_mb for host=' + host);
                        log('error', 'error data = ' + JSON.stringify(error_data));
                    }
                );
            };

            var getHostTotalStorageData = function(host) {
                total_disk = 0;
                var req_params = {
                    'operation': 'measurement_list',
                    'dimensions': {
                        'hostname': host
                    },
                    'name': 'disk.total_space_mb',
                    'start_time': getStartTime()
                };

                return bllApiRequest.get('monitor', req_params).then(
                    function(response) {
                        log('info', 'Successfully finished getting the host disk.total_space_mb for host=' + host);
                        total_disk = getAverageMeasurementData(response.data);
                        $scope.details.storage.max =
                            Math.round(total_disk / 1024);
                        getHostUsedStorageData(host);
                    },
                    function(error_data) {
                        addNotification(
                            "error",
                            $translate.instant("alarm.summary.details.host.storage.error"));
                        log('error', 'Failed to get host disk.total_space_mb for host=' + host);
                        log('error', 'error data = ' + JSON.stringify(error_data));
                    }
                );
            };

            var getHostCPUData = function(host) {
                var req_params = {
                    'operation': 'measurement_list',
                    'dimensions': {
                        'hostname': host
                    },
                    'name': 'cpu.system_perc', //'cpu.total_logical_cores',
                    'start_time': getStartTime()
                };

                return bllApiRequest.get('monitor', req_params).then(
                    function(response) {
                        log('info', 'Successfully finished getting the host cpu.total_logical_cores for host=' + host);
                        var cpu_util = getAverageMeasurementData(response.data);
                        $scope.details.compute.data.count = Math.round(cpu_util);
                        $scope.details.compute.max = 100;
                    },
                    function(error_data) {
                        addNotification(
                            "error",
                            $translate.instant("alarm.summary.details.host.compute.error"));
                        log('error', 'Failed to get host cpu.total_logical_cores for host=' + host);
                        log('error', 'error data = ' + JSON.stringify(error_data));
                    }
                );
            };

            var getHostFSData = function(host) {
                var req_params = {
                    'operation': 'measurement_list',
                    'dimensions': {
                        'hostname': host
                    },
                    'name': 'disk.space_used_perc',
                    'start_time': getStartTime(),
                    'group_by': '*'
                };

                return bllApiRequest.get('monitor', req_params).then(
                    function(response) {
                        log('info', 'Successfully finished getting the host disk.space_used_perc for host=' + host);
                        var responseSet = {};
                        var fs_util;
                        response.data.forEach(function(el,idx, array){
                            fs_util = el.measurements[0][1];
                            responseSet[el.dimensions.mount_point] = fs_util;
                        });
                        $scope.details.fs = responseSet;
                    },
                    function(error_data) {
                        addNotification(
                            "error",
                            $translate.instant("alarm.summary.details.host.fs.error"));
                        log('error', 'Failed to get host disk.space_used_perc for host=' + host);
                        log('error', 'error data = ' + JSON.stringify(error_data));
                    }
                );
            };

            var getDetailsData = function(hostname) {
                var defer = $q.defer();
                var promises = [];
                var host = hostname;
                var hostTitle = $translate.instant('alarm.summary.details.host.details.title', {
                    'host': host
                });

                resetDetails();

                $scope.details.host = hostTitle;

                promises.push(getHostTotalMemoryData(host));
                promises.push(getHostTotalStorageData(host));
                promises.push(getHostCPUData(host));
                promises.push(getHostFSData(host));
                $q.all(promises).then(defer.resolve, defer.reject);

                return defer.promise;
            };

            $scope.$on('tableSelectionExpanded', function($event, data, tableid) {
                data.metric = getDetailsData(data.hostname);
            });

            $scope.getHostStatus = function(host) {
                var req_params = {
                    'operation': 'get_appliances_status',
                    'hostnames': [host.hostname]
                };

                return bllApiRequest.get('monitor', req_params).then(
                    function(response) {
                        host.status_display = response.data[host.hostname].toUpperCase();
                    },
                    function(error_data) {
                        addNotification(
                            "error",
                            $translate.instant("alarm.summary.details.host.status.error"));
                        log('error', 'Failed to get host status for hosts=' + JSON.stringify(host.hostname));
                        log('error', 'error data = ' + JSON.stringify(error_data));
                    }
                );
            };

            $scope.getApplianceListData = function() {
                $scope.applistLoading = true;

                ArdanaService.getServerInfo().then(function(data) {
                        var rawData = filterOutComputeRoles(data);
                        var composedData = [];

                        $.each(rawData, function(sKey, sVal) {
                            $scope.getHostStatus(sVal);
                            composedData.push(sVal);
                        });
                        $scope.data = composedData;
                        $scope.applistLoading = false;
                    },
                    function(error_data) { //this is the method called when the bll call fails with error
                        console.log("-------Appliance List get-----------------  ERROR" + JSON.stringify(error_data));
                        $scope.applistLoading = false;
                        addNotification("error", $translate.instant("system.applianceslist.error_message"));
                    },
                    function(progress_data) { //this is the method called when the bll call updates status
                        console.log("-------Appliance List get----------------- IN PROGRESS: " + progress_data.progress.percentComplete);
                    }
                );
            };
            $scope.getApplianceListData();

            $scope.updateAppliance = function(form) {
                $scope.showEditModal = false;
                //TODO - call BLL here with updated data
            };
        }
    ]);
})(angular);
