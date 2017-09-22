// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(ng) {
    'use strict';

    var p = ng.module('plugins');
    p.controller('ComputeInventorySummaryController', [
        '$scope', '$translate', 'bllApiRequest', '$location', 'log', 'addNotification', 'getClusterGrouping',
        'getHostAlarmCountForGroup', 'getHostWorstAlarmForGroup', 'getClusterUtilization', '$q',
        'getAllAlarmByState',
        function($scope, $translate, bllApiRequest, $location, log, addNotification, getClusterGrouping,
                 getHostAlarmCountForGroup, getHostWorstAlarmForGroup, getClusterUtilization, $q,
                 getAllAlarmByState) {
            $scope.computeInventorySummaryHealthPages = [{
                header: 'compute.inventory.health_focused.title',
                template: 'compute/templates/inventorysummary/compute_inventory_health_focused.html',
                tabname: 'compute_inventory_health_focused'
            }];
            $scope.computeInventorySummaryUtilizationPages = [{
                header: 'compute.inventory.utilization.cpu.title',
                template: 'compute/templates/inventorysummary/compute_inventory_utilization_cpu.html',
                tabname: 'compute_inventory_utilization_cpu'
            }, {
                header: 'compute.inventory.utilization.memory.title',
                template: 'compute/templates/inventorysummary/compute_inventory_utilization_memory.html',
                tabname: 'compute_inventory_utilization_memory'
            }, {
                header: 'compute.inventory.utilization.storage.title',
                template: 'compute/templates/inventorysummary/compute_inventory_utilization_storage.html',
                tabname: 'compute_inventory_utilization_storage'
            }];

            function initializeData() {
                $scope.inventory_cards = [{
                    title: 'common.total_hosts',
                    type: 'alarmList',
                    data: {ok: {count: 0}, warning: {count: 0}, critical: {count: 0}, unknown: {count: 0}, altTotal: {count: 0}}
                }, {
                    title: "common.alarms",
                    type: 'alarmDonut',
                    data: {ok: {count: 0}, warning: {count: 0}, critical: {count: 0}, unknown: {count: 0}}
                }];
                $scope.cluster_health_maps = [];
                $scope.cluster_util_cpu_maps = [];
                $scope.cluster_util_memory_maps = [];
                $scope.cluster_util_storage_maps = [];
                $scope.allControlPlanes = [];
                $scope.allClusters = [];
            }

            function populateInventoryData() {
                initializeData();
                getClusterGrouping().then(function(data) {
                    if (data.length > 0) {
                        $scope.clusterGroupings = transformClusterData(data);
                        $scope.loadingAlarmData = true;
                        var promises = $scope.clusterGroupings.map(getHostAlarmCountForGroup);
                        $q.all(promises).then(function(results) {
                            results.forEach(function(res) {
                                $scope.allControlPlanes.push(res.group.control_plane);
                                $scope.allClusters.push(res.group.cluster);
                                processWorstAlarmForGroup(res.alarms, res.group);
                            });
                            getAllAlarmCount();
                        });
                    }
                });
                getUtilizationData();
            }

            function transformClusterData(data) {
                var clusterData = [];
                data.forEach(function(d) {
                    clusterData.push({
                        cluster: d.cluster,
                        control_plane: d.control_plane,
                        hostList: d.nodes,
                        hosts: d.nodes.join('|'),
                        clusterName: d.control_plane + ': ' + d.cluster
                    });
                });
                return clusterData;
            }

            // use a separate Monasca call to get alarm counts by state and translate them into
            // metric card input format for the alarm count donut card, this is to avoid the problem
            // of Monasca reports duplicate counts when using 'group by' with hostname because each
            // alarm may have more than one metric associated with it, which means a single alarm
            // can fall under multiple hostnames and that alarm gets counted in all groups it matches
            function getAllAlarmCount() {
                getAllAlarmByState($scope.allControlPlanes.join('|'), $scope.allClusters.join('|')).then(function(data) {
                    var count = [0, 0, 0, 0];
                    data.forEach(function(d) {
                        switch(d[1]) {
                            case "UNDETERMINED":
                                count[0] += d[0];
                                break;
                            case "OK":
                                count[1] += d[0];
                                break;
                            case "ALARM":
                                if (d[2] === 'CRITICAL' || d[2] === 'HIGH') {
                                    count[3] += d[0];
                                } else {
                                    count[2] += d[0];
                                }
                                break;
                        }
                    });
                    $scope.inventory_cards[$scope.inventory_cards.length - 1].data.unknown.count = count[0];
                    $scope.inventory_cards[$scope.inventory_cards.length - 1].data.ok.count = count[1];
                    $scope.inventory_cards[$scope.inventory_cards.length - 1].data.warning.count = count[2];
                    $scope.inventory_cards[$scope.inventory_cards.length - 1].data.critical.count = count[3];
                });
            }

            // aggregate all cluster data into total data
            function aggregateWorstAlarmByHost(hostCountData) {
                $scope.inventory_cards[0].data.unknown.count += hostCountData.unknown.count;
                $scope.inventory_cards[0].data.ok.count += hostCountData.ok.count;
                $scope.inventory_cards[0].data.warning.count += hostCountData.warning.count;
                $scope.inventory_cards[0].data.critical.count += hostCountData.critical.count;
                $scope.inventory_cards[0].data.altTotal.count += hostCountData.altTotal.count;
            }

            function processWorstAlarmForGroup(alarmCountList, group) {
                var worstAlarmData = getHostWorstAlarmForGroup(alarmCountList, group.hostList);

                // create data for total and cluster cards
                var clusterData = {
                    unknown: {count: worstAlarmData.hostCountByAlarm[0].length},
                    ok: {count: worstAlarmData.hostCountByAlarm[1].length},
                    warning: {count: worstAlarmData.hostCountByAlarm[2].length},
                    critical: {count: worstAlarmData.hostCountByAlarm[3].length},
                    altTotal: {count: group.hostList.length}
                };
                var cardData = {
                    title: group.clusterName,
                    control_plane: group.control_plane,
                    cluster: group.cluster,
                    type: 'alarmList',
                    data: clusterData
                };
                $scope.inventory_cards.splice($scope.inventory_cards.length - 1, 0, cardData);
                aggregateWorstAlarmByHost(clusterData);

                // create data for health-focused heatmaps, sort by highest level first
                var hostMapData = worstAlarmData.hostAlarmData;
                $scope.cluster_health_maps.push({
                    control_plane: group.control_plane,
                    cluster: group.cluster,
                    title: group.clusterName,
                    data: hostMapData.map(function(m) {
                        return {name: m.hostname,
                                value: showValue(m.alarmCount, m.stateLevel),
                                state: m.state};})
                });

                // Adding host data to the health map (for drill down purposes) from the call to get
                // the utilization data, so we'll need both calls to finish before we can do this.
                // Sometimes the get alarm list call is slower than the get utilization data call,
                // so check to see if the host data was added or not first, only need to do this once
                if ($scope.cluster_health_maps.length === $scope.clusterGroupings.length &&
                    angular.isDefined($scope.hostDataList) && angular.isUndefined($scope.addedHostDataToHealthMaps)) {
                    addHostDataToHealthMaps();
                }
            }

            // only show the value on the map if the state is critical or warning
            function showValue(value, state) {
                return (state < 3) ? '' : value;
            }

            function getUtilizationData() {
                $scope.loadingUtilizationData = true;
                getClusterUtilization().then(function(data) {
                    if (data.length > 0) {
                        $scope.hostDataList = data;
                        // populate utilization heat maps
                        for (var i=0; i<data.length; i++) {
                            var clusterGrouping = data[i];
                            var clusterName = clusterGrouping.control_plane + ": " + clusterGrouping.cluster;
                            var cpuMap = {title: clusterName};
                            var memoryMap = {title: clusterName};
                            var storageMap = {title: clusterName};
                            var cpuData = [], memoryData = [], storageData = [];

                            for (var nodeName in clusterGrouping.nodes) {
                                var nodeData = clusterGrouping.nodes[nodeName];
                                cpuData.push({
                                    host: nodeName,
                                    hostData: nodeData,
                                    total: nodeData.total_cpu,
                                    value: nodeData.used_cpu_perc || undefined,
                                    title: nodeData.used_cpu_perc === undefined ?
                                           $translate.instant("common.not_applicable") :
                                           Math.round(nodeData.used_cpu_perc) + '%'
                                });
                                memoryData.push({
                                    host: nodeName,
                                    hostData: nodeData,
                                    total: nodeData.total_memory,
                                    value: nodeData.used_memory_perc || undefined,
                                    title: nodeData.used_memory_perc === undefined ?
                                           $translate.instant("common.not_applicable") :
                                           Math.round(nodeData.used_memory_perc) + '%'
                                });
                                storageData.push({
                                    host: nodeName,
                                    hostData: nodeData,
                                    total: nodeData.total_storage,
                                    value: nodeData.used_storage_perc || undefined,
                                    title: nodeData.used_storage_perc === undefined ?
                                           $translate.instant("common.not_applicable") :
                                           Math.round(nodeData.used_storage_perc) + '%'
                                });
                            }
                            cpuMap.data = cpuData;
                            $scope.cluster_util_cpu_maps.push(cpuMap);
                            memoryMap.data = memoryData;
                            $scope.cluster_util_memory_maps.push(memoryMap);
                            storageMap.data = storageData;
                            $scope.cluster_util_storage_maps.push(storageMap);
                        }
                        $scope.loadingUtilizationData = false;

                        // Adding host data to the health map (for drill down purposes), so we'll
                        // need the get alarm call to finish so we have some data in cluster_health_maps
                        // to add to. So check to see if the host data was added or not first, only
                        // need to do this once
                        if (angular.isUndefined($scope.addedHostDataToHealthMaps) &&
                            $scope.cluster_health_maps.length > 0) {
                            addHostDataToHealthMaps();
                        }
                    }
                });
            }

            function addHostDataToHealthMaps() {
                $scope.cluster_health_maps.forEach(function(group) {
                    for (var i=0; i<$scope.hostDataList.length; i++) {
                        if ($scope.hostDataList[i].control_plane === group.control_plane &&
                            $scope.hostDataList[i].cluster === group.cluster) {
                            for (var j=0; j<group.data.length; j++) {
                                for (var node in $scope.hostDataList[i].nodes) {
                                    if (node === group.data[j].name) {
                                        group.data[j].hostData = $scope.hostDataList[i].nodes[node];
                                    }
                                }
                            }
                        }
                    }
                    group.data.sort(function(a,b) {
                      return a.name > b.name ? 1 : -1;
                    });
                });

                $scope.addedHostDataToHealthMaps = true;
                $scope.loadingAlarmData = false;
            }

            populateInventoryData();

            $scope.cardDrill = function(index) {
                var filter = '';
                if (index === $scope.inventory_cards.length - 1) {
                    // for donut card
                    filter = "?tabname=explorer&filterField0=dimension&filterValue0=control_plane%3D" +
                        $scope.allControlPlanes.join('|') + '&filterField1=dimension&filterValue1=cluster%3D' +
                        $scope.allClusters.join('|');
                    window.location.hash = "#/alarm/alarm_explorer" + filter;
                } else {
                    var alarmState = translateAlarmState();
                    // no filter on clusters for the total card, only for cluster cards
                    if (index !== 0) {
                        filter = "?filterField0=control_plane&filterValue0=" + $scope.inventory_cards[index].control_plane +
                            "&filterField1=cluster&filterValue1=" + $scope.inventory_cards[index].cluster;
                        if (alarmState !== 'undefined') {
                            filter += "&filterField2=alarm_state&filterValue2=" + alarmState;
                        }
                    } else {
                        if (alarmState !== 'undefined') {
                            filter = "?filterField0=alarm_state&filterValue0=" + alarmState;
                        }
                    }
                    window.location.hash = "#/compute/compute_nodes" + filter;
                }
            };

            function translateAlarmState() {
                switch($scope.metricCardSelectedColor) {
                    case 'gray': return 'UNKNOWN';
                    case 'green': return 'OK';
                    case 'yellow': return 'WARNING';
                    case 'red': return 'CRITICAL';
                    default: return 'undefined';
                }
            }

            $scope.heatmapDrill = function(data) {
                $scope.showHeatmapDrillDown = true;
                $scope.heatmapDrillDownData = data.hostData;
            };

            $scope.refreshSummaryPage = function() {
                log('debug', 'Will refresh compute inventory page after updating compute host');
                populateInventoryData();
            };
        }
    ]);
})(angular);
