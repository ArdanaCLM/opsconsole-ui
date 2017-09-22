// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(){
    'use strict';

    angular.module('plugins').directive('activateEsx', ['bllApiRequest', '$translate', 'log', 'addNotification',
        '$rootScope',
        function(bllApiRequest, $translate, log, addNotification, $rootScope) {
            return {
                restrict: 'E',

                scope: {
                    enableMgmtNameInputFlag: '='
                },

                templateUrl: 'compute/templates/activate_esx.html',

                link: function(scope, element) {
                    var modalCtrl = scope.$parent.$parent.$parent;
                    var outerCtrl = scope.$parent.$parent.$parent.$parent;
                    outerCtrl.cloudTrunkList = [];
                    modalCtrl.editMode = false;

                    outerCtrl.cloudTrunkTableConfig = {
                        headers: [{
                            name: $translate.instant("compute.activate_esx.trunk_name"),
                            type: "string",
                            displayfield: "name",
                            sortfield: 'name'
                        }, {
                            name: $translate.instant("compute.activate_esx.trunk_interface"),
                            type: "string",
                            displayfield: "nics",
                            sortfield: 'nics'
                        }, {
                            name: $translate.instant("compute.activate_esx.trunk_mtu"),
                            type: "string",
                            displayfield: "mtu",
                            sortfield: 'mtu'
                        }, {
                            name: $translate.instant("compute.activate_esx.trunk_network_name"),
                            type: "string",
                            displayfield: "network_name",
                            sortfield: 'network_name'
                        }],

                        actionMenuConfig: [{
                            label: 'common.edit',
                            name: 'editServer',
                            action: function(data) {
                                scope.launchEditCloudTrunkModal(data);
                            }
                        }, {
                            label: 'common.remove',
                            name: 'removeServer',
                            action: function(data) {
                                scope.selectedTrunk = data;
                                scope.showRemoveCloudTrunkConfirmModalFlag = true;
                            }
                        }],

                        pageConfig: {
                            pageSize: 5
                        },
                        drillDownTableId: 'activateEsxTable'//used to prevent accidental drilldown parsing on this table
                    };

                    scope.getServerGroupList = function () {
                        var req = {
                            operation: 'prepare_activate_template',
                            data: {type: 'esxcluster'}
                        };
                        bllApiRequest.get('eon', req).then(
                            function (data) {
                                var prepareData = data.data;
                                var serverGroupList = [];
                                if (prepareData.server_groups.length !== 0) {
                                    serverGroupList = prepareData.server_groups.map(function (sg) {
                                        return {label: sg.name, value: sg.name};
                                    });
                                }
                                outerCtrl.serverGroupList = serverGroupList;
                                outerCtrl.inputMgmtTrunkServerGroup = serverGroupList.length > 0 ? serverGroupList[0].value : '';
                                if (prepareData.network_names.length === 0) {
                                    addNotification('error', $translate.instant('compute.hardware.create_cluster.no_network_error'));
                                    modalCtrl.networkNameList = [];
                                } else {
                                    var networkNameList = prepareData.network_names.map(function (nn) {
                                        return {label: nn.name, value: nn.name};
                                    });
                                    modalCtrl.networkNameList = networkNameList;
                                }
                            },
                            function (error) {
                                var msg = error.data[0].data;
                                log('error', "Can't get Server Groups or Network Names information: " + msg);
                                addNotification('error', $translate.instant('compute.hardware.create_cluster.get_server_group_error',
                                    {details: msg}));
                                outerCtrl.serverGroupList = [];
                            }
                        );
                    };


                    scope.launchAddCloudTrunkModal = function() {
                        modalCtrl.trunk = {};
                        modalCtrl.trunk.inputCloudTrunkName = "";
                        modalCtrl.trunk.inputCloudTrunkInterface = "";
                        modalCtrl.trunk.inputCloudTrunkMtu = "1500";
                        if (modalCtrl.networkNameList.length === 0) {
                            modalCtrl.trunk.inputCloudTrunkNetworkName = '';
                        } else {
                            modalCtrl.trunk.inputCloudTrunkNetworkName = modalCtrl.networkNameList[0].value;
                        }
                        modalCtrl.addStack('compute/templates/activate_esx_trunk_detail.html');
                    };

                    modalCtrl.validateMtu = function(mtu) {
                        return mtu >= 1500 && mtu <= 9999;
                    };

                    modalCtrl.addCloudTrunkData = function(trunk) {
                        var trunkData = {
                            name: trunk.inputCloudTrunkName,
                            nics: trunk.inputCloudTrunkInterface,
                            mtu: trunk.inputCloudTrunkMtu,
                            network_name: trunk.inputCloudTrunkNetworkName
                        };
                        outerCtrl.cloudTrunkList.push(trunkData);
                        modalCtrl.closeModal();
                    };

                    scope.launchEditCloudTrunkModal = function(trunk) {
                        modalCtrl.editMode = true;
                        scope.selectedTrunk = trunk;
                        modalCtrl.trunk.inputCloudTrunkName = trunk.name;
                        modalCtrl.trunk.inputCloudTrunkInterface = trunk.nics;
                        modalCtrl.trunk.inputCloudTrunkMtu = trunk.mtu;
                        modalCtrl.trunk.inputCloudTrunkNetworkName = trunk.network_name;
                        modalCtrl.addStack('compute/templates/activate_esx_trunk_detail.html', scope.editCloudTrunkModalClosed);
                    };

                    scope.editCloudTrunkModalClosed = function() {
                        modalCtrl.editMode = false;
                    };

                    modalCtrl.checkEditDisabled = function() {
                        if (modalCtrl.trunk.inputCloudTrunkName !== scope.selectedTrunk.name) {
                            return false;
                        }
                        if (modalCtrl.trunk.inputCloudTrunkInterface !== scope.selectedTrunk.nics) {
                            return false;
                        }
                        if (modalCtrl.trunk.inputCloudTrunkMtu !== scope.selectedTrunk.mtu) {
                            return false;
                        }
                        if (modalCtrl.trunk.inputCloudTrunkNetworkName !== scope.selectedTrunk.network_name) {
                            return false;
                        }
                        return true;
                    };

                    modalCtrl.updateCloudTrunkData = function() {
                        var updateTrunkIndex;
                        for (var i=0; i < outerCtrl.cloudTrunkList.length; i++) {
                            if (outerCtrl.cloudTrunkList[i].name == scope.selectedTrunk.name) {
                                updateTrunkIndex = i;
                                break;
                            }
                        }
                        outerCtrl.cloudTrunkList[updateTrunkIndex].name = modalCtrl.trunk.inputCloudTrunkName;
                        outerCtrl.cloudTrunkList[updateTrunkIndex].nics = modalCtrl.trunk.inputCloudTrunkInterface;
                        outerCtrl.cloudTrunkList[updateTrunkIndex].mtu = modalCtrl.trunk.inputCloudTrunkMtu;
                        outerCtrl.cloudTrunkList[updateTrunkIndex].network_name = modalCtrl.trunk.inputCloudTrunkNetworkName;
                        modalCtrl.closeModal();
                    };

                    scope.removeCloudTrunk = function(trunk) {
                        var removeTrunkIndex;
                        for (var i=0; i < outerCtrl.cloudTrunkList.length; i++) {
                            if (outerCtrl.cloudTrunkList[i].name == scope.selectedTrunk.name) {
                                removeTrunkIndex = i;
                                break;
                            }
                        }
                        outerCtrl.cloudTrunkList.splice(removeTrunkIndex, 1);
                        scope.showRemoveCloudTrunkConfirmModalFlag = false;
                    };
                }
            };
        }
    ]);
})();
