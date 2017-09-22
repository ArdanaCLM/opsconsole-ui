// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC

/*
This controller relies on the following metrics:
cpu.total_logical_cores_agg
cpu.utilized_logical_cores_agg
mem.total_mb_agg
mem.usable_mb_agg
disk.total_space_mb_agg
disk.total_used_space_mb_agg
nova.vm.cpu.total_allocated_agg
nova.vm.mem.total_allocated_mb_agg
nova.vm.disk.total_allocated_gb_agg
mem.total_used_space_mb_agg
vcpus_agg
vm.mem.total_mb_agg
vm.mem.used_mb_agg
vm.disk.allocation_agg
cpu.total_logical_cores_agg
*/
(function(ng) {
    'use strict';

    var p = ng.module('plugins');
    p.controller('ComputeCapacitySummaryController', [
        '$scope', '$translate', 'bllApiRequest', '$location', '$q', 'round', 'addNotification', 'populateIntances',
        'compute.VM_CPU_UTIL', 'compute.VM_MEM_UTIL', 'commonChartLegendButtons', 'styleutils',
        function($scope, $translate, bllApiRequest, $location, $q, round, addNotification, populateIntances,
        VM_CPU_UTIL, VM_MEM_UTIL, commonChartLegendButtons, styleutils) {
            $scope.capacityCards = [{
                config: {
                    type: 'metric',
                    subType: 'computeCapacityCard',
                    total: 'cpu.total_logical_cores_agg',
                    fraction: 'cpu.utilized_logical_cores_agg',
                    statFunction: 'AVG',
                    dimensions: {
                      host: 'all'
                    }
                },
                title: 'compute_summary.capacity.pysical_cpu',
                physical: true,
                units: 'Cores',
                measurements: true,
            }, {
                config: {
                    type: 'metric',
                    subType: 'computeCapacityCard',
                    total: 'mem.total_mb_agg',
                    fraction: 'mem.usable_mb_agg',
                    unitConversion: 1e6,
                    inverseFraction: true,
                    statFunction: 'AVG',
                    dimensions: {
                      host: 'all'
                    }
                },
                title: "compute_summary.capacity.pysical_memory",
                physical: true,
                dynamicBytes: true,
                measurements: true,
            }, {
                config: {
                    type: 'metric',
                    subType: 'computeCapacityCard',
                    total: 'disk.total_space_mb_agg',
                    fraction: 'disk.total_used_space_mb_agg',
                    unitConversion: 1e6,
                    statFunction: 'AVG',
                    dimensions: {
                      host: 'all'
                    }
                },
                title: "compute_summary.capacity.pysical_disk",
                physical: true,
                dynamicBytes: true,
                measurements: true,
            }, {
                config: {
                  type: 'metric',
                  subType: 'computeCapacityCard',
                  total: 'cpu.total_logical_cores_agg',
                  fraction: 'nova.vm.cpu.total_allocated_agg',
                  statFunction: 'AVG',
                  dimensions: {
                    host: 'all'
                  }
                },
                title: "compute_summary.capacity.virtual_cpu",
                physical: false,
                units: 'Cores',
                measurements: true,
            }, {
                config: {
                  type: 'metric',
                  subType: 'computeCapacityCard',
                  total: 'mem.total_mb_agg',
                  fraction: 'nova.vm.mem.total_allocated_mb_agg',
                  unitConversion: 1e6,
                  statFunction: 'AVG',
                  dimensions: {
                    host: 'all'
                  }
                },
                title: "compute_summary.capacity.virtual_memory",
                physical: false,
                dynamicBytes: true,
                measurements: true,
            }, {
                config: {
                  type: 'metric',
                  subType: 'computeCapacityCard',
                  total: 'disk.total_space_mb_agg',
                  fraction: 'nova.vm.disk.total_allocated_gb_agg',
                  totalUnitConversion: 1e6,
                  fractionUnitConversion: 1e9,
                  statFunction: 'AVG',
                  dimensions: {
                    host: 'all'
                  }
                },
                title: "compute_summary.capacity.virtual_disk",
                physical: false,
                dynamicBytes: true,
                measurements: true,
            }];

            $scope.graphTabs = [
                {header: 'common.cpu', template: 'compute/templates/capacitysummary/compute_capacity_cpu.html', tabname:'capacitysummary.cpu'},
                {header: 'common.memory', template: 'compute/templates/capacitysummary/compute_capacity_memory.html', tabname:'capacitysummary.memory'},
                {header: 'common.disk', template: 'compute/templates/capacitysummary/compute_capacity_disk.html', tabname:'capacitysummary.disk'}
            ];

            var legendButtons = commonChartLegendButtons;

            var colors = styleutils.ocGraphColors();

            $scope.computeCPUCapacityChart = {
              "config": {
                "type": "line",
                "chartType": "line",
                "legendButtonsValue": legendButtons[0].value,
                "legendButtons": legendButtons,
                "yLabel": $translate.instant('compute.hardware.processor_count'),
                "yAxisMin": 0
              },
              "type": "chart",
              "wide": true,
              "interval": 60,
              "range": 24,
              "elements": [{
                "metric": "cpu.total_logical_cores_agg",
                "dimensions": [
                  {
                    key: 'host',
                    value: 'all'
                  }
                ],
                "label": "compute_summary.capacity.capacity",
                "mathFunction": "AVG",
                "color": colors[0]
              }, {
                "metric": "cpu.utilized_logical_cores_agg",
                "dimensions": [
                  {
                    key: 'host',
                    value: 'all'
                  }
                ],
                "label": "compute_summary.capacity.utilization",
                "mathFunction": "AVG",
                "color": colors[1]
              }, {
                "metric": "nova.vm.cpu.total_allocated_agg",
                "dimensions": [
                  {
                    key: 'host',
                    value: 'all'
                  }
                ],
                "label": "compute_summary.capacity.graph_allocated",
                "mathFunction": "AVG",
                "color": colors[2]
              }],
              "data": []
            };

            $scope.computeMemoryCapacityChart = {
              "config": {
                "type": "line",
                "chartType": "line",
                "legendButtonsValue": legendButtons[0].value,
                "legendButtons": legendButtons,
                "yAxisFormat": 'bytes',
                "yAxisMin": 0
              },
              "type": "chart",
              "wide": true,
              "interval": 60,
              "range": 24,
              "elements": [{
                "metric": "mem.total_mb_agg",
                "dimensions": [
                  {
                    key: 'host',
                    value: 'all'
                  }
                ],
                "label": "compute_summary.capacity.capacity",
                "mathFunction": "AVG",
                "color": colors[0],
                "multiplier": 1e6
              }, {
                "metric": "mem.usable_mb_agg",
                "difference": true,
                "differenceElement": 0,
                "calcDifference": function(usable_mb, total_mb) {
                  return total_mb - usable_mb;
                },
                "dimensions": [
                  {
                    key: 'host',
                    value: 'all'
                  }
                ],
                "label": "compute_summary.capacity.utilization",
                "mathFunction": "AVG",
                "color": colors[1],
                "multiplier": 1e6
              }, {
                "metric": "nova.vm.mem.total_allocated_mb_agg",
                "dimensions": [
                  {
                    key: 'host',
                    value: 'all'
                  }
                ],
                "label": "compute_summary.capacity.graph_allocated",
                "mathFunction": "AVG",
                "color": colors[2],
                "multiplier": 1e6
              }],
              "data": []
            };

            $scope.computeDiskCapacityChart = {
              "config": {
                "type": "line",
                "chartType": "line",
                "legendButtonsValue": legendButtons[0].value,
                "legendButtons": legendButtons,
                "yAxisFormat": 'bytes',
                "yAxisMin": 0
              },
              "type": "chart",
              "wide": true,
              "interval": 60,
              "range": 24,
              "elements": [{
                "metric": "disk.total_space_mb_agg",
                "dimensions": [
                  {
                    key: 'host',
                    value: 'all'
                  }
                ],
                "label": "compute_summary.capacity.capacity",
                "mathFunction": "AVG",
                "color": colors[0],
                "multiplier": 1e6
              }, {
                "metric": "disk.total_used_space_mb_agg",
                "dimensions": [
                  {
                    key: 'host',
                    value: 'all'
                  }
                ],
                "label": "compute_summary.capacity.utilization",
                "mathFunction": "AVG",
                "color": colors[1],
                "multiplier": 1e6
              }, {
                "metric": "nova.vm.disk.total_allocated_gb_agg",
                "dimensions": [
                  {
                    key: 'host',
                    value: 'all'
                  }
                ],
                "label": "compute_summary.capacity.graph_allocated",
                "mathFunction": "AVG",
                "color": colors[2],
                "multiplier": 1e9
              }],
              "data": []
            };

            var rangeMap = {
              '1day': 24,
              '7days': 168,
              '30days': 720,
              '45days': 1080
            };

            var charts = [
              'computeCPUCapacityChart',
              'computeDiskCapacityChart',
              'computeMemoryCapacityChart'
            ];
            var projectCharts = [
              'projectComputeCPUCapacityChart',
              'projectComputeDiskCapacityChart',
              'projectComputeMemoryCapacityChart'
            ];

            $scope.projectComputeCPUCapacityChart = angular.copy($scope.computeCPUCapacityChart);
            $scope.projectComputeDiskCapacityChart = angular.copy($scope.computeDiskCapacityChart);
            $scope.projectComputeMemoryCapacityChart = angular.copy($scope.computeMemoryCapacityChart);

            //elements for which we will not have data
            $scope.projectComputeCPUCapacityChart.elements.splice(1,1);
            $scope.projectComputeDiskCapacityChart.elements.splice(1,1);

            projectCharts.forEach(function(chart) {
              $scope[chart].elements.forEach(function(element) {
                element.dimensions.push({
                  key: 'project_id',
                  value: 'all'
                });
              });
            });

            //use some different metrics for the project based graphs
            $scope.projectComputeCPUCapacityChart.elements[1].metric = "vcpus_agg";
            $scope.projectComputeCPUCapacityChart.elements[1].projectBased = true;

            $scope.projectComputeMemoryCapacityChart.elements[2].metric = "vm.mem.total_mb_agg";
            $scope.projectComputeMemoryCapacityChart.elements[2].projectBased = true;
            $scope.projectComputeMemoryCapacityChart.elements[1].metric = "vm.mem.used_mb_agg";
            $scope.projectComputeMemoryCapacityChart.elements[1].projectBased = true;
            $scope.projectComputeMemoryCapacityChart.elements[1].difference = false;

            $scope.projectComputeDiskCapacityChart.elements[1].metric = "vm.disk.allocation_agg";
            delete $scope.projectComputeDiskCapacityChart.elements[1].multiplier;
            $scope.projectComputeDiskCapacityChart.elements[1].projectBased = true;

            charts.concat(projectCharts).forEach(function(config) {
              $scope[config].config.id = config;
            });

            $scope.$on('d3ChartLegendButtonAction', function(config, value, id) {
              $scope[id].range = rangeMap[value];
            });

            $scope.projectCapacityCards = [
              {
                  config: {
                      type: 'metric',
                      subType: 'computeCapacityCard',
                      total: 'vm.mem.total_mb_agg',
                      fraction: 'vm.mem.used_mb_agg',
                      unitConversion: 1e6,
                      fraction_dimensions: {
                        project_id: "all",
                        host: "all"
                      },
                      total_dimensions: {
                        host: "all"
                      },
                      statFunction: 'AVG'
                  },
                  title: "compute_summary.capacity.virtual_memory_utilization",
                  physical: true,
                  virtual: true,
                  dynamicBytes: true,
                  measurements: true,
              }, {
                  config: {
                    type: 'metric',
                    subType: 'computeCapacityCard',
                    total: 'cpu.total_logical_cores_agg',
                    fraction: 'vcpus_agg',
                    fraction_dimensions: {
                      project_id: "all",
                      host: "all"
                    },
                    total_dimensions: {
                      host: "all"
                    },
                    statFunction: 'AVG'
                  },
                  title: "compute_summary.capacity.virtual_cpu",
                  physical: false,
                  units: 'Cores',
                  measurements: true,
              }, {
                  config: {
                    type: 'metric',
                    subType: 'computeCapacityCard',
                    total: 'mem.total_mb_agg',
                    fraction: 'vm.mem.total_mb_agg',
                    unitConversion: 1e6,
                    fraction_dimensions: {
                      project_id: "all",
                      host: "all"
                    },
                    total_dimensions: {
                      host: "all"
                    },
                    statFunction: 'AVG'
                  },
                  title: "compute_summary.capacity.virtual_memory",
                  physical: false,
                  dynamicBytes: true,
                  measurements: true,
              }, {
                  config: {
                    type: 'metric',
                    subType: 'computeCapacityCard',
                    total: 'disk.total_space_mb_agg',
                    fraction: 'vm.disk.allocation_agg',
                    totalUnitConversion: 1e6,
                    total_dimensions: {
                      host: "all"
                    },
                    fraction_dimensions: {
                      project_id: "all",
                      host: "all"
                    },
                    statFunction: 'AVG'
                  },
                  title: "compute_summary.capacity.virtual_disk",
                  physical: false,
                  dynamicBytes: true,
                  measurements: true,
              }
            ];

            $scope.heatMapData = [];
            $scope.loadingHeatMapData = true;
            var getHeatmapData = function() {
              $scope.heatMapData = [];
              $scope.loadingHeatMapData = true;
              var request = {
                operation: "instance-list",
                monasca_metrics: [
                  VM_MEM_UTIL,
                  VM_CPU_UTIL
                ],
                monasca_dimensions: {
                  "resource_id": {
                    "property": "id"
                  },
                  "hostname": {
                    "property": "host"
                  },
                  "zone": {
                    "property": "availability_zone"
                  }
                },
                monasca_data: {
                  start_time: new Date((new Date()).getTime() - (3600000)).toISOString(), //one hour ago
                  operation: 'metric_statistics',
                  statistics: 'MAX',
                  period: 3600
                }
              };
              if(angular.isDefined($scope.currentProject) && $scope.currentProject !== 'all') {
                request.filter = 'project';
                request.project_id = $scope.currentProjectId;
              }
              bllApiRequest.get('nova', request).then(function(res) {
                $scope.memHeatMapData = [];
                $scope.cpuHeatMapData = [];
                if(res.data.instances.length !== 0) {
                  var instances = populateIntances(res.data.instances);
                  instances.forEach(function(instance) {
                    var memItem = {
                      instance: instance,
                      total: instance.memory.ram,
                      value: undefined,
                      title: $translate.instant("common.not_applicable")
                    },
                    cpuItem = {
                      instance: instance,
                      total: instance.cpu.vcpus,
                      value: undefined,
                      title: $translate.instant("common.not_applicable")
                    };
                    if(instance.metrics[VM_MEM_UTIL].length !== 0) {
                      var percent_free = instance.metrics[VM_MEM_UTIL][0].statistics[0][1],
                          utilized = round(100 - percent_free);
                      memItem = {
                        instance: instance,
                        total: instance.memory.ram,
                        value: utilized,
                        title: utilized + '%'
                      };
                    }
                    if(instance.metrics[VM_CPU_UTIL].length !== 0) {
                      var cpu_utilization = instance.metrics[VM_CPU_UTIL][0].statistics[0][1];
                      cpu_utilization = round(cpu_utilization);
                      cpuItem = {
                        instance: instance,
                        total: instance.cpu.vcpus,
                        value: cpu_utilization,
                        title: cpu_utilization + '%'
                      };
                    }
                    $scope.cpuHeatMapData.push(cpuItem);
                    $scope.memHeatMapData.push(memItem);
                  });
                } else {
                  $scope.noHeatMapData = true;
                }
                $scope.loadingHeatMapData = false;
              }, function(res) {
                $scope.loadingHeatMapData = false;
                $scope.noHeatMapData = true;
                var msg = $translate.instant('compute_summary.capacity.heatMapError', {
                  project: $scope.currentProject,
                  data: res.data
                });
                addNotification('error', msg);
              });
            };

            $scope.clickHeatmapElement = function(element) {
              $scope.currentInstance = element.instance;
              $scope.showInstanceDetails = true;
            };

            $scope.currentProjectId = $scope.currentProject = 'all';

            $scope.$watch('currentProjectId', function() {
              $scope.projectCapacityCards.forEach(function(card) {
                if(card.config.dimensions) {
                  card.config.dimensions.project_id = $scope.currentProjectId;
                } else if(card.config.fraction_dimensions) {
                  card.config.fraction_dimensions.project_id = $scope.currentProjectId;
                }
              });
              var dimensions = [
                {
                  key: "project_id",
                  value: $scope.currentProjectId
                },
                {
                  key: "host",
                  value: 'all'
                }
              ];
              projectCharts.forEach(function(config) {
                $scope[config].elements.forEach(function(element) {
                  if(element.projectBased) {
                    element.dimensions = dimensions;
                  }
                });
              });
              getHeatmapData();
            });

            $scope.projectGraphTabs = [
                {header: 'common.cpu', template: 'compute/templates/capacitysummary/project_compute_capacity_cpu.html', tabname:'capacitysummary.cpu'},
                {header: 'common.memory', template: 'compute/templates/capacitysummary/project_compute_capacity_memory.html', tabname:'capacitysummary.memory'},
                {header: 'common.disk', template: 'compute/templates/capacitysummary/project_compute_capacity_disk.html', tabname:'capacitysummary.disk'}
            ];

            $scope.currentProject = 'all';
            $scope.heatMapTabs = [
                {header: 'compute.inventory.utilization.cpu.title', template: 'compute/templates/capacitysummary/compute_capacity_cpu_utilization.html', tabname:'capacitysummary.cpu_utilization'},
                {header: 'compute.inventory.utilization.memory.title', template: 'compute/templates/capacitysummary/compute_capacity_mem_utilization.html', tabname:'capacitysummary.mem_utilization'}
            ];
        }
    ]);
})(angular);
