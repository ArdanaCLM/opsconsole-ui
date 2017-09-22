(function (ng) {
    'use strict';
    var p = ng.module('plugins');
    p.controller('AlarmPageController', ['$scope',
        function ($scope) {
            $scope.alarmPages = [
                {header: 'alarm_explorer.title', template: 'alarm/templates/alarm_explorer/alarm_explorer.html', tabname:'explorer'},
                {header: 'alarm_definitions.title', template: 'alarm/templates/alarm_definitions/alarm_definitions.html', tabname:'definition'},
                {header: 'notification_methods.title', template: 'alarm/templates/notification_methods/notification_methods.html', tabname:'notifications'}
            ];
        }
    ]);
})(angular);
