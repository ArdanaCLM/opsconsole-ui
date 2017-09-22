// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';
    var p = ng.module('plugins');
    p.controller('HardwareBaremetalController', [
        '$scope', '$translate', 'log', '$q', 'bllApiRequest', 'addNotification', '$window', '$timeout',
        '$cookieStore', '$rootScope', 'updateEmptyDataPage',
        function ($scope, $translate, log, $q, bllApiRequest, addNotification, $window, $timeout,
                  $cookieStore, $rootScope, updateEmptyDataPage) {

            //this is the controller extracted out of hardwareOneviewController
            //original owner is "ravinshy"

            //deal with empty data page for baremetal
            $scope.showEmptyDataPageBaremetalFlag = false;
            $scope.emptyDataPage = {'baremetal': {}};
            $scope.initBareMetalDataLoading = true;
            $scope.infoBareMetalModalFlag = false;

            $scope.os_type_select_options = [
                {
                    label: $translate.instant("compute.baremetal.register.input.ostype.select.hlinux"),
                    value: "hlinux"
                },
                {
                    label: $translate.instant("compute.baremetal.register.input.ostype.select.rhel"),
                    value: "rhel"
                }
            ];

            $scope.boot_type_select_options = [
                {
                    label: $translate.instant("compute.baremetal.register.input.boottype.select.SAN"),
                    value: "SAN"
                },
                {
                    label: $translate.instant("compute.baremetal.register.input.boottype.select.local"),
                    value: "local"
                }
            ];

            $scope.statusDisplayFunction = function (data) {
                return $translate.instant('compute.baremetal.table.status.' + data.status);
            };

            $scope.stateDisplayFunction = function (data) {
                return $translate.instant('compute.baremetal.table.state.' + data.state);
            };

            $scope.bareMetalTypeDisplayFunction = function (data) {
                return $translate.instant('compute.baremetal.table.type.' + data.type);
            };

            $scope.multiSelectActionMenuPermissionsCheck = function (data, actionName) {
                if (data.length > 1 && actionName === 'multiSelectActionProvisionBareMetal') {
                    return {
                        hidden: false,
                        enabled: false
                    };
                }
                if (data.length > 1 && actionName === 'multiSelectActionEditBareMetal') {
                    return {
                        hidden: false,
                        enabled: false
                    };
                }

                return {
                    hidden: false,
                    enabled: true
                };
            };

            $scope.actionMenuPermissionsCheck = function (data, actionName) {//rename and document this
                var actionPermissions = {
                    enabled: true,
                    hidden: false
                };
                if ($scope.selectedDatas === undefined) {
                    $scope.selectedDatas = [];
                }
                if ($scope.selectedDatas.length > 1 && actionName === 'provision') {
                    return {
                        hidden: false,
                        enabled: false
                    };
                }
                if ($scope.selectedDatas.length > 1 && actionName === 'edit') {
                    return {
                        hidden: false,
                        enabled: false
                    };
                }
                if ((actionName === 'provision' || actionName === 'edit' || actionName === 'delete') && data.state === 'provisioning') {
                    return {
                        hidden: false,
                        enabled: false
                    };
                }


                return actionPermissions;
            };

            $scope.bareMetalRowSelectionCheck = function (data) {
                if (data.state === 'provisioning') {
                    return false;
                }
                return true;
            };

            $scope.baremetal_list = function () {
                $scope.emptyDataPage.baremetal = {};
                $scope.bare_metal_list = [];
                $scope.bareMetalDataLoading = true;
                var request = {
                    'operation': 'list_baremetal'
                };
                bllApiRequest.get("baremetal", request).then(
                    function (data) {
                        $scope.bare_metal_list = [];
                        //show empty data page
                        if (!angular.isDefined(data) || !angular.isDefined(data.data) ||
                            data.data.length === 0) {
                            $scope.showEmptyDataPageBaremetalFlag = true;
                            updateEmptyDataPage(
                                $scope.emptyDataPage.baremetal, 'nodata',
                                $translate.instant('compute.baremetal.empty.data'),
                                '',
                                'compute.baremetal.empty.data.action_label',
                                $scope.registerBareMetalDilogue
                            );
                        }
                        else { //show table
                            angular.forEach(data.data, function (bare_metal_list_data) {
                                if (bare_metal_list_data.meta_data[0] !== undefined) {
                                    for (var i = 0; i < bare_metal_list_data.meta_data.length; i++) {
                                        if (bare_metal_list_data.meta_data[i].name === "ilo_user") {
                                            bare_metal_list_data.ilo_user = bare_metal_list_data.meta_data[i].value;
                                        } else if (bare_metal_list_data.meta_data[i].name === "mac_addr") {
                                            bare_metal_list_data.mac_address = bare_metal_list_data.meta_data[i].value;
                                        } else if (bare_metal_list_data.meta_data[i].name === "ilo_password") {
                                            bare_metal_list_data.ilo_password = bare_metal_list_data.meta_data[i].value;
                                        } else if (bare_metal_list_data.meta_data[i].name === "ilo_ip") {
                                            bare_metal_list_data.ilo_ip = bare_metal_list_data.meta_data[i].value;
                                        } else {
                                            bare_metal_list_data.ilo_user = "";
                                            bare_metal_list_data.mac_address = "";
                                            bare_metal_list_data.ilo_ip = "";
                                        }
                                    }
                                } else {
                                    bare_metal_list_data.ilo_user = "";
                                    bare_metal_list_data.mac_address = "";
                                    bare_metal_list_data.ilo_ip = "";
                                }
                                $scope.bare_metal_list.push(bare_metal_list_data);
                            });
                        }
                        $scope.bareMetalDataLoading = false;

                        //only show initBareMetalDataLoading at very first time
                        if ($scope.initBareMetalDataLoading === true) {
                            $scope.initBareMetalDataLoading = false;
                        }
                    },
                    function (error_data) {
                        $scope.bareMetalDataLoading = false;
                        var errorReason =
                            error_data.data ? error_data.data[0].data : '';
                        var errorMsg = $translate.instant(
                            "compute.baremetal.list.error",
                            {'reason': errorReason}
                        );
                        addNotification('error', errorMsg);

                        //show empty data page for error
                        $scope.showEmptyDataPageBaremetalFlag = true;
                        updateEmptyDataPage(
                            $scope.emptyDataPage.baremetal,
                            'servererror',
                            errorMsg,
                            'common.empty.data.checkbackend',
                            'common.reload.table',
                            $scope.baremetal_list
                        );

                        //only show initComputeDataLoading at very first time
                        if ($scope.initBareMetalDataLoading === true) {
                            $scope.initBareMetalDataLoading = false;
                        }
                    }
                );
            };

            if ($rootScope.appConfig.env === "legacy") {
                // Function to get the baremetal list
                $scope.baremetal_list();
            }

            $scope.inputPass = false;
            $scope.toggleShowPassword = function () {
                $scope.inputPass = !$scope.inputPass;
            };

            $scope.inputOsPass = false;
            $scope.toggleShowOsPassword = function () {
                $scope.inputOsPass = !$scope.inputOsPass;
            };

            $scope.registerBareMetalVisible = false;
            $scope.registerBareMetalTemplate = "compute/templates/hardware/register_bare_metal.html";
            $scope.registerBareMetalDilogue = function () {
                $scope.baremetalRegisterDisable = false;
                $scope.bareMetalIfRegisterInProgress = false;
                $scope.baremetalname = "";
                $scope.baremetalmacaddress = "";
                $scope.baremetalipaddress = "";
                $scope.baremetaliloipaddress = "";
                $scope.baremetalilousername = "";
                $scope.baremetalilopassword = "";
                $scope.baremetalostype = "";
                $scope.baremetalBootType = "SAN";
                $scope.baremetalosusername = "stack";
                $scope.baremetalospassword = "";
                $scope.baremetalosport = "";
                //clean the form
                if (angular.isDefined($scope.registerBareMetalFormInput)) {
                    $scope.registerBareMetalFormInput.$setPristine();
                }
                $scope.registerBareMetalVisible = !$scope.registerBareMetalVisible;
            };

            $scope.editBareMetalVisible = false;
            $scope.editBareMetalTemplate = "compute/templates/hardware/edit_bare_metal.html";
            $scope.editBareMetalDilogue = function (data) {
                $scope.baremetalRegisterDisable = false;
                $scope.bareMetalIfUpdateInProgress = false;
                $scope.editBareMetalHeader = data.name;
                $scope.editBareMetalDatas = data;
                $scope.editBareMetalData_name = data.name;
                $scope.editBareMetalData_mac_address = data.mac_address;
                $scope.editBareMetalData_ilo_ip = data.ilo_ip;
                $scope.editBareMetalData_ilo_user = data.ilo_user;
                $scope.editBareMetalData_ip_address = data.ip_address;
                $scope.editBareMetalData_username = "stack";
                $scope.editBareMetalData_password = "";
                $scope.editBareMetalData_ilo_password = "";
                //clean the form
                if (angular.isDefined($scope.editBareMetalFormInput)) {
                    $scope.editBareMetalFormInput.$setPristine();
                }
                $scope.editBareMetalVisible = !$scope.editBareMetalVisible;
            };

            $scope.provisionBareMetalVisible = false;
            $scope.provisionBareMetalTemplate = "compute/templates/hardware/provision_bare_metal.html";
            $scope.provisionBareMetalDilogue = function (data) {
                $scope.baremetalRegisterDisable = false;
                $scope.bareMetalProvisionDone = false;
                $scope.baremetalprovisionBootType = "SAN";
                $scope.baremetalprovisionosusername = "stack";
                $scope.baremetalprovisionospassword = "";
                //clean the form
                if (angular.isDefined($scope.provisionBareMetalFormInput)) {
                    $scope.provisionBareMetalFormInput.$setPristine();
                }
                $scope.provisionBareMetalData = data;
                $scope.provisionBareMetalVisible = !$scope.provisionBareMetalVisible;
            };

            $scope.removeBareMetalModalFlag = false;
            $scope.unregisterBareMetal = function (data) {
                var bareMetalNames = [];
                angular.forEach(data, function (data) {
                    bareMetalNames.push(data.name);
                });
                $scope.deleteBaremetalMessage = $translate.instant("compute.remove.baremetal.modal.content", {
                    name: bareMetalNames.join(", ")
                });
                $scope.unregisterBareMetalData = data;
                $scope.removeBareMetalModalFlag = true;
            };

            $scope.closeRemoveBareMetalmodal = function () {
                $scope.removeBareMetalModalFlag = false;
            };

            $scope.bare_metal_table_config = {
                headers: [
                    {
                        name: $translate.instant("compute.baremetal.table.name"),
                        type: "caselessString",
                        displayfield: "name",
                        sortfield: 'name',
                        highlightExpand: true
                    },
                    {
                        name: $translate.instant('compute.baremetal.table.state'),
                        type: "caselessString",
                        displayfield: "state",
                        sortfield: 'state',
                        specialColumnType: 'custom',
                        customDisplayFilter: $scope.stateDisplayFunction,
                        filter: 'uppercase',
                        filterOptions: [{
                            displayLabel: $translate.instant('compute.baremetal.table.state.imported'),
                            value: 'imported'
                        }, {
                            displayLabel: $translate.instant('compute.compute_nodes.state.deleting'),
                            value: 'deleting'
                        }, {
                            displayLabel: $translate.instant('compute.baremetal.table.state.provisioning'),
                            value: 'provisioning'
                        }]
                    },
                    {
                        name: $translate.instant('compute.baremetal.table.macaddress'),
                        type: "string",
                        displayfield: "mac_address",
                        sortfield: 'meta_data[0].value'
                    },
                    {
                        name: $translate.instant('compute.baremetal.table.iloaddress'),
                        type: "string",
                        displayfield: "ilo_ip",
                        sortfield: 'ilo_ip'
                    },
                    {
                        name: $translate.instant('compute.baremetal.table.ilousername'),
                        type: "string",
                        displayfield: "ilo_user",
                        sortfield: 'ilo_user'
                    },
                    {
                        name: $translate.instant('compute.baremetal.table.ipaddress'),
                        type: "string",
                        displayfield: "ip_address",
                        sortfield: 'ip_address'
                    },
                    {
                        name: $translate.instant('compute.baremetal.table.ostype'),
                        type: "string",
                        displayfield: "type",
                        sortfield: 'type',
                        specialColumnType: 'custom',
                        customDisplayFilter: $scope.bareMetalTypeDisplayFunction
                    }
                ],
                multiSelectActionMenuConfigFunction: $scope.multiSelectActionMenuPermissionsCheck,
                multiSelectActionMenuConfig: [{
                    label: $translate.instant('compute.baremetal.table.menu.provision_bare_metal'),
                    name: 'multiSelectActionProvisionBareMetal',
                    action: function (data) {
                        $scope.provisionBareMetalDilogue(data[0]);
                    }
                }, {
                    label: $translate.instant('compute.baremetal.table.menu.edit_bare_metal'),
                    name: 'multiSelectActionEditBareMetal',
                    action: function (data) {
                        $scope.editBareMetalDilogue(data[0]);
                    }
                }, {
                    label: $translate.instant('compute.baremetal.table.menu.delete_bare_metal'),
                    name: 'multiSelectActionDeleteBareMetal',
                    action: function (data) {
                        $scope.unregisterBareMetal(data);
                    }
                }],

                globalActionsConfig: [{
                    label: $translate.instant('compute.baremetal.table.menu.register_bare_metal'),
                    name: 'multiSelectAction2',
                    action: function (data) {
                        $scope.registerBareMetalDilogue();
                    }
                }],
                actionMenuConfigFunction: $scope.actionMenuPermissionsCheck,
                actionMenuConfig: [{
                    label: $translate.instant("compute.baremetal.table.menu.provision_bare_metal"),
                    name: "provision",
                    action: function (data) {
                        $scope.provisionBareMetalDilogue(data);
                    }
                }, {
                    label: $translate.instant("compute.baremetal.table.menu.edit_bare_metal"),
                    name: "edit",
                    action: function (data) {
                        $scope.editBareMetalDilogue(data);
                    }
                }, {
                    label: $translate.instant("compute.baremetal.table.menu.delete_bare_metal"),
                    name: "delete",
                    action: function (data) {
                        var bareMetalList = [];
                        bareMetalList.push(data);
                        $scope.unregisterBareMetal(bareMetalList);
                    }
                }],
                pageConfig: {
                    pageSize: 20
                },
                rowSelectionCheck: $scope.bareMetalRowSelectionCheck,
                naValueCheck: $scope.checkNotApplicable
            };

            var checkForSANBoot = function (data) {
                return data === "SAN" ? "True" : "False";
            };

            $scope.registerBareMetalConfirm = function () {
                $scope.baremetalRegisterDisable = true;
                $scope.bareMetalIfRegisterInProgress = true;
                if ($scope.autoProvision === undefined) {
                    var request = {
                        'operation': 'register_baremetal',
                        "data": {
                            "name": $scope.baremetalname,
                            "mac_addr": $scope.baremetalmacaddress,
                            "ip_address": $scope.baremetalipaddress,
                            "ilo_ip": $scope.baremetaliloipaddress,
                            "ilo_user": $scope.baremetalilousername,
                            "ilo_password": $scope.baremetalilopassword,
                            "port": "none",
                            "type": "baremetal"

                        }
                    };
                    bllApiRequest.post("baremetal", request).then(
                        function (data) {
                            if (data.status === 'complete') {
                                $scope.baremetal_list();
                                $scope.baremetalRegisterDisable = true;
                                $scope.registerBareMetalVisible = !$scope.registerBareMetalVisible;
                                addNotification("info", $translate.instant("compute.notification.data", {
                                    name: $scope.baremetalname,
                                    details: data.data
                                }));
                            } else {
                                $scope.baremetal_list();
                                addNotification("error", $translate.instant("compute.notification.data", {
                                    name: $scope.baremetalname,
                                    details: data.data
                                }));
                                //show error modal
                                $scope.baremetalInfoRegisterModalBoxConfig = {
                                    header: $translate.instant("compute.baremetal.modal.header.error"),
                                    content: data.data
                                };
                                $scope.infoRegisterBareMetalModalFlag = true;
                            }
                        },
                        function (error_data) {
                            $scope.baremetal_list();
                            $scope.baremetalRegisterDisable = false;
                            $scope.bareMetalIfRegisterInProgress = false;
                            addNotification('error', $translate.instant("compute.baremetal.register.error", {error_data: error_data.data[0].data}));
                            //show error modal
                            $scope.baremetalInfoRegisterModalBoxConfig = {
                                header: $translate.instant("compute.baremetal.modal.header.error"),
                                content: $translate.instant("compute.baremetal.register.error", {
                                    name: $scope.baremetalname,
                                    error_data: error_data.data[0].data
                                })
                            };
                            $scope.infoRegisterBareMetalModalFlag = true;
                        }
                    );

                } else {
                    var request_auto_provision = {
                        'operation': 'provision_baremetal',
                        "data": {
                            "name": $scope.baremetalname,
                            "mac_addr": $scope.baremetalmacaddress,
                            "ip_address": $scope.baremetalipaddress,
                            "ilo_ip": $scope.baremetaliloipaddress,
                            "ilo_user": $scope.baremetalilousername,
                            "ilo_password": $scope.baremetalilopassword,
                            "os_type": $scope.baremetalostype,
                            "username": $scope.baremetalosusername,
                            "password": $scope.baremetalospassword,
                            "port": "none",
                            "type": "baremetal",
                            "auto_provision": "True",
                            "boot_from_san": checkForSANBoot($scope.baremetalBootType)
                        }
                    };
                    bllApiRequest.post("baremetal", request_auto_provision).then(
                        function (data) {
                            if (data.status === 'complete') {
                                $scope.baremetal_list();
                                $scope.baremetalRegisterDisable = true;
                                $scope.registerBareMetalVisible = false;
                                addNotification("info", $translate.instant("compute.notification.data", {
                                    name: $scope.baremetalname,
                                    details: data.data
                                }));
                            } else {
                                addNotification('error', $translate.instant("compute.notification.data", {
                                    name: $scope.baremetalname,
                                    details: data.data
                                }));
                            }
                        },
                        function (error_data) {
                            $scope.baremetalRegisterDisable = false;
                            $scope.bareMetalIfRegisterInProgress = false;
                            $scope.baremetal_list();
                            addNotification('error', $translate.instant("compute.notification.data", {
                                name: $scope.baremetalname,
                                details: error_data.data[0].data
                            }));
                        },
                        function () {
                            $scope.registerBareMetalVisible = false;
                            $scope.baremetal_list();
                        }
                    );

                }
            };

            $scope.updateBareMetalConfirm = function () {
                $scope.bareMetalIfUpdateInProgress = true;
                $scope.baremetalRegisterDisable = true;
                var request = {
                    'operation': 'update_baremetal',
                    "data": {
                        "id": $scope.editBareMetalDatas.id,
                        "name": $scope.editBareMetalData_name,
                        "mac_addr": $scope.editBareMetalData_mac_address,
                        "ip_address": $scope.editBareMetalData_ip_address,
                        "ilo_ip": $scope.editBareMetalData_ilo_ip,
                        "ilo_user": $scope.editBareMetalData_ilo_user,
                        "ilo_password": $scope.editBareMetalData_ilo_password,
                        "type": $scope.editBareMetalDatas.type,
                        "username": $scope.editBareMetalData_username,
                        "password": $scope.editBareMetalData_password,
                        "port": "none"
                    }
                };
                bllApiRequest.put("baremetal", request).then(
                    function (data) {
                        if (data.status === 'complete') {
                            $scope.baremetalRegisterDisable = false;
                            $scope.bareMetalIfUpdateInProgress = false;
                            $scope.baremetal_list();
                            $scope.editBareMetalVisible = !$scope.editBareMetalVisible;
                            addNotification("info",
                                $translate.instant(
                                    "compute.baremetal.update.complete",
                                    {name: $scope.editBareMetalData_name}));
                        } else {
                            $scope.baremetal_list();
                            $scope.baremetalRegisterDisable = false;
                            $scope.bareMetalIfUpdateInProgress = false;
                            addNotification('error', $translate.instant("compute.baremetal.update.error", {
                                name: $scope.editBareMetalHeader,
                                error_data: data.data
                            }));
                            //show error modal
                            $scope.baremetalInfoEditModalBoxConfig = {
                                header: $translate.instant("compute.baremetal.modal.header.error"),
                                content: $translate.instant("compute.baremetal.update.error", {
                                    name: $scope.editBareMetalHeader,
                                    error_data: data.data
                                })
                            };
                            $scope.infoEditBareMetalModalFlag = true;
                        }
                    },
                    function (error_data) {
                        $scope.baremetal_list();
                        $scope.baremetalRegisterDisable = false;
                        $scope.bareMetalIfUpdateInProgress = false;
                        if (angular.isUndefined(error_data.data) || error_data.data === null) {
                            addNotification('error', $translate.instant("compute.baremetal.update.error", {
                                name: $scope.editBareMetalHeader,
                                error_data: $translate.instant("compute.baremetal.modal.header.error")
                            }));
                            $scope.baremetalInfoEditModalBoxConfig = {
                                header: $translate.instant("compute.baremetal.modal.header.error"),
                                content: $translate.instant("compute.baremetal.update.error", {
                                    name: $scope.editBareMetalHeader,
                                    error_data: $translate.instant("compute.baremetal.modal.header.error")
                                })
                            };
                        } else {
                            addNotification('error', $translate.instant("compute.baremetal.update.error", {
                                name: $scope.editBareMetalHeader,
                                error_data: error_data.data[0].data
                            }));
                            $scope.baremetalInfoEditModalBoxConfig = {
                                header: $translate.instant("compute.baremetal.modal.header.error"),
                                content: $translate.instant("compute.baremetal.update.error", {
                                    name: $scope.editBareMetalHeader,
                                    error_data: error_data.data[0].data
                                })
                            };
                        }
                        //show error modal
                        $scope.infoEditBareMetalModalFlag = true;
                    }
                );

            };

            $scope.provisionBareMetalConfirm = function () {
                $scope.baremetalRegisterDisable = true;
                $scope.bareMetalProvisionDone = true;
                var request = {
                    'operation': 'provision_baremetal',
                    "data": {
                        "id": $scope.provisionBareMetalData.id,
                        "os_type": $scope.baremetalprovisionostype,
                        "username": $scope.baremetalprovisionosusername,
                        "password": $scope.baremetalprovisionospassword,
                        "auto_provision": "False",
                        "boot_from_san": checkForSANBoot($scope.baremetalprovisionBootType)
                    }
                };
                bllApiRequest.post("baremetal", request).then(
                    function (data) {
                        if (data.status === 'complete') {
                            $scope.baremetalRegisterDisable = true;
                            $scope.baremetal_list();
                            $scope.provisionBareMetalVisible = false;
                            addNotification("info", $translate.instant("compute.notification.data", {
                                name: $scope.provisionBareMetalData.name,
                                details: data.data
                            }));
                        } else {
                            $scope.baremetalRegisterDisable = false;
                            addNotification('error', $translate.instant("compute.notification.data", {
                                name: $scope.provisionBareMetalData.name,
                                details: data.data
                            }));
                        }
                    },
                    function (error_data) {
                        $scope.baremetalRegisterDisable = false;
                        $scope.bareMetalProvisionDone = false;
                        $scope.baremetal_list();
                        addNotification("error", $translate.instant("compute.notification.data", {
                            name: $scope.provisionBareMetalData.name,
                            details: error_data.data[0].data
                        }));
                    },
                    function () {
                        $scope.provisionBareMetalVisible = false;
                        $scope.baremetal_list();
                    }
                );
            };

            $scope.baremetalDeletionInProgress = false;
            $scope.unregisterBareMetalConfirm = function (data) {
                $scope.baremetalDeletionInProgress = true;
                $scope.baremetalInfoModalButton = true;
                var bareMetalIds = [];
                var bareMetalNames = [];
                angular.forEach($scope.unregisterBareMetalData, function (data) {
                    bareMetalIds.push(data.id);
                    bareMetalNames.push(data.name);
                });
                var request = {
                    'operation': 'unregister_baremetal',
                    "data": {
                        "ids": bareMetalIds
                    }
                };
                bllApiRequest.delete("baremetal", request).then(
                    function (data) {
                        if (data.status === 'complete' || !angular.isUndefined(data.status)) {
                            $scope.baremetal_list();
                            $scope.removeBareMetalModalFlag = false;
                            $scope.baremetalDeletionInProgress = false;
                            var i =0;
                            angular.forEach(data.data, function (api_reply, baremetal_id) {
                                if (api_reply.status === "error") {
                                    addNotification('error', $translate.instant("compute.baremetal.remove.error", {
                                        error_data: api_reply.data,
                                        name: bareMetalNames[i]
                                    }));
                                } else {
                                    addNotification("info",
                                        $translate.instant(
                                            "compute.baremetal.unregister.complete", {name: bareMetalNames[i]}));
                                }
                                i++;
                            });
                        } else {
                            $scope.removeBareMetalModalFlag = false;
                            $scope.baremetalDeletionInProgress = false;
                            addNotification('error', $translate.instant("compute.baremetal.remove.error", {
                                error_data: data.data,
                                name: bareMetalNames.join(", ")
                            }));
                            //show error modal
                            $scope.baremetalInfoModalBoxConfig = {
                                header: $translate.instant("compute.baremetal.modal.header.error"),
                                content: $translate.instant("compute.baremetal.remove.error", {
                                    error_data: data.data,
                                    name: bareMetalNames.join(", ")
                                })
                            };
                            $scope.infoBareMetalModalFlag = true;
                        }
                    },
                    function (error_data) {
                        $scope.baremetal_list();
                        $scope.removeBareMetalModalFlag = false;
                        $scope.baremetalDeletionInProgress = false;
                        addNotification('error', $translate.instant("compute.baremetal.remove.error", {
                            error_data: error_data.data[0].data,
                            name: bareMetalNames.join(", ")
                        }));
                        //show error modal
                        $scope.baremetalInfoModalBoxConfig = {
                            header: $translate.instant("compute.baremetal.modal.header.error"),
                            content: $translate.instant("compute.baremetal.remove.error", {
                                error_data: error_data.data[0].data,
                                name: bareMetalNames.join(", ")
                            })
                        };
                        $scope.infoBareMetalModalFlag = true;
                    }
                );
            };

            $scope.closeErrorBareMetalmodal = function () {
                $scope.infoBareMetalModalFlag = false;
            };
        }
    ]);
})(angular);
