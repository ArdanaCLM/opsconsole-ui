// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(ng) {
    'use strict';
    var p = ng.module('plugins');

    p.factory('alarmDefinition.getDimensionString', [function() {
        return function (dimensions) {
            var dimensionString = '';

            for (var i=0; i<dimensions.length; i++) {
                if (i === 0) {
                    dimensionString += '{';
                } else {
                    dimensionString += ',';
                }
                dimensionString = dimensionString.concat(dimensions[i].key + '=' + dimensions[i].value);
            }
            if (dimensions.length >= 1) {
                dimensionString += '}';
            }
            return dimensionString;
        };
    }]);

    p.factory('alarmDefinition.getExpression', [
      'alarmDefinition.getDimensionString',
      function (getDimensionString) {
        return function(definition) {
            var exp = '';
            if (definition && definition.metric) {
                if (!angular.isUndefined(definition.mathFunction)) {
                    exp = definition.mathFunction + '(' + definition.metric;
                } else {
                    exp = definition.metric;
                }
                if (definition.dimension.length > 0) {
                    exp = exp.concat(getDimensionString(definition.dimension));
                }
                if (!angular.isUndefined(definition.mathFunction)) {
                    exp = exp.concat(')');
                }
                exp = exp.concat(' ' + definition.operator + ' ' + definition.value);
            }
            return exp;
        };
    }]);

    p.factory('alarmDefinition.buildNotification', [function() {
        return function (notificationList, type) {
            type = '$' + type;
            return notificationList.filter(function(notification) {
                return notification[type];
            }).map(function(notification) {
                return notification.key;
            });
        };
    }]);

    p.factory('alarmDefinition.getNotificationsList', [
      '$q', 'bllApiRequest',
      function($q, bllApiRequest) {
        return function (){
            var deffered = $q.defer();
            bllApiRequest.get('monitor', {operation: 'notification_list'}).then(
                function(res) {
                    var notificationList = res.data ? res.data.map(function(datum) {
                        return {
                            key: datum.id,
                            label: datum.name,
                            type: datum.type,
                            '$ok': false,
                            '$alarm': false,
                            '$undetermined': false
                        };
                    }) : [];
                    deffered.resolve(notificationList);
                },
                function(error_data) {
                    deffered.reject (error_data);
                }
            );
            return deffered.promise;
        };
    }]);

    p.factory('alarmDefinition.getAlarmDefinitionsData', [
      '$q', 'bllApiRequest',
      function($q, bllApiRequest) {
        return function (){
            var deffered = $q.defer();
            bllApiRequest.get('monitor', {operation: 'alarm_definition_list'}).then(
                function(res) {
                    deffered.resolve(res.data);
                },
                function(error_data) {
                    deffered.reject(error_data);
                }
            );
            return deffered.promise;
        };
    }]);

    p.controller('AlarmDefinitionCreationController', [
      '$scope', '$translate', 'bllApiRequest', 'addNotification',
      'alarmDefinition.getExpression', 'alarmDefinition.buildNotification',
      'loadDimensions', 'generateDimensionsForSelection',
      'dimensionCanSelect', 'arrayContainsKey', 'arrayContainsString', 'arrayContains',
      'generateMatchByFromDimensions', 'watchDimensionSelection',
      function($scope, $translate, bllApiRequest, addNotification,
        getExpression, buildNotification, loadDimensions, generateDimensionsForSelection,
        dimensionCanSelect, arrayContainsKey, arrayContainsString, arrayContains,
        generateMatchByFromDimensions, watchDimensionSelection) {

        $scope.disableCreateButtonFlag = true;

        $scope.dimensionCanSelect = dimensionCanSelect;

        $scope.severityList = [
            {value: 'CRITICAL', label: 'alarm_definitions.edit.modal.severity.critical'},
            {value: 'HIGH',     label: 'alarm_definitions.edit.modal.severity.high'},
            {value: 'MEDIUM',   label: 'alarm_definitions.edit.modal.severity.medium'},
            {value: 'LOW',      label: 'alarm_definitions.edit.modal.severity.low'}
        ];
        $scope.functionList = [
            {value: 'MIN',   label: 'MIN'},
            {value: 'MAX',   label: 'MAX'},
            {value: 'SUM',   label: 'SUM'},
            {value: 'COUNT', label: 'COUNT'},
            {value: 'AVG',   label: 'AVG'},
            {value: 'LAST',   label: 'LAST'}
        ];
        $scope.operatorList = [
            {value: '<',  label: 'alarm_definitions.edit.modal.operator.lt'},
            {value: '<=', label: 'alarm_definitions.edit.modal.operator.lte'},
            {value: '>=', label: 'alarm_definitions.edit.modal.operator.gte'},
            {value: '>',  label: 'alarm_definitions.edit.modal.operator.gt'}
        ];

        $scope.conditionTypes = [
          {key: "OR", value: 'ANY'},
          {key: "AND", value: 'ALL'},
          {key: "NAND", value: 'NONE'}
        ];

        $scope.conditionCombindTypes = [
          {key: "AND", value: 'AND'},
          {key: "OR", value: 'OR'}
        ];

        $scope.notificationsTabs = [
          {header: 'alarm_definitions.edit.notifications.alarm', template: 'alarm/templates/alarm_definitions/edit_alarm_notifications_alarm.html'},
          {header: 'alarm_definitions.edit.notifications.undetermined', template: 'alarm/templates/alarm_definitions/edit_alarm_notifications_undetermined.html'},
          {header: 'alarm_definitions.edit.notifications.ok', template: 'alarm/templates/alarm_definitions/edit_alarm_notifications_ok.html'}
        ];

        $scope.$parent.showDefinitionCreate = function() {
            initModalData();
            $scope.showCreateModalFlag = true;
            $scope.alarmDefinitionErrorFlag = false;
        };

        $scope.$parent.hideDefinitionCreate = function() {
            $scope.showCreateModalFlag = false;
            $scope.alarmDefinitionErrorFlag = false;
            $scope.$parent.modalEditing = false;
        };

        function initModalData() {
            $scope.definition = $scope.$parent.modalEditing ? $scope.$parent.definition : {
                name: '',
                description: '',
                severity: 'MEDIUM',
                notifications: [],
                mathFunction: 'MIN',
                metric: undefined,
                dimension: [],
                matchBy: [],
                operator: '<',
                value: ''
            };
            $scope.currentMetric = undefined;
            $scope.currentDimensions = undefined;
            $scope.$broadcast('ocInputReset');
            if(!$scope.$parent.modalEditing) {
                $scope.$parent.notificationList.forEach(function(notification) {
                    notification.$ok = notification.$alarm = notification.$undetermined = false;
                });
            }
        }

        $scope.$watch('definition.metric', function() {
            // don't need to do this in edit mode since you can't change dimension and match by
            if (!$scope.modalEditing) {
                $scope.currentMetric = $scope.definition ? $scope.definition.metric : undefined;
                if($scope.currentMetric) {
                    $scope.loadingDimensions = true;
                    $scope.definition.dimension = [];
                    $scope.definition.matchBy = [];
                    loadDimensions($scope.currentMetric).then(function(res) {
                        $scope.currentDimensions = generateDimensionsForSelection(res.dimensions);
                        $scope.currentAllMetrics = res.allMetrics;
                        $scope.loadingDimensions = false;
                        $scope.selectedCurrentDimensions = $scope.currentDimensions.map(function() {return false;});
                    });
                }
            }
        });

        $scope.refreshMatchBy = function(){
          $scope.matchByDimensions = generateMatchByFromDimensions($scope.currentDimensions, angular.copy($scope.matchByDimensions));
        };

        $scope.$watchCollection('currentDimensions', function(){
            $scope.refreshMatchBy();
        }, true);

        $scope.$parent.$watch('definition.dimension', function() {
            if($scope.currentDimensions) {
                $scope.currentDimensions.forEach(function(dimension) {
                    dimension.$rowSelected = arrayContains($scope.definition.dimension, dimension);
                });
            }
        }, true);

        $scope.$watch('selectedCurrentDimensions', watchDimensionSelection($scope), true);

        $scope.selectMetric = function(metric) {
            $scope.definition.metric = metric;
            $scope.createAlarmDefinition.closeModal();
        };

        $scope.selectDimension = function() {
            $scope.definition.dimension = [];
            $scope.currentDimensions.forEach(function(dimension) {
                if(dimension.$rowSelected) {
                    $scope.definition.dimension.push(dimension);
                }

            });

            $scope.refreshMatchBy();
            $scope.selectMatchBy(false);
            $scope.createAlarmDefinition.closeModal();
        };

        $scope.selectMatchBy = function(closeModal){
            $scope.definition.matchBy = [];
            $scope.matchByDimensions.forEach(function(matchBy){
                if(matchBy.$matchBy) {
                    $scope.definition.matchBy.push(matchBy.key);
                }
            });

            if(closeModal || angular.isUndefined(closeModal)) {
                $scope.createAlarmDefinition.closeModal();
            }
        };

        $scope.$on('removedMatchByElement', function($event, removedElements){
            var i = 0, j = 0;
            for(i = 0; i < removedElements.length; i++){
                for(j = 0; j < $scope.matchByDimensions.length; j++){
                    if($scope.matchByDimensions[j].key === removedElements[i]){
                        $scope.matchByDimensions[j].$matchBy = false;
                    }
                }
            }

            $scope.selectMatchBy(false);
        });

        $scope.$on('removedDimensionElement', function($event, removedElements){
            var i = 0, j = 0;
            for(i = 0; i < removedElements.length; i++){
                for(j = 0; j < $scope.currentDimensions.length; j++){
                    if($scope.currentDimensions[j].key === removedElements[i].key){
                        $scope.currentDimensions[j].$rowSelected = false;
                    }
                }
            }

            $scope.refreshMatchBy();
            $scope.selectMatchBy(false);
        });

        $scope.$watch('definition', function() {
            $scope.disableCreateButtonFlag = !$scope.definition ||
                                             !$scope.definition.name ||
                                             !$scope.definition.value ||
                                             !$scope.definition.metric;
        }, true);

        $scope.submitAlarmDefinition = function() {
            var newAlarmDefinition = {
                operation: 'alarm_definition_create',
                name: $scope.definition.name,
                description: $scope.definition.description,
                expression: $scope.definition.expression ? $scope.definition.expression : getExpression($scope.definition),
                match_by: $scope.definition.matchBy,
                severity: $scope.definition.severity,
                alarm_actions: buildNotification($scope.$parent.notificationList, 'alarm'),
                ok_actions: buildNotification($scope.$parent.notificationList, 'ok'),
                undetermined_actions: buildNotification($scope.$parent.notificationList, 'undetermined')
            };
            bllApiRequest.post('monitor', newAlarmDefinition).then(
                function(data) {
                    addNotification('info', $translate.instant('alarm_definitions.create.success',
                                    {name: $scope.definition.name}));
                    $scope.$emit('alarmDefinitionsNeedsReload');
                    $scope.showCreateModalFlag = false;
                },
                function(error) {
                    $scope.alarmDefinitionErrorFlag = true;
                    var msg = error.data[0].data;
                    if (error.statusCode < 500) {
                        $scope.errorMessage = $translate.instant('alarm_definitions.create.error.banner.400',
                                              {details: msg});
                    } else {
                        $scope.errorMessage = $translate.instant('alarm_definitions.create.error.banner.500',
                                              {details: msg});
                        addNotification('error', $translate.instant('alarm_definitions.create.error', {details: msg}));
                    }
                }
            );
        };
      }
    ]);
})(angular);
