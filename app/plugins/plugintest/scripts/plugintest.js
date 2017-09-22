// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
  'use strict';

  var p = ng.module('plugins');

  p.factory('plugintest', ['pluginBase', function() {
    return [
      {
        type: 'menu',
        slug: 'example2',
        label: 'example.menu',
        icon: 'Document_general',
        order:99,
        children: [
          {
            type: 'controller',
            controllerName: 'PlugintestController',
            path: '/',
            template: 'plugintest.html',
            label: 'plugintest.home',
            order: 10
          }
        ]
      }
    ];
  }]);
})(angular);
