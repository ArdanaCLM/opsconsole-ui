// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(){
    'use strict';

    angular.module('operations-ui').directive("ocplot", ['styleutils',
        function(styleutils) {
            return {
                restrict: "E",
                template: function(element, attrs){
                    var graphWidth = attrs.width || '600px';
                    var graphHeight = attrs.height || '300px';
                    var legendid = attrs.legendid || '';
                    var stackbar = attrs.stackbar;
                    return "<div ng-controller=\"PlotGraphController\"><flot dataset=\"" + attrs.dataset + "\" " +
                        "options=\"graphOptions\" " +
                        "width=\"" + graphWidth + "\" " +
                        "height=\"" + graphHeight + "\" " +
                        "legendid=\"" + legendid + "\" " +
                        "stackbar=\"" + stackbar + "\" " +
                        "></flot></div>";
                }
            };
        }
    ]);
})();