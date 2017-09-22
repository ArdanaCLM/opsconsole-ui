// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(){
    'use strict';

    //
    // Possible parameters:
    //  - data (required)
    //      graph data
    //  - config (required)
    //      graph configuration
    //  - wide (optional)
    //      boolean indicates a wide graph, if not specified the graph size will be regular
    //
    angular.module('operations-ui').directive('timeseries', ['styleutils', 'isUndefined',
        function(styleutils, isUndefined) {
            return {
                restrict: 'E',

                scope: {
                    data : '=',
                    config : '=',
                    wide: "="
                },

                template: function(element, attrs) {
                    if (angular.isUndefined(attrs.data) || angular.isUndefined(attrs.config)) {
                        console.log('timeseries data or config not defined');
                        return;
                    }
                    var wideGraphStr = angular.isUndefined(attrs.wide) ? false : attrs.wide;
                    var wideGraph = (wideGraphStr === 'true');
                    var graphWidth = wideGraph ? '1100px' : '510px';
                    var graphHeight = '160px';

                    var baseTemplate =
                    "<div ng-class=\"frameSize\" ng-controller=\"timeseriesController\">" +
                        "<div class=\"header\">" +
                            "<span class=\"title\">{{config.title}}</span>" +
                            "<span class=\"btn-group\" style=\"float:right\" dropdown ng-if=\"actionable\">" +
                                "<button type=\"button\" class=\"dropdown-toggle\" dropdown-toggle></button>" +
                                "<ul class=\"dropdown-menu wide\">" +
                                    "<li class=\"actionMenuItem actionMenuSubheader\">{{\"table.menuActions\" | translate | uppercase}}</li>" +
                                    "<li ng-if=\"!menuItem.show || (menuItem.show && menuItem.show(config))\" ng-repeat=\"menuItem in actionMenu\">" +
                                        "<button ng-click=\"menuItem.action(config)\" class=\"actionMenuItem\">{{menuItem.label | translate}}</button>" +
                                    "</li>" +
                                "</ul>" +
                            "</span>" +
                        "</div> " +
                        "<flot dataset=\"data\" options=\"graphOptions\" width=\"" + graphWidth + "\" height=\"" + graphHeight + "\"></flot>" +
                        "<div class=\"legend-area\">" +
                            "<ul class=\"legend\">" +
                                "<li ng-repeat=\"series in seriesLegends\" ng-class=\"{\'col-md-2\':wideGraph, \'col-md-4\':!wideGraph}\">" +
                                    "<div class=\"legend-icon\" style=\"background-color:{{series.color}}\"></div>" +
                                    "<div class=\"legend-text wide-graph-legend\"" +
                                        " tooltip={{series.name}} tooltip-placement=\"bottom\">{{series.name}}</div>" +
                                "</li>" +
                            "</ul>" +
                        "</div>" +
                    "</div>";
                    return baseTemplate;
                }
            };
        }
    ]);
})();