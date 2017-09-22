// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(){
    'use strict';

    angular.module('operations-ui').controller('TimeSeriesGraphControllerOld', ['$scope', '$element', 'styleutils', 'isUndefined',
        function($scope, $element, styleutils, isUndefined) {
            var flotElement = $('flot', $element);
            var elementDataSetBinding = flotElement.attr('dataset');
            var graphColors = styleutils.graphColors();
            var borderColor =  styleutils.plotGuideColor();

            $scope.isDragging = false;

            function showTooltip(x, y, contents) {
                $('<div id="flot_chart_tooltip" class="timeseries_tooltip">' + contents + '</div>').css( {
                    top: y - 25,
                    left: x + 13
                }).appendTo("body").fadeIn(200);
            }

            /**
             * finds the minimum and maximum timestamps in a set of data
             */
            function generateRanges(dataSet) {
                var min, max = 0;
                for(var i = 0, length = dataSet.length; i < length; i += 1) {
                    var currentDataSet = dataSet[i];
                    if(currentDataSet.hasOwnProperty("data")) {
                        var currentDataArray = currentDataSet.data;
                        for(var j = 0, arrayLen = currentDataArray.length; j < arrayLen; j += 1) {
                            var currentData = currentDataArray[j][0];
                            if(currentData < min || !min) {
                                min = currentData;
                            }
                            else if(currentData > max) {
                                max = currentData;
                            }
                        }
                    }
                }
                var ranges = {
                    xaxis : {
                        from : min,
                        to : max
                    }
                };

                return ranges;
            }


            $scope.graphOptions = {
                series: {
                    lines: { show: true, lineWidth: 5 },
                    points: { show: false},
                    shadowSize: 0
                },
                xaxis: { mode: "time", tickLength: 5 },
                colors: graphColors,
                selection: { mode: "x" },
                grid: {
                    hoverable: true,
                    borderWidth: 1,
                    borderColor: borderColor
                },
                legend: {
                    show: true
                }
            };

            //maps to "placeholderElem" in the original piano source
            //main container of the graph canvas's (there are 2)
            var graphContainer = $('div', flotElement);

            //bind the placeholder chart with plothover
            $(flotElement).bind("plothover", function (event, pos, item) {
                if (item) {
                    //if there is an existing tooltip and its not the current item, remove it
                    if(!isUndefined($scope.lastTooltipItem) && $scope.lastTooltipItem.dataIndex !== item.dataIndex) {
                        $("#flot_chart_tooltip").remove();
                    }

                    //add the tooltip if there isnt one now or if its a new item
                    if(isUndefined($scope.lastTooltipItem) || $scope.lastTooltipItem.dataIndex !== item.dataIndex) {
                        $scope.lastTooltipItem = item;
                        showTooltip(item.pageX, item.pageY, item.datapoint[1]);
                    }
                } else {
                    //clear the tooltip
                    $scope.lastTooltipItem = undefined;
                    $("#flot_chart_tooltip").remove();
                }
            });


            //deals with the case where the legend is displayed independently from the canvas
            if (flotElement.attr('legendid')) {
                var legendElementId = flotElement.attr('legendid');
                $scope.graphOptions.legend.container = legendElementId;

                $('> table', legendElementId).removeAttr('style');
                $('.legendColorBox > div > div', legendElementId).unwrap();
                // re-order legend table columns
                $('table tr', legendElementId).each(function(index, row) {
                    // remove first cell and re-append
                    var cell = $('td', row).first();
                    cell.detach();
                    $(row).append(cell);
                });
            }

            var updateSelectionPlot = function (selectionElement){
                var overviewOptions = {
                    series: {
                        lines: { show: true, lineWidth: 1 },
                        shadowSize: 0
                    },
                    xaxis: { mode: "time", tickLength: 5},
                    yaxis: { ticks: [], min: 0, autoscaleMargin: 0.1 },
                    selection: { mode: "x" },
                    colors: graphColors,
                    grid: {
                        hoverable: true,
                        clickable: true,
                        borderWidth: 1,
                        borderColor: borderColor
                    },
                    legend:{show:false}
                };

                var data = $scope[elementDataSetBinding];
                var overview = $.plot(selectionElement, data, overviewOptions);

                //going to save off the plot for later
                var plot = $.plot(graphContainer, data, $scope.graphOptions);

                // connect the plot to the zoomable overview
                $(graphContainer).unbind("plotselected");
                $(graphContainer).bind("plotselected", function (event, ranges) {
                    if (!isUndefined(ranges.xaxis) && !isUndefined(ranges.xaxis.from) && !isUndefined(ranges.xaxis.to)) {
                        // do the zooming
                        plot = $.plot(graphContainer, data, $.extend(true, {}, $scope.graphOptions, {
                            xaxis: {
                                min: ranges.xaxis.from,
                                max: ranges.xaxis.to
                            }
                        }));
                        // don't fire event on the overview to prevent eternal loop
                        overview.setSelection(ranges, true);
                    }
                });

                selectionElement.unbind("plotselected");
                selectionElement.bind("plotselected", function (event, ranges) {
                    plot.setSelection(ranges);
                });

                //we need to detect if it was a click or a selection so that we may proceed to
                //display the correct data
                selectionElement.mousedown(function (e) {
                    var x = e.clientX;
                    var y = e.clientY;
                    var minMovement = 3;
                    $(window).mousemove(function (e) {
                        if (Math.abs(e.clientX - x) > minMovement || Math.abs(e.clientY - y) > minMovement) {
                            $scope.isDragging = true;
                            $(window).unbind("mousemove");
                        }
                    });
                }).mouseup(function () {
                    $(window).unbind("mousemove");
                });

                // if mouse isn't dragged a "plotClick" event will be triggered
                selectionElement.unbind("plotclick");
                selectionElement.bind("plotclick", function (event, pos, item) {
                    if (!$scope.isDragging) {
                        if (item) {
                            var dataPoint = item.series.data[item.dataIndex];
                            if (dataPoint[0]) {
                                var beginning = new Date(dataPoint[0]), end = new Date(dataPoint[0]);
                                beginning.setHours(0, 0, 0, 0);
                                end.setHours(23, 59, 59, 999);
                                var ranges = {
                                    xaxis: {
                                        from: beginning.getTime(),
                                        to: end.getTime()
                                    }
                                };
                                plot.setSelection(ranges);
                            }
                        }
                    }
                    $scope.isDragging = false;
                });



            };

            var refreshGraphAndSelection = function(){
                var selectionid = flotElement.attr('selectionid');
                if(!isUndefined(selectionid) && selectionid.length > 0){
                    var selectionElement = $(selectionid, flotElement.parent());
                    if(!isUndefined(selectionElement)) {
                        updateSelectionPlot($(selectionElement));
                    }
                }
            };



            $scope.$watch(elementDataSetBinding, refreshGraphAndSelection);
        }
    ]);

})();