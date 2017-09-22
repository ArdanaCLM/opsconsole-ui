// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function () {
    'use strict';

    angular.module('operations-ui').controller('PlotGraphController', ['$scope', '$element', 'styleutils',
        'getKeyFromScope', 'isUndefined', 'copyKeyFromScope',
        function ($scope, $element, styleutils, getKeyFromScope, isUndefined, copyKeyFromScope) {
            var flotElement = $('flot', $element);
            var elementDataSetBinding = flotElement.attr('dataset');
            var stackbarChart = getKeyFromScope(flotElement.attr('stackbar'), $scope.$parent) || flotElement.attr('stackbar') || "false";
            var graphColors = styleutils.graphColors();
            var stackBarChartColors = styleutils.stackBarColors();
            var borderColor = styleutils.plotGuideColor();
            var includeHover = angular.isDefined($element.attr('hover'));

            $scope.graphOptions = {
                series: {
                    stack: 1,
                    lines: {},
                    bars: {},
                    points: {},
                    shadowSize: 0
                },
                colors: graphColors,
                grid: {
                    borderWidth: 1,
                    borderColor: borderColor,
                    hoverable: includeHover,
                    clickable: false
                },
                legend: {
                    show: false,
                    container: "",
                    noColumns: 2
                },
                xaxis: {
                    tickLength: 0
                }
            };

            if (typeof(stackbarChart) != "undefined" && stackbarChart !== null && stackbarChart.toString() == "true") {
                $scope.graphOptions.series.stack = 0;
                $scope.graphOptions.series.lines.show = false;
                $scope.graphOptions.series.lines.steps = false;
                $scope.graphOptions.series.bars.show = true;
                $scope.graphOptions.colors = stackBarChartColors;
                $scope.graphOptions.series.bars.barWidth = 0.99;
                $scope.graphOptions.series.bars.align = 'center';
                $scope.graphOptions.series.stack = true;
                $scope.graphOptions.xaxis.tickFormatter = labelFormatterDay;

            } else {  //this else block is for Plot Chart
                $scope.graphOptions.series.stack = false;
                $scope.graphOptions.series.lines.show = true;
                $scope.graphOptions.series.bars.show = false;
                $scope.graphOptions.series.lines.lineWidth = 5;
                $scope.graphOptions.series.points.show = false;
                $scope.graphOptions.series.shadowSize = 0;

            }

            if (flotElement.attr('legendid')) {
                var legendElementId = flotElement.attr('legendid');
                if (legendElementId.split('#')[0] === "") {
                    $scope.graphOptions.legend.container = legendElementId;
                } else {

                    $scope.graphOptions.legend.container = getKeyFromScope(flotElement.attr('legendid'), $scope.$parent);
                    var custumLegendId = $scope.graphOptions.legend.container.split('#')[1];
                    var ledendDiv = '<div id=\"' + custumLegendId + "\"" + ' class="plotLegendDiv"></div>';
                    flotElement.after(ledendDiv);
                }
                legendElementId = $scope.graphOptions.legend.container;
                $scope.graphOptions.legend.show = true;

                $('> table', legendElementId).removeAttr('style');
                $('.legendColorBox > div > div', legendElementId).unwrap();
                // re-order legend table columns
                $('table tr', legendElementId).each(function (index, row) {
                    // remove first cell and re-append
                    var cell = $('td', row).first();
                    cell.detach();
                    $(row).append(cell);
                });
            }

            function labelFormatterDay(val, axis) {
                if (val === 0) {
                    return '<span>TODAY</span>';
                } else {
                    return '<span>' + val + 'D</span>';
                }
            }
        }
    ]);

})();