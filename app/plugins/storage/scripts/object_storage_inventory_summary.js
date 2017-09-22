// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';
    var p = ng.module('plugins');
    p.controller('ObjectStorageInventorySummaryController', ['$scope', '$translate', 'bllApiRequest', 'ifValueNA',
        'unitCheckForNA', 'trimNegativeValuesFromData', 'getCurrentISOTime', 'arrayContainsString', '$q',
        'processAlarmCount', 'humanReadableTime', 'setNAifValueNA', 'log', 'addNotification', 'commonChartLegendButtons',
        function ($scope, $translate, bllApiRequest, ifValueNA, unitCheckForNA, trimNegativeValuesFromData,
                  getCurrentISOTime, arrayContainsString, $q, processAlarmCount, humanReadableTime, setNAifValueNA, log, addNotification, commonChartLegendButtons) {

            $scope.sampleInventoryData = {
                value: 0,
                unit: 'sec',
                range: '0 Sec (ACCOUNT) - 0 SEC (CONTAINER)',
                condition: 'ok'
            };

            $scope.healthFocusedData = [];
            $scope.cpuLoadAverageHeatMapData = [];
            $scope.healthFocusedStackModalFlag = false;

            $scope.inventory_tiles = [
                {
                    title: "storage.object_storage.inventory_summary.asyc.title",
                    data: {value: 0, unit: '', range: '', condition: 'ok'},
                    type: "range",
                    condition: false,
                    ctitleback: $translate.instant("storage.object_storage.inventory_summary.asyc.title"),
                    slideover: $translate.instant("storage.object_storage.inventory_summary.asyc.summary")
                },
                {
                    title: "storage.object_storage.inventory_summary.time_to_replicate.title",
                    data: $scope.sampleInventoryData,
                    type: "range",
                    condition: false,
                    ctitleback: $translate.instant("storage.object_storage.inventory_summary.time_to_replicate.title"),
                    slideover: $translate.instant("storage.object_storage.inventory_summary.time_to_replicate.summary")
                },
                {
                    title: "storage.object_storage.inventory_summary.replication_completion.title",
                    data: $scope.sampleInventoryData,
                    type: "range",
                    condition: false,
                    ctitleback: $translate.instant("storage.object_storage.inventory_summary.replication_completion.title"),
                    slideover: $translate.instant("storage.object_storage.inventory_summary.replication_completion.summary")
                },
                {
                    title: "storage.object_storage.load_average.title",
                    data: {value: 0, unit: '', range: '', condition: 'ok'},
                    type: "range",
                    condition: false,
                    ctitleback: $translate.instant("storage.object_storage.inventory_summary.load_average.title"),
                    slideover: $translate.instant("storage.object_storage.load_average.summary")
                }
            ];

            $scope.alarm_tiles = [{
                title: "storage.object_storage.inventory_summary.alarms.title",
                data: {'ok': {count: 0}, 'warning': {count: 0}, 'critical': {count: 0}, 'unknown': {count: 0}},
                type: "alarmDonut",
                subtype: "nowarn"
            },
                {
                    title: "storage.object_storage.inventory_summary.total_nodes.title",
                    data: {
                        'ok': {count: 0}, 'warning': {count: 0}, 'critical': {count: 0}, 'unknown': {count: 0}
                    },
                    type: "alarmList",
                    subtype: "nowarn"
                }];

            $scope.objectInventorySummaryPages = [
                {
                    header: 'storage.object_storage.inventory_summary.asyc.title',
                    template: 'storage/templates/objectstorage/inventorysummary/inventory_summary_async.html',
                    tabname: 'asyncpending'
                },
                {
                    header: 'storage.object_storage.inventory_summary.time_to_replicate.title',
                    template: 'storage/templates/objectstorage/inventorysummary/inventory_summary_time_to_replicate.html',
                    tabname: 'time_to_replicate'
                },
                {
                    header: 'storage.object_storage.inventory_summary.replication_completion.title',
                    template: 'storage/templates/objectstorage/inventorysummary/inventory_summary_replication_completion.html',
                    tabname: 'replication_completion'
                },
                {
                    header: 'storage.object_storage.inventory_summary.load_average.title',
                    template: 'storage/templates/objectstorage/inventorysummary/inventory_summary_load_average.html',
                    tabname: 'load_average'
                }
            ];

            $scope.objectInventorySummaryHeatMapPages = [
                {
                    header: 'storage.object_storage.inventory_summary.cpu.load.average.title',
                    template: 'storage/templates/objectstorage/inventorysummary/cpu.load_average.heatmap.html',
                    tabname: 'CPU LOAD AVERAGE INVENTORY'
                }
            ];

            $scope.inventorychartConfig = {
                legendConfig: {
                    legendButtons: commonChartLegendButtons,
                    legendButtonsValue: "1day",
                    legendLabels: []
                },
                graphOptions: {
                    graphTitleConfig: {},

                    graphColors: {
                        stackColors: ["#617C91", "#94ABA8", "#998E88"]
                    },
                    graphAxisConfig: {
                        xAxis: {
                            range: "hours",
                            interval: [2, "hours"],
                            rangeHours: 24,
                            tickFormat: "%H:%M"
                        }
                    }
                },
                loading: false,
                no_data: false
            };

            $scope.timeToReplicateChartConfig = angular.copy($scope.inventorychartConfig);
            $scope.asyncChartConfig = angular.copy($scope.inventorychartConfig);
            $scope.oldestReplicationChartConfig = angular.copy($scope.inventorychartConfig);
            $scope.loadAverageChartConfig = angular.copy($scope.inventorychartConfig);

            var graphColors = ["#617C91", "#94ABA8", "#998E88"];

            function setGraphConfigs() {
                $scope.timeToReplicateChartConfig.legendConfig.legendLabels.push({
                        label: "OBJECT REPLICATION DURATION (SEC)",
                        color: "#617C91"
                    },
                    {
                        label: "ACCOUNT REPLICATION DURATION (SEC)",
                        color: "#94ABA8"
                    },
                    {
                        label: "CONTAINER REPLICATION DURATION (SEC)",
                        color: "#998E88"
                    });

                $scope.asyncChartConfig.legendConfig.legendLabels.push({
                    label: "TOTAL PENDING ASYNC",
                    color: "#617C91"
                });

                $scope.loadAverageChartConfig.legendConfig.legendLabels.push({
                        label: "LOAD AVERAGE - MIN",
                        color: "#617C91"
                    },
                    {
                        label: "LOAD AVERAGE - AVG",
                        color: "#94ABA8"
                    },
                    {
                        label: "LOAD AVERAGE - MAX",
                        color: "#998E88"
                    });

                $scope.oldestReplicationChartConfig.legendConfig.legendLabels.push({
                        label: "LAST OBJECT REPLICATION (SEC)",
                        color: "#617C91"
                    },
                    {
                        label: "LAST ACCOUNT REPLICATION (SEC)",
                        color: "#94ABA8"
                    },
                    {
                        label: "LAST CONTAINER REPLICATION (SEC)",
                        color: "#998E88"
                    });
            }

            function getTimeToReplicateChartData(interval, period) {
                $scope.timeToReplicateChartConfig.loading = true;
                var request = {
                    "operation": "time_to_replicate",
                    "data": {"end_time": getCurrentISOTime(0), "interval": interval, "period": period}
                };

                bllApiRequest.get("objectstorage_summary", request).then(
                    function (data) {
                        $scope.timeToReplicateChartConfig.loading = false;
                        data = data.data;
                        $scope.timeToReplicateData = [];
                        $scope.timeToReplicateChartConfig.legendConfig.legendLabels = [];
                        angular.forEach(data, function (val, key) {
                            var op = key.split('.').pop();
                            $scope.timeToReplicateData.push({
                                data: val,
                                label: "replication_" + op
                            });
                            $scope.timeToReplicateChartConfig.legendConfig.legendLabels.push({
                                label: op.split('_')[0].toUpperCase() + " REPLICATION DURATION (SEC)",
                                color: graphColors[$scope.timeToReplicateChartConfig.legendConfig.legendLabels.length]
                            });
                        });
                    },
                    function (error_data) {
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.inventory.time_to_replicate.error");
                        addNotification('error', errorReason);
                        $scope.timeToReplicateChartConfig.loading = false;
                        $scope.timeToReplicateChartConfig.no_data = true;
                    }
                );
            }

            function getAsyncChartData(interval, period) {
                $scope.asyncChartConfig.loading = true;
                var request = {
                    "operation": "async_pending",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": interval, "period": period}
                };

                bllApiRequest.get("objectstorage_summary", request).then(
                    function (data) {
                        $scope.asyncChartConfig.loading = false;
                        data = data.data;
                        angular.forEach(data, function (val, key) {
                            var metrics_name = key.split('.').pop();
                            if (metrics_name == 'queue_length') {
                                $scope.asyncData = [];
                                $scope.asyncData.push({
                                    "data": val,
                                    label: "async_pending"
                                });
                            }
                        });
                    },
                    function (error_data) {
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.inventory.async_pending.error");
                        addNotification('error', errorReason);
                        $scope.asyncChartConfig.loading = false;
                        $scope.asyncChartConfig.no_data = true;
                    }
                );
            }

            function getOldestReplicationChartData(interval, period) {
                $scope.oldestReplicationChartConfig.loading = true;
                var request = {
                    "operation": "oldest_replication_completion",
                    "data": {"end_time": getCurrentISOTime(0), "interval": interval, "period": period, "flag": 1}
                };

                bllApiRequest.get("objectstorage_summary", request).then(
                    function (data) {
                        $scope.oldestReplicationChartConfig.loading = false;
                        data = data.data;
                        $scope.oldestReplicationData = [];
                        $scope.oldestReplicationChartConfig.legendConfig.legendLabels = [];
                        angular.forEach(data, function (val, key) {
                            var op = key.split('.').pop();
                            $scope.oldestReplicationData.push({
                                data: val,
                                label: "replication_" + op
                            });
                            $scope.oldestReplicationChartConfig.legendConfig.legendLabels.push({
                                label: "LAST " + op.split('_')[0].toUpperCase() + " REPLICATION (SEC)",
                                color: graphColors[$scope.oldestReplicationChartConfig.legendConfig.legendLabels.length]
                            });
                        });
                    },
                    function (error_data) {
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.inventory.oldest_replication_completion.error");
                        addNotification('error', errorReason);
                        $scope.oldestReplicationChartConfig.loading = false;
                        $scope.oldestReplicationChartConfig.no_data = true;
                    }
                );
            }

            function getLoadAverageChartData(interval, period) {
                $scope.loadAverageChartConfig.loading = true;
                var request = {
                    "operation": "load_average",
                    "data": {"end_time": getCurrentISOTime(0), "interval": interval, "period": period, "flag": 1}
                };

                bllApiRequest.get("objectstorage_summary", request).then(
                    function (data) {
                        $scope.loadAverageChartConfig.loading = false;
                        data = data.data;
                        $scope.loadAverageData = [];
                        $scope.loadAverageChartConfig.legendConfig.legendLabels = [];
                        angular.forEach(data, function (val, key) {
                            var metrics = key.split('.');
                            if (metrics.pop() == 'five') {
                                var op = metrics.pop();
                                $scope.loadAverageData.push({
                                    data: val,
                                    label: "load_average_" + op
                                });
                                $scope.loadAverageChartConfig.legendConfig.legendLabels.push({
                                    label: "LOAD AVERAGE - " + op.toUpperCase(),
                                    color: graphColors[$scope.loadAverageChartConfig.legendConfig.legendLabels.length]
                                });
                            }
                        });
                    },
                    function (error_data) {
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.inventory.load_average.error");
                        addNotification('error', errorReason);
                        $scope.loadAverageChartConfig.loading = false;
                        $scope.loadAverageChartConfig.no_data = true;
                    }
                );
            }

            function setTimeToReplicateChartAxisData(range, interval, ticks, rangeHours) {
                $scope.timeToReplicateChartConfig.graphOptions.graphAxisConfig.xAxis = {};
                $scope.timeToReplicateChartConfig.graphOptions.graphAxisConfig.xAxis = {
                    range: range, interval: interval, tickFormat: ticks, rangeHours: rangeHours
                };
            }

            function setAsyncPendingChartAxisData(range, interval, ticks, rangeHours) {
                $scope.asyncChartConfig.graphOptions.graphAxisConfig.xAxis = {};
                $scope.asyncChartConfig.graphOptions.graphAxisConfig.xAxis = {
                    range: range, interval: interval, tickFormat: ticks, rangeHours: rangeHours
                };
            }

            function setOldestReplicationChartAxisData(range, interval, ticks, rangeHours) {
                $scope.oldestReplicationChartConfig.graphOptions.graphAxisConfig.xAxis = {};
                $scope.oldestReplicationChartConfig.graphOptions.graphAxisConfig.xAxis = {
                    range: range, interval: interval, tickFormat: ticks, rangeHours: rangeHours
                };
            }

            function setLoadAverageChartAxisData(range, interval, ticks, rangeHours) {
                $scope.loadAverageChartConfig.graphOptions.graphAxisConfig.xAxis = {};
                $scope.loadAverageChartConfig.graphOptions.graphAxisConfig.xAxis = {
                    range: range, interval: interval, tickFormat: ticks, rangeHours: rangeHours
                };
            }

            function setChartData(data1, data2) {
                var interval_mappings = {
                    "1day": {
                        interval: 24, period: 120, range: "hours", label_interval: [2, "hours"], tickFormat: "%H:%M"
                    }, "7days": {
                        interval: 168, period: 900, range: "hours", label_interval: [12, "hours"], tickFormat: "%H:%M"
                    }, "30days": {
                        interval: 720, period: 3600, range: "days", label_interval: [2, "days"], tickFormat: "%m-%d"
                    }
                };
                var data_mappings = {
                    "timeToReplicate": {
                        get_data_from_source: getTimeToReplicateChartData,
                        set_axis_config: setTimeToReplicateChartAxisData
                    },
                    "async-chart": {
                        get_data_from_source: getAsyncChartData,
                        set_axis_config: setAsyncPendingChartAxisData
                    },
                    "oldestReplication": {
                        get_data_from_source: getOldestReplicationChartData,
                        set_axis_config: setOldestReplicationChartAxisData
                    },
                    "loadAveragechart": {
                        get_data_from_source: getLoadAverageChartData,
                        set_axis_config: setLoadAverageChartAxisData
                    }
                };

                if (data_mappings.hasOwnProperty(data2)) {
                    if (interval_mappings.hasOwnProperty(data1)) {
                        var options = interval_mappings[data1];
                        var interval = options.interval;
                        var period = options.period;
                        data_mappings[data2].get_data_from_source(interval, period);
                        data_mappings[data2].set_axis_config(options.range, options.label_interval, options.tickFormat);
                    } else {
                        data_mappings[data2].get_data_from_source(1080, 5400);
                        data_mappings[data2].set_axis_config("days", [3, "days"], "%m-%d");
                    }
                }
            }

            $scope.$on('d3ChartLegendButtonAction', function ($event, data1, data2) {
                setChartData(data1.toString(), data2.toString());
            });

            function getTimeToReplicateMetricCardData() {
                var request = {
                    "operation": "time_to_replicate",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": "1", "period": "3600"}
                };

                bllApiRequest.get("objectstorage_summary", request).then(
                    function (data) {
                        data = data.data;
                        var metric_data = {container_duration: 'N/A', account_duration: 'N/A', object_duration: 'N/A'};
                        //$scope.inventory_tiles[1].data = {};
                        angular.forEach(data, function (val, key) {
                            var op = key.split('.').pop();
                            if (metric_data.hasOwnProperty(op))
                                metric_data[op] = ifValueNA(-1, val) != 'N/A' ? humanReadableTime(val) : "N/A";
                        });
                        $scope.inventory_tiles[1].data = {
                            value: setNAifValueNA(metric_data.object_duration, metric_data.object_duration.value),
                            unit: unitCheckForNA(metric_data.object_duration.label,
                                metric_data.object_duration),
                            range: setNAifValueNA(metric_data.account_duration, metric_data.account_duration.value) +
                                unitCheckForNA(metric_data.account_duration.label + ' (ACCOUNT)', setNAifValueNA(
                                metric_data.account_duration, metric_data.account_duration.value)) + ' - ' +
                                setNAifValueNA(metric_data.container_duration, metric_data.container_duration.value) +
                                unitCheckForNA(metric_data.container_duration.label + ' (CONTAINER)', setNAifValueNA(
                                metric_data.container_duration, metric_data.container_duration.value))
                        };
                    },
                    function (error_data) {
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.inventory.time_to_replicate.error");
                        addNotification('error', errorReason);
                    }
                );
            }

            function getLoadAverageMetricCardData() {
                var request = {
                    "operation": "load_average",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": "1", "period": "3600"}
                };

                bllApiRequest.get("objectstorage_summary", request).then(
                    function (data) {
                        data = data.data;
                        var metric_data = {min: 'N/A', max: 'N/A', avg: 'N/A'};
                        angular.forEach(data, function (val, key) {
                            var arr = key.split('.');
                            var op = arr.pop(), method = arr.pop();
                            if (op == 'five' && metric_data.hasOwnProperty(method)) {
                                metric_data[method] = ifValueNA(-1, val) != 'N/A' ? val : "N/A";
                            }
                        });
                        $scope.inventory_tiles[3].data = {
                            value: setNAifValueNA(metric_data.avg, metric_data.avg),
                            range: setNAifValueNA(metric_data.min, metric_data.min) + '(MIN) - ' +
                                setNAifValueNA(metric_data.max, metric_data.max)+ '(MAX)'
                        };
                    },
                    function (error_data) {
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.inventory.load_average.error");
                        addNotification('error', errorReason);
                    }
                );
            }

            function getCPULoadAverageHeatMapData() {
                var request = {
                    "operation": "heat_map_cpu_load_average",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": "1", "period": "3600"}
                };

                bllApiRequest.get("objectstorage_summary", request).then(
                    function (data) {
                        data = data.data;
                        angular.forEach(data, function (val, key) {
                            var data = [];
                            angular.forEach(val, function (size, host) {
                                size = ifValueNA(-1, size) !== 'N/A' ? size : 'N/A';
                                data.push({
                                    title: size !== 'N/A' ? parseFloat(size).toFixed(1).toString() + "%" : 'N/A',
                                    value: size !== 'N/A' ? size : 0,
                                    total: size !== 'N/A' ? size : 0,
                                    hostname: host,
                                    clustername: key
                                });
                            });
                            function sortObjByKey(a, b){
                                if(a.value < b.value) return -1;
                                if(a.value > b.value) return 1;
                                return 0;
                            }
                            data.sort(sortObjByKey);
                            $scope.cpuLoadAverageHeatMapData.push({
                                name: key,
                                data: data
                            });
                        });
                    },
                    function (error_data) {
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.inventory.cpu_load_average.error");
                        addNotification('error', errorReason);
                    },
                    function(progress){
                        log('info', 'Getting CPU Load Average Heatmap Data...');
                    }
                );
            }

            function getHealthFocusedInventoryHeatMapData() {
                var request = {
                    "operation": "health_focused",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": "1", "period": "3600"}
                };

                bllApiRequest.get("objectstorage_summary", request).then(
                    function (data) {
                        data = data.data;
                        $scope.healthFocusedData = [];
                        angular.forEach(data, function (cluster, cluster_name) {
                            var alarm_data = [];
                            angular.forEach(cluster, function (host, host_name) {
                                var host_data = {};
                                host_data.clustername = cluster_name;
                                host_data.hostname = host_name;
                                if (host.grey < 0) {
                                    host_data.state = 'unknown';
                                    host_data.value = '';
                                } else if (host.red > 0) {
                                    host_data.state = 'critical';
                                    host_data.value = host.red;
                                } else if (host.red === 0 && host.yellow > 0) {
                                    host_data.state = 'warning';
                                    host_data.value = host.yellow;
                                } else if (host.red === 0 && host.yellow === 0 && host.grey > 0) {
                                    host_data.state = 'unknown';
                                    host_data.value = host.grey;
                                } else if (host.red === 0 && host.yellow === 0 && host.grey === 0 && host.green > 0) {
                                    host_data.state = 'ok';
                                }
                                alarm_data.push(host_data);
                            });
                            alarm_data.sort(function(a, b) {
                              return a.hostname > b.hostname ? 1 : -1;
                            });
                            $scope.healthFocusedData.push({
                                name: cluster_name,
                                data: alarm_data
                            });
                        });
                    },
                    function (error_data) {
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.inventory.health_focused.error");
                        addNotification('error', errorReason);
                    },
                    function(progress){
                        log('info', 'Getting Health Focused heatmap Data...');
                    }
                );
            }

            function getAlarmsMetricCardData() {
                var request = {
                    "operation": "alarms",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": "1", "period": "3600"}
                };

                bllApiRequest.get("objectstorage_summary", request).then(
                    function (data) {
                        data = data.data;
                        var alarm_data = {};
                        //if(data.hasOwnProperty('counts'))
                        var columns = data.columns || [];
                        var counts = data.counts || [];
                        var state_idx = columns.indexOf("state"), count_idx = columns.indexOf('count');
                        var summary = {
                            'OK': {count: 0, display_name: 'ok'},
                            'ALARM': {count: 0, display_name: 'critical'},
                            'UNDETERMINED': {count: 0, display_name: 'unknown'},
                            'WARNING': {count: 0, display_name: 'warning'}
                        };

                        if (state_idx > -1 && count_idx > -1) {
                            angular.forEach(counts, function (col) {
                                if (summary.hasOwnProperty(col[state_idx])) {
                                    summary[col[state_idx]].count = col[count_idx];
                                }
                            });
                            alarm_data = {
                                'ok': {count: 0},
                                'critical': {count: 0},
                                'unknown': {count: 0},
                                'warning': {count: 0}
                            };
                            angular.forEach(summary, function (val, key) {
                                if (alarm_data.hasOwnProperty(val.display_name)) {
                                    alarm_data[val.display_name] = {
                                        count: val.count
                                    };
                                }
                            });
                            $scope.alarm_tiles[0].data = alarm_data;
                        }
                    },
                    function (error_data) {
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.inventory.alarm_description.error");
                        addNotification('error', errorReason);
                    }
                );
                //return bllApiRequest.get('objectstorage_summary', request).then(
                //    function (response) {
                //        var data = response.data || [];
                //
                //        var countIndex = 0;
                //        var severityIndex = 1;
                //        var stateIndex = 2;
                //        var i = 0;
                //
                //        for (i = 0; i < data.columns.length; i++) {
                //            if (data.columns[i] === "count") {
                //                countIndex = i;
                //            } else if (data.columns[i] === "severity") {
                //                severityIndex = i;
                //            } else if (data.columns[i] === "state") {
                //                stateIndex = i;
                //            }
                //        }
                //
                //        var summary = {
                //            'ok': {count: 0},
                //            'warning': {count: 0},
                //            'critical': {count: 0},
                //            'unknown': {count: 0}
                //        };
                //
                //        for (i = 0; i < data.counts.length; i++) {
                //            if (data.counts[i][stateIndex] === "ALARM") {
                //                if (data.counts[i][severityIndex] === "CRITICAL" ||
                //                    data.counts[i][severityIndex] === "HIGH") {
                //                    summary.critical.count += data.counts[i][countIndex];
                //                } else {
                //                    summary.warning.count += data.counts[i][countIndex];
                //                }
                //            } else if (data.counts[i][stateIndex] === "OK") {
                //                summary.ok.count += data.counts[i][countIndex];
                //            } else {
                //                summary.unknown.count += data.counts[i][countIndex];
                //            }
                //        }
                //
                //        $scope.alarm_tiles[0].data = summary;
                //
                //    }, function (error_data) {
                //        console.log('Failed to get object summary alarms data');
                //        console.log('error data = ' + JSON.stringify(error_data));
                //    }
                //);
            }

            function getOldestReplicationMetricCardData() {
                var request = {
                    "operation": "oldest_replication_completion",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": "1", "period": "3600"}
                };

                bllApiRequest.get("objectstorage_summary", request).then(
                    function (data) {
                        data = data.data;
                        var metric_data = {container_last: 'N/A', account_last: 'N/A', object_last: 'N/A'};
                        angular.forEach(data, function (val, key) {
                            var op = key.split('.').pop();
                            if (metric_data.hasOwnProperty(op))
                                metric_data[op] = ifValueNA(-1, val) !== 'N/A' ? humanReadableTime(val) : "N/A";
                        });
                        var range = "";
                        range += setNAifValueNA(metric_data.account_last, metric_data.account_last.value);
                        range += unitCheckForNA(metric_data.account_last.label, metric_data.account_last);
                        range += ' (ACCOUNT) -';
                        range += setNAifValueNA(metric_data.container_last, metric_data.container_last.value);
                        range += unitCheckForNA(metric_data.container_last.label, metric_data.container_last);
                        range += ' (CONTAINER)';

                        $scope.inventory_tiles[2].data = {
                            value: setNAifValueNA(metric_data.object_last, metric_data.object_last.value),
                            unit: unitCheckForNA(metric_data.object_last.label.toLowerCase(), metric_data.object_last),
                            range: range
                        };
                    },
                    function (error_data) {
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.inventory.oldest_replication_completion.error");
                        addNotification('error', errorReason);
                    }
                );
            }

            function setAsyncPendingCardData(val) {
                $scope.inventory_tiles[0].data = {};
                $scope.inventory_tiles[0].data = {
                    value: ifValueNA(-1, val)
                };
            }

            function getAsycPendingMetricCardData() {
                var request = {
                    "operation": "async_pending",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": "1", "period": "3600"}
                };

                bllApiRequest.get("objectstorage_summary", request).then(
                    function (data) {
                        data = data.data;
                        angular.forEach(data, function (val, key) {
                            var queue_length = key.split('.').pop();
                            if (queue_length == 'queue_length')
                                setAsyncPendingCardData(val);
                        });
                    },
                    function (error_data) {
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.inventory.async_pending.error");
                        addNotification('error', errorReason);
                    }
                );
            }

            $scope.hostname = "";

            $scope.healthFocusedHeatMapClick = function (data) {
                $scope.heatmapAlarms = [];
                $scope.fileSystemData = [];
                $scope.fileSystemCount = 0;
                $scope.heatmapAlarmsCount = 0;
                $scope.fileSystemLoadingFlag = true;
                $scope.alarmsLoadingFlag = true;
                $scope.fileSystemUtilizationData = {
                    value: 0,
                    unit: '%',
                    range: $translate.instant("storage.object_storage.health_focused.heat_map.stack.modal.filesystem_util.min_max", {
                        min: 0,
                        max: 0
                    }),
                    condition: 'ok'
                };

                $scope.fileSystemMountData = {
                    value: 0,
                    unit: $translate.instant("storage.object_storage.health_focused.heat_map.stack.modal.mount"),
                    range: $translate.instant("storage.object_storage.health_focused.heat_map.stack.modal.filesystem_mount.min_max", {
                        min: 0,
                        max: 0
                    }),
                    condition: 'ok'
                };

                $scope.heatmapCompute = {
                    'data': {'count': 0},
                    'max': 0,
                    'label': $translate.instant('storage.object_storage.health_focused.heat_map.stack.modal.donut.load_average'),
                    'unit': ''
                };

                $scope.heatmapMemory = {
                    'data': {'count': 0},
                    'max': 0,
                    'label': $translate.instant('storage.object_storage.health_focused.heat_map.stack.modal.donut.memory'),
                    'unit': 'GB'
                };

                $scope.heatmapStorage = {
                    'data': {'count': 0},
                    'max': 0,
                    'label': $translate.instant('storage.object_storage.health_focused.heat_map.stack.modal.donut.storage'),
                    'unit': 'GB'
                };
                $scope.healthFocusedStackModalFlag = true;
                $scope.hostname = data.hostname;
                $scope.clusterName = data.clustername;
                $scope.storageAlarmData = {
                    title: $translate.instant('storage.object_storage.health_focused.heat_map.stack.modal.donut.alarms'),
                    data: {
                        critical: {count: 0},
                        warning: {count: 0},
                        unknown: {count: 0},
                        ok: {count: 0},
                        count: 0
                    }
                };

                var storageAlarmRequest = {
                    "operation": "health_focused",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": "1", "period": "3600"}
                };

                bllApiRequest.get("objectstorage_summary", storageAlarmRequest).then(
                    function (data) {
                        data = data.data;
                        $scope.storageAlarmData.data = {
                            critical: {count: data[$scope.clusterName][$scope.hostname].red},
                            warning: {count: data[$scope.clusterName][$scope.hostname].yellow},
                            unknown: {count: data[$scope.clusterName][$scope.hostname].grey},
                            ok: {count: data[$scope.clusterName][$scope.hostname].green},
                            count: data[$scope.clusterName][$scope.hostname].green + data[$scope.clusterName][$scope.hostname].grey + data[$scope.clusterName][$scope.hostname].yellow + data[$scope.clusterName][$scope.hostname].red
                        };
                    },
                    function (error_data) {
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.inventory.health_focused.error");
                        addNotification('error', errorReason);
                        $scope.storageAlarmData = {
                            critical: {count: 0},
                            warning: {count: 0},
                            unknown: {count: 0},
                            ok: {count: 0},
                            count: 0
                        };
                    }
                );
                var request = {
                    "operation": "filesystem_utilization", "data": {
                        "end_time": getCurrentISOTime(120000),
                        "interval": "1", "cluster": data.clustername, "hostname": data.hostname
                    }
                };
                var fileSysUti_req = angular.copy(request);
                fileSysUti_req.data.period = "3600";
                bllApiRequest.get("objectstorage_summary", fileSysUti_req).then(
                    function (data) {
                        data = data.data;
                        $scope.fileSystemUtilizationData.value = ifValueNA(-1, data["swiftlm.diskusage.host.val.usage"]);
                        $scope.fileSystemUtilizationData.range = $translate.instant("storage.object_storage.health_focused.heat_map.stack.modal.filesystem_util.min_max", {
                            min: ifValueNA(-1, data["swiftlm.diskusage.host.min.usage"]),
                            max: ifValueNA(-1, data["swiftlm.diskusage.host.max.usage"])
                        });

                        $scope.fileSystemUtilizationData.unit = unitCheckForNA('%', $scope.fileSystemUtilizationData.value);
                    },
                    function (error_data) {
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.inventory.file_systems.error");
                        addNotification('error', errorReason);
                    }
                );

                var mount_req = angular.copy(request);
                mount_req.operation = "mount_status";
                mount_req.data.period = "3600";
                bllApiRequest.get("objectstorage_summary", mount_req).then(
                    function (data) {
                        data = data.data;
                        var mounted = "N/A", unmounted = "N/A";
                        if (angular.isDefined(data.mount_status)){
                            mounted = ifValueNA(-1, data.mount_status.mounted);
                            unmounted = ifValueNA(-1, data.mount_status.unmounted);
                        }
                        var percent = "N/A";

                        if (mounted === "N/A" || unmounted === "N/A") {
                            percent = "N/A";
                        } else if(angular.isDefined(data.total_mount_point)){
                            if(data.total_mount_point === 0) percent = 0;
                            else percent = (mounted * 100) / data.total_mount_point;
                        }

                        $scope.fileSystemMountData.value = percent;
                        $scope.fileSystemMountData.range = $translate.instant("storage.object_storage.health_focused.heat_map.stack.modal.filesystem_mount.min_max", {
                            min: mounted,
                            max: unmounted
                        });
                    },
                    function (error_data) {
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.inventory.mount_status.error");
                        addNotification('error', errorReason);
                    }
                );

                var alarm_req = angular.copy(request);
                alarm_req.operation = "alarm_description";
                bllApiRequest.get("objectstorage_summary", alarm_req).then(
                    function (res_data) {
                        $scope.alarmsLoadingFlag = false;
                        $scope.heatmapAlarmsCount = Object.keys(res_data.data).length;
                        $scope.heatmapAlarms = res_data.data;
                    },
                    function (error_data) {
                        $scope.alarmsLoadingFlag = false;
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.inventory.alarm_description.error");
                        addNotification('error', errorReason);
                    }
                );

                var filesystem_req = angular.copy(request);
                filesystem_req.operation = "file_systems";
                filesystem_req.data.period = "3600";
                bllApiRequest.get("objectstorage_summary", filesystem_req).then(
                    function (res_data) {
                        $scope.fileSystemLoadingFlag = false;
                        data = res_data.data;
                        var string_data = JSON.stringify(data);
                        string_data = string_data.replace(/swiftlm\.diskusage\.host\.val\.usage/g, 'usage');
                        string_data = string_data.replace(/swiftlm\.diskusage\.host\.val\.used/g, 'used');
                        string_data = string_data.replace(/swiftlm\.diskusage\.host\.val\.size/g, 'size');
                        string_data = string_data.replace(/swiftlm\.systems\.check_mounts/g, 'check_mounts');
                        data = JSON.parse(string_data);
                        $scope.fileSystemCount = Object.keys(data).length;
                        $scope.fileSystemData = data;
                    },
                    function (error_data) {
                        $scope.fileSystemLoadingFlag = false;
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.inventory.file_systems.error");
                        addNotification('error', errorReason);
                    }
                );

                var compute_req = angular.copy(request);
                compute_req.operation = "load_average_donut";
                compute_req.data.period = "3600";
                bllApiRequest.get("objectstorage_summary", compute_req).then(
                    function (res_data) {
                        if (angular.isDefined(res_data.data['swiftlm.load.host.val.five'])) {
                            $scope.heatmapCompute.data.count = res_data.data['swiftlm.load.host.val.five'];
                            $scope.heatmapCompute.max = 100;
                        } else {
                            $scope.heatmapCompute.data.count = 0;
                            $scope.heatmapCompute.max = 0;
                        }
                    },
                    function (error_data) {
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.inventory.load_average.error");
                        addNotification('error', errorReason);
                    }
                );

                var memory_req = angular.copy(request);
                memory_req.operation = "memory";
                memory_req.data.period = "3600";
                bllApiRequest.get("objectstorage_summary", memory_req).then(
                    function (res_data) {
                        if (angular.isDefined(res_data.data['mem.free_mb']) && angular.isDefined(res_data.data['mem.total_mb'])) {
                            $scope.heatmapMemory.data.count = ((res_data.data['mem.total_mb'] - res_data.data['mem.free_mb']) / 1024).toFixed(2);
                            $scope.heatmapMemory.max = (res_data.data['mem.total_mb'] / 1024).toFixed(2);
                        }
                    },
                    function (error_data) {
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.inventory.memory.error");
                        addNotification('error', errorReason);
                    }
                );

                var storage_req = angular.copy(request);
                storage_req.operation = "storage";
                storage_req.data.period = "3600";
                bllApiRequest.get("objectstorage_summary", storage_req).then(
                    function (res_data) {
                        if (angular.isDefined(res_data.data['swiftlm.diskusage.host.val.size']) &&
                            angular.isDefined(res_data.data['swiftlm.diskusage.host.val.used'])) {
                            $scope.heatmapStorage.data.count = (res_data.data['swiftlm.diskusage.host.val.used'] / (1024*1024*1024)).toFixed(2);
                            $scope.heatmapStorage.max = (res_data.data['swiftlm.diskusage.host.val.size'] / (1024*1024*1024)).toFixed(2);
                        }else{
                            $scope.heatmapStorage.data.count = 0;
                            $scope.heatmapStorage.max = 0;
                        }
                    },
                    function (error_data) {
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.inventory.storage.error");
                        addNotification('error', errorReason);
                    }
                );

            };
            function getNodeStateMetricCardData() {
                var request = {
                    "operation": "node_state",
                    "data": {"end_time": getCurrentISOTime(12000), interval: "1", period: "3600"}
                };

                bllApiRequest.get("objectstorage_summary", request).then(
                    function (data) {
                        data = data.data;
                        var mapping = {'grey':'unknown', 'green': 'ok', 'red': 'critical', 'yellow': 'warning'};
                        var total_alarm_data = {
                            'ok': {count: 0}, 'warning': {count: 0}, 'critical': {count: 0},
                            'unknown': {count: 0}
                        };
                        if(angular.isDefined(data.total_nodes)){
                            if(angular.isDefined(data.total_nodes.nodes)) delete data.total_nodes.nodes;
                            angular.forEach(data.total_nodes, function(val, key){
                                total_alarm_data[mapping[key]].count = val;
                            });
                            delete data.total_nodes;
                        }

                        angular.forEach(data, function (val, cluster_name) {
                            var alarm_data = {
                                'ok': {count: 0}, 'warning': {count: 0}, 'critical': {count: 0},
                                'unknown': {count: 0}
                            };
                            if(angular.isDefined(val.nodes)) delete val.nodes;
                            angular.forEach(val, function (count, color) {
                                alarm_data[mapping[color]].count = count;
                            });
                            $scope.alarm_tiles.push({
                                title: cluster_name,
                                data: alarm_data,
                                type: "alarmList",
                                subtype: "nowarn"
                            });
                        });

                        $scope.alarm_tiles[1].data = total_alarm_data;
                    },
                    function (error_data) {
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.inventory.node_state.error");
                        addNotification('error', errorReason);
                    },
                    function(progress){
                        log('info', 'Getting Node State Data...');
                    }
                );
            }

            function getTotalNodesMetricCardData() {
                var request = {
                    "operation": "total_node",
                    "data": {"end_time": getCurrentISOTime(12000)}
                };

                bllApiRequest.get("objectstorage_summary", request).then(
                    function (data) {
                        data = data.data;
                    },
                    function (error_data) {
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.inventory.total_node.error");
                        addNotification('error', errorReason);
                    }
                );
                //var req = {
                //    operation: "metric_list",
                //    name: "swiftlm.load.host.val.five"
                //}, req2 = {
                //    "operation": "alarm_count",
                //    "group_by": "dimension_name, dimension_value, severity, state"
                //};
                ////get host/cluster list
                //var promises = [bllApiRequest.get('monitor', req), bllApiRequest.get('monitor', req2)];
                //$q.all(promises).then(function (results) {
                //    var res = results[0],
                //        res2 = results[1],
                //        hosts = [],
                //        clusters = {};
                //    res.data.forEach(function (datum) {
                //        if (!arrayContainsString(hosts, datum.dimensions.hostname)) {
                //            hosts.push(datum.dimensions.hostname);
                //        }
                //        if (!arrayContainsString(clusters, datum.dimensions.cluster)) {
                //            var cluster_hosts = res.data.filter(function(d) {
                //                return d.dimensions.cluster === datum.dimensions.cluster;
                //            }).map(function(d) {
                //                return d.dimensions.hostname;
                //            });
                //            clusters[datum.dimensions.cluster] = cluster_hosts;
                //        }
                //    });
                //
                //    var host_data = res2.data.counts.filter(function (datum) {
                //            return datum[1] === 'hostname' && arrayContainsString(hosts, datum[2]);
                //        });
                //    $scope.alarm_tiles[1].data = processAlarmCount(undefined, host_data);
                //
                //    angular.forEach(clusters, function(hosts, cluster) {
                //        var this_cluster_data = res2.data.counts.filter(function (datum) {
                //            return datum[1] === 'hostname' && arrayContainsString(hosts, datum[2]);
                //        });
                //        $scope.alarm_tiles.push({
                //            title: cluster,
                //            data: processAlarmCount(undefined, this_cluster_data),
                //            type: "alarmList",
                //            ctitleback: cluster.toUpperCase(),
                //            slideover: $translate.instant("storage.object_storage.inventory_summary.cluster.summary")
                //        });
                //
                //        //generate heat map values
                //        var heatMapData = hosts.map(function(host) {
                //            var state, count, alarm_counts = processAlarmCount(function(datum) {
                //                return datum[1] === 'hostname' && datum[2] === host;
                //            }, res2.data.counts);
                //            if(!alarm_counts.critical.count && !alarm_counts.warning.count && !alarm_counts.unknown.count && alarm_counts.ok.count) {
                //                state = 'ok';
                //            } else if(!alarm_counts.critical.count && !alarm_counts.warning.count && alarm_counts.unknown.count) {
                //                state = 'unknown';
                //            } else if(!alarm_counts.critical.count && alarm_counts.warning.count) {
                //                state = 'warning';
                //                count = alarm_counts.warning.count;
                //            } else if(!alarm_counts.critical.count) {
                //                state = 'critical';
                //                count = alarm_counts.critical.count;
                //            }
                //            return {
                //                value: count,
                //                state: state,
                //                id: host,
                //                cluster: cluster
                //            };
                //        });
                //        $scope.healthFocusedData.push({
                //            name: cluster,
                //            data: heatMapData
                //        });
                //    });
                //}, function (error_data) {
                //    console.error(error_data);
                //});
            }

            $scope.getAlarmClass = function (cond) {
                var iconCondMap = {
                    'OK': 'ardana-icon-Active_L',
                    'ALARM': 'ardana-icon-Alert_pressed',
                    'CRITICAL': 'ardana-icon-Critical_L',
                    'UNDETERMINED': 'ardana-icon-Unknown_L'
                };

                return iconCondMap[cond];
            };

            $scope.getCheckMountStatus = function(check_mount){
                if(typeof(check_mount) === "object") return "N/A";
                else if(check_mount === 0) return "YES";
                else if(check_mount === 2) return "NO";
            };

            getAsycPendingMetricCardData();
            getTimeToReplicateMetricCardData();
            getOldestReplicationMetricCardData();
            getLoadAverageMetricCardData();
            getAlarmsMetricCardData();
            //getTotalNodesMetricCardData();
            getNodeStateMetricCardData();
            setGraphConfigs();
            getAsyncChartData("24", 120);
            getTimeToReplicateChartData("24", 120);
            getOldestReplicationChartData("24", 120);
            getLoadAverageChartData("24", 120);
            getCPULoadAverageHeatMapData();
            getHealthFocusedInventoryHeatMapData();
        }
    ]);
})(angular);
