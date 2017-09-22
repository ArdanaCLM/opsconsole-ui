// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(ng){
  'use strict';

  var plugins = ng.module('plugins');

  plugins.constant('compute.VM_CPU_UTIL', 'vm.cpu.utilization_perc');
  plugins.constant('compute.VM_MEM_UTIL', 'vm.mem.free_perc');

  plugins.directive('computeInstanceDetail', ['bllApiRequest', '$translate', 'addNotification',
    '$rootScope', '$window', 'compute.VM_CPU_UTIL', 'compute.VM_MEM_UTIL',
    function(bllApiRequest, $translate, addNotification, $rootScope, $window, VM_CPU_UTIL, VM_MEM_UTIL) {
      return {
        restrict: 'E',
        scope: {
          data: '='
        },
        templateUrl: 'compute/templates/compute_instance_detail.html',
        link: function($scope, element) {
          function getInstanceMetrics() {
            if($scope.data) {
              var req_instances_metrics = {
                "operation" : "get_instance_metrics",
                "instances" : [$scope.data.id],
                "metrics": [VM_CPU_UTIL, VM_MEM_UTIL]
              };

              bllApiRequest.get("monitor", req_instances_metrics).then(function (data)  {
                angular.forEach(req_instances_metrics.instances, function(instance_id, key){
                  var instMetrics = data.data[instance_id];
                  var cpu = instMetrics[VM_CPU_UTIL] ? instMetrics[VM_CPU_UTIL] : undefined;
                  var memory = instMetrics[VM_MEM_UTIL] ? (100.0 - instMetrics[VM_MEM_UTIL]) : undefined;
                  if(!$scope.data.usage_chart_cpu) {
                    $scope.data.usage_chart_cpu = {
                      data: {}
                    };
                  }
                  if(!$scope.data.usage_chart_memory) {
                    $scope.data.usage_chart_memory = {
                      data: {}
                    };
                  }

                  if(angular.isDefined(cpu)) {
                    $scope.data.usage_chart_cpu.data = {'count': cpu};
                  }
                  else {
                    $scope.data.usage_chart_cpu.data = undefined; //show no data
                  }

                  if(angular.isDefined(memory)) {
                    $scope.data.usage_chart_memory.data = {'count': memory};
                  }
                  else {
                    $scope.data.usage_chart_memory.data = undefined;//show no data
                  }
                });
              }, function (error) {
                addNotification("error",
                  $translate.instant("compute.compute_nodes.messages.compute_details.error", {
                    error: error.data[0].data
                  }));
              });
            }
          }
          $scope.$watch('data', getInstanceMetrics, true);

          $scope.showHostTable = function(host) {
              var drillPath = '#/compute/compute_nodes?filterField0=service_host&filterValue0=' + host;
              $window.open(drillPath, "_self");
          };
        }
      };
    }
  ]);
})(angular);
