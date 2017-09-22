// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {

    'use strict';

    var p = ng.module('plugins');
    p.service('ArdanaService', [
     '$rootScope', '$q', '$window', '$timeout','$translate', 'bllApiRequest',
    function($rootScope, $q, $window, $timeout, $translate, bllApiRequest) {

        this.isAvailable = isAvailable;
        this.updateIsAvailable = updateIsAvailable;
        this.poll = poll;
        this.deactivate = deactivate;
        this.activate = activate;
        this.delete = deleteServer;
        this.getModel = getModel;
        this.getServerDetails = getServerDetails;
        this.addServer = addServer;
        this.findComputeRoles = findComputeRoles;
        this.findLeafServerGroups = findLeafServerGroups;
        this.listAnsiblePlays = listAnsiblePlays;
        this.findStartStopRuns = findStartStopRuns;
        this.getLog = getLog;
        this.isConfigEncrypted = isConfigEncrypted;
        this.updateIsConfigEncrypted = updateIsConfigEncrypted;
        this.getServerInfo = getServerInfo;

        var available = false;
        var configEncrypted = false;

        var playsAPI = 'plays/';
        var playbooksAPI = 'playbooks/';
        var modelAPI = 'model/';
        var serverAPI = 'servers/';
        var serverInfo = 'cp_output/server_info_yml';

        // Make a request to the Ardana Service backend to discover if the service is up and running
        this.readyPromise = updateIsAvailable();

        var findStartLimitRegEx = /(?:ardana-start.yml --limit )(\S+)/;
        var findStopLimitRegEx = /(?:ardana-stop.yml --limit )(\S+)/;

        var that = this;

        /**
         * @ngdoc method
         * @description Is the Ardana Service available (cached value set at service creation)?
         *
         * @returns {boolean} Availability
         */
        function isAvailable() {
            return !!available;
        }

        /**
         * @ngdoc method
         * @description Is the Ardana Service available (updates {@link #isAvailable})?
         *
         * @returns {object} promise for when update has completed (does not contain result)
         */
        function updateIsAvailable() {
            return bllApiRequest.get('ardana', {path: 'heartbeat'})
                .then(_.partial(_handleBllResponse))
                .then(function(response) {
                    available = response.data;
                })
                .catch(function(err) {
                    // Ignore errors - just means Ardana Service is not available
                    return err;
                });
        }

        /**
         * @ngdoc method
         * @description Returns the ardana playbook log for the given process reference
         * @param {string} pRef process reference
         *
         * @returns {object} promise containing bll response
         */
        function getLog(pRef) {
            if (!pRef) {
                return $q.reject('pRef must not be empty');
            }
            return bllApiRequest.get('ardana', {path: playsAPI + pRef + '/log'})
                .then(_.partial(_handleBllResponse));
        }

        /**
         * @ngdoc method
         * @description Is the ardana configuration encrypted?
         *
         * @returns {boolean} true if encrypted
         */
        function isConfigEncrypted() {
            return !!configEncrypted;
        }

        /**
         * @ngdoc method
         * @description Is the ardana configuration encrypted (updates {@link #isConfigEncrypted})?
         *
         * @returns {object} promise for when update has completed (does not contain result)
         */
        function updateIsConfigEncrypted() {
            return bllApiRequest.get('ardana', {path: modelAPI + 'is_encrypted'})
                .then(_.partial(_handleBllResponse))
                .then(function(response) {
                    configEncrypted = response.data && response.data.isEncrypted;
                });
        }

        function poll(pref, previousDeferred, reTryCount) {
            if (angular.isUndefined(reTryCount)) {
                // If null then should not retry
                reTryCount = 10;
            }
            var deferred = previousDeferred || $q.defer();
            $window.setTimeout(function() {
                // Poll the process until it completes
                bllApiRequest.get('ardana', {path: playsAPI + pref})
                    .then(_.partial(_handleBllResponse))
                    .then(function(data) {
                        if (data.data.alive) {
                            // Poll again later
                            that.poll(pref, deferred, reTryCount);
                        } else {
                            // Does the process meta data report a failure?
                            if (_.get(data.data, 'code', -1) !== 0) {
                                // Failed to execute
                                deferred.reject(data);
                            } else {
                                deferred.resolve(data);
                            }
                        }
                    })
                    .catch(function(err) {
                        if (!angular.isNumber(reTryCount) || reTryCount <= 0) {
                            deferred.reject(err);
                            return;
                        }
                        // If the process has succeeded or failed we'll get a successful response. Anything else
                        // and it's worth retrying.
                        that.poll(pref, deferred, --reTryCount);
                    });
            }, 5000);

            return deferred.promise;
        }

        /**
         * @ngdoc method
         * @description Deactivate a single compute node
         * @param {object} node contains compute node name and id
         * @param {string} encryptionKey ardana configuration processor encryption key
         * @returns {boolean} promise containing bll response
         */
        function deactivate(node, encryptionKey) {
            return _singleOp(node, 'deactivating', function() {
                var data = {
                    path: playbooksAPI + 'ardana_stop',
                    request_data: {
                        limit: node.name,
                        encryptionKey: encryptionKey
                    }
                };
                if(angular.isDefined(node.region)) {
                    var options = {
                        'region': node.region
                    };
                    return bllApiRequest.post('ardana', data, options);
                }
                else {
                    return bllApiRequest.post('ardana', data);
                }
            });
        }

        /**
         * @ngdoc method
         * @description Activate a single compute node
         * @param {object} node contains compute node name (host name)
         * @param {string} encryptionKey ardana configuration processor encryption key
         * @returns {boolean} promise containing bll response
         */
        function activate(node, encryptionKey) {
            return _singleOp(node, 'activating', function() {
                var data = {
                    path: playbooksAPI + 'ardana_start',
                    request_data: {
                        limit: node.name,
                        encryptionKey: encryptionKey
                    }
                };
                if(angular.isDefined(node.region)) {
                    var options = {
                        'region': node.region
                    };
                    return bllApiRequest.post('ardana', data, options);
                }
                else {
                    return bllApiRequest.post('ardana', data);
                }
            });
        }

        /**
         * @ngdoc method
         * @description Delete a single compute node
         * @param {object} server server line object to delete
         * @param {object} ardanaServer ardana server object of node to delete
         * @param {string} encryptionKey ardana configuration processor encryption key
         * @returns {boolean} promise containing bll response
         */
        function deleteServer(server, ardanaServer, encryptionKey) {
            var data = {
                operation: 'delete_compute_host',
                request_data: {
                    serverid: ardanaServer.id,
                    novaServiceDelete: {
                        hostname: server.name
                    },
                    process: {
                        commitMessage: $translate.instant('compute.compute_nodes.ardana.delete.gitCommitMessage',
                            {name: ardanaServer.id}),
                        encryptionKey: encryptionKey
                    }
                }
            };
            if(angular.isDefined(server.region)) {
                var options = {
                    'region': server.region
                };
                return bllApiRequest.delete('ardana',data, options).then(_.partial(_handleBllResponse));
            }
            else {
                return bllApiRequest.delete('ardana', data).then(_.partial(_handleBllResponse));
            }

        }

        /**
         * @ngdoc method
         * @description Fetch the ardana input model
         * @returns {boolean} promise containing bll response
         */
        function getModel() {
            return bllApiRequest.get('ardana', {path: modelAPI})
                .then(_.partial(_handleBllResponse))
                .then(function(response) {
                    if (response.data && response.data.errors && response.data.errors.length > 0) {
                        return $q.reject('Model contained errors');
                    } else if (!response.data) {
                        return $q.reject('Response contains no model');
                    } else {
                        return response.data;
                    }
            });
        }

        /**
         * get the server info from ardana service
         */
        function getServerInfo() {
            return bllApiRequest.get('ardana', {path: modelAPI + serverInfo}).then(
                function(response) {
                    var resData = response.data;
                    if(angular.isDefined(resData) && Object.keys(resData).length > 0) {
                        return resData;
                    }
                    else {
                        return $q.reject();//no data
                    }
                },
                function(error) {
                    return $q.reject(error);
                }
            );
        }

        /**
         * @ngdoc method
         * @description Fetch a subset of the ardana input model that deals with server data
         */
        function getServerDetails() {
            return bllApiRequest.get('ardana', {
                 operation: 'get_expanded_details',
                 location: 'expandedInputModel/internal/servers'})
                .then(_.partial(_handleBllResponse))
                .then(function(response) {
                    if (response.data && response.data.errors && response.data.errors.length > 0) {
                        return $q.reject('Model contained errors');
                    } else if (!response.data) {
                        return $q.reject('Response contains no model');
                    } else {
                        return response.data;
                    }
                });
        }

        /**
         * @ngdoc method
         * @description Add a single compute node
         * @param {object} ardanaServer ardana server object of node to add
         * @param {string} encryptionKey ardana configuration processor encryption key
         * @param {boolean} limitToNewServer True if the deploy step should --limit to the new server
         * @returns {boolean} promise containing bll response
         */
        function addServer(ardanaServer, encryptionKey, limitToNewServer) {
            var data = {
                path: serverAPI + 'process',
                request_data: {
                    server: ardanaServer,
                    process: {
                        commitMessage: $translate.instant('compute.compute_nodes.ardana.add.gitCommitMessage',
                            {name: ardanaServer.id}),
                        encryptionKey: encryptionKey,
                        limitToId: limitToNewServer ? ardanaServer.id : ''
                    }
                }
            };
            if(angular.isDefined(ardanaServer.region)) {
                var options = {
                    'region': ardanaServer.region
                };
                return bllApiRequest.post('ardana',data, options).then(_.partial(_handleBllResponse));
            }
            else {
                return bllApiRequest.post('ardana', data).then(_.partial(_handleBllResponse));
            }
        }

        function _singleOp(node, busy_state, httpFunc) {
            var deferred = $q.defer();
            if (!that.isAvailable()) {
                deferred.reject('ardana Services are not available');
            } else {
                if (!node || !node.name || node.name.length === 0) {
                    deferred.reject('Can not perform operation - a node must be specified');
                } else {
                    $timeout(function() {
                        deferred.notify({
                            id: node.id,
                            state: busy_state
                        });
                    }, 1000);

                    httpFunc()
                        .then(_.partial(_handleBllResponse))
                        .then(function(data) {
                            if (data && data.data && data.data.pRef) {
                                // We get back a process ID, so we need to start monitoring from that process
                                var pref = data.data.pRef;
                                that.poll(pref, deferred);
                            } else {
                                deferred.resolve(data);
                            }
                        })
                        .catch(function(error) {
                            deferred.reject(error);
                        });
                }
            }
            return deferred.promise;
        }

        /**
         * @ngdoc method
         * @description Find all compute roles (contain nova-compute)
         * @param {object} model ardana input model
         * @return {Array} All compute roles that contain nova-compute
         */
        function findComputeRoles(model) {
            function findServiceComponents(object) {
                var computeRoles = [];
                _.forEach(object, function(value, key) {
                    if (key === 'service-components') {
                        if (value.indexOf('nova-compute') !== -1 ||
                            value.indexOf('nova-compute-kvm') !== -1 ||
                            value.indexOf('nova-compute-hyperv') !== -1 ||
                            value.indexOf('nova-esx-compute-proxy') !== -1 ) {
                            computeRoles.push(object['server-role']);
                        }
                    } else if (angular.isArray(value) ||
                        (_.keys(value).length > 0 && !angular.isString(value))) {
                        var temp = findServiceComponents(value);
                        if (temp.length > 0) {
                            computeRoles = computeRoles.concat(temp);
                        }
                    }
                });
                return computeRoles;
            }
            // Find all compute roles in control planes that contain nova-compute
            var computeRoles = _.uniq(findServiceComponents({ init: model.inputModel['control-planes']} || {}));
            // Find all roles from server-roles
            var roles = _.map(model.inputModel['server-roles'], function(option) {
                return {
                    label: option.name,
                    value: option.name
                };
            });
            // Find the roles that have nova-compute
            return _.reject(roles, function(role) {
                return _.indexOf(computeRoles, role.value) < 0;
            });
        }

        /**
         * @ngdoc method
         * @description Find all leaf server groups (and their group hierarchy)
         * @param {object} model ardana input model
         * @return {Array} Array of leaf groups. Each element is a string containing breadcrumb of group hierarchy
         */
        function findLeafServerGroups(model) {
            var leafNodes = _.filter(model.inputModel['server-groups'], function(group) {
                return !group['server-groups'] || group['server-groups'].length === 0;
            });

            var breadCrumbs = [];
            _.forEach(model.inputModel['server-groups'], function(value) {

                if (value['server-groups']) {
                    _.forEach(value['server-groups'], function(child) {
                        var breadCrumb = _.find(breadCrumbs, function(crumb) {
                            return _.endsWith(crumb, value.name);
                        });

                        if (breadCrumb) {
                            breadCrumbs.push(breadCrumb + '\\' + child);
                        } else {
                            breadCrumbs.push(value.name + '\\' + child);
                        }
                    });
                } else {
                    var breadCrumb = _.find(breadCrumbs, function(crumb) {
                        return _.endsWith(crumb, value.name);
                    });
                    if (!breadCrumb) {
                        breadCrumbs.push(value.name);
                    }
                }
            });

            var serverGroups = [];
            _.forEach(leafNodes, function(group) {
                var breadCrumb = _.find(breadCrumbs, function(crumb) {
                    return _.endsWith(crumb, group.name);
                });

                serverGroups.push({
                    label: breadCrumb ? breadCrumb : group.name,
                    value: group.name
                });
            });

            return serverGroups;
        }

        /**
         * @ngdoc method
         * @description List all ansible plays
         * @param {number} maxAge Include runs that started within maxAge (ms)
         * @return {Array} An array of process meta data found.
         */
        function listAnsiblePlays(maxAge) {
            var data = {
                path: playsAPI
            };

            if (maxAge) {
                data.request_parameters = ['maxAge=' + maxAge];
            }

            return bllApiRequest.get('ardana', data).then(_.partial(_handleBllResponse));
        }

        /**
         * @ngdoc method
         * @description Find all ansible start/stop plays executing, or recently compelted, against a host. This makes
         * use of the ansible --limit flag.
         * @param {number} lagTicks Number of ticks that a finished process can still be eligable
         * @return {object} An object with two properties (start+stop). Each contains properties named after the hosts
         * found.
         */
        function findStartStopRuns(lagTicks) {
            var result = {
                start: {},
                stop: {}
            };

            //Example commandString (end of) 'ardana-start.yml --limit apprentice-ccp-comp0001-mgmt'
            return listAnsiblePlays(lagTicks ? Math.floor(lagTicks / 1000) : undefined).then(function(response) {
                if (!response.data) {
                    return result;
                }

                // Iterate through from earliest
                for (var i = response.data.length - 1; i >= 0; i--) {
                    var meta = response.data[i];

                    // Process is eligible if it's still running OR it's successfully finished within the allowed time
                    if (meta.alive || meta.code === 0) {
                        // Is it a start run ...
                        var hostName = meta.commandString.match(findStartLimitRegEx);
                        if (hostName && hostName.length > 1) {
                            // Set/Overwrite any previous start for the host
                            result.start[hostName[1]] = !!meta.alive;
                            // Clear any older stop runs for the host
                            result.stop[hostName[1]] = undefined;
                        } else {
                            // ... or a stop run?
                            hostName = meta.commandString.match(findStopLimitRegEx);
                            if (hostName && hostName.length > 1) {
                                // Set/Overwrite any previous start for the host
                                result.stop[hostName[1]] = !!meta.alive;
                                // Clear any older start runs for the host
                                result.start[hostName[1]] = undefined;
                            }
                        }
                    }
                }

                return result;
            });
        }

        function _handleBllResponse(data) {
            return data.status === 'complete' && _.get(data, 'data.status') !== 'error' ? data : $q.reject(data);
        }
    }

    ]);
})(angular);
