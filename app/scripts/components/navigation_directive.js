// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(ng) {
    'use strict';
    ng.module('operations-ui').directive('ocNavigation', [
        '$timeout',
        '$rootScope',
        'pluginNavigation',
        '$location',
        function($timeout, $rootScope, pluginNavigation, $location) {
            return {
                restrict: 'E',
                templateUrl: 'components/navigation.html',
                scope: {
                    "showMenu": "="
                },
                link: {
                    post: function postLink(scope, el, attr) {
                        scope.toggle = function(navIndex) {
                            if (angular.isUndefined(scope.nav[navIndex].expand) ||
                                scope.nav[navIndex].expand === false) {
                                scope.nav[navIndex].expand = true;


                            } else {
                                scope.nav[navIndex].expand = false;
                            }
                            setMenuHeight();

                        };

                        //check if navigation finished building so we
                        //can set the navigation
                        $rootScope.$watch('hasNavigation', function () {
                            if ($rootScope.hasNavigation) {
                                scope.nav = pluginNavigation.nav;
                            }
                            else {
                                scope.nav = [];
                            }
                        });

                        var wrap = angular.element('#wrap');
                        scope.windowHeight = function(){
                            return wrap.height();
                        };

                        //recalculate the height of the menu when the main container height changes
                        scope.$watch(scope.windowHeight, function() {
                            setMenuHeight();
                        });

                        scope.hide = function() {
                            scope.showMenu = false;
                        };
                        el.bind('DOMSubtreeModified', function(event) {
                            scope.navHeight = el.find('.menu').outerHeight();
                        });

                        function setMenuHeight() {
                            $timeout(function() {
                                var wrap = $('#wrap').outerHeight();
                                var header_height = $('oc-masthead div.oc-navbar').outerHeight();
                                var footer_height = $('.main-footer').outerHeight();
                                var display_height = wrap - header_height - footer_height;
                                $('div.menu-wrapper').height(display_height);
                            }, 100);
                        }
                    }
                }//end of link
            };//end of return
        }
    ]);
})(angular);
