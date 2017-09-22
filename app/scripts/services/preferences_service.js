// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';

    ng.module('operations-ui').service('prefSaver', ['bllApiRequest', '$rootScope', '$q', 'genRandomString', function (bllApiRequest, $rootScope, $q, genRandomString) {
        var default_prefs = {
            'version': '1',
            'cardAndChartStore': {
                'CARD.COMPUTE': {
                    'staticName': true,
                    'type': 'card',
                    'title': 'general.dashboard.card.title.compute',
                    'services': ['compute', 'image-service', 'nova-novncproxy', 'nova-conductor', 'nova-scheduler', 'nova-cert', 'baremetal']
                },
                'CARD.STORAGE': {
                    'staticName': true,
                    'type': 'card',
                    'title': 'general.dashboard.card.title.storage',
                    'services': ['block-storage', 'object-storage', 'ceph-storage', 'vsa', 'cinder', 'cinder-scheduler', 'cinder-volume', 'glance-api', 'glance-registry', 'swift']
                },
                'CARD.NETWORKING': {
                    'staticName': true,
                    'title': 'general.dashboard.card.title.networking',
                    'services': ['networking', 'dns', 'bind', 'powerdns', 'neutron-dhcp-agent', 'neutron-openvswitch-agent', 'neutron-metadata-agent', 'neutron-I3-agent', 'openvswitch-switch']
                },
                'CARD.IDENTITY': {
                    'staticName': true,
                    'type': 'card',
                    'title': 'general.dashboard.card.title.identity',
                    'services': ['identity-service', 'keystone']
                },
                'CARD.TELEMETRY': {
                    'staticName': true,
                    'type': 'card',
                    'title': 'general.dashboard.card.title.telemetry',
                    'services': ['telemetry', 'logging', 'kafka', 'monasca-transform', 'monitoring', 'metering', 'vertica']
                },
                'CARD.CONSOLE': {
                    'staticName': true,
                    'type': 'card',
                    'title': 'general.dashboard.card.title.console',
                    'services': ['tenant-console', 'ops-console', 'horizon']
                },
                'CARD.PLATFORMSERVICES': {
                    'staticName': true,
                    'type': 'card',
                    'title': 'general.dashboard.card.title.platform',
                    'services': ['database', 'message-broker']
                },
                'CARD.SYSTEM': {
                    'staticName': true,
                    'type': 'card',
                    'title': 'general.dashboard.card.title.system',
                    'services': ['system']
                }
            },
            'dashboards': {
                'CENTRAL.DASHBOARD': {
                    'ALARMSUMMARY': [
                        'CARD.COMPUTE', 'CARD.STORAGE', 'CARD.NETWORKING',
                        'CARD.IDENTITY', 'CARD.TELEMETRY', 'CARD.CONSOLE',
                        'CARD.PLATFORMSERVICES', 'CARD.SYSTEM']
                },
                'OC.MY.DASHBOARD': {
                    'DEFAULT': []
                }
            }
        };
        var prefs = this;
        var currentUser;

        // This is the old chart-related preferences upgrade
        var upgradeFromVersion_0 = function(prefs) {
            // create a copy of the default prefs
            var updPrefs = $.extend(true, {}, default_prefs);
            for (var i in prefs.chartStore) {
                // for each chart in the chartStore array, create an
                // equivalent entry in the cardAndChartStore
                var chartName = genRandomString(15);
                var chart = angular.copy(prefs.chartStore[i]);
                chart.type = 'chart';
                updPrefs.cardAndChartStore[chartName] = chart;

                // now append this old chart to My Dashboard
                updPrefs.dashboards['OC.MY.DASHBOARD'].DEFAULT.push(chartName);
            }

            return updPrefs;
        };


        this.save = function (prefs) {
            var req = {
                'user': $rootScope.user_name,
                'prefs': prefs
            };
            delete prefs.savedPrefs;
            var deferred = $q.defer();
            bllApiRequest.put('preferences', req).then(
                function (data) {
                    prefs.savedPrefs = $.extend(true, {}, prefs);
                    deferred.resolve();
                },
                function (error) {
                    bllApiRequest.post('preferences', req).then(
                        function (data) {
                            prefs.savedPrefs = $.extend(true, {}, prefs);
                            deferred.resolve();
                        },
                        function (error) {
                            console.log('ERROR: Could not save preferences:');
                            console.dir(error);
                            deferred.reject();
                        }
                    );
                }
            );
            return deferred.promise;
        };

        this.resetPrefs = function () {
            var deferred = $q.defer();
            deferred.resolve(default_prefs);
            prefs.save(default_prefs);
            return deferred.promise;
        };

        this.load = function () {
            var deferred = $q.defer();
            if ((prefs.savedPrefs) && (currentUser == $rootScope.user_name)) {
                deferred.resolve(prefs.savedPrefs);
            } else {
                currentUser = $rootScope.user_name;
                var req = {
                    'user': $rootScope.user_name
                };
                bllApiRequest.get('preferences', req).then(
                    function (data) {
                        if (! data.data.version) {
                            var newPrefs = upgradeFromVersion_0(data.data);
                            prefs.savedPrefs = newPrefs;
                            prefs.save(prefs.savedPrefs);
                            deferred.resolve(newPrefs);
                        } else {
                            prefs.savedPrefs = data.data;
                            deferred.resolve(data.data);
                        }
                    },
                    function (error) {
                        deferred.resolve(default_prefs);
                        prefs.save(default_prefs);
                    }
                );
            }
            return deferred.promise;
        };

        this.getDefaultPrefs = function(){
          return default_prefs;
        };
    }]);
})(angular);
