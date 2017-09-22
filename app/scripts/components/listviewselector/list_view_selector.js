// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
    'use strict';

    angular.module('operations-ui').directive("listviewselector", ['$translate',
        function ($translate) {
            return {
                restrict: "E",
                templateUrl: 'components/listviewselector/list_view_selector.html',
                scope: {
                    viewlist: '=',
                    validflag: '='
                },
                link: function(scope, element, attributes) {
                    scope.labelattr = 'label';
                    if(angular.isDefined(attributes.labelkey)){
                        scope.labelattr = attributes.labelkey;
                    }
                },
                controller: ['$scope', '$element', function ($scope, $element) {
                    $scope.clearSelection = function(){
                        $scope.viewlist.forEach(function(element, index, arr){
                            element.$viewlistRowSelected = false;
                        });
                    };

                    $scope.selectRow = function(item){
                        if(item.disabled){
                            return;
                        }

                        $scope.clearSelection();

                        item.$viewlistRowSelected = true;
                        $scope.currentSelection = item;
                    };

                    $scope.prevItem = function(){
                        if(angular.isDefined($scope.viewlist) && $scope.viewlist.length > 0) {
                            var i = $scope.viewlist.length - 1;
                            while($scope.viewlist[i].disabled && i >= 0){
                                i--;
                                if(i === 0){
                                    return;//cannot select an item, all are disabled
                                }
                            }
                            var prevItem = $scope.viewlist[i];

                            i = 0;
                            for(i = 0; i < $scope.viewlist.length; i++){
                                if($scope.viewlist[i].$viewlistRowSelected){
                                    break;
                                }
                                if(!$scope.viewlist[i].disabled) {
                                    prevItem = $scope.viewlist[i];
                                }
                            }

                            $scope.selectRow(prevItem);
                        }
                    };

                    $scope.nextItem = function(){
                        if(angular.isDefined($scope.viewlist) && $scope.viewlist.length > 0) {
                            var i = 0;
                            while($scope.viewlist[i].disabled && i < $scope.viewlist.length){
                                i++;
                                if(i === $scope.viewlist.length){
                                    return;//cannot select an item, all are disabled
                                }
                            }
                            var nextItem = $scope.viewlist[i];

                            i = 0;
                            for(i = $scope.viewlist.length - 1; i >= 0; i--){
                                if($scope.viewlist[i].$viewlistRowSelected){
                                    break;
                                }
                                if(!$scope.viewlist[i].disabled) {
                                    nextItem = $scope.viewlist[i];
                                }
                            }
                            $scope.selectRow(nextItem);
                        }
                    };

                    $scope.getItemTemplate= function(item){
                        return item.templateurl;
                    };

                    $scope.selectFirstRow = function(){
                        $scope.clearSelection();
                        if(angular.isDefined($scope.viewlist) && $scope.viewlist.length > 0){
                            $scope.selectRow($scope.viewlist[0]);
                        }
                    };

                    $scope.getStatusClass = function(item){
                        return item.statusClass;
                    };

                    $scope.checkDisabledEntries = function(){
                        $scope.viewlist.forEach(function(element, index, arr){
                            if(element.disabled){
                                element.statusClass = 'listViewStatusDisabled';
                            }
                        });
                    };

                    $scope.checkDisabledEntries();

                    $scope.updateTableTitle = function(){
                        $scope.listTableTitle = '';
                        if(angular.isDefined($element.attr('titlekey'))){
                            $scope.listTableTitle = $element.attr('titlekey');
                            $scope.tableTitleTranslateData = { 'num' : $scope.viewlist.length };
                        }
                    };

                    $scope.updateTableTitle();

                    $scope.$watch('viewlist', function(){
                        $scope.updateTableTitle();

                        //TODO - double check this isn't called when RHS form elements are updated
                        // if so might have to try another approach
                        //select the first row by default
                        $scope.selectFirstRow();
                    }, true);

                }]
            };
        }
    ]);
})();