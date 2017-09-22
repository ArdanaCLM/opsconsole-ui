// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(){
    'use strict';
    angular.module('operations-ui').directive("dualgraphWide", [
        '$translate',
        'styleutils',
        function($translate, styleutils) {
            return {
                restrict: "E",

                scope: {
                    data : '=',
                    ctitle : '='
                },

                templateUrl: 'components/dualgraphWide.html',

                bindToController: true,
                controllerAs : 'ctrl',
                controller : function() {
                },

                link : function(scope, el, attr) {
                    var canvasLft = $(el).find( 'canvas.stack' );
                    var canvasRgt = $(el).find( 'canvas.bar' );
                    var ctxLft = canvasLft[0].getContext("2d");
                    var ctxRgt = canvasRgt[0].getContext("2d");

                    // helper objects to assist link function processing of canvas elements
                    // we need these and the link functionality since canvas elements cannot be templatized
                    var stack = {
                        ctx : {},
                        dim : { maxX : 150, maxY : 60 },
                        pxDelta : 0, 
                        xPosNext : 0,
                        maxVal : 0,
                        drawItvl : function(val, color) {
                            var _ = stack;
                            var x = _.xPosNext,
                                y = 0,
                                w = _.pxDelta * val,
                                h = _.dim.maxY;

                            _.xPosNext += w;
                            _.ctx.fillStyle = color;
                            _.ctx.fillRect(x,y,w,h);
                        },

                        init : function(ctx, max) {
                            var _ = stack;
                            _.ctx = ctx;
                            _.pxDelta = _.dim.maxX / max;
                        }
                    };

                    var bar = {
                        ctx: {},
                        val : { max : 0, v1 : 0, v2 : 0, v3 : 0 },
                        dim : { x1 : 0, x2 : 0, x3 : 0, 
                                h : 19, 
                                w1 : 0, w2 : 0, w3 : 0, 
                                y1 : 0, y2 : 20, y3 : 40,
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

                        redraw : function() {
                            var _ = bar;

                            //clear draw area
                            _.ctx.clearRect(0, 0, 1000, 1000);

                            _.drawBar( _.dim.x1, _.dim.y1, _.dim.w1, _.dim.h, _.dim.c1 );
                            _.drawBar( _.dim.x2, _.dim.y2, _.dim.w2, _.dim.h, _.dim.c2 );
                            _.drawBar( _.dim.x3, _.dim.y3, _.dim.w3, _.dim.h, _.dim.c3 );
                        },

                        init : function(ctx, val1, val2, val3, col1, col2, col3) {
                            var _ = bar;

                            _.ctx = ctx;
                            _.val.v1 = val1 || 0;
                            _.val.v2 = val2 || 0;
                            _.val.v3 = val3 || 0;

                            _.val.max  = _.getMax(val1, val2, val3);

                            _.dim.w1 = val1 / _.val.max * 130;
                            _.dim.w2 = val2 / _.val.max * 130;
                            _.dim.w3 = val3 / _.val.max * 130;

                            _.dim.c1 = col1;
                            _.dim.c2 = col2;
                            _.dim.c3 = col3;
                        }
                    };

                    scope.$watch('ctrl.data', function() {

                        var colors = styleutils.alarmStateGraphColors();

                        var lft = {
                            val1 : 0,
                            val2 : 0,
                            val3 : 0,
                            val4 : 0,
                            sum  : 0
                        };

                        var rgt = {
                            val1 : 0,
                            val2 : 0,
                            val3 : 0,
                            sum  : 0
                        };

                        scope.ctrl.data.forEach(function(datum) {
                            switch(datum.ui_status) {
                                case 'OK' :
                                    lft.val1 += 1;
                                    break;

                                case 'WARN' :
                                    lft.val2 += 1;
                                    break;

                                case 'ERROR' :
                                    lft.val3 += 1;
                                    break;
                                case 'UNKNOWN' :
                                    lft.val4 += 1;
                                    break;
                                default: 
                                    lft.val4 += 1;
                            }
                            lft.sum += 1;

                            switch(datum.condition) {
                                case 'OPEN' :
                                    rgt.val1 += 1;
                                    break;

                                case 'ACKNOWLEDGED' :
                                    rgt.val2 += 1;
                                    break;

                                case 'RESOLVED' :
                                    rgt.val3 += 1;
                                    break;
                                default: 
                                    rgt.val3 += 1;
                            }
                        });

                        scope.ctrl.data.sumData = [
                            lft.val1,
                            lft.val2,
                            lft.val3,
                            lft.val4,
                            rgt.val1,
                            rgt.val2,
                            rgt.val3
                        ];

                        scope.ctrl.data.colors = colors;
                        
                        
                        //redraw stack
                        stack.init( ctxLft, lft.sum);
                        stack.drawItvl( lft.val1, colors[0] );
                        stack.drawItvl( lft.val2, colors[1] );
                        stack.drawItvl( lft.val3, colors[2] );
                        stack.drawItvl( lft.val4, colors[3] );

                        //redraw bar
                        bar.init( ctxRgt, rgt.val1, rgt.val2, rgt.val3, colors[4], colors[5], colors[6] );
                        bar.redraw();
                    }, true);
                }
            };
        }
    ]);
})();