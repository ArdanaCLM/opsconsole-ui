(function (ng) {
    'use strict';
    var p = ng.module('plugins');
    p.controller('CentralDashboardPageController', ['$scope',
        function ($scope) {
            $scope.centralDashboardPages = [
                {header: 'common.alarmsummary.title', template: 'general/templates/dashboard_summary_alarms.html', tabname:'alarmsummary'}
            ];
        }
    ]);
})(angular);
