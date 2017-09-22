// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';
    var p = ng.module('plugins');
    p.controller('ComputeBaremetalInstancesController', [
        '$scope', '$translate', 'log', '$q', 'bllApiRequest', 'addNotification',
        'updateEmptyDataPage', '$moment', '$timeout',
        function ($scope, $translate, log, $q, bllApiRequest, addNotification,
                  updateEmptyDataPage, $moment, $timeout) {
            $scope.baremetalInstanceData = [];
            $scope.baremetalInstanceDataLoading = true;

            $scope.showModalOverlayFlag = false;
            $scope.showNodeDetailsModalFlag = false;
            $scope.showInstanceDetailsModalFlag = false;
            $scope.dataDeletingOverlayFlag = false;
            $scope.showConfirmDeleteNodeModalFlag = false;
            $scope.showConfirmDeleteInstanceModalFlag = false;

            $scope.baremetalNodeDetailsData = {};
            $scope.baremetalInstanceDetailsData = {};

            //deal with empty data page
            $scope.showEmptyDataPageFlag = false;
            $scope.emptyDataPage = {};
            $scope.initBaremetalInstanceDataLoading = true;

            var getPowerStateFilterOptions = function() {
                return [{
                    displayLabel: $translate.instant('compute.baremetal.instance.powerstate.poweron'),
                    value: 'power on'
                }, {
                    displayLabel: $translate.instant('compute.baremetal.instance.powerstate.poweroff'),
                    value: 'power off'
                }, {
                    displayLabel: $translate.instant('compute.baremetal.instance.powerstate.rebooting'),
                    value: 'rebooting'
                }, {
                    displayLabel: $translate.instant('compute.baremetal.instance.error'),
                    value: 'error'
                }];
            };

            var getNoteStateFilterOptions = function() {
                return [{
                    displayLabel: $translate.instant('compute.baremetal.instance.nodestate.active'),
                    value: 'active'
                }, {
                    displayLabel: $translate.instant('compute.baremetal.instance.nodestate.available'),
                    value: 'available'
                }, {
                    displayLabel: $translate.instant('compute.baremetal.instance.nodestate.cleaning'),
                    value: 'cleaning'
                }, {
                    displayLabel: $translate.instant('compute.baremetal.instance.nodestate.cleanfailed'),
                    value: 'clean failed'
                }, {
                    displayLabel: $translate.instant('compute.baremetal.instance.nodestate.cleanwait'),
                    value: 'clean wait'
                }, {
                    displayLabel: $translate.instant('compute.baremetal.instance.nodestate.deleted'),
                    value: 'deleted'
                }, {
                    displayLabel: $translate.instant('compute.baremetal.instance.nodestate.deleting'),
                    value: 'deleting'
                }, {
                    displayLabel: $translate.instant('compute.baremetal.instance.nodestate.deploying'),
                    value: 'deploying'
                }, {
                    displayLabel: $translate.instant('compute.baremetal.instance.nodestate.deploycomplete'),
                    value: 'deploy complete'
                }, {
                    displayLabel: $translate.instant('compute.baremetal.instance.nodestate.deployfailed'),
                    value: 'deploy failed'
                }, {
                    displayLabel: $translate.instant('compute.baremetal.instance.nodestate.enroll'),
                    value: 'enroll'
                }, {
                    displayLabel: $translate.instant('compute.baremetal.instance.nodestate.inspecting'),
                    value: 'inspecting'
                }, {
                    displayLabel: $translate.instant('compute.baremetal.instance.nodestate.inspectfailed'),
                    value: 'inspect failed'
                }, {
                    displayLabel: $translate.instant('compute.baremetal.instance.nodestate.managable'),
                    value: 'managable'
                }, {
                    displayLabel: $translate.instant('compute.baremetal.instance.nodestate.rebuild'),
                    value: 'rebuild'
                }, {
                    displayLabel: $translate.instant('compute.baremetal.instance.nodestate.verifying'),
                    value: 'verifying'
                }, {
                    displayLabel: $translate.instant('compute.baremetal.instance.nodestate.waitcallback'),
                    value: 'wait call-back '
                }, {
                    displayLabel: $translate.instant('common.error3'),
                    value: 'error'
                }];
            };

            //http://docs.openstack.org/developer/nova/vmstates.html
            //some of the final state of the vm state also include build state
            var getInstanceStatusFilterOptions = function() {
                return [{
                    displayLabel: $translate.instant('compute.instance.status.active'),
                    value: "ACTIVE"
                }, {//from actual data it is BUILD not BULDING
                    displayLabel: $translate.instant('compute.instance.status.build'),
                    value: "BUILD"
                }, {
                    displayLabel: $translate.instant('compute.instance.status.paused'),
                    value: "PAUSED"
                }, {
                    displayLabel: $translate.instant('compute.instance.status.rescued'),
                    value: "RESCUED"
                }, {
                    displayLabel: $translate.instant('compute.instance.status.stopped'),
                    value: "STOPPED"
                },  {
                    displayLabel: $translate.instant('compute.instance.status.suspended'),
                    value: "SUSPENDED"
                }, {
                    displayLabel: $translate.instant('compute.instance.status.soft_deleted'),
                    value: "SOFT_DELETED"
                },{
                    displayLabel: $translate.instant('compute.instance.status.deleted'),
                    value: "DELETED"
                }, {
                    displayLabel: $translate.instant('common.error2'),
                    value: "ERROR"
                }];
            };

            //based on current data
            //boot_mode:uefi,boot_option:local
            var getCapability = function(capabilities, key) {
                if (!angular.isDefined(capabilities)) {
                    return '';
                }

                var boot = [];
                if( typeof capabilities === 'string' ) {

                    if (!angular.isDefined(key)) {
                        return capabilities;
                    }

                    //if we have boot_mode or boot_option , parse it out
                    if (capabilities.indexOf('boot_mode') ||
                        capabilities.indexOf('boot_option')) {
                        boot = capabilities.split(',');
                        for (var idx in boot) {
                            var value = boot[idx];
                            var pair = value.split(':');
                            if (pair[0] === key) {
                                return pair[1];
                            }
                        }
                    }
                }

                return '';
            };

            var getInfo = function(info) {

                if (!angular.isDefined(info)) {
                    return '';
                }

                var retInfo = angular.copy(info);
                //remove password and username info
                for (var prop in retInfo) {
                    if (prop.indexOf('password') > 0 || prop.indexOf('username') > 0) {
                        delete retInfo[prop];
                    }
                }

                return JSON.stringify(retInfo);
            };

            var getProperty = function(properties, key) {
                if (!angular.isDefined(properties)) {
                    return '';
                }

                return properties[key];

            };

            var callBLLForBaremetalNodeDetailData = function(data) {
                $scope.baremetalNodeDetailsData = {};
                var req = {
                    'operation': 'node.get',
                    'node_id': data.id
                };

                return bllApiRequest.get('ironic', req).then(
                    function(response) {
                        var datum = response.data || {};
                        if(angular.isDefined(datum.uuid)) {
                            var obj = {
                                //basic details
                                'id': datum.uuid,
                                'name': datum.name ? datum.name : '',
                                'power_state': datum.power_state,
                                'node_state': datum.provision_state,
                                'maintenance': datum.maintenance,
                                'maintenance_reason': datum.maintenance_reason,
                                'last_error': datum.last_error,
                                'reservation': datum.reservation,
                                'chassis_uuid': datum.chassis_uuid,
                                //hardware properties
                                'mem_mb': getProperty(datum.properties, 'memory_mb'),
                                'cpu_arch': getProperty(datum.properties, 'cpu_arch'),
                                'cpus': getProperty(datum.properties, 'cpus'),
                                'local_gb': getProperty(datum.properties, 'local_gb'),
                                'boot_mode': getCapability(datum.properties.capabilities, 'boot_mode'),
                                'boot_option': getCapability(datum.properties.capabilities, 'boot_option'),
                                //show capabilities as a whole string if we don't have
                                //boot_mode and boot_option
                                'capabilities': getCapability(datum.properties.capabilities),
                                //instance information
                                'instance': data.instance, //either name or id
                                'instance_info': getInfo(datum.instance_info),
                                //driver info
                                'driver': datum.driver,
                                'driver_info': getInfo(datum.driver_info)
                            };
                            $scope.baremetalNodeDetailsData = obj;
                        }
                    },function(error_data) {
                        addNotification(
                            "error",
                            $translate.instant(
                                "compute.baremetal.instance.details.data.error", {'id' : data.id}));
                        log('error', 'Failed to get compute bare metal node details data');
                        log('error', 'error data = ' + JSON.stringify(error_data));
                    }
                );
            };

            $scope.showNodeDetailsModal = function (data) {
                if(!angular.isDefined(data)) {
                    return;
                }

                $scope.showNodeDetailsModalFlag = true;
                $scope.showModalOverlayFlag = true;
                //save table data for the  instance link in node details
                $scope.selectedData = data;
                callBLLForBaremetalNodeDetailData(data).then(
                    function() {
                        $scope.showModalOverlayFlag = false;
                    }
                );
            };

            $scope.showInstanceDetailsModal = function (data) {
                if(!angular.isDefined(data)) {
                    return;
                }

                $scope.showInstanceDetailsModalFlag = true;
                $scope.selectedData = data;
            };

            $scope.isValidToActivateDeleteNode = function(data) {

                if (!angular.isDefined(data)) {
                    return false;
                }

                //data is the table data with instance details
                if (angular.isDefined(data.instance_uuid) &&
                    data.instance_uuid !== '') {
                    return false;
                }

                //only allow delete on node when it is in final state
                if ((data.maintenance === true && data.node_state === 'inspect failed') ||
                    (data.maintenance === true && data.node_state === 'clean failed') ||
                    (data.maintenance === true && data.node_state === 'active') ||
                    data.node_state === 'deploy failed' ||
                    data.node_state === 'error' ||
                    data.node_state === 'available') {
                    return true;
                }

                return false;
            };

            $scope.isValidToActivateDeleteInstance = function(data) {
                if (!angular.isDefined(data)) {
                    return false;
                }

                //data is the table data with instance details
                if (!angular.isDefined(data.instance_uuid) ||
                    data.instance_uuid === '' ||
                    Object.keys(data.instanceDetails).length === 0) {
                    return false;
                }

                //after trigger delete instance, node state is deleting
                //while instance is still there and ACTIVE
                if(data.node_state === 'deleting') {
                    return false;
                }

                //only allow delete instance on the following instance status
                if(data.instance_status === 'ACTIVE' ||
                   data.instance_status === 'ERROR' ||
                   data.instance_status === 'DELETED' ||
                   data.instance_status === 'RESCUED' ||
                   data.instance_status === 'SOFT_DELETED' ||
                   data.instance_status === 'STOPPED') {
                    return true;
                }

                return false;
            };

            $scope.actionMenuPermissionsCheck = function(data, actionName) {

                var actionPermissions = {
                    enabled: true,
                    hidden: false
                };

                if(actionName === 'deleteComputeBaremetalInstance') {
                    //if have no instance hide delete instance
                    if (!$scope.isValidToActivateDeleteInstance(data)) {
                        actionPermissions.hidden = true;
                    }
                }
                else if (actionName === 'deleteComputeBaremetalNode') {
                    //can to delete node
                    if (!$scope.isValidToActivateDeleteNode(data)) {
                        actionPermissions.hidden = true;
                    }
                }
                else if (actionName === 'viewComputeBaremetalInstanceDetails') {
                    //if have no instance no instance details
                    if (!angular.isDefined(data.instance_uuid) ||
                        data.instance_uuid === '' ||
                        Object.keys(data.instanceDetails).length === 0) {
                        actionPermissions.hidden = true;
                    }
                }

                return actionPermissions;
            };

            //table config
            $scope.baremetalInstanceTableConfig = {
                headers: [{
                    name: $translate.instant("common.node"),
                    type: "string",
                    displayfield: "node",
                    sortfield: 'node',
                    highlightExpand: true,
                    isNotHtmlSafe: true
                }, {
                    name: $translate.instant("compute.baremetal.instance.nodestate"),
                    type: "string",
                    displayfield: "node_state",
                    sortfield: 'node_state',
                    filterOptions: getNoteStateFilterOptions()
                }, {
                    name: $translate.instant("compute.baremetal.instance.powerstate"),
                    type: "string",
                    displayfield: "power_state",
                    sortfield: 'power_state',
                    filterOptions: getPowerStateFilterOptions()
                }, {
                    name: $translate.instant("compute.baremetal.instance.maintenance"),
                    type: "string",
                    displayfield: "maintenance",
                    sortfield: 'maintenance',
                    filterOptions: [{
                        displayLabel: $translate.instant('common.boolean.true2'),
                        value: 'true'
                    }, {
                        displayLabel: $translate.instant('common.boolean.false2'),
                        value: 'false'
                    }]
                }, {
                    name: $translate.instant("compute.table.row.header.instance"),
                    type: "string",
                    displayfield: "instance",
                    sortfield: 'instance',
                    isNotHtmlSafe: true
                }, {
                    name: $translate.instant("compute.baremetal.instance.status"),
                    type: "string",
                    displayfield: "instance_status",
                    sortfield: 'instance_status',
                    filterOptions: getInstanceStatusFilterOptions()
                }],

                pageConfig: {
                    pageSize: 20
                },

                expandAction: $scope.showNodeDetailsModal,

                actionMenuConfigFunction: $scope.actionMenuPermissionsCheck,

                actionMenuConfig: [{
                    label: 'compute.baremetal.instance.view.node.details',
                    name: 'viewComputeBaremetalNodeDetails',
                    action: function (data) {
                        $scope.showNodeDetailsModal(data);
                    }
                }, {
                    label: 'compute.baremetal.instance.view.details',
                    name: 'viewComputeBaremetalInstanceDetails',
                    action: function (data) {
                        $scope.showInstanceDetailsModal(data);
                    }
                }, {
                    label: 'common.delete',
                    name: 'deleteComputeBaremetalNode',
                    action: function (data) {
                         $scope.showConfirmDeleteNodeModal(data);
                    }
                }, {
                    label: 'compute.baremetal.instance.delete_instance',
                    name: 'deleteComputeBaremetalInstance',
                    action: function (data) {
                        $scope.showConfirmDeleteInstanceModal(data);
                    }
                }],

                multiSelectActionMenuConfig: []
            };

            $scope.getAllBaremetalInstanceData = function() {
                $scope.getBaremetalInstanceTableData().then (function() {
                    $scope.baremetalInstanceDataLoading = false;

                    //only show the page loading at the very first time
                    if($scope.initBaremetalInstanceDataLoading === true) {
                        $scope.initBaremetalInstanceDataLoading = false;
                    }
                });
            };

            $scope.getBaremetalInstanceTableData = function() {
                $scope.barenetalInstanceDataLoading = true;
                $scope.baremetalInstanceData = [];

                var defer = $q.defer();
                var promises = [];
                promises.push(callBLLForBaremetalInstanceData());
                $q.all(promises).then(defer.resolve, defer.reject);
                return defer.promise;
            };

            var getMeta = function(meta) {
                if(!angular.isDefined(meta) || !angular.isObject(meta)) {
                    return [];
                }
                var metaList = [];
                for (var key in meta) {
                    if (meta.hasOwnProperty(key)) {
                        metaList.push(key + ': ' + meta[key]);
                    }
                }
                return metaList;
            };

            var getIps = function(addresses) {
                if(!angular.isDefined(addresses) || !angular.isObject(addresses)) {
                    return [];
                }
                var ips = [];

                for(var property in addresses) {
                    for( var idx in addresses[property]) {
                        var addressInfo =
                            property + ': ' + addresses[property][idx].addr + '(' + addresses[property][idx]['OS-EXT-IPS:type'] + ')';
                        ips.push(addressInfo);
                    }
                }

                return ips;
            };

            var getDateCreated = function(date) {
                if(!angular.isDefined(date) || date === '') {
                    return '';
                }
                var created = $moment(date);
                return created.format('L') + ' ' + created.format('LTS');
            };

            var getInstanceDetails = function (compute) {
                if(!angular.isDefined(compute) || compute === null) {
                    return {};
                }
                var obj = {
                    'host': compute.host ? compute.host : '',
                    'ip_addresses': getIps(compute.addresses),
                    'project': compute.project,
                    'flavor': compute.flavor,
                    'status': compute.status,
                    'key': compute.key_name ? compute.key_name : '',
                    'date_created': getDateCreated(compute.created),
                    'task': compute.task_state ? compute.task_state : '',
                    'metadata': getMeta(compute.meta),
                    'power_state': compute.power_state,
                    'image': compute.image ? compute.image : ''
                };

                return obj;
            };

            var getInstanceName = function(compute) {
                if (!angular.isDefined(compute) || compute === null) {
                    return '';
                }

                return compute.name ? compute.name : '';
            };

            var getInstanceStatus = function(compute) {
                if (!angular.isDefined(compute) || compute === null) {
                    return '';
                }

                return compute.status;
            };

            var getInstance = function(datum) {
                if (!angular.isDefined(datum.baremetal.instance_uuid) ||
                    datum.baremetal.instance_uuid === null) {
                    return '';
                }

                if(!angular.isDefined(datum.compute) || datum.compute === null) {
                    return datum.baremetal.instance_uuid;
                }

                if(angular.isDefined(datum.compute.name) &&
                   datum.compute.name !== null &&
                   datum.compute.name !== '') {
                    return datum.compute.name;
                }

                return datum.baremetal.instance_uuid;
            };

            var callBLLForBaremetalInstanceData = function() {
                var req = {
                    'operation': 'baremetal-list'
                };

                $scope.emptyDataPage = {};

                return bllApiRequest.get('ironic', req).then(
                    function(response) {
                        //show empty data page for no data
                        if(!angular.isDefined(response) ||
                           !angular.isDefined(response.data) ||
                           !angular.isDefined(response.data.length === 0)) {
                            $scope.showEmptyDataPageFlag = true;
                            updateEmptyDataPage(
                                $scope.emptyDataPage,
                                'nodata',
                                $translate.instant('compute.baremetal.instance.empty.data')
                            );
                        }
                        else {
                            var nodeData = response.data || [];
                            nodeData.forEach(function (datum) {
                                var obj = {
                                    'node': datum.baremetal.name ? datum.baremetal.name : datum.baremetal.uuid,
                                    'id': datum.baremetal.uuid, //hidden
                                    'name': datum.baremetal.name ? datum.baremetal.name : '', //hidden
                                    'power_state': datum.baremetal.power_state,
                                    'node_state': datum.baremetal.provision_state,
                                    'maintenance': datum.baremetal.maintenance, //hidden
                                    'instance': getInstance(datum),
                                    'instance_uuid': datum.baremetal.instance_uuid ? datum.baremetal.instance_uuid : '', //hidden
                                    'instance_name': getInstanceName(datum.compute),  //hidden
                                    'instance_status': getInstanceStatus(datum.compute),
                                    'instanceDetails': getInstanceDetails(datum.compute)
                                };
                                $scope.baremetalInstanceData.push(obj);
                            });
                        }
                    },function(error_data) {
                        var errorReason =
                            error_data.data ? error_data.data[0].data : '';
                        var errorMsg = $translate.instant(
                            "compute.baremetal.instance.table.data.error",
                            {'reason' : errorReason}
                        );
                        addNotification("error", errorMsg);
                        log('error', 'Failed to get compute baremetal instance data');
                        log('error', 'error data = ' + JSON.stringify(error_data));

                        //show empty data page for error
                        $scope.showEmptyDataPageFlag = true;
                        updateEmptyDataPage(
                            $scope.emptyDataPage,
                            'servererror',
                            errorMsg,
                            'common.empty.data.checkbackend',
                            'common.reload.table',
                            $scope.getAllBaremetalInstanceData
                        );
                    }
                );
            };

            //delete node
            $scope.commitDeleteNode = function() {
                var req = {
                    'operation': 'node.delete',
                    'node_id': $scope.toDeleteNodeId
                };
                $scope.dataDeletingOverlayFlag = true;
                bllApiRequest.post('ironic', req).then(
                    function(response) {
                        addNotification(
                            "info",
                            $translate.instant(
                                "compute.baremetal.instance.node.delete.success",
                                {'node': $scope.toDeleteNodeId}
                            )
                        );
                        log('info',
                            'Successfully deleted compute bare metal node ' +
                            $scope.toDeleteNodeId
                        );
                        $scope.showConfirmDeleteNodeModalFlag = false;
                        $scope.dataDeletingOverlayFlag = false;

                        //refresh data
                        $scope.getAllBaremetalInstanceData();
                    },
                    function(error_data) {
                        addNotification(
                            "error",
                            $translate.instant(
                                "compute.baremetal.instance.node.delete.error",
                                {'node': $scope.toDeleteNodeId}
                            )
                        );
                        log('error',
                            'Failed to delete compute baremetal ndoe ' +  $scope.toDeleteNodeId
                        );
                        log('error', 'error data = ' + JSON.stringify(error_data));
                        $scope.showConfirmDeleteNodeModalFlag = false;
                        $scope.dataDeletingOverlayFlag = false;

                        //refresh data
                        $scope.getAllBaremetalInstanceData();
                    }
                );
            };

            $scope.showConfirmDeleteNodeModal = function(node) {
                $scope.toDeleteNodeId = undefined;
                //action from menu
                if(angular.isDefined(node)) {
                    $scope.toDeleteNodeId = node.id;
                }
                else { //click the button on node details
                    $scope.toDeleteNodeId = $scope.selectedData.id;
                }
                $scope.showConfirmDeleteNodeModalFlag = true;
            };

            //delete instance
            $scope.commitDeleteInstance = function() {
                var initStart = true;
                var req = {
                    'operation': 'instance-delete',
                    'instance_id': $scope.toDeleteInstanceId
                };
                $scope.dataDeletingOverlayFlag = true;
                bllApiRequest.post('nova', req).then(
                    function(response) {
                        addNotification(
                            "info",
                            $translate.instant(
                                "compute.baremetal.instance.delete.success",
                                {'instance': $scope.toDeleteInstanceId}
                            )
                        );
                        log('info',
                            'Successfully deleted compute baremetal instance ' +
                            $scope.toDeleteInstanceId
                        );

                        //refresh data
                        $timeout(function() {$scope.getAllBaremetalInstanceData();}, 3000);
                    },
                    function(error_data) {
                        addNotification(
                            "error",
                            $translate.instant(
                                "compute.baremetal.instance.delete.error",
                                {'instance': $scope.toDeleteInstanceId}
                            )
                        );
                        log('error',
                            'Failed to delete compute baremetal instance ' +
                            $scope.toDeleteInstanceId
                        );
                        log('error', 'error data = ' + JSON.stringify(error_data));
                        $scope.showConfirmDeleteInstanceModalFlag = false;
                        $scope.dataDeletingOverlayFlag = false;

                        //refresh data
                        $timeout(function() {$scope.getAllBaremetalInstanceData();}, 3000);
                    },
                    function(progress_data) {
                        log('debug', 'Delete baremetal instance in progress ' + $scope.toDeleteInstanceId);
                        if (initStart) {
                            addNotification(
                                "info",
                                $translate.instant(
                                    "compute.baremetal.instance.delete.start.success",
                                    {'instance': $scope.toDeleteInstanceId}
                                )
                            );
                            initStart = false;

                            //remove loading flag and instance detail modal
                            $scope.showConfirmDeleteInstanceModalFlag = false;
                            $scope.dataDeletingOverlayFlag = false;

                            $timeout(function() {$scope.getAllBaremetalInstanceData();}, 3000);
                        }
                    }
                );
            };

            $scope.showConfirmDeleteInstanceModal = function(node) {
                $scope.toDeleteInstanceId = undefined;
                //action from menu
                if(angular.isDefined(node)) {
                    $scope.toDeleteInstanceId = node.instance_uuid;
                }
                else { //click the button on instance details
                    $scope.toDeleteInstanceId = $scope.selectedData.instance_uuid;
                }
                $scope.showConfirmDeleteInstanceModalFlag = true;
            };

            //init call
            $scope.getAllBaremetalInstanceData();
        }
    ]);
})(angular);
