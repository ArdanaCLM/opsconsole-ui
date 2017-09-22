// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC

//
// Directive handles the donutd attribute that should be in any svgdonut element
//
(function(){
    'use strict';
    angular.module('operations-ui').directive("donutd", [
        'styleutils',
        function(styleutils) {
        return {
            restrict: "A",

            scope: {
                donutd : '='
            },

            link : function(scope, el, attr) {
                scope.$watch('donutd', function(donutd) {
                    //first we make a tiny non-visible line to help Firefox show the whole graph
                    var newD = "M0 0 L0.0001 0.0001" +
                    //start point of arc offset by thickness of largest stroke in graph
                               " M" + (donutd.sPos[0] +   donutd.thickness/2) +
                               " "  + (donutd.sPos[1] +   donutd.thickness/2) +
                    //arc radius is a circle of half width/height of the graph
                               " A" +  donutd.w/2 +
                               " "  +  donutd.h/2 +
                    //this is always 0 for our purposes
                               " 0" +
                    //arcsweep and draw dir determine which circle and which part of that circle to show
                               " "  +  donutd.arcSweep +
                               " "  +  donutd.drawDir +
                    //the end point of the arc offset by largest stroke in graph
                               " "  + (donutd.ePos[0] +   donutd.thickness/2) +
                               " "  + (donutd.ePos[1] +   donutd.thickness/2);
                    //set the path d atribute now that we have correctlyu calculated it
                    el.attr('d', newD);
                }, true);
            }
        };
    }]);
})();

//
// Directive to allow donut graphs to be placed wherever svgdonut element is in HTML
//
(function(){
    'use strict';
    angular.module('operations-ui').directive("svgdonut", [
        '$translate',
        'styleutils',
        function($translate, styleutils) {
            return {
                restrict: "E",

                scope: {
                    data : '=',
                    ctitle : '=',
                    withold : '='
                },

                templateUrl: 'components/svg_round/svgdonut.html',

                link : function(scope, el, attr) {

                    function polarToCartesian(radius, angleInDegrees, cX, cY) {
                      var angleInRadians = (-90 + angleInDegrees) * Math.PI / 180.0;
                      var x = cX + radius * Math.cos(angleInRadians);
                      var y = cY - radius * -Math.sin(angleInRadians);
                      return [x,y];
                    }

                    scope.$watch('data', function(data) {
                        if(typeof data === 'undefined') {
                            data = { ok:{count:0},
                                    warning:{count:0},
                                    critical:{count:0},
                                    unknown:{count:0}
                            };
                        }

                        var sum = data.ok.count + data.warning.count + data.critical.count + data.unknown.count;

                        function handleArc(arc, sum, sAngle) {
                            //start angle
                            arc.sAngle = sAngle;
                            //the 'length' of the arc in degrees
                            arc.delta = (arc.count / sum) * 360;
                            //check if this is going to be a circle or not
                            arc.delta = arc.delta >= 360 ? 359.9999 : arc.delta; //limit to juuuuust under a full circle
                            //we manually set the largest arc stroke to 18px so all arcs line up to each other
                            arc.thickness = 18;
                            //we need to know how tall and wide to our draw space is....take into account stroke thickness
                            arc.w = $(el).find('svg').width() - arc.thickness;
                            arc.h = $(el).find('svg').height() - arc.thickness;
                            //end angle of the arc
                            arc.eAngle = arc.sAngle + arc.delta;
                            //find the x,y coords of the start and end angle
                            arc.sPos = polarToCartesian( arc.w/2, arc.sAngle, arc.w/2, arc.h/2 );
                            arc.ePos = polarToCartesian( arc.w/2, arc.eAngle, arc.w/2, arc.h/2 );
                            arc.arcSweep = arc.eAngle - arc.sAngle <= 180 ? "0" : "1"; //determine which circle to draw the arc on
                            arc.drawDir = arc.sAngle > arc.eAngle ? "0" : "1"; //determine which part of the circle we use
                        }

                        //calculate an arc for each value in turn
                        handleArc(data.unknown, sum, 0);
                        handleArc(data.critical, sum, data.unknown.eAngle);
                        handleArc(data.warning, sum, data.critical.eAngle);
                        handleArc(data.ok, sum, data.warning.eAngle);

                    }, true);
                }
            };
        }
    ]);
})();
