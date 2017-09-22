// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';
    var p = ng.module('plugins');
    p.controller('HardwareOneviewController', [
        '$scope', '$translate', 'log', '$q', 'bllApiRequest', 'addNotification', '$window', '$timeout',
        '$cookieStore', '$rootScope',
        function ($scope, $translate, log, $q, bllApiRequest, addNotification, $window, $timeout,
                  $cookieStore, $rootScope) {
            $scope.hardwareData = [];
            $scope.hardwareDataLoading = true;
            var oneviewNames = []; //for dynamic filters for oneview name

            $scope.showModalOverlayFlag = false;
            $scope.showRemoveServerConfirmModalFlag = false;
            $scope.activateTaskList = [];
            $scope.enableAutoActivate = false;

            //"is_foundation_installed":"True" in opscon_config.json
            //allow auto activate in create cluster
            if($rootScope.appConfig &&
               angular.isDefined($rootScope.appConfig.is_foundation_installed) && (
                $rootScope.appConfig.is_foundation_installed === "true"  ||
                $rootScope.appConfig.is_foundation_installed === "True"  ||
                $rootScope.appConfig.is_foundation_installed === true)) {
                $scope.enableAutoActivate = true;
            }

            $scope.showConfirmReserveHardwareModalFlag = false;
            $scope.showConfirmUnreserveHardwareModalFlag = false;

            var isValidForCreateCluster = function (dataArray) {
                // check that all servers:
                // - have no cluster_id
                // - in Bare-metal/Unprovisioned state
                // - have the same oneview_id
                // - have the same hardware_type_uri
                // - have the same enclosure_group_uri
                var datum, oneview, hardware, enclosure;
                for (var i = 0; i < dataArray.length; i++) {
                    datum = dataArray[i];
                    if (angular.isDefined(datum.cluster_id) && datum.cluster_id.length > 0) {
                        return false;
                    }

                    if (datum.ace_state !== 'Bare-metal' && datum.ace_state !== 'Unprovisioned') {
                        return false;
                    }

                    //it is reserved
                    if (datum.ace_status === 'Allocated') {
                        return false;
                    }

                    if (!angular.isDefined(oneview)) {
                        oneview = datum.oneview_id;
                    } else {
                        if (oneview !== datum.oneview_id) {
                            return false;
                        }
                    }

                    if (!angular.isDefined(hardware)) {
                        hardware = datum.hardware_type_uri;
                    } else {
                        if (hardware !== datum.hardware_type_uri) {
                            return false;
                        }
                    }

                    if (!angular.isDefined(enclosure)) {
                        enclosure = datum.enclosure_group_uri;
                    } else {
                        if (enclosure !== datum.enclosure_group_uri) {
                            return false;
                        }
                    }
                }
                return true;
            };

            var multiSelectActionButtonsPermissionCheck = function (data, actionName) {
                if (actionName === 'createCluster' && !angular.isUndefined(data)) {
                    if (!isValidForCreateCluster(data)) {
                        return {
                            //TODO: ok for one button to show or not
                            // if we want to go with >2 buttons, it depends on whether
                            // create cluster is the first button...if it is the first
                            // button and other button also has some restrictions,
                            // need more work at the octable side
                            hidden: false,
                            enabled: false
                        };
                    }
                }

                return {
                    hidden: false,
                    enabled: true
                };
            };

            var isReservable = function (state) {
                if (!angular.isDefined(state)) {
                    return false;
                }

                if (state === 'Bare-metal' ||
                    state === 'Unprovisioned' ||
                    state === 'Profile-Applied' ||
                    state === 'Imported' ||
                    state === 'Provisioned') {
                    return true;
                }

                return false;
            };

            $scope.actionMenuPermissionsCheck = function (data, actionName) {
                var actionPermissions = {
                    enabled: true,
                    hidden: true
                };

                if (actionName === 'reserveHardware') {
                    //show reserve action
                    if (data.ace_status === 'Available' &&
                        data.usedby_raw === '' &&
                        isReservable(data.ace_state)) {
                        actionPermissions.hidden = false;
                    }
                }
                else if (actionName === 'unreserveHardware') {
                    //show unreserve action
                    if (data.ace_status === 'Allocated' && data.usedby_raw === 'reserved') {
                        actionPermissions.hidden = false;
                    }
                }

                return actionPermissions;
            };

            //table config
            $scope.hardwareTableConfig = {
                headers: [{
                    name: $translate.instant("compute.hardware.name"),
                    type: "string",
                    displayfield: "name",
                    sortfield: 'name',
                    highlightExpand: true,
                    isNotHtmlSafe: true
                }, {
                    name: $translate.instant("compute.hardware.model"),
                    type: "string",
                    displayfield: "short_model",
                    sortfield: 'short_model'
                }, {
                    name: $translate.instant("compute.hardware.power"),
                    type: "string",
                    displayfield: "power_state",
                    sortfield: 'power_state',
                    filterOptions: [{
                        displayLabel: $translate.instant('compute.hardware.power.on'),
                        value: 'On'
                    }, {
                        displayLabel: $translate.instant('compute.hardware.power.off'),
                        value: 'Off'
                    }, {
                        displayLabel: $translate.instant('common.unknown'),
                        value: 'Unknown'
                    }]
                }, {
                    name: $translate.instant("common.state"),
                    type: "string",
                    displayfield: "ace_state",
                    sortfield: 'ace_state',
                    filterOptions: [{
                        displayLabel: $translate.instant('compute.hardware.state.unprovisioned'),
                        value: 'Unprovisioned'
                    }, {
                        displayLabel: $translate.instant('compute.hardware.state.provisioning'),
                        value: 'Provisioning'
                    }, {
                        displayLabel: $translate.instant('compute.hardware.state.provisioned'),
                        value: 'Provisioned'
                    }, {
                        displayLabel: $translate.instant('compute.hardware.state.profileapplied'),
                        value: 'Profile-Applied'
                    }, {
                        displayLabel: $translate.instant('compute.hardware.state.unprovisioning'),
                        value: 'Unprovisioning'
                    }]
                }, {
                    name: $translate.instant("compute.hardware.usedby"),
                    type: "string",
                    displayfield: "usedby",
                    sortfield: 'usedby',
                    filterOptions: [{
                        displayLabel: $translate.instant('compute.hardware.reserved'),
                        value: 'Reserved'
                    }]
                }, {
                    name: $translate.instant("compute.hardware.ov_appliance"),
                    type: "string",
                    displayfield: "oneview_name",
                    sortfield: 'oneview_name'
                },
                {
                    name: $translate.instant("compute.hardware.hypervisor"),
                    type: "string",
                    displayfield: "hypervisor",
                    sortfield: 'hypervisor',
                    specialColumnType: 'custom',
                    customDisplayFilter: function(data) {
                        if (angular.isUndefined(data.hypervisor)) {
                            return data.hypervisor;
                        } else {
                            switch(data.hypervisor) {
                                case 'ESX':
                                    return $translate.instant('compute.hardware.hypervisor.esx');
                                case 'HPEL-KVM':
                                    return $translate.instant('compute.hardware.hypervisor.hpel_kvm');
                                case 'RHEL-KVM':
                                    return $translate.instant('compute.hardware.hypervisor.rhel_kvm');
                                case 'HyperV':
                                    return $translate.instant('compute.hardware.hypervisor.hyperv');
                                case 'Undetermined':
                                    return $translate.instant('compute.hardware.hypervisor.undetermined');
                            }
                        }
                    },
                    filterOptions: [{
                        displayLabel: $translate.instant('compute.hardware.hypervisor.esx'),
                        value: 'ESX'
                    }, {
                        displayLabel: $translate.instant('compute.hardware.hypervisor.hpel_kvm'),
                        value: 'HPEL-KVM'
                    }, {
                        displayLabel: $translate.instant('compute.hardware.hypervisor.rhel_kvm'),
                        value: 'RHEL-KVM'
                    }, {
                        displayLabel: $translate.instant('compute.hardware.hypervisor.hyperv'),
                        value: 'HyperV'
                    }, {
                        displayLabel: $translate.instant('compute.hardware.hypervisor.undetermined'),
                        value: 'Undetermined'
                    }]
                }],

                pageConfig: {
                    pageSize: 20
                },

                actionMenuConfigFunction: $scope.actionMenuPermissionsCheck,

                actionMenuConfig: [{
                    label: 'compute.hardware.reserve',
                    name: 'reserveHardware',
                    action: function (data) {
                        $scope.showConfirmReserveHardwareModal(data);
                    }
                }, {
                    label: 'compute.hardware.unreserve',
                    name: 'unreserveHardware',
                    action: function (data) {
                        $scope.showConfirmUnreserveHardwareModal(data);
                    }
                }],

                multiSelectActionMenuConfigFunction: multiSelectActionButtonsPermissionCheck,

                multiSelectActionMenuConfig: [{
                    label: 'compute.hardware.create_cluster',
                    name: 'createCluster',
                    action: function(data) {
                        var expiresAt = $cookieStore.get('auth_cookie').expires_at;
                        var expiresTime = new Date(expiresAt).getTime();
                        var neededTime = moment(new Date()).add(90, 'm').valueOf();
                        if (expiresTime >= neededTime) {
                            showCreateClusterModal(data);
                        } else {
                            $scope.showNotEnoughTimeModalFlag = true;
                        }
                    }
                }]
            };

            var populateOneviewNamesFilterOptions = function() {
                if (angular.isDefined(oneviewNames) && oneviewNames.length > 0) {
                    var options = oneviewNames.map(function (name) {
                        return {
                            displayLabel: name,
                            value: name
                        };
                    });
                    //find oneview name header
                    $scope.hardwareTableConfig.headers.forEach(function(header) {
                        if(header.displayfield === 'oneview_name') {
                            header.filterOptions = options;
                        }
                    });
                }
            };

            $scope.getAllHardwareData = function () {
                $scope.getHardwareTableData().then(function () {
                    $scope.hardwareDataLoading = false;
                    populateOneviewNamesFilterOptions();
                });
            };

            $scope.getHardwareTableData = function () {
                $scope.hardwareDataLoading = true;
                $scope.hardwareData = [];
                oneviewNames = [];

                var defer = $q.defer();
                var promises = [];
                promises.push(callBLLForHardwareData());
                $q.all(promises).then(defer.resolve, defer.reject);
                return defer.promise;
            };

            var getDataListFromArray = function (array) {
                if (angular.isDefined(array) && Array.isArray(array) &&
                    array.length > 0) {
                    return array.join(',');
                }
                return $translate.instant('common.not_applicable');
            };

            var getUsedByRaw = function (datum) {
                if (angular.isDefined(datum.ace_cluster_id) && datum.ace_cluster_id !== '') {
                    return datum.ace_cluster_name;
                }

                if (angular.isDefined(datum.ace_status) &&
                    datum.ace_status === 'Allocated' &&
                    isReservable(datum.ace_state)) {
                    return 'reserved';
                }

                return '';
            };

            var getUsedBy = function (datum) {
                var usedByRaw = getUsedByRaw(datum);

                if (usedByRaw === 'reserved') {
                    return "Reserved"; //not localized for now
                }
                else if (usedByRaw === '') {
                    return $translate.instant('common.not_applicable');
                }

                return usedByRaw;
            };

            // used to track if other 'threads' are loading the same data
            $scope.loadingHardwareData = false;

            var callBLLForHardwareData = function () {
                if($scope.loadingHardwareData) {
                    //wait a little if we are still loading.
                    $timeout(callBLLForHardwareData, 1000);
                    return;
                }

                ///ace/v1/servers
                var req = {
                    'operation': 'servers.list'
                };
                $scope.loadingHardwareData = true;

                return bllApiRequest.get('ace', req).then(
                    function (response) {
                        var serverData = response.data || [];
                        serverData.forEach(function (datum) {
                            var obj = {
                                'id': datum.id,
                                'name': datum.name,
                                'short_model': datum.short_model,
                                'model': datum.capability ? datum.capability.model : datum.model, //long model
                                'power_state': datum.power_state ? datum.power_state : 'Unknown',
                                'ace_state': datum.ace_state, //Provisioned, Provisioning, Unprovisioned, Profile-Applied, Unprovisioning
                                'ace_status': datum.ace_status, //Available, Allocated, Unknown, Down
                                'status': angular.isDefined(datum.status) ? datum.status : 'Unknown',
                                'ov_appliance': datum.oneview_name,
                                'oneview_id': datum.oneview_id,
                                'oneview_name': datum.oneview_name,
                                'profile_name': datum.profile_name,
                                'cluster_name': datum.ace_cluster_name,
                                'cluster_id': datum.ace_cluster_id,
                                'usedby_raw': getUsedByRaw(datum),
                                'usedby': getUsedBy(datum),
                                'hypervisor': datum.capability ? datum.capability.hypervisor : datum.ace_hypervisor,
                                'form_factor': datum.form_factor,
                                'logical_enclosure': datum.ace_logical_enclosure_name,
                                'memory': datum.capability ? datum.capability.memory_mb : datum.RAM,
                                'processor_count': datum.capability ? datum.capability.core_count : datum.core_count,
                                'processor_speed': datum.capability ? datum.capability.processor_speed_mhz : datum.processor_speed,
                                'processor_type': datum.capability ? datum.capability.processor_type : datum.processor_type,
                                'gpu': datum.capability ? datum.capability.GPU : datum.GPU,
                                'server_profile_templates': datum.server_profile_templates,
                                'hardware_type_uri': datum.hardware_type_uri,
                                'enclosure_group_uri': datum.enclosure_group_uri,
                                'local_storage': getDataListFromArray(datum.capability ? datum.capability.local_storage : datum.local_storage),
                                'storage_type': getDataListFromArray(datum.capability ? datum.capability.SAN_storage : datum.SAN_storage),
                                'storage_pool_device_type': getDataListFromArray(datum.capability ? datum.capability.storage_type : datum.storage_type),
                                'storage_pool_raid': getDataListFromArray(datum.capability ? datum.capability.storage_RAID : datum.storage_RAID),
                                'serial_number': datum.serial_number
                            };
                            $scope.hardwareData.push(obj);

                            //saved the names for filtering
                            if(angular.isDefined(datum.oneview_name) &&
                               datum.oneview_name.length > 0) {
                                if (oneviewNames.indexOf(datum.oneview_name) === -1) {
                                    oneviewNames.push(datum.oneview_name);
                                }
                            }
                        });
                        $scope.loadingHardwareData = false;
                    }, function (error_data) {
                        $scope.loadingHardwareData = false;
                        addNotification(
                            "error",
                            $translate.instant("compute.hardware.table.data.error"));
                        log('error', 'Failed to get compute hardware server data');
                        log('error', 'error data = ' + JSON.stringify(error_data));
                    }
                );
            };

            $scope.activateClusterServerTableConfig = {
                headers: [{
                    name: $translate.instant("compute.hardware.name"),
                    type: "string",
                    displayfield: "name",
                    sortfield: 'name'
                }, {
                    name: $translate.instant("compute.hardware.model"),
                    type: "string",
                    displayfield: "model",
                    sortfield: 'model'
                }, {
                    name: $translate.instant("compute.hardware.logical_enclosure"),
                    type: "string",
                    displayfield: "logical_enclosure",
                    sortfield: 'logical_enclosure'
                }],

                actionMenuConfig: [{
                    label: 'common.remove',
                    name: 'removeServer',
                    action: function (data) {
                        $scope.showRemoveServerConfirmModalFlag = true;
                    }
                }],

                actionMenuConfigFunction: function () {
                    // enable the remove menu when there are more than one server on the table and
                    // disable the menu when there's one server left so that at least one server
                    // is available for the cluster creation
                    if ($scope.activateClusterServerData.length > 1) {
                        return {enabled: true};
                    } else {
                        return {enabled: false};
                    }
                },

                pageConfig: {
                    pageSize: 5
                }
            };

            var showCreateClusterModal = function (data) {
                $scope.showCreateClusterModalFlag = true;
                $scope.showServerGroupFlag = false;
                $scope.$broadcast('ocInputReset');
                $scope.showServerPassword = false;
                $scope.createClusterDataLoading = true;
                $scope.buildPlanListLoaded = false;
                $scope.vcenterListLoaded = false;
                $scope.storageListLoaded = false;

                $scope.inputClusterName = '';
                $scope.inputBuildPlan = '';
                $scope.inputServerPassword = '';
                $scope.inputVcenterName = '';
                $scope.inputDatacenterName = '';
                $scope.inputDvsName = "";

                $scope.activateClusterServerData = angular.copy(data);
                $scope.oneview_id = $scope.activateClusterServerData[0].oneview_id;

                if ($scope.enableAutoActivate) {
                    $scope.autoActivateSelected = true;
                }
                else {
                    $scope.autoActivateSelected = false;
                }

                $scope.inputMgmtTrunkName = "";
                $scope.inputMgmtTrunkInterface = "";
                $scope.inputMgmtTrunkMtu = "1500";
                $scope.cloudTrunkList = [];

                // get Profile Templates
                var templates = $scope.activateClusterServerData[0].server_profile_templates;
                if (templates !== null && templates.length > 0) {
                    $scope.profileTemplateList = templates.map(function (template) {
                        return {label: template.name, value: template.name};
                    });
                    $scope.inputProfileTemplate = $scope.profileTemplateList[0].value;
                }

                // get Build Plans
                bllApiRequest.get('ace', {operation: 'oneviews.get', ov_id: $scope.oneview_id}).then(
                    function (data) {
                        var buildPlans = data.data.build_plans;
                        if (buildPlans !== null && buildPlans.length > 0) {
                            // Build Plan names are forced by ACE to conform to
                            // a scheme where there are several sections
                            // separated by dashes.  Present only those
                            // whose second section (OS type) starts with ESX
                            buildPlans = buildPlans.filter(function (bp) {
                               var sections = bp.name.split("-");
                               return sections[1].indexOf("ESX") === 0;
                            });
                            $scope.buildPlanList = buildPlans.map(function (bp) {
                                return {label: bp.name, value: bp.name};
                            });
                            $scope.inputBuildPlan = $scope.buildPlanList[0].value;
                        }
                        $scope.buildPlanListLoaded = true;
                        checkCreateClusterDataLoaded();
                    },
                    function (error) {
                        var msg = error.data;
                        log('error', "Can't get Build Plan information: " + msg);
                        addNotification('error', $translate.instant('compute.hardware.create_cluster.get_template_error',
                            {details: msg}));
                        $scope.buildPlanListLoaded = true;
                        checkCreateClusterDataLoaded();
                    }
                );

                // get vCenter names registered with OneView
                bllApiRequest.get('ace', {operation: 'ovvcenters.list'}).then(
                    function (data) {
                        var vcenters = data.data;
                        if (vcenters !== null && vcenters.length > 0) {
                            $scope.vcenterList = vcenters.map(function (vc) {
                                return {label: vc.host, value: vc.host};
                            });
                            $scope.inputVcenterName = $scope.vcenterList[0].value;
                        }
                        $scope.vcenterListLoaded = true;
                        checkCreateClusterDataLoaded();
                    },
                    function (error) {
                        var msg = error.data;
                        log('error', "Can't get vCenter information: " + msg);
                        addNotification('error', $translate.instant('compute.hardware.create_cluster.get_vcenter_error',
                            {details: msg}));
                        $scope.vcenterListLoaded = true;
                        checkCreateClusterDataLoaded();
                    }
                );

                // get shared disks
                var req = {
                    operation: 'volumes.list',
                    oneview_id: $scope.oneview_id,
                    search_opts: {shareable: true, notinuse: true}
                };
                bllApiRequest.get('ace', req).then(
                    function (data) {
                        var storage = data.data;
                        if (storage !== null && storage.length > 0) {
                            $scope.sharedStorageList = storage.map(function (disk) {
                                return {label: disk.name, value: disk.uri};
                            });
                        }
                        $scope.storageListLoaded = true;
                        checkCreateClusterDataLoaded();
                    },
                    function (error) {
                        var msg = error.data[0].data;
                        log('error', "Can't get shared storage information: " + msg);
                        addNotification('error', $translate.instant('compute.hardware.create_cluster.get_storage_error',
                            {details: msg}));
                        $scope.storageListLoaded = true;
                        checkCreateClusterDataLoaded();
                    }
                );
            };

            $scope.toggleServerPassword = function () {
                $scope.showServerPassword = !$scope.showServerPassword;
            };

            var checkCreateClusterDataLoaded = function () {
                $scope.createClusterDataLoading = !($scope.buildPlanListLoaded && $scope.vcenterListLoaded &&
                $scope.storageListLoaded);
            };

            $scope.removeServerFromActivateList = function () {
                var removeServerIndex = 0;
                for (var i = 0; i < $scope.activateClusterServerData.length; i++) {
                    if ($scope.activateClusterServerData[i].$actionMenuOpen) {
                        removeServerIndex = i;
                        break;
                    }
                }
                $scope.activateClusterServerData.splice(removeServerIndex, 1);
                $scope.showRemoveServerConfirmModalFlag = false;
            };

            $scope.$watch('inputDvsName', function () {
                $scope.inputMgmtTrunkName = $scope.inputDvsName;
            });

            $scope.checkClusterConfigData = function (modalFormInvalid) {
                if (modalFormInvalid) {
                    return modalFormInvalid;
                } else {
                    var g = getSelectedStorageList().length;
                    if (!$scope.autoActivateSelected) {
                        return getSelectedStorageList().length === 0;
                    } else {
                        return $scope.cloudTrunkList.length === 0 || getSelectedStorageList().length === 0;
                    }

                }
            };

            var getSelectedStorageList = function () {
                if (angular.isDefined($scope.sharedStorageList) && $scope.sharedStorageList.length > 0) {
                    return $scope.sharedStorageList.filter(function (disk) {
                        return disk.$selected === true;
                    });
                } else {
                    return [];
                }
            };

            $scope.clustersCreated = 0;
            $scope.clustersCreatedIncremented = null;
            $scope.createCluster = function () {
                $scope.showCreateClusterModalFlag = false;
                $scope.clustersCreated++;

                //if it has been more than 10 minutes we can reset the cluster count
                if($scope.clustersCreatedIncremented && Math.abs($scope.clustersCreatedIncremented.diff(moment())) > 6e5) {
                    $scope.clustersCreated = 1;
                }
                $scope.clustersCreatedIncremented = moment();
                var clusterCount = $scope.clustersCreated;
                var req = {
                    operation: 'cluster.create',
                    ov_id: $scope.oneview_id,
                    cluster_name: $scope.inputClusterName,
                    hypervisor: $scope.inputVcenterName,
                    data_center: $scope.inputDatacenterName,
                    server_profile_template: $scope.inputProfileTemplate,
                    build_plan: $scope.inputBuildPlan,
                    server_password: $scope.inputServerPassword,
                    server_ids: $scope.activateClusterServerData.map(function (server) {
                        return server.id;
                    }),
                    dhcp: true,
                    volumes: getSelectedStorageList().map(function (disk) {
                        return disk.value;
                    }),
                    switch_name: $scope.inputDvsName
                };
                if ($scope.autoActivateSelected) {
                    req.network_config = {
                        mgmt_trunk: [{
                            name: $scope.inputMgmtTrunkName,
                            nics: $scope.inputMgmtTrunkInterface,
                            mtu: $scope.inputMgmtTrunkMtu
                        }],
                        cloud_trunks: $scope.cloudTrunkList.map(function (ct) {
                            return {name: ct.name, nics: ct.nics, mtu: ct.mtu, network_name: ct.network_name};
                        })
                    };
                }
                var inProgress = 0;
                bllApiRequest.post('ace', req).then(
                    function (data) {
                        addNotification('info', $translate.instant('compute.hardware.create_cluster.create_finish_success',
                            {name: req.cluster_name}));
                        // OPSCON-2037 Change the time from 4 to 20 seconds since it
                        //             takes longer than 4 seconds to switch to the 
                        //             'Provisioning' ace state
                        $timeout(function() {$scope.getAllHardwareData();}, 20000 + (1000*clusterCount));
                    },
                    function (error) {
                      var msg;
                        if(error.status === 'error') {
                            msg = error.data[0];
                            log('error', "Cluster creation failed: " + msg);
                            addNotification('error', $translate.instant('compute.hardware.create_cluster.create_error',
                                {name: req.cluster_name, details: msg}));
                        } else if(error.status === 'warning') {
                            msg = error.data;
                            log('warn', "Warning on cluster creation: " + msg);
                            addNotification(
                              'error',
                              $translate.instant('compute.hardware.create_cluster.create_warning',
                                {name: req.cluster_name, details: msg})
                            );
                        }
                        $timeout(function() {$scope.getAllHardwareData();}, 20000 + (1000*clusterCount));
                    },
                    function (progress) {
                        if (inProgress === 0) {
                            inProgress++;
                            addNotification('info', $translate.instant('compute.hardware.create_cluster.create_start_success',
                                {name: req.cluster_name}));
                            $timeout(function() {$scope.getAllHardwareData();}, 20000 + (1000*clusterCount));
                        }
                    }
                );
            };

            $scope.showConfirmReserveHardwareModal = function (data) {
                $scope.showConfirmReserveHardwareModalFlag = true;
                $scope.selectedData = data;
            };

            $scope.showConfirmUnreserveHardwareModal = function (data) {
                $scope.showConfirmUnreserveHardwareModalFlag = true;
                $scope.selectedData = data;
            };

            //reserve hardware
            $scope.commitReserveHardware = function () {
                var req = {
                    'operation': 'servers.allocate',
                    'server_uuid': $scope.selectedData.id
                };
                $scope.showModalOverlayFlag = true;
                bllApiRequest.post('ace', req).then(
                    function (response) {
                        addNotification(
                            "info",
                            $translate.instant(
                                "compute.hardware.reserve.success",
                                {'name': $scope.selectedData.name}
                            )
                        );
                        log('info',
                            'Successfully reserved hardware ' +
                            $scope.selectedData.name
                        );
                        $scope.showConfirmReserveHardwareModalFlag = false;
                        $scope.showModalOverlayFlag = false;
                        //refresh the table
                        $scope.getAllHardwareData();
                    },
                    function (error_data) {
                        addNotification(
                            "error",
                            $translate.instant(
                                "compute.hardware.reserve.error",
                                {'name': $scope.selectedData.name}
                            )
                        );
                        log('error',
                            'Failed to reserve hardware' + $scope.selectedData.name
                        );
                        log('error', 'error data = ' + JSON.stringify(error_data));
                        $scope.showConfirmReserveHardwareModalFlag = false;
                        $scope.showModalOverlayFlag = false;
                    }
                );
            };

            //unreserve hardware
            $scope.commitUnreserveHardware = function () {
                var req = {
                    'operation': 'servers.free',
                    'server_uuid': $scope.selectedData.id
                };
                $scope.showModalOverlayFlag = true;
                bllApiRequest.post('ace', req).then(
                    function (response) {
                        addNotification(
                            "info",
                            $translate.instant(
                                "compute.hardware.unreserve.success",
                                {'name': $scope.selectedData.name}
                            )
                        );
                        log('info',
                            'Successfully unreserved hardware ' +
                            $scope.selectedData.name
                        );
                        $scope.showConfirmUnreserveHardwareModalFlag = false;
                        $scope.showModalOverlayFlag = false;
                        //refresh the table
                        $scope.getAllHardwareData();
                    },
                    function (error_data) {
                        addNotification(
                            "error",
                            $translate.instant(
                                "compute.hardware.unreserve.error",
                                {'name': $scope.selectedData.name}
                            )
                        );
                        log('error',
                            'Failed to unreserve hardware' + $scope.selectedData.name
                        );
                        log('error', 'error data = ' + JSON.stringify(error_data));
                        $scope.showConfirmUnreserveHardwareModalFlag = false;
                        $scope.showModalOverlayFlag = false;
                    }
                );
            };

            //init call
            $scope.getAllHardwareData();
        }
    ]);
})(angular);
