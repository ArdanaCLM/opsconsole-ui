(function (ng) {
    'use strict';
    var p = ng.module('plugins');
    p.controller('BlockStoragePageController', ['$scope',
        function ($scope) {
            $scope.blockStoragePages = [
                {header: 'common.alarmsummary.title', template: 'storage/templates/alarmsummary/storage_alarm_summary.html', tabname:'alarmsummary'}
            ];
        }
    ]);
})(angular);
