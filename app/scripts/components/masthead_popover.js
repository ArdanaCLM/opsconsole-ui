// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';
    ng.module('operations-ui').directive(
        'mastheadPopover',
        ['$compile', '$templateCache', '$rootScope', '$timeout',
        function($compile, $templateCache, $rootScope, $timeout) {
        return {
            restrict: "A",
            link: function(scope, element, attributes) {

                var isInternetExplorer = function() {
                    var ua = window.navigator.userAgent;
                    var isMsIE = ua.indexOf("MSIE") > 0;
                    // if it is not ie9 or ie10, check again
                    if (isMsIE !== true) {
                        isMsIE = !!navigator.userAgent.match(/Trident\/7\./);
                    }

                    return isMsIE;
                };

                if (angular.isDefined(attributes.popoverContentName)) {
                    //get the pulldown contents help, drilldown, notification or settings
                    var contentName =
                        attributes.popoverContentName !== undefined ? attributes.popoverContentName : 'help';
                    var html =
                        $templateCache.get("components/masthead_items/" + contentName + ".html");
                    var htmlContents = $compile(html)(scope);
                    var popoverClass = 'masthead-popover'; //custom class for popover
                    var options = {

                        content: htmlContents,
                        placement: "auto", //let browser decide the position
                        html: true,
                        //to customize css of bootstrap popover
                        template: "<div class=\"popover " + popoverClass +
                        "\"><div class=\"arrow\"></div><h3 class=\"popover-title\">" +
                        "</h3><div class=\"popover-content\"></div></div>"
                    };

                    //use own click function to trigger so we can do singleton
                    //popover
                    if(isInternetExplorer()) {
                        options.trigger = 'manual';
                    }
                    else {
                        options.trigger = "focus";
                    }

                    $(element).popover(options);
                }

                //since the popover overwrites the click of ng-click, have to
                //do this to deal with the color change on the  popover item
                //and also make only one popover shows
                $(element).click(function(event) {
                    if (!element.hasClass('selected')) {
                        //hide other popovers
                        var other_items =
                            element.parents('.popover-items').find('.popover-item').not(this);
                        other_items.removeClass('selected');
                        $(other_items).popover('hide');

                        //show this popover
                        element.addClass('selected');
                        $(element).popover('show');
                        //add the active popover
                        $rootScope.activeMastheadPopover = element;

                        if (contentName === "account") {
                            scope.$broadcast("accountPopOpen");
                        }
                    }
                    else {
                        //hide this popover
                        element.removeClass('selected');
                        $(element).popover('hide');
                        //remove the active popover
                        $rootScope.activeMastheadPopover = undefined;
                    }

                    event.preventDefault();
                });

                var hidePop, showPop;
                //deal with reposition of the popover when resize window
                $(window).on('resize', function(event) {
                    //cancel it to reduce flashing
                    if(hidePop !== undefined) {
                        $timeout.cancel(hidePop);
                    }
                    if(showPop !== undefined) {
                        $timeout.cancel(showPop);
                    }
                    var activePop = $rootScope.activeMastheadPopover;
                    if(activePop !== undefined) {
                        hidePop = $timeout(function () {
                            $(activePop).popover('hide');
                            showPop = $timeout(function () {
                                $(activePop).popover('show');
                            }, 250);
                        }, 250);
                    }
                });
            }//end link
        };
      }]);
})(angular);