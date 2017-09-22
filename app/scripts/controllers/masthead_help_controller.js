// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(ng) {
    'use strict';

    ng.module('operations-ui').controller('MastheadHelpController', [
        '$scope', '$rootScope', '$http', '$location', 'hideActiveMastheadPopover',
        'getLocale', 'addNotification', '$q', '$translate', 'log',
        function($scope, $rootScope, $http, $location, hideActiveMastheadPopover,
                 getLocale, addNotification, $q, $translate, log) {
            $scope.version = $rootScope.build_info;
            var initHelperSuccess = false;

            var stripTrailing = function(menuKey) {
                var idx = menuKey.indexOf('?');
                if (idx > 0) {
                    menuKey = menuKey.substring(0, idx);
                }
                return menuKey;
            };

            $scope.buildinfo = false;
            if($location.$$search.buildinfo) {
                $scope.buildinfo = true;
            }

            var initHelperBase = function() {
                var defer = $q.defer();
                var locale = getLocale(); //will get en or ja or zh
                if (locale === 'zh') {
                    locale = getLocale(true); //get country code for Chinese zh-CN
                    locale = locale.toLowerCase();
                }

                var help_conf_file =
                    location.protocol + "//" + location.hostname + ":" + location.port + "/help_config.json";
                $http.get(help_conf_file).then (
                    function(response) {
                        if (response.data) {
                            var helpData = response.data;
                            if(helpData.help_base_url) {
                                if (helpData.is_help_I10N &&
                                    helpData.is_help_I10N === true) {
                                    $scope.helpBaseUrl = helpData.help_base_url + "/" + locale + "/";
                                }
                                else {
                                    $scope.helpBaseUrl = helpData.help_base_url + "/";
                                }

                                if (helpData.help_dafault_page) {
                                    $scope.helpDefaultPage = $scope.helpBaseUrl + "/" + helpData.help_default_page;
                                }
                                else {
                                    $scope.helpDefaultPage = $scope.helpBaseUrl + "/opsconsole_overview";
                                }

                                if (helpData.context_help_keys_mapping) {
                                    $scope.menuHelpKeysMap = helpData.context_help_keys_mapping;
                                    initHelperSuccess = true;
                                    defer.resolve();
                                }
                                else { //has no context keys mapping
                                    addNotification(
                                        "error",
                                        $translate.instant(
                                            "common.helper.nokeys.error",
                                            {'configfile' : help_conf_file}
                                        ));
                                    defer.reject();
                                }
                            }
                            else { //has no help_base_url
                                addNotification(
                                    "error",
                                    $translate.instant(
                                        "common.helper.nobaseurl.error",
                                        {'configfile' : help_conf_file}
                                    ));
                                defer.reject();
                            }
                        }
                    },
                    function(error_data) {
                        addNotification(
                            "error",
                            $translate.instant(
                                "common.helper.config.error",
                                {'configfile' : help_conf_file}));
                        log('error', 'error data = ' + JSON.stringify(error_data));
                        defer.reject();
                    }
                );

                return defer.promise;
            };

            var gotoHelpPage = function() {
                var hash = location.hash; //hash could be "#/compute/compute_nodes?skip=True"
                var tabname;
                if (angular.isDefined($rootScope.visible_tabname)) {
                    tabname = $rootScope.visible_tabname;
                }

                var helpUrl = $scope.helpDefaultPage; //use default if we don't have the key
                if (angular.isDefined(hash)) {
                    var pathArray = (hash.substring(2)).split('/');
                    var menuKey = stripTrailing(pathArray[pathArray.length - 1]);
                    //append tabname for the key, but not for my dashboard
                    if(angular.isDefined(tabname) && menuKey !== 'dashboard') {
                        menuKey = menuKey + '_' + tabname;
                    }
                    var helpKey = $scope.menuHelpKeysMap[menuKey];
                    if (angular.isDefined(helpKey)) {
                        helpUrl = $scope.helpBaseUrl + helpKey;
                    }
                }
                window.open(helpUrl);
                hideActiveMastheadPopover();
            };

            $scope.openHelpPage = function() {
                if (!initHelperSuccess) {
                    initHelperBase().then(
                        function(sucess) {
                            gotoHelpPage();
                        },
                        function(error) {
                            hideActiveMastheadPopover();
                        }
                    );
                }
                else {
                    gotoHelpPage();
                }
            };
        }
    ]);

})(angular);