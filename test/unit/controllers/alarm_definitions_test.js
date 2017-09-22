// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
    'use strict';

    describe('Alarm Definitions controller', function() {
        var $controller, scope, q, bllApiRequest, modalDrawer, alarm_def_controller, helpers = {};

        var alarm_def_data = [{
            "id": "08397b8f-35b5-4a75-ab04-06529189a08a",
            "links": [
                {
                    "rel": "self",
                    "href": "http://10.1.217.121:8080/v2.0/alarm-definitions/08397b8f-35b5-4a75-ab04-06529189a08a"
                }
            ],
            "name": "passive legacy appliances monitoring",
            "description": "Monitor legacy appliances passively using received measurements",
            "expression": "max(monasca.emit_time_sec{host_type=appliance}) > 60",
            "match_by": [
                "hostname"
            ],
            "severity": "CRITICAL",
            "actions_enabled": true,
            "alarm_actions": [
                "a823add5-8186-4e03-9637-094ef8351ae8"
            ],
            "ok_actions": [
                "a823add5-8186-4e03-9637-094ef8351ae8"
            ],
            "undetermined_actions": [
                "a823add5-8186-4e03-9637-094ef8351ae8"
            ]
        }, {
            "id": "0be5314c-b8f1-4282-aedc-e00fb8db552e",
            "links": [
                {
                    "rel": "self",
                    "href": "http://10.1.217.121:8080/v2.0/alarm-definitions/0be5314c-b8f1-4282-aedc-e00fb8db552e"
                }
            ],
            "name": "Check mount points",
            "description": "Verify all mount points are OK",
            "expression": "swift.check_mounts{service=object-storage} > 0",
            "match_by": [
                "hostname"
            ],
            "severity": "HIGH",
            "actions_enabled": true,
            "alarm_actions": [
                "a823add5-8186-4e03-9637-094ef8351ae8"
            ],
            "ok_actions": [
                "a823add5-8186-4e03-9637-094ef8351ae8"
            ],
            "undetermined_actions": [
                "a823add5-8186-4e03-9637-094ef8351ae8"
            ]
        }, {
            "id": "119c9a86-8f32-44a2-885a-451abb35224e",
            "links": [
                {
                    "rel": "self",
                    "href": "http://10.1.217.121:8080/v2.0/alarm-definitions/119c9a86-8f32-44a2-885a-451abb35224e"
                }
            ],
            "name": "Drive audit",
            "description": "Performs audit to detect drive errors",
            "expression": "swift.drive_audit{service=object-storage} > 0",
            "match_by": [
                "hostname"
            ],
            "severity": "HIGH",
            "actions_enabled": true,
            "alarm_actions": [
                "a823add5-8186-4e03-9637-094ef8351ae8"
            ],
            "ok_actions": [
                "a823add5-8186-4e03-9637-094ef8351ae8"
            ],
            "undetermined_actions": [
                "a823add5-8186-4e03-9637-094ef8351ae8"
            ]
        }];

        var notification_data = [{
            "links": [
                {
                    "rel": "self",
                    "href": "http://10.1.217.121:8080/v2.0/notification-methods"
                }
            ],
            "elements": [
                {
                    "id": "a823add5-8186-4e03-9637-094ef8351ae8",
                    "links": [
                        {
                            "rel": "self",
                            "href": "http://10.1.217.121:8080/v2.0/notification-methods/a823add5-8186-4e03-9637-094ef8351ae8"
                        }
                    ],
                    "name": "Webhook",
                    "type": "WEBHOOK",
                    "address": "http://192.168.0.5:9999/webhook-notifications/appliance"
                }
            ]
        }];

        var dimensionListData = {
            "cpu.idle_perc": {
                "cloud_name": ["ardana-poc-ardana-001"],
                "cluster": ["compute", "c1", "c0"],
                "control_plane": ["ccp"],
                "hostname": ["ardana001-cp1-comp0001-mgmt", "ardana001-cp1-comp0003-mgmt", "ardana001-cp1-c1-m3-mgmt",
                    "ardana001-cp1-comp0002-mgmt", "ardana001-cp1-c1-m2-mgmt", "ardana001-cp1-c1-m1-mgmt", "ardana001-cp1-c0-m1-mgmt"]
            },
            "cpu.user_perc": {
                "cloud_name": ["ardana-poc-ardana-001"],
                "cluster": ["compute", "c1", "c0"],
                "control_plane": ["ccp"],
                "hostname": ["ardana001-cp1-comp0001-mgmt", "ardana001-cp1-comp0003-mgmt", "ardana001-cp1-c1-m3-mgmt",
                    "ardana001-cp1-comp0002-mgmt", "ardana001-cp1-c1-m2-mgmt", "ardana001-cp1-c1-m1-mgmt", "ardana001-cp1-c0-m1-mgmt"]
            },
        };

        var allMetricsData = [{
            "id": "27e9cfd6440fdda9dce7671204b263d6106571cd",
            "name": "cpu.idle_perc",
            "dimensions": {
                "service": "monitoring",
                "role": "ManagementController",
                "hostname": "ma1",
                "host_type": "appliance"
            }
        }, {
            "id": "28e14d9df5e04e1ce1bdd7387cd1f061ec8c7b3e",
            "name": "cpu.idle_perc",
            "dimensions": {
                "service": "monitoring",
                "role": "CloudController",
                "hostname": "cmc.iscmgmt.local",
                "host_type": "appliance"
            }
        }, {
            "id": "38900eafc55276dfa32146b6a1aa6df5a0704a6e",
            "name": "cpu.user_perc",
            "dimensions": {
                "service": "monitoring",
                "role": "UpdateAppliance",
                "hostname": "ua1.iscmgmt.local",
                "host_type": "appliance"
            }
        }, {
            "id": "4438bff72f4d8172cfcefc82708b2ab9ed2b05fe",
            "name": "cpu.user_perc",
            "dimensions": {
                "service": "monitoring",
                "hostname": "ea2",
                "role": "EnterpriseController",
                "host_type": "appliance"
            }
        }];

        var metricListData = ["cpu.idle_perc", "cpu.stolen_perc", "cpu.system_perc", "cpu.user_perc", "cpu.wait_perc"];

        var definitionData = {
            name: 'Average CPU percent greater than 10',
            description: 'The average CPU percent is greater than 10',
            definition: ['hostname', 'service'],
            severity: 'LOW',
            notifications: [],
            applyToGroup: 'individually',
            dimension: [{key: 'service', value: 'compute'}, {key: 'hostname', value: 'ea2'}],
            mathFunction: 'min',
            metric: 'vm.mem.free_mb',
            operator: '>',
            value: '10'
        };

        var editingDefinitionData = {
            name: 'New Name',
            description: 'New Description',
            definition: ['service'],
            severity: 'MEDIUM',
            notifications: ['78f13195-feea-44ab-a9a8-84d8b25fe92c'],
            applyToGroup: 'group',
            dimension: [{key: 'service', value: 'compute'}],
            mathFunction: 'min',
            metric: 'vm.mem.free_mb',
            operator: '>',
            value: '11',
            actions_enabled: false
        };

        beforeEach(function() {
            module('plugins', function($provide) {
                bllApiRequest = {
                    get: function(ops, alarm_def) {
                        var deferred = q.defer();
                        switch(alarm_def.operation) {
                            case 'alarm_definition_list':
                                deferred.resolve({data: alarm_def_data});
                                break;
                            case 'notification_list':
                                deferred.resolve({data: notification_data});
                                break;
                        }
                        return deferred.promise;
                    },
                    post: function() {
                        var deferred = q.defer();
                        deferred.resolve({data: {}});
                        return deferred.promise;
                    },
                    patch: function() {
                        var deferred = q.defer();
                        deferred.resolve({data: {}});
                        return deferred.promise;
                    }
                };
                $provide.value('bllApiRequest', bllApiRequest);

                helpers = {
                    loadAllMetrics: function() {
                        var deferred = q.defer();
                        deferred.resolve({
                            dimensionList: dimensionListData,
                            allMetrics: allMetricsData,
                            metricList: metricListData
                        });
                        return deferred.promise;
                    },
                    addNotification: function() {
                        var deferred = q.defer();
                        deferred.resolve();
                        return deferred.promise;
                    }
                };
                $provide.value('loadAllMetrics', helpers.loadAllMetrics);
                $provide.value('addNotification', helpers.addNotification);

                modalDrawer = {
                    show: function() {
                        var deferred = q.defer();
                        deferred.resolve({});
                        return deferred.promise;
                    }
                };
                $provide.value('modalDrawer', modalDrawer);
            });
        });

        describe('in stdcfg environment', function() {
            describe('and successful cases', function() {

                beforeEach(inject(function(_$controller_, _$rootScope_, _$q_) {
                    q = _$q_;
                    _$rootScope_.appConfig = {env: 'stdcfg'};
                    scope = _$rootScope_.$new();
                    alarm_def_controller = _$controller_('AlarmDefinitionsController', {$scope: scope});
                }));

                it('should have 4 columns in the table: name, id, description, notifications', function() {
                    expect(scope.alarmTableConfig).toBeDefined();
                    expect(scope.alarmTableConfig.headers).toBeDefined();
                    expect(scope.alarmTableConfig.headers.length).toBe(4);
                    expect(scope.alarmTableConfig.headers[0].displayfield).toBe('name');
                    expect(scope.alarmTableConfig.headers[1].displayfield).toBe('id');
                    expect(scope.alarmTableConfig.headers[2].displayfield).toBe('description');
                    expect(scope.alarmTableConfig.headers[3].displayfield).toBe('notifications');
                });

                it('should have row action menu with 3 actions: edit, delete, view alarm', function() {
                    expect(scope.alarmTableConfig.actionMenuConfig).toBeDefined();
                    expect(scope.alarmTableConfig.actionMenuConfig.length).toBe(3);
                    expect(scope.alarmTableConfig.actionMenuConfig[0].name).toBe('edit');
                    expect(scope.alarmTableConfig.actionMenuConfig[1].name).toBe('delete');
                    expect(scope.alarmTableConfig.actionMenuConfig[2].name).toBe('viewAlarm');
                });

                it('should have create action in global action menu', function() {
                    expect(scope.alarmTableConfig.globalActionsConfig).toBeDefined();
                    expect(scope.alarmTableConfig.globalActionsConfig.length).toBe(1);
                    expect(scope.alarmTableConfig.globalActionsConfig[0].name).toBe('create');
                });

                it('should launch delete modal when select delete action from row action menu', function() {
                    expect(scope.showDeleteModalFlag).toBe(false);

                    // trigger the delete action
                    scope.alarmTableConfig.actionMenuConfig[1].action();

                    expect(scope.showDeleteModalFlag).toBe(true);
                    scope.closeDeleteModal();
                    expect(scope.showDeleteModalFlag).toBe(false);
                });
            });

            describe('and a failed delete operation', function() {
                beforeEach(function() {
                    module('plugins', function($provide) {
                        bllApiRequest = {
                            get: function(ops, alarm_def) {
                                var deferred = q.defer();
                                switch(alarm_def.operation) {
                                    case 'alarm_definition_list':
                                        deferred.resolve({data: alarm_def_data});
                                        break;
                                    case 'notification_list':
                                        deferred.resolve({data: notification_data});
                                        break;
                                }
                                return deferred.promise;
                            },
                            post: function() {
                                var deferred = q.defer();
                                deferred.reject({data: [{data: 'Error'}]});
                                return deferred.promise;
                            }
                        };
                        $provide.value('bllApiRequest', bllApiRequest);
                    });
                });

                beforeEach(inject(function(_$controller_, _$rootScope_, _$q_) {
                    q = _$q_;
                    _$rootScope_.appConfig = {env: 'stdcfg'};
                    scope = _$rootScope_.$new();
                    alarm_def_controller = _$controller_('AlarmDefinitionsController', {$scope: scope});
                }));

                // The confirm in the drawer was removed, can't test thi directly yet.
                // it('should not reduce the number of alarm definitions', function() {
                //     var deleteData = alarm_def_data;
                //     deleteData[0].removeSelection = true;
                //     scope.alarmDefinitionData = deleteData;
                //     expect(scope.alarmDefinitionData.length).toBe(2);
                //
                //     // trigger alarm definition deletion
                //     scope.loadConfirmDeleteModal(modalDrawer);
                //     // trigger bll calls
                //     scope.$digest();
                //
                //     expect(scope.showDeleteModalFlag).toBe(false);
                //     expect(scope.alarmDefinitionData.length).toBe(2);
                // });
            });
        });

    });
})();
