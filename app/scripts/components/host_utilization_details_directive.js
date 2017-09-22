// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
/**
 * This is to handle the directive <host-utilization-details></host-utilization-details>
 */
(function(){
    'use strict';
    angular.module('operations-ui').directive("hostUtilizationDetails", [
        '$translate','log', '$q', 'bllApiRequest', 'addNotification',
        function($translate, log, $q, bllApiRequest, addNotification) {
            return {
                restrict: "E",
                transclude: true,
                scope: {
                    hostname: "="
                },
                templateUrl: 'components/host_utilization_details.html',

                link: function(scope, el, attr) {

                    scope.hostUtilsDataLoadingFlag = false;
                    scope.hostUtilsData = {};

                    var initData = function () {
                        scope.hostUtilsData = {};
                        scope.hostUtilsData.memory = {
                            'data': {'count': 0},
                            'max': 0,
                            'unit': $translate.instant('common.unit.GB'),
                            'title': $translate.instant('common.label.memory')
                        };
                        scope.hostUtilsData.storage = {
                            'data': {'count': 0},
                            'max': 0,
                            'unit': $translate.instant('common.unit.GB'),
                            'title': $translate.instant('common.label.storage')
                        };
                        scope.hostUtilsData.compute = {
                            'data': {'count': 0},
                            'max': 0,
                            'label': '%',
                            'unit': '',
                            'title': $translate.instant('common.label.compute')
                        };
                    };

                    var getStartTime = function () {
                        var now_utc = (new Date()).getTime();
                        //go back to 1 minute so we can have data
                        var backtime_utc = now_utc - Number(60 * 1000);
                        return new Date(backtime_utc).toISOString();
                    };

                    var getAverageMeasurementData = function (data) {
                        var total = 0;
                        var average = 0;
                        if (angular.isUndefined(data) || !Array.isArray(data) || data.length === 0) {
                            return -1; //indicate no data
                        }
                        var measurements = data[0].measurements;

                        if (angular.isDefined(measurements) &&
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

                    var getHostUsableMemoryData = function () {
                        used_mem = 0;
                        var req_params = {
                            'operation': 'measurement_list',
                            'dimensions': {'hostname': scope.hostname},
                            'name': 'mem.usable_mb',
                            'start_time': getStartTime()
                        };

                        return bllApiRequest.get('monitor', req_params).then(
                            function (response) {
                                log('info', 'Successfully finished getting the host mem.usable_mb data for host=' + scope.hostname);
                                var usable_mem = getAverageMeasurementData(response.data);
                                if(usable_mem !== -1) {
                                    used_mem = total_mem - usable_mem;
                                    scope.hostUtilsData.memory.data.count =
                                        (used_mem / 1024).toFixed(2);
                                    scope.hostUtilsData.memory.max =
                                        (total_mem / 1024).toFixed(2);
                                }
                            },
                            function (error_data) {
                                addNotification(
                                    "error",
                                    $translate.instant("alarm.summary.details.host.memory.error"));
                                log('error', 'Failed to get host mem.usable_mb data for host=' + scope.hostname);
                                log('error', 'error data = ' + JSON.stringify(error_data));
                            }
                        );
                    };

                    var getHostTotalMemoryData = function () {
                        total_mem = 0;

                        var req_params = {
                            'operation': 'measurement_list',
                            'dimensions': {'hostname': scope.hostname},
                            'name': 'mem.total_mb',
                            'start_time': getStartTime()
                        };

                        return bllApiRequest.get('monitor', req_params).then(
                            function (response) {
                                log('info', 'Successfully finished getting the host mem.total_mb data for host=' + scope.hostname);
                                total_mem = getAverageMeasurementData(response.data);
                                if (total_mem !== -1) {
                                    getHostUsableMemoryData();
                                }
                            },
                            function (error_data) {
                                addNotification(
                                    "error",
                                    $translate.instant("alarm.summary.details.host.memory.error"));
                                log('error', 'Failed to get host mem.total_mb for host=' + scope.hostname);
                                log('error', 'error data = ' + JSON.stringify(error_data));
                            }
                        );
                    };

                    var total_disk = 0;
                    var used_disk = 0;

                    var getHostUsedStorageData = function () {
                        used_disk = 0;
                        var req_params = {
                            'operation': 'measurement_list',
                            'dimensions': {'hostname': scope.hostname},
                            'name': 'disk.total_used_space_mb',
                            'start_time': getStartTime()
                        };

                        return bllApiRequest.get('monitor', req_params).then(
                            function (response) {
                                log('info', 'Successfully finished getting the host disk.total_space_mb for host=' + scope.hostname);
                                used_disk = getAverageMeasurementData(response.data);
                                if(used_disk !== -1) {
                                    scope.hostUtilsData.storage.data.count =
                                        (used_disk / 1024).toFixed(2);
                                    scope.hostUtilsData.storage.max =
                                        (total_disk / 1024).toFixed(2);
                                }
                            },
                            function (error_data) {
                                addNotification(
                                    "error",
                                    $translate.instant("alarm.summary.details.host.storage.error"));
                                log('error', 'Failed to get host storage disk.total_used_space_mb for host=' + scope.hostname);
                                log('error', 'error data = ' + JSON.stringify(error_data));
                            }
                        );
                    };

                    var getHostTotalStorageData = function () {
                        total_disk = 0;
                        var req_params = {
                            'operation': 'measurement_list',
                            'dimensions': {'hostname': scope.hostname},
                            'name': 'disk.total_space_mb',
                            'start_time': getStartTime()
                        };

                        return bllApiRequest.get('monitor', req_params).then(
                            function (response) {
                                log('info', 'Successfully finished getting the host disk.total_space_mb for host=' + scope.hostname);
                                total_disk = getAverageMeasurementData(response.data);
                                if(total_disk !== -1) {
                                    getHostUsedStorageData();
                                }
                            },
                            function (error_data) {
                                addNotification(
                                    "error",
                                    $translate.instant("alarm.summary.details.host.storage.error"));
                                log('error', 'Failed to get host disk.total_space_mb for host=' + scope.hostname);
                                log('error', 'error data = ' + JSON.stringify(error_data));
                            }
                        );
                    };

                    var getHostCPUData = function () {
                        var req_params = {
                            'operation': 'measurement_list',
                            'dimensions': {'hostname': scope.hostname},
                            'name': 'cpu.system_perc',
                            'start_time': getStartTime()
                        };

                        return bllApiRequest.get('monitor', req_params).then(
                            function (response) {
                                log('info', 'Successfully finished getting the host cpu.total_logical_cores for host=' + scope.hostname);
                                var cpu_util = getAverageMeasurementData(response.data);
                                if(cpu_util !== -1) {
                                    scope.hostUtilsData.compute.data.count = (cpu_util).toFixed(2);
                                    scope.hostUtilsData.compute.max = 100;
                                }
                            },
                            function (error_data) {
                                addNotification(
                                    "error",
                                    $translate.instant("alarm.summary.details.host.compute.error"));
                                log('error', 'Failed to get host cpu.total_logical_cores for host=' + scope.hostname);
                                log('error', 'error data = ' + JSON.stringify(error_data));
                            }
                        );
                    };

                    var getAlarmHostUtilsData = function () {
                        var defer = $q.defer();
                        var promises = [];

                        promises.push(getHostTotalMemoryData());
                        promises.push(getHostTotalStorageData());
                        promises.push(getHostCPUData());
                        $q.all(promises).then(defer.resolve, defer.reject);

                        return defer.promise;
                    };

                    initData();

                    scope.$on('loadHostUtilsData', function(event, args) {
                        if (angular.isDefined(args) &&
                            angular.isDefined(args.hostname &&
                            !scope.hostUtilsDataLoadingFlag)) {
                            scope.hostUtilsDataLoadingFlag = true;
                            scope.hostname = args.hostname;
                            initData();
                            getAlarmHostUtilsData().then(function() {
                                scope.hostUtilsDataLoadingFlag = false;
                            });
                        }
                    });

                    //workaround to deal with data loading issue for
                    //second alarm detail stackable modal loaded from dashboard
                    //for some reason it can not find the event loadHostUtilsData
                    scope.$watch('hostname', function() {
                        if (angular.isDefined(scope.hostname) &&
                            !scope.hostUtilsDataLoadingFlag) {
                            scope.hostUtilsDataLoadingFlag = true;
                            initData();
                            getAlarmHostUtilsData().then(function() {
                                scope.hostUtilsDataLoadingFlag = false;
                            });
                        }
                    });
                }//end link
            };
        }
    ]);
})();