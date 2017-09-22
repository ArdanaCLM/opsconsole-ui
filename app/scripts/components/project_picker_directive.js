// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(){
    'use strict';
    angular.module('operations-ui').directive("projectpicker", [
        '$translate', 'bllApiRequest', 'isUndefined', '$q', 'addNotification',
        function($translate, bllApiRequest, isUndefined, $q, addNotification) {
            return {
                restrict: "E",

                scope: {
                    project   : '=',
                    label     : '@',
                    projectId : '='
                },

                templateUrl: 'components/projectpicker.html',

                link : function(scope, el, attr) {
                    var req = {
                        'operation': 'project_list'
                    };

                    var projects = {
                      'all': 'all'
                    };

                    scope.$watch('project', function() {
                      if(attr.projectId) {
                        scope.projectId = projects[scope.project];
                      }
                    });

                    //return a promise
                    return bllApiRequest.get("user_group", req).then(
                      function (response) {
                        scope.projectList = [
                          {
                            label: $translate.instant('projectpicker.dropdown.projectlist.default'),
                            value: 'all'
                          }
                        ];

                        _.sortBy(response.data, 'name').forEach(function(project) {
                          scope.projectList.push({
                            label: project.name,
                            value: project.name
                          });
                          projects[project.name] = project.id;
                        });
                      },
                      function (error_data) {
                        var msg = $translate.instant('projectpicker.get_projectlist.error');
                        addNotification('error', msg);
                        log('error', msg);
                        log('error', 'error data=' + JSON.stringify(error_data));
                      }
                    );
                },
            };
        }
    ]);
})();
