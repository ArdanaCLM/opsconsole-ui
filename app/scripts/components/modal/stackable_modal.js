// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
    'use strict';

    angular.module('operations-ui').directive('stackablemodal', ['$timeout','stackModalVis',
        function($timeout, stackModalVis) {
            return {
                restrict: 'E',
                transclude: true,
                scope: {
                    showattribute: '=',
                    modaltemplateurl: '=',
                    closeaction: '='
                },
                templateUrl: 'components/modal/stackable_modal.html',

                controller: ['$scope', '$element', '$rootScope', function($scope, $element, $rootScope) {
                    var shortWait = 10;  // in milliseconds
                    var longWait = 1005; // in milliseconds
                    var modal_name = $element[0].getAttribute('name');
                    if (modal_name === null) {
                        console.log('Error creating stackablemodal - missing "name" value.');
                        return;
                    }
                    $scope.$parent[modal_name] = $scope;

                    if ($element[0].getAttribute('showAttribute') === null) {
                        console.log('Error creating stackablemodal - missing "showAttribute" value');
                        return;
                    }

                    if ($element[0].getAttribute('modalTemplateUrl') === null) {
                        console.log('Error creating stackablemodal - missing "modalTemplateUrl" value');
                        return;
                    }
                    $scope.modalList = [{ template: $scope.modaltemplateurl,
                                          closeaction: $scope.closeaction}];


                    $scope.addStack = function(path, closeaction) {
                        // prevent any creations until animation finishes
                        // this prevents duplicte modal creation
                        if($scope.expandingModal) {
                            return;
                        }

                        $scope.expandingModal = $rootScope.appConfig.protractor_testing ? false : true;

                        $scope.modalList.push({template: path, closeaction: closeaction});

                        // wait for the dom element to get created after push, then do the slide
                        $timeout(function() {
                            //bind callback on animation end of new modal to stop the automatic exiting of this function
                            $element.find('.stackable-modal-content:last-child').bind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd',
                            function() {
                                $scope.expandingModal = false;
                            });
                            $element.find('.stackable-modal-content:last-child').addClass('tab-slide');
                            $element.find('.stackable-modal-content:not(:last-child)').addClass('tab-second');
                            if($scope.modalList.length > 2) {
                              $element.find('.stackable-modal-content:lt(-2)').addClass('tab-deep');
                            }
                        }, shortWait);
                    };

                    $scope.closeModal = function(){
                        if ($scope.modalList.length === 1) {
                            $scope.showattribute = false;
                            if(angular.isDefined($scope.closeaction)){
                                $scope.closeaction();
                            }
                            //tell all selects to close
                            $scope.$broadcast("ocInputSelectClose");
                        } else {
                            // wait for the slide to finish before popping
                            $timeout(function() {
                               var poppedPage = $scope.modalList.pop();
                               if(angular.isDefined(poppedPage.closeaction)){
                                   poppedPage.closeaction();
                               }
                            }, longWait);
                            //tell last select to close
                            $element.find('.stackable-modal-content:last-child').scope().$broadcast("ocInputSelectClose");
                            $element.find('.stackable-modal-content:last-child').removeClass('tab-slide');
                            $element.find('.stackable-modal-content.tab-second').removeClass('tab-second');
                            if($scope.modalList.length > 2) {
                              $element.find('.stackable-modal-content:lt(-2)').addClass('tab-second');
                              $element.find('.stackable-modal-content').removeClass('tab-deep');
                            }
                        }
                    };

                    $scope.$watch('showattribute', function(newvalue, oldvalue){
                        var opsConsoleBody = $('body#ops_console_body');

                        if ($scope.showattribute){
                            $element.css({
                                display: 'block'
                            });
                            opsConsoleBody.css({
                                overflow: 'hidden'
                            });
                            $timeout(function() {
                                $element.find('.stackable-modal-content').addClass('tab-slide');
                            }, shortWait);
                        } else {
                            // if showattribute changes from true to false, which happens when user
                            // closes the last modal, then wait for the slide to finish
                            if (oldvalue) {
                                $timeout(function() {
                                    $element.css({
                                        display: 'none'
                                    });
                                    if(!stackModalVis()) {
                                        opsConsoleBody.css({
                                            overflow: ''
                                        });
                                    }
                                }, longWait);
                                $element.find('.stackable-modal-content').removeClass('tab-slide');
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
                        }
                    }, true);
                }]
            };
        }
    ]);
})();
