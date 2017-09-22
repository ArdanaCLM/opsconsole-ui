// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
/**
 * Factory function for ocmasthead directive.
 *
 * Created by jhickey on 10/29/2014.
 */
(function(ng) {
    'use strict';

    ng.module('operations-ui').directive('ocMasthead', [
        '$timeout',
        '$rootScope',
        '$location',
        'pluginNavigation',
        function($timeout, $rootScope, $location, pluginNavigation) {
            return {
                restrict: 'E',
                templateUrl: 'components/masthead.html',
                scope: {
                    "showMenu": "="
                },
                link: function (scope, element, attrs) {
                    scope.showMenu = false;

                    scope.toggle_menu = function() {
                        scope.showMenu = !scope.showMenu;
                        $('.main-body').toggleClass('menued');
                    };

                    //check if navigation finished building so we can
                    //build breadcrumbs
                    $rootScope.$watch('hasNavigation', function() {
                        if($rootScope.hasNavigation === true) {
                            setBreadCrumbs();
                        }
                    });

                    $rootScope.$watch("notification", function() {
                        if (angular.isUndefined($rootScope.notification) || $rootScope.notification === null) {
                            return;
                        }
                        scope.notificationCount = $rootScope.notification.message_stats.new;

                        scope.notificationHasError = $rootScope.notification.message_queue.map(function(message) {
                            return message.level === "error" || message.level === "warn";
                        }).reduce(function(a,b) {
                            return a || b;
                        }, false);
                    }, true);

                    scope.notificationCount = 0;

                    scope.breadcrumbs = [];

                    var morphItem = function(parentItemLabel) {
                       return function(item) {
                          return {
                              path: item.path,
                              label: item.label,
                              parentLabel: parentItemLabel
                          };
                       };
                    };

                    /*
                       This does not work on third level menu items.
                       When those are needed in production code modify this
                     */
                    var setBreadCrumbs = function() {
                        var pathParts = $location.path().split('/');
                        pathParts.splice(0,1);

                        var currentController = pluginNavigation.nav.reduce(function (a, b) {
                            var aa = a, bb = b;
                            if(!Array.isArray(aa)) {
                                aa = a.children.map(morphItem(a.label));
                            }
                            if(!Array.isArray(bb)) {
                                bb = b.children.map(morphItem(b.label));
                            }
                            return aa.concat(bb);
                        }).filter(function (item) {
                            return item.path === "/" + pathParts[1];
                        })[0];
                        scope.breadcrumbs =
                            currentController ? [currentController.parentLabel, currentController.label] : 'None';
                    };

                    $rootScope.$on("$routeChangeStart", function (event, current, previous) {
                        //reset remembered visible tabname for routing
                        $rootScope.visible_tabname = undefined;

                        if(angular.isDefined(pluginNavigation.nav)) {
                            setBreadCrumbs();
                        }
                    });
                }
            };
        }]);
})(angular);
