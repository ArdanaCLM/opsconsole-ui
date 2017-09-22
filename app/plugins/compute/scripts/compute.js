// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
  'use strict';

  var p = ng.module('plugins');

  p.factory('compute', ['pluginBase', function() {
    return [
      {
        slug: 'compute',
        envs: ['stdcfg'],
        needBllPlugins: ['compute','nova', 'monitor', 'ace', 'ironic', 'baremetal'],
        type: 'menu',
        label: 'compute.main_menu',
        icon: 'Chip',
        order:2,
        children: [
          {
            type: 'controller',
            envs: ['stdcfg'],
            needBllPlugins: ['monitor'],
            controllerName: "ComputeSummaryPageController",
            path: '/compute_alarm_summary',
            template: 'compute_summary_container.html',
            order: 1,
            label: 'compute.compute_alarm_summary.menu'
          },
          {
            type: 'controller',
            envs: ['stdcfg'],
            needBllPlugins: ['compute'],
            controllerName: "ComputeNodesArdanaController",
            path: '/compute_nodes',
            template: 'compute_nodes.html',
            order: 2,
            label: 'compute.compute_nodes.menu'
          },
          {
            type: 'controller',
            envs: ['stdcfg'],
            needBllPlugins: ['nova', 'monitor'],
            controllerName: "ComputeInstancesController",
            path: '/compute_instances',
            template: 'computeinstances/compute_instances.html',
            order: 3,
            label: 'compute.compute_instances.menu'
          },
          {
            type: 'controller',
            envs: ['stdcfg'],
            needBllPlugins: ['nova', 'monitor', 'ironic'],
            controllerName: "ComputeBaremetalInstancesController",
            path: '/baremetal_instances',
            template: 'baremetalinstances/compute_baremetal_instances.html',
            order: 4,
            label: 'compute.baremetal.instance.menu'
          }
        ]
      }
    ];
  }]);
})(angular);
