// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';
    var p = ng.module('plugins');
    p.controller('ObjectStorageCapacitySummaryController', ['$rootScope', '$scope', '$translate', 'bllApiRequest', 'ifValueNA',
        'unitCheckForNA', 'trimNegativeValuesFromData', 'getCurrentISOTime', 'bytesToSize', 'addNotification',
        'setNAifValueNA', 'log', 'commonChartLegendButtons',
        function ($rootScope, $scope, $translate, bllApiRequest, ifValueNA, unitCheckForNA, trimNegativeValuesFromData,
                  getCurrentISOTime, bytesToSize, addNotification, setNAifValueNA, log, commonChartLegendButtons) {

            $scope.topTenProjectLoading = false;
            $scope.projectCapacityDetailsLoading = false;
            $scope.selected_project = {
                name: 'all',
                id: 'all'
            };
            $scope.selectedUtilizationChartData = [];
            $scope.roc_range = "N/A";
            $scope.utilizationFocusedData = [];
            $scope.has_rate_of_change_data = false;
            $scope.has_selected_rate_of_change_data = false;
            $scope.has_selected_utilization_data = false;

            $scope.capacity_tiles = [{
                title: "storage.object_storage.current_capacity.header",
                data: {
                    value: 'N/A',
                    unit: 'N/A',
                    range: 'N/A'
                },
                type: "range",
                condition: false
            }, {
                title: "storage.object_storage.hourly_rate_of_change.header",
                data: {
                    value: 'N/A',
                    unit: 'N/A',
                    range: 'N/A'
                },
                type: "range"
            }];

            $scope.selected_project_tiles = [
                {
                    title: "storage.object_storage.current_capacity.header",
                    data: {value: 'N/A'},
                    type: "range"
                }, {
                    title: "storage.object_storage.hourly_rate_of_change.header",
                    data: {value: 'N/A'},
                    type: "range"
                }
            ];

            $scope.capacitySummaryChartPages = [{
                header: 'storage.object_storage.current_capacity.chart',
                template: 'storage/templates/objectstorage/capacitysummary/capacity_summary.html',
                tabname: 'capacity_summary'
            }, {
                header: 'storage.object_storage.rate_of_change.chart',
                template: 'storage/templates/objectstorage/capacitysummary/rate_of_change.html',
                tabname: 'rate_of_change'
            }];

            $scope.select_projectChartPages = [{
                header: 'storage.object_storage.project_utilization.chart',
                template: 'storage/templates/objectstorage/capacitysummary/selected_project_utilization.html',
                tabname: 'selected_utilization_chart'
            }, {
                header: 'storage.object_storage.rate_of_change.chart',
                template: 'storage/templates/objectstorage/capacitysummary/selected_project_rate_of_change.html',
                tabname: 'selected_rate_of_change_chart'
            }];

            $scope.projects = [];
            $scope.top_10_projects = [];

            $scope.sampleConfig = {
                legendConfig: {
                    legendButtons: commonChartLegendButtons,
                    legendButtonsValue: "1day",
                    legendLabels: [
                        {
                            label: "Capacity",
                            color: "#02D35F"
                        },
                        {
                            label: "Utilization",
                            color: "#333333"
                        }
                    ]
                },
                graphOptions: {
                    graphTitleConfig: {},

                    graphColors: {
                        stackColors: ["#02D35F", "#333333"]
                    },

                    graphAxisConfig: {
                        xAxis: {
                            range: "hours",
                            rangeHours: 24,
                            interval: [1, "hours"],
                            tickFormat: "%H:%M"
                        },
                        yAxis: {
                            min: 0
                        }
                    }
                },
                loading: false,
                no_data: false
            };

            $scope.selectedUtilizationChartConfig = angular.copy($scope.sampleConfig);
            $scope.selectedUtilizationChartConfig.legendConfig.legendLabels = [{label: "Utilization", color: "#333333"}];
            $scope.selectedUtilizationChartConfig.graphOptions.graphAxisConfig.yAxis.format = 'bytes';
            $scope.selectedROCChartConfig = angular.copy($scope.sampleConfig);
            $scope.selectedROCChartConfig.graphOptions.graphAxisConfig.yAxis = {
                'format': formatRateOfChangeChartyAxisData
            };

            $scope.capacityChartConfig = angular.copy($scope.sampleConfig);
            $scope.capacityChartConfig.legendConfig.legendLabels = [{label: "Capacity", color: "#333333"}];
            $scope.capacityChartConfig.graphOptions.graphColors.stackColors = ["#333333", "#02D35F"];
            $scope.capacityChartConfig.graphOptions.graphColors.fill = "#333333";
            $scope.capacityChartConfig.graphOptions.graphColors.stroke = "#333333";
            $scope.capacityChartConfig.graphOptions.graphAxisConfig.yAxis.format = 'bytes';

            $scope.rate_of_changeChartConfig = angular.copy($scope.sampleConfig);
            $scope.rate_of_changeChartConfig.legendConfig.legendLabels = [{label: "Rate of Change", color: "#02D35F"}];
            $scope.rate_of_changeChartConfig.graphOptions.graphAxisConfig.yAxis = {
                'format': formatRateOfChangeChartyAxisData
            };

            function updateLegendButtonNames(name, config) {
                var buttons = config.legendConfig.legendButtons || [];
                angular.forEach(buttons, function (button) {
                    button.name = name;
                });
            }

            updateLegendButtonNames('selected_utilization_date_range', $scope.selectedUtilizationChartConfig);
            updateLegendButtonNames('selected_roc_date_range', $scope.selectedROCChartConfig);
            updateLegendButtonNames('roc_date_range', $scope.rate_of_changeChartConfig);
            updateLegendButtonNames('capacity_date_range', $scope.capacityChartConfig);

            function formatRateOfChangeChartyAxisData(value, index) {
                var adjusted = parseFloat(value);

                var signFlag = "";
                //make positive to get unit and convert
                if (adjusted < 0) {
                    signFlag = "-";
                    adjusted = adjusted * (-1);
                }
                adjusted = bytesToSize(adjusted, 2);
                var rate = adjusted.split(" ");//get number out
                //if the data is like -0.004,come back as 0,  remove the - sign
                if (parseFloat(rate) === 0) {
                    signFlag = "";
                }
                adjusted = signFlag + adjusted;

                return adjusted;
            }

            function getCapacityMetricCardData() {
                var request = {
                    "operation": "current_capacity",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": "1", "period": "3600"}
                };

                if($scope.isMonascaTransformAvailable !== -1){
                    bllApiRequest.get("objectstorage_summary", request).then(
                        function (data) {
                            data = data.data;
                            var metric_data = {size_agg: 'N/A', avail_agg: 'N/A', used_agg: 'N/A'};
                            angular.forEach(data, function (val, key) {
                                var op = key.split('.').pop();
                                if (metric_data.hasOwnProperty(op))
                                    metric_data[op] = ifValueNA(-1, val) != 'N/A' ? val : "N/A";
                            });
                            if(metric_data.size_agg !== 'N/A' && metric_data.avail_agg !== 'N/A') {
                                metric_data.used_agg = metric_data.size_agg - metric_data.avail_agg;
                            }
                            var avail_percent = (metric_data.size_agg !== 'N/A') && (metric_data.avail_agg !== 'N/A') ?
                                ((metric_data.avail_agg / metric_data.size_agg) * 100).toFixed(2) : 'N/A';
                            angular.forEach(metric_data, function(val, key){
                                metric_data[key] = val !== "N/A" ? bytesToSize(val).split(" ") : "N/A";
                            });
                            var range = "";
                            range += setNAifValueNA(metric_data.avail_agg, metric_data.avail_agg[0]);
                            range += " " + unitCheckForNA(metric_data.avail_agg[1].toLowerCase(),
                                    metric_data.avail_agg) + ' (' + avail_percent + unitCheckForNA('%', avail_percent) + ') ';
                            $scope.roc_range = range + $translate.instant("storage.object_storage.remaining");
                            var capacity_range = range + $translate.instant("storage.object_storage.avail");
                            capacity_range += setNAifValueNA(metric_data.size_agg,metric_data.size_agg[0]);
                            capacity_range += " " + unitCheckForNA(metric_data.size_agg[1].toLowerCase(),
                                    metric_data.size_agg) + " " + $translate.instant("storage.object_storage.total");
                            $scope.capacity_tiles[0].data = {
                                value: setNAifValueNA(metric_data.used_agg, metric_data.used_agg[0]),
                                unit: unitCheckForNA(metric_data.used_agg[1].toUpperCase(), metric_data.used_agg),
                                range: capacity_range,
                                condition: 'ok'
                            };
                            getRateOfChangeMetricCardData();
                        },
                        function (error_data) {
                            var errorReason = error_data.data ? error_data.data[0].data :
                                $translate.instant("storage.object_storage.capacity.error");
                            addNotification('error', errorReason);
                            getRateOfChangeMetricCardData();
                        }
                    );
                }
            }

            function getRateOfChangeMetricCardData() {
                var request = {
                    "operation": "rate_of_change",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": "2", "period": "3600"}
                };

                if($scope.isMonascaTransformAvailable !== -1) {
                    bllApiRequest.get("objectstorage_summary", request).then(
                        function (data) {
                            var rData = data.data;
                            if (angular.isDefined(rData) && Array.isArray(rData)) {
                                var signFlag = "";
                                if(rData[0] < 0) {
                                    signFlag = "-";
                                    rData[0] = rData[0] * (-1);
                                }
                                var rate = bytesToSize(rData[0], 2).split(" ");
                                //if the number like -0.004 will come back as 0, remove the - sign
                                if(parseFloat(rate) === 0) {
                                    signFlag = "";
                                }
                                $scope.capacity_tiles[1].data.value = signFlag + rate[0];
                                $scope.capacity_tiles[1].data.unit = unitCheckForNA(rate[1] + '/hour', rate[0]);
                                $scope.capacity_tiles[1].data.range = $scope.roc_range;
                            }
                        },
                        function (error_data) {
                            var errorReason = error_data.data ? error_data.data[0].data :
                                $translate.instant("storage.object_storage.rate_of_change.error");
                            addNotification('error', errorReason);
                        }
                    );
                }
            }

            function getCapacityChartData(interval, period) {
                $scope.capacityChartConfig.loading = true;
                var request = {
                    "operation": "current_capacity",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": interval, "period": period}
                };

                if($scope.isMonascaTransformAvailable !== -1) {
                    bllApiRequest.get("objectstorage_summary", request).then(
                        function (data) {
                            var cData = data.data;
                            var size = cData['swiftlm.diskusage.val.size_agg'];
                            var avail = cData['swiftlm.diskusage.val.avail_agg'];
                            for(var i = 0; i < avail.length; i++) {
                              if(size[i][1] === -1 || avail[i][1] === -1) continue;
                              else cData['swiftlm.diskusage.val.avail_agg'][i][1] = size[i][1] - avail[i][1];
                            }

                            $scope.capacityChartConfig.loading = false;
                            $scope.capacityChartData = [];
                            $scope.capacityChartConfig.legendConfig.legendLabels = [];
                            var color_index = 0;
                            angular.forEach(cData, function (val, key) {
                                var metric_name = key.split('.').pop();
                                if (metric_name == 'avail_agg' || metric_name == 'size_agg') {
                                    $scope.capacityChartData.push({
                                        //data comes back as bytes
                                        //will format it based on the size
                                        //it could be either TB, MB or GB etc
                                        data: val,
                                        label: "diskusage-" + metric_name
                                    });
                                    var label = metric_name.split('_')[0] === 'avail' ?
                                      $translate.instant('storage.object_storage.current_capacity.chart.label_avail'):
                                        $translate.instant('storage.object_storage.current_capacity.chart.label_size');
                                    $scope.capacityChartConfig.legendConfig.legendLabels.push({
                                        label: label,
                                        color: $scope.capacityChartConfig.graphOptions.graphColors.stackColors[color_index++]
                                    });
                                }
                            });
                        },
                        function (error_data) {
                            var errorReason = error_data.data ? error_data.data[0].data :
                                $translate.instant("storage.object_storage.capacity.error");
                            addNotification('error', errorReason);
                            $scope.capacityChartConfig.loading = false;
                            $scope.capacityChartConfig.no_data = true;
                        }
                    );
                }
                else {
                    //don't have monasca transform
                    $scope.capacityChartConfig.loading = false;
                    $scope.capacityChartConfig.no_data = true;
                }
            }

            function getROCChartData(interval, period) {
                $scope.rate_of_changeChartConfig.loading = true;
                var request = {
                    "operation": "rate_of_change",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": interval, "period": period}
                };

                if($scope.isMonascaTransformAvailable !== -1){
                    bllApiRequest.get("objectstorage_summary", request).then(
                        function (data) {
                            $scope.rate_of_changeChartConfig.loading = false;
                            var rData = data.data;
                            $scope.rate_of_changeChartData = [];
                            $scope.has_rate_of_change_data = false;
                            for(var item in rData){
                                if(typeof(rData[item]) == "object" && rData[item].length > 0){
                                    if(rData[item][1] !== -1) {
                                        $scope.has_rate_of_change_data = true;
                                        break;
                                    }
                                }
                            }
                            if($scope.has_rate_of_change_data){
                                $scope.rate_of_changeChartData.push({
                                    //data comes back as bytes
                                    //will format it based on the size
                                    //it could be either byte, TB, MB or GB etc
                                    data: rData,
                                    label: "Rate Of Change"
                                });
                                $scope.rate_of_changeChartConfig.no_data = false;
                            } else $scope.rate_of_changeChartConfig.no_data = true;
                        },
                        function (error_data) {
                            var errorReason = error_data.data ? error_data.data[0].data :
                                $translate.instant("storage.object_storage.rate_of_change.error");
                            addNotification('error', errorReason);
                            $scope.rate_of_changeChartConfig.loading = false;
                            $scope.rate_of_changeChartConfig.no_data = true;
                        },
                        function (progress) {
                            log('info', 'Getting Rate of Change Chart Data...');
                        }
                    );
                }
                else {
                    $scope.rate_of_changeChartConfig.loading = false;
                    $scope.rate_of_changeChartConfig.no_data = true;
                }
            }

            function getUtilizationChartDataForProject(interval, period, project_name) {
                $scope.selectedUtilizationChartConfig.loading = true;
                if(project_name === undefined) project_name = $scope.selected_project.name == 'all' ? "all":
                    $scope.selected_project.id;
                var request = {
                    "operation": "project_capacity",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": interval, "period": period, id: project_name}
                };

                if($scope.isMonascaTransformAvailable !== -1) {
                    bllApiRequest.get("objectstorage_summary", request).then(
                        function (data) {
                            data = data.data;
                            $scope.selectedUtilizationChartConfig.loading = false;
                            $scope.selectedUtilizationChartData = [];
                            $scope.has_selected_utilization_data = false;
                            for(var item=0;item<data.length;item++){
                                if(typeof(data[item]) == "object" && data[item].length > 0){
                                    if(data[item][1] !== -1) {
                                        $scope.has_selected_utilization_data = true;
                                        break;
                                    }
                                }
                            }
                            if($scope.has_selected_utilization_data){
                                var label = "Project: ";
                                if (project_name == "all") label = 'All Projects' + ' - ' +
                                    $translate.instant("storage.object_storage.project_utilization.chart");
                                else label += project_name + '-' +
                                    $translate.instant('storage.object_storage.project_utilization.chart');
                                $scope.selectedUtilizationChartData.push({
                                    label: label,
                                    data: data
                                });
                                $scope.selectedUtilizationChartConfig.no_data = false;
                            } else $scope.selectedUtilizationChartConfig.no_data = true;
                        }, function (error_data) {
                            var errorReason = error_data.data ? error_data.data[0].data :
                                $translate.instant("storage.object_storage.project.capacity.error");
                            addNotification('error', errorReason);
                            $scope.selectedUtilizationChartConfig.loading = false;
                            $scope.selectedUtilizationChartConfig.no_data = true;
                        },
                        function (progress) {
                            log('info', 'Getting Capacity Chart Data...');
                        }
                    );
                }
            }

            function getROCChartDataForProject(interval, period, project_name) {
                $scope.selectedROCChartConfig.loading = true;
                if(project_name === undefined) project_name = $scope.selected_project.name == 'all' ? "all":
                    $scope.selected_project.id;
                var request = {
                    "operation": "project_capacity_roc",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": interval, "period": period, id: project_name}
                };
                if($scope.isMonascaTransformAvailable !== -1) {
                    bllApiRequest.get("objectstorage_summary", request).then(
                        function (data) {
                            data = data.data;
                            $scope.selectedROCChartConfig.loading = false;
                            $scope.selectedROCChartData = [];
                            $scope.has_selected_rate_of_change_data = false;
                            for(var item=0;item<data.length;item++){
                                if(typeof(data[item]) == "object" && data[item].length > 0){
                                    if(data[item][1] !== -1) {
                                        $scope.has_selected_rate_of_change_data = true;
                                        break;
                                    }
                                }
                            }
                            if($scope.has_selected_rate_of_change_data){
                                var label = "Project: ";
                                if (project_name == "all") label = 'All Projects' + ' - ' +
                                    $translate.instant("storage.object_storage.rate_of_change.total");
                                else label += project_name + '-' +
                                    $translate.instant('storage.object_storage.rate_of_change.total');
                                $scope.selectedROCChartData.push({
                                    label: label,
                                    data: data
                                });
                                $scope.selectedROCChartConfig.no_data = false;
                            } else $scope.selectedROCChartConfig.no_data = true;
                        },
                        function (error_data) {
                            var errorReason = error_data.data ? error_data.data[0].data :
                                $translate.instant("storage.object_storage.project.rate_of_change.error");
                            addNotification('error', errorReason);
                            $scope.selectedROCChartConfig.loading = false;
                            $scope.selectedROCChartConfig.no_data = true;
                        },
                        function(progress) {
                            log('info', 'Getting Rate of Change data for Project: ' + $scope.selected_project.name);
                        }
                    );
                }
            }

            function getTopTenProjectsList() {
                $scope.topTenProjectLoading = true;
                var request = {
                    "operation": "topten_project_capacity",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": "1", "period": "3600", "id": "all"}
                };

                bllApiRequest.get("objectstorage_summary", request).then(function (data) {
                    $scope.top_10_projects = [];
                    var max_utilization = -1;
                    angular.forEach(data.data, function (project, index) {
                        angular.forEach(project, function (val, key) {
                            var size = val.value !== undefined && ifValueNA(-1, val.value) !== 'N/A' ?
                                bytesToSize(val.value) : 'N/A';
                            var rawSize = val.value;
                            if (index === 0) {
                                max_utilization = ifValueNA(-1, val.value) !== 'N/A' ? val.value : "N/A";
                            }
                            var project = {
                                name: key,
                                size: size,
                                rawSize: rawSize
                            };
                            project.utilization = 0;
                            if (size !== 'N/A' && val.value > 0) project.utilization = val.value * 100 / max_utilization;
                            $scope.top_10_projects.push(project);
                        });
                    });
                    $scope.topTenProjectLoading = false;
                }, function (error_data) {
                    $scope.topTenProjectLoading = false;
                    var errorReason = error_data.data ? error_data.data[0].data : $translate.instant("storage.object_storage.topten.error");
                    addNotification('error', errorReason);
                }, function(progress){
                    log('info', 'Getting Top Ten Project Capacity Data...');
                });
            }

            $scope.$watch('selected_project.id', function () {
                if ($scope.selected_project.id && $scope.selected_project.name) {
                    var selected_project = $scope.selected_project;
                    if ($scope.selected_project.name == 'all'){
                        selected_project = "all";
                        $scope.selectedUtilizationChartConfig.legendConfig.legendLabels =[{
                            label: "All Project - Utilization",
                            color: "#02D35F"
                        }];
                        $scope.selectedROCChartConfig.legendConfig.legendLabels = [{
                            label: "All Project - Rate of Change",
                            color: "#02D35F"
                        }];
                    } else {
                        $scope.selectedUtilizationChartConfig.legendConfig.legendLabels = [{
                            label: "Project " + selected_project.name + " - " +
                                $translate.instant("storage.object_storage.project_utilization.chart"),
                            color: "#02D35F"
                        }];
                        $scope.selectedROCChartConfig.legendConfig.legendLabels = [{
                            label: "Project " + selected_project.name + " - " +
                                $translate.instant('storage.object_storage.rate_of_change.total'),
                            color: "#02D35F"
                        }];
                    }
                    $scope.selectedUtilizationChartConfig.legendConfig.legendButtonsValue = '1day';
                    $scope.selectedROCChartConfig.legendConfig.legendButtonsValue = '1day';
                    getCapacityMetricCardDataForProject(selected_project.id);
                    getROCMetricCardDataForProject(selected_project.id);
                    getUtilizationChartDataForProject("24", 3600, selected_project.id);
                    getROCChartDataForProject("24", 3600, selected_project.id);
                }
            });

            $scope.$watch('roc_range', function () {
                if ($scope.roc_range != "N/A") {
                    $scope.capacity_tiles[1].data.range = $scope.roc_range;
                }
            });

            function getCapacityMetricCardDataForProject(project_name) {
                $scope.projectCapacityDetailsLoading = true;
                if(project_name === undefined) project_name = $scope.selected_project.name == 'all' ? "all":
                    $scope.selected_project.id;
                var request = {
                    "operation": "project_capacity",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": "1", "period": "3600", "id": project_name}
                };

                if($scope.isMonascaTransformAvailable !== -1) {
                    bllApiRequest.get("objectstorage_summary", request).then(function (data) {
                        data = data.data;
                        if (data.length > 0) {
                            var capacity = ifValueNA(-1, data[0]) !== "N/A" ? bytesToSize(data[0]).split(" ") : "N/A";

                            $scope.selected_project_tiles[0].data = {
                                value: setNAifValueNA(capacity, capacity[0]),
                                unit: unitCheckForNA(capacity[1], capacity)
                            };
                        }
                        $scope.projectCapacityDetailsLoading = false;
                    }, function (error_data) {
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.project.capacity.error");
                        addNotification('error', errorReason);
                        $scope.projectCapacityDetailsLoading = false;
                    }, function(progress){
                        log('info', 'Getting Project Capacity Data...');
                    });
                }
            }

            function getROCMetricCardDataForProject(project_name) {
                $scope.projectCapacityDetailsLoading = true;
                if(project_name === undefined) project_name = $scope.selected_project.name == 'all' ? "all":
                    $scope.selected_project.id;
                var request = {
                    "operation": "project_capacity_roc",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": "2", "period": "3600", "id": project_name}
                };
                if($scope.isMonascaTransformAvailable !== -1){
                    bllApiRequest.get("objectstorage_summary", request).then(function (data) {
                        data = data.data;
                        if (data.length > 0) {
                            var roc = ifValueNA(-1, data[0]) !== "N/A" ? bytesToSize(data[0]).split(" ") : "N/A";

                            $scope.selected_project_tiles[1].data = {
                                value: setNAifValueNA(roc, roc[0]),
                                unit: unitCheckForNA(roc[1] + " / hour", roc)
                            };
                        }
                        $scope.projectCapacityDetailsLoading = false;
                    }, function (error_data) {
                        var errorReason = error_data.data ? error_data.data[0].data :
                            $translate.instant("storage.object_storage.project.rate_of_change.error");
                        addNotification('error', errorReason);
                        $scope.projectCapacityDetailsLoading = false;
                    }, function(progress){
                        log('info', 'Getting Project Rate of Change Data...');
                    });
                }
            }

            function setCapacityChartAxisData(range, interval, ticks, rangeHours) {
                $scope.capacityChartConfig.graphOptions.graphAxisConfig.xAxis = {};
                $scope.capacityChartConfig.graphOptions.graphAxisConfig.xAxis = {
                    range: range, interval: interval, tickFormat: ticks, rangeHours: rangeHours
                };
            }

            function setSelectedCapacityChartAxisData(range, interval, ticks, rangeHours) {
                $scope.selectedUtilizationChartConfig.graphOptions.graphAxisConfig.xAxis = {};
                $scope.selectedUtilizationChartConfig.graphOptions.graphAxisConfig.xAxis = {
                    range: range, interval: interval, tickFormat: ticks, rangeHoursP: rangeHours
                };
            }

            function setROCChartAxisData(range, interval, ticks, rangeHours) {
                $scope.rate_of_changeChartConfig.graphOptions.graphAxisConfig.xAxis = {};
                $scope.rate_of_changeChartConfig.graphOptions.graphAxisConfig.xAxis = {
                    range: range, interval: interval, tickFormat: ticks, rangeHours: rangeHours
                };
            }

            function setSelectedROCChartAxisData(range, interval, ticks, rangeHours) {
                $scope.selectedROCChartConfig.graphOptions.graphAxisConfig.xAxis = {};
                $scope.selectedROCChartConfig.graphOptions.graphAxisConfig.xAxis = {
                    range: range, interval: interval, tickFormat: ticks, rangeHours: rangeHours
                };
            }

            function getUtilizationFocusedHeatMapData() {
                var request = {
                    "operation": "heat_map_utilization_focused_inventory",
                    "data": {"end_time": getCurrentISOTime(12000), "interval": "1", "period": 3600}
                };

                if($scope.isMonascaTransformAvailable !== -1){
                    bllApiRequest.get("objectstorage_summary", request).then(
                        function (data) {
                            var resource_data = data.data;
                            angular.forEach(resource_data, function (val, key) {
                                var metric_val = [];
                                angular.forEach(val, function (host_data, host) {
                                    var metric_data = {size_agg: 'N/A', avail_agg: 'N/A'};
                                    angular.forEach(host_data, function(val, key){
                                        var op = key.split('.').pop();
                                        if(val != -1) metric_data[op] = val;
                                    });
                                    var utilization = "N/A";
                                    if(metric_data.size_agg !== "N/A" && metric_data.avail_agg !== 'N/A')
                                        utilization = parseFloat((metric_data.size_agg - metric_data.avail_agg) * 100 /
                                            metric_data.size_agg).toFixed(1);
                                    metric_val.push({
                                        title: utilization !== "N/A" ? utilization.toString() + "%" : "N/A",
                                        value: utilization !== 'N/A' ? utilization : undefined,
                                        id: "CONTROL PLANE: " + host,
                                        total: metric_data.size_agg !== 'N/A' ? metric_data.size_agg : undefined,
                                        clustername: key,
                                        hostname: host
                                    });
                                });
                                function sortObjByKey(a, b){
                                    if(a.value < b.value) return -1;
                                    if(a.value > b.value) return 1;
                                    return 0;
                                }
                                metric_val.sort(sortObjByKey);
                                $scope.utilizationFocusedData.push({
                                    name: key,
                                    data: metric_val
                                });
                            });
                        },
                        function (error_data) {
                            var errorReason = error_data.data ? error_data.data[0].data :
                                $translate.instant("storage.object_storage.project.utilization.error");
                            addNotification('error', errorReason);
                        },
                        function(progress){
                            log('info', 'Getting Utilization Focused Inventory Data...');
                        }
                    );
                }
            }


            function setChartData(data1, data2) {
                var interval_mappings = {
                    "1day": {
                        interval: 24, period: 3600, range: "hours", label_interval: [2, "hours"], tickFormat: "%H:%M"
                    }, "7days": {
                        interval: 168, period: 7200, range: "hours", label_interval: [12, "hours"], tickFormat: "%H:%M"
                    }, "30days": {
                        interval: 720, period: 14400, range: "days", label_interval: [2, "days"], tickFormat: "%m-%d"
                    }
                };
                var data_mappings = {
                    "capacity-chart": {
                        get_data_from_source: getCapacityChartData,
                        set_axis_config: setCapacityChartAxisData
                    },
                    "roc-chart": {
                        get_data_from_source: getROCChartData,
                        set_axis_config: setROCChartAxisData
                    },
                    "selected_utilization_chart": {
                        get_data_from_source: getUtilizationChartDataForProject,
                        set_axis_config: setSelectedCapacityChartAxisData
                    },
                    "selected-roc-chart": {
                        get_data_from_source: getROCChartDataForProject,
                        set_axis_config: setSelectedROCChartAxisData
                    }
                };

                if (data_mappings.hasOwnProperty(data2)) {
                    if (interval_mappings.hasOwnProperty(data1)) {
                        var options = interval_mappings[data1];
                        data_mappings[data2].get_data_from_source(options.interval, options.period);
                        data_mappings[data2].set_axis_config(options.range, options.label_interval, options.tickFormat, options.interval);
                    } else {
                        data_mappings[data2].get_data_from_source(1080, 21600);
                        data_mappings[data2].set_axis_config("days", [3, "days"], "%m-%d");
                    }
                }
            }

            $scope.$on('d3ChartLegendButtonAction', function ($event, data1, data2) {
                setChartData(data1.toString(), data2.toString());
            });

            $scope.utilizationFocusedHeatMapClick = function (data) {
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
                $scope.utilizationFocusedStackModalFlag = true;
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
                        $scope.storageAlarmData = {
                            critical: {count: 0},
                            warning: {count: 0},
                            unknown: {count: 0},
                            ok: {count: 0},
                            count: 0
                        };
                        var errorReason = error_data.data ? error_data.data[0].data : $translate.instant("storage.object_storage.capacity.error");
                        addNotification('error', errorReason);
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
                        var errorReason = error_data.data ? error_data.data[0].data : $translate.instant("storage.object_storage.capacity.error");
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
                        var errorReason = error_data.data ? error_data.data[0].data : $translate.instant("storage.object_storage.capacity.error");
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
                        var errorReason = error_data.data ? error_data.data[0].data : $translate.instant("storage.object_storage.capacity.error");
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
                        var errorReason = error_data.data ? error_data.data[0].data : $translate.instant("storage.object_storage.capacity.error");
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
                        var errorReason = error_data.data ? error_data.data[0].data : $translate.instant("storage.object_storage.capacity.error");
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
                        var errorReason = error_data.data ? error_data.data[0].data : $translate.instant("storage.object_storage.capacity.error");
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
                        var errorReason = error_data.data ? error_data.data[0].data : $translate.instant("storage.object_storage.capacity.error");
                        addNotification('error', errorReason);
                    }
                );
            };

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

            var init_monasca_transform_data = function(){
                getCapacityMetricCardData();
                getCapacityChartData("24", 3600);
                getROCChartData("24", 3600);
                getUtilizationFocusedHeatMapData();
            };

            getTopTenProjectsList();

            $scope.isMonascaTransformAvailable = Array.isArray($rootScope.available_bllplugins) ?
                $rootScope.available_bllplugins.indexOf('monasca-transform') : -1;
            $rootScope.$watch('available_bllplugins', function(){
                if($rootScope.available_bllplugins && Array.isArray($rootScope.available_bllplugins))
                    $scope.isMonascaTransformAvailable = $rootScope.available_bllplugins.indexOf('monasca-transform');
                if($rootScope.dev_mode) $scope.isMonascaTransformAvailable = 1;
                if($scope.isMonascaTransformAvailable !== -1) init_monasca_transform_data();
            });
        }
    ]);
})(angular);
