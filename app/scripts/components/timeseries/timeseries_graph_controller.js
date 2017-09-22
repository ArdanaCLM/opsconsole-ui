// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
    'use strict';

    //
    // Available 'config' values:
    //  - title (required)
    //      graph title string
    //  - type (required)
    //      graph type string: 'line', 'area', 'stackedArea', 'bar', 'stackedBar'
    //  - actionMenu (optional, no action menus if not provided)
    //      object contains action menu config:
    //          - label   (menu label string)
    //          - action  (menu function definition)
    //  - timeUnit (optional, use Flot's label if not provided)
    //      time unit string for x-axis labels: 'minute', 'hour', 'day'
    //
    angular.module('operations-ui').controller('timeseriesController', ['$scope', '$element', 'styleutils',
        function($scope, $element, styleutils) {
            var graphColors = styleutils.timeseriesGraphColors();
            var borderColor = styleutils.GRAYS[4];
            var labelColor = styleutils.timeseriesLabelColor();
            $scope.actionable = false;
            if (!angular.isUndefined($scope.config.actionMenu) && $scope.config.actionMenu.length > 0) {
                $scope.actionable = true;
                $scope.actionMenu = $scope.config.actionMenu;
            }
            $scope.wideGraph = angular.isUndefined($scope.wide) ? false : $scope.wide;
            $scope.frameSize = $scope.wideGraph ? 'large-frame' : 'small-frame';
            $scope.seriesLegends = [];
            var graphFont = {size: 14, color: labelColor};
            $scope.graphOptions = {
                colors: graphColors,
                grid: {
                    borderWidth: {top:1, right:0, bottom:3, left:3},
                    borderColor: borderColor
                },
                xaxis: {
                    mode: "time",
                    tickLength: 0,
                    font: graphFont
                },
                yaxis: {font: graphFont},
                legend: {show: false}
            };

            switch($scope.config.type) {
                case 'line':
                    $scope.graphOptions.series = {lines: {show: true}, shadowSize: 0};
                    break;
                case 'area':
                    $scope.graphOptions.series = {lines: {show: true, fill: 0.6, lineWidth: 0}};
                    break;
                case 'stackedArea':
                    $scope.graphOptions.series = {
                        stack: true,
                        lines: {show: true, fill: 1, lineWidth: 0}
                    };
                    break;
                case 'bar':
                    $scope.graphOptions.series = {
                        bars: {show: true, barWidth: 24*60*60*1000*0.13, align: 'center', fill: 1, order: 1}};
                    break;
                case 'stackedBar':
                    $scope.graphOptions.series = {
                        stack: true,
                        bars: {show: true, barWidth: 24*60*60*1000*0.4, align: 'center', fill: 1}};
                    break;
            }

            function labelFormatterMinute(val, axis) {
                var minute = Math.floor(($scope.timeNow - val) / (60 * 1000));
                if (minute <= 1) {
                    return '<span class="graphLabel">NOW</span>';
                } else {
                    return '<span class="graphLabel">-' + minute + 'M</span>';
                }
            }
            function labelFormatterHour(val, axis) {
                var hour = Math.floor(($scope.timeNow - val) / (60 * 60 * 1000));
                if (hour === 0) {
                    return '<span class="graphLabel">NOW</span>';
                } else {
                    return '<span class="graphLabel">-' + hour + 'HR</span>';
                }
            }
            function labelFormatterDay(val, axis) {
                var day = Math.floor(($scope.timeNow -val) / (24 * 60 * 60 * 1000));
                if (day === 0) {
                    return '<span class="graphLabel">TODAY</span>';
                } else {
                    return '<span class="graphLabel">-' + day + 'D</span>';
                }
            }
            switch ($scope.config.timeUnit) {
                case 'minute':
                    $scope.graphOptions.xaxis.tickFormatter = labelFormatterMinute;
                    break;
                case 'hour':
                    $scope.graphOptions.xaxis.tickFormatter = labelFormatterHour;
                    $scope.graphOptions.xaxis.tickSize = [1, 'hour'];
                    break;
            }

            $scope.$watch('data', function(data) {
                if (data.length > 0) {
                    // Now time which is the last data point
                    $scope.timeNow = $scope.data[0].data[$scope.data[0].data.length - 1][0];
                    // time at the beginning of the data range
                    $scope.timeThen = $scope.data[0].data[0][0];
                    // range of data in hours
                    var rangeInHours = ($scope.timeNow - $scope.timeThen) / (60 * 60 * 1000);

                    if ($scope.seriesLegends.length === 0) {
                        for (var i=0; i < data.length; i++) {
                            $scope.seriesLegends.push({'name': $scope.data[i].label, 'color': graphColors[i]});
                        }
                    }

                    switch ($scope.config.timeUnit) {
                        case 'minute':
                            if ($scope.config.type === 'bar' || $scope.config.type === 'stackedBar') {
                                $scope.graphOptions.series.bars.barWidth = 24*60*60*1000*0.0015;
                                $scope.graphOptions.xaxis.max = new Date(moment($scope.timeNow).add(2, 'minutes')).getTime();
                                $scope.graphOptions.xaxis.min = new Date(moment($scope.timeThen).subtract(2, 'minutes')).getTime();
                            }
                            break;
                        case 'hour':
                            if ($scope.config.type === 'bar' || $scope.config.type === 'stackedBar') {
                                $scope.graphOptions.series.bars.barWidth = 24*60*60*1000*0.005;
                                $scope.graphOptions.xaxis.max = new Date(moment($scope.timeNow).add(10, 'minutes')).getTime();
                                $scope.graphOptions.xaxis.min = new Date(moment($scope.timeThen).subtract(10, 'minutes')).getTime();
                            }
                            break;
                        case 'day':
                            // if there's not enough data (less than 24 hours), use Flot's default date format
                            if (rangeInHours > 24) {
                                $scope.graphOptions.xaxis.tickFormatter = labelFormatterDay;
                                $scope.graphOptions.xaxis.tickSize = [1, 'day'];
                            }
                            break;
                    }
                }
            }, true);
        }
    ]);
})();