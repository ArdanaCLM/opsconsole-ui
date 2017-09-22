// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(){
    'use strict';

    angular.module('operations-ui').directive("octEnumFilter",[
        function() {
            return {
                restrict: "E",
                replace: true,
                templateUrl: 'components/table_extras/enum_filter.html'
            };
        }
    ]).directive("octTextFilter",[
        function() {
            return {
                restrict: "E",
                templateUrl: 'components/table_extras/text_filter.html'
            };
        }
    ]).directive("octSortControl",[
        function() {
            return {
                restrict: "E",
                templateUrl: 'components/table_extras/sort_control.html'
            };
        }
    ]).directive("octViewControls",[
        function() {
            return {
                restrict: "E",
                templateUrl: 'components/table_extras/view_controls.html'
            };
        }
    ]).directive("octRowSelectionControls",[
        function() {
            return {
                restrict: "E",
                templateUrl: 'components/table_extras/row_selection_control.html'
            };
        }
    ]).directive("octGlobalActionsControl",[
        function() {
            return {
                restrict: "E",
                templateUrl: 'components/table_extras/global_actions_control.html'
            };
        }
    ]).directive("octMultiRowActionsControl",[
        function() {
            return {
                restrict: "E",
                templateUrl: 'components/table_extras/selected_rows_actions_control.html'
            };
        }
    ]).directive("octStdHeader",[
        function() {
            return {
                restrict: "E",
                templateUrl: 'components/table_extras/standard_table_header.html'
            };
        }
    ]).directive("octBasicHeader",[
        function() {
            return {
                restrict: "E",
                transclude: true,
                templateUrl: 'components/table_extras/basic_table_header.html'
            };
        }
    ]).directive("octNextPrevCtrl",[
        function() {
            return {
                restrict: "E",
                templateUrl: 'components/table_extras/details_next_prev_ctrl.html',
                link: function ($scope, $element, attrs, ctrl, transclude) {
                    $scope.itemPrev = function(data){
                        $scope.$emit('detailPrevItem', data);
                    };

                    $scope.itemNext = function(data){
                        $scope.$emit('detailNextItem', data);
                    };

                    $scope.$on('detailsIndexInfo', function($event, detailsIndexInfo){
                        if(detailsIndexInfo.total === 0){
                            $scope.disableNext = true;
                            $scope.disablePrev = true;
                        } else {
                            $scope.disablePrev = false;
                            $scope.disableNext = false;
                        }

                        if(detailsIndexInfo.index === 0){
                            $scope.disablePrev = true;
                        }

                        if(detailsIndexInfo.index >= (detailsIndexInfo.total - 1)){
                            $scope.disableNext = true;
                        }
                    });

                }
            };
        }
    ]);
})();
