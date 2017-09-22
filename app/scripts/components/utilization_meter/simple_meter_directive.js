// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(){
    'use strict';

    angular.module('operations-ui').directive("ocsimplemeter", ['isUndefined',
        function(isUndefined) {
            return {
                restrict: "E",
                templateUrl: 'components/simplemeter.html',
                scope: {},
                controller: ['$scope', '$element', function($scope, $element){
                    $scope.updateFill = function() {
                        var fillPct = $element.attr('fillPct');
                        if (typeof fillPct === 'string' &&
                            fillPct.indexOf('%') !== -1) {
                            var percRegex = new RegExp('%', 'g');
                            fillPct = fillPct.replace(percRegex, '');
                        }

                        if (isNaN(fillPct)) {
                            fillPct = 0;
                        }

                        //make it not over
                        if (fillPct > 100) {
                            fillPct = 100;
                        }

                        var emptyPct = 100 - fillPct;
                        var value = $element.attr('value');
                        if (isUndefined(value)) {
                            value = fillPct + "%";
                        }

                        if(!isUndefined($element.attr('reversefill'))){
                            var temp = fillPct;
                            fillPct = emptyPct;
                            emptyPct = temp;
                        }

                        $scope.fillpct = fillPct + "%";
                        $scope.emptypct = emptyPct + "%";
                        $scope.value = value;

                        $scope.fillstyle = { 'width' : $scope.fillpct };
                    };

                    $scope.updateFill();

                    $scope.includePercentSign = !isUndefined($element.attr('includepercentsign'));

                    //in case the fillPct attribute is an expression, watch for it
                    //to be evaluated and update the bar afterwards
                    $scope.$watch(function(){
                        return $element.attr('fillPct');
                    }, $scope.updateFill);
                }]
            };
        }
    ]);
})();