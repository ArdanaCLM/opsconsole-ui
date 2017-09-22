// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';
    var p = ng.module('plugins');
    p.controller('NotificationMethodsController', [
        '$scope', 'bllApiRequest', '$http', '$translate','addNotification',
        '$q', 'updateEmptyDataPage', 'ocValidators', 'log',
        function ($scope, bllApiRequest, $http, $translate, addNotification,
                  $q, updateEmptyDataPage, ocValidators, log) {

            $scope.notificationData = [];
            $scope.selectedData = [];
            $scope.notificationDataLoadingFlag = true;
            $scope.showDeleteModalFlag = false;
            $scope.showCreateModalFlag = false;
            $scope.showEditModalFlag = false;
            $scope.showUpdateNotificationProgress = false;
            $scope.showDeleteNotificationProgress = false;
            $scope.updateNotificationData = {};
            $scope.originNotificationData = {};
            $scope.addressPlaceholder = "notification_methods.types.email.placeholder";

            //deal with empty data page
            $scope.showEmptyDataPageFlag = false;
            $scope.emptyDataPage = {};
            $scope.initNotificationDataLoadingFlag = true;

            //Set table headers and paging
            $scope.notificationTableConfig = {
                headers: [{
                    name: 'notification_methods.table.header.name',
                    type: 'string',
                    displayfield: 'name',
                    sortfield: 'name',
                    isNotHtmlSafe: true
                }, {
                    name: 'notification_methods.table.header.type',
                    type: 'string',
                    displayfield: 'type',
                    sortfield: 'type',
                    specialColumnType: 'custom',
                    customDisplayFilter: function(data) {
                        return buildLocalizedType(data.type);
                    },
                }, {
                    name: 'notification_methods.table.header.address',
                    type: 'string',
                    displayfield: 'address',
                    sortfield: 'address'
                }],

                pageConfig: {
                    pageSize: 20
                },

                rowSelectionCheck: function (data) {
                    return true;
                },
                actionMenuConfigFunction: function (data, actionName) {
                    var actionPermissions = {enabled: true, hidden: false};
                    return actionPermissions;
                },
                actionMenuConfig: [{
                    label: 'common.edit',
                    name: 'edit',
                    action: function (data) {
                        showEditNotificationModal(data);
                    }
                }, {
                    label: 'common.delete',
                    name: 'delete',
                    action: function(data) {
                        showDeleteNotificationModal(data);
                    }
                }],

                multiSelectActionMenuConfig: [{
                    label: 'notification_methods.action.multi_delete',
                    name: 'delete',
                    action: function (data) {
                       showDeleteNotificationModal(data);
                    }
                }],

                globalActionsConfig: [{
                    label: 'notification_methods.action.create',
                    name: 'create',
                    action: function () {
                        showCreateNotificationModal();
                    }
                }]
            };

            function getNotificationData() {
                $scope.notificationDataLoadingFlag = true;
                var req_notifications = {
                    'operation':'notification_list'
                };

                $scope.emptyDataOage = {};

                bllApiRequest.get('monitor', req_notifications).then(
                    function(response){
                         //show empty data page for no data
                        if(!angular.isDefined(response) ||
                           !angular.isDefined(response.data) ||
                            response.data.length === 0) {
                            $scope.showEmptyDataPageFlag = true;
                            updateEmptyDataPage(
                                $scope.emptyDataPage,
                                'nodata',
                                $translate.instant("notification_methods.empty.data"),
                                '',
                                'notification_methods.empty.data.action_label',
                                 showCreateNotificationModal
                            );
                        }
                        else {
                            var notificationData = response.data || [];
                            $scope.notificationData = [];
                            notificationData.forEach(function (datum) {
                                var obj = {
                                    'id': datum.id,
                                    'name': datum.name,
                                    'type': datum.type,
                                    'address': datum.address,
                                    'period': datum.period
                                };
                                $scope.notificationData.push(obj);
                            });
                        }
                        $scope.notificationDataLoadingFlag = false;

                        //show the page loading at the very first time
                        if($scope.initNotificationDataLoadingFlag === true) {
                            $scope.initNotificationDataLoadingFlag = false;
                        }
                    },
                    function (error_data) {
                        var errorReason =
                            error_data.data ? error_data.data[0].data : '';
                        var errorMsg =
                            $translate.instant(
                                "notification_methods.table.data.error",
                                {'reason': errorReason}
                            );
                        addNotification('error', errorMsg);

                         //show empty data page for error
                        $scope.showEmptyDataPageFlag = true;
                        updateEmptyDataPage(
                            $scope.emptyDataPage,
                            'servererror',
                            errorMsg,
                            'common.empty.data.checkbackend',
                            'common.reload.table',
                            getAllNotificationData
                        );

                        //only show page loading once
                        if($scope.initNotificationDataLoadingFlag === true) {
                            $scope.initNotificationDataLoadingFlag = false;
                        }
                    }
                );
            }

            //options for dropdown method types
            $scope.addressKeyOptions = [];

            var checkAddressKey = function (addressKey) {
                var notifType = '';
                var isValid = true;

                //if has no value, don't check, it will be checked for required
                //other place
                if(!angular.isDefined(addressKey) ||
                    !angular.isDefined($scope.updateNotificationData.type)) {
                    return isValid;
                }

                if(angular.isDefined($scope.updateNotificationData) &&
                   angular.isDefined($scope.updateNotificationData.type))  {
                    switch (($scope.updateNotificationData.type).toLowerCase()) {
                        case 'email':
                            isValid = ocValidators.email.test(addressKey);
                            if(!isValid) {
                                $scope.invalidAddressKeyMsg =  $translate.instant('ocvalidate.email');
                            }
                            break;
                        case 'webhook':
                        case 'hipchat':
                        case 'jira':
                        case 'slack':
                            isValid = ocValidators.url.test(addressKey);
                            if(!isValid) {
                                $scope.invalidAddressKeyMsg =  $translate.instant('ocvalidate.url');
                            }
                            break;
                    }
                }

                return isValid;
            };

            $scope.$watch('updateNotificationData.type', function() {

                $scope.invalidAddressKeyMsg = undefined;
                getPlaceholder();

                if ($scope.isCreateNotification === true) {
                    //when selection type changed, clean up address for create
                    $scope.updateNotificationData.address = '';
                }
                else {
                    //when selection type changed, restore address for edit for original
                    //type
                    if ($scope.updateNotificationData.type === $scope.originNotificationData.type) {
                         $scope.updateNotificationData.address = $scope.originNotificationData.address;
                    }
                    else { //clean up address for different
                         $scope.updateNotificationData.address = '';
                     }
                }
            });

            $scope.validateAddressKeyInput = function(addressKey) {
                $scope.invalidAddressKeyMsg = undefined;
                var isValid = checkAddressKey(addressKey);
                return isValid;
            };

            //default types in monasca, others will be available when plugin is
            //there
            var defaultTypes = [
                'EMAIL',
                'WEBHOOK',
                'PAGERDUTY'
            ];

            //known possible plugin types
            var knownPluginTypes = [
                'JIRA',
                'SLACK',
                'HIPCHAT'
            ];

            var getNotificationMethodTypesData = function () {
                var req = {
                    'operation': 'notificationtype_list'
                };

                return bllApiRequest.get('monitor', req).then(
                    function(response) {
                        var typesData = response.data || [];
                        var types = typesData.map(function(datum) {
                            return datum.type;
                        });
                        getNotifMethodTypes(types);

                    },function(error_data) {
                        var errorReason =
                            error_data.data ? error_data.data[0].data : '';
                        addNotification(
                            "error",
                            $translate.instant(
                                "notification_methods.types.data.error",
                                {'reason' : errorReason}
                            )
                        );
                        log('error', 'error data = ' + JSON.stringify(error_data));
                        getNotifMethodTypes(); //will get default ones
                    }
                );
            };

            var getAllNotificationData = function() {
                getNotificationData();
                getNotificationMethodTypesData();
            };

            var buildLocalizedType = function(type) {
              var label = $translate.instant('notifications_methods.types.' + type.toLowerCase());
              return label.indexOf('notifications_methods') !== -1 ? type : label;
            };

            var buildAddressKeyOptions = function(types) {
                $scope.addressKeyOptions = types.map(function(type) {
                    return {
                        label: buildLocalizedType(type),
                        value: type
                    };
                });
            };

            var getNotifMethodTypes = function(types) {
                //for some reason we don't get types
                if(!angular.isDefined(types) || types.length === 0) {
                    buildAddressKeyOptions(defaultTypes);
                    return;
                }
                //build options from type from monasca
                buildAddressKeyOptions(types);
            };

            $scope.notifyPeriod = {
                value: false,
                label: $translate.instant("notification_methods.edit.periodSet")
            };

            var getPlaceholder = function() {
                if(!angular.isDefined($scope.updateNotificationData.type)) {
                    return;
                }

                switch(($scope.updateNotificationData.type).toLowerCase()) {
                    case 'email':
                        $scope.addressPlaceholder =
                            "notification_methods.types.email.placeholder";
                        break;
                    case 'webhook':
                    case 'hipchat':
                    case 'slack':
                    case 'jira':
                        $scope.addressPlaceholder =
                            "notification_methods.types.url.placeholder";
                        break;
                    case 'pagerduty':
                        $scope.addressPlaceholder =
                            "notification_methods.types.key.placeholder";
                        break;
                    default:
                        $scope.addressPlaceholder =
                            "notification_methods.types.other.placeholder";
                }
            };

            //create notification
            var showCreateNotificationModal = function() {
                $scope.isCreateNotification = true;
                $scope.showCreateModalFlag = true;
                $scope.showEditModalFlag = false;
                //select the first option
                $scope.updateNotificationData = {
                    'type': $scope.addressKeyOptions[0].value
                };

                if(angular.isDefined($scope.createNotificationForm)) {
                     $scope.createNotificationForm.$setPristine();
                }
            };

            $scope.closeCreateModal = function () {
                $scope.showCreateModalFlag = false;
                $scope.updateNotificationData = {};
            };

            $scope.commitCreateNotification = function() {
                $scope.showUpdateNotificationProgress = true;
                // Only two periods are offered: 0 or 60sec.
                var newPeriod = 0;
                if($scope.notifyPeriod.value &&
                   $scope.updateNotificationData.type === "WEBHOOK") {
                    newPeriod = 60;
                }

                var create_req = {
                    'operation': 'notification_create',
                    'name': $scope.updateNotificationData.name,
                    'type': $scope.updateNotificationData.type,
                    'address': $scope.updateNotificationData.address,
                    'period': newPeriod
                };

                bllApiRequest.post('monitor', create_req).then(
                function(response){
                    addNotification(
                        "info",
                        $translate.instant(
                            "notification_methods.create.data.info",
                            {'name': $scope.updateNotificationData.name}
                        )
                    );
                    $scope.$emit('notificationListNeedsRefresh');
                    //refresh data
                    getNotificationData();
                    $scope.showCreateModalFlag = false;
                    $scope.showUpdateNotificationProgress = false;
                },function(error_data){
                    var errorReason =
                        error_data.data ? error_data.data[0].data : '';
                    var errorMsg =
                        $translate.instant(
                            "notification_methods.create.data.error",
                            {'name': $scope.updateNotificationData.name,
                             'reason': errorReason}
                        );
                    addNotification('error', errorMsg);
                    log('error','error_data=' + JSON.stringify(error_data));
                    $scope.showCreateModalFlag = false;
                    $scope.showUpdateNotificationProgress = false;
                });
            };

            //edit notification
            var showEditNotificationModal = function(notification){
                $scope.isCreateNotification = false;
                $scope.showCreateModalFlag = false;
                $scope.showEditModalFlag = true;

                $scope.updateNotificationData = angular.copy(notification);
                $scope.originNotificationData = notification;

                if(notification.period > 0) {
                    $scope.notifyPeriod.value = true;
                }
                else {
                    $scope.notifyPeriod.value = false;
                }

                if(angular.isDefined($scope.createNotificationForm)) {
                     $scope.createNotificationForm.$setPristine();
                }
            };

            $scope.closeEditModal = function(){
                $scope.showEditModalFlag = false;
                $scope.updateNotificationData = {};
                $scope.originNotificationData = {};
            };

            $scope.commitEditNotification = function(){
                $scope.showUpdateNotificationProgress = true;
                var newPeriod = 0;
                // Only two periods are offered: 0 or 60sec.
                if($scope.notifyPeriod.value === true &&
                   $scope.updateNotificationData.type === "WEBHOOK") {
                    newPeriod = 60;
                }

                var edit_req = {
                    'operation': 'notification_update',
                    'id': $scope.updateNotificationData.id,
                    'name': $scope.updateNotificationData.name,
                    'type': $scope.updateNotificationData.type,
                    'address': $scope.updateNotificationData.address,
                    'period': newPeriod
                };

                bllApiRequest.post('monitor', edit_req).then(
                function(success) {
                    addNotification(
                        "info",
                        $translate.instant(
                            "notification_methods.edit.data.info",
                            {'name': $scope.updateNotificationData.name}
                        )
                    );
                    $scope.$emit('notificationListNeedsRefresh');

                    //refresh data
                    getNotificationData();
                    $scope.showEditModalFlag = false;
                    $scope.showUpdateNotificationProgress = false;
                },
                function(error_data){
                    var errorReason =
                        error_data.data ? error_data.data[0].data : '';
                    var errorMsg =
                        $translate.instant(
                            "notification_methods.edit.data.error",
                            {'name': $scope.updateNotificationData.name,
                             'reason': errorReason}
                        );
                    addNotification('error', errorMsg);
                    log('error','error_data=' + JSON.stringify(error_data));
                    $scope.showEditModalFlag = false;
                    $scope.showUpdateNotificationProgress = false;
                });
            };

            //deal with $valid not working for edit
            $scope.isInputValid = function() {
                if (!angular.isDefined($scope.updateNotificationData)) {
                    return true;
                }

                if (!angular.isDefined($scope.updateNotificationData.name) ||
                    $scope.updateNotificationData.name.trim().length === 0) {
                    return false;
                }

                if (!angular.isDefined($scope.updateNotificationData.address) ||
                    $scope.updateNotificationData.address.trim().length === 0) {
                    return false;
                }

                return checkAddressKey($scope.updateNotificationData.address);
            };

            //deal with $pristine not working for edit
            $scope.hasInputChanged = function() {
                if (!angular.isDefined($scope.updateNotificationData) ||
                    !angular.isDefined($scope.originNotificationData)) {
                    return false;
                }

                if ($scope.updateNotificationData.name !== $scope.originNotificationData.name ||
                    $scope.updateNotificationData.type  !==  $scope.originNotificationData.type ||
                    $scope.updateNotificationData.address  !==  $scope.originNotificationData.address) {
                    return true; //changed
                }

                if($scope.originNotificationData.type === 'WEBHOOK') {
                    var newPeriod = $scope.notifyPeriod.value === true ? 60 : 0;
                    if (newPeriod !== $scope.originNotificationData.period) {
                        return true; //changed
                    }
                }

                return false;
            };

            //delete notification
            var showDeleteNotificationModal = function (data) {
                //we will only show selected data in the table
                if (Array.isArray(data)) { //selected global delete
                    $scope.selectedData = data;
                    $scope.selectedData.forEach(function(notif) {
                        notif.removeSelection = true;
                    });
                }
                else { //selected row delete
                    //clean up existing removeSelection
                    if (angular.isDefined($scope.selectedData)) {
                        $scope.selectedData.forEach(function(notif) {
                            notif.removeSelection = false;
                        });
                    }

                    data.removeSelection = true;
                    data.$rowSelected = true; //make selection
                    $scope.selectedData = [data];
                }

                $scope.selectedDataLength = $scope.selectedData.length;

                $scope.showDeleteModalFlag = true;
            };

            $scope.commitDeleteNotification = function() {
                $scope.showDeleteNotificationProgress = true;
                var removeSelections = $scope.selectedData.filter(function(notif) {
                    return notif.removeSelection;
                });
                var promises = removeSelections.map(function(datum) {
                    var req_data = {operation: 'notification_delete', id: datum.id};
                    return bllApiRequest.post('monitor', req_data ).
                        then(angular.noop,
                            function(error) {
                                var msg = $translate.instant(
                                    'notification_methods.delete.error',
                                    {name: datum.name, id: datum.id, details: error});
                                addNotification('error', msg);
                                //remove it from selection
                                removeSelections.forEach(function(notif, index) {
                                    if(datum.id === notif.id) {
                                        notif.$rowSelected = false;
                                        removeSelections.splice(index, 1);
                                    }
                                });
                            }
                        );
                    }
                );
                var dismissModal = function() {
                    $scope.showDeleteModalFlag = false;
                    $scope.showDeleteNotificationProgress = false;
                    getAllNotificationData();
                };
                $q.all(promises).then(dismissModal, dismissModal);
            };

            //init call
            getAllNotificationData();
        }
    ]);
})(angular);
