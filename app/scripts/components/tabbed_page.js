// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
    'use strict';

    angular.module('operations-ui').directive('tabbedpage', [
        'log', '$routeParams', '$location', '$rootScope',
        function(log, $routeParams, $location, $rootScope) {
            return {
                restrict: "E",
                transclude: true,
                scope: {
                    pagelist: '=',
                    name: '@'
                },
                templateUrl: 'components/tabbed_page.html',

                controller: ['$scope', '$element', '$rootScope', function($scope, $element, $rootScope) {
                    if ($element[0].getAttribute('pagelist') === null) {
                        log('error', 'Error creating tabbedpage - missing "pagelist" value.');
                        return;
                    }

                    $scope.showTab = function(pageIndex) {
                        if(angular.isDefined($scope.lastPage) && $scope.pagelist[$scope.lastPage]) {
                          $scope.pagelist[$scope.lastPage].show = false;
                        }
                        if(angular.isDefined($scope.pagelist[pageIndex]) && angular.isUndefined($scope.pagelist[pageIndex].templatePath)) {
                          $scope.pagelist[pageIndex].templatePath = $scope.pagelist[pageIndex].template;
                        }
                        $scope.lastPage = pageIndex;
                        $scope.pagelist[pageIndex].show = true;

                        var page = $scope.pagelist[pageIndex];
                        $scope.$broadcast('tabPageShow', page.header);

                        //if it is routing and need to show page, remember the
                        //tabname so we can use it later
                        if(!$element.attr('not-routing')) {
                            $rootScope.visible_tabname = page.tabname;
                        }

                        //if switching to a tab that doesnt match the drilldown
                        //clear the route parameters to avoid applying a
                        //drilldown to a page that they're not intended for
                        if($routeParams.tabname &&
                            $routeParams.tabname !== page.tabname &&
                            !$element.attr('not-routing')){
                            //$routeParams = '';
                            $location.$$search = {
                                tabname:page.tabname
                            };
                            $location.$$compose();
                        }
                    };

                    $scope.$watch('pagelist', setup);

                    function setup() {
                        var tabMatch = false, i =0;
                        if(!$element.attr('not-routing')) {
                          if($routeParams.tabname){
                              for(i = 0; i < $scope.pagelist.length; i++) {
                                  if ($routeParams.tabname === $scope.pagelist[i].tabname){
                                      $scope.showTab(i);
                                      tabMatch = true;
                                      break;
                                  }
                              }
                          }
                        }
                        if(!tabMatch && $scope.pagelist) {
                            // show the first tab to start with
                            $scope.showTab(0);
                        }
                    }
                    setup();

                    if($scope.name) {
                        $scope.$parent[$scope.name] = {
                            showTab: $scope.showTab
                        };
                    }
                }]
            };
        }
    ]);
})();
