// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
  'use strict';

  var p = ng.module('plugins');

  p.factory('networking', ['pluginBase', function() {
    return [
      {
        slug: 'networking',
        envs: ['stdcfg'],
        needBllPlugins: ['monitor', 'sys_sum', 'user_group'],
        type: 'menu',
        label: 'networking.main_menu',
        icon: 'Networking',
        order:4,
        children: [
          {
            type: 'controller',
            envs: ['stdcfg'],
            needBllPlugins: ['monitor'],
            controllerName: "NetworkingSummaryPageController",
            path: '/networking_summary',
            template: 'networking_summary.html',
            order: 0,
            label: 'networking.alarm_summary.menu'
          }
        ]
      },
    ];
  }]);
})(angular);
