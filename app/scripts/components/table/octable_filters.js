// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function () {
    'use strict';

    angular.module('operations-ui').filter('tableDisplayFilter', ['$filter', 'isUndefined',
        function ($filter, isUndefined) {
            return function (input, wrappedFilter) {
                if (isUndefined(wrappedFilter)) {
                    return input;
                } else {
                    return $filter(wrappedFilter)(input);
                }
            };
        }
    ]).filter('tableStatusFilter', ['$sce', 'styleutils', 'getStatusCssClass',
        function ($sce, styleutils, getStatusCssClass) {
            //this status renderer is available by default, but alternative renderers that are
            //also setup as filters can be done to customize the tables further
            return function (input) {
                return $sce.trustAsHtml('<div class="' + getStatusCssClass(input) + '" />');

            };
        }]).filter('tableStatusWithoutTextFilter', ['$sce', 'styleutils', 'getStatusCssClass',
        function ($sce, styleutils, getStatusCssClass) {
            //this status renderer is available by default, but alternative renderers that are
            //also setup as filters can be done to customize the tables further
            return function (input) {
                return $sce.trustAsHtml('<span style="margin:auto;" class="' + getStatusCssClass(input) + '" />');
            };
        }]).filter('tableStatusWithTextFilter', ['$sce', 'styleutils', 'getStatusCssClass',
        function ($sce, styleutils, getStatusCssClass) {
            //this status renderer is available by default, but alternative renderers that are
            //also setup as filters can be done to customize the tables further
            return function (input) {
                var upprInput = '';
                if (angular.isDefined(input)) {
                    upprInput = input;
                }
                var instanceHtml = '<span>' + upprInput + '</span><span class="table_status_icon ' + getStatusCssClass(input) + '"/>';
                return $sce.trustAsHtml(instanceHtml);

            };
        }]).filter('tableSystemStatusWithLocalizedTextFilter', ['$sce', 'styleutils', 'getStatusCssClass','$translate',
        function ($sce, styleutils, getStatusCssClass, $translate) {
            //this status renderer is available by default, but alternative renderers that are
            //also setup as filters can be done to customize the tables further
            return function (input) {
                var localeInput = '';
                if (angular.isDefined(input)) {
                    localeInput = input;
                    switch (input) {
                        case 'OK':
                            localeInput = $translate.instant('common.system.status.ok');
                            break;
                        case 'ALARM':
                            localeInput = $translate.instant('common.system.status.critical');
                            break;
                        case 'UNDETERMINED':
                            localeInput = $translate.instant('common.system.status.unknown');
                            break;
                        case 'CRITICAL':
                            localeInput = $translate.instant('common.system.status.critical');
                            break;
                        case 'UP':
                            localeInput = $translate.instant('common.system.status.up');
                            break;
                        case 'DOWN':
                            localeInput = $translate.instant('common.system.status.down');
                            break;
                        case 'WARN':
                            localeInput =  $translate.instant('common.system.status.warn');
                            break;
                         case 'ERROR':
                            localeInput =  $translate.instant('common.system.status.error');
                            break;
                        default:
                            localeInput =  $translate.instant('common.system.status.unknown');
                            break;
                    }
                }
                var instanceHtml = '<span>' + localeInput + '</span><span class="table_status_icon ' + getStatusCssClass(input) + '"/>';
                return $sce.trustAsHtml(instanceHtml);

            };
        }]).filter('ComputeStateWithTextFilter', ['$sce', 'styleutils', 'getStatusCssClass',
        function ($sce, styleutils, getStatusCssClass) {
            //this status renderer is available by default, but alternative renderers that are
            //also setup as filters can be done to customize the tables further
            return function (input) {
                var instanceHtml = "";

                if (input === 'activating' || input === 'deactivating' || input === 'deleting') {
                    instanceHtml = '<span class="table_status_icon ' + getStatusCssClass("in_progress") + '"/>';
                } else {
                    instanceHtml = '';
                }
                return $sce.trustAsHtml(instanceHtml);

            };
        }]).filter('ComputeStateWithoutTextFilter', ['$sce', 'styleutils', 'getStatusCssClass',
        function ($sce, styleutils, getStatusCssClass) {
            //this status renderer is available by default, but alternative renderers that are
            //also setup as filters can be done to customize the tables further
            return function (input) {
                var instanceHtml = "";

                if (input === 'activating' || input === 'deactivating' || input === 'deleting') {
                    instanceHtml = getStatusCssClass("in_progress");
                } else {
                    instanceHtml = '';
                }
                return instanceHtml;

            };
        }]).filter('iconOnlyTableStatusFilter', ['$sce', 'styleutils', 'getStatusCssClass',
        function ($sce, styleutils, getStatusCssClass) {
            //this status renderer is available by default, but alternative renderers that are
            //also setup as filters can be done to customize the tables further
            return function (input) {
                return $sce.trustAsHtml('<div style="display:inline-flex;" class="table_status_div">' +
                    '<span class="' + getStatusCssClass(input) + '" /></div>');

            };
        }]).filter('tableStatusWithNameFilter', ['$sce', 'styleutils', 'getStatusCssClass',
        function ($sce, styleutils, getStatusCssClass) {
            //this status renderer is available by default, but alternative renderers that are
            //also setup as filters can be done to customize the tables further
            return function (input) {
                var nameStatusHtml = '<span>' + input.name + '</span><span class="table_status_icon ' + getStatusCssClass(input.status) + '"/>';
                return $sce.trustAsHtml(nameStatusHtml);

            };
        }]).filter('dateTimeFilter', ['$filter', '$translate', function ($filter, $translate) {
        return function (input, formatKey) {
            var inputAsDate = new Date(input);
            var format = $translate.instant(formatKey);
            return $filter('date')(inputAsDate, format);
        };
    }]).filter('simpleDateTimeFilter', ['$filter', '$translate', function ($filter, $translate) {
        return function (input) {
            var inputAsDate = new Date(input);
            var format = $translate.instant("common.dateformat.simple");
            //translate.$instant is unreliable, have a default
            if (format === "common.dateformat.simple") {
                format = 'MM/dd/yyyy hh:mm a';
            }
            return $filter('date')(inputAsDate, format);
        };
    }]).filter('dateStateFilter', ['$filter', '$translate', function ($filter, $translate) {
        return function (input, format, state) {
            var inputAsDate = new Date(input);
            return ($filter('date')(inputAsDate, format) + ' (' + state + ')');
        };
    }]).filter('statusRowHighlightFilter', [function () {
        //this filter is available by default, alternative row filters can easily be implemented following a
        //similar pattern
        return function (input) {
            var statusRowClass = "";
            if (typeof input.status === 'string') {
                if (input.status.toUpperCase() === 'ERROR') {
                    statusRowClass = 'table_rowcolor_error';
                } else if (input.status.toUpperCase() === 'WARN') {
                    statusRowClass = 'table_rowcolor_warn';
                } else if (input.status.toUpperCase() === 'OK') {
                    statusRowClass = 'table_rowcolor_ok';
                }
            }

            return statusRowClass;

        };
    }]).filter('naCellFilter', ['$translate', function ($translate) {
        //this filter is available by default, alternative row filters can easily be implemented following a
        //similar pattern
        return function (input) {
            var cellClass = "";
            if (angular.isUndefined(input) || input === null || input === "N/A" ||
                input === ($translate.instant('common.not_applicable'))) {
                //the localization of this may not work due to timing issues around translate.instant
                //tables may need to provide their own filter if the input is neither null
                //undefined, or "N/A" , just add the notApplicableCell class where needed
                cellClass = 'notApplicableCell';
            }

            return cellClass;

        };
    }]).filter('sortLabelFilter', ['$translate', function ($translate) {
        return function (input) {
            return $translate.instant('table.sortBy', {fieldName: input});
        };
    }]).filter('hasEnumeratedFilters', [function () {
        return function (input) {
            var headersWithEnumeratedFilters = [];
            angular.forEach(input, function (value, key) {
                if (!angular.isUndefined(value.filterOptions)) {
                    headersWithEnumeratedFilters.push(value);
                }
            });
            return headersWithEnumeratedFilters;
        };
    }]).filter('canShowEnumFilters', [function () {
        return function (input) {
            var headerCanShowFilters = [];
            angular.forEach(input, function (value, key) {
                if (angular.isUndefined(value.noshow) || !value.noshow ) {
                    headerCanShowFilters.push(value);
                }
            });
            return headerCanShowFilters;
        };
    }]).filter('tableInstanceFilter', ['$sce', 'styleutils', function ($sce, styleutils) {
        //this status renderer is available by default, but alternative renderers that are
        //also setup as filters can be done to customize the tables further
        return function (input) {
            var statusCssClass = '';
            var instanceHtml = '<div class="align-left">' + input + '</div>';
            if (angular.isDefined(input) && input > 0) {
                statusCssClass = 'instance-warning';
                instanceHtml += '<div class="align-right ' + statusCssClass + '" />';
            } else if (!angular.isDefined(input) || input === -1) {
                return 0;
            }
            return $sce.trustAsHtml(instanceHtml);

        };
    }]).filter('tableTrueFalseFilter', ['$translate', function ($translate) {
        // Returns the locale value of Assigned or Unassigned.  Error returns the passed in value.
        return function (input) {
            var assignment = input;
            if (input) {
                assignment = $translate.instant('common.boolean.true');
            } else {
                assignment = $translate.instant('common.boolean.false');
            }
            return assignment;
        };
    }]).filter('tableTrueFalseYesNoFilter', ['$translate', function ($translate) {
        // Returns the locale value of Assigned or Unassigned.  Error returns the passed in value.
        return function (input) {
            var assignment = input;
            if (input) {
                assignment = $translate.instant('common.boolean.yesno.true');
            } else {
                assignment = $translate.instant('common.boolean.yesno.false');
            }
            return assignment;
        };
    }]).filter('tableTrueFalseUpDownFilter', ['$translate', function ($translate) {
        // Returns the locale value of Assigned or Unassigned.  Error returns the passed in value.
        return function (input) {
            var assignment = input;
            if (input) {
                assignment = $translate.instant('common.boolean.updown.true');
            } else {
                assignment = $translate.instant('common.boolean.updown.false');
            }
            return assignment;
        };
    }]).filter('default', ['$filter', function ($filter) {
        return function (input, defaultValue) {
            if (input === "" || isNaN(input)) {
                return defaultValue;
            } else if (input === -1) {
                return defaultValue;
            }

            return input;
        };
    }]).filter('defaultStr', ['$filter', function ($filter) {
        return function (input, defaultValue) {
            if (input === "") {
                return defaultValue;
            }
            return input;
        };
    }]).filter('calcPercent', ['$filter', function ($filter) {
        return function (used, total) {
            if (used === "" || used === -1 || total === "" || total === -1) {
                return 0;
            } else if (total !== 0 && !isNaN(total)) {
                var percent = (used * 100.0) / total;
                return Math.round(percent, 2);
            } else {
                return used;
            }
        };
    }]).filter('tableIpv46Filter', ['$translate', function ($translate) {
        // Returns the locale value of IPV4 or IPV6.  Mismatched entry returns the passed in value.
        return function (input) {
            var ipversion = input;
            if (input === 4 || input === '4') {
                ipversion = $translate.instant('common.networking.ipv4');
            } else if (input === 6 || input === '6') {
                ipversion = $translate.instant('common.networking.ipv6');
            }
            return ipversion;
        };
    }]).filter('MBtoGB', ['$filter', function ($filter) {
        return function (input) {
            if (input === "" || input === -1) {
                return 0;
            } else if (input > 0 && !isNaN(input)) {
                return +(parseFloat(input / 1024).toFixed(2));
            } else {
                return input;
            }
        };
    }]).filter('customCase', ['$filter', function ($filter) {
        return function (input) {
            if (input === 'esx') {
                return input.toUpperCase() + 'i';
            } else if (input === 'hyperv') {
                return 'Hyper-V';
            } else if (input === undefined) {
                return input;
            } else {
                return input.toUpperCase();
            }
        };
    }]).filter('formCpg', ['$translate', function ($translate) {
        return function (input) {
            var value = "";
            if (typeof input === 'string') {
                return input;
            } else if (input === undefined) {
                return $translate.instant('common.not.available');
            } else if (input !== undefined) {
                if (Object.keys(input).length === 0) {
                    return $translate.instant('common.not.available');
                } else {
                    for (var cpg in input) {
                        value += input[cpg] + ",";
                    }
                    return value.substring(0, value.length - 1);
                }
            }
        };
    }]).filter('ipAndPortFilter', ['$filter', function ($filter) {
        return function (ip, port) {
            if (angular.isDefined(port)) {
                return ip.toString() + ':' + port.toString();
            } else {
                return ip;
            }
        };
    }]).filter('caseFilter', [function () {
        return function (input) {
            if(angular.isDefined(input) && input !== "" && typeof input === 'string'){
                return input.charAt(0).toUpperCase() + input.slice(1);
            }else {
                return input;
            }
        };
    }]).filter('truncTextDisplayFilter', ['$filter', function () {
        return function (text, length) {
            if (!angular.isDefined(length) ||
                isNaN(length)) {
                length = 30;
            }
            var myStr = String(text);
            var end = '...';
            if (myStr.length <= length) {
                return myStr;
            }
            else {
                return myStr.substring(0, length - end.length) + end;
            }

        };
    }]);
})();
