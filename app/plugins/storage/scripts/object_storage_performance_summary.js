// (c) Copyright 2017 Hewlett Packard Enterprise Development LP
(function (ng) {
    'use strict';
    var p = ng.module('plugins');
    p.controller('ObjectStoragePerformanceSummaryController', ['$scope', '$translate', 'bllApiRequest', 'ifValueNA',
        'unitCheckForNA', 'trimNegativeValuesFromData', 'getCurrentISOTime', 'addNotification', 'commonChartLegendButtons',
        function ($scope, $translate, bllApiRequest, ifValueNA, unitCheckForNA, trimNegativeValuesFromData,
                  getCurrentISOTime, addNotification, commonChartLegendButtons) {
            $scope.samplePerformaceData = {
                value: 0,
                unit: 'ms',
                range: '0MS (MIN) - 0MS (MAX)',
                condition: 'ok'
            };

            $scope.performance_tiles = [
                {
                    title: $translate.instant("storage.object_storage.performance_summary.latency.health.title"),
                    data: $scope.samplePerformaceData,
                    ctitleback: $translate.instant("storage.object_storage.performance_summary.latency.health.title"),
                    slideover: $translate.instant("storage.object_storage.performance_summary.latency.health.summary")
                },
                {
                    title: $translate.instant("storage.object_storage.performance_summary.latency.operational.title"),
                    data: $scope.samplePerformaceData,
                    ctitleback: $translate.instant("storage.object_storage.performance_summary.latency.operational.title"),
                    slideover: $translate.instant("storage.object_storage.performance_summary.latency.operational.summary")
                },
                {
                    title: $translate.instant("storage.object_storage.performance_summary.service.title"),
                    data: {
                        value: 0,
                        unit: '%',
                        range: '',
                        condition: 'ok'
                    },
                    condition: false,
                    ctitleback: $translate.instant("storage.object_storage.performance_summary.service.title"),
                    slideover: $translate.instant("storage.object_storage.performance_summary.service.summary")
                }
                //,{
                //    title: "storage.object_storage.service_availability.title",
                //    data: {
                //        value: 0,
                //        unit: '%',
                //        range: '',
                //        condition: 'ok'
                //    },
                //    ctitleback: $translate.instant("storage.object_storage.service_availability.title"),
                //    slideover: $translate.instant("storage.object_storage.service_availability.summary")
                //}
            ];

            $scope.objectPerformanceSummaryPages = [
                {
                    header: 'storage.object_storage.performance_summary.latency.health.title',
                    template: 'storage/templates/objectstorage/performancesummary/performance_summary_health_check.html',
                    tabname: 'latencyhealth'
                },
                {
                    header: 'storage.object_storage.performance_summary.latency.operational.title',
                    template: 'storage/templates/objectstorage/performancesummary/performance_summary_operational.html',
                    tabname: 'letencyoperational'
                },
                {
                    header: 'storage.object_storage.performance_summary.service.title',
                    template: 'storage/templates/objectstorage/performancesummary/performance_summary_service.html',
                    tabname: 'serviceavailability'
                }
            ];

            $scope.performancechartConfig = {
                legendConfig: {
                    legendButtons: commonChartLegendButtons,
                    legendButtonsValue: "1day",
                    legendLabels: [
                        {
                            label: "LATENCY  - MIN (MS)",
                            color: "#617C91"
                        },
                        {
                            label: "LATENCY  - AVG (MS)",
                            color: "#94ABA8"
                        },
                        {
                            label: "LATENCY  - MAX (MS)",
                            color: "#998E88"
                        }
                    ]
                },
                graphOptions: {
                    graphTitleConfig: {},

                    graphColors: {
                        fill: "#617C91",
                        // In this variable pass the color to be filled in Bar & Area Charts.
                        stroke: "#617C91",
                        stackColors: ["#617C91", "#94ABA8", "#998E88"]
                    },
                    graphAxisConfig: {
                        xAxis: {
                            range: "hours",
                            rangeHours: 24,
                            interval: [2, "hours"],
                            tickFormat: "%H:%M"
                        }
                    }
                },
                loading: false,
                no_data: false
            };

            $scope.OperationalChartConfig = angular.copy($scope.performancechartConfig);
            $scope.ServiceChartConfig = angular.copy($scope.performancechartConfig);

            $scope.ServiceChartConfig.legendConfig.legendLabels = [];
            $scope.ServiceChartConfig.legendConfig.legendLabels = [{
                label: "SERVICE AVAILABILITY",
                color: "#617C91"
            }];
            $scope.ServiceChartConfig.graphOptions.graphAxisConfig.yAxis = {
                domain: [0, 100]
            };

            function setLatencyCardData(avg, min, max){
                $scope.performance_tiles[0].data = {
                    value: avg,
                    unit: unitCheckForNA('ms', avg),
                    range: min + unitCheckForNA(' MS (MIN)', min) + ' - ' + max + unitCheckForNA('MS (MAX)', max),
                    condition: 'ok',
                    min: min,
                    max: max
                };
            }

            function getLatencyHealthCheckMetricCardData() {
                var request = {
                    "operation": "latency_healthcheck",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": 1, "period": 3600}
                };

                bllApiRequest.get('objectstorage_summary', request).then(function(data) {
                    //assume the most recent measurement
                    data = data.data;
                    var metric_data = { avg: 'N/A', min: 'N/A', max: 'N/A' };
                    angular.forEach(data, function(val, key){
                        var arr = key.split('.');
                        if(arr[arr.length - 1] == 'latency_sec')
                            if(metric_data.hasOwnProperty(arr[arr.length - 2]))
                                metric_data[arr[arr.length - 2]] = ifValueNA(-1, val);
                    });
                    setLatencyCardData(toMilliSeconds(metric_data.avg),
                        toMilliSeconds(metric_data.min),
                        toMilliSeconds(metric_data.max));
                }, function (error_data) {
                    var errorReason = error_data.data ? error_data.data[0].data :
                        $translate.instant("storage.object_storage.performance.latency_healthcheck.error");
                    addNotification('error', errorReason);
                });
            }

            function setLatencyOperationalCardData(avg, min, max){
                var naResult = {value: "N/A", label: "N/A"};

                $scope.performance_tiles[1].data = {
                    value: avg,
                    unit: unitCheckForNA('ms', avg),
                    range: min + unitCheckForNA(' MS (MIN)', min) + ' - ' + max + unitCheckForNA('MS (MAX)', max),
                    condition: 'ok',
                    min: min,
                    max: max
                };
            }

            function getLatencyOperationalCheckMetricCardData() {
                var request = {
                    "operation": "latency_operational",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": "1", "period": "3600"}
                };

                bllApiRequest.get('objectstorage_summary', request).then(function(data) {
                    //assume the most recent measurement
                    data = data.data;
                    var metric_data = { avg: 'N/A', min: 'N/A', max: 'N/A' };
                    angular.forEach(data, function(val, key){
                        var arr = key.split('.');
                        if(arr[arr.length - 1] == 'latency_sec')
                            if(metric_data.hasOwnProperty(arr[arr.length - 2]))
                                metric_data[arr[arr.length - 2]] = ifValueNA(-1, val);
                    });
                    setLatencyOperationalCardData(toMilliSeconds(metric_data.avg),
                        toMilliSeconds(metric_data.min),
                        toMilliSeconds(metric_data.max));
                }, function (error_data) {
                    var errorReason = error_data.data ? error_data.data[0].data :
                        $translate.instant("storage.object_storage.performance.latency_operational.error");
                    addNotification('error', errorReason);
                });
            }

            function setServiceAvailabilityCardData(avail){
                avail = ifValueNA(-1, avail);
                $scope.performance_tiles[2].data = {
                    value: avail,
                    unit: unitCheckForNA('%', avail),
                    condition: 'ok'
                };
            }

            function getServiceMetricCardData() {
                var request = {
                    "operation": "service_availability",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": "1", "period": "3600"}
                };

                bllApiRequest.get('objectstorage_summary', request).then(function(data) {
                    data = data.data;
                    angular.forEach(data, function(val, key){
                        var metrics_name = key.split('.').pop();
                        if(metrics_name == 'avail_day') setServiceAvailabilityCardData(val);
                    });
                }, function (error_data) {
                    var errorReason = error_data.data ? error_data.data[0].data :
                        $translate.instant("storage.object_storage.performance.service_availability.error");
                    addNotification('error', errorReason);
                });
            }

            function convertArrayDataTomilliSeconds(data) {
                for (var i = 0; i < data.length; i++) {
                    data[i][2] = {};
                    if(data[i][1] > 0) data[i][1] *= 1000;
                }
                return data;
            }

            function toMilliSeconds(data) {
                return data *= 1000;
            }

            function getLatencyHealthCheckChartData(interval, period) {
                $scope.performancechartConfig.loading = true;
                var request = {
                    "operation": "latency_healthcheck",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": interval, "period": period}
                };

                bllApiRequest.get("objectstorage_summary", request).then(
                    function (data) {
                        $scope.performancechartConfig.loading = false;
                        data = data.data;
                        var metric_data = { min: 'N/A', avg: 'N/A', max: 'N/A' };
                        angular.forEach(data, function(val, key){
                            var arr = key.split('.');
                            if(arr[arr.length - 1] == "latency_sec"){
                                if(metric_data.hasOwnProperty(arr[arr.length - 2]))
                                    metric_data[arr[arr.length - 2]] = {
                                        "data": convertArrayDataTomilliSeconds(val),
                                        "label": "healthcheck_latency_" + arr[arr.length-2]
                                    };
                            }
                        });
                        $scope.latencyHealthCheckData = [];
                        angular.forEach(metric_data, function(val, key){
                            if(val !== 'N/A') $scope.latencyHealthCheckData.push(val);
                        });
                    },
                    function (error_data) {
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.performance.latency_healthcheck.error");
                        addNotification('error', errorReason);
                        $scope.performancechartConfig.loading = false;
                        $scope.performancechartConfig.no_data = true;
                    }
                );
            }

            function getLatencyoperationalChartData(interval, period) {
                $scope.OperationalChartConfig.loading = true;
                var request = {
                    "operation": "latency_operational",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": interval, "period": period}
                };

                bllApiRequest.get("objectstorage_summary", request).then(
                    function (data) {
                        $scope.OperationalChartConfig.loading = false;
                        data = data.data;
                        var metric_data = { min: 'N/A', avg: 'N/A', max: 'N/A' };
                        angular.forEach(data, function(val, key){
                            var arr = key.split('.');
                            if(arr[arr.length - 1] == "latency_sec"){
                                if(metric_data.hasOwnProperty(arr[arr.length - 2]))
                                    metric_data[arr[arr.length - 2]] = {
                                        "data": convertArrayDataTomilliSeconds(val),
                                        "label": "operational_latency_" + arr[arr.length-2]
                                    };
                            }
                        });
                        $scope.latencyOperationalData = [];
                        angular.forEach(metric_data, function(val, key){
                            if(val !== 'N/A') $scope.latencyOperationalData.push(val);
                        });
                    },
                    function (error_data) {
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.performance.latency_operational.error");
                        addNotification('error', errorReason);
                        $scope.OperationalChartConfig.loading = false;
                        $scope.OperationalChartConfig.no_data = true;
                    }
                );
            }

            function getServiceChartData(interval, period) {
                $scope.ServiceChartConfig.loading = true;
                var request = {
                    "operation": "service_availability",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": interval, "period": period}
                };

                bllApiRequest.get("objectstorage_summary", request).then(
                    function (data) {
                        $scope.ServiceChartConfig.loading = false;
                        data = data.data;
                        $scope.ServiceChartData = [];
                        angular.forEach(data, function(val, key){
                            var queue_length = key.split('.').pop();
                            if(queue_length == 'avail_day'){
                                $scope.ServiceChartData = [{
                                    data: val,
                                    label: 'service_availability'
                                }];
                            }
                        });
                    },
                    function (error_data) {
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.performance.service_availability.error");
                        addNotification('error', errorReason);
                        $scope.ServiceChartConfig.loading = false;
                        $scope.ServiceChartConfig.no_data = true;
                    }
                );
            }

            function setLatencyHealthCheckChartAxisData(range, interval, ticks, rangeHours){
                $scope.performancechartConfig.graphOptions.graphAxisConfig.xAxis = {};
                $scope.performancechartConfig.graphOptions.graphAxisConfig.xAxis = {
                    range: range, interval: interval, tickFormat: ticks, rangeHours: rangeHours
                };
            }

            function setLatencOperationalChartAxisData(range, interval, ticks, rangeHours){
                $scope.OperationalChartConfig.graphOptions.graphAxisConfig.xAxis = {};
                $scope.OperationalChartConfig.graphOptions.graphAxisConfig.xAxis = {
                    range: range, interval: interval, tickFormat: ticks, rangeHours: rangeHours
                };
            }

            function setServiceAvailabilityChartAxisData(range, interval, ticks, rangeHours){
                $scope.ServiceChartConfig.graphOptions.graphAxisConfig.xAxis = {};
                $scope.ServiceChartConfig.graphOptions.graphAxisConfig.xAxis = {
                    range: range, interval: interval, tickFormat: ticks, rangeHours: rangeHours
                };
            }

            function setChartData(data1, data2){
                var interval_mappings =  {
                    "1day": {
                        interval: 24, period: 120, range: "hours", label_interval: [2, "hours"], tickFormat: "%H:%M"
                    }, "7days": {
                        interval: 168, period: 900, range: "hours", label_interval: [12, "hours"], tickFormat: "%H:%M"
                    }, "30days": {
                        interval: 720, period: 3600, range: "days", label_interval: [2, "days"], tickFormat: "%m-%d"
                    }
                };
                var data_mappings = {
                    "latency-healthcheck": {
                        get_data_from_source: getLatencyHealthCheckChartData,
                        set_axis_config: setLatencyHealthCheckChartAxisData
                    },
                    "latency-operational": {
                        get_data_from_source: getLatencyoperationalChartData,
                        set_axis_config: setLatencOperationalChartAxisData
                    },
                    "service-availability": {
                        get_data_from_source: getServiceChartData,
                        set_axis_config: setServiceAvailabilityChartAxisData
                    }
                };

                if(data_mappings.hasOwnProperty(data2)){
                    if(interval_mappings.hasOwnProperty(data1)) {
                        var options = interval_mappings[data1];
                        var interval = options.interval;
                        var period = options.period;
                        data_mappings[data2].get_data_from_source(interval, period);
                        data_mappings[data2].set_axis_config(options.range, options.label_interval, options.tickFormat, options.interval);
                    } else {
                        data_mappings[data2].get_data_from_source(1080, 5400);
                        data_mappings[data2].set_axis_config("days", [3, "days"], "%m-%d");
                    }
                }
            }

            $scope.$on('d3ChartLegendButtonAction', function ($event, data1, data2) {
                setChartData(data1.toString(), data2.toString());
            });

            getLatencyHealthCheckMetricCardData();
            getLatencyOperationalCheckMetricCardData();
            getServiceMetricCardData();
            getLatencyHealthCheckChartData("24", 120);
            getLatencyoperationalChartData("24", 120);
            getServiceChartData("24", 120);
        }
    ]);
})(angular);
