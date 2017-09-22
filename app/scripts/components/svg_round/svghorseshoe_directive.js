// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC

//
// Directive handles the donutd attribute that should be in any horseshoed element
//
(function(){
    'use strict';
    angular.module('operations-ui').directive("horseshoed", [
        'styleutils',
        function(styleutils) {
        return {
            restrict: "A",

            scope: {
                horseshoed : '='
            },

            link : function(scope, el, attr) {
                scope.$watch('horseshoed', function(horseshoed) {
                    if(horseshoed !== undefined ) {
                        if(horseshoed.sPos !== undefined) {
                            //start point of arc offset by thickness of largest stroke in graph
                            var newD = " M" + (horseshoed.sPos[0] +   horseshoed.thickness/2) +
                                       " "  + (horseshoed.sPos[1] +   horseshoed.thickness/2) +
                            //arc radius is a circle of half width/height of the graph
                                       " A" +  horseshoed.w/2 +
                                       " "  +  horseshoed.h/2 +
                            //this is always 0 for our purposes
                                       " 0" +
                            //arcsweep and draw dir determine which circle and which part of that circle to show
                                       " "  +  horseshoed.arcSweep +
                                       " "  +  horseshoed.drawDir +
                            //the end point of the arc offset by largest stroke in graph
                                       " "  + (horseshoed.ePos[0] +   horseshoed.thickness/2) +
                                       " "  + (horseshoed.ePos[1] +   horseshoed.thickness/2);
                            //set the path d atribute now that we have correctlyu calculated it
                            el.attr('d', newD);
                            el.parent().find('circle').attr('cx',horseshoed.ePos[0]+horseshoed.thickness/2).attr('cy',horseshoed.ePos[1]+horseshoed.thickness/2).attr('r','5');
                        }
                    }
                }, true);
            }
        };
    }]);
})();

//
// Directive to allow donut graphs to be placed wherever svghorseshoe element is in HTML
//
(function(){
    'use strict';
    angular.module('operations-ui').directive("svghorseshoe", [
        '$translate',
        'styleutils',
        function($translate, styleutils) {
            return {
                restrict: "E",

                scope: {
                    data : '=',
                    max : '=',
                    unit : '=',
                    label : '=',
                    altsummary : '@',
                    dynsummary: '=',
                    ctitle : '='
                },

                templateUrl: 'components/svg_round/svghorseshoe.html',

                link : function(scope, el, attr) {
                    scope.percentage = 'percentage' in attr;
                    scope.gData = {};
                    scope.fillColor = 'black';
                    scope.overflow = false;

                    function polarToCartesian(radius, angleInDegrees, cX, cY) {
                      var angleInRadians = (-230 + angleInDegrees) * Math.PI / 180.0;
                      var x = cX + radius * Math.cos(angleInRadians);
                      var y = cY - radius * -Math.sin(angleInRadians);
                      return [x,y];
                    }

                    scope.$watch('data', function() {
                        function handleArc(data, gData, max) {
                            scope.fillColor = 'black';
                            scope.overflow = false;
                            if(typeof data === 'undefined') {
                                //will show as No Data
                                return;
                            }

                            //convert data to simple number
                            if( data.hasOwnProperty('count') )
                                data = data.count;

                            if(typeof max === 'undefined') {
                                max = data;
                            }

                            if((data / 1) > (max / 1) &&  scope.percentage === true) {
                                scope.overflow = true;
                                scope.fillColor = 'red';
                            }
                            //start angle
                            gData.sAngle = 0;
                            //the 'length' of the arc in degrees (278 is the max arc length to make horseshoe shape, -1 degree to account for tip)
                            if(angular.isDefined(data) && max !== 0) {
                                if(scope.overflow) {
                                    gData.delta = 278 - 1; //just show full horseshoe
                                }
                                else {
                                    gData.delta = (data / max) * 278 - 1;
                                }
                            }
                            else {
                                gData.delta = 0;
                            }
                            //we manually set the largest arc stroke to 18px so all arcs line up to each other
                            gData.thickness = 18;
                            //we need to know how tall and wide to our draw space is....take into account stroke thickness
                            gData.w = $(el).find('svg').width() - gData.thickness;
                            gData.h = $(el).find('svg').height() - gData.thickness;
                            //end angle of the arc
                            gData.eAngle = gData.sAngle + gData.delta;
                            //find the x,y coords of the start and end angle
                            gData.sPos = polarToCartesian( gData.w/2, gData.sAngle, gData.w/2, gData.h/2 );
                            gData.ePos = polarToCartesian( gData.w/2, gData.eAngle, gData.w/2, gData.h/2 );
                            gData.arcSweep = gData.eAngle - gData.sAngle <= 180 ? "0" : "1"; //determine which circle to draw the arc on
                            gData.drawDir = gData.sAngle > gData.eAngle ? "0" : "1"; //determine which part of the circle we use
                        }

                        //calculate an arc for each value in turn
                        handleArc(scope.data, scope.gData, scope.max);

                    }, true);
                }
            };
        }
    ]);
})();
