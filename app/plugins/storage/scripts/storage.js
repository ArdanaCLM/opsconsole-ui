// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
  'use strict';

  var p = ng.module('plugins');

  p.factory('storage', ['pluginBase', function() {
    return [
      {
        slug: 'storage',
        envs: ['stdcfg'],
        needBllPlugins: ['monitor', 'block_device', 'objectstorage_summary'],
        type: 'menu',
        label: 'storage.menu',
        icon: 'Storage',
        order:3,
        children: [
          {
            type: 'controller',
            envs: ['stdcfg'],
            needBllPlugins: ['monitor'],
            controllerName: "BlockStoragePageController",
            path: '/block_storage_summary',
            template: 'block_storage_summary.html',
            order: 1,
            label: 'storage.alarm_summary.menu'
          },
          {
            type: 'controller',
            envs: ['stdcfg'],
            needBllPlugins: ['monitor', 'objectstorage_summary'],
            controllerName: "ObjectStoragePageController",
            path: '/object_storage_summary',
            template: 'object_storage.html',
            order: 2,
            label: 'storage.object_storage.menu'
           }
        ]
      },
    ];
  }]);
})(angular);
