// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(ng) {
  'use strict';
  var p = ng.module('plugins');

  p.controller('InlineNotificationsExampleController', ['$scope', '$http', '$translate', 'ToastNotifications', 'ApplicationNotifications',
      function ($scope, $http, $translate, ToastNotifications, ApplicationNotifications) {
        $scope.tableLoading = true;
        $http.get('./sample_data/sample_data.json').then(function(response){
            $scope.tableData = response.data.tabledata || [];
            $scope.tableLoading = false;
        });

        $scope.messagesAvailable = [
          {name:'common.welcome'},
          {name:'common.test_message'},
          {name:'common.test_message2'},
          {name:'example.message1'},
          {name:'example.message2'}
        ];

        $scope.messagesSeveritiesAvailable = [
          {name: 'success'},
          {name: 'info'},
          {name: 'warning'},
          {name: 'error'}
        ];

        $scope.applicationNotificationSeverity = $scope.notificationSeverity = $scope.toastNotificationSeverity = $scope.messagesSeveritiesAvailable[0];
        $scope.applicationNotificationMessage = $scope.notificationMessage = $scope.toastNotificationMessage = $scope.messagesAvailable[0];

        $scope.addNotifications = function() {
          $scope.tableData.forEach(function(datum) {
            if(datum.$rowSelected) {
              datum.$notification = {
                text: $scope.notificationMessage.name,
                type: $scope.notificationSeverity.name
              };
            }
          });
        };

        $scope.addToastNotifications = function() {
          ToastNotifications.addToast($scope.toastNotificationSeverity.name, $scope.toastNotificationMessage.name);
        };

        $scope.removeNotifications = function() {
          $scope.tableData.forEach(function(datum) {
            if(datum.$rowSelected) {
              delete datum.$notification;
            }
          });
        };

        $scope.addApplicationNotification = function() {
          ApplicationNotifications.add($scope.applicationNotificationSeverity.name, $scope.applicationNotificationMessage.name);
        };

        //this is an example of a filter function
        var priceFilter = function(item, filterArgs){
            if(angular.isUndefined(filterArgs)){
                return true;
            } else {
                //check the min and max
                var priceNumber = Number(item.price.replace(/[^0-9\.]+/g,""));
                if((angular.isUndefined(filterArgs.min) || priceNumber > filterArgs.min) &&
                    (angular.isUndefined(filterArgs.max) || priceNumber < filterArgs.max)){
                    return true;
                }
                return false;
            }
        };

        //filters that are passed into the tableConfig need to have a function and args
        var highPriceFilter = {};
        highPriceFilter.function = priceFilter;
        highPriceFilter.args = {
            min: 100.00,
            max: undefined
        };

        //filters that are passed into the tableConfig need to have a function and args
        var lowPriceFilter = {};
        lowPriceFilter.function = priceFilter;
        lowPriceFilter.args = {
            min: 0.00,
            max: 100.00
        };

        //headers will be parsed into columns
        //filters is an optional config with additional filters to apply
        //pageConfig is to customize paging settings if pageable is set on the table
        $scope.tableConfig = {
            headers: [
                {
                    name: $translate.instant('example.column.name'),
                    type: 'string',
                    sortfield: 'something',
                    displayfield: 'something',
                    highlightExpand: true
                },
                {
                    name: $translate.instant('example.column.price'),
                    type: 'number',
                    sortfield: 'price',
                    displayfield: 'price',
                    helpTooltip: function(item){
                        return "I am the mighty tooltip! Your item is:" + item;
                    },
                    tooltipplacement: 'top',
                    tooltipShow: function(data){
                        //shows the tooltip if the row is expanded
                        if(data.$expanded === true){
                            return true;
                        }

                        return false;
                    },
                    filterOptions: [{
                        displayLabel: '$6',
                        value: '$6'
                    },{
                        displayLabel: '$30',
                        value: '$30'
                    },{
                        displayLabel: '$5',
                        value: '$5'
                    },{
                        displayLabel: '$1,000',
                        value: '$1,000'
                    }]
                }
            ],
            //since these are selected by default, include them in the list
            filters: [highPriceFilter, lowPriceFilter],
            pageConfig: {
                page: 1,//1 is the default
                pageSize: 5//1000 is the default
            },
            methods:['showId'],
            rowSelectionCheck: $scope.allowRowSelectionCheck,

            actionMenuConfigFunction: $scope.actionMenuPermissionsCheck,
            actionMenuConfig: [{
                label: $translate.instant('example.table.menu.action1'),
                name: 'action1',
                action: function(data){
                    console.log('triggered action1');
                }
            },{
                label: $translate.instant('example.table.menu.action2'),
                name: 'action2',
                action: function(data){
                    console.log('triggered action2');
                }
            },{
                label: $translate.instant('example.table.menu.action3'),
                name: 'action3',
                action: function(data){
                    console.log('triggered action3');
                }
            }],
            multiSelectActionMenuConfigFunction: $scope.multiSelectActionMenuPermissionsCheck,
            multiSelectActionMenuConfig: [{
                label: $translate.instant('example.table.menu.action1'),
                name: 'multiSelectAction1',
                action: function(data){
                    console.log('selected rows action1, data size is:' + data.length);
                }
            },{
                label: $translate.instant('example.table.menu.action2'),
                name: 'multiSelectAction2',
                action: function(data){
                    console.log('selected rows action2, data size is:' + data.length);
                }
            },{
                label: $translate.instant('example.table.menu.action3'),
                name: 'multiSelectAction3',
                action: function(data){
                    console.log('selected rows action3, data size is:' + data.length);
                }
            }],
            globalActionsConfig: [
                {
                    label: $translate.instant('example.table.global.action1'),
                    name: 'globalaction1',
                    action: function(){
                        console.log('triggered global action1');
                    }
                },
                {
                    label: $translate.instant('example.table.global.action2'),
                    name: 'globalaction2',
                    action: function(){
                        console.log('triggered global action2');
                    }
                }
            ]
        };
    }
  ]);

})(angular);
