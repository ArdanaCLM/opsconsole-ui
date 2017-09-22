// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';

    var p = ng.module('plugins');

    p.controller('PlugintestController', ['$scope', '$rootScope', '$translate', '$cookieStore',
        function ($scope, $rootScope, $translate, $cookieStore) {
            //headers will be parsed into columns
            $scope.userTableConfig = {
                headers: [
                    {
                        name: $translate.instant('plugintest.item'),
                        type: 'string',
                        sortfield: 'item_tag',
                        displayfield: 'item_tag'
                    },
                    {
                        name: $translate.instant('plugintest.value'),
                        type: 'string',
                        sortfield: 'item_value',
                        displayfield: 'item_value'
                    },
                    {
                        name: $translate.instant('plugintest.rootscope'),
                        type: 'string',
                        sortfield: 'item_scope',
                        displayfield: 'item_scope'
                    },
                    {
                        name: $translate.instant('plugintest.cookie'),
                        type: 'string',
                        sortfield: 'item_cookie',
                        displayfield: 'item_cookie'
                    }
                ],
                //no default filters
                filters: [],
                //page config here irrelevant for now, table not set to pageable
                pageConfig: {
                    page: 1,//1 is the default
                    pageSize: 1000//1000 is the default
                }
            };

            $scope.projectTableConfig = {
                headers: [
                    {
                        name: $translate.instant('plugintest.project_name'),
                        type: 'string',
                        sortfield: 'project_name',
                        displayfield: 'project_name'
                    },
                    {
                        name: $translate.instant('plugintest.project_id'),
                        type: 'string',
                        sortfield: 'project_id',
                        displayfield: 'project_id'
                    },
                    {
                        name: $translate.instant('plugintest.auth_token'),
                        type: 'string',
                        sortfield: 'auth_token',
                        displayfield: 'auth_token'
                    }
                ],
                //no default filters
                filters: [],
                //page config here irrelevant for now, table not set to pageable
                pageConfig: {
                    page: 1,//1 is the default
                    pageSize: 1000//1000 is the default
                }
            };

            var getUserTableData = function() {
                $scope.userData = [];
                $scope.tableTranslate = {
                    'instancecount': 6
                };

                var auth_token = $cookieStore.get("auth_cookie");
                var localTime = new Date($cookieStore.get("auth_cookie").expires_at);

                // User
                $scope.userData[0] = {};
                $scope.userData[0].item_tag = $translate.instant('plugintest.user');
                $scope.userData[0].item_value = $cookieStore.get("auth_cookie").user_name;
                $scope.userData[0].item_scope = '$rootScope.user_name';
                $scope.userData[0].item_cookie = '$cookieStore.get("auth_cookie").user_name';
                // Auth Token Expires
                $scope.userData[1] = {};
                $scope.userData[1].item_tag = $translate.instant('plugintest.auth_token_expires');
                $scope.userData[1].item_value = localTime;
                $scope.userData[1].item_scope = 'NA';
                $scope.userData[1].item_cookie = "$cookieStore.get('auth_cookie').expires_at";
                // Build version
                $scope.userData[2] = {};
                $scope.userData[2].item_tag = $translate.instant('plugintest.build_version');
                $scope.userData[2].item_value = $rootScope.build_info.version;
                $scope.userData[2].item_scope = '$rootScope.build_info.version';
                $scope.userData[2].item_cookie = 'NA';
                // Build date
                $scope.userData[3] = {};
                $scope.userData[3].item_tag = $translate.instant('plugintest.build_time');
                $scope.userData[3].item_value = $rootScope.build_info.build_time;
                $scope.userData[3].item_scope = '$rootScope.build_info.build_time';
                $scope.userData[3].item_cookie = 'NA';
                // SHA1
                $scope.userData[4] = {};
                $scope.userData[4].item_tag = $translate.instant('plugintest.build_sha');
                $scope.userData[4].item_value = $rootScope.build_info.sha;
                $scope.userData[4].item_scope = '$rootScope.build_info.sha';
                $scope.userData[4].item_cookie = 'NA';
                // Last commit date
                $scope.userData[5] = {};
                $scope.userData[5].item_tag = $translate.instant('plugintest.commit_date');
                $scope.userData[5].item_value = $rootScope.build_info.commit_date;
                $scope.userData[5].item_scope = '$rootScope.build_info.commit_date';
                $scope.userData[5].item_cookie = 'NA';
            };

            var getTableData = function() {
                $scope.projectData = [];
                var projects = [
                    {name: 'demo', id: 'a5ae7171d93942e19f9d6d5432bc665c', auth_token: '034d87d374be4c63b84410af6e96858a'},
                    {name: 'service', id: 'e8b2085fa2a7450390a349bafab54ad8' , auth_token: '6b1cdda6500345caab14c3a93a6f56c3'}
                ];
                $scope.tableTranslate = {
                    'instancecount': projects.length
                };

                var i;
                for (i = 0; i < projects.length; i++) {
                    $scope.projectData[i] = {};
                    $scope.projectData[i].project_name = projects[i].name;
                    $scope.projectData[i].project_id = projects[i].id;
                    $scope.projectData[i].auth_token = projects[i].auth_token;
                }
            };

            $scope.requestTableConfig = {
                headers: [
                    {
                        name: $translate.instant('plugintest.id'),
                        type: 'number',
                        sortfield: 'id',
                        displayfield: 'id'
                    },
                    {
                        name: $translate.instant('plugintest.name'),
                        type: 'string',
                        sortfield: 'name',
                        displayfield: 'name'
                    }
                ],
                //no default filters
                filters: [],
                //page config here irrelevant for now, table not set to pageable
                pageConfig: {
                    page: 1,//1 is the default
                    pageSize: 1000//1000 is the default
                }
            };

            if($rootScope.auth_token) {
                getUserTableData();
                getTableData();
            }

        }]);
})(angular);
