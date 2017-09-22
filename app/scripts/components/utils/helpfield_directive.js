// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
    'use strict';

    angular.module('operations-ui').directive("helpfield", [
        function () {
            return {
                restrict: "E",
                transclude: true,
                scope: {},//TODO - scope keeps tooltips accurate, make sure it doesn't interfere with input controllers
                templateUrl: 'components/helpfield.html',
                controller: ['$scope', '$element', '$translate', '$rootScope',
                    function($scope, $element, $translate, $rootScope) {
                        $translate($element.attr('helpKey')).then(function(helpContent){
                            $scope.helpTooltip = helpContent;
                        });

                        $scope.inlineHelpEnabled = $rootScope.inlineHelpEnabled;
                        $rootScope.$watch('inlineHelpEnabled', function(){
                            $scope.inlineHelpEnabled = $rootScope.inlineHelpEnabled;
                        });
                    }
                ]
            };
        }
    ]);
})();