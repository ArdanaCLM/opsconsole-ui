// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(){
    'use strict';
    angular.module('operations-ui').directive("dualgraphSmall", [
        '$translate',
        'styleutils',
        function($translate, styleutils) {
            return {
                restrict: "E",

                scope: {
                    data : '=',
                    ctitle : '='
                },

                templateUrl: 'components/dualgraphSmall.html',

                bindToController: true,
                controllerAs : 'ctrl',
                controller : function() {
                },

                link : function(scope, el, attr) {
                    var canvas = $(el).find( 'canvas.bar' );
                    var ctx = canvas[0].getContext("2d");

                    // helper objects to assist link function processing of canvas elements
                    // we need these and the link functionality since canvas elements cannot be templatized
                    var bar = {
                        ctx: {},
                        val : { max : 0, v1 : 0, v2 : 0, v3 : 0 },
                        dim : { x1 : 0, x2 : 0, x3 : 0,
                                h : 29,
                                w1 : 0, w2 : 0, w3 : 0,
                                y1 : 0, y2 : 30, y3 : 60,
                                c1 : '#000000', c2 : '#000000', c3 : '#000000'
                        },

                        getMax : function(v1, v2, v3) {
                            if( v1 > v2 && v1 > v3 ) {
                                return v1;
                            }

                            else if( v2 > v1 && v2 > v3) {
                                return v2;
                            }

                            else
                                return v3;
                        },

                        drawBar : function(x,y,w,h,color) {
                            var _ = bar;

                            _.ctx.fillStyle = color;
                            _.ctx.fillRect(x,y,w,h);
                        },

                        drawVal : function(val,x,y,color) {
                            var _ = bar;

                            _.ctx.font = "18px Metric";
                            _.ctx.fillStyle = color;
                            _.ctx.textAlign = "center";
                            _.ctx.fillText( val, x, y );
                        },

                        redraw : function() {
                            var _ = bar;

                            //clear draw area
                            _.ctx.clearRect(0, 0, 1000, 1000);
                            _.ctx.scale(1,1);

                            _.drawBar( _.dim.x1, _.dim.y1, _.dim.w1, _.dim.h, _.dim.c1 );
                            _.drawBar( _.dim.x2, _.dim.y2, _.dim.w2, _.dim.h, _.dim.c2 );
                            _.drawBar( _.dim.x3, _.dim.y3, _.dim.w3, _.dim.h, _.dim.c3 );

                            if( _.val.v1 / _.val.max > 0.2 )
                                _.drawVal( _.val.v1, 20,  _.dim.y1 + 21, '#fff' );
                            else
                                _.drawVal( _.val.v1,  _.dim.w1 + 20,  _.dim.y1 + 21, '#333' );

                            if( _.val.v2 / _.val.max > 0.2 )
                                _.drawVal( _.val.v2, 20,  _.dim.y2 + 21, '#fff' );
                            else
                                _.drawVal( _.val.v2,  _.dim.w2 + 20,  _.dim.y2 + 21, '#333' );

                            if( _.val.v3 / _.val.max > 0.2 )
                                _.drawVal( _.val.v3, 20,  _.dim.y3 + 21, '#fff' );
                            else
                                _.drawVal( _.val.v3,  _.dim.w3 + 20,  _.dim.y3 + 21, '#333' );
                        },

                        init : function(ctx, val1, val2, val3, col1, col2, col3) {
                            var _ = bar;

                            _.ctx = ctx;
                            _.val.v1 = val1 || 0;
                            _.val.v2 = val2 || 0;
                            _.val.v3 = val3 || 0;

                            _.val.max  = _.getMax(val1, val2, val3);

                            _.dim.w1 = val1 / _.val.max * 215;
                            _.dim.w2 = val2 / _.val.max * 215;
                            _.dim.w3 = val3 / _.val.max * 215;

                            _.dim.c1 = col1;
                            _.dim.c2 = col2;
                            _.dim.c3 = col3;
                        }
                    };

                    scope.$watch('ctrl.data', function() {

                        var colors = styleutils.alarmStateGraphColors();

                        var top = {
                            val1 : 0,
                            val2 : 0,
                            val3 : 0,
                            val4 : 0,
                            sum  : 0
                        };

                        var btm = {
                            val1 : 0,
                            val2 : 0,
                            val3 : 0,
                            sum  : 0
                        };

                        scope.ctrl.data.forEach(function(datum) {
                            switch(datum.ui_status) {
                                case 'OK' :
                                    top.val1 += 1;
                                    break;

                                case 'WARN' :
                                    top.val2 += 1;
                                    break;

                                case 'ERROR' :
                                    top.val3 += 1;
                                    break;
                                case 'UNKNOWN' :
                                    top.val4 += 1;
                                    break;
                                default:
                                    top.val4 += 1;
                            }
                            top.sum += 1;

                            switch(datum.condition) {
                                case 'OPEN' :
                                    btm.val1 += 1;
                                    break;

                                case 'ACKNOWLEDGED' :
                                    btm.val2 += 1;
                                    break;

                                case 'RESOLVED' :
                                    btm.val3 += 1;
                                    break;
                                default:
                                    btm.val3 += 1;
                            }
                        });

                        scope.ctrl.data.sumData = [
                            top.val1,
                            top.val2,
                            top.val3,
                            top.val4,
                            btm.val1,
                            btm.val2,
                            btm.val3
                        ];

                        scope.ctrl.data.colors = colors;

                        //calculate thresholds based on ratio of max to indv data points.  if below threshold, we will need to display data differently
                        //scope.ctrl.data.set2[0].threshold = true;

                        //redraw bar
                        bar.init( ctx, btm.val1, btm.val2, btm.val3, colors[4], colors[5], colors[6] );
                        bar.redraw();
                    }, true);
                }
            };
        }
    ]);
})();
