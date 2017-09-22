// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {

    'use strict';

    var p = ng.module('plugins');

    p.controller('ComputeSummaryController', ['$scope', '$rootScope', '$translate', '$filter', 'addNotification', 'bllApiRequest', 'styleutils', 'isUndefined', '$q',
        function ($scope, $rootScope, $translate, $filter, addNotification, bllApiRequest, styleutils, isUndefined, $q) {
            var itemStore = [];
            var firstCreate = false;
            var default_widgets = [{
                id: 'MY.DASHBOARD.COMPUTE_SUMMARY',
                title: $translate.instant('monitoring_dashboard.compute_nodes_summary_card_title'),
                translatedTitle: $translate.instant('monitoring_dashboard.compute_nodes_summary_card_title'),
                type: 'metric',
                subType: 'computeHosts'
            },{
                id: 'MY.DASHBOARD.VIRTUAL_CPU',
                title: $translate.instant('monitoring_dashboard.virtual_cpu_hosts_card_title'),
                translatedTitle: $translate.instant('monitoring_dashboard.virtual_cpu_hosts_card_title'),
                type: 'metric',
                subType: 'computeHostResource',
                total: 'total_cpu',
                fraction: 'allocated_cpu'
            },{
                id: 'MY.DASHBOARD.VIRTUAL_MEMORY',
                title: $translate.instant('monitoring_dashboard.virtual_memory_hosts_card_title'),
                translatedTitle: $translate.instant('monitoring_dashboard.virtual_memory_hosts_card_title'),
                type: 'metric',
                subType: 'computeHostResource',
                total: 'total_memory',
                fraction: 'allocated_memory',
                units: 'GB',
                unitConversion: 0.001
            },{
                id: 'MY.DASHBOARD.VIRTUAL_STORAGE',
                title: $translate.instant('monitoring_dashboard.virtual_storage_hosts_card_title'),
                translatedTitle: $translate.instant('monitoring_dashboard.virtual_storage_hosts_card_title'),
                type: 'metric',
                subType: 'computeHostResource',
                total: 'total_storage',
                fraction: 'allocated_storage',
                units: 'GB'
            },{
                id: 'MY.DASHBOARD.COMPUTE_STATUS',
                title: $translate.instant('monitoring_dashboard.compute_nodes_status_card_title'),
                translatedTitle: $translate.instant('monitoring_dashboard.compute_nodes_status_card_title'),
                type: 'metric',
                subType: 'computeHostsAlarms',
            }],
            default_resource_widgets = [{
                id: 'MY.DASHBOARD.CPU_USAGE',
                title: $translate.instant('monitoring_dashboard.cpu_card_title'),
                translatedTitle: $translate.instant('monitoring_dashboard.cpu_card_title'),
                type: 'metric',
                subType: 'percentage',
                total: 100,
                fraction: 'cpu.idle_perc',
                dimensions: {
                    cluster: 'compute'
                },
                units: 'TOTAL',
                round: 2,
                inverseFraction: true,
                altsummary: 'Capacity'
            },{
                id: 'MY.DASHBOARD.MEMORY_USAGE',
                title: $translate.instant('monitoring_dashboard.memory_card_title'),
                translatedTitle: $translate.instant('monitoring_dashboard.memory_card_title'),
                type: 'metric',
                subType: 'percentage',
                total: 'mem.total_mb',
                fraction: 'mem.free_mb',
                dimensions: {
                    cluster: 'compute'
                },
                units: 'GB',
                unitConversion: 0.001,
                inverseFraction: true
            },{
                id: 'MY.DASHBOARD.DISK_USAGE',
                title: $translate.instant('monitoring_dashboard.disk_card_title'),
                translatedTitle: $translate.instant('monitoring_dashboard.disk_card_title'),
                type: 'metric',
                subType: 'percentage',
                total: 'disk.total_space_mb',
                fraction: 'disk.space_used_perc',
                dimensions: {
                    cluster: 'compute'
                },
                units: 'GB',
                unitConversion: 0.001,
                fractionPercent: true
            }];

            default_widgets = default_widgets.concat(default_resource_widgets);

            $scope.currentDashboardItems = default_widgets;

            function drawItems() {
                $scope.itemList = default_widgets.map(function(item) {
                    return item.type !== 'chart' ? {
                        type: item.type,
                        config: item
                    } : {
                        config: {
                            title: item.name,
                            type: item.chartType,
                            chartType: item.chartType,
                            id: item.id,
                            menu:[]
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
                });
            }
            drawItems();

            var instancesHistory = {
                title: "compute_nodes.compute_summary.instance_history.header",
                plotType: "plot",
                line: true,
                stackbar: "true",
                legendid: "#instanceLegend",
                gridHeaderImage: '/images/icons/dashboard/instance.png',
                grid: [{
                    label: $translate.instant("compute_nodes.compute_summary.instance_history.legend.instance_created_per_day"),
                    data: 0
                }, {
                    label: $translate.instant("compute_nodes.compute_summary.instance_history.legend.instance_destroyed_per_day"),
                    data: 0
                }],
                progressData: {
                    showProgressIcon: true
                },
                data: [{
                    label: $translate.instant("compute_nodes.compute_summary.instance_history.legend.instance_created"),
                    data: []
                }, {
                    label: $translate.instant("compute_nodes.compute_summary.instance_history.legend.instance_destroyed"),
                    data: []
                }]
            };

            var req_activation_states = {
                operation: 'eon_compute_list'
            };

            var todayDate = new Date();
            var timestamp = todayDate.getTime();
            var seventhDayTimestamp = timestamp - (6 * 24 * 60 * 60 * 1000);
            var seventhDate = new Date(seventhDayTimestamp);

            var req_instance_history = {
                operation: "servers-list",
                entity: "instances",
                end_date: todayDate.getFullYear() + "-" + (todayDate.getMonth() + 1) + "-" + todayDate.getDate(),
                start_date: seventhDate.getFullYear() + "-" + (seventhDate.getMonth() + 1) + "-" + seventhDate.getDate()
            };

            bllApiRequest.get("nova", req_instance_history).then(
                function (data) {
                    // Set the states data
                    instancesHistory.progressData.showProgressIcon = false;
                    if (angular.isDefined(data.data) && data.data !== null) {
                        instancesHistory.data[0].data = data.data.created.data;
                        instancesHistory.data[1].data = data.data.deleted.data;
                        instancesHistory.grid[0].data = data.data.created.average;
                        instancesHistory.grid[1].data = data.data.deleted.average;
                    }
                },
                function (error) {//this is the method called when the bll call fails with error
                    // Set the esx operation to ideal
                    instancesHistory.progressData.showProgressIcon = false;
                    addNotification("error",
                        $translate.instant("compute.compute_summary.messages.instance_history_data_not_available") /*+ ": " + error.message.data[0].data*/);
                }
            );

            var req_allocation_stats = {
                operation: "hypervisor-stats"
            };


            var column1 = [
                instancesHistory];

            $scope.grid = [
                column1
            ];

        }
    ]);
})(angular);
