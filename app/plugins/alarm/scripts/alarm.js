// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
  'use strict';

  var p = ng.module('plugins');

  p.factory('alarm', ['pluginBase', function() {
    return [
     {
       slug: 'general',
       type: 'menu',
       label: 'general.home',
       envs: ['stdcfg'],
       needBllPlugins: ['monitor', 'preferences'],
       icon: 'Home',
       order:1,
       children: [
         {
           type: 'controller',
           envs: ['stdcfg'],
           needBllPlugins: ['monitor'],
           controllerName: "AlarmPageController",
           path: '/alarm_explorer',
           template: 'alarms.html',
           order: 3,
           label: 'alarm_explorer.title'
         },
         {
           type: 'controller',
           envs: ['stdcfg'],
           needBllPlugins: ['monitor', 'preferences'],
           controllerName: "MonitoringDashboardController",
           path: '/dashboard',
           template: 'dashboard/main.html',
           order: 2,
           label: 'monitoring_dashboard.title'
         }
       ]
     }
    ];
  }]);
})(angular);
