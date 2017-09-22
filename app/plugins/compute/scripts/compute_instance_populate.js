// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(ng){
  'use strict';
  var plugins = ng.module('plugins');
  plugins.factory('getAllInstancesStatuses', ['$translate', 'bllApiRequest', 'addNotification', function ($translate, bllApiRequest, addNotification) {
    return function(compute_instances_data) {
      var req_instances_status = {
        "operation" : "get_all_instances_status",
        "api_version": "v1"
      };
      bllApiRequest.get("monitor", req_instances_status).then(function (res)  {
        var i = 0;
        //the "get_all_instances_status" only returns active values, and will no value at all
        //for instances not monitored, need to set the default value of the host_alive_status
        //to cover instances that are not part of the BLL response
        for(i = 0; i < compute_instances_data.length; i++){
          compute_instances_data[i].host_alive_status = -1;//default to -1, 'No Status'
        }

        if (angular.isDefined(res.data)) {
          var ids = compute_instances_data.map(function (e) {
            return e.id;
          });
          angular.forEach(res.data, function(value , key){
            var index = ids.indexOf(key);
            if(index >= 0) {
              compute_instances_data[index].host_alive_status =
                angular.isDefined(value['vm.host_alive_status']) ?  value['vm.host_alive_status'] : -1 ;
              compute_instances_data[index].host_alive_status_value_meta_detail = value.host_alive_status_value_meta_detail;
              compute_instances_data[index].ping_status = value['vm.ping_status'];
            }
          });
        }
      }, function (error) {
        addNotification("error",
          $translate.instant("compute.compute_nodes.messages.compute_details.error", {
            error: error.data[0].data
          }));
      });
    };
  }]);

  plugins.factory('populateIntances', ['$translate', '$moment', 'getAllInstancesStatuses',
    function($translate, $moment, getAllInstancesStatuses) {
      function flattenIps(data){
        var flattenedIp = [];
        if(data && angular.isObject(data)) {
          for(var property in data) {
            for( var info in data[property]) {
              flattenedIp.push(property + ': ' + data[property][info].addr + '(' + data[property][info]['OS-EXT-IPS:type'] + ')');
            }
          }
        }
        return flattenedIp;
      }
      function convertMeta(data){
        var metaList = [];
        for (var key in data) {
          if (data.hasOwnProperty(key)) {
            metaList.push(key + ': ' + data[key]);
          }
        }
        return metaList;
      }
      return function(instances) {
        var return_instances = instances.map(function(instance) {
          var ips = flattenIps(instance.addresses);
          var meta = convertMeta(instance.metadata);
          var moment = $moment(instance.created);
          var vcpu;
          var memRam;

          instance.ip_addresses = ips;
          instance.time =  moment.format('L') + ' ' + moment.format('LTS');
          instance.meta = meta;
          if(instance.cpu) {
            vcpu = instance.cpu.vcpus;
          }
          instance.usage_chart_cpu = {
            'max': 100,
            'label': $translate.instant(
              'compute.compute_instances.count.cpu',
              {cpu: vcpu}
            ),
            'title': $translate.instant('compute.main_menu')
          };
          if(instance.memory) {
              memRam = parseFloat(instance.memory.ram / 1024).toFixed(2);
          }
          instance.usage_chart_memory = {
            'max': 100,
            'label': $translate.instant(
              'compute.compute_instances.count.mem',
              {mem: memRam}
            ),
            'title': $translate.instant('compute.compute_instances.table.header.memory')
          };
          return instance;
        });
        getAllInstancesStatuses(return_instances);
        return return_instances;
      };
    }
  ]);
})(angular);
