// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';
    var p = ng.module('plugins');
    p.controller('DashboardControllerAlarms', ['$scope', '$rootScope', '$translate', '$http', '$cookieStore',
                 'isUndefined', 'addNotification', 'bllApiRequest', '$filter', 'styleutils', 'dimObjToStr',
                 'renderLineOfDimension', 'getTimeToGoBackISODateStr', 'getStartUpdateTimeISODateString', 'ocTimeSelections', '$q', 'log', '$window',
                 'getDisplayDateAndUTC', 'prefSaver', 'filterAlarmCount', 'genRandomString', 'animationLoop',
        function ($scope, $rootScope, $translate, $http, $cookieStore,
                  isUndefined, addNotification, bllApiRequest, $filter, styleutils, dimObjToStr,
                  renderLineOfDimension, getTimeToGoBackISODateStr, getStartUpdateTimeISODateString, ocTimeSelections, $q, log, $window,
                  getDisplayDateAndUTC, prefSaver, filterAlarmCount, genRandomString, animationLoop) {

            $scope.anyErrors = function() {
                if($scope.checkAllLoaded() && $scope.alarmErrorCount > 0) {
                    addNotification("error", $translate.instant("alarm_explorer.table.data.error"));
                    $scope.alarmErrorCount = 0;
                    return true;
                }
                return false;
            };

            //some counts and flags to be tracked across the scope
            $scope.latestRefreshTime = '...';
            $scope.displayLatestRefreshTime = {};
            $scope.deltaRefreshTime = ocTimeSelections.ONE_MINUTE;
            $scope.timeOptions = [
                {value: ocTimeSelections.ONE_MINUTE,      label: 'alarm.new.time.minute'},
                {value: ocTimeSelections.FIVE_MINUTES,    label: 'alarm.new.time.5minute'},
                {value: ocTimeSelections.FIFTEEN_MINUTES, label: 'alarm.new.time.15minute'} ,
                {value: ocTimeSelections.THIRTY_MINUTES,  label: 'alarm.new.time.30minute'} ,
                {value: ocTimeSelections.ONE_HOUR,        label: 'alarm.new.time.hour'} ,
                {value: ocTimeSelections.TWO_HOURS,       label: 'alarm.new.time.2hour'} ,
                {value: ocTimeSelections.FOUR_HOURS,      label: 'alarm.new.time.4hour'} ,
                {value: ocTimeSelections.EIGHT_HOURS,     label: 'alarm.new.time.8hour'}
            ];

            //the master list of all alarm services we track on dashboard
            $scope.srvcVIPList = [];

            //
            // Load alarm list from user prefs
            //
            $scope.prefLoad = function() {
                prefSaver.load().then(
                    function (data) {
                        $scope.cardData = [];
                        $scope.otherServicesAppended = false;
                        $scope.userPref = data;
                        if(typeof data.deltaRefreshTime === 'object' &&  data.deltaRefreshTime[window.location.hash] !== undefined) {
                            $scope.deltaRefreshTime = data.deltaRefreshTime[window.location.hash];
                        }

                        var userList;
                        if(angular.isDefined(data.dashboards) && angular.isDefined(data.dashboards["CENTRAL.DASHBOARD"])){
                          userList = prefSaver.getDefaultPrefs().dashboards["CENTRAL.DASHBOARD"].ALARMSUMMARY;
                        }
                        if(angular.isDefined(userList)) {
                            userList.forEach(function(datum) {
                                var cData = data.cardAndChartStore[datum];
                                if(angular.isDefined(cData)) {
                                    $scope.cardData.push(cData);
                                }
                            });
                        }

                        $scope.srvcPrefVIPList = [];
                        $scope.cardData.forEach(function(subList) {
                            if(subList.services !== undefined)
                                subList.services.forEach(function(alarm) {
                                    $scope.srvcPrefVIPList.push(alarm);
                                });
                        });

                        callBLLForAlarmCount();
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
            $scope.prefLoad();

            $scope.launchNewDynCardModal = function(idx) {
                $scope.newCardSelections.index = undefined;
                $scope.originCardSelections = undefined;
                for(var cardServices in $scope.newCardSelections.serviceList) {
                    $scope.newCardSelections.serviceList[cardServices].value = false;
                }
                for(var cardHnames in $scope.newCardSelections.hnameList) {
                    $scope.newCardSelections.hnameList[cardHnames].value = false;
                }
                if(idx !== undefined) { //existing card
                    if($scope.cardData[idx].services) {
                        $scope.modalCreateAlarmsServiceMode = "service";
                        $.each($scope.newCardSelections.serviceList, function(index, value) {
                            if($scope.cardData[idx].services.toString().search(value.title) !== -1)
                                value.value = true;
                        });
                    }
                    if($scope.cardData[idx].hostnames) {
                        $scope.modalCreateAlarmsServiceMode = "hostname";
                        $.each($scope.newCardSelections.hnameList, function(index, value) {
                            if($scope.cardData[idx].hostnames.toString().search(value.title) !== -1)
                                value.value = true;
                        });
                    }

                    if ($scope.cardData[idx].staticName === true) {
                        $scope.newCardSelections.name = $translate.instant($scope.cardData[idx].title);
                    } else {
                        $scope.newCardSelections.name = $scope.cardData[idx].title;
                    }
                    $scope.newCardSelections.index = idx;

                    //record the original value so we can defect service/hostname changes
                    $scope.originCardSelections = angular.copy($scope.newCardSelections);
                }
                else { //new card
                    $scope.newCardSelections.name = '';
                }


                if(typeof $scope.cardData[idx] !== 'undefined')
                    $scope.newCardSelections.staticName = $scope.cardData[idx].staticName;
                else
                    $scope.newCardSelections.staticName = false;

                $scope.cardCreateModalFlag = true;
            };

            $scope.processNewDynCardModal = function(form) {
                var choices = [];
                if($scope.modalCreateAlarmsServiceMode == 'service') {
                    for(var cardServices in $scope.newCardSelections.serviceList) {
                        if($scope.newCardSelections.serviceList[cardServices].value) {
                            choices.push($scope.newCardSelections.serviceList[cardServices].title);
                        }
                    }
                }
                else {
                    for(var cardHostnames in $scope.newCardSelections.hnameList) {
                        if($scope.newCardSelections.hnameList[cardHostnames].value) {
                            choices.push($scope.newCardSelections.hnameList[cardHostnames].title);
                        }
                    }
                }
                var title = $scope.newCardSelections.name;
                var staticName = $scope.newCardSelections.staticName;
                $scope.newDynCard(title,choices,staticName);
                $scope.cardCreateModalFlag = false;

                if (angular.isDefined(form)) {
                    form.$setPristine();
                }
            };

            $scope.cancelNewDynCardModal = function(theForm) {
                $scope.cardCreateModalFlag = false;
                if(angular.isDefined(theForm)) {
                    theForm.$setPristine();
                }
            };

            $scope.newDynCard = function(title, choices, staticName) {
                var cardName = genRandomString(15);
                var newCard = {'title': title, 'staticName': staticName};
                if($scope.modalCreateAlarmsServiceMode === 'service')
                    newCard.services = choices;
                else
                    newCard.hostnames = choices;

                $scope.userPref.cardAndChartStore[cardName] = newCard;
                if(angular.isDefined($scope.userPref.dashboards['CENTRAL.DASHBOARD']) == false){
                    $scope.userPref.dashboards['CENTRAL.DASHBOARD'] = prefSaver.getDefaultPrefs().dashboards['CENTRAL.DASHBOARD'];
                }
                if($scope.newCardSelections.index === undefined)
                    $scope.userPref.dashboards['CENTRAL.DASHBOARD'].ALARMSUMMARY.push(cardName);
                else {
                    $scope.userPref.dashboards['CENTRAL.DASHBOARD'].ALARMSUMMARY[$scope.newCardSelections.index] = cardName;
                }


                prefSaver.save($scope.userPref).then(
                    function () {
                        $scope.prefLoad();
                    }
                );
            };

            $scope.delDynCard = function() {
                var idx = $scope.delIdx;

                if(typeof idx === 'undefined')
                    return false;

                $scope.userPref.dashboards['CENTRAL.DASHBOARD'].ALARMSUMMARY.splice(idx,1);

                prefSaver.save($scope.userPref).then(
                    function () {
                        $scope.prefLoad();
                    }
                );

                $scope.showDeleteConfirm = false;
            };

            $scope.mUpDynCard = function(idx) {
                var target = $scope.userPref.dashboards['CENTRAL.DASHBOARD'].ALARMSUMMARY;
                if(typeof target[idx-1] === 'undefined')
                    return false;
                target.splice(idx-1,0, target.splice(idx,1)[0]);

                prefSaver.save($scope.userPref).then(
                    function () {
                        $scope.prefLoad();
                    }
                );
            };

            $scope.mDwnDynCard = function(idx) {
                var target = $scope.userPref.dashboards['CENTRAL.DASHBOARD'].ALARMSUMMARY;
                if(typeof target[idx+1] === 'undefined')
                    return false;
                target.splice(idx+1,0, target.splice(idx,1)[0]);

                prefSaver.save($scope.userPref).then(
                    function () {
                        $scope.prefLoad();
                    }
                );
            };

            //
            // BLL request for alarm count
            //
            var callBLLForAlarmCount = function() {
                var req_alarms = {
                    "operation": "alarm_count",
                    "group_by": "dimension_name, dimension_value, state, severity",
                    "dimension_name_filter": "service, hostname"
                };

                bllApiRequest.get('monitor', req_alarms).then(
                    function (response) {

                        var list = filterAlarmCount(response.data);
                        var otherList = [];
                        var checkList = '';

                        // first we create the checklist of wanted types
                        checkList = $scope.srvcPrefVIPList.toString();

                        //first we want to create a new other alarms list:
                        $.each(list.service, function(key, type) {
                            if( $scope.srvcPrefVIPList.indexOf(key)  === -1 && key !== 'count')
                                otherList.push(key);
                        });

                        if($scope.otherServicesAppended === false) {
                            $scope.cardData.push({title: $translate.instant("general.dashboard.card.title.other"), services: otherList});
                            $scope.otherServicesAppended = true;
                        }

                        var cardList = [];
                        var tempCardListing = {};
                        var tempCount = {};

                        for(var idxBucket in $scope.cardData) {
                            tempCardListing = {total:0, critical:0, warning: 0, unknown: 0, types: {}};
                            for(var idxSvc in $scope.cardData[idxBucket].services) {
                                tempCount = list.service[$scope.cardData[idxBucket].services[idxSvc]];
                                if(tempCount !== undefined) {
                                    tempCardListing.total += tempCount.total;
                                    tempCardListing.critical += tempCount.critical;
                                    tempCardListing.warning += tempCount.warning;
                                    tempCardListing.unknown += tempCount.unknown;
                                }
                                tempCardListing.types.services = $scope.cardData[idxBucket].services;
                                tempCardListing.ctitle = $scope.cardData[idxBucket].title;
                            }
                            for(var idxHnm in $scope.cardData[idxBucket].hostnames) {
                                tempCount = list.hostname[$scope.cardData[idxBucket].hostnames[idxHnm]];
                                if(tempCount !== undefined) {
                                    tempCardListing.total += tempCount.total;
                                    tempCardListing.critical += tempCount.critical;
                                    tempCardListing.warning += tempCount.warning;
                                    tempCardListing.unknown += tempCount.unknown;
                                }
                                tempCardListing.types.hostnames = $scope.cardData[idxBucket].hostnames;
                                tempCardListing.ctitle = $scope.cardData[idxBucket].title;
                            }
                            cardList.push(tempCardListing);
                        }
                        $scope.cardCountList = cardList;

                        $scope.possibleServices = $.map(list.service, function(value, index) {
                            return index;
                        });
                        $scope.possibleHostnames = $.map(list.hostname, function(value, index) {
                            return index;
                        });
                        $scope.newCardSelections = (function() {
                            var cardAttributes = [];
                            var selections = { name:'', serviceList : [], hnameList : []};

                            $scope.possibleServices.forEach(function(srvc, idx) {
                                if(srvc !== 'count')
                                    selections.serviceList.push({'title':srvc, 'value':false});
                            });

                            $scope.possibleHostnames.forEach(function(hstnm, idx) {
                                if(hstnm !== 'count')
                                    selections.hnameList.push({'title':hstnm, 'value':false});
                            });

                            return selections;
                        })();
                    },

                    function (error_data) {
                        console.log('error in request:');
                        console.dir(error_data);
                        return 0;
                    }
                );
            };

            $scope.menuActions = [{
                label: 'common.edit',
                action: function (idx) {
                    $scope.launchNewDynCardModal(idx);
                }
            }, {
                label: 'common.delete',
                action: function (idx) {
                    $scope.delIdx = idx;
                    $scope.showDeleteConfirm = true;
                }
            }, {
                label: 'common.move.up',
                action: function (idx) {
                    $scope.mUpDynCard(idx);
                }
            }, {
                label: 'common.move.down',
                action: function (idx) {
                    $scope.mDwnDynCard(idx);
                }
            }];

            $scope.newCardType = [
              {
                label: "service",
                value: 'service'
              },
              {
                label: "hostname",
                value: 'hostname'
              }
            ];









            //
            // New Alarms functions
            //
            $scope.$watch('deltaRefreshTime', function() {
                if (angular.isDefined($scope.deltaRefreshTime)) {
                    if($scope.userPref) {
                        if(typeof $scope.userPref.deltaRefreshTime !== 'object') {
                            $scope.userPref.deltaRefreshTime = {};
                        }
                        $scope.userPref.deltaRefreshTime[window.location.hash] = $scope.deltaRefreshTime;
                        prefSaver.save($scope.userPref);
                    }
                    $scope.getLatestAlarms();
                }
            });

            $scope.getLatestAlarms = function() {
                $scope.latestRefreshTime = new Date();
                $scope.displayLatestRefreshTime = getDisplayDateAndUTC();
                var cutOffDateStr = getTimeToGoBackISODateStr($scope.deltaRefreshTime);
                var req_alarms = {
                    "operation": "alarm_count",
                    "group_by": "state, severity",
                    "state_updated_start_time": cutOffDateStr
                };

                bllApiRequest.get('monitor', req_alarms).then(
                    function (response) {
                        $scope.newAlarms = filterAlarmCount(response.data);
                        if($scope.newAlarms.total != $scope.newAlarmOldTotal.total ||
                            $scope.newAlarms.warning != $scope.newAlarmOldTotal.warning ||
                            $scope.newAlarms.critical != $scope.newAlarmOldTotal.critical ||
                            $scope.newAlarms.unknown != $scope.newAlarmOldTotal.unknown) {
                            $scope.newAlarmOldTotal = $scope.newAlarms;
                            $scope.prefLoad();
                        }
                    },

                    function (error_data) {
                        console.log('error in request:');
                        console.dir(error_data);
                        return 0;
                    }
                );
            };

            // First intance onLoad
            $scope.getLatestAlarms();

            // Set actual interval call to run every 60 seconds
            animationLoop(60*1000, function() {
                //test to see if ui is in data push/pull state, or if a modal is open
                //If so, we wait till next interval to poll new data
                if(!$scope.listModalFlag && !$scope.cardCreateModalFlag) {
                    $scope.getLatestAlarms();
                }
            }, function() { //if we have not been destoryed keep going.
                return !$scope.destroyed;
            });

            // Remove the interval call when controller is unloaded
            $scope.destroyed = false;
            $scope.$on('$destroy', function() {
                $scope.destroyed = true;
            });









            //
            // Specific functionality tied to clicking on a value in an alarm card on this page
            //
            // $event returns the event that fired the click
            // val is a string of the label that was clicked in the alarm card
            $scope.valueClick = function($event, val, data) {
                var delta;
                if($($event.currentTarget.offsetParent).hasClass('newAlarms'))
                    delta = $scope.deltaRefreshTime;
                $scope.showHideTblModal(data.types, val, delta);
            };

            //
            // Launch Modal with correct list data
            //
            $scope.showHideTblModal = function(types, val, delta){
                $scope.listModalFlag = !$scope.listModalFlag;
                if($scope.listModalFlag) {
                    if(types !== undefined) {
                        if(types.services !== undefined) {
                            $scope.modalTableAlarmServices = types.services;
                            $scope.modalTableAlarmHostnames = [];
                        }
                        else if(types.hostnames !== undefined) {
                            $scope.modalTableAlarmHostnames = types.hostnames;
                            $scope.modalTableAlarmServices = [];
                        }
                    }
                    else {
                        $scope.modalTableAlarmHostnames = [];
                        $scope.modalTableAlarmServices = [];
                    }
                    if(val) {
                        $scope.modalTableAlarmQueryParams = {
                            'filtering': {
                                'ui_status': {
                                    'base': [val.toUpperCase()] //val is critical, warn, unknown or total
                                },
                                'checkTime': {
                                    'base': []
                                }
                            }
                        };
                        if(val === 'total') {
                            $scope.modalTableAlarmQueryParams.filtering.ui_status.base = [];
                        }
                    }
                    if(delta)
                        $scope.modalTableAlarmQueryParams.filtering.checkTime.base = [getStartUpdateTimeISODateString($scope.latestRefreshTime,delta)];

                }
                else {
                    $scope.modalTableAlarmServices = [];
                    $scope.modalTableAlarmQueryParams = [];
                    $scope.modalTableAlarmHostnames = [];
               }

            };

            // be on the lookout for when list model closes, and reload the buckets in case alarm was deleted
            $scope.$watch(
                function($scope) {
                    return $scope.listModalFlag;
                },

                function() {
                    if($scope.listModalFlag === false) {
                        $scope.prefLoad();
                }
            });

            // test if object has ALL false values
            $scope.checkAllFalse = function(array) {
                for(var el in array) {
                    if(array[el].value === true) {
                        return false;
                    }
                }
                return true;
            };

            $scope.hasCardChanged = function (cardForm, cardSelections) {
                if (!angular.isDefined(cardForm) || !angular.isDefined(cardSelections)) {
                    return false;
                }

                //any other part changes except service/hostname selection
                if(!cardForm.$pristine) {
                    return true;
                }

                //the card $pristine doesn't pick up the selection changes..
                //have to add logic to check to see if any selection changed
                if (angular.isDefined($scope.originCardSelections))  {
                    if ($scope.modalCreateAlarmsServiceMode === "service") {
                        for(var cardServices in $scope.originCardSelections.serviceList) {
                            if ($scope.originCardSelections.serviceList[cardServices].value != $scope.newCardSelections.serviceList[cardServices].value) {
                                return true;
                            }
                        }
                    } else if ($scope.modalCreateAlarmsServiceMode === "hostname") {
                        for(var cardHnames in $scope.originCardSelections.hnameList) {
                            if ($scope.originCardSelections.hnameList[cardHnames].value != $scope.newCardSelections.hnameList[cardHnames].value) {
                                return true;
                            }
                        }
                    }
                }
                else { //new card
                    //assume it changed here,  it will check if any selected in card_create.html
                    return true;
                }
            };

            //
            // Other Scope definitions
            //
            $scope.modalTableAlarmServices = [];
            $scope.modalTableAlarmQueryParams = {};
            $scope.modalTableAlarmHostnames = [];
            $scope.modalCreateAlarmsServiceMode = 'service';
            $scope.newAlarmOldTotal = {total: 0, critical: 0, warning: 0, unknown: 0};

            function objToString(dimensions){
                var str = '';
                for (var p in dimensions) {
                    if(dimensions.hasOwnProperty(p)){
                        str += p + '=' + dimensions[p] + ',';
                    }
                }
                var finStr = str.substring(',',str.length - 1);
                return finStr;
            }

        }
    ]);
})(angular);
