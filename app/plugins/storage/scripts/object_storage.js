// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';
    var p = ng.module('plugins');
    p.controller('ObjectStoragePageController', ['$scope', '$translate', '$rootScope',
        function ($scope, $translate, $rootScope) {
            $scope.objectStoragePages = [
                {
                    header: 'storage.object_storage.performance_summary.title',
                    template: 'storage/templates/objectstorage/object_storage_performance_summary.html',
                    tabname: 'performancesummary'
                },
                {
                    header: 'storage.object_storage.inventory_summary.title',
                    template: 'storage/templates/objectstorage/object_storage_inventory_summary.html',
                    tabname: 'inventorysummary'
                },
                {
                    header: 'common.alarmsummary.title',
                    template: 'storage/templates/alarmsummary/object_storage_alarm_summary.html',
                    tabname: 'alarmsummary'
                }
            ];
            // Add items that requires monasca-transform when it is present
            $rootScope.$watch('available_bllplugins', function() {
                if($rootScope.appConfig.dev_mode ||
                  (Array.isArray($rootScope.available_bllplugins) &&
                    $rootScope.available_bllplugins.indexOf('monasca-transform') !== -1)) {

                    $scope.objectStoragePages.splice($scope.objectStoragePages.length - 1, 0,                 {
                        header: 'storage.object_storage.capacity_summary.title',
                        template: 'storage/templates/objectstorage/object_storage_capacity_summary.html',
                        tabname: 'capacitysummary'
                    });
                }
            }, true);
        }
    ]);
})(angular);
