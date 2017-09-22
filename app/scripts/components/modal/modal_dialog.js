// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
    'use strict';

    angular.module('operations-ui').directive("opsmodal", [ '$window', '$q', '$timeout', 'stackModalVis',
        function ($window, $q, $timeout, stackModalVis) {
            return {
                restrict: "E",
                transclude: true,
                scope: {
                    commitAction: "=",
                    closeAction: "=",
                    showattribute: "=",
                    nodrawerheader: "=",
                    nomodalfooter: "=",
                    isClosable: "=",
                    type: "@",
                    subtype: "@",
                    headertemplateurl: '@',
                    footertemplateurl: '@',
                    headerTitle: '@'
                },
                templateUrl: 'components/modal/modal_dialog.html',
                link: function(scope, element, attributes) {
                    scope.showFtiHelp = attributes.showFtiHelp;
                    element.css({
                        position: 'absolute',
                        left: '0px',
                        top: '10px',
                        width: '100%',
                        height: '100%',
                        display: 'none'
                    });
                    if(scope.type === 'confirm' || scope.type ==='error' || scope.type === 'warning') {
                        var resize = function() {
                            if(scope.showattribute) {
                                var modalHeight = element.find('.oc-modal').outerHeight(),
                                    windowHeight = element.find('.modal-content-backdrop').outerHeight(),
                                    offset = ((window.outerHeight - modalHeight)/2) - (modalHeight/2);
                                element.find('.oc-modal-wrapper').css('margin-top', offset > 10 ? offset : 10 + 'px');
                            }
                        };
                        $timeout(resize, 10);
                        $(window).on('resize', resize);
                        scope.$watch('showattribute', resize);
                    }
                },
                controller: ['$scope', '$element', 'ocValidators', function ($scope, $element, ocValidators) {
                    var footerTemplateUrl = $element.attr('footerTemplateUrl') || '';
                    $scope.ocValidators = ocValidators;

                    $scope.commit = function () {
                        if(typeof $scope.commitAction === 'function') {
                            var params = Array.prototype.concat.apply([$scope.modalForm], arguments);
                            $scope.commitAction.apply(null, params);
                        }
                    };

                    $scope.getFooterTemplateUrl = function(){
                        return footerTemplateUrl;
                    };

                    $scope.closable = function(){
                        return !angular.isUndefined($element.attr('closable'));
                    };

                    $scope.closeModal = function(){
                        if(angular.isUndefined($scope.closeAction) || $scope.closeAction($scope.modalForm)) {
                            $scope.showattribute = false;
                            $scope.$broadcast("modalIsClosing");
                        }
                    };

                    $scope.$watch('showattribute', function(){
                        var opsConsoleBody = $('body#ops_console_body');

                        if($scope.showattribute){
                            $element.css({
                                display: 'block'
                            });

                            opsConsoleBody.css({
                               overflow: 'hidden'
                            });
                        } else {
                            $element.css({
                                display: 'none'
                            });

                            if(!stackModalVis()) {
                                opsConsoleBody.css({
                                    overflow: ''
                                });
                            }
                        }
                    }, true);
                }]
            };
        }
    ]);
})();
