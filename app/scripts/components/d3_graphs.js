// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function () {
    'use strict';

    angular.module('operations-ui').directive('d3Bars', ['isUndefined', '$window', '$timeout', 'd3Service', 'validateChartData',
        'generateDynamicID', 'labelFormatterDay', 'labelFormatterHour', 'labelFormatterMinute', 'generateTickValues', 'bytesToSize',
        '$moment', 'round',
        function (isUndefined, $window, $timeout, d3, validateChartData, generateDynamicID, labelFormatterDay,
                  labelFormatterHour, labelFormatterMinute, generateTickValues, bytesToSize, $moment, round) {
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
                    scope.id = ele.attr('chartid') || generateDynamicID("d3_chart");
                    scope.legendConfig = scope.config.legendConfig;
                    scope.graphOptions = scope.config.graphOptions;
                    scope.loading = scope.config.loading ? scope.config.loading : false;
                    scope.no_data = scope.config.no_data ? scope.config.no_data : false;
                    scope.y_axis_format_specifier = scope.graphOptions.graphAxisConfig.yAxis ? scope.graphOptions.graphAxisConfig.yAxis.format : undefined;
                    scope.actionable = false;

                    scope.chartTitleData = validateChartData('chartTitle', scope.graphOptions);
                    var graphType = scope.graphtype,
                        graphColors = validateChartData('chartColor', scope.graphOptions),
                        axisData = validateChartData('chartAxis', scope.graphOptions),
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
                        graphColors = validateChartData('chartColor', config.graphOptions);
                        axisData = validateChartData('chartAxis', config.graphOptions);
                        scope.loading = config.loading ? config.loading : false;
                        scope.no_data = config.no_data ? config.no_data : false;
                        scope.y_axis_format_specifier = config.graphOptions.graphAxisConfig.yAxis ? config.graphOptions.graphAxisConfig.yAxis.format : undefined;
                    }

                    $(window).on('resize', scope.$apply);

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
                            updateConfigData(scope.config);
                            if (angular.isDefined(scope.data)) {
                                scope.render(scope.data);
                            }
                        });
                    }, true);

                    function prepare() {
                        if (!prepared) {
                            div = d3.select(id).append("div")
                                .attr("id", "tooltip")
                                .attr("class", "hidden");

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

                    function getXScale() {
                        if (graphType === 'linechart' || graphType === 'areachart') {
                            return d3.time.scale.utc().range([0, width])
                                .domain(d3.extent(scope.data, function (d) {
                                    return parseDate.parse(d[0]);
                                })).nice();
                        } else if (graphType === 'barchart') {
                            return d3.scale.ordinal().domain(scope.data.map(function (d) {
                                return parseDate.parse(d[0]);
                            })).rangeRoundBands([0, width], 0.7);
                        }
                    }

                    scope.render = _.throttle(function (data) {
                        prepare();

                        svg.selectAll("*").remove();

                        var xScale, yScale, xAxis, yAxis;

                        if (graphType !== 'stackarea' && graphType !== 'stackbar') {
                            // Parse the date / time
                            xScale = getXScale();
                            yScale = d3.scale.linear().range([height, 0]);

                            var excluded_data = [];
                            angular.forEach(data, function(d){
                                if(d[1] != -1) excluded_data.push(d);
                            });
                            if(axisData.yDomain !== undefined && axisData.yDomain.length === 2) yScale.domain(axisData.yDomain);
                            else yScale.domain([
                                d3.min(excluded_data, function (d) {
                                    return d[1];
                                }),
                                d3.max(excluded_data, function (d) {
                                    return d[1];
                                })]).nice();
                            var yTickValues = generateTickValues(yScale.domain()[0], yScale.domain()[1]);

                            // Adds the div for tooltips
                            data.sort(function (a, b) {
                                return parseDate.parse(a[0]) - parseDate.parse(b[0]);
                            });

                            var yAxisFormat = d3.format("g");
                            if(scope.y_axis_format_specifier && scope.y_axis_format_specifier === 'bytes') {
                                yAxisFormat = formatYAxisLabelsBytes;
                            } else if(typeof scope.y_axis_format_specifier === "function"){
                                yAxisFormat = scope.graphOptions.graphAxisConfig.yAxis.format;
                            }

                            xAxis = d3.svg.axis().scale(xScale).orient("bottom").innerTickSize(-height).outerTickSize(0).tickPadding(10);
                            yAxis = d3.svg.axis().scale(yScale).orient("left").innerTickSize(-width).outerTickSize(0).tickFormat(yAxisFormat).tickValues(yTickValues);

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
                        }

                        if (graphType === 'linechart') {
                            linechart(xScale, yScale, xAxis, yAxis);
                        } else if (graphType === 'barchart') {
                            barchart(xScale, yScale, xAxis, yAxis);
                        } else if (graphType === 'areachart') {
                            areachart(xScale, yScale, xAxis, yAxis);
                        } else if (graphType === 'stackarea') {
                            stackCharts();
                        } else if (graphType === 'stackbar') {
                            stackCharts();
                        }
                    }, 150);

                    function makeStackedChartsAxis(xAxis, yAxis) {
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
                                .attr("transform", "translate("+ (width - 10) + "," + height/2 + ") rotate(-90)")
                                .attr("dy", "0.71em");
                        }

                        svg.append('g')
                            .attr("class", "y axis")
                            .call(yAxis)
                            .selectAll("text")
                            .attr("y", 0)
                            .attr("x", width + 50);


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

                        svg.selectAll(".x .tick")[0].forEach(function (d, i){
                            if(i % scope.xAxisStep !== 0) d3.select(d).style("display", "none");
                        });
                    }

                    function formatYAxisLabelsBytes(value, index) {
                        var adjusted = parseFloat(value);
                        adjusted = bytesToSize(adjusted);
                        return adjusted;
                    }

                    function show_tooltip(xDate, yTooltipValue){
                        var yPosition = d3.event.y + 15;
                        var xPosition = d3.event.x - 110;
                        var xTooltipValue = "";
                        var valueText = "";

                        if (axisData.range === 'minutes' || axisData.range === 'hours') {
                            x = $moment(xVal).format('LTS');
                        } else if (axisData.range === 'days' || axisData.range === 'none') {
                            x = $moment(xVal).format('L');
                        }

                        //Update the tooltip position and value
                        var tooltip = d3.select(id).select("#tooltip")
                            .style("left", xPosition + "px")
                            .style("top", yPosition + "px");

                        if(scope.y_axis_format_specifier && scope.y_axis_format_specifier === 'bytes') {
                            valueText = formatYAxisLabelsBytes(yTooltipValue);
                        } else if(scope.y_axis_format_specifier && typeof scope.y_axis_format_specifier === 'function') {
                            valueText = scope.y_axis_format_specifier(yTooltipValue);
                        } else {
                            valueText = round(yTooltipValue);
                        }

                        tooltip.select(".value")
                            .text(valueText);
                        tooltip.select(".date")
                            .text(xTooltipValue);

                        //Show the tooltip
                        d3.select(id).select("#tooltip").classed("hidden", false);
                    }

                    function linechart(xScale, yScale, xAxis, yAxis) {

                        makeStackedChartsAxis(xAxis, yAxis);
                        // Define the line
                        var lineGen = d3.svg.line().interpolate("monotone")
                            .defined(function(d) { return d[1] != -1; })
                            .x(function (d) {
                                return xScale(parseDate.parse(d[0]));
                            })
                            .y(function (d) {
                                return yScale(d[1]);
                            });

                        svg.append('path')
                            .attr("class", "line")
                            .style("stroke", graphColors.stroke)
                            .attr('d', lineGen(scope.data));

                        var focus = svg.append("g")
                            .attr("class", "focus")
                            .style("display", "none");

                        focus.append("circle")
                            .attr("class", "y0")
                            .attr("r", 4.5);

                        var path = svg.select('.line').node();
                        var totLength = path.getTotalLength();

                        var mousemove = function () {
                            var xPos = d3.mouse(this)[0];
                            var x = xPos;
                            var beginning = x,
                                end = totLength,
                                target, pos;
                            while (true) {
                                target = Math.floor((beginning + end) / 2);
                                pos = path.getPointAtLength(target);
                                if ((target === end || target === beginning) && pos.x !== x) {
                                    break;
                                }
                                if (pos.x > x) end = target;
                                else if (pos.x < x) beginning = target;
                                else break; //position found
                            }
                            focus.attr("transform", "translate(" + x + "," + pos.y + ")");

                            var xDate = new Date(xScale.invert(pos.x));
                            var yTooltipValue = parseFloat(yScale.invert(pos.y)).toFixed(2);
                            if(xDate && yTooltipValue) show_tooltip(xDate, yTooltipValue);
                        };

                        svg.append("rect")
                            .attr("class", "overlay")
                            .attr("width", width)
                            .attr("height", height)
                            .attr("stroke", "#cccccc")
                            .on("mouseover", function () {
                                focus.style("display", null);

                            })
                            .on("mouseout", function () {
                                focus.style("display", "none");
                                d3.select(id).select("#tooltip").classed("hidden", true);
                            })
                            .on("mousemove", mousemove);

                    }

                    function areachart(xScale, yScale, xAxis, yAxis) {
                        makeStackedChartsAxis(xAxis, yAxis);
                        var area = d3.svg.area()
                            .interpolate("monotone")
                            .defined(function(d) { return d[1] != -1; })
                            .x(function (d) {
                                return xScale(parseDate.parse(d[0]));
                            })
                            .y0(height)
                            .y1(function (d) {
                                return yScale(d[1]);
                            });

                        svg.append("path")
                            .datum(scope.data)
                            .attr("class", "area")
                            .style("fill", graphColors.fill)
                            .style("stroke", graphColors.stroke)
                            .attr("d", area(scope.data));

                        var focus = svg.append("g")
                            .attr("class", "focus")
                            .style("display", "none");

                        focus.append("circle")
                            .attr("class", "y0")
                            .attr("r", 4.5);

                        var path = svg.select('.area').node();
                        var totLength = path.getTotalLength();

                        var area_mouse_move = function(){
                            var xPos = d3.mouse(this)[0];
                            var x = xPos;
                            var beginning = x,
                                end = totLength,
                                target, pos;
                            while (true) {
                                target = Math.floor((beginning + end) / 2);
                                pos = path.getPointAtLength(target);
                                if ((target === end || target === beginning) && pos.x !== x) {
                                    break;
                                }
                                if (pos.x > x) end = target;
                                else if (pos.x < x) beginning = target;
                                else break; //position found
                            }
                            focus.attr("transform", "translate(" + x + "," + pos.y + ")");

                            var xDate = new Date(xScale.invert(pos.x));
                            var yTooltipValue = parseFloat(yScale.invert(pos.y)).toFixed(2);
                            if(xDate && yTooltipValue) show_tooltip(xDate, yTooltipValue);
                        };

                        svg.append("rect")
                            .attr("class", "overlay")
                            .attr("width", width)
                            .attr("height", height)
                            .attr("stroke", "#cccccc")
                            .on("mouseover", function () {
                                focus.style("display", null);
                            })
                            .on("mouseout", function () {
                                focus.style("display", "none");
                                d3.select(id).select("#tooltip").classed("hidden", true);
                            })
                            .on("mousemove", area_mouse_move);
                    }


                    function barchart(xScale, yScale, xAxis, yAxis) {

                        makeStackedChartsAxis(xAxis, yAxis);
                        svg.selectAll("bar")
                            .data(scope.data)
                            .enter().append("rect")
                            .attr('class', "bar")
                            .style("fill", graphColors.fill)
                            .style("stroke", graphColors.stroke)
                            .attr("x", function (d) {
                                return xScale(parseDate.parse(d[0]));
                            })
                            .attr("width", xScale.rangeBand() - 10)
                            .attr("y", function (d) {
                                return yScale(d[1]);
                            })
                            .attr("height", function (d) {
                                return height - yScale(d[1]);
                            })
                            .on('mousemove', function(d){
                                var xTooltipValue = parseDate.parse(d[0]);
                                var yVal = d[1].toFixed(2);
                                show_tooltip(xTooltipValue, yVal);
                            })
                            .on("mouseout", function(d){  //Mouse event
                                d3.select(id).select("#tooltip").classed("hidden", true);
                            });

                    }


                    function stackCharts() {
                        var x, y, stackColors, xAxis, yAxis, colorFlag, layers;
                        var ary = [], tickValues = [];

                        if (graphType === 'stackarea') {
                            x = d3.time.scale().range([0, width]);
                        } else {
                            x = d3.scale.ordinal().rangeRoundBands([0, width], 0.7);
                        }

                        y = d3.scale.linear().range([height, 0]);

                        if (!angular.isUndefined(scope.graphOptions.graphColors.stackColors) && scope.graphOptions.graphColors.stackColors.length > 0) {
                            colorFlag = true;
                            stackColors = scope.graphOptions.graphColors.stackColors;
                        } else {
                            stackColors = d3.scale.category10();
                        }

                        xAxis = d3.svg.axis()
                            .scale(x)
                            .orient("bottom").tickSize(0)
                            .innerTickSize(-height).outerTickSize(0);

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

                        if (axisData.tickFormat !== 'none') {
                            if (axisData.range === 'hours') {
                                xAxis.tickFormat(function (d) {
                                    return labelFormatterHour(d);
                                });
                            } else if (axisData.range === "days") {
                                xAxis.tickFormat(function (d) {
                                    return labelFormatterDay(d);
                                });
                            } else if (axisData.range === "minutes") {
                                xAxis.tickFormat(function (d) {
                                    return labelFormatterMinute(d);
                                });
                            }
                        }

                        yAxis = d3.svg.axis()
                            .scale(y)
                            .orient("left")
                            .innerTickSize(-width).outerTickSize(0);

                        var stack = d3.layout.stack()
                            .offset("zero")
                            .values(function (d) {
                                return d.data;
                            })
                            .x(function (d) {
                                return parseDate.parse(d[0]);
                            })
                            .y(function (d) {
                                return d[1];
                            });

                        if (graphType === 'stackarea') {
                            var area = d3.svg.area()
                                .interpolate("monotone")
                                .defined(function(d) { return d[1] != -1; })
                                .x(function (d) {
                                    return x(parseDate.parse(d[0]));
                                })
                                .y0(function (d) {
                                    return y(d.y0);
                                })
                                .y1(function (d) {
                                    return y(d.y0 + d.y);
                                });

                            layers = stack(scope.data);

                            ary = [];
                            layers.forEach(function (d) {
                                ary.push(d.data);
                            });

                            x.domain(d3.extent(d3.merge(ary), function (d) {
                                return parseDate.parse(d[0]);
                            })).nice();

                            if(axisData.yDomain !== undefined && axisData.yDomain.length === 2) y.domain(axisData.yDomain);
                            else y.domain([d3.min(d3.merge(ary), function(d){
                                return d.y0 + d.y != -1 ? d.y0 + d.y : 0;
                            }), d3.max(d3.merge(ary), function (d) {
                                return d.y0 + d.y;
                            })]).nice();

                            tickValues = generateTickValues(y.domain()[0], y.domain()[1]);
                            yAxis.tickFormat(d3.format("g")).tickValues(tickValues);

                            makeStackedChartsAxis(xAxis, yAxis);
                            svg.selectAll(".layer")
                                .data(layers)
                                .enter().append("path")
                                .attr("class", "layer")
                                .attr("d", function (d) {
                                    return area(d.data);
                                })
                                .style("fill", function (d, i) {
                                    return colorFlag ? stackColors[i] : stackColors(i);
                                });

                            var focus = svg.append("g")
                                .attr("class", "focus")
                                .style("display", "none");

                            focus.append("circle")
                                .attr("class", "y0")
                                .attr("r", 4.5);

                            svg.selectAll(".layer")
                                .attr("opacity", 1)
                                .on("mouseover", function(d, i){
                                    focus.style("display", null);
                                }).on("mousemove", function(d, i){
                                    var coords = d3.mouse(this);
                                    var mousex = coords[0];
                                    var mousey = coords[1];
                                    var invertedy = y.invert(mousey).toFixed(2);
                                    var inv_date = parseDate.parse(x.invert(mousex));
                                    if(invertedy && inv_date){
                                        focus.attr("transform", "translate(" + mousex + "," + mousey + ")");
                                        focus.style("display", null);
                                        show_tooltip(inv_date, invertedy);
                                    }
                                }).on("mouseout", function(d, i){
                                    focus.style("display", "none");
                                    d3.select(id).select("#tooltip").classed("hidden", true);
                                });

                        } else {
                            layers = stack(scope.data);

                            ary = [];
                            layers.forEach(function (d) {
                                ary.push(d.data);
                            });

                            x.domain(ary[0].map(function (d) {
                                return parseDate.parse(d[0]);
                            }));

                            if(axisData.yDomain !== undefined && axisData.yDomain.length === 2) y.domain(axisData.yDomain);
                            else y.domain([d3.min(d3.merge(ary), function(d){
                                return d.y0 + d.y != -1 ? d.y0 + d.y : 0;
                            }), d3.max(d3.merge(ary), function (d) {
                                return d.y0 + d.y;
                            })]).nice();

                            tickValues = generateTickValues(y.domain()[0], y.domain()[1]);
                            yAxis.tickFormat(d3.format("g")).tickValues(tickValues);


                            makeStackedChartsAxis(xAxis, yAxis);
                            var layer = svg.selectAll(".layer")
                                .data(layers)
                                .enter().append("g")
                                .attr("class", "layer")
                                .style("fill", function (d, i) {
                                    return colorFlag ? stackColors[i] : stackColors(i);
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
                                    return y(d.y + d.y0);
                                })
                                .attr("height", function (d) {
                                    return y(d.y0) - y(d.y + d.y0);
                                })
                                .attr("width", x.rangeBand() - 1)
                                .on("mousemove", bar_mouse_move)
                                .on("mouseout", function () {
                                    //Hide the tooltip
                                    d3.select(id).select("#tooltip").classed("hidden", true);
                                });
                        }
                    }
                }
            };
        }]);
})();
