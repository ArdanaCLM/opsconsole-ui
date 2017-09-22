(function (ng) {
    'use strict';
    var p = ng.module('plugins');
    p.controller('NetworkingSummaryPageController', ['$scope',
        function ($scope) {
            $scope.networkingSummaryPages = [
                {header: 'common.alarmsummary.title', template: 'networking/templates/alarmsummary/networking_alarm_summary.html', tabname:'alarmsummary'}
            ];
        }
    ]);
})(angular);
