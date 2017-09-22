// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(){
    'use strict';
    angular.module('operations-ui').directive("dualgraph", [
        '$translate',
        'styleutils',
        function($translate, styleutils) {
            return {
                restrict: "E",

                scope: {
                    data : '=',
                    ctitle : '='
                },

                templateUrl: 'components/dualgraph.html',

                bindToController: true,
                controllerAs : 'ctrl',
                controller : function() {
                },

                link : function(scope, el, attr) {
                    var canvasTop = $(el).find( 'canvas.donut' );
                    var canvasBtm = $(el).find( 'canvas.bar' );
                    var ctxTop = canvasTop[0].getContext("2d");
                    var ctxBtm = canvasBtm[0].getContext("2d");

                    // helper objects to assist link function processing of canvas elements
                    // we need these and the link functionality since canvas elements cannot be templatized
                    var donut = {
                        ctx : {},
                        dims : { x: 90, y: 90, r:80 },
                        offSet : 1.5 * Math.PI,
                        angNext : 1.5 * Math.PI,
                        maxVal : 0,
                        drawArc : function(val, color) {
                            var _ = donut;
                            var newArc = {
                                sAng : _.angNext,
                                eAng : _.angNext +  val / _.maxVal * (2 * Math.PI)
                            };
                            _.angNext = newArc.eAng;
                            _.ctx.beginPath();
                            _.ctx.arc( _.dims.x, _.dims.y, _.dims.r, newArc.sAng, newArc.eAng );
                            _.ctx.lineWidth = 17;
                            _.ctx.strokeStyle = color;
                            _.ctx.stroke();
                        },

                        init : function(ctx, max, x, y, r) {
                            var _ = donut;
                            _.angNext = _.offSet;
                            _.ctx = ctx;
                            _.maxVal = max || 0;
                            _.dims.x = x || 90;
                            _.dims.y = y || 90;
                            _.dims.r = r || 80;

                            //clear draw area
                            _.ctx.clearRect(0, 0, 1000, 1000);
                        }
                    };

                    var bar = {
                        ctx: {},
                        val : { max : 0, v1 : 0, v2 : 0, v3 : 0 },
                        dim : { x1 : 0, x2 : 90, x3 : 180,
                                w : 70,
                                h1 : 0, h2 : 0, h3 : 0,
                                y1 : 130, y2 : 130, y3 : 130,
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

                        drawVal : function(val,x,y) {
                            var _ = bar;

                            _.ctx.font = "18px Metric";
                            _.ctx.fillStyle = '#333';
                            _.ctx.textAlign = "center";
                            _.ctx.fillText( val, x, y );
                        },

                        redraw : function() {
                            var _ = bar;
                            var cOffset = _.dim.w * 0.5;

                            //clear draw area
                            _.ctx.clearRect(0, 0, 1000, 1000);

                            _.drawBar( _.dim.x1, _.dim.y1, _.dim.w, _.dim.h1, _.dim.c1 );
                            _.drawBar( _.dim.x2, _.dim.y2, _.dim.w, _.dim.h2, _.dim.c2 );
                            _.drawBar( _.dim.x3, _.dim.y3, _.dim.w, _.dim.h3, _.dim.c3 );

                            _.drawVal( _.val.v1, cOffset + 0 * 90, _.dim.y1 - 15 );
                            _.drawVal( _.val.v2, cOffset + 1 * 90, _.dim.y2 - 15 );
                            _.drawVal( _.val.v3, cOffset + 2 * 90, _.dim.y3 - 15 );
                        },

                        init : function(ctx, val1, val2, val3, col1, col2, col3) {
                            var _ = bar;

                            _.ctx = ctx;
                            _.val.v1 = val1 || 0;
                            _.val.v2 = val2 || 0;
                            _.val.v3 = val3 || 0;

                            _.val.max  = _.getMax(val1, val2, val3);

                            _.dim.h1 = val1 / _.val.max * 90;
                            _.dim.h2 = val2 / _.val.max * 90;
                            _.dim.h3 = val3 / _.val.max * 90;

                            _.dim.y1 = 130 - _.dim.h1;
                            _.dim.y2 = 130 - _.dim.h2;
                            _.dim.y3 = 130 - _.dim.h3;

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


                        //redraw donut
                        donut.init(ctxTop, top.sum);

                        donut.drawArc(top.val1, colors[0]);
                        donut.drawArc(top.val2, colors[1]);
                        donut.drawArc(top.val3, colors[2]);
                        donut.drawArc(top.val4, colors[3]);

                        //redraw bar
                        bar.init( ctxBtm, btm.val1, btm.val2, btm.val3, colors[4], colors[5], colors[6] );
                        bar.redraw();
                    }, true);
                }
            };
        }
    ]);
})();
