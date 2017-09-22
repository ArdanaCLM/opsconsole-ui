// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(){
    'use strict';

    angular.module('operations-ui').directive("octable",[
        'isUndefined', '$templateCache', '$compile', 'sortUtils', 'getKeyFromScope',
         '$filter', '$translate', '$routeParams', '$timeout', 'log',
        function(isUndefined, $templateCache, $compile, sortUtils, getKeyFromScope,
                 $filter, $translate, $routeParams, $timeout, log) {
            return {
                restrict: "E",
                transclude: true,
                scope: {
                    "configname": "=",
                    "modelname": "=",
                    "customEnumFilter": "=",
                    "expandTemplateUrl" : "@",
                    "tileTemplateUrl" : "@",
                    "queryParams": "="
                },
                templateUrl: 'components/octable.html',
                link: function ($scope, $element, attrs, ctrl, transclude) {
                    transclude($scope, function (content) {
                        $element.prepend(content);
                    });

                    $scope.tableConfig = $scope.configname || getKeyFromScope('tableConfig', $scope.$parent);
                    $scope.selectionCountLabel = $scope.tableConfig.selectionLabel || "common.selectioncount.selected.generic";
                    $scope.selectionTotalLabel = $scope.tableConfig.selectionTotalLabel || "common.selectioncount.total.generic";

                    //grab the name of the external data model
                    var modelname = $element.attr('modelname');
                    var loadflag = $element.attr('loadflag');

                    $scope.border = !angular.isUndefined($element.attr('border'));
                    $scope.displayStandardTable = true;
                    $scope.displayTiles = false;
                    $scope.suppresscolon = !angular.isUndefined($element.attr('suppresscolon'));
                    $scope.overflowCutoff = -1;
                    $scope.rowSelectionAttr = $element.attr('rowSelectionAttr') || '$rowSelected';
                    $scope.tableid = $element.attr('tableid');
                    $scope.expandOnLoad = false;

                    if(!isUndefined($scope.tableConfig.methods) && $scope.tableConfig.methods.length > 0){
                        var i = 0, methodName;
                        for (i = 0; i < $scope.tableConfig.methods.length; i++){
                            methodName = $scope.tableConfig.methods[i];
                            $scope[methodName] = getKeyFromScope(methodName, $scope.$parent);
                        }
                    }

                    //deal with server paging
                    $scope.isServerPaging = false;
                    $scope.isIdFilterOn = false;//force singleton of id filter

                    //prepare for the tableHeaderFilter so we can decide which filter
                    //to show or not show
                    if(!isUndefined($scope.tableConfig.pageConfig) &&
                       !isUndefined($scope.tableConfig.pageConfig.isServerPaging) &&
                       $scope.tableConfig.pageConfig.isServerPaging === true ) {
                        $scope.isServerPaging = true;
                        //object to hold sort, paging and filtering for server paging
                        if(!isUndefined($scope.queryParams)) {
                            $scope.serverQueryParams = $scope.queryParams;
                        }
                        //show filter options
                        $scope.$watch('tableConfig.headers', function() {
                          $scope.tableHeaderFilter = [];
                            $scope.tableConfig.headers.forEach(function(header) {
                                if(!isUndefined(header.filterOptions) &&
                                    header.filterOptions.length > 0) {
                                    $scope.tableHeaderFilter.push(header);
                                }
                            });
                        }, true);
                    }

                    //default sort dir
                    $scope.sortDir = 'desc';

                    //when user clicks sort icon on the table header
                    $scope.colSortClick = function($event, header){
                        //don't do anything if the column is nosort
                        if (!isUndefined(header) && header.nosort) {
                            return;
                        }

                        var sortDir = "asc";
                        if(isUndefined($event.target.getAttribute('column-sort-dir')) ||
                            $event.target.getAttribute('column-sort-dir') === 'asc'){
                            sortDir = "desc";
                        }

                        $scope.colSort(
                            $event.target.getAttribute('column-sort'),
                            sortDir,
                            $event.target.getAttribute('column-sort-type'),
                            true //reload table for server paging
                        );
                    };

                    $scope.doSort = function(){
                        //if we don't have any sort column specified and
                        //we have some data, find the name column or first non
                        //hidden column to sort on
                        if (angular.isUndefined($scope.tableSortHeader) &&
                            angular.isDefined($scope.modelname) &&
                            $scope.modelname.length > 0) {
                            if(angular.isDefined($scope.tableConfig.headers) &&
                                $scope.tableConfig.headers.length > 0){
                                //there are table headers
                                var firstNonHiddenHeaderOrNameHeader, tempHeader;
                                //
                                for(var i = 0; i < $scope.tableConfig.headers.length; i++){
                                    if(angular.isUndefined($scope.tableConfig.headers[i].hidden) ||
                                        $scope.tableConfig.headers[i].hidden === false) {
                                        //remember my first non hidden header
                                        if (angular.isUndefined(firstNonHiddenHeaderOrNameHeader)) {
                                            firstNonHiddenHeaderOrNameHeader = $scope.tableConfig.headers[i];
                                        }
                                        tempHeader = $scope.tableConfig.headers[i];

                                        //once we find name column, will use that name column
                                        if(tempHeader.sortfield === 'name') {
                                            firstNonHiddenHeaderOrNameHeader = tempHeader;
                                            break;
                                        }
                                    }
                                } //end for
                                $scope.tableSortHeader = firstNonHiddenHeaderOrNameHeader;
                            } //end if have header
                        }

                        if(!angular.isUndefined($scope.tableSortHeader)) {
                            $scope.colSort($scope.tableSortHeader.sortfield, $scope.sortDir, $scope.tableSortHeader.type);
                        }
                    };

                    $scope.colSort = function(colName, direction, sortType, doTableReload){

                        //if direction is undefined, set it, defaulting to desc
                        if(isUndefined(direction)){
                            if($scope.sortDir === 'desc'){
                                $scope.sortDir = 'asc';
                            } else {
                                $scope.sortDir = 'desc';
                            }
                            direction = $scope.sortDir;
                        }
                        else {
                            $scope.sortDir = direction;
                        }

                        //remove all sort css classes from elements
                        //these are the html elements, not the config object
                        var headers = $element.find('th').toArray();
                        headers.forEach(function(header, index, array){
                            if(header.getAttribute('column-sort') === colName){
                                //found a matching header
                                if(direction === 'asc'){
                                    header.setAttribute('column-sort-dir', 'asc');
                                    angular.element(header).removeClass('sortdesc');
                                    angular.element(header).addClass('sortasc');
                                } else {
                                    header.setAttribute('column-sort-dir', 'desc');
                                    angular.element(header).removeClass('sortasc');
                                    angular.element(header).addClass('sortdesc');
                                }
                            } else {
                                angular.element(header).removeClass('sortasc');
                                angular.element(header).removeClass('sortdesc');
                                header.removeAttribute('column-sort-dir');
                            }
                        });

                        //these are the header config object, not the html element
                        $scope.tableConfig.headers.forEach(function(header, index, array){
                            if(header.sortfield === colName){
                                $scope.tableSortHeader = header;
                                $scope.currentSortHeader = $scope.tableSortHeader;
                            }
                        });

                        //do the server sorting
                        if($scope.isServerPaging && doTableReload) {
                            if(isUndefined($scope.serverQueryParams.sorting)) {
                                $scope.serverQueryParams.sorting = {};
                            }
                            $scope.serverQueryParams.sorting.name = colName;
                            $scope.serverQueryParams.sorting.direction = direction;

                            //broadcast to parent so it can do server query
                            log('debug', 'doServerSort = ' + JSON.stringify($scope.serverQueryParams));
                            $scope.$emit('doTableDataReload');

                        }
                        else { //do non server sorting
                            sortUtils.doSort($scope.modelname, colName, direction, sortType, true);
                        }
                    };

                    //deal with apply sort icon when switch view and load view
                    $scope.applySortIconClass = function(header) {
                        //if not sortable then don't do anything
                        if(!isUndefined(header)) {
                            if (header.nosort) {
                                return;
                            }
                        }

                        if (angular.isDefined($scope.currentSortHeader)) {
                            if (header.sortfield === $scope.currentSortHeader.sortfield) {
                                var headers = $element.find('th').toArray();
                                headers.forEach(function(th, index, array){
                                    if(th.getAttribute('column-sort') === header.sortfield) {
                                        th.setAttribute('column-sort-dir', $scope.sortDir);
                                    }
                                });
                                return 'sort' + $scope.sortDir;
                            }
                        }
                    };

                    //listen for changes on the sort model that occur outside of the table itself
                    $scope.sortValueChanged = function(newSortValueHeader){
                        $scope.currentSortHeader = newSortValueHeader;
                        //last value true is only for server paging if it is there
                        $scope.colSort(newSortValueHeader.sortfield,
                                       $scope.sortDir,
                                       newSortValueHeader.type,
                                       true);
                    };

                    //if there is only 1 value in the sort list, sort on it when clicked
                    $scope.sortValueClicked = function(sortValueHeader){
                        $scope.currentSortHeader = sortValueHeader;
                        if(angular.isDefined($scope.tableConfig.headers) &&
                          $scope.tableConfig.headers.length === 1){
                            //last value true is only for server paging if it is there
                            $scope.colSort(sortValueHeader.sortfield,
                                           $scope.sortDir,
                                           sortValueHeader.type,
                                           true);
                        }
                    };

                    var findEnumeratedFilter = function(){
                        return $element.find('div.enumerated_filter_control');
                    };

                    var findEnumeratedFilterInput = function(){
                        return $element.find('span.enum_filter_input');
                    };

                    $scope.solidTable = function($event){
                        $scope.displayStandardTable = true;
                        $scope.displayTiles = false;
                    };

                    $scope.tileTable = function($event){
                        $scope.displayStandardTable = false;
                        $scope.displayTiles = true;
                    };

                    //if the transformable attribute is set, make the buttons visible
                    if (!isUndefined($element.attr('transformable'))) {
                        //TODO - only enable stack and tile buttons if there are urls for a tile template
                        $scope.showTransformControls = true;
                    } else {
                        $scope.showTransformControls = false;
                    }

                    if (!isUndefined($element.attr('sortcontrol'))){
                        $scope.showSortControl = true;
                    } else {
                        $scope.showSortControl = false;
                    }

                    if (!isUndefined($element.attr('enumFilter'))){
                        $scope.showEnumFilter = true;
                    } else {
                        $scope.showEnumFilter = false;
                    }

                    //if the filterable attribute is set, make the filter input visible
                    if (!isUndefined($element.attr('filterable'))) {
                        $scope.showTextFilter = true;
                    } else {
                        $scope.showTextFilter = false;
                    }

                    $scope.selectedRowActionMorph = function(){
                        if (angular.isUndefined($scope.tableConfig.multiSelectActionMenuConfig) ||
                            $scope.tableConfig.multiSelectActionMenuConfig.length === 0){
                            $scope.selectedRowActionsButton = false;
                            $scope.selectedRowActionsMenu = false;
                        } else {
                            if($scope.tableConfig.multiSelectActionMenuConfig.length === 1){
                                $scope.selectedRowActionsButton = true;
                                $scope.selectedRowActionsMenu = false;
                            } else {
                                $scope.selectedRowActionsButton = false;
                                $scope.selectedRowActionsMenu = true;
                            }
                        }
                    };
                    $scope.selectedRowActionMorph();


                    if(!isUndefined($element.attr('tile'))) {
                        $scope.tileTable();
                    } else {
                        $scope.solidTable();
                    }

                    //if the table is pageable, show the paging buttons
                    //if use server paging , it is always pageable
                    if(!isUndefined($element.attr('pageable'))){
                        $scope.pageable = true;
                        //if no page size is set, set it to 1000
                        if(isNaN($scope.tableConfig.pageConfig.pageSize)){
                            $scope.tableConfig.pageConfig.pageSize = 1000;
                        }

                        //default page number is 1
                        if(isUndefined($scope.tableConfig.pageConfig.page) ||
                           isNaN($scope.tableConfig.pageConfig.page) || $scope.tableConfig.pageConfig.page < 1){
                            $scope.tableConfig.pageConfig.page = 1;
                        }

                        $element.find('.pagebtn').show();
                        $element.find('.pagebtn').attr('disabled', '');
                    } else {
                        $scope.pageable = false;
                    }

                    $scope.enumFilters = [];

                    // Optionaly overwrite enumFilter with a 2 way data binding to an outside value
                    //
                    // This will compltely wipe out manualy inputed values on data change of customEnumFilter, and should be used
                    // when there is a need to forceably and completly change the filter.
                    //
                    // Example: On launch of a modal driven table where multiple views can be presented on the same data set,
                    // changed only via a predefined filter value...
                    //only deal with one custom filter
                    $scope.$watch('customEnumFilter', function(){
                        if(!isUndefined($scope.customEnumFilter)) {
                            //clean the filter first
                            $scope.enumFilters = [];

                            //if we have something in the filter
                            if (Object.keys($scope.customEnumFilter).length !== 0 ) {
                                $scope.enumFilters.push($scope.customEnumFilter);
                            }
                            else { //enumFilter gets total cleaned
                                //for server paging , need to update the filters options
                                if($scope.isServerPaging) {
                                    if(!isUndefined($scope.serverQueryParams.filtering)) {
                                        var filters = $scope.serverQueryParams.filtering;
                                        for(var filterHeader in filters) {
                                            if (filters.hasOwnProperty(filterHeader)) {
                                                filters[filterHeader].octable = [];
                                            }
                                        }
                                    }
                                }
                            }

                            if($scope.isServerPaging) {
                                log('debug', 'doCustomEnumFilter = ' + JSON.stringify($scope.serverQueryParams));
                                $scope.$emit('doTableDataReload');
                            }
                        }
                    });

                    //when user clicks X on filter control
                    $scope.clearAllEnumFilters = function($event, tableid){

                        if (angular.isUndefined($scope.enumFilters) || $scope.enumFilters.length === 0) {
                            return; //nother to clear
                        }

                        if(angular.isUndefined(tableid) || tableid === $scope.tableid) {
                            $scope.enumFilters = [];
                            $scope.enumFilterOverflowCheck(0, findEnumeratedFilterInput());
                        }

                        //no more X button, comment out for now
                        //if($scope.isServerPaging) {
                        //    if(!isUndefined($scope.serverQueryParams.filtering)) {
                        //        var filters = $scope.serverQueryParams.filtering;
                        //        for(var filterHeader in filters) {
                        //            if (filters.hasOwnProperty(filterHeader)) {
                        //                filters[filterHeader].octable = [];
                        //            }
                        //        }
                        //    }
                        //}

                        //$scope.doPage('first');
                        //$scope.clearAllSelections();
                        //updatePageButtons();

                        if($event.stopPropagation) {
                            $event.stopPropagation();
                        }
                    };

                    $scope.enumFilterOpen = false;

                    //when user clicks on filter control
                    $scope.triggerEnumFilter = function($event){
                        $scope.positionEnumFilterInput();

                        //deal with server filtering
                        //deal with the case of singleton filter (like ui_status in alarm)
                        if($scope.isServerPaging &&
                           !isUndefined($scope.enumFilters) &&
                           $scope.enumFilters.length > 0) {
                            var suppress = [];
                            //go through each existing enumFilter
                            for(var idx in $scope.enumFilters) {
                                var filter = $scope.enumFilters[idx];
                                var filterField = filter.sortfield;

                                //TODO: workaround for the limitation for backend
                                //only show the filter once
                                for(var i in $scope.tableHeaderFilter) {
                                    var header = $scope.tableHeaderFilter[i];
                                    //for singleton filter, if have already have one in
                                    //enumFilter, then don't show it again
                                    if (header.singleton && header.displayfield === filter.sortfield) {
                                        $scope.tableHeaderFilter[i].noshow = true;
                                    }
                                }
                            }
                            $scope.dimensionFilterSelected = false;
                        }
                        $scope.enumFilterOpen = !$scope.enumFilterOpen;
                        $event.stopPropagation();
                    };

                    $scope.enumFilterSelectionOpen = false;
                    $scope.enumFilterColumnSelected = function($event, header){
                        $scope.enumFilters.push({displayname: header.name,
                                                  sortfield: header.sortfield,
                                                  displayvalue: '',
                                                  value: undefined});
                        $scope.columnFilterList = {header: header, options: header.filterOptions};
                        $scope.enumFilterOverflowCheck(header.name.length * 8, findEnumeratedFilterInput());
                        $scope.positionEnumFilterInput();
                        $scope.enumFilterSelectionOpen = true;
                        $event.stopPropagation();
                    };

                    //the common functions needed by enumFilterAlarmIdSelected
                    //enumFilterDimensionSelected, enumFilterAllColumnSelected
                    var enumFilterSelectedPostProcess = function(lableString, $event) {

                        $scope.enumFilterOverflowCheck(lableString.length * 8, findEnumeratedFilterInput());
                        $scope.columnFilterList = {header: undefined, options: undefined};
                        $scope.positionEnumFilterInput();
                        $scope.enumFilterTextSelectionOpen = true;

                        //need to set the focus on the element here
                        var inputElements = $element.find('input#enum_text_filter_input');
                        if(inputElements.length > 0){
                            //timeout is to focus it after its been displayed, otherwise the focus won't stick
                            $timeout(function() {
                                inputElements[0].focus();
                            }, 10);
                        }

                        $event.stopPropagation();
                    };

                    //TODO workaround for lacking of any column for server paging
                    //hack for dimension search
                    $scope.dimensionFilterSelected = false;
                    $scope.enumFilterDimensionSelected  = function($event) {
                        $scope.dimensionFilterSelected = true;
                        var dString = $translate.instant('table.dimension');
                        $scope.enumFilters.push({
                            displayname: dString,
                            sortfield: 'dimension',
                            displayvalue: '',
                            value: undefined
                        });
                        enumFilterSelectedPostProcess (dString, $event);

                    };

                    //TODO workaround for lacking of any column for server paging
                    //hack for alarm id search
                    $scope.enumFilterAlarmIdSelected  = function($event) {
                        $scope.dimensionFilterSelected = false;
                        var alarmidString = $translate.instant('table.alarmid');
                        $scope.enumFilters.push({
                            displayname: alarmidString,
                            sortfield: 'id',
                            displayvalue: '',
                            value: undefined
                        });

                        enumFilterSelectedPostProcess (alarmidString, $event);
                    };

                    //when user click any column
                    $scope.enumFilterAllColumnSelected = function($event){
                        $scope.dimensionFilterSelected = false;
                        var anyColumnString = $translate.instant('table.anycolumn');
                        $scope.enumFilters.push({
                            displayname: anyColumnString,
                            sortfield: undefined,
                            displayvalue: '',
                            value: undefined
                        });

                        enumFilterSelectedPostProcess (anyColumnString, $event);
                    };

                    $scope.positionEnumFilterInput = function(){
                        var xOffset = $scope.getEnumFilterMenuXOffset(findEnumeratedFilterInput());
                        $scope.enum_menu_pos = {left : xOffset+'px', position:'absolute', top: '0px'};
                    };


                    //these watches clear out filters that aren't complete if the user clicks outside
                    //of the selection box after picking a filter attribute
                    $scope.$watch('enumFilterSelectionOpen', function(){
                        if($scope.enumFilterSelectionOpen === false) {
                            $scope.cleanUpEmptyEnumFilters();
                        }
                    });

                    $scope.$watch('enumFilterTextSelectionOpen', function(){
                        if($scope.enumFilterTextSelectionOpen === false) {
                            $scope.cleanUpEmptyEnumFilters();
                        }
                    });

                    $scope.clearValueFromTextFilter = function(){
                        //hack to clear the text filter
                        var inputElements = $element.find('input#enum_text_filter_input');
                        var i = 0;
                        for(i = 0; i < inputElements.length; i++){
                            inputElements[i].value = '';
                        }
                    };

                    $scope.cleanUpEmptyEnumFilters = function(){
                        var i = 0;
                        for (i = 0 ; i < $scope.enumFilters.length; i++){
                            if(angular.isUndefined($scope.enumFilters[i].value)){

                                if($scope.isServerPaging) {
                                    cleanupFiltersForServerPaging($scope.enumFilters[i].sortfield);
                                }

                                $scope.enumFilters.splice(i,1);

                                break;
                            }
                        }

                        $scope.clearValueFromTextFilter();
                    };

                    $scope.enumFilterOverflowCheck= function(offset, filterInput){

                        var childWidth = offset || 0;
                        var filterWidth = filterInput.width() || 0; //width without margins
                        angular.forEach(filterInput.children('button'),function(value, key){
                            childWidth += angular.element(value).outerWidth(true);//get width with margins
                        });

                        var widthRatio = Math.ceil(childWidth / filterWidth);

                        //TODO - this isnt working right now without flex, need to come up with alternative
                        //if(widthRatio > 0){
                        //    var height = (35 * widthRatio) + 'px';
                        //    $scope.enum_input_height = { height : height};
                        //}

                    };


                    /**
                     * work around for server filtering limitation
                     * find from current filter if there are any child filter name
                     * that can not show
                     */
                    var findChildFilterNotToShow = function (filterHeaderName) {
                        var list = [];
                        $scope.tableHeaderFilter.forEach(function(tableHeader) {
                            if(tableHeader.displayfield === filterHeaderName) {
                                if(!isUndefined(tableHeader.filterOptions)) {
                                    tableHeader.filterOptions.forEach(function(opt) {
                                        if (!isUndefined(opt.suppressChildFilter) &&
                                            opt.suppressChildFilter) {
                                            list.push(tableHeader.childfilter);
                                        }
                                    });
                                }
                            }
                        });
                        return list;
                    };

                    //when select the value of the filter drop down selections
                    $scope.enumFilterValueSelected = function($event, filter, header){
                        var i = 0;
                        for (i = 0 ; i < $scope.enumFilters.length; i++){
                            if($scope.enumFilters[i].sortfield === header.sortfield &&
                               angular.isUndefined($scope.enumFilters[i].value)){
                                $scope.enumFilters[i].value = filter.value;
                                $scope.enumFilters[i].displayvalue = filter.displayLabel;
                                break;
                            }
                        }
                        $scope.columnFilterList = [];
                        $scope.enumFilterSelectionOpen = false;
                        $scope.enumFilterOverflowCheck(filter.displayLabel.length * 8, findEnumeratedFilterInput());

                        //deal with server paging
                        if($scope.isServerPaging) {
                            if (isUndefined($scope.serverQueryParams.filtering)) {
                                $scope.serverQueryParams.filtering = {};
                            }
                            var filterHeader = header.displayfield;
                            var filterValue = filter.value;
                            //if don't have that filter category, init it first
                            if(isUndefined($scope.serverQueryParams.filtering[filterHeader])) {
                                $scope.serverQueryParams.filtering[filterHeader] = {};
                                $scope.serverQueryParams.filtering[filterHeader].octable = [];
                                $scope.serverQueryParams.filtering[filterHeader].octable.push(filterValue);
                            }
                            else { //if have it, just add
                                $scope.serverQueryParams.filtering[filterHeader].octable.push(filterValue);
                            }
                        }

                        $scope.doPage('first');
                        $scope.clearAllSelections();
                        updatePageButtons();
                    };

                    //when enter text for any column
                    //server paging hack deal with filter alarm id
                    $scope.enumFilterTextValueEntered = function($event, value){
                        var i = 0;
                        if (!$scope.isServerPaging) {
                            for (i = 0; i < $scope.enumFilters.length; i++) {
                                if ($scope.enumFilters[i].sortfield === undefined &&
                                    angular.isUndefined($scope.enumFilters[i].value)) {
                                    $scope.enumFilters[i].value = value;
                                    $scope.enumFilters[i].displayvalue = value;
                                    break;
                                }
                            }
                        }
                        else { //deal with server paging
                            var updatedEnumFilterIdx = -1;
                            for (i = 0; i < $scope.enumFilters.length; i++) {
                                //should have only one undefined
                                if (angular.isUndefined($scope.enumFilters[i].value)) {
                                    $scope.enumFilters[i].value = value;
                                    $scope.enumFilters[i].displayvalue = value;
                                    if ($scope.enumFilters[i].sortfield === 'id') {
                                        $scope.isIdFilterOn = true;
                                    }
                                    updatedEnumFilterIdx = i;
                                    break;
                                }
                            }

                            if (!isUndefined($scope.serverQueryParams) && updatedEnumFilterIdx !== -1) {
                                var filter = $scope.enumFilters[updatedEnumFilterIdx];
                                var filterHead = filter.sortfield;
                                var filterValue = filter.value;
                                if (isUndefined($scope.serverQueryParams.filtering)) {
                                    $scope.serverQueryParams.filtering = {};
                                }
                                if (isUndefined($scope.serverQueryParams.filtering[filterHead])) {
                                    $scope.serverQueryParams.filtering[filterHead] = {};
                                    $scope.serverQueryParams.filtering[filterHead].octable = [];
                                }
                                //ok to have duplicates, will clean up during request process
                                $scope.serverQueryParams.filtering[filterHead].octable.push(filterValue);
                            }
                        }

                        $scope.columnFilterList = [];
                        $scope.enumFilterTextSelectionOpen = false;
                        $scope.enumFilterOverflowCheck(value.length * 8, findEnumeratedFilterInput());
                        $scope.doPage('first');
                        $scope.clearAllSelections();
                        updatePageButtons();
                    };

                    $scope.filterValueFieldClicked = function($event){
                        $event.stopPropagation();
                    };

                    $scope.filterValueFieldChanged = function($event, textFilter){
                        if($event.which === 13){//enter event
                            $scope.enumFilterTextSelectionOpen = false;
                            $scope.enumFilterTextValueEntered($event, textFilter);
                            textFilter = '';
                        }
                        //if not the enter event, do nothing
                    };

                    $scope.checkEnumeratedFilter = function(item, filter){
                        var i = 0, j = 0;

                        var itemKeys = [];
                        var headers = $scope.tableConfig.headers;
                        headers.forEach(function(element, index, arr){
                            itemKeys.push(element.displayfield);
                            if(angular.isDefined(element.extraDataFilterFields) && element.extraDataFilterFields.length > 0){
                                element.extraDataFilterFields.forEach(function(subelement, subindex, subarr){
                                    itemKeys.push(subelement);
                                });
                            }
                        });

                        for(i = 0; i < filter.values.length; i++) {
                            //check each of the values in the filter, this is an OR operation
                            if(filter.sortfield === undefined){
                                //any column filter
                                for(j = 0; j < itemKeys.length; j++){
                                    if(!isUndefined(item[itemKeys[j]]) && !isUndefined(item[itemKeys[j]].toString) && (
                                        item[itemKeys[j]].toString().toLowerCase().indexOf(filter.values[i].toLowerCase()) !== -1 ||
                                       item[itemKeys[j]].toString().toLowerCase().indexOf($translate.instant(filter.values[i]).toLowerCase()) !== -1)){
                                        return true;
                                    }
                                }
                            } else {
                                if (item[filter.sortfield] === filter.values[i] ||
                                    item[filter.sortfield] === $translate.instant(filter.values[i]) || item[filter.sortfield] !== null &&
                                    item[filter.sortfield] !== undefined &&
                                    (angular.isDefined(item[filter.sortfield].toString) && //handles booleans and numbers
                                        (item[filter.sortfield].toString() === filter.values[i] ||
                                         item[filter.sortfield].toString() === $translate.instant(filter.values[i])))) {
                                    return true;
                                }
                            }
                        }

                        return false;
                    };

                    $scope.$on('clearEnumFiltersEvent', $scope.clearAllEnumFilters);

                    var cleanupFiltersForServerPaging = function(filterHeaderName) {
                        var childList = [];
                        //clean tableHeaderFilter related to single filter
                        //first pass to clean up parent
                        $scope.tableHeaderFilter.forEach(function(header, idx) {
                            if(!isUndefined(header.singleton) && header.singleton &&
                                header.displayfield === filterHeaderName) {
                                 $scope.tableHeaderFilter[idx].noshow = false;
                            }
                        });
                    };

                    //when user removes on filter
                    $scope.clearEnumeratedFilter = function($event, filter){
                        var i = 0;
                        for(i = 0; i < $scope.enumFilters.length; i++){
                            if($scope.enumFilters[i].sortfield === filter.sortfield &&
                                $scope.enumFilters[i].value === filter.value){
                                $scope.enumFilters.splice(i, 1);
                                break;
                            }
                        }

                        //its the any column filter
                        //or alarm id filter hacking
                        if(filter.sortfield === undefined ||
                            ($scope.isServerPaging && filter.sortfield === 'id')){
                            $scope.clearValueFromTextFilter();
                        }

                        if(filter.value === undefined){
                            $scope.enumFilterTextSelectionOpen = false;
                            $scope.enumFilterSelectionOpen = false;
                        }

                        //for server paging need to clean the serverQueryParams
                        if($scope.isServerPaging) {
                            $scope.dimensionFilterSelected = false;
                            if(filter.sortfield === 'id') {
                                //remove the restriction so id filter can show again
                                $scope.isIdFilterOn = false;
                            }
                            var filterHeaderName = filter.sortfield;
                            var filterValue = filter.value;
                            //clean the serverQueryParams
                            if (!isUndefined($scope.serverQueryParams.filtering[filterHeaderName])) {
                                var octableFilters = $scope.serverQueryParams.filtering[filterHeaderName].octable;
                                octableFilters.forEach(function(datum, idx){
                                     if (filterValue === datum) {
                                         $scope.serverQueryParams.filtering[filterHeaderName].octable.splice(idx, 1) ;
                                     }
                                });
                            }

                            cleanupFiltersForServerPaging(filterHeaderName);
                        }

                        $scope.enumFilterOverflowCheck(0,findEnumeratedFilterInput());
                        $event.stopPropagation();
                        $scope.doPage('first');
                        $scope.clearAllSelections();
                        updatePageButtons();
                        $timeout(function() {
                            $scope.positionEnumFilterInput();
                        }, 10);
                    };

                    // The filter menu should be positioned roughly after last entry in the filterInput.
                    // This function calculates the appropriate x offset for the menu, relative to the
                    // left side of the filterInput
                    $scope.getEnumFilterMenuXOffset = function(filterInput){

                        var xOffset;
                        var filterbuttons = filterInput.children('button');

                        if (filterbuttons.length === 0){
                            xOffset = 40;  // put it just past the filter icon
                        } else {
                            var lastChild = angular.element(filterbuttons[filterbuttons.length-1]);
                            xOffset = parseInt(lastChild.position().left + lastChild.outerWidth());
                        }

                        // sanity check the offset before setting it to prevent the menu from
                        // appearing off the screen to the right
                        var filterFarRight = filterInput.outerWidth();
                        var menuWidth = 200;
                        if(xOffset > filterFarRight - menuWidth){
                            xOffset = filterFarRight - menuWidth;
                        }

                        return xOffset;
                    };

                    /**
                     * pageFilter for non server paging,
                     * ignore when it is server paging
                     */
                    $scope.pageFilter = function(item, index){
                        if($scope.isServerPaging || $scope.pageable === false ||
                            isUndefined($scope.tableConfig) || isUndefined($scope.tableConfig.pageConfig)) {
                            return true;
                        }
                        else {

                            if ($scope.tableConfig.pageConfig === 0 ||
                                ((index >= ($scope.tableConfig.pageConfig.page - 1) * $scope.tableConfig.pageConfig.pageSize) &&
                                (index < ($scope.tableConfig.pageConfig.page) * $scope.tableConfig.pageConfig.pageSize))) {
                                return true;
                            } else {
                                return false;
                            }
                        }
                    };

                    //these filters are run from the tableConfig in addition to the default string filter
                    //ignore when it is server paging
                    $scope.tableFilters = function(item){
                        if($scope.isServerPaging) {
                            return true;
                        }

                        var include = true, filterFunction, filterArgs;
                        var i = 0, j = 0;

                        var hasEnumeratedFilters = false;
                        if(($scope.enumFilters.length > 1) ||
                            ($scope.enumFilters.length === 1 && !angular.isUndefined($scope.enumFilters[0].value))){
                            hasEnumeratedFilters = true;
                        }

                        var hasConfiguredFilters = !isUndefined($scope.tableConfig.filters);

                        //if there are no filters, default to true
                        //otherwise, default to false
                        if (hasConfiguredFilters || hasEnumeratedFilters) {
                            if((!hasConfiguredFilters) ||
                                (hasConfiguredFilters && $scope.tableConfig.filters.length === 0)){
                                include = true;
                            } else {
                                include = false;
                            }

                            if(hasConfiguredFilters) {
                                for (i = 0; i < $scope.tableConfig.filters.length; i++) {
                                    filterFunction = $scope.tableConfig.filters[i].function;
                                    filterArgs = $scope.tableConfig.filters[i].args;
                                    include = include || filterFunction(item, filterArgs);
                                }
                            }

                            if(hasEnumeratedFilters) {
                                //need to check the enumerated filters as well
                                var condensedFilters = [];
                                var k = 0, matchedFilter = false, enumeratedInclude;
                                for (j = 0; j < $scope.enumFilters.length; j++) {
                                    matchedFilter = false;
                                    //create a combined filter list for each value
                                    //do an AND filter for different columns
                                    //and an OR filter for the same column
                                    //i.e. 2 status filters WARN and ERROR will be "OR"'d
                                    //but an additional "TYPE:KVM" filter will be AND

                                    for(k = 0; k < condensedFilters.length; k++){
                                        if(condensedFilters[k].sortfield === $scope.enumFilters[j].sortfield){
                                            //found a match
                                            matchedFilter = true;
                                            condensedFilters[k].values.push($scope.enumFilters[j].value);
                                            break;
                                        }
                                    }

                                    //only add the value to the list if its defined
                                    //undefined values indicate an incomplete filter
                                    if(!matchedFilter && !angular.isUndefined($scope.enumFilters[j].value)){
                                        condensedFilters.push({
                                            sortfield : $scope.enumFilters[j].sortfield,
                                            values : [$scope.enumFilters[j].value]
                                        });
                                    }

                                }

                                enumeratedInclude = true;
                                for(j = 0; j < condensedFilters.length; j++) {
                                    //check each column filter separately, this is an AND operation
                                    // the OR part is handled in the fact that the filters are condensed
                                    // and each column can potentially have an array of acceptable values
                                    enumeratedInclude = enumeratedInclude && $scope.checkEnumeratedFilter(item, condensedFilters[j]);
                                }
                                include = include && enumeratedInclude;
                            }
                        }

                        return include;
                    };

                    $scope.selectable = (isUndefined($element.attr('selectable')) &&
                        isUndefined($element.attr('singleselect'))) ? false : true;

                    $scope.singleSelect = !isUndefined($element.attr('singleselect'));

                    $scope.actionable = isUndefined($element.attr('actionmenu')) ? false : true;

                    //supports the ability to add a css class for an entire row based on the data
                    //in that css class
                    $scope.getRowClass = function(rowData){
                        var rowClass = "";
                        var addRowClass = "";
                        var rowFilter;
                        var rowCustomizers = $scope.tableConfig.rowCustomizers || [];
                        for(i = 0; i < rowCustomizers.length; i++){
                            rowFilter = $filter(rowCustomizers[i]);
                            if(!isUndefined(rowFilter)) {
                                addRowClass = rowFilter(rowData);
                                if (!isUndefined(addRowClass) && addRowClass.length !== 0) {
                                    rowClass = rowClass + addRowClass + " ";
                                }
                            }
                        }

                        if($scope.selectable && rowData[$scope.rowSelectionAttr]){
                            rowClass = rowClass + "tableRowSelected";
                        }

                        if($scope.tileexpandable || typeof $scope.tableConfig.expandAction === 'function') {
                          rowClass = rowClass + " clickable_content";
                        }

                        return rowClass;
                    };

                    $scope.getCellClass = function(data, cellData, header){
                        var cellClass = "";
                        var addCellClass = "";
                        var cellFilter;
                        var cellCustomizers = $scope.tableConfig.cellCustomizers || [];
                        for(i = 0; i < cellCustomizers.length; i++){
                            cellFilter = $filter(cellCustomizers[i]);
                            if(!isUndefined(cellFilter)) {
                                addCellClass = cellFilter(cellData);
                                if (!isUndefined(addCellClass) && addCellClass.length !== 0) {
                                    cellClass = cellClass + addCellClass + " ";
                                }
                            }
                        }

                        if($scope.expandable){
                            cellClass = cellClass + 'clickable_content ';
                        }

                        if(header.highlightExpand){
                            cellClass = cellClass + 'highlight ';
                        }

                        return cellClass;
                    };

                    $scope.isNotApplicable = function(data, header){
                        if(isUndefined($scope.tableConfig.naValueCheck)) {
                            return false;
                        } else {
                            return $scope.tableConfig.naValueCheck(data, header);
                        }
                    };

                    $scope.rowSelectionCount = 0;

                    //check if a row is allowed to be selected
                    $scope.rowSelectionOccurred = function(data){
                        //check if a row selection filter is configured
                        if(isUndefined($scope.tableConfig.rowSelectionCheck) ||
                            $scope.tableConfig.rowSelectionCheck(data, $scope.tableData)) {
                            //row selection is allowed, or there is no selection filter
                            data[$scope.rowSelectionAttr] = !data[$scope.rowSelectionAttr];
                            $scope.updateRowSelection(data);
                        }
                    };

                    $scope.getSelectButtonClass = function(data){
                        if(isUndefined($scope.tableConfig.rowSelectionCheck) ||
                            $scope.tableConfig.rowSelectionCheck(data, $scope.tableData)) {
                            //row selection is allowed, or there is no selection filter
                            return '';
                        } else {
                            return 'rowSelectionDisabled';
                        }
                    };

                    $scope.updateMultiRowSelectionMenu = function(data){
                        if(!angular.isUndefined($scope.tableConfig.multiSelectActionMenuConfigFunction &&
                           !angular.isUndefined($scope.tableConfig.multiSelectActionMenuConfig))){
                            var permissions;
                            var allhidden = true;
                            var alldisabled = true;
                            $scope.tableConfig.multiSelectActionMenuConfig.forEach(function(action, index, items){
                                action.disabled = false;
                                permissions = $scope.tableConfig.multiSelectActionMenuConfigFunction(data, action.name);

                                action.show = !permissions.hidden;
                                action.disabled = !permissions.enabled;
                                allhidden = allhidden && permissions.hidden;
                                alldisabled = alldisabled && !permissions.enabled;
                            });

                            if(allhidden) {
                                $scope.selectedRowActionsButton = false;
                                $scope.selectedRowActionsMenu = false;
                            } else {
                                $scope.selectedRowActionMorph();
                            }

                            if(alldisabled) {
                                $scope.selectedRowActionsButtonDisable = true;
                                $scope.selectedRowActionsMenuDisable = true;
                            } else {
                                $scope.selectedRowActionsButtonDisable = false;
                                $scope.selectedRowActionsMenuDisable = false;
                            }
                        }
                    };

                    //when row selections change, emit an event so a listening controller can perform actions
                    //or track state
                    $scope.updateRowSelection = function(rowData){
                        if($scope.selectable) {
                            $scope.rowSelectionCount = 0;
                            var selectedRows = [];
                            var sourceDataModel = $scope.modelname;
                            var i = 0;
                            if(!isUndefined($element.attr('singleselect'))){
                                for (i = 0; i < sourceDataModel.length; i++) {
                                    if (sourceDataModel[i] !== rowData) {
                                        sourceDataModel[i][$scope.rowSelectionAttr] = false;
                                    } else if(sourceDataModel[i][$scope.rowSelectionAttr]){
                                        selectedRows.push(rowData);
                                        $scope.rowSelectionCount = 1;
                                    }
                                }

                            } else {
                                $scope.rowSelectionCount = 0;
                                for (i = 0; i < sourceDataModel.length; i++) {
                                    if (sourceDataModel[i][$scope.rowSelectionAttr]) {
                                        selectedRows.push(sourceDataModel[i]);
                                        $scope.rowSelectionCount++;
                                    }
                                }
                            }

                            $scope.$emit('tableSelectionChanged', selectedRows, $scope.tableid);
                            $scope.updateMultiRowSelectionMenu(selectedRows);
                        }
                    };

                    $scope.getSelectedData = function(){
                        var selections = [], i = 0;
                        var sourceDataModel = $scope.modelname;
                        for (i = 0; i < sourceDataModel.length; i++) {
                            if(sourceDataModel[i][$scope.rowSelectionAttr]){
                                selections.push(sourceDataModel[i]);
                            }
                        }
                        return selections;
                    };

                    $scope.selectAll = function(){
                        var filteredDataModel = $scope.filteredDataModel();
                        var selectedRows = [];
                        $scope.rowSelectionCount = 0;
                        for (i = 0; i < filteredDataModel.length; i++) {
                            if(isUndefined($scope.tableConfig.rowSelectionCheck) ||
                                $scope.tableConfig.rowSelectionCheck(filteredDataModel[i], $scope.tableData)) {
                                filteredDataModel[i][$scope.rowSelectionAttr] = true;
                                selectedRows.push(filteredDataModel[i]);
                                $scope.rowSelectionCount++;
                            }
                        }

                        $scope.$emit('tableSelectionChanged', selectedRows, $scope.tableid);
                        $scope.updateMultiRowSelectionMenu(selectedRows);
                    };

                    $scope.selectVisible = function() {
                        var sourceDataModel = $scope.modelname;
                        var selectedRows = [];
                        var filteredDataModel = sourceDataModel;

                        if (!angular.isUndefined($scope.filterString)) {
                            var stringFilter = $filter($scope.filterString);
                            filteredDataModel = stringFilter(filteredDataModel);
                        }

                        if (!angular.isUndefined($scope.tableFilters)) {
                            filteredDataModel = $filter('filter')(filteredDataModel, $scope.tableFilters);
                        }

                        $scope.rowSelectionCount = 0;
                        for (i = 0; i < sourceDataModel.length; i++) {
                            sourceDataModel[i][$scope.rowSelectionAttr] = false;
                        }

                        var min_index = 0;
                        var max_index = filteredDataModel.length;
                        if (angular.isDefined($scope.tableConfig) && angular.isDefined($scope.tableConfig.pageConfig)) {
                            var page = $scope.tableConfig.pageConfig.page || 1;
                            var pageSize = $scope.tableConfig.pageConfig.pageSize || -1;
                            if ($scope.isServerPaging) {
                                max_index = pageSize;
                            } else {
                                if (pageSize !== -1) {
                                    min_index = (page - 1) * pageSize;
                                    max_index = page * pageSize;
                                }
                            }
                        }
                        for (i = 0; i < filteredDataModel.length; i++) {
                            if((isUndefined($scope.tableConfig.rowSelectionCheck) ||
                                $scope.tableConfig.rowSelectionCheck(filteredDataModel[i], $scope.tableData)) &&
                                (i >= min_index && i < max_index)) {
                                filteredDataModel[i][$scope.rowSelectionAttr] = true;
                                selectedRows.push(filteredDataModel[i]);
                                $scope.rowSelectionCount++;
                            }
                        }

                        $scope.$emit('tableSelectionChanged', selectedRows, $scope.tableid);
                        $scope.updateMultiRowSelectionMenu(selectedRows);
                    };

                    $scope.clearAllSelections = function(){
                        var sourceDataModel = $scope.modelname;
                        if(!isUndefined(sourceDataModel)) {
                            for (i = 0; i < sourceDataModel.length; i++) {
                                sourceDataModel[i][$scope.rowSelectionAttr] = false;
                            }
                        }
                        $scope.rowSelectionCount = 0;
                        $scope.$emit('tableSelectionChanged', [], $scope.tableid);
                        $scope.updateMultiRowSelectionMenu([]);
                    };

                    $scope.allSelected = false;

                    $scope.$on('tableSelectionChanged', function() {
                        if (!$scope.isServerPaging) {

                            //check for status of allSelected
                            var allSelected = true;
                            var filteredDataModel = $scope.modelname;

                            if(!angular.isUndefined($scope.filterString)){
                                var stringFilter = $filter($scope.filterString);
                                filteredDataModel = stringFilter(filteredDataModel);
                            }

                            if(!angular.isUndefined($scope.tableFilters)){
                                filteredDataModel = $filter('filter')(filteredDataModel, $scope.tableFilters);
                            }

                            var min_index = 0;
                            var max_index = filteredDataModel.length;
                            if(angular.isDefined($scope.tableConfig) && angular.isDefined($scope.tableConfig.pageConfig)){
                                var page = $scope.tableConfig.pageConfig.page || 0;
                                var pageSize = $scope.tableConfig.pageConfig.pageSize || -1;
                                if(pageSize !== -1){
                                    min_index = (page - 1) * pageSize;
                                    max_index = page * pageSize;
                                }
                            }

                            for (i = 0; i < filteredDataModel.length; i++) {
                                if((isUndefined($scope.tableConfig.rowSelectionCheck) ||
                                    $scope.tableConfig.rowSelectionCheck(filteredDataModel[i], $scope.tableData)) &&
                                    (i >= min_index && i < max_index)) {
                                    if(!filteredDataModel[i][$scope.rowSelectionAttr]){
                                        allSelected = false;
                                        break;
                                    }
                                }
                            }

                            $scope.allSelected = allSelected;



                        }
                        else { //deal with server paging

                            //if all current page selected
                            $scope.allSelected =
                                $scope.tableData.length === $scope.rowSelectionCount;
                        }
                    });

                    $scope.toggleSelection = function() {
                      if($scope.allSelected) {
                        $scope.clearAllSelections();
                      } else {
                        $scope.selectVisible();
                      }
                    };

                    /**
                     * find out the total number of the table data
                     * if non server paging total comes from filtered table data length
                     * if server paging, it comes from server
                     */
                    $scope.filterDataModelLength = function(){
                        if (!$scope.isServerPaging) {
                            var filteredDataModel = $scope.filteredDataModel();
                            if (angular.isDefined(filteredDataModel)) {
                                return filteredDataModel.length;
                            }
                        }
                        else { //deal with server paging
                            if(!isUndefined($scope.serverPagingTableDataTotal)) {
                                return $scope.serverPagingTableDataTotal;
                            }
                        }
                        return 0;
                    };

                    $scope.filteredDataModel = function(){
                        var filteredDataModel = $scope.tableData;

                        if(!$scope.isServerPaging) {
                            if (angular.isDefined($scope.filterString)) {
                                filteredDataModel = $filter($scope.filterString)(filteredDataModel);
                            }
                            filteredDataModel = $filter('filter')(filteredDataModel, $scope.tableFilters);
                        }

                        return filteredDataModel;
                    };

                    //TODO: don't see it gets triggered anywhere ignore
                    //for server paging for now
                    //may also have to be done for other filters
                    $scope.filterStringChange = function(filterString){
                        $scope.filterString = filterString;
                    };

                    //depending on what page the user is on, enable/disable and apply appropriate highlighting
                    //to paging buttons
                    var updatePageButtons = function() {
                        if (isUndefined($scope.tableConfig) || isUndefined($scope.tableConfig.pageConfig)) {
                            return; //if we don't have a tableConfig or pageConfig like dashboard, do nothing
                        }

                        $scope.tableConfig.pageConfig.maxPage =
                            Math.ceil($scope.filterDataModelLength() / $scope.tableConfig.pageConfig.pageSize);

                        if($scope.tableConfig.pageConfig.maxPage < 1){
                            $scope.tableConfig.pageConfig.maxPage = 1;
                        }

                        if($scope.tableConfig.pageConfig.page === 1){//first page
                            $element.find('.pagebtn.first').attr('disabled', '');
                            $element.find('.pagebtn.prev').attr('disabled', '');
                            $element.find('.pagebtn.next').removeAttr('disabled');
                            $element.find('.pagebtn.last').removeAttr('disabled');
                            $element.find('.pagebtn.first').addClass('disabled');
                            $element.find('.pagebtn.prev').addClass('disabled');
                            $element.find('.pagebtn.next').removeClass('disabled');
                            $element.find('.pagebtn.last').removeClass('disabled');
                        } else{
                            $element.find('.pagebtn.first').removeAttr('disabled');
                            $element.find('.pagebtn.prev').removeAttr('disabled');
                            $element.find('.pagebtn.first').removeClass('disabled');
                            $element.find('.pagebtn.prev').removeClass('disabled');
                        }

                        if($scope.tableConfig.pageConfig.page === $scope.tableConfig.pageConfig.maxPage){
                            $element.find('.pagebtn.last').attr('disabled', '');
                            $element.find('.pagebtn.next').attr('disabled', '');
                            $element.find('.pagebtn.last').addClass('disabled');
                            $element.find('.pagebtn.next').addClass('disabled');
                            if($scope.tableConfig.pageConfig.page !== 1) {//first page is maxPage
                                $element.find('.pagebtn.prev').removeAttr('disabled');
                                $element.find('.pagebtn.first').removeAttr('disabled');
                                $element.find('.pagebtn.prev').removeClass('disabled');
                                $element.find('.pagebtn.first').removeClass('disabled');
                            }
                        } else{
                            $element.find('.pagebtn.last').removeAttr('disabled');
                            $element.find('.pagebtn.next').removeAttr('disabled');
                            $element.find('.pagebtn.last').removeClass('disabled');
                            $element.find('.pagebtn.next').removeClass('disabled');
                        }
                    };

                    //need to update the page buttons when have
                    //tableConfig.filters or table data appended dynamically
                    var updatePages = function() {
                        $scope.doPage('first');
                        $scope.clearAllSelections();
                        updatePageButtons();
                    };

                    $scope.checkSelectAll = function(){
                        $scope.rowSelectionCount = 0;
                        var sourceDataModel = $scope.modelname;
                        if(!angular.isUndefined(sourceDataModel)){
                            for (i = 0; i < sourceDataModel.length; i++) {
                                if (sourceDataModel[i][$scope.rowSelectionAttr]) {
                                    $scope.rowSelectionCount++;
                                }
                            }

                            //when modelaname/sourceDataModel is empty,
                            //remove the selections
                            if($scope.isServerPaging) {
                                if(sourceDataModel.length === 0) {
                                    $scope.rowSelectionCount = 0;
                                    $scope.allSelected = 0;
                                }
                            }
                        }
                    };

                    //the table will pull data from the original datamodel, which has been filtered
                    //and pass it into the paging process
                    var postProcessData = function(){
                        if (!isUndefined($scope.modelname)) {
                            $scope.tableData = $scope.modelname;
                            updatePageButtons();
                            $scope.checkSelectAll();

                            if($scope.expandOnLoad && $scope.filteredDataModel().length > 0){
                                $scope.expandRow(undefined, $scope.filteredDataModel()[0]);
                            }
                        }
                    };

                    //watch for changes in the datamodel, when it updates, update the data in the table
                    //since server paging will inform sorted data change with other params
                    //for tableDataLoaded so here don't need care about sorting in cache
                    if(!isUndefined(modelname) && !$scope.isServerPaging ){
                        $scope.$parent.$watch(modelname, function(){
                            //if we don't have any sort col specified , will do
                            //default sort on the first column which is name col
                            if(angular.isUndefined($scope.tableSortHeader)) {
                                $scope.sortDir = 'asc';
                                //if we have init sort dir defined
                                if(angular.isDefined($scope.tableConfig) &&
                                   angular.isDefined($scope.tableConfig.initSortDir)) {
                                    $scope.sortDir = $scope.tableConfig.initSortDir;
                                }
                            }

                            $scope.doSort();
                            postProcessData();
                        }, true);
                        //in case the datamodel is directly an array
                        $scope.$parent.$watchCollection(modelname, function(){
                            //if we don't have any sort specified , will do
                            //default sort on the first column which is name co
                            if(angular.isUndefined($scope.tableSortHeader)) {
                                $scope.sortDir = 'asc';
                            }
                            $scope.doSort();
                            postProcessData();
                        }, true);
                    }

                    //watch for changes in the datamodel, when it updates, update the data in the table
                    if(!isUndefined(loadflag)){
                        $scope.$parent.$watch(loadflag, function(){
                            $scope.setLoading(getKeyFromScope(loadflag, $scope.$parent));
                        }, true);
                    }

                    $scope.setLoading = function(loading){
                        $scope.loading = loading;
                    };

                    //process a page change, will need to handle numbers here eventually
                    $scope.$watch('modelname', function() {
                        //deal with server paging
                        if($scope.isServerPaging === true ) {
                            postProcessData();
                        }
                        else { //non server paging
                            //only update pageConfigs for tables with paging enabled
                            if (!isUndefined($scope.tableConfig) && !isUndefined($scope.tableConfig.pageConfig)) {
                                $scope.tableConfig.pageConfig.maxPage = Math.ceil($scope.filterDataModelLength() / $scope.tableConfig.pageConfig.pageSize);
                            }
                        }
                    }, true);

                    //when user click the page buttons
                    $scope.doPage = function(pageChange){
                        //clear selections
                        $scope.clearAllSelections();
                        //get the page first
                        var page = 1;
                        if (pageChange === 'prev') {
                            page =
                                ($scope.tableConfig.pageConfig.page - 1) > 1 ?
                                ($scope.tableConfig.pageConfig.page - 1) : 1;
                        } else if (pageChange === 'next') {
                            page = ($scope.tableConfig.pageConfig.page + 1) < $scope.tableConfig.pageConfig.maxPage ?
                                ($scope.tableConfig.pageConfig.page + 1) : $scope.tableConfig.pageConfig.maxPage;
                        } else if (pageChange === 'first') {
                            page = 1;
                        } else if (pageChange === 'last') {
                            page = $scope.tableConfig.pageConfig.maxPage;
                        }

                        //deal with server paging
                        if($scope.isServerPaging === true ) {
                            //broadcast to parent so it can do server query
                            if(isUndefined($scope.serverQueryParams.paging)) {
                                $scope.serverQueryParams.paging = {};
                            }
                            $scope.serverQueryParams.paging.page = page;

                            log('debug', 'doServerPage = ' + JSON.stringify($scope.serverQueryParams));
                            $scope.$emit('doTableDataReload');
                        }
                        else { //non server paging
                            $scope.clearAllSelections();
                            $scope.tableConfig.pageConfig.page = page;
                            postProcessData();
                        }
                    };

                    //when server paging, listen to the paging request when data is ready
                    if($scope.isServerPaging) {
                        $scope.serverPagingTableDataTotal = 0;
                        $scope.$on('tableDataLoaded', function (event, args) {
                            if(!isUndefined(args)) {
                                $scope.serverPagingTableDataTotal = args.total;
                                //deal with tableData, paging buttons and selections
                                postProcessData();

                                ///for init data load to set the sorting on
                                if(!isUndefined(args.sortcol)) {
                                    //just need to set the icon on the column
                                    //don't need to reload page
                                    $scope.currentSortHeader = args.sortcol;
                                    $scope.colSort($scope.currentSortHeader.sortfield,
                                                   $scope.sortDir,
                                                   $scope.currentSortHeader.type,
                                                   false);

                                }

                            }
                        });
                    }

                    $scope.expandColSpan = function() {
                        var colSpan = $scope.tableConfig.headers.length + 1;
                        if ($scope.actionable) {
                            colSpan += 1;
                        }
                        return colSpan;
                    };

                    $scope.expandable = isUndefined($element.attr('expandable')) ? false : true;

                    $scope.expandOrCheck = function(expand,data,$event) {
                        //comment out this functionality for now, may be revisted in future
                        /*if(expand && $($event.target).is('span') ) {
                            $scope.expandRow($event, data);
                        }
                        else {
                            $scope.rowSelectionOccurred(data);
                        }
                        $scope.rowSelectionOccurred(data);*/
                        $scope.expandRow($event, data);
                    };

                    $scope.expandRow = function($event, data){
                        if($scope.expandable && ($event && $($event.target).prop("tagName") !== 'BUTTON') || !$event) {
                            if(angular.isDefined($scope.tableConfig.expandAction)){
                                $scope.tableConfig.expandAction(data);
                            } else {
                                $scope.expandSelection(data);
                                $scope.$broadcast('detailsIndexInfo', $scope.findDataIndexInFilteredModel(data));
                            }
                        }
                        if(angular.isDefined($event)){
                            $event.stopPropagation();
                        }

                        $scope.expandOnLoad = false;
                    };

                    $scope.getExpandedColspan = function(){
                        var colSpan = $scope.tableConfig.headers.length;
                        if($scope.actionable){
                            colSpan += 1;
                        }

                        if($scope.selectable){
                            colSpan += 1;
                        }

                        return colSpan;
                    };

                    $scope.expandSelection = function(data){
                        //data.$expanded = true;
                        $scope.showTableDetails = true;

                        $scope.selectionData = data;
                        //for loading purposes some data may not be loaded until certain rows
                        //are expanded, need to emit events when that happens
                        $scope.$emit('tableSelectionExpanded', data, $scope.tableid);
                        $scope.$broadcast('detailsIndexInfo', $scope.findDataIndexInFilteredModel(data));
                    };

                    $scope.getExpandTemplateUrl = function(){
                        return $scope.expandTemplateUrl;
                    };

                    $scope.getTileTemplateUrl = function(){
                        return $scope.tileTemplateUrl;
                    };

                    $scope.tableActionMenuOpenClose = function($event, data){
                        $scope.actionMenu($event, data);
                        $event.stopPropagation();
                    };

                    $scope.tileActionMenuOpenClose = function($event, data){
                        $scope.actionMenu($event, data);
                        $event.stopPropagation();
                    };

                    $scope.actionMenu = function($event, data){
                        //update the state of the action menu items based on the data

                        //TODO - this isn't working yet, its updating a copy of the model object
                        //instead of the original data object
                        var menuItems = $scope.tableConfig.actionMenuConfig;
                        var i = 0, permissions;
                        data.$actionMenuState = [];
                        for(i = 0; i < menuItems.length; i++){
                            permissions = {hidden: false, enabled: true};
                            if(!angular.isUndefined($scope.tableConfig.actionMenuConfigFunction)) {
                                permissions = $scope.tableConfig.actionMenuConfigFunction(data, menuItems[i].name);
                            }
                            data.$actionMenuState[menuItems[i].name] = {};
                            data.$actionMenuState[menuItems[i].name].show = !permissions.hidden;
                            data.$actionMenuState[menuItems[i].name].disable = !permissions.enabled;
                        }

                        //if the table is expandable, add the expand/collapse menu items
                        if($scope.expandable){
                            if(angular.isUndefined(data.$expanded)){
                                data.$expanded = false;
                            }
                            data.$actionMenuState.expand = {show: !data.$expanded, disable: false};
                            data.$actionMenuState.collapse = {show: data.$expanded, disable: false};
                        }
                    };

                    $scope.filterHiddenColumns = function(item){
                        if(item.hidden){
                            return false;
                        }

                        return true;
                    };

                    /**
                     * the table will check for params "fieldField" and "filterValue" in the url
                     * and filter the table accordingly
                     * used when have url with filtering strings like
                     * &filterField0=alarmDefId&filterValue0=0170380b-b2dd-48d1-a786-a0d9fa310f07
                     */
                    $scope.checkForDrilldownFilter = function(){
                        var foundAFilter = true, index = 0;
                        var searchForField, searchForValue, searchForValueKey, filterField, filterValue, filterValueKey;
                        var hasDrillDown = false;
                        //drilldowns apply differently between enumerated and text filter
                        var supportsDrilldown = true;
                        if(angular.isDefined($scope.tableConfig.drillDownTableId)){
                            var drilldownId = $routeParams.drillDownTableId;
                            if(drilldownId !== $scope.tableConfig.drillDownTableId){
                                supportsDrilldown = false;
                            }
                        }

                        if ($scope.showEnumFilter && supportsDrilldown) {
                            while(foundAFilter) {
                                searchForField = 'filterField' + index;
                                searchForValue = 'filterValue' + index;
                                searchForValueKey = 'filterValueKey' + index;
                                filterValueKey = undefined;
                                if ($routeParams[searchForField] && $routeParams[searchForValue]) {
                                    filterField = $routeParams[searchForField];
                                    filterValue = $routeParams[searchForValue];
                                    hasDrillDown = true;

                                    if ($routeParams[searchForValueKey]) {
                                       filterValueKey = $routeParams[searchForValueKey];
                                    }

                                    if($routeParams.expandOnLoad){
                                        $scope.expandOnLoad = true;
                                    }

                                    //find the matching header
                                    if (!isUndefined($scope.tableConfig.headers) &&
                                        $scope.tableConfig.headers.length > 0) {
                                        var i = 0, filterHeader;
                                        for (i = 0; i < $scope.tableConfig.headers.length; i++) {
                                            if ($scope.tableConfig.headers[i].sortfield === filterField) {
                                                filterHeader = $scope.tableConfig.headers[i];
                                                break;
                                            }
                                        }

                                        if (!isUndefined(filterHeader)) {

                                            var displayValue = filterValue;
                                            if (!isUndefined(filterValueKey)) {
                                                displayValue = $translate.instant(filterValueKey);
                                            }
                                            $scope.enumFilters.push({displayname: filterHeader.name,
                                                sortfield: filterHeader.sortfield,
                                                displayvalue: displayValue,
                                                value: filterValue});
                                        }

                                    }
                                } else {
                                    foundAFilter = false;
                                }

                                index++;
                            }
                            //done with adding enum filter
                            //deal with server sorting, paging and filtering
                            if(hasDrillDown && $scope.isServerPaging &&
                                !isUndefined($scope.serverQueryParams)) {
                                $scope.enumFilters.forEach(function(filter) {
                                    var filterHead = filter.sortfield;
                                    var filterValue = filter.value;
                                    if(isUndefined($scope.serverQueryParams.filtering)) {
                                        $scope.serverQueryParams.filtering = {};
                                    }
                                    if (isUndefined($scope.serverQueryParams.filtering[filterHead])) {
                                        $scope.serverQueryParams.filtering[filterHead] = {};
                                        $scope.serverQueryParams.filtering[filterHead].octable = [];
                                    }
                                    $scope.serverQueryParams.filtering[filterHead].octable.push(filterValue);
                                });

                                //broadcast to parent so it can do server query
                                log('debug','doDrillDown = ' + JSON.stringify($scope.serverQueryParams));
                                $scope.$emit('doTableDataReload');
                            }

                        } else if (supportsDrilldown) { //don't find we use text filter...so ignore for server paging
                            while(foundAFilter) {
                                searchForValue = 'filterValue' + index;
                                if ($routeParams[searchForValue]) {
                                    filterValue = $routeParams[searchForValue];

                                    if (filterValue) {
                                        if(index === 0) {
                                            $scope.filterString = filterValue;
                                        } else {
                                            $scope.filterString = $scope.filterString + ' ' + filterValue;
                                        }
                                    }
                                } else {
                                    foundAFilter = false;
                                }

                                index++;
                            }
                        }
                    };

                    //check for a default filter in url
                    $scope.checkForDrilldownFilter();

                    // do not show sort if header is nosort
                    $scope.checkSortAllow = function(header){
                        if(header.nosort === true){
                            return false;
                        }

                        return true;
                    };

                    $scope.findDataIndexInFilteredModel = function(currentDetailsData){
                        var fdm = $scope.filteredDataModel();
                        var i = 0, index = -1;
                        for(i = 0; i < fdm.length; i++){
                            if(fdm[i] === currentDetailsData){
                                index = i;
                                break;
                            }
                        }

                        var detailIndexInfo = {
                            index: index,
                            total: fdm.length || 0
                        };

                        return detailIndexInfo;
                    };

                    $scope.$on('detailPrevItem', function($event, currentDetailsData){
                        var fdm = $scope.filteredDataModel();
                        var detailIndexInfo = $scope.findDataIndexInFilteredModel(currentDetailsData);
                        detailIndexInfo.index = detailIndexInfo.index - 1;
                        $scope.expandSelection(fdm[detailIndexInfo.index]);
                        $scope.$broadcast('detailsIndexInfo', detailIndexInfo);
                    });

                    $scope.$on('detailNextItem', function($event, currentDetailsData){
                        var fdm = $scope.filteredDataModel();
                        var detailIndexInfo = $scope.findDataIndexInFilteredModel(currentDetailsData);
                        detailIndexInfo.index = detailIndexInfo.index + 1;
                        $scope.expandSelection(fdm[detailIndexInfo.index]);
                        $scope.$broadcast('detailsIndexInfo', detailIndexInfo);
                    });
                }
            };
        }
    ]);
})();
