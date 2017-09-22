// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';
    var p = ng.module('plugins');
    p.controller('ComputeSummaryPageController', ['$scope', '$rootScope',
        function ($scope,$rootScope) {
            if($rootScope.appConfig.env === 'stdcfg') {
                $scope.computeSummaryPages = [
                    {header: 'common.inventory_summary', template: 'compute/templates/inventorysummary/compute_inventory_summary.html', tabname:'inventorysummary'},
                    {header: 'common.alarmsummary.title', template: 'compute/templates/alarmsummary/compute_alarm_summary.html', tabname:'alarmsummary'}
                ];
                // Add items that requires monasca-transform when it is present
                $rootScope.$watch('available_bllplugins', function() {
                  if($rootScope.appConfig.dev_mode ||
                    (Array.isArray($rootScope.available_bllplugins) &&
                    $rootScope.available_bllplugins.indexOf('monasca-transform') !== -1)) {

                    $scope.computeSummaryPages.splice($scope.computeSummaryPages.length - 1, 0, {header: 'storage.object_storage.capacity_summary.title', template: 'compute/templates/capacitysummary/compute_capacity_summary.html', tabname:'capacitysummary'});
                  }
                }, true);
            }
            else {
                $scope.computeSummaryPages = [
                    {header: 'compute.compute_summary.menu', template: 'compute/templates/compute_summary.html', tabname:'summary'},
                    {header: 'common.alarmsummary.title', template: 'compute/templates/alarmsummary/compute_alarm_summary.html', tabname:'alarmsummary'}
                ];
            }

        }
    ]);
})(angular);
