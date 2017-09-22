// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
//leveraged from Piano Style.js file for graph styling consistency
angular.module("operations-ui").factory("styleutils", function () {

    //leveraged from http://stackoverflow.com/questions/2707790/get-a-css-value-from-external-style-sheet-with-javascript-jquery
    //per creative commons license applicable to stackoverflow answers
    function getStyleSheetPropertyValue(selectorText, propertyName) {
        // search backwards because the last match is more likely the right one
        for (var s = document.styleSheets.length - 1; s >= 0; s--) {
            var cssRules = document.styleSheets[s].cssRules ||
                document.styleSheets[s].rules || []; // IE support
            for (var c = 0; c < cssRules.length; c++) {
                if (cssRules[c].selectorText === selectorText)
                    return cssRules[c].style[propertyName];
            }
        }
        return null;
    }

    var BLUES = [
        getStyleSheetPropertyValue('.oc-graph-blue-1', 'color'),
        getStyleSheetPropertyValue('.oc-graph-blue-2', 'color'),
        getStyleSheetPropertyValue('.oc-graph-blue-3', 'color'),
        getStyleSheetPropertyValue('.oc-graph-blue-4', 'color')
    ];

    var GRAYS = [
        getStyleSheetPropertyValue('.oc-graph-gray-1', 'color'),
        getStyleSheetPropertyValue('.oc-graph-gray-2', 'color'),
        getStyleSheetPropertyValue('.oc-graph-gray-3', 'color'),
        getStyleSheetPropertyValue('.oc-graph-gray-4', 'color'),
        getStyleSheetPropertyValue('.oc-graph-gray-5', 'color')
    ];

    var GREENS = [
        getStyleSheetPropertyValue('.oc-graph-green-1', 'color'),
        getStyleSheetPropertyValue('.oc-graph-green-2', 'color'),
        getStyleSheetPropertyValue('.oc-graph-green-3', 'color'),
        getStyleSheetPropertyValue('.oc-graph-green-4', 'color')
    ];

    var PURPLES = [
        getStyleSheetPropertyValue('.oc-graph-purple-1', 'color'),
        getStyleSheetPropertyValue('.oc-graph-purple-2', 'color'),
        getStyleSheetPropertyValue('.oc-graph-purple-3', 'color'),
        getStyleSheetPropertyValue('.oc-graph-purple-4', 'color'),
        getStyleSheetPropertyValue('.oc-graph-purple-5', 'color'),
        getStyleSheetPropertyValue('.oc-graph-purple-6', 'color')
    ];

    var YELLOWS = [
        getStyleSheetPropertyValue('.oc-graph-yellow-1', 'color')
    ];

    var BROWNS = [
        getStyleSheetPropertyValue('.oc-graph-brown-1', 'color')
    ];

    var NICECOLORS = [
        getStyleSheetPropertyValue('.utilized-color', 'color'),
        getStyleSheetPropertyValue('.unutilized-color', 'color')
    ];

    var STATUSCOLORS = [
        getStyleSheetPropertyValue('.status-ok-color', 'color'),
        getStyleSheetPropertyValue('.status-error-color', 'color'),
        getStyleSheetPropertyValue('.status-warning-color', 'color'),
        getStyleSheetPropertyValue('.status-unknown-color', 'color')
    ];

    var SUMMARYSTATUSCOLORS = [
        getStyleSheetPropertyValue('.status-ok-color', 'color'),
        getStyleSheetPropertyValue('.status-error-color', 'color'),
        getStyleSheetPropertyValue('.status-unknown-color', 'color')
    ];

    var COMPUTESTATUSCOLORS = [
        getStyleSheetPropertyValue('.status-ok-color', 'color'),
        getStyleSheetPropertyValue('.status-error-color', 'color'),
        getStyleSheetPropertyValue('.oc-graph-blue-1', 'color')
    ];


    var STATECOLORS = [
        getStyleSheetPropertyValue('.status-ok-color', 'color'),
        getStyleSheetPropertyValue('.oc-graph-blue-1', 'color'),
        getStyleSheetPropertyValue('.status-unknown-color', 'color'),
        getStyleSheetPropertyValue('.status-error-color', 'color')
    ];

    var ALARMSTATECOLORS = [    
        getStyleSheetPropertyValue('.oc-alarm-ok-color', 'color'),
        getStyleSheetPropertyValue('.oc-alarm-warning-color', 'color'),
        getStyleSheetPropertyValue('.oc-alarm-critical-color', 'color'),
        getStyleSheetPropertyValue('.oc-alarm-unknown-color', 'color'),
        getStyleSheetPropertyValue('.oc-alarm-open-color', 'color'),
        getStyleSheetPropertyValue('.oc-alarm-acknowledged-color', 'color'),
        getStyleSheetPropertyValue('.oc-alarm-resolved-color', 'color')
    ];

    var OCGRAPHCOLORS = [
      getStyleSheetPropertyValue('.oc-graph-color-1', 'color'),
      getStyleSheetPropertyValue('.oc-graph-color-2', 'color'),
      getStyleSheetPropertyValue('.oc-graph-color-3', 'color'),
      getStyleSheetPropertyValue('.oc-graph-color-4', 'color'),
      getStyleSheetPropertyValue('.oc-graph-color-5', 'color'),
      getStyleSheetPropertyValue('.oc-graph-color-6', 'color'),
      getStyleSheetPropertyValue('.oc-graph-color-7', 'color'),
      getStyleSheetPropertyValue('.oc-graph-color-8', 'color'),
    ];

    return {
        BLUES: BLUES,
        GRAYS: GRAYS,
        GREENS: GREENS,
        PURPLES: PURPLES,
        GRAPH_COLORS: [BLUES[0], PURPLES[2], GRAYS[1], BLUES[2], PURPLES[1]],
        OC_GRAPH_COLORS: OCGRAPHCOLORS,
        STACKBAR_COLORS: [BLUES[0], GRAYS[1]],
        GRAPH_COLORS_FADED: [BLUES[1], PURPLES[3], GRAYS[2], BLUES[3], PURPLES[2]],
        SUMMARY_COLORS: [BLUES[0], BLUES[1], BLUES[2]],
        SUMMARY_BASE_COLOR: GRAYS[2],
        TIMESERIES_GRAPH: [BLUES[0], GRAYS[4], PURPLES[5], GRAYS[0], YELLOWS[0], BROWNS[0]],
        STATUS_COLORS: {
            error: getStyleSheetPropertyValue('.status-error-color', 'color'),
            warning: getStyleSheetPropertyValue('.status-warning-color', 'color'),
            ok: getStyleSheetPropertyValue('.status-ok-color', 'color'),
            unknown: getStyleSheetPropertyValue('.status-unknown-color', 'color'),
            disabled: getStyleSheetPropertyValue('.status-disabled-color', 'color')
        },

        graphColors: function () {
            return angular.copy(this.GRAPH_COLORS.slice(0));
        },

        ocGraphColors: function () {
            return angular.copy(this.OC_GRAPH_COLORS.slice(0));
        },

        stackBarColors: function () {
            return angular.copy(this.STACKBAR_COLORS.slice(0));
        },
        niceGraphColors: function () {
            return angular.copy(NICECOLORS);
        },

        statusGraphColors: function () {
            return angular.copy(STATUSCOLORS);
        },

        summaryStatusGraphColors: function () {
            return angular.copy(SUMMARYSTATUSCOLORS);
        },

        stateGraphColors: function () {
            return angular.copy(STATECOLORS);
        },

        computeStatusGraphColors: function () {
            return angular.copy(COMPUTESTATUSCOLORS);
        },

        plotGuideColor: function () {
            return getStyleSheetPropertyValue('.plot-guide-color', 'color');
        },

        alarmStateGraphColors: function () {    
            return angular.copy(ALARMSTATECOLORS);  
        },

        timeseriesGraphColors: function() {
            return angular.copy(this.TIMESERIES_GRAPH);
        },

        timeseriesLabelColor: function() {
            return getStyleSheetPropertyValue('.timeseries-label-color', 'color');
        },

        getStyleSheetPropertyValue: getStyleSheetPropertyValue
    };
});
