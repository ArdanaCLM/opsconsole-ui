// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(){
    'use strict';

    angular.module('operations-ui').directive("ocheatmap", ['styleutils', 'isUndefined', 'getLocale',
        function(styleutils, isUndefined, getLocale) {
            var graphColors = styleutils.graphColors();
            return {
                restrict: "E",
                templateUrl: 'components/ocheatmap.html',
                scope: { dataset: '=',
                         clickfunc: '=',
                         ctitle: '=' },

                link: function($scope, element, attributes) {

                    $scope.getClasses = function(data){
                        // Determine the appropriate css classes to apply to the item
                        var classes = "";
                        if (data.state == 'ok' || data.state == 'warning' || data.state == 'critical')
                            classes = data.state;
                        else
                            classes = 'unknown';

                        if (angular.isDefined($scope.clickfunc))
                            classes += " pointer";

                        return classes;
                    };

                    $scope.callClickFunc = function(data){
                        if (angular.isDefined($scope.clickfunc))
                            $scope.clickfunc(data);
                    };

                    $scope.showTitle = !isUndefined(element.attr('ctitle'));
                }
            };
        }
    ]);
})();
