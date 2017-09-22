/*
    Slideover can be applied to any other component to acheive a slideover effect on user click, with certain requirements in mind.

    REQUIREMENTS:
    Component will need to have in its template a '.content' wrapper that encloses all of its content.

    CSS for '.active' needs to be defined along with a @keyframes directive, this describes the animation effect to use

    The component will be gicen an inline style of 'overflow: hidden', 'position: relative' to allow content to appear and reappear

    This component will probably interfere with any component effect that relies on user click interactions, so use on mostly static presentational components
*/

(function(){
    'use strict';
    angular.module('operations-ui').directive("slideover", [
        '$translate',
        'styleutils',
        function($translate, styleutils) {
            return {
                restrict: "A",

                require: 'metriccard',

                link : function(scope, el, attr, ctrl) {
                    var $content, $msg, iconTemplate;

                    $(el).css({'position':'relative', 'overflow':'hidden', 'cursor':'pointer'});
                    $(el).append('<div class="slideoverMsg"><h6>' +
                                ctrl.ctitleback +
                                '</h6><p>' +
                                ctrl.slideover +
                                '</p></div>'
                    );

                    $content = $(el).find('.content');
                    $msg = $(el).find('.slideoverMsg');
                    iconTemplate = '<div class="slideoverIcon">' + '?' + '</div>';

                    $content.append(iconTemplate).addClass('active');
                    $msg.append(iconTemplate);

                    $(el).click(function(){
                        $msg.addClass('animatable').toggleClass('active');
                        $content.addClass('animatable').toggleClass('active');
                    });
                },
            };
        }
    ]);
})();
