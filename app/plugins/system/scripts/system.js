// (c) Copyright 2017 Hewlett Packard Enterprise Development LP
(function (ng) {
    'use strict';

    var p = ng.module('plugins');

    p.factory('system', ['pluginBase', function() {
        return [
            {
                type: 'menu',
                envs: ['stdcfg'],
                needBllPlugins: [
                    'ace', 'attis', 'cinder', 'ardana', 'monitor', 'sirius',
                    'user_group','vcenters'
                ],
                slug: 'system',
                label: 'system.home',
                icon: 'System',
                order: 9,
                children: [
                    {
                        type: 'controller',
                        envs: ['stdcfg'],
                        needBllPlugins: ['monitor'],
                        controllerName: "AppliancesListController",
                        path: '/appliance_list',
                        template: 'appliance_list/appliance_list.html',
                        label: 'system.applianceslistlabel',
                        order: 1
                    }
                ]
            }
        ];
    }]);
})(angular);
