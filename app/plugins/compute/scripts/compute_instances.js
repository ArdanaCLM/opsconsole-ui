// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {

    'use strict';

    var p = ng.module('plugins');

    p.controller('ComputeInstancesController', ['$scope', '$http', '$rootScope', '$filter', '$translate',
        'addNotification', 'isUndefined', 'bllApiRequest', 'clearForm', '$interval', '$moment', '$window',
        '$sce', 'getStatusCssClass', 'getMonascaInstanceStatusString', 'updateEmptyDataPage', 'populateIntances',
        function ($scope, $http, $rootScope, $filter, $translate, addNotification, isUndefined,
                  bllApiRequest, clearForm, $interval, $moment, $window,
                  $sce, getStatusCssClass, getMonascaInstanceStatusString, updateEmptyDataPage, populateIntances) {

            $scope.renderInstanceStatus = function(data){
                var monascaStatus = getMonascaInstanceStatusString(data);

                var instanceHtml = '<span>' + monascaStatus.status + '</span><span class="table_status_icon ' + getStatusCssClass(monascaStatus.code) + '"/>';
                return $sce.trustAsHtml(instanceHtml);
            };

            $scope.compute_instances_data = [];
            $scope.computeInstancesDataLoading = true;

            //deal with empty data page
            $scope.showEmptyDataPageFlag = false;
            $scope.emptyDataPage = {};
            $scope.initComputeInstancesDataLoading = true;

            $scope.compute_instances_table_config = {
                headers: [
                    {
                        name: $translate.instant("compute.compute_instances.table.header.name"),
                        type: "string",
                        displayfield: "name",
                        sortfield: 'name',
                        highlightExpand: true,
                        isNotHtmlSafe: true
                    },
                    {
                        name: $translate.instant("compute.compute_instances.table.header.status"),
                        type: "string",
                        displayfield: "host_alive_status",
                        sortfield: 'host_alive_status',
                        specialColumnType: 'custom',
                        customDisplayFilter: $scope.renderInstanceStatus,
                        filterOptions: [{
                            displayLabel: $translate.instant('common.instance.status.description.-1'),
                            value: "-1"
                        }, {
                            displayLabel: $translate.instant('common.instance.status.description.0'),
                            value: "0"
                        }, {
                            displayLabel: $translate.instant('common.instance.status.description.1'),
                            value: "1"
                        }, {
                            displayLabel: $translate.instant('common.instance.status.description.2'),
                            value: "2"
                        }, {
                            displayLabel: $translate.instant('common.instance.status.description.3'),
                            value: "3"
                        }, {
                            displayLabel: $translate.instant('common.instance.status.description.4.off'),
                            value: "4"
                        }, {
                            displayLabel: $translate.instant('common.instance.status.description.4.suspend'),
                            value: "4"
                        }, {
                            displayLabel: $translate.instant('common.instance.status.description.5'),
                            value: "5"
                        }, {
                            displayLabel: $translate.instant('common.instance.status.description.6'),
                            value: "6"
                        }]
                    },
                    {
                        name: $translate.instant("compute.compute_instances.table.header.host"),
                        type: 'string',
                        displayfield: 'host',
                        sortfield: 'host'
                    },
                    {
                        name: $translate.instant("compute.compute_instances.table.header.image"),
                        type: 'string',
                        displayfield: 'image',
                        sortfield: 'image'
                    }
                ],
                pageConfig: {
                    pageSize: 20
                },
                naValueCheck: $scope.checkNotApplicable,
                actionMenuConfig: []
            };

            function setComputeInstancesData() {
                $scope.computeInstancesDataLoading = true;
                var req_compute_instances = {
                    'operation': 'instance-list'
                };
                $scope.emptyDataPage = {};

                bllApiRequest.get("nova", req_compute_instances).then(
                    function (data) {
                        //show empty data page for no data
                        if(!angular.isDefined(data) ||
                           !angular.isDefined(data.data) ||
                           !angular.isDefined(data.data.instances) ||
                            data.data.instances.length === 0) {
                            $scope.showEmptyDataPageFlag = true;
                            updateEmptyDataPage(
                                $scope.emptyDataPage,
                                'nodata',
                                $translate.instant('compute.instance.empty.data')
                            );
                        }
                        else { //have data
                            $scope.compute_instances_data = populateIntances(data.data.instances);
                        }
                        $scope.computeInstancesDataLoading = false;

                        //only show the page loading mask at the very first beginning
                        if($scope.initComputeInstancesDataLoading === true) {
                            $scope.initComputeInstancesDataLoading = false;
                        }
                    },
                    function (error_data) {
                        $scope.computeInstancesDataLoading = false;
                        var errorReason =
                            error_data.data ? error_data.data[0].data : '';
                        var errorMsg = $translate.instant(
                            "compute.compute_instances.compute_list.error",
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
                            setComputeInstancesData
                        );

                         //only show the page loading mask at the very first beginning
                        if($scope.initComputeInstancesDataLoading === true) {
                            $scope.initComputeInstancesDataLoading = false;
                        }
                    });
            }

            setComputeInstancesData();

        }
    ]);
})(angular);
