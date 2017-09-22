// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function () {
    'use strict';

    angular.module('operations-ui').directive('d3MultiChart', ['isUndefined', '$window', '$timeout', 'd3Service', 'validateChartData',
        'generateDynamicID', 'labelFormatterDay', 'labelFormatterHour', 'labelFormatterMinute', 'generateTickValues',
        '$moment', 'bytesToSize', 'log', 'round',
        function (isUndefined, $window, $timeout, d3, validateChartData, generateDynamicID, labelFormatterDay,
                  labelFormatterHour, labelFormatterMinute, generateTickValues, $moment, bytesToSize, log, round) {
            return {
                restrict: 'E',
                scope: {
                    data: '=',
                    graphtype: '=',
                    width: '=',
                    height: '=',
                    config: '='
                },
                templateUrl: 'components/d3_components/d3_graphs.html',
                link: function (scope, ele, attrs) {
                    scope.id = scope.config.id || ele.attr('chartid') || generateDynamicID("d3_chart");
                    scope.legendConfig = scope.config.legendConfig;
                    // fallback for charts where loading variable is not added in chart config
                    scope.loading = scope.config.loading ? scope.config.loading : false;
                    scope.no_data = scope.config.no_data ? scope.config.no_data : false;
                    scope.graphOptions = scope.config.graphOptions;
                    scope.y_axis_format_specifier = scope.graphOptions.graphAxisConfig.yAxis ? scope.graphOptions.graphAxisConfig.yAxis.format : undefined;
                    scope.actionable = false;

                    scope.chartTitleData = validateChartData('chartTitle', scope.graphOptions);
                    var graphType = scope.graphtype,
                        axisData = validateChartData('chartAxis', scope.graphOptions),
                        stackColors = scope.graphOptions.graphColors.stackColors,
                        width = scope.width || 1200,
                        height = scope.height || 360,
                        margin = {top: 30, right: 40, bottom: 30, left: 40},
                        prepared = false,
                        div, svg;
                    if(scope.y_axis_format_specifier && scope.y_axis_format_specifier === 'bytes') margin.right = 60;

                    if (!angular.isUndefined(scope.config.actionMenu) && scope.config.actionMenu.length > 0) {
                        scope.actionable = true;
                        scope.actionMenu = scope.config.actionMenu;
                    }
                    if(!angular.isUndefined(scope.graphOptions.graphAxisConfig) &&
                        !angular.isUndefined(scope.graphOptions.graphAxisConfig.xAxis) &&
                        !angular.isUndefined(scope.graphOptions.graphAxisConfig.xAxis.step)) {
                        scope.xAxisStep = scope.graphOptions.graphAxisConfig.xAxis.step;
                    } else scope.xAxisStep = 1;

                    scope.legendButtonClick = function ($event, chart_id) {
                        scope.$emit('d3ChartLegendButtonAction', $($event.target).closest('oc-radio').find('input').val(), chart_id);
                    };

                    scope.legendSwatchStyle = function(legend){
                        return {"background" : legend.color};
                    };

                    var id = '#' + scope.id;
                    width = width - (margin.left + margin.right);
                    height = height - 2 * (margin.top + margin.bottom);
                    var parseDate = d3.time.format.iso;

                    function updateConfigData(config) {
                        scope.chartTitleData = validateChartData('chartTitle', config.graphOptions);
                        stackColors = config.graphOptions.graphColors.stackColors;
                        axisData = validateChartData('chartAxis', config.graphOptions);
                        scope.loading = config.loading ? config.loading : false;
                        scope.no_data = config.no_data ? config.no_data : false;
                        scope.y_axis_format_specifier = config.graphOptions.graphAxisConfig.yAxis ? config.graphOptions.graphAxisConfig.yAxis.format : undefined;
                    }

                    scope.$watch(function () {
                        return angular.element($window)[0].innerWidth;
                    }, function () {
                        $timeout(function () {
                            if (angular.isDefined(scope.data)) {
                                scope.render(scope.data);
                            } else {
                                prepare();
                            }
                        });
                    });

                    scope.$watch('[data, config]', function () {
                        $timeout(function () {
                            checkDataGaps();
                            updateConfigData(scope.config);
                            if (angular.isDefined(scope.data)) {
                                scope.render(scope.data);
                            }
                        });
                    }, true);

                    function checkDataGaps() {
                        scope.potentialError = false;
                        scope.no_data = false;
                        if(scope.loading) {
                          //we're loading don't check
                          return;
                        }
                        if(!Array.isArray(scope.data) || scope.data.length === 0) {
                            scope.potentialError = true;
                            scope.no_data = true;
                            log('debug', 'D3MultiChart: we have no data.');
                            return;
                        }
                        for(var ii=0;ii<scope.data.length;ii++) {
                            var element= scope.data[ii],
                            averageSpan = 0,
                            lastTime = 0;
                            for(var idx=0;idx<element.data.length;idx++) {
                                var datum = element.data[idx];
                                if(averageSpan === 0 && lastTime !== 0) {
                                    averageSpan = lastTime.diff(datum[0]);
                                } else if(averageSpan !== 0 && lastTime !== 0 && datum[1] !== -1) {
                                    var diff = lastTime.diff(datum[0]);
                                    if(Math.abs(Math.abs(averageSpan)-Math.abs(diff)) > 3600000) {
                                        scope.potentialError = true;
                                        log('debug', 'D3MultiChart: we may have a gap on element ' + ii + ' at ' + idx + ' time difference was' + diff);
                                        return;
                                    } else {
                                      averageSpan = (averageSpan + diff) / 2;
                                    }
                                }
                                if(datum[1] !== -1) {
                                  lastTime = moment(datum[0]);
                                }
                            }
                        }
                    }
                    scope.$watch('loading', checkDataGaps);

                    function prepare() {
                        if (!prepared) {

                            div = d3.select(id).append("div")
                                .attr("id", "tooltip")
                                .attr("class", "hidden");

                            div.append("p").append("span").attr("class", "value");
                            div.append("p").append("span").attr("class", "date");

                            svg = d3.select(id).select('.d3_charts')
                                .append("svg")
                                .style('width', '100%')
                                .attr("height", height + margin.top + margin.bottom)
                                .attr("class", "bg-color")
                                .append("g")
                                .attr("transform", "translate(" + "20" + "," + margin.top + ")");

                            prepared = true;
                        }
                    }

                    function show_tooltip(xVal, yVal){
                        var x;
                        var yPos = d3.event.clientY + 15;
                        var xPos = d3.event.clientX - 110;
                        var valueText = "";

                        //Update the tooltip position and value
                        var tooltip = d3.select(id).select("#tooltip")
                            .style("left", xPos + "px")
                            .style("top", yPos + "px");
                        if (axisData.range === 'minutes' || axisData.range === 'hours') {
                            x = $moment(xVal).format('LTS');
                        } else if (axisData.range === 'days' || axisData.range === 'none') {
                            x = $moment(xVal).format('L');
                        }
                        if(scope.y_axis_format_specifier && scope.y_axis_format_specifier === 'bytes') {
                            valueText = formatYAxisLabelsBytes(yVal);
                        } else if(scope.y_axis_format_specifier && typeof scope.y_axis_format_specifier === 'function') {
                            valueText = scope.y_axis_format_specifier(yVal);
                        } else {
                            valueText = round(yVal);
                        }
                        tooltip.select(".value")
                            .text(valueText);
                        tooltip.select(".date")
                            .text(x);
                        //Show the tooltip
                        d3.select(id).select("#tooltip").classed("hidden", false);
                    }

                    function addAxis(xAxis, yAxis) {
                        svg.append('g')
                            .attr("class", "x axis")
                            .attr("transform", "translate(0," + height + ")")
                            .call(xAxis)
                            .selectAll("text")
                            // select the tick value and adjust its position after axis gets called
                            .attr("y", 12)
                            .attr("x", 0);

                        if(!angular.isUndefined(scope.legendConfig['y-label'])) {
                            svg.append("text")
                                .style("text-anchor", "middle")
                                .text(scope.legendConfig['y-label'])
                                .attr("class", "axis-label")
                                .attr("transform", "translate("+ (width + 5) + "," + height/2 + ") rotate(-90)")
                                .attr("dy", "0.71em");
                        }

                        if(scope.y_axis_format_specifier && scope.y_axis_format_specifier === 'bytes') {
                            svg.append('g')
                                .attr("class", "y axis")
                                .call(yAxis)
                                .selectAll("text")
                                .attr("y", 0)
                                .attr("x", width + 70);
                        } else {
                            svg.append('g')
                                .attr("class", "y axis")
                                .call(yAxis)
                                .selectAll("text")
                                .attr("y", 0)
                                .attr("x", width + 50);
                        }

                        var last = svg.selectAll(".y .tick text")[0].length;

                        svg.selectAll(".y .tick text")[0].forEach(function (d, i) {
                            if (i == last - 1) {
                                return;//for showing last tick
                            }
                            if (i % 2 == 1)
                                d3.select(d).style("display", "none");//for showing alternate ticks
                        });

                        var last_line = svg.selectAll(".y .tick line")[0].length;

                        svg.selectAll(".y .tick line")[0].forEach(function (d, i) {
                            if (i == last_line - 1) {
                                return;//for showing last tick
                            }
                            if (i % 2 == 1)
                                d3.select(d).style("stroke", "#f6f6f6");//for showing alternate ticks
                        });

                        svg.selectAll(".x .tick line")[0].forEach(function (d, i){
                            d3.select(d).style("display", "none");
                        });

                        var tick_steps = svg.selectAll(".x .tick")[0];
                        // Always show First and Last Time Intervals
                        var last_tick = tick_steps.pop();
                        var first_tick = tick_steps.shift();
                        tick_steps.forEach(function (d, i){
                            if(i % scope.xAxisStep !== 0) d3.select(d).style("display", "none");
                        });
                        tick_steps.push(last_tick);
                        tick_steps.unshift(first_tick);
                    }

                    function formatYAxisLabelsBytes(value, index) {
                        var adjusted = parseFloat(value);
                        adjusted = bytesToSize(adjusted);
                        return adjusted;
                    }

                    scope.render = _.throttle(function (data) {
                        prepare();

                        svg.selectAll("*").remove();
                        var ary = [], x, y, tickValues = [], x1;

                        if (graphType === 'multiline' || graphType === 'multiarea') {
                            x = d3.time.scale().range([0, width]);
                        } else {
                            x = d3.scale.ordinal().rangeRoundBands([0, width], 0.7);
                            x1 = d3.scale.ordinal();
                        }

                        y = d3.scale.linear().range([height, 0]);

                        var xAxis = d3.svg.axis()
                            .scale(x)
                            .orient("bottom").tickSize(0)
                            .innerTickSize(-height).outerTickSize(0);

                        var yAxis = d3.svg.axis()
                            .scale(y).innerTickSize(-width)
                            .orient("left").outerTickSize(0);

                        if (data.length > 0) {
                            ary = data.map(function (d) {
                                return d.data;
                            });

                            if (graphType === 'multiline' || graphType === 'multiarea') {
                                var range = d3.extent(d3.merge(ary), function (d) {
                                    return parseDate.parse(d[0]);
                                });
                                if(range.length != 2 || range[0] === range[1]) return;
                                else x.domain(range);
                            } else {
                                x.domain(ary[0].map(function (d) {
                                    return parseDate.parse(d[0]);
                                }));

                                x1.domain(data.map(function (d) {
                                    return d.label;
                                })).rangeRoundBands([0, x.rangeBand()]);

                            }


                            if (graphType === 'multiline' || graphType === 'multiarea') {
                                var arr = [];
                                //var no_data_arr = [];
                                angular.forEach(data, function(d){
                                    var temp = [];
                                    //var temp2 = [];
                                    angular.forEach(d.data, function(item, idx){
                                        if(item[1] != -1) temp.push(item);
                                        //else if(item[1] === -1 && d.data.length > idx && idx > 1 && d.data[idx-1]
                                        //    && d.data[idx+1]) {
                                        //    if(d.data[idx-1][1] != -1) temp2.push(d.data[idx-1]);
                                        //    //temp2.push(item);
                                        //    if(d.data[idx+1][1] != -1) temp2.push(d.data[idx+1]);
                                        //}
                                    });
                                    arr.push({ data: temp, label: d.label });
                                    //no_data_arr.push({ data: temp2, label: d.label })
                                });
                                if(axisData.yDomain !== undefined && axisData.yDomain.length === 2) y.domain(axisData.yDomain);
                                else {
                                    var min = angular.isDefined(axisData.yMin) ? axisData.yMin : d3.min(arr, function (c) {
                                        return d3.min(c.data, function (v) {
                                            return v[1];
                                        });
                                    });
                                    var max = d3.max(arr, function (c) {
                                        return d3.max(c.data, function (v) {
                                            return v[1];
                                        });
                                    });
                                    if (isNaN(min) || min.toFixed(3) == max.toFixed(3)) y.domain([max - 2, max + 2]);
                                    else y.domain([min, max]);
                                }
                                tickValues = generateTickValues(y.domain()[0], y.domain()[1]);
                            } else {
                                if(axisData.yDomain !== undefined && axisData.yDomain.length === 2) y.domain(axisData.yDomain);
                                else {
                                    y.domain([
                                        angular.isDefined(axisData.yMin) ? axisData.yMin : d3.min(data, function (c) {
                                            return d3.min(c.data, function (v) {
                                                return v[1] != -1 ? v[1] : 0;
                                            });
                                        }),
                                        d3.max(data, function (c) {
                                            return d3.max(c.data, function (v) {
                                                return v[1];
                                            });
                                        })
                                    ]);
                                }
                                tickValues = generateTickValues(y.domain()[0], y.domain()[1]);
                            }
                            var yAxisFormat = d3.max(tickValues) > 1000 ? d3.format(".3s") : d3.format("g");
                            if(scope.y_axis_format_specifier && scope.y_axis_format_specifier === 'bytes') {
                                yAxisFormat = formatYAxisLabelsBytes;
                            } else if(typeof scope.y_axis_format_specifier === "function"){
                                yAxisFormat = scope.graphOptions.graphAxisConfig.yAxis.format;
                            }
                            yAxis.tickFormat(yAxisFormat).tickValues(tickValues);

                            if (axisData.interval[0] !== -1 && axisData.interval[0] !== "none") {
                                if (axisData.interval[1] === "hours") {
                                    xAxis.ticks(d3.time.hour, axisData.interval[0]);
                                } else if (axisData.interval[1] === "minutes") {
                                    xAxis.ticks(d3.time.minute, axisData.interval[0]);

                                } else if (axisData.interval[1] === "days") {
                                    xAxis.ticks(d3.time.day, axisData.interval[0]);
                                }
                            } else {
                                xAxis.ticks(5);
                            }

                            var formatters = {
                                hours: labelFormatterHour,
                                days: labelFormatterDay,
                                minutes: labelFormatterMinute
                            };

                            if (axisData.tickFormat !== 'none') {
                                xAxis.tickFormat(formatters[axisData.range]);
                            }

                            svg.append("rect")
                                .attr("class", "overlay")
                                .attr("width", width)
                                .attr("height", height)
                                .attr("stroke", "#cccccc");

                            addAxis(xAxis, yAxis);
                            if (graphType === 'multiline') {

                                var line = d3.svg.line()
                                    .interpolate("monotone")
                                    .defined(function(d) { return (d[1] != -1); })
                                    .x(function (d) {
                                        return x(parseDate.parse(d[0]));
                                    })
                                    .y(function (d) {
                                        return y(d[1]);
                                    });

                                var focus = svg.append('g')
                                    .attr('class', 'focus')
                                    .style('display','none');

                                focus.append('circle')
                                    .attr('class', 'y0')
                                    .attr('r', 4.5);

                                var series = svg.selectAll(".series")
                                    .data(data)
                                    .enter().append("g")
                                    .attr("class", "series");

                                series.append("path")
                                    .attr("class", "line")
                                    .attr("d", function (d) {
                                        return line(d.data);
                                    })
                                    .style("stroke", function (d, i) {
                                        return stackColors[i];
                                    })
                                    .on("mouseover", function (d, i) {
                                        //focus.style('display', function(d, j){ return null; });
                                        focus.style('display', null);
                                    })
                                    .on("mouseout", function (d, i) {
                                        //focus.style('display', function(d, j) { return 'none'; });
                                        focus.style('display', 'none');
                                        //svg.selectAll('.line').style('opacity', 1)
                                        d3.select(id).select("#tooltip").classed("hidden", true);
                                    })
                                    .on("mousemove", function(d, i){
                                        var xVal, yVal, index, v0, v1, xUnparsed = x.invert(d3.mouse(this)[0]);
                                        var bisectDate = d3.bisector(function(d) { return new Date(d[0]); }).left;
                                        //look for the datapoint closest to where the mouse is
                                        if(d.data.length > 1) {
                                            //find the point after where the mouse hovering in the dataset
                                            index = bisectDate(d.data, xUnparsed, 1);

                                            //grab the datapoint and the previous one so that the mouse pointer
                                            //is between these two points in the dataset
                                            v0 = d.data[index - 1];
                                            v1 = d.data[index];

                                            //check which one the mouse is closest to
                                            //Date.parse is getting the milliseconds date
                                            if (Math.abs(Date.parse(v0[0]) - Date.parse(xUnparsed)) < Math.abs(Date.parse(v1[0]) - Date.parse(xUnparsed))) {
                                                yVal = v0[1];
                                                //update the date value to ISO format for display
                                                xVal = parseDate.parse(new Date(v0[0]));
                                            } else {
                                                yVal = v1[1];
                                                //update the date value to ISO format for display
                                                xVal = parseDate.parse(new Date(v1[0]));
                                            }
                                            focus.attr("transform", "translate(" + d3.mouse(this)[0] + "," + d3.mouse(this)[1] + ")");
                                            show_tooltip(xVal, yVal);
                                        }
                                    });

                                //var non_cont_line = d3.svg.line()
                                //    .interpolate("monotone")
                                //    .x(function (d) {
                                //        return x(parseDate.parse(d[0]));
                                //    })
                                //    .y(function (d) {
                                //        return y(d[1]);
                                //    });
                                //
                                //var overlay = svg.selectAll('non_cont_series')
                                //    .data(no_data_arr)
                                //    .enter().append("g")
                                //    .attr('class', "non_cont_series series");
                                //
                                //    overlay.append('path')
                                //    .attr("class", "line")
                                //    .attr("d", function (d) {
                                //        console.log('d.data ', d.data);
                                //        return non_cont_line(d.data);
                                //    })
                                //    .style("stroke", function (d, i) {
                                //        return stackColors[i];
                                //    })
                                //    .style('stroke-dasharray', function(d, i){
                                //        console.log("stroke-dasharray ", d, i);
                                //        return '2 2';
                                //    });

                            } else if (graphType === 'multibar') {
                                var layer = svg.selectAll(".layer")
                                    .data(data)
                                    .enter().append("g")
                                    .attr("class", "layer")
                                    .attr("transform", function (d) {
                                        var r = parseFloat(x1(d.label));
                                        if (r === 0) {
                                            r = r - 5;
                                        }
                                        return "translate(" + r + ",0)";

                                    })
                                    .style("fill", function (d, i) {
                                        return stackColors[i];
                                    }).style("stroke", function (d, i) {
                                        return stackColors[i];
                                    });

                                var bar_mouse_move = function(d, i){
                                    var xTooltipValue = parseDate.parse(d[0]);
                                    var yVal = d[1].toFixed(2);
                                    show_tooltip(xTooltipValue, yVal);
                                };

                                layer.selectAll("rect")
                                    .data(function (d) {
                                        return d.data;
                                    })
                                    .enter().append("rect")
                                    .attr("x", function (d) {
                                        return x(parseDate.parse(d[0]));
                                    })
                                    .attr("y", function (d) {
                                        return y(d[1]); //Note this is returning data
                                    })
                                    .attr("height", function (d) {
                                        return height - y(d[1]); //Note this is returning data
                                    })
                                    .attr("width", x.rangeBand() - 1)
                                    .on("mouseover", bar_mouse_move)
                                    .on("mousemove", bar_mouse_move)
                                    .on("mouseout", function () {
                                        //Hide the tooltip
                                        d3.select(id).select("#tooltip").classed("hidden", true);
                                    });


                            } else if (graphType === 'multiarea') {

                                var area = d3.svg.area()
                                    .interpolate("monotone")
                                    .defined(function(d) { return (d[1] != -1); })
                                    .x(function (d) {
                                        return x(parseDate.parse(d[0]));
                                    })
                                    .y0(height)
                                    .y1(function (d) {
                                        return y(d[1]);
                                    });

                                svg.selectAll(".layer")
                                    .data(data)
                                    .enter().append("path")
                                    .attr("class", "layer")
                                    .attr("d", function (d) {
                                        return area(d.data);
                                    })
                                    .style("fill", function (d, i) {
                                        return stackColors[i];
                                    })
                                    .style("stroke", function (d, i) {
                                        return stackColors[i];
                                    }).on("mouseover", function(d, i){
                                        if(angular.isDefined(focus)){
                                            focus.style("display", null);
                                        }
                                    }).on("mousemove", function(d, i){
                                        var coords = d3.mouse(this);
                                        var mousex = coords[0];
                                        var mousey = coords[1];
                                        var invertedy = y.invert(mousey).toFixed(2);
                                        var inv_date = parseDate.parse(x.invert(mousex));
                                        if(invertedy && inv_date){
                                            if(angular.isDefined(focus)) {
                                                focus.attr("transform", "translate(" + mousex + "," + mousey + ")");
                                                focus.style("display", null);
                                            }
                                            show_tooltip(inv_date, invertedy);
                                        }

                                    }).on("mouseout", function(d, i){
                                        if(angular.isDefined(focus)){
                                            focus.style("display", "none");
                                        }
                                        d3.select(id).select("#tooltip").classed("hidden", true);
                                    });

                                var focus_hightlight = svg.append("g")
                                    .attr("class", "focus")
                                    .style("display", "none");

                                focus_hightlight.append("circle")
                                    .attr("class", "y0")
                                    .attr("r", 4.5);
                            }
                        }
                    }, 150);
                }
            };
        }]);
})();
