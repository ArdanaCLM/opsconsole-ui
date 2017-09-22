// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
/**
 * This is to handle the directive <alarm-summary></alarm-summary>
 * This directive needs to be used with alarm plugin
 */
(function(){
    'use strict';
    angular.module('operations-ui')
           .directive("alarmSummary", ['$translate', 'isUndefined',
                                       'addNotification', 'bllApiRequest', '$filter', 'dimObjToStr',
                                       'measObjToStrArray','renderLineOfDimension',
                                       'getStartUpdateTimeISODateString', 'getTimeToGoBackISODateStr',
                                       'ocTimeSelections', '$q', 'log', '$interval', '$window',
                                       'filterAlarmCount', '$routeParams', 'getKeyFromScope',
                                       'getDisplayDateAndUTC', 'loadAllMetrics', 'alarmDefinition.getNotificationsList',
                                       '$rootScope', 'prefSaver', 'updateEmptyDataPage', 'getHostAlarmData',
        function ($translate, isUndefined,
                  addNotification, bllApiRequest, $filter, dimObjToStr,
                  measObjToStrArray, renderLineOfDimension,
                  getStartUpdateTimeISODateString, getTimeToGoBackISODateStr,
                  ocTimeSelections, $q, log, $interval, $window,
                  filterAlarmCount, $routeParams, getKeyFromScope,
                  getDisplayDateAndUTC, loadAllMetrics, getNotificationsList,
                  $rootScope, prefSaver, updateEmptyDataPage, getHostAlarmData) {
            return {
                restrict: "E",
                transclude: true,
                scope: {
                    titlekey: "=",
                    services: "=",
                    hosts:"=",
                    extraQueryParams: "="
                },
                templateUrl: 'components/alarmsummary/alarm_summary.html',
                link: {
                //load this before the child element, for example octable
                pre: function preLink(scope, element, attr) {

                    scope.alarmTableDataLoadingFlag = false;
                    scope.alarmSummaryModalOverlayFlag = false;
                    scope.alarmSummaryMetricModalOverlayFlag = false;
                    scope.latestRefreshTime = '...'; //init
                    scope.displayLatestRefreshTime = {}; //init
                    scope.deltaRefreshTime = ocTimeSelections.ONE_MINUTE; //refresh new alarms interval
                    scope.ocTimeSelections = ocTimeSelections;
                    scope.timeOptions = [
                        {value: ocTimeSelections.ONE_MINUTE,      label: 'alarm.new.time.minute'},
                        {value: ocTimeSelections.FIVE_MINUTES,    label: 'alarm.new.time.5minute'},
                        {value: ocTimeSelections.FIFTEEN_MINUTES, label: 'alarm.new.time.15minute'},
                        {value: ocTimeSelections.THIRTY_MINUTES,  label: 'alarm.new.time.30minute'},
                        {value: ocTimeSelections.ONE_HOUR,        label: 'alarm.new.time.hour'},
                        {value: ocTimeSelections.TWO_HOURS,       label: 'alarm.new.time.2hour'},
                        {value: ocTimeSelections.FOUR_HOURS,      label: 'alarm.new.time.4hour'},
                        {value: ocTimeSelections.EIGHT_HOURS,     label: 'alarm.new.time.8hour'}
                    ];

                    //show empty data page when have server error
                    scope.showEmptyDataPageFlag = false;
                    scope.initAlarmTableDataLoadingFlag = true;
                    scope.emptyDataPage = {};

                    //
                    // Load from user prefs the deltaRefreshTime
                    //
                    scope.prefLoad = function () {
                        prefSaver.load().then(
                            function (data) {
                                scope.userPref = data;
                                if (typeof data.deltaRefreshTime === 'object' && data.deltaRefreshTime[window.location.hash] !== undefined) {
                                    scope.deltaRefreshTime = data.deltaRefreshTime[window.location.hash];
                                }
                            },
                            function (error) {
                                addNotification(
                                    "error",
                                    $translate.instant("common.user.preferences.error"));
                                log('error', 'Failed to get user preferences');
                                log('error', 'error data = ' + JSON.stringify(error));
                            }
                        );
                    };
                    scope.prefLoad();

                    function getServiceList() {
                        var deffered = $q.defer();

                        var req = {
                            "operation": "alarm_count",
                            "group_by": "dimension_name, dimension_value",
                            "dimension_name_filter": "service"
                        };
                        bllApiRequest.get('monitor', req).then(function (res) {
                            var services = res.data.counts.map(function (datum) {
                                return datum[2];
                            });
                            deffered.resolve(services);
                        }, deffered.reject);

                        return deffered.promise;
                    }

                    //setup the table filters based on the known service list
                    //the service message key should be existing the the alarms.json
                    var populateServiceFilterOptions = function (services) {
                        if (isUndefined(services)) {
                            return;
                        }

                        var tableServiceFilterOptions = services.map(function (serviceKey) {
                            return {
                                displayLabel: serviceKey,
                                value: serviceKey
                            };
                        });

                        //add hidden service column so we can filter on service in
                        //dimension
                        var hiddenServiceHeader;
                        if (!isUndefined(tableServiceFilterOptions) && tableServiceFilterOptions.length !== 0) {
                            hiddenServiceHeader = {
                                name: 'alarm_explorer.table.header.service',
                                type: 'string',
                                displayfield: 'service',
                                sortfield: 'service',
                                hidden: true,
                                nosort: true,
                                filterOptions: tableServiceFilterOptions
                            };
                        }
                        if (hiddenServiceHeader && scope.isAllServices ||
                            (hiddenServiceHeader && !scope.isAllServices && scope.alarmTableConfig)) {
                            scope.alarmTableConfig.headers.push(hiddenServiceHeader);
                        } else if (hiddenServiceHeader && !scope.isAllServices) {
                            scope.hiddenServiceHeader = hiddenServiceHeader;
                        }
                    };

                    scope.alarmTableData = [];
                    scope.newAlarmCountSummaryData = {};//for the heartbeat dashboard
                    scope.newAlarmSummaryDataLoadingFlag = false;
                    scope.showConfigureMenuFlag = false;//by default don't show the time selection

                    //check if it is alarm explorer
                    scope.isAllServices = false;
                    if (!isUndefined(element.attr('is-all-services'))) {
                        scope.isAllServices = true;
                    }

                    //check if we need to make the query hostBased
                    //from dashboard
                    scope.isHostBased = false;
                    if (!isUndefined(scope.hosts) && scope.hosts.length > 0) {
                        scope.isHostBased = true;
                        scope.hostnames = scope.hosts;
                    }
                    else {
                        scope.hostnames = [];
                    }

                    if (!isUndefined(scope.services) && scope.services.length > 0) {
                        scope.alarmServices = scope.services;
                    }
                    else {
                        scope.alarmServices = [];
                        if (scope.isHostBased) {
                            //keep the whole list so we can have the service filter
                            //options
                            //need to update
                            //when hostbased...services are not used
                            getServiceList().then(populateServiceFilterOptions);
                        }
                    }

                    //check if need new alarm section
                    scope.hasNewAlarm = false;
                    if (!isUndefined(element.attr('has-new-alarm'))) {
                        scope.hasNewAlarm = true;
                    }

                    if (!isUndefined(scope.alarmServices) && scope.alarmServices.length > 0) {
                        populateServiceFilterOptions(scope.alarmServices);
                    }
                    //dealing with the case when it is invoked from dashboard new
                    //alarms
                    else if (scope.isAllService ||
                        (isUndefined(scope.services) && isUndefined(scope.hosts)) ||
                        (scope.services.length === 0 && scope.hosts.length === 0)) {
                        getServiceList().then(populateServiceFilterOptions);
                    }

                    //structure to record what user clicks on the new alarm
                    scope.alarmFilters = {
                        'heart_beat_on': false,
                        'heart_beats': {
                            'warn': false, 'critical': false, 'unknown': false, 'open': false, 'total': false
                        }
                    };

                    var getServices = function () {
                        if (!scope.isAllServices) {
                            return scope.alarmServices;
                        }
                        //services for explorer only used for filtering option
                        //for query, it is empty
                        return [];
                    };

                    var getHosts = function () {
                        if (scope.isHostBased) {
                            return scope.hostnames;
                        }
                        return [];
                    };

                    //this is object used to communicate with octable regarding
                    //server paging, sorting and filtering
                    scope.serverQueryParams = {
                        'init': true,
                        'paging': {
                            'page': 1 //init
                        },
                        'sorting': {
                            'name': 'ui_status', //default
                            'direction': 'desc'
                        },
                        //don't want to cover everything
                        //only define possible used filters
                        'filtering': {
                            //section matches header which has filter options
                            'service': {
                                'base': getServices(),
                                'octable': []
                            },
                            //ui_status filtering is based on state and severity
                            'ui_status': {
                                'base': [],
                                'octable': []
                            },
                            'alarmDefId': {
                                'octable': []
                            },
                            'checkTime': {
                                'base': []
                            },
                            'hostname': {
                                base: getHosts()
                            },
                            'id': {
                                'octable': []
                            },
                            'dimension': {
                                'octable': []
                            }
                        }
                    };

                    //
                    //deal with modal dialog launched from dashboard
                    //
                    if (!isUndefined(scope.extraQueryParams)) {
                        scope.extQueryParams = scope.extraQueryParams;
                    }

                    scope.tableEnumFilter = undefined;

                    /**extraQueryParams could look like:
                     {
                        'filtering': {
                            'state': {
                                'base': ['critical']
                            },
                            'checkTime': {
                                'base':[]
                            }
                        }
                    };
                     **/
                    var processExtraQueryParams = function (readonlyState) {
                        //merge into scope.serverQueryParams, only deal with base
                        if (!isUndefined(scope.extQueryParams) &&
                            !isUndefined(scope.extQueryParams.filtering)) {
                            scope.hasExtraQueryParams = true;
                            for (var filterHeader in scope.serverQueryParams.filtering) {
                                //update serverQueryParams
                                if (scope.serverQueryParams.filtering.hasOwnProperty(filterHeader) &&
                                    scope.extQueryParams.filtering.hasOwnProperty(filterHeader)) {
                                    scope.serverQueryParams.filtering[filterHeader].base =
                                        scope.extQueryParams.filtering[filterHeader].base;
                                    if (filterHeader === 'ui_status') {
                                        if (scope.serverQueryParams.filtering[filterHeader].base.length > 0) {
                                            //create a state customEnumFilter for the modal table
                                            scope.tableStateEnumFilter = {
                                                "displayname": "alarm_explorer.table.header.state",
                                                "sortfield": filterHeader,
                                                "displayvalue": "alarm.filter.status." +
                                                scope.serverQueryParams.filtering[filterHeader].base[0].toLowerCase(),
                                                "value": scope.serverQueryParams.filtering[filterHeader].base[0],
                                                "readonly": readonlyState
                                            };
                                        }
                                        else {
                                            //empty the custom enumFilter
                                            scope.tableStateEnumFilter = {};
                                        }
                                    }
                                }
                            }//end for

                        }
                    };

                    //check if we have extraQueryParams
                    scope.hasExtraQueryParams = false; //used to avoid init double loading
                    processExtraQueryParams(true);

                    //
                    //deal with when page is drilled down from other page with
                    //url like
                    //#/alarm/alarm_explorer?tabname=explorer&filterField0=alarmDefId&filterValue0=01565bfa-6923-4c7d-b54f-f35e5d9a380a
                    scope.isDrilledDown = false;
                    var searchForField = 'filterField0';
                    var searchForValue = 'filterValue0';
                    if ($routeParams[searchForField] && $routeParams[searchForValue]) {
                        scope.isDrilledDown = true;
                    }

                    //
                    //deal with BLL query params
                    //
                    var removeDuplicates = function (array) {
                        var input = array;
                        if (isUndefined(array) || !Array.isArray(array)) {
                            return input;
                        }

                        var hashObject = {};

                        for (var i = input.length - 1; i >= 0; i--) {
                            var currentItem = input[i];
                            if (hashObject[currentItem] === true) {
                                input.splice(i, 1);
                            }
                            hashObject[currentItem] = true;
                        }
                        return input;
                    };

                    //called by new alarms
                    var getBaseServiceFilterRequestParams = function (req) {
                        if (!isUndefined(scope.serverQueryParams.filtering.service)) {
                            var serviceList = scope.serverQueryParams.filtering.service.base;
                            if (serviceList.length > 0) {
                                if (isUndefined(req.metric_dimensions)) {
                                    req.metric_dimensions = {};
                                }
                                req.metric_dimensions.service =
                                    serviceList.join('|');
                            }
                        }
                        return req;
                    };

                    var processDimensionFilters = function (
                        filterKey, inputList, hasEnumFilter, req, addDimension) {
                        var retList = angular.copy(inputList);
                        var tempMap = {};
                        if (!isUndefined(scope.serverQueryParams.filtering.dimension)) {
                            if (scope.serverQueryParams.filtering.dimension.octable.length > 0) {
                                var dimOcTable = scope.serverQueryParams.filtering.dimension.octable;
                                dimOcTable.forEach(function (datum) {
                                    var dt = datum.replace(/^\s+|\s+$/gm, '');
                                    var pair = dt.split('=');
                                    if (!isUndefined(pair) && pair.length === 2) {
                                        var key = pair[0].replace(/^\s+|\s+$/gm, '');
                                        var value = pair[1].replace(/^\s+|\s+$/gm, '');
                                        if (!( key in tempMap)) {
                                            tempMap[key] = [];
                                        }
                                        tempMap[key].push(value);
                                    }
                                });

                                //don't have enum filter and have dimension service
                                if ((filterKey in tempMap) && hasEnumFilter === false) {
                                    //use the service dimension filter instead of base service filter
                                    retList = [];
                                }

                                for (var key in tempMap) {
                                    if (tempMap.hasOwnProperty(key)) {
                                        var valueArray = tempMap[key];
                                        valueArray = removeDuplicates(valueArray);

                                        //delegate to later to combine services fitlers
                                        if (key === filterKey) {
                                            for (var idx in  valueArray) {
                                                var value = valueArray[idx];
                                                var validName = true;
                                                if (filterKey === 'service') {
                                                    if (scope.serverQueryParams.filtering.service.base.length > 0) {
                                                        //service doesn't seem to be in the base list
                                                        if (scope.serverQueryParams.filtering.service.base.indexOf(value) === -1) {
                                                            validName = false;
                                                        }
                                                    }
                                                }
                                                if (filterKey === 'hostname') {
                                                    if (scope.serverQueryParams.filtering.hostname.base.length > 0) {
                                                        //service doesn't seem to be in the base list
                                                        if (scope.serverQueryParams.filtering.hostname.base.indexOf(value) === -1) {
                                                            validName = false;
                                                        }
                                                    }
                                                }
                                                //add into service filters if it is not in the filter
                                                //make sure value is a valid service name
                                                if (retList.indexOf(value) === -1 && validName) {
                                                    retList.push(value);
                                                }
                                            }
                                        }
                                        else { //other dimensions
                                            if (addDimension) { //only add when request to
                                                if (isUndefined(req.metric_dimensions)) {
                                                    req.metric_dimensions = {};
                                                }
                                                req.metric_dimensions[key] = valueArray.join('|');
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if (retList.length === 0) {
                            if (filterKey === 'service' && (filterKey in tempMap) && hasEnumFilter === false) {
                                //restore the base service filter if don't have any valid ones
                                retList = angular.copy(scope.serverQueryParams.filtering.service.base);
                            }
                        }

                        return retList;
                    };

                    var getServiceDimensionFiltersRequestParams = function (req) {
                        var serviceList = [];
                        var hasServiceEnumFilter = false;
                        if (!isUndefined(scope.serverQueryParams.filtering.service)) {
                            if (scope.serverQueryParams.filtering.service.octable.length > 0) {
                                serviceList =
                                    angular.copy(scope.serverQueryParams.filtering.service.octable);
                                hasServiceEnumFilter = true;
                            }
                            else {
                                serviceList =
                                    angular.copy(scope.serverQueryParams.filtering.service.base);
                            }
                            serviceList = removeDuplicates(serviceList);
                        }

                        serviceList =
                            processDimensionFilters('service', serviceList, hasServiceEnumFilter, req, true);

                        //add service
                        if (serviceList.length > 0) {
                            if (isUndefined(req.metric_dimensions)) {
                                req.metric_dimensions = {};
                            }
                            req.metric_dimensions.service =
                                serviceList.join('|');
                        }
                        return req;
                    };

                    //mainly dealing with popup modal from dashboard
                    var getHostnameServiceDimensionFiltersRequestParams = function (req) {
                        //process hostname first
                        var hostList = [];
                        if (!isUndefined(scope.serverQueryParams.filtering.hostname)) {
                            hostList =
                                scope.serverQueryParams.filtering.hostname.base;

                            hostList =
                                processDimensionFilters('hostname', hostList, false, req, true);
                        }

                        if (hostList.length > 0) {
                            if (isUndefined(req.metric_dimensions)) {
                                req.metric_dimensions = {};
                            }
                            req.metric_dimensions.hostname =
                                hostList.join('|');
                        }

                        //if hostname based
                        //check if have user selected filtering service
                        var serviceList = [];

                        if (!isUndefined(scope.serverQueryParams.filtering.service)) {
                            serviceList =
                                scope.serverQueryParams.filtering.service.octable;
                            serviceList = removeDuplicates(serviceList);

                            serviceList =
                                processDimensionFilters('service', serviceList, true, req, false);
                        }

                        if (serviceList.length > 0) {
                            if (isUndefined(req.metric_dimensions)) {
                                req.metric_dimensions = {};
                            }
                            req.metric_dimensions.service =
                                serviceList.join('|');
                        }
                        return req;
                    };

                    var getStateFiltersRequestParams = function (req) {
                        if (!isUndefined(scope.serverQueryParams.filtering.ui_status)) {
                            var statusList =
                                scope.serverQueryParams.filtering.ui_status.octable.length > 0 ?
                                    scope.serverQueryParams.filtering.ui_status.octable :
                                    scope.serverQueryParams.filtering.ui_status.base;

                            if (statusList.length > 0) {
                                statusList = removeDuplicates(statusList);
                                var stateList = [];
                                var severityList = [];
                                statusList.forEach(function(datum) {
                                    switch (datum) {
                                        case 'CRITICAL':
                                            stateList.push('ALARM');
                                            severityList.push('HIGH');
                                            severityList.push('CRITICAL');
                                            break;
                                        case 'WARN':
                                            stateList.push('ALARM');
                                            severityList.push('MEDIUM');
                                            severityList.push('LOW');
                                            break;
                                        case 'UNKNOWN':
                                            stateList.push('UNDETERMINED');
                                            break;
                                        default:
                                            stateList.push('OK');
                                    }
                                });
                                req.state = stateList.join('|');
                                if (severityList.length > 0) {
                                    req.severity = severityList.join('|');
                                }
                            }
                        }
                        return req;
                    };

                    var getCheckTimeFiltersRequestParams = function (req) {
                        if (!isUndefined(scope.serverQueryParams.filtering.checkTime)) {
                            var checkTimeList =
                                scope.serverQueryParams.filtering.checkTime.base;

                            if (checkTimeList.length > 0) {
                                req.state_updated_start_time = checkTimeList.join('|');
                            }
                        }
                        return req;
                    };

                    var getAlarmDefIdFiltersRequestParams = function (req) {
                        if (!isUndefined(scope.serverQueryParams.filtering.alarmDefId)) {
                            var alarmDefIdList =
                                scope.serverQueryParams.filtering.alarmDefId.octable;

                            if (alarmDefIdList.length > 0) {
                                req.alarm_definition_id = alarmDefIdList.join('|');
                            }
                        }
                        return req;
                    };

                    var getSortRequestParams = function (req) {
                        //'ui_state': ['state', 'severity'],
                        //'lastCheck': 'state_updated_timestamp'
                        //'name': 'alarm_definition_name
                        //'id': 'id'
                        if (!isUndefined(scope.serverQueryParams.sorting)) {
                            var colName = scope.serverQueryParams.sorting.name;
                            var direction = scope.serverQueryParams.sorting.direction;
                            var sort = '';
                            if (colName === 'ui_status') {
                                sort =
                                    'state ' + direction + ', severity ' + direction;
                            }
                            else if (colName === "lastCheck") {
                                sort = 'state_updated_timestamp ' + direction;
                            }
                            else if (colName === 'id') {
                                sort = 'alarm_id ' + direction;
                            }
                            else if (colName === 'name') {
                                sort = 'alarm_definition_name ' + direction;
                            }
                            else {
                                sort = colName + ' ' + direction;
                            }
                            req.sort_by = sort;
                        }
                        return req;
                    };

                    /**
                     * get total number of the alarm table data based on filtering
                     * params
                     */
                    var callBLLForAlarmTotalData = function () {
                        var req_alarms = {
                            'operation': 'alarm_count'
                        };

                        if (!scope.isHostBased) {
                            req_alarms = getServiceDimensionFiltersRequestParams(req_alarms);
                        }
                        else {
                            req_alarms = getHostnameServiceDimensionFiltersRequestParams(req_alarms);
                        }
                        req_alarms = getStateFiltersRequestParams(req_alarms);
                        req_alarms = getAlarmDefIdFiltersRequestParams(req_alarms);
                        req_alarms = getCheckTimeFiltersRequestParams(req_alarms);

                        log('debug', 'alarm total request = ' + JSON.stringify(req_alarms));
                        return bllApiRequest.get('monitor', req_alarms).then(
                            function (response) {
                                var data = response.data || [];
                                if (!isUndefined(data) && !(isUndefined(data.counts))) {
                                    scope.alarmTableDataTotal = data.counts[0][0];
                                    log('info',
                                        'Successfully finished getting the alarm total data = ' +
                                        scope.alarmTableDataTotal);
                                }
                                else {
                                    addNotification(
                                        "error",
                                        $translate.instant("alarm.summary.table.data.total.error"));
                                    log('error', 'Empty alarm total data');
                                }

                            }, function (error_data) {
                                addNotification(
                                    "error",
                                    $translate.instant("alarm.summary.table.data.total.error"));
                                log('error', 'Failed to get alarms total data');
                                log('error', 'error data = ' + JSON.stringify(error_data));
                            }
                        );
                    };

                    var getOneAlarmData = function (datum) {
                        var dime1 = dimObjToStr(datum.metrics[0].dimensions);

                        //if we have more dimensions, add an indication
                        if (datum.metrics.length > 1) {
                            dime1 =
                                dime1 + ',\n' + $translate.instant('alarm.summary.detail.more.dimension');
                        }

                        var metricName = datum.metrics[0].name;
                        var serviceName = datum.metrics[0].dimensions.service;
                        var hist, modifiedState, dimeDetails, defDesc;

                        if (datum.state === "ALARM" && datum.alarm_definition.severity === "HIGH") {
                            modifiedState = "CRITICAL";
                        } else if (datum.state === "ALARM" && datum.alarm_definition.severity === "CRITICAL") {
                            modifiedState = "CRITICAL";
                        } else if (datum.state === "ALARM" && datum.alarm_definition.severity === "MEDIUM") {
                            modifiedState = "WARN";
                        } else if (datum.state === "ALARM" && datum.alarm_definition.severity === "LOW") {
                            modifiedState = "WARN";
                        } else if (datum.state === "UNDETERMINED") {
                            modifiedState = "UNKNOWN";
                        } else {
                            modifiedState = datum.state;
                        }
                        var obj = {
                            'ui_status': modifiedState,
                            'state': datum.state,
                            'name': datum.alarm_definition.name,
                            'description': defDesc,
                            'lastCheck': datum.state_updated_timestamp,
                            'condition': datum.lifecycle_state,
                            'severity': datum.alarm_definition.severity,
                            'statusInfo': datum.link,
                            'dimension': dime1, //allways show the first dimension
                            'history': hist,
                            'id': datum.id,
                            'metricName': metricName,
                            'service': getServiceName(serviceName), //hidden
                            'alarmDefId': datum.alarm_definition.id, //hidden
                            'metrics': datum.metrics //hidden used for details
                        };

                        return obj;
                    };

                    /**
                     * get one page table data base on filter, sorting, paging params
                     */
                    var callBLLForAlarmData = function () {
                        scope.emptyDataPage = {};
                        scope.alarmTableData = [];
                        var req_alarms = {
                            'operation': 'alarm_list',
                            'limit': scope.alarmTableConfig.pageConfig.pageSize
                        };
                        //get paging request params
                        var offset = 0;
                        if (!isUndefined(scope.serverQueryParams.paging)) {
                            offset =
                                (scope.serverQueryParams.paging.page - 1) * scope.alarmTableConfig.pageConfig.pageSize;
                            scope.alarmTableConfig.pageConfig.page =
                                scope.serverQueryParams.paging.page;
                        }
                        req_alarms.offset = offset;

                        //get sort request params
                        req_alarms = getSortRequestParams(req_alarms);

                        //get filter request params
                        if (!scope.isHostBased) {
                            req_alarms = getServiceDimensionFiltersRequestParams(req_alarms);
                        }
                        else {
                            req_alarms = getHostnameServiceDimensionFiltersRequestParams(req_alarms);
                        }
                        req_alarms = getStateFiltersRequestParams(req_alarms);
                        req_alarms = getAlarmDefIdFiltersRequestParams(req_alarms);
                        req_alarms = getCheckTimeFiltersRequestParams(req_alarms);

                        log('debug', 'alarm request = ' + JSON.stringify(req_alarms));
                        return bllApiRequest.get('monitor', req_alarms).then(
                            function (response) {
                                var alarmsExp = response.data || [];

                                alarmsExp.forEach(function (datum) {
                                    var obj = getOneAlarmData(datum);
                                    scope.alarmTableData.push(obj);
                                });

                                var len = scope.alarmTableData.length;
                                log('info', 'Successfully finished getting the alarm data for current page = ' + len);
                                log('debug', 'Successfully finished getting the alarm data for current page raw data length = ' + alarmsExp.length);

                                //only show the page loading mask at the very first beginning
                                if (scope.initAlarmTableDataLoadingFlag === true) {
                                    scope.initAlarmTableDataLoadingFlag = false;
                                }

                            }, function (error_data) {
                                var errorReason =
                                    error_data.data ? error_data.data[0].data : '';
                                var errorMsg =
                                    $translate.instant("alarm.summary.table.data.error",
                                        {'reason': errorReason}
                                    );
                                addNotification("error", errorMsg);
                                log('error', 'Failed to get alarm data');
                                log('error', 'error data = ' + JSON.stringify(error_data));

                                //show empty data page for error
                                scope.showEmptyDataPageFlag = true;
                                updateEmptyDataPage(
                                    scope.emptyDataPage,
                                    'servererror',
                                    errorMsg,
                                    'common.empty.data.checkbackend',
                                    'common.reload.table',
                                    scope.getAllAlarmData
                                );
                                //only show the page loading mask at the very first beginning
                                if (scope.initAlarmTableDataLoadingFlag === true) {
                                    scope.initAlarmTableDataLoadingFlag = false;
                                }
                            }
                        );
                    };

                    /**
                     * get alarm based on id, when this called, it has a alarm id
                     */
                    var callBLLForAlarmIdData = function () {
                        var alarmId = scope.serverQueryParams.filtering.id.octable[0];
                        var req_alarms = {
                            'operation': 'alarm_show',
                            'alarm_id': alarmId
                        };

                        log('debug', 'alarm with id request = ' + JSON.stringify(req_alarms));
                        return bllApiRequest.get('monitor', req_alarms).then(
                            function (response) {
                                var datum = response.data;
                                var obj = getOneAlarmData(datum);
                                scope.alarmTableData.push(obj);

                                //should have just 1 item so force it to be page 1
                                //total 1 so it can do page
                                scope.alarmTableDataTotal = 1;
                                scope.alarmTableConfig.pageConfig.page = 1;

                                log('debug', 'Successfully finished getting the alarm data for id ' + alarmId);

                            }, function (error_data) {
                                addNotification(
                                    "error",
                                    $translate.instant("alarm.summary.table.id.data.error", {'alarm_id': alarmId}));
                                log('error', 'Failed to get alarm data for id = ' + alarmId);
                                log('error', 'error data = ' + JSON.stringify(error_data));
                            }
                        );
                    };

                    /**
                     * get count summary of new alarm data based on base service
                     * filtering and cutOffTime
                     */
                    var callBLLForNewAlarmSummaryData = function (cutOffTime) {
                        var req_alarms = {
                            'operation': 'alarm_count',
                            'group_by': 'state, severity'
                        };

                        if (!isUndefined(cutOffTime)) {
                            req_alarms.state_updated_start_time = cutOffTime;
                        }
                        req_alarms = getBaseServiceFilterRequestParams(req_alarms);

                        log('debug', 'alarm count summary request = ' + JSON.stringify(req_alarms));
                        return bllApiRequest.get('monitor', req_alarms).then(
                            function (response) {
                                var data = response.data || [];
                                scope.newAlarmCountSummaryData = filterAlarmCount(data);
                                var newAlarmCounts = filterAlarmCount(data);
                                if (!isUndefined(data) && !(isUndefined(data.counts))) {
                                    log('info',
                                        'Successfully finished getting the new alarm count summary data = ' +
                                        JSON.stringify(newAlarmCounts));
                                }
                                else {
                                    addNotification(
                                        "error",
                                        $translate.instant("alarm.summary.table.data.new.count.error"));
                                    log('error', 'Empty new alarm count summary data');
                                }
                                scope.latestRefreshTime = new Date();
                                scope.displayLatestRefreshTime = getDisplayDateAndUTC();

                            }, function (error_data) {
                                addNotification(
                                    "error",
                                    $translate.instant("alarm.summary.table.data.new.count.error"));
                                log('error', 'Failed to get new alarms count summary data');
                                log('error', 'error data = ' + JSON.stringify(error_data));
                            }
                        );
                    };

                    scope.getAlarmTableData = function () {
                        scope.alarmTableDataLoadingFlag = true;
                        scope.alarmTableData = [];
                        scope.alarmTableDataTotal = 0;

                        var defer = $q.defer();
                        var promises = [];

                        //have alarm id as filter so ignore rest of the other filters
                        //can the call alarm-show which doesn't do server paging
                        if (scope.serverQueryParams.filtering.id.octable.length > 0) {
                            promises.push(callBLLForAlarmIdData());
                        }
                        else {
                            promises.push(callBLLForAlarmData());
                            promises.push(callBLLForAlarmTotalData());
                        }
                        $q.all(promises).then(defer.resolve, defer.reject);

                        return defer.promise;
                    };

                    /**
                     * get alarm paged table data
                     * get alarm total count
                     * get new alarm summary count
                     */
                    scope.getAllAlarmData = function () {
                        //when user clicks time selection, refresh table data
                        //in getLatestAlarms cancel the pulling for new alarm
                        //reschedule once the table is done

                        //populate table data and schedule to load new  alarm counts
                        scope.getAlarmTableData().then(function () {
                            scope.alarmTableDataLoadingFlag = false;
                            //data loading is done
                            //broadcast to the children
                            var pageObject = {
                                'total': scope.alarmTableDataTotal
                            };
                            //initially set the state sort as default
                            if (!isUndefined(scope.serverQueryParams) &&
                                scope.serverQueryParams.init) {
                                //set init sorting ui_status, col 2
                                pageObject.sortcol = scope.alarmTableConfig.headers[1];
                                scope.serverQueryParams.init = false;
                            }
                            scope.$broadcast('tableDataLoaded', pageObject);
                        });
                    };

                    /**
                     * this only gets call when hasNewAlarm
                     */
                    scope.getNewAlarmSummaryData = function (reloadTable) {
                        var cutOffDateStr =
                            getTimeToGoBackISODateStr(scope.deltaRefreshTime);

                        scope.newAlarmSummaryDataLoadingFlag = true;
                        scope.savedNewAlarmCountSummaryData = scope.newAlarmCountSummaryData;
                        scope.newAlarmCountSummaryData = {};
                        callBLLForNewAlarmSummaryData(cutOffDateStr).then(function () {
                            scope.newAlarmSummaryDataLoadingFlag = false;
                            if (reloadTable !== true) {
                                //check if we have data change reload table
                                var keys = Object.keys(scope.savedNewAlarmCountSummaryData);
                                for (var idx in keys) {
                                    if (scope.savedNewAlarmCountSummaryData[keys[idx]] !== scope.newAlarmCountSummaryData[keys[idx]]) {
                                        reloadTable = true;
                                        break;
                                    }
                                }
                            }
                            //reload table when change time
                            if (reloadTable === true) {
                                //change time
                                if (scope.alarmFilters.heart_beat_on) {
                                    var checkTime =
                                        getStartUpdateTimeISODateString(scope.latestRefreshTime, scope.deltaRefreshTime);
                                    scope.serverQueryParams.filtering.checkTime.base = [checkTime];
                                }
                                scope.getAlarmTableData().then(function () {
                                    scope.alarmTableDataLoadingFlag = false;
                                    //data loading is done
                                    //broadcast to the children
                                    var pageObject = {
                                        'total': scope.alarmTableDataTotal
                                    };
                                    scope.$broadcast('tableDataLoaded', pageObject);
                                });
                            }
                        });
                    };

                    //this is called when user change last time in drop down
                    //reload table data
                    //only gets call when it is not isAllServices
                    scope.getLatestAlarms = function () {
                        if (scope.newAlarmIntervalId) {
                            $interval.cancel(scope.newAlarmIntervalId);
                        }

                        //call it now
                        scope.newAlarmCountSummaryData = {};
                        //{"total":0,"ok":0,"warning":0,"critical":0,"unknown":0}
                        scope.getNewAlarmSummaryData(true);//reload table when time change

                        //schedule refresh new alarm every minute
                        scope.newAlarmIntervalId =
                            $interval(scope.getNewAlarmSummaryData,
                                scope.ocTimeSelections.ONE_MINUTE);
                    };

                    scope.onExpandAction = function (data) {
                        showDetailsModal(data);
                    };

                    //
                    //definition for the alarm table
                    //
                    scope.alarmTableConfig = {
                        headers: [{
                            name: $translate.instant("alarm_explorer.table.header.alarmName"),
                            type: "string",
                            displayfield: "name",
                            sortfield: 'name',
                            highlightExpand: true,
                            isNotHtmlSafe: true
                        }, {
                            name: $translate.instant("alarm_explorer.table.header.state"),
                            type: "status",
                            displayfield: "ui_status",
                            sortfield: 'ui_status',
                            filter: 'tableStatusFilter',
                            singleton: true, //make the filter on this show up once
                            filterOptions: [{
                                displayLabel: $translate.instant('alarm.filter.status.unknown'),
                                value: 'UNKNOWN'
                            },{
                                displayLabel: $translate.instant('alarm.filter.status.ok'),
                                value: 'OK'
                            },{
                                displayLabel: $translate.instant('alarm.filter.status.warn'),
                                value: 'WARN'
                            },{
                                displayLabel: $translate.instant('alarm.filter.status.critical'),
                                value: 'CRITICAL'
                            }]
                        }, {
                            name: $translate.instant("alarm_explorer.table.header.alarmId"),
                            type: "string",
                            displayfield: "id",
                            sortfield: 'id'
                        }, {
                            name: $translate.instant("alarm_explorer.table.header.lastCheck"),
                            type: "string",
                            displayfield: "lastCheck",
                            sortfield: 'lastCheck'
                        }, {
                            name: 'alarm_explorer.table.header.alarm_def_id',
                            type: 'string',
                            displayfield: 'alarmDefId',
                            sortfield: 'alarmDefId',
                            hidden: true,
                            nosort: true
                        }, {
                            name: $translate.instant("alarm_explorer.table.header.dimension"),
                            type: "string",
                            displayfield: "dimension",
                            sortfield: 'dimension',
                            specialColumnType: 'custom',
                            customDisplayFilter: renderLineOfDimension,
                            nosort: true
                        }],

                        pageConfig: {
                            pageSize: 20,
                            isServerPaging: true
                        },

                        expandAction: scope.onExpandAction,
                        actionMenuConfig: [{
                            label: 'alarm_explorer.viewdetails',
                            name: 'viewAlarmExplrDtls',
                            action: function (data) {
                                showDetailsModal(data);
                            }
                        }, {
                            label: 'alarm_explorer.view_alarm_def',
                            name: 'viewAlarmDef',
                            action: function (data) {
                                scope.viewAlarmDefinition(data);
                            }
                        }, {
                            label: 'common.delete',
                            name: 'deleteAlarm',
                            action: function (data) {
                                showDeleteModal(data);
                            }
                        }],
                        multiSelectActionMenuConfig: [{
                            label: 'alarm_explorer.action.multi_delete',
                            name: 'showDeleteModalForMultiSelect',
                            action: function (data) {
                                showDeleteModal(data);
                            }
                        }],
                        globalActionsConfig: [{
                            label: 'alarm_definitions.action.create',
                            name: 'create',
                            action: function () {
                                scope.modalEditing = false;
                                scope.showDefinitionCreate();
                            },
                            disable: scope.disableCreate
                        }],
                        globalActionsConfigFunction: function (data, name) {
                            if (name === 'create' && scope.disableCreate) {
                                return true;
                            } else {
                                return false;
                            }
                        },
                        //don't show the any column since server doesn't support it
                        hasNoAnyColumnFilter: true,
                        //show alarm id filter when it is alarm explorer
                        hasAlarmIdFilter: scope.isAllServices ? true : false,
                        //show dimension filter
                        hasDimensionFilter: true
                    };

                    scope.disableCreate = true;

                    $q.all([loadAllMetrics(), getNotificationsList()]).then(
                        function (res) {
                            scope.disableCreate = false;
                            scope.metricList = res[0];
                            scope.notificationList = res[1];
                        }
                    );

                    $rootScope.$on('notificationListNeedsRefresh', function () {
                        scope.disableCreate = true;
                        getNotificationsList().then(function (notification) {
                            scope.notificationList = notification;
                            scope.disableCreate = false;
                        });
                    });

                    //if we created this filter earlier add it to the config now.
                    if (scope.hiddenServiceHeader) {
                        scope.alarmTableConfig.headers.push(scope.hiddenServiceHeader);
                    }

                    var getServiceName = function (service) {
                        if (isUndefined(service) || service === 'undetermined') {
                            return 'undefined';
                        }
                        return service;
                    };

                    //
                    //deal with alarm details
                    //
                    var getAlarmHistoryData = function (id) {
                        var req_alarms_history = {
                            'operation': 'alarm_history',
                            'id': id
                        };

                        return bllApiRequest.get('monitor', req_alarms_history).then(
                            function (response) {
                                var histOfAlarms = response.data || [];

                                histOfAlarms.forEach(function (histdat) {
                                    if (histdat.alarm_id === id) {
                                        var histDime = histdat.metrics[0] ? dimObjToStr(histdat.metrics[0].dimensions) : '';
                                        var histObj = {
                                            'date': histdat.timestamp,
                                            'was': histdat.old_state,
                                            'now': histdat.new_state,
                                            'hId': histdat.alarm_id,
                                            'reason': histdat.reason,
                                            'dimension': histDime
                                        };
                                        scope.explorerData.summary.history.push(histObj);
                                    }
                                });
                                log('debug', 'Successfully finished getting the alarm history for ' + id);
                            },
                            function (error_data) {
                                addNotification(
                                    "error",
                                    $translate.instant("alarm_explorer.history_table.data.error"));
                                log('error', 'Failed to get the alarm history for alarm ' + id);
                                log('error', 'error data = ' + JSON.stringify(error_data));
                            }
                        );
                    };

                    var getDefinitionData = function (id) {
                        var req_metrics = {
                            'operation': 'alarm_definition_show',
                            'id': id
                        };

                        return bllApiRequest.get('monitor', req_metrics).then(
                            function (response) {
                                var alarmMetrics = response.data || '';
                                scope.explorerData.summary.description.push(response.data.description);
                            },
                            function (error_data) {
                                addNotification(
                                    "error",
                                    $translate.instant("alarm_explorer.definition.data.error"));
                            }
                        );
                    };

                    //deal with metric details
                    scope.metricValueMetaTableConfig = {
                        headers: [{
                            name: $translate.instant("alarm.summary.metavalue.table.header.timestamp"),
                            type: "string",
                            displayfield: "timestamp",
                            sortfield: 'timestamp'
                        }, {
                            name: $translate.instant("alarm.summary.metavalue.table.header.value"),
                            type: "string",
                            displayfield: "value",
                            sortfield: 'value'
                        }, {
                            name: $translate.instant("alarm.summary.detail.valuemeta"),
                            type: "string",
                            displayfield: "valueMeta",
                            sortfield: 'valueMeta',
                            nosort: true
                        }],
                        initSortDir: 'desc', //sort on timestamp on default
                        pageConfig: {
                            pageSize: 3
                        }
                    };

                    var getDisplayValueMetas = function(measurements) {
                        var displayMeas = measurements.map(function(datum) {
                            var retDatum = {
                                'timestamp': datum[0],
                                'value': datum[1],
                                'valueMeta': dimObjToStr(datum[2], ':')
                            };
                            return retDatum;
                        });

                        return displayMeas;
                    };

                    var processMetricsDetails = function (measurements, metric_name, dimensions) {
                        if (!angular.isDefined(measurements) ||
                            measurements.length === 0) {
                            return;
                        }
                        var savedMeas = [];
                        for(var i = measurements.length -1; i >= 0 ; i--) {
                            //measurement is like
                            //"["2016-10-14T17:51:02.000Z",2,{"msg":"cache_status status is Temporarily Disabled"}]"
                            var meas = measurements[i];
                            //if have some value meta
                            if(angular.isDefined(meas[2]) &&
                                Object.keys(meas[2]).length > 0) {

                                var thisMeta = dimObjToStr(meas[2]);
                                var duplicate = false;
                                for(var idx in savedMeas) {
                                    var savedMeta =
                                    dimObjToStr(savedMeas[idx][2]);

                                    if(thisMeta === savedMeta) {
                                        duplicate = true;
                                    }
                                }
                                if (!duplicate) {
                                    savedMeas.push(meas);
                                }
                            }
                        }//end of for

                        if(savedMeas.length > 0) {
                            for(var index in scope.metricDetailsData) {
                                var metric = scope.metricDetailsData[index];
                                if(metric.dimensions === dimensions && metric.name === metric_name) {
                                    metric.details = getDisplayValueMetas(savedMeas);
                                    break;
                                }
                            }
                        }
                    };

                    var callBLLForMeasurementDataForDetail = function(
                        metric_name, dimensions, req) {
                        log('debug', 'query metric detail request = ' + JSON.stringify(req));
                        return bllApiRequest.get('monitor',req).then(
                            function(response) {
                                var alarmMetrics = response.data || [];
                                alarmMetrics.forEach(function (metric) {
                                    processMetricsDetails(metric.measurements, metric_name, dimensions);
                                });
                                log('debug', 'Successfully finished getting the alarm metrics for ' + metric_name);
                            },
                            function(error_data) {
                                addNotification(
                                    "error",
                                    $translate.instant("alarm_explorer.history_table.metrics.data.error"));
                                log('error', 'Failed to get the alarm metrics for ' + metric_name);
                                log('error', 'error data = ' + JSON.stringify(error_data));
                            }
                        );
                    };

                    var getMetricDetailsData= function(data, no_dimensions) {
                        var defer = $q.defer();
                        var promises = [];

                        //query the measurement that goes back 1 hour
                        var oldDateISOString =
                            getStartUpdateTimeISODateString(new Date(), 60 * 60 * 1000);

                        var req_metrics = {
                            'operation': 'measurement_list',
                            'name': data.metricName,
                            'start_time': oldDateISOString,
                            'merge_metrics': true
                        };

                        //query without dimensions
                        if(angular.isDefined(no_dimensions) && no_dimensions === true) {
                            data.metrics.forEach(function (metric) {
                                var dimensions = metric.dimensions;
                                var dimStr = dimObjToStr(dimensions);
                                if (angular.isDefined(dimensions)) {
                                    scope.metricDetailsData.push({
                                        'dimensions': dimStr,
                                        'name': metric.name,
                                        'details': []
                                    });
                                    var this_req1 = angular.copy(req_metrics);
                                    this_req1.name = metric.name;
                                    promises.push(
                                        callBLLForMeasurementDataForDetail(
                                            metric.name, dimStr, this_req1));
                                }
                            });
                        }
                        else { //need query with dimensions
                            data.metrics.forEach(function (metric) {
                                var dimensions = metric.dimensions;
                                var dimStr = dimObjToStr(dimensions);
                                if (angular.isDefined(dimensions)) {
                                    scope.metricDetailsData.push({
                                        'dimensions': dimStr,
                                        'name': metric.name,
                                        'details': []
                                    });
                                    var this_req = angular.copy(req_metrics);
                                    this_req.name = metric.name;

                                    this_req.dimensions = {};
                                    angular.forEach(dimensions, function (value, key) {
                                        this_req.dimensions[key] = value;
                                    });
                                    promises.push(callBLLForMeasurementDataForDetail(
                                        metric.name, dimStr, this_req));
                                }
                            });
                        }

                        $q.all(promises).then(defer.resolve, defer.reject);

                        return defer.promise;
                    };

                    var addMetricTabbedPages = function() {
                        scope.metricDetailsData.forEach(function (metric, index) {
                            var page = {
                                header: $translate.instant('alarm_explorer.table.header.dimension') + ' ' + (index + 1),
                                template: 'components/alarmsummary/alarm_multiple_metrics.html',
                                tabname: 'metricdimension_' + (index + 1)
                            };
                            scope.valueMetaTabbedPages.push(page);
                        });
                    };

                    var hasValueMetaData = function() {
                        var retValue = false;
                        scope.metricDetailsData.forEach(function(metric) {
                            var metas = metric.details;
                            if (angular.isDefined(metas) && metas.length > 0) {
                                retValue = true;
                            }
                        });

                        return retValue;
                    };

                    //TODO deal with multiple metrics dimensions
                    var getHostName = function(data) {
                        var host;

                        if (isUndefined(data) || isUndefined(data.dimension)) {
                            return host;
                        }

                        var dimension = data.dimension;
                        var dimStr = dimension.replace(/(\r\n|\n|\r)/gm,"");
                        var dArray = dimStr.split(",");
                        //we should only get one host
                        for (var idx in dArray) {
                            if(dArray[idx].indexOf('hostname=') === 0) {
                                var hArray = dArray[idx].split('=');
                                host = hArray[1];
                                break;
                            }
                        }
                        return host;
                    };

                    var getHostAlarmsStateData = function(host) {
                        var defer = $q.defer();
                        if (isUndefined(host)){
                             defer.resolve();
                        }

                        //TODO where to get the host type?
                        getHostAlarmData(host).then (function(alarmCountData) {
                            scope.explorerData.summary.hostAlarmsState.data = alarmCountData;
                            scope.explorerData.summary.hostAlarmsState.title =
                                $translate.instant(
                                    'alarm.summary.details.host_alarms.state',
                                    {'host': host, 'count': alarmCountData.count}
                                );
                            defer.resolve();
                        });

                        return defer;
                    };

                    scope.cancelDetailsModal = function() {
                        scope.showAlarmDetailsModalFlag = false;
                        scope.selectedTableRowData = undefined;
                        scope.explorerData = {};
                    };

                    var getAlarmDetailsData = function(data) {
                        var defer = $q.defer();
                        var promises = [];
                        var host = getHostName(data);
                        var hostTitle =
                            !isUndefined(host) ? $translate.instant('alarm.summary.details.host.details.title', {'host' : host}) :
                                                 $translate.instant('alarm.summary.details.host.details.title.nohost');
                        scope.explorerData.summary.hostDetails.host = hostTitle;
                        scope.explorerData.summary.hostDetails.hostname = host;

                        promises.push(getAlarmHistoryData(data.id));
                        promises.push(getDefinitionData(data.alarmDefId));
                        promises.push(getHostAlarmsStateData(host));
                        $q.all(promises).then(defer.resolve, defer.reject);

                        return defer.promise;
                    };

                    var showDetailsModal = function(data) {
                        scope.alarmSummaryModalOverlayFlag = true;

                        //make a copy of data so when cancel it could cancel dirty data
                        scope.explorerData = {};
                        scope.explorerData.summary = angular.copy(data);
                        scope.explorerData.summary.history = [];
                        scope.explorerData.summary.description = [];

                        scope.explorerData.summary.hostAlarmsState = {
                            data: {
                                'ok': {'count':0},
                                'warning': {'count':0},
                                'critical': {'count':0},
                                'unknown': {'count':0}
                            },
                            title: $translate.instant('alarm.summary.details.host.title.nodata')
                        };
                        //to hold host name only
                        scope.explorerData.summary.hostDetails = {};
                        scope.selectedTableRowData = data;

                        getAlarmDetailsData(data).then(
                            function() {
                                scope.alarmSummaryModalOverlayFlag = false;
                            }
                        );

                        //deal with metric dimensions and value meta
                        scope.metricDetailsData = [];
                        scope.valueMetaTabbedPages = [];
                        scope.hasValueMetaData = false;
                        //use the metricDimensionCode to decide how to display
                        //dimension and value meta
                        scope.metricDimensionCode = 0; //good alarm single metric
                        scope.alarmSummaryMetricModalOverlayFlag = true;
                        if (data.state === 'ALARM') {
                            if (data.metrics.length > 1) {
                                scope.metricDimensionCode = 3; //bad alarm multiple metrics
                            }
                            else {
                                scope.metricDimensionCode = 2; //bad alarm single metric
                            }
                            scope.metricDetailsData = [];
                            getMetricDetailsData(data).then(
                                function() {
                                    scope.hasValueMetaData = hasValueMetaData();
                                    if (scope.hasValueMetaData === true) {
                                        if (scope.metricDimensionCode === 3) {
                                            //add the tabbed pages to show dimensions,metric name
                                            //and value meta
                                            scope.valueMetaTabbedPages = [];
                                            addMetricTabbedPages();
                                        }
                                        scope.alarmSummaryMetricModalOverlayFlag = false;
                                    }
                                    else {
                                        scope.metricDetailsData = [];
                                        //has no value meta, try it without dimensions
                                        getMetricDetailsData(data, true).then(
                                            function() {
                                                scope.hasValueMetaData = hasValueMetaData();
                                                if (scope.metricDimensionCode === 3) {
                                                    //add the tabbed pages to show dimensions,metric name
                                                    //and value meta
                                                    scope.valueMetaTabbedPages = [];
                                                    addMetricTabbedPages();
                                                }
                                                scope.alarmSummaryMetricModalOverlayFlag = false;
                                            }
                                        );
                                    }
                                }
                            );
                        }
                        else { //check if we have multiple dimensions for good alarm
                            scope.metricDetailsData = [];
                            data.metrics.forEach(function (metric) {
                                var dimensions = metric.dimensions;
                                var dimStr = dimObjToStr(dimensions);
                                if (angular.isDefined(dimensions)) {
                                    scope.metricDetailsData.push({
                                        'dimensions': dimStr,
                                        'name': metric.name,
                                        'details': []
                                    });
                                }
                            });
                            if (data.metrics.length > 1) {
                                scope.metricDimensionCode = 1;//good alarm multiple metrics
                                //add the tabbed pages to show dimensions and metric name
                                scope.valueMetaTabbedPages = [];
                                addMetricTabbedPages();
                            }
                            scope.alarmSummaryMetricModalOverlayFlag = false;
                        }

                        var dashAlarmListModal = getKeyFromScope(
                            'dashAlarmListModal',
                            scope.$parent.$parent.$parent.$parent.$parent);

                        //if loaded from dashboard - 2 layer, alarm detail is
                        //in parallel of alarm summary, need to find the common
                        // parent and populate the data and expose the functions
                        if (!isUndefined(dashAlarmListModal)) { //add to the stack
                            //TODO- need to find a cleaner way, whenever the layers
                            //in alarm_details.html get changed, this need adjusting
                            //and testing to make sure updateComment in the alarm
                            //detail still work
                            scope.$parent.$parent.$parent.$parent.$parent.explorerData =
                                scope.explorerData;
                            scope.$parent.$parent.$parent.$parent.$parent.selectedTableRowData =
                                scope.selectedTableRowData;
                            scope.$parent.$parent.$parent.$parent.$parent.alarmSummaryControl = scope;
                            dashAlarmListModal.addStack("components/alarmsummary/alarm_details.html");
                        }
                        else { //load from explorer or summary which is one layer
                            scope.showAlarmDetailsModalFlag = true;
                            scope.alarmSummaryControl = scope;
                        }

                        var host = getHostName(data);
                        scope.$broadcast("loadHostUtilsData", {'hostname': host});
                    };

                    scope.viewAlarmDefinition = function(data){
                        var drillPath =
                             '#/alarm/alarm_explorer?tabname=definition&expandOnLoad=true&filterField0=id&filterValue0=' + data.alarmDefId;
                        $window.open(drillPath, "_self");
                    };

                    var getSelectedRowData = function(dataId) {
                        if (!isUndefined(scope.selectedData) && scope.selectedData.length > 0 ){
                            for (var idx in scope.selectedData) {
                                var selData = scope.selectedData[idx];
                                if (selData.id === dataId) {
                                    return selData;
                                }
                            }
                        }
                        return null;
                    };

                    //deal with update comment
                    scope.commitUpdateComment = function(data) {
                        scope.alarmSummaryModalOverlayFlag = true;
                        var id = data.id;
                        var post_alarm_comment = {
                            'operation' : 'alarm_patch',
                            'id' : id,
                            'link': data.statusInfo
                        };

                        bllApiRequest.post('monitor',post_alarm_comment).then(
                            function(response) {
                                //update table row data for comments
                                if(!isUndefined(scope.selectedTableRowData)) {
                                    scope.selectedTableRowData.statusInfo = response.data.link;
                                }
                                scope.alarmSummaryModalOverlayFlag = false;
                                log('info', 'Successfully updated comments for alarm ' + id);
                            },
                            function(error_data) {
                                scope.alarmSummaryModalOverlayFlag = false;
                                addNotification(
                                    "error",
                                    $translate.instant("alarm_explorer.comment.data.error"));
                                log('error', 'Failed to update comments for alarm ' + id);
                                log('error', 'error data = ' + JSON.stringify(error_data));
                            }
                        );
                    };

                    //
                    //deal with deletion
                    //
                    var showDeleteModal = function (data) {
                        //we will only show selected data in the table
                        if (Array.isArray(data)) { //selected global delete
                            scope.selectedData = data;
                            scope.selectedData.forEach(function(alarm) {
                                alarm.removeSelection = true;
                            });
                        }
                        else { //selected row delete
                            //clean up existing removeSelection
                            if (!isUndefined(scope.selectedData)) {
                                scope.selectedData.forEach(function(alarm) {
                                    alarm.removeSelection = false;
                                });
                            }

                            data.removeSelection = true;
                            data.$rowSelected = true; //make selection
                            scope.selectedData = [data];
                        }

                        scope.selectedDataLength = scope.selectedData.length;
                        scope.disableDeleteButtonFlag =
                            scope.selectedDataLength === 0? true : false;

                        scope.showAlarmDeleteModalFlag = true;
                    };

                    scope.cancelDeleteModal = function() {
                        //clean the existing selected ones
                        if (!isUndefined(scope.selectedData)) {
                            scope.selectedData.forEach(function(alarm) {
                                alarm.removeSelection = false;
                            });
                        }
                        scope.showAlarmDeleteModalFlag = false;
                    };

                    scope.commitDeleteAlarm = function() {
                        scope.alarmSummaryModalOverlayFlag = true;
                        var removeSelections = scope.selectedData.filter(function(alarm) {
                            return alarm.removeSelection;
                        });
                        var promises = removeSelections.map(function(datum) {
                            var req_data = {operation: 'alarm_delete', id: datum.id};
                            return bllApiRequest.post('monitor', req_data ).
                                then(angular.noop,
                                    function(error) {
                                        var msg = $translate.instant(
                                            'alarm.summary.delete.error',
                                            {alarm_name: datum.name, alarm_id: datum.id, details: error});
                                        addNotification('error', msg);
                                        //remove it from selection
                                        removeSelections.forEach(function(alarm, index) {
                                            if(alarm.id === datum.id) {
                                                alarm.$rowSelected = false;
                                                removeSelections.splice(index, 1);
                                            }
                                        });
                                    }
                                );
                            }
                        );
                        var dismissModal = function() {
                            scope.showAlarmDeleteModalFlag = false;
                            scope.alarmSummaryModalOverlayFlag = false;

                            scope.getAlarmTableData().then (function() {
                                scope.alarmTableDataLoadingFlag = false;
                                //data loading is done
                                //broadcast to the children
                                var pageObject = {
                                    'total': scope.alarmTableDataTotal};
                                scope.$broadcast('tableDataLoaded', pageObject);
                            });
                        };
                        $q.all(promises).then(dismissModal, dismissModal);
                    };

                    //
                    //deal with user clicks on new alarm widget
                    //or service alarm widget
                    //
                    //filter json could be like
                    //{"heart_beat_on":true,
                    // "heart_beats":{"warn":true,"critical":false,"open":true,"unknown":false,"total":false},
                    // "service_on":true,
                    // "services":{"block-storage":true,"object-storage":false}}"
                    var toggleFilters = function(filterKey, category) {
                        //if the key is not there, add key
                        if (!(filterKey in category)) {
                            category[filterKey] = true;
                        }
                        else {
                            category[filterKey] = !category[filterKey]; //just toggle it
                        }
                        //only allow one is on
                        if (category[filterKey] === true) {
                            for (var item in category) {
                                if (item !== filterKey) {
                                    category[item] = false;
                                }
                            }
                        }
                    };

                    //when we have new alarm, it is only from alarm summary page
                    //extQueryParams should be empty if we have new alarm cards
                    scope.toggleHeatBeatFilters = function($event, heartbeatKey) {
                        //don't do any toggle when there are data loading going
                        if (scope.alarmTableDataLoadingFlag === true ||
                            scope.newAlarmSummaryDataLoadingFlag === true) {
                            return;
                        }

                        //toggle button color
                        var button = $($event.currentTarget);

                        //toggle filters
                        var heart_beats = scope.alarmFilters.heart_beats;
                        toggleFilters(heartbeatKey, heart_beats);


                        //turn off other buttons
                        if (heart_beats[heartbeatKey] === true) {
                            var other_buttons = button.parents('alarmcard').find('.datum:not(".' + heartbeatKey + '")');
                            other_buttons.removeClass('button_on');
                            button.addClass('button_on');
                            scope.alarmFilters.heart_beat_on = true;

                            //idea is the new card will give the queryParams object
                            //which is similar to the structure
                            /** data potentially could look like:
                             {  'on': true,
                                'filtering': {
                                    'state': {
                                        'base': ['CRITICAL']
                                    },
                                    'checkTime': {
                                        'base':[]
                                    }
                                }
                             };
                            **/
                            if(isUndefined(scope.extQueryParams)) {
                                scope.extQueryParams = {};
                            }
                            scope.extQueryParams.filtering = {};
                            scope.extQueryParams.filtering.checkTime = {};
                            var checkTime =
                                getStartUpdateTimeISODateString(scope.latestRefreshTime, scope.deltaRefreshTime);
                            scope.extQueryParams.filtering.checkTime.base = [checkTime];
                            scope.extQueryParams.filtering.ui_status = {};

                            switch (heartbeatKey) {
                                case 'critical':
                                case 'warn':
                                case 'unknown':
                                    scope.extQueryParams.filtering.ui_status.base = [heartbeatKey.toUpperCase()];
                                    break;
                                default: //total
                                    scope.extQueryParams.filtering.ui_status.base = [];
                            }
                            processExtraQueryParams(true);//true to disable ui_status filter
                        }
                        else {
                            button.removeClass('button_on');
                            scope.alarmFilters.heart_beat_on = false;
                            scope.extQueryParams = {
                                'filtering' : {
                                    'checkTime' :{
                                        'base': []
                                    },
                                    'ui_status': {
                                        'base': []
                                    }
                                }
                            };
                            //process and empty the scope.modalTableEnumFilter
                            processExtraQueryParams(true);
                        }
                        //trigger table reload when it is done processing custom
                        //enumFitler
                    };

                    //start issuing calls
                    //new alarm summary count data gets called by watching the
                    //deltaRefreshTime
                    if(!scope.isDrilledDown && !scope.hasExtraQueryParams) {
                        //call to get the data for the alarm summary page
                        scope.getAllAlarmData();
                    }
                    else {
                        //do nothing since it will wait for octable to set enum filter
                        //then octable issues doTableDataReload event
                    }
                }, //end preLink
                post: function postLink(scope, element, attr) {

                    scope.$watch('services', function(){
                        if(!isUndefined(scope.service)) {
                            scope.alarmServices = scope.services;
                        }
                        else {
                            scope.alarmServices = [];
                        }
                    });
                    scope.$watch('extraQueryParams', function(){
                        if(!isUndefined(scope.extraQueryParams)) {
                            scope.extQueryParams = scope.extraQueryParams;
                        }
                    });

                    //when time selection changed
                    scope.$watch('deltaRefreshTime', function() {
                        //check if we need to load new alarms
                        if (angular.isDefined(scope.deltaRefreshTime) &&
                            scope.hasNewAlarm) {
                            if(scope.userPref) {
                                if(typeof scope.userPref.deltaRefreshTime !== 'object') {
                                    scope.userPref.deltaRefreshTime = {};
                                }
                                scope.userPref.deltaRefreshTime[window.location.hash] = scope.deltaRefreshTime;
                                prefSaver.save(scope.userPref);
                            }
                            scope.getLatestAlarms();
                        }
                    });

                      //listening to events only from delete modal
                    scope.$on('tableSelectionChanged', function($event, selections) {
                        //table in the modal
                        var delete_table_scope =
                            angular.element('octable[modelname="selectedData"].alarm-modal-delete-table .octable').scope(),

                        target_scope_id = $event.targetScope.$id;

                        if(!isUndefined(selections)) {
                            if (!isUndefined(delete_table_scope) &&
                                     delete_table_scope.$id === target_scope_id) {
                                scope.selectedDataLength = selections.length;
                                scope.disableDeleteButtonFlag =
                                    scope.selectedDataLength  > 0 ? false : true;
                            }
                        }
                    });

                    //there are some table changes so reload data
                    scope.$on('doTableDataReload', function(event, tableQueryParams) {
                        //just reload the table
                        scope.getAlarmTableData().then (function() {
                            scope.alarmTableDataLoadingFlag = false;
                            //data loading is done
                            //broadcast to the children
                            var pageObject = {
                                'total': scope.alarmTableDataTotal};
                            //if drilldown from alarm definition page
                            //initially set the state sort as default
                            if(!isUndefined(scope.serverQueryParams) &&
                                scope.serverQueryParams.init) {
                                //set init sorting ui_status, col 2
                                pageObject.sortcol = scope.alarmTableConfig.headers[1];
                                scope.serverQueryParams.init = false;
                            }
                            scope.$broadcast('tableDataLoaded', pageObject);
                        });
                    });

                    //cancel the pull new alarms interval when leave the page
                    scope.$on('$destroy', function() {
                        if (scope.newAlarmIntervalId) {
                            $interval.cancel(scope.newAlarmIntervalId);
                        }
                    });
                }//end postLink
                } //end link
            };
        }
    ]);
})();
