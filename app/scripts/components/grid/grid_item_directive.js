// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';

    ng.module('operations-ui').directive('gridItem', ['getKeyFromScope', '$window', '$http', '$location', '$translate',
        function (getKeyFromScope, $window, $http, $location, $translate) {
            return {
                restrict: 'E',
                scope: {},
                transclude: true,
                templateUrl: 'components/grid_item.html',
                link: function (scope, el, attrs) {
                    scope.title = attrs.itemTitle;
                    scope.type = getKeyFromScope(attrs.itemType, scope.$parent);
                    scope.rows = getKeyFromScope(attrs.itemRowData, scope.$parent);
                    scope.gridHeaderImage = attrs.itemHeaderIcon || "/images/icons/dashboard/blades.png";
                    scope.plotType = attrs.plotType;
                    scope.gridData = getKeyFromScope(attrs.itemGridData, scope.$parent);
                    scope.tableData = [];
                    scope.gridItemTableConfig = getKeyFromScope(attrs.itemTableConfig, scope.$parent) || {};
                    scope.tableDataCount = 0;
                    scope.labelData = getKeyFromScope(attrs.itemLabelData, scope.$parent);
                    scope.progressData = getKeyFromScope(attrs.itemLoading, scope.$parent);


                    scope.gridAction = function(){
                        scope.labelAction(scope.labelData.actionType, scope.labelData.actionData);
                    };

                    scope.labelAction = function (actionType, actionData) {

                        if (actionType === 'anchor') {
                            var protocol = $location.protocol();
                            var host = $location.host();
                            var delimeter = ":";
                            var separator = "//";
                            var port = $location.port();
                            var url = actionData;
                            var filter = "";
                            if (actionData.indexOf('&') !== -1) {
                                url = actionData.substr(0, actionData.indexOf('&'));
                                filter = actionData.substr(actionData.indexOf('&'));
                            }

                            var hash = "#" + url + "?" +
                                ($location.url().split('?')[1] !== undefined ? $location.url().split('?')[1] : "");

                            var new_url = protocol + delimeter + separator + host + delimeter + port + "/" + hash + filter;
                            $window.open(new_url, "_self");
                        } else if (actionType === 'modal') {
                            scope.gridItemTableLoadingFlag = false;
                            scope.gridModalFlag = !scope.gridModalFlag;
                            scope.tableData = actionData;
                            scope.tableDataCount = scope.tableData.length;
                        }
                    };
                }
            };
        }]);
})(angular);