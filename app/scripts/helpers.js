// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';

    var helpers = ng.module('helpers', ['ngRoute']);

    helpers.constant('isUndefined', function (item) {
        return angular.isUndefined(item) || item === null;
    });

    helpers.constant('iterateForm', function(form, callback) {
      ng.forEach(form, function(value, key) {
        if(typeof key === 'string' && key.indexOf("$") === -1) {
          callback(value, key);
        }
      });
    });

    helpers.factory('clearForm', ['iterateForm', function(iterateForm) {
      return function(form) {
        iterateForm(form, function(value, key) {
            if(form[key].$setPristine) {
                form[key].$setPristine();
            }
        });
        if(form.$setPristine){
            form.$setPristine();
        }
      };
    }]);

    /* Set all fields in a form to dirty (dirty is a verb here, not an adjective)
    */
    helpers.factory('dirtyForm', ['iterateForm', function(iterateForm) {
      return function(form) {
        iterateForm(form, function(value, key) {
          form[key].$setDirty();
        });
      };
    }]);

    /*
    Validate in input field using a predefined validation "type". If the validation fails, the input field is
    highlighted in red and the appropriate message is made visible.

    Here is an example of the input:

      <input name="env_hostname" type="text"           oc-validate="[type]"  ng-model="imported.hostname"/>
                     ^--- the input must have a name=    ^--- directive specifies validation type

    And immediately after it would be the error message (in an error-span element):

      <error-span condition="common.env_hostname"          text="ocvalidate.hostname"></error-span>
                             --- ------------                 -------------------
                <form> name --^    ^-- <input> name             ^-- error messsage (typically "ocvalidate" plus validation type)

    The validation [type] can be either:
        1. A value in the ocValidators constant,                   like this:    oc-validate="ocValidators.cidr"
        2. A function to be called (with the current value),       like this:    oc-validate="myfunc"
           where: scope.myfunc = function(curVal) {... returns true if valid }

    Range validation

    This requires additional information to specify the range. Currently only intRange validation is supported.

        1. The <input> tag needs oc-validate-range:

            <input ... oc-validate="intRange" oc-validate-range="[5,10]"/>

        2. The <error-span> needs the range also, but as input to translate:

            <error-span ... text="{{'ocvalidate.intRange' | translate: {start:5, end:10} }}"></error-span>

    */


    helpers.directive('ocValidate', ['ocValidators', 'duplicateVlanCheck', 're_digits', function (ocValidators, duplicateVlanCheck, re_digits) {
        return {
            require: "ngModel",
            restrict: "A",
            scope: {
                model: "=ngModel",
                ocValidate: "=",
                ocValidateRange:"=",
                ocValidateInvalid: "=",
                ocValidateInvalidSafekey: "=",
                ngRequired: "&"          // Not reevaluated!
            },
            link: function (scope, element, attributes, ngModel) {
                ngModel.$validators.ocValidate = function () {

                    var required = false;
                    if (angular.isDefined(scope.ngRequired)) {
                        required = scope.ngRequired();
                    }

                    var value = ngModel.$viewValue;

                    // undefined value is not invalid
                    //or ocValidate is not defined return true
                    if (angular.isUndefined(scope.ocValidate) || angular.isUndefined(value)) {
                        return true;
                    }

                    // If the value is not required, then allow it to be blank

                    if (value.length === 0 && !required) {
                        return true;
                    }

                    //Attribute is a key in ocValidators
                    if (typeof scope.ocValidate === "undefined") {
                        scope.ocValidate = ocValidators[attributes.ocValidate];
                    }

                    if (typeof scope.ocValidate === "string") {
                        switch (scope.ocValidate) {
                            case "ipaddr_list":
                                // a csv-separated list of ip addresses

                                var ipaddr_re = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
                                var addrs = value.split(',');
                                for (var addr in value.split(',')) {
                                    if (ipaddr_re.exec(addr.trim()) === null) {
                                        return false;           // this was not an ip addr
                                    }
                                }
                                return true;


                            case "vlan": //for required lan
                                return re_digits.exec(value) !== null && value > 0 && value <= 4094;

                            case "vxlan":
                                return re_digits.exec(value) !== null && value > 0 && value <= 16777215;

                            case "vlan_duplicate":
                                return duplicateVlanCheck(scope.ocValidateInvalid, value, scope.ocValidateInvalidSafekey);


                            case "intRange":
                                if (angular.isUndefined(scope.ocValidateRange) || scope.ocValidateRange.length != 2) {
                                    console.log("Invalid or missing oc-validate-range for intRange");
                                    return false;
                                }
                                return re_digits.exec(value) !== null && value >= scope.ocValidateRange[0] && value <= scope.ocValidateRange[1];


                            default:
                                //try to lookup the validator by name in the validators
                                scope.ocValidate = ocValidators[attributes.ocValidate] || ocValidators[scope.ocValidate];
                        }
                    }

                    if (typeof scope.ocValidate === "object" && scope.ocValidate) { // ocValidate is a regexp, exec it and we're done
                        return scope.ocValidate.exec(value) !== null;
                    }else if (typeof scope.ocValidate === "function") { // ocValidate is a function, call it and we're done
                        return scope.ocValidate(value);
                    } else {
                        console.log("Invalid ocValidate type:");
                        console.log(scope.ocValidate);
                    }

                };
            }
        };
    }]);

    /* errorSpan.html has two spans, one for "true" condition, and one for false (just a blank to occupy the
       same space the error msg would if it was shown).
    */
    helpers.directive('errorSpan', ['getKeyFromScope', function (getKeyFromScope) {
        return {
            restrict: "E",
            scope: {
                condition: "=",     // the condition to check; if true, show the text (error)
                conditionMap: "@",  // A condition that is mapped via an expression
                booleanCondition: "@", //A condition that is not a ngFormController
                nodirty: "=",
                text: "@"           // the text to show if condition is true
            },
            templateUrl: "components/errorSpan.html",
            link: function(scope, element, attributes) {
              if(scope.conditionMap) {
                scope.localCondition = getKeyFromScope(scope.conditionMap, scope.$parent);
              } else if(typeof attributes.booleanCondition !== 'undefined') {
                scope.isBoolean = true;
              }
            }
        };
    }]);
    var ipAddress = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    var ipv6Address = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    var multiple_ipAddress = /^\*$|^(?:\d|1?\d\d|2[0-4]\d|25[0-5])(?:\.(?:\d|1?\d\d|2[0-4]\d|25[0-5])){3}(?:\s*,\s*(?:\d|1?\d\d|2[0-4]\d|25[0-5])(?:\.(?:\d|1?\d\d|2[0-4]\d|25[0-5])){3})*$/;

    // This isn't a hostname in the true sense of the word. A true hostname does not include any domain or TLD info.
    // However, the colloquial use of 'hostname' (such as in "what is the hostname of the NTP server?") may mean a
    // hostname with or without domaind/subdomain/tld info. The latter is what this hostname is.

    var hostname = /^([A-Za-z0-9-]+\.)*[A-Za-z0-9-]+$/;
    var specific_hostname = /^(?=^.{1,254}$)(^(?:(?!\d+\.)[a-zA-Z0-9_\-]{1,63}\.?)+(?:[a-zA-Z]{2,})$)/;
    var imagename = /^([A-Za-z0-9-_]+\.)*[A-Za-z0-9-_]+$/;
    var ipaddr_hostname = new RegExp(ipAddress.toString().slice(1, ipAddress.toString().length-1) + "|" +  specific_hostname.toString().slice(1, specific_hostname.toString().length-1));
    var ipv6addr_hostname = new RegExp(ipAddress.toString().slice(1, ipv6Address.toString().length-1) + "|" +  hostname.toString().slice(1, hostname.toString().length-1));
    var port = /^0*(?:6553[0-5]|655[0-2][0-9]|65[0-4][0-9]{2}|6[0-4][0-9]{3}|[1-5][0-9]{4}|[1-9][0-9]{1,3}|[0-9])$/;
    // matching http(s)://<ipv4> or <hostname>(:<port>)
    var http_proxy = /^http(s?):\/\/((((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|([A-Za-z0-9-]+\.)*[A-Za-z0-9-]+)(:(6553[0-5]|655[0-2][0-9]|65[0-4][0-9]{2}|6[0-4][0-9]{3}|[1-5][0-9]{4}|[1-9][0-9]{1,3}|[0-9]))?$/;
    var url = /^http(s?):\/\/(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::\d+)?(?:\/?|[\/?]\S+)$/i;

    var convertIp4ToInt = function(ip) {
        if(typeof ip === 'number') {
          return ip;
        }
        var d = ip.split('.').map(function(p){return parseInt(p);});
        var n = d[0] * Math.pow(256,3);
        n += d[1] * Math.pow(256,2);
        n += d[2] * 256;
        n += d[3];
        return n;
    };
    helpers.constant('convertIp4ToInt', convertIp4ToInt);

    /**
     * get the individual ip int dictionary from ip_ranges, we stopped at 256 * 100
     * to prevent a large amount of ips.
     * Note: if user specifies too big of the ip range, it will not be able to
     * return the whole set
     *
     * @param ip_ranges an array like
     * ['1.2.3.4 - 1.2.3.5','1.2.3.9','1.2.3.11, 1.2.3.12']
     */
    var getIpIntSet = function (ip_ranges) {
        if(!angular.isDefined(ip_ranges)) {
            return {};
        }

        if(!Array.isArray(ip_ranges)) {
           return {};
        }

        var ip_set = {}; //use dict to act as an Set since Set has some issues on IE

        var ranges_array = ip_ranges;

        ranges_array.forEach(function(ip_range) {
            var is_range = false;
            if(ip_range && ip_range.indexOf('-') !== -1){
                is_range = true;
            }

            if(is_range) {
                var ips1 = ip_range.replace(/\s/g, '').split('-');
                var s_ip = ips1[0];
                var e_ip = ips1[1];
                var s_ip_num = convertIp4ToInt(s_ip);
                var e_ip_num = convertIp4ToInt(e_ip);

                // When users enter for example 1.2.3.4 - 2.3.4.5 which has about 16843009 ips
                // it could crash
                // For our purpose, we only need to have a handful IP here to check against min count.
                // so won't continue counting if the range is too big
                if ((e_ip_num - s_ip_num) > (256 * 100)) {
                    e_ip_num  = s_ip_num + (256 * 100); //make it stop at 256 * 100
                }

                for (var i = s_ip_num; i <= e_ip_num; i++) {
                    var ip = i + '';
                    if (!(ip in ip_set)) {
                        ip_set[ip] = 0; //just put the key there
                    }
                }
            }
            else { //deal with single ip or ip list
                var ips2 = ip_range.replace(/\s/g, '').split(',');
                for (var idx in ips2) {
                    var ip2 = convertIp4ToInt(ips2[idx]) + ''; //make it a string
                    if (!(ip2 in ip_set)) {
                        ip_set[ip2] = 0; //just put the key there
                    }
                }
            }
        });

        return ip_set;
    };

    /**
     * Simple way to get the count of how many IPv4 ips in the ranges, comma delimited ip list
     * or a single ip
     **/
    var getIpCountIpRanges = function(ip_ranges) {

        var total_count = 0;
        var ip_set = getIpIntSet(ip_ranges);

        total_count = Object.keys(ip_set).length;

        return total_count;
    };

    //expose for use elsewhere in the application
    helpers.constant('getIpCountIpRanges', getIpCountIpRanges);

    /**
     * this method check if the ips is in cidr range and it is not
     * in can_cidr range
     */
    var checkIpRanges= function(ip_ranges, cidr, can_cidr) {
        if(!cidr && !can_cidr) {
            return {'is_valid': true}; //nothing to check against
        }

        if (angular.isUndefined(ip_ranges)) { //for some reason it could be undefined
             return {'is_valid': true}; //nothing to check against
        }

        var ranges_array = ip_ranges;
        var result = true;

        var invalid_strings = '';
        var invalid_can_strings = '';
        var has_invalid = false;
        var has_can_invalid = false;

        for(var indx in ranges_array) {
            var is_range = false;
            var ip_range = ranges_array[indx];
            if(ip_range.indexOf('-') !== -1){
                is_range = true;
            }

            if (is_range) {
                var this_result = true;
                var this_can_result = true;
                var ips = ip_range.replace(/\s/g, '').split("-");
                if (cidr) {
                    this_result = isIpInSubnet(ips[0], cidr) && isIpInSubnet(ips[1], cidr);
                    if(!this_result) {
                        invalid_strings = invalid_strings +  ' ' + ip_range + ',';
                        has_invalid = true;
                    }
                }
                if (can_cidr) {
                    this_can_result = !isIpInSubnet(ips[0], can_cidr) && !isIpInSubnet(ips[1], can_cidr);
                    if(!this_can_result) {
                        invalid_can_strings = invalid_can_strings +  ' ' + ip_range + ',';
                        has_can_invalid = true;
                    }
                }
                result = result && this_result && this_can_result;
            }
            else { //ip or ip list
                var ips2 = ip_range.replace(/\s/g, '').split(',');
                for (var idx in ips2) {
                    var this_result2 = true;
                    var this_can_result2 = true;
                    if (cidr) {
                        this_result2 = isIpInSubnet(ips2[idx], cidr);
                        if(!this_result2) {
                            invalid_strings = invalid_strings +  ' ' + ips2[idx] + ',';
                            has_invalid = true;
                        }
                    }
                    if (can_cidr) {
                        this_can_result2 = !isIpInSubnet(ips2[idx], can_cidr);
                        if(!this_can_result2) {
                            invalid_can_strings = invalid_can_strings +  ' ' + ips2[idx] + ',';
                            has_can_invalid = true;
                        }
                    }
                    result = result && this_result2 && this_can_result2;
                }
            }
        }
        var retResult = {'is_valid': result};

        if (has_invalid) { //get rid of last ,
            invalid_strings = invalid_strings.substring(0, invalid_strings.length - 1);
            retResult.invalid_message = invalid_strings; //ips are not belong to cidr
        }

        if (has_can_invalid) { //get rid of last ,
            invalid_can_strings = invalid_can_strings.substring(0, invalid_can_strings.length - 1);
            retResult.invalid_can_message = invalid_can_strings; //ips conflict to can_cidr
        }

        return retResult;
    };

    var checkIpRangesValid = function(ip_ranges, cidr, can_cidr) {
        var result = checkIpRanges(ip_ranges, cidr, can_cidr);
        return result;
    };

    helpers.constant('checkIpRangesValid', checkIpRangesValid);

    var checkIpRangesNoOverlapValid = function(ip_ranges, origin_ip_ranges) {

        //nothing to check
        if (!angular.isDefined(ip_ranges) || !angular.isDefined(origin_ip_ranges)) {
            return true;
        }

        //if we don't have original ip ranges to check against
        if(origin_ip_ranges.length === 0) {
            return true;
        }

        var ipSet = getIpIntSet(ip_ranges);
        var originIpSet = getIpIntSet(origin_ip_ranges);
        var ipArray = (Object.keys(ipSet)).sort();
        var originIpArray = (Object.keys(originIpSet)).sort();

        for (var idx in ipArray) {
            var ip = ipArray[idx];
            if (originIpArray.indexOf(ip) !== -1) {
                return false; //not valid
            }
        }
        return true;//valid
    };

    helpers.constant('checkIpRangesNoOverlapValid', checkIpRangesNoOverlapValid);

    /**
     * Check if dcm ip ranges have at least 10
     **/
    var dcmIpRanges = function (ip_ranges) {
        //no check if it is dhcp
        if (ip_ranges.dhcp) {
            return true;
        }
        var ip_count = getIpCountIpRanges(ip_ranges);
        return ip_count >= 10;
    };

    /**
     * Check if bls ip ranges have at least 6
     **/
    var blsIpRanges = function (ip_ranges) {
        //no check if it is dhcp
        if (ip_ranges.dhcp) {
            return true;
        }
        var ip_count = getIpCountIpRanges(ip_ranges);
        return ip_count >= 6;
    };

    var isIpInSubnet = function (ip, subnet) {
        if((typeof ip === 'string' || typeof ip === 'number') && typeof subnet === 'string') {
          var ipInt = convertIp4ToInt(ip),
              subnetParts = subnet.split("/"),
              subnetInt = convertIp4ToInt(subnetParts[0]),
              subnetPrevix = parseInt(subnetParts[1]),
              mask = ((1<<(32-subnetPrevix))-1) ^ 0xFFFFFFFF;

              return ((ipInt ^ subnetInt) & mask) === 0;
        } else {
          return false;
        }
    };

    helpers.constant('re_digits', /^\d+$/);

    helpers.factory('duplicateVlanCheck', ['re_digits', function(re_digits) {
        return function(vlans, vlanId, safe) {

            var duplicateFound = false;

            //iterate over each, if they match and don't have the same key, reject the vlan_id
            //as a duplicate (checking the key is required so as not to reject something as a
            //duplicate of itself)
            angular.forEach(vlans, function(value, key){
                if(value && vlanId &&
                  vlans[key].toString() === vlanId.toString() &&
                  key !== safe) {
                    duplicateFound = true;
                }
            });

            return !duplicateFound && re_digits.exec(vlanId) !== null && vlanId > 0 && vlanId <= 4094;
        };
    }]);

    /*  Check if ip address in is subnet
     *  IPs expected in '1.2.3.4' format
     *  Subnet expected in '1.2.3.4/24' format
     */
    helpers.factory('ipInSubnet', ['convertIp4ToInt', function(convertIp4ToInt) {
      return isIpInSubnet;
    }]);

    helpers.constant('ocValidators', {

        // Some things can be validated with regexs:
        'ipAddress': ipAddress,
        'multiple_ipAddress': multiple_ipAddress,
        'hostname': hostname,
        'ipaddr_hostname': ipaddr_hostname,
        'port': port,

        'cidr': /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:3[0-2]|[1-2]?[0-9])$/,
        //address pools format 255.255.255.255-255.255.255,... Accepts 1..N address ranges or ip addresses list like 1.2.2.4 or 1.2.3.4, 4.4.5.6, 2.2.2.3
        'ipRange': /^(((?:(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\s*-\s*(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))$|^(?:(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\s*-\s*(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?),)+(?:(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\s*-\s*(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)))|((((?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))+,\s*)*(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)))$/,
        'vlanRange': /^(409[0-5]|40[0-8][0-9]|[1-3][0-9][0-9][0-9]|[0-9][0-9][0-9]|[0-9][0-9]|[0-9])\s*-\s*(409[0-5]|40[0-8][0-9]|[1-3][0-9][0-9][0-9]|[0-9][0-9][0-9]|[0-9][0-9]|[0-9])|(409[0-5]|40[0-8][0-9]|[1-3][0-9][0-9][0-9]|[0-9][0-9][0-9]|[0-9][0-9]|[0-9])$/,
        'macAddress': /^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$/,
        'boolean': /^(?:true|false)$/,
        'username': /^(?:(?![\[]|[\]]|[\"]|[\\]|[\/]|[\:]|[\;]|[\|]|[\=]|[,]|[+]|[*]|[\?]|[<]|[>]).)*$/,
        'required': /(?!^ +$)^.+$/,
        'fqdn': /^(?=^.{4,253}$)(^((?!-)[a-zA-Z0-9-]{0,62}[a-zA-Z0-9]\.)+[a-zA-Z]{2,63}$)|^(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9])\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9])$/,
        'email': /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]+$/,
        'int': /^\d+$/,
        'ipv6Address': ipv6Address,
        'ipv6addr_hostname': ipv6addr_hostname,
        'ldap_search_path': /^(?:(?:[A-Z][A-Z0-9]{0,63}=[^,]{1,64},)+[A-Z][A-Z0-9]{0,63}[^,]{1,64})$|^[A-Z][A-Z0-9]{0,63}=[^,]{1,64}$/i,
        'ldap_user_attribute': /^[a-zA-Z][a-zA-Z0-9]{0,254}$/,
        'http_proxy': http_proxy,
        'imagename': imagename,
        'url': url,
        'englishonly': /^[ \w!@#$%^&*()_.-]+$/,
        'englishonly_list': /^([ ]*[\w!@#$%^&*()_.-]){1,}(,[ ]*[\w!@#$%^&*()_.-]+)*$/,

        // others need some code (see directive ocValidate)

        'ipaddr_list': 'ipaddr_list',
        'vlan': "vlan",
        'vxlan': 'vxlan',
        'vlan_duplicate': "vlan_duplicate",
        'intRange': "intRange",     // requires oc-validate-range="[<start>, <end>]". <start> and <end> are both inclusive.
                                    // example: oc-validate="intRange" oc-validate-range="[1, 10]"

        'blsIpRangesValidator': blsIpRanges,
        'dcmIpRangesValidator': dcmIpRanges,

        'any': /.*/
    });

    helpers.factory('logout', ['$rootScope', '$http', '$location', '$cookieStore',
        function ($rootScope, $http, $location, $cookieStore) {
        return function () {
            // clear root scope auth items so UI displays login page
            $rootScope.auth_token = undefined;
            $rootScope.user_name = undefined;
            $rootScope.current_user = undefined; //updated in setting_drawer_controller
            // no auth error yet for auth page
            $rootScope.auth_error = false;
            // default header does not use the auth token now
            delete $http.defaults.headers.common["X-AUTH-TOKEN"];
            // delete the cookie for auth token
            $cookieStore.remove("auth_cookie");
            // clear existing notifications
            $rootScope.notification = undefined;
            $rootScope.notification_message = undefined;
            // redirect to the dashboard, causing login page to show
            $location.path("/login");
        };
    }]);

    helpers.factory('updateAuthCookie', ['$rootScope', '$cookieStore', '$http', 'log', 'addGlobalNotification',
        function ($rootScope, $cookieStore, $http, log, addGlobalNotification) {
        return function () {
            var auth_cookie = $cookieStore.get("auth_cookie");

            if (angular.isDefined(auth_cookie)) {
                var expire_at =auth_cookie.expires_at;
                var now = new Date();
                var expire = new Date(expire_at);

                // compare auth url between config file and one used for auth
                // if they changed then expire the tokens and force logout
                var config_auth_url = $rootScope.appConfig.bll_url;
                var cookie_auth_url = auth_cookie.bll_url;

                //expired or url doesn't match
                if (now > expire || !angular.equals(config_auth_url, cookie_auth_url)) {
                    // expired auth_token - clear values
                    $rootScope.auth_token = undefined;
                    $rootScope.user_name = undefined;
                    $cookieStore.remove("auth_cookie");
                    $rootScope.current_user = undefined; //updated in setting drawer controller

                    log("info", "Expired auth_token cookie (" + expire.toString() + ")");
                    delete $http.defaults.headers.common["X-AUTH-TOKEN"];

                    // clear message queue and indicate session expired
                    $rootScope.notification = undefined;
                    $rootScope.notification_message = undefined;
                    addGlobalNotification("warn", 'common.login_expired');
                }
                else {
                    // still valid, have to copy from cookie to rootScope and http header
                    $rootScope.auth_token = auth_cookie.token;
                    $rootScope.user_name = auth_cookie.user_name;
                    $http.defaults.headers.common["X-AUTH-TOKEN"] = $rootScope.auth_token;
                }
            } else {
                // cannot find cookie - clear values
                $rootScope.auth_token = undefined;
                $rootScope.user_name = undefined;
                $rootScope.notification = undefined;
                $rootScope.notification_message = undefined;
                $rootScope.current_user = undefined;
                log("info", "Cannot find auth_token cookie");
                delete $http.defaults.headers.common["X-AUTH-TOKEN"];
            }
        };
    }]);

    helpers.factory('log', ['$rootScope', '$log', function ($rootScope, $log) {
        return function (level, message) {
            // check if level in configured enabled logging levels
            // logging levels configured in opscon_config.json
            if ($rootScope.appConfig.console_logging.indexOf(level) >= 0) {
                switch (level) {
                    case "warn":
                        $log.warn(message);
                        break;
                    case "error":
                        $log.error(message);
                        break;
                    case "log":
                        $log.log(message);
                        break;
                    case "info":
                        $log.info(message);
                        break;
                    default:
                        $log.debug(message);
                }
            }
        };
    }]);

    helpers.factory('getKeyFromScope', ['$parse', function($parse) {
        return function(keyPath, thisScope) {
            return $parse(keyPath)(thisScope);
        };
    }]);


    helpers.constant('copyKeyFromScope', function (keyPath, sourceScope, targetScope) {
        var recursiveCopy = function (keyPath, source, target) {
            var splitPathArray = keyPath.split('.');
            if (splitPathArray.length > 1) {
                if (typeof targetScope[splitPathArray[0]] === 'undefined') {
                    targetScope[splitPathArray[0]] = sourceScope[splitPathArray[0]];
                }
                recursiveCopy(splitPathArray.slice(1).join(), source[splitPathArray[0]], target[splitPathArray[0]]);
            } else if (splitPathArray.length === 1) {
                target[splitPathArray[0]] = source[splitPathArray[0]];
            }
        };
        recursiveCopy(keyPath, sourceScope, targetScope);
    });

    helpers.constant('getStatusCssClass', function (status) {
        var statusCssClass = 'table_unknown_status';
        if (typeof status === 'string') {
            if (status.toUpperCase() === 'ERROR' ||
                status.toUpperCase() === 'CRITICAL' ||
                status.toUpperCase() === 'ALARM' ||
                status.toUpperCase() === 'DOWN') {
                statusCssClass = 'table_error_status';
            } else if (status.toUpperCase() === 'WARN' ||
                       status.toUpperCase() === 'WARNING') {
                statusCssClass = 'table_warn_status';
            } else if (status.toUpperCase() === 'OK' ||
                status.toUpperCase() === 'RUNNING' ||
                status.toUpperCase() === 'POWERED ON' ||
                status.toUpperCase() === 'UP') {
                statusCssClass = 'table_ok_status';
            } else if (status.toUpperCase() === 'IN_PROGRESS') {
                statusCssClass = 'table_progress_status';
            } else if (status.toUpperCase() === 'DONE') {
                statusCssClass = 'table_done_status';
            } else if (status.toUpperCase() === 'DISABLED') {
                statusCssClass = 'table_disabled_status';
            }
        } else if (typeof status === 'number'){
            if (status === 5 ||
                status === 6) {
                statusCssClass = 'table_error_status';
            } else if (status >= 1 && status <= 4) {
                statusCssClass = 'table_warn_status';
            } else if (status === 0) {
                statusCssClass = 'table_ok_status';
            }
        }

        return statusCssClass;
    });

    helpers.factory('getMonascaInstanceStatusString', ['$translate',function ($translate) {
        return function (status) {
            if(angular.isDefined(status) && angular.isDefined(status.host_alive_status)){
                if(status.host_alive_status === 4){
                    return {
                        code: status.host_alive_status,
                        description: status.host_alive_status_value_meta_detail,
                        status: status.host_alive_status_value_meta_detail
                    };
                } else {
                    return {
                        code: status.host_alive_status,
                        description: $translate.instant('common.instance.status.description.' + status.host_alive_status),
                        status: $translate.instant('common.instance.status.uistatus.' + status.host_alive_status)
                    };
                }
            } else {
                return {
                    code: -1,
                    description: $translate.instant('common.instance.status.description.-1'),
                    status: $translate.instant('common.instance.status.uistatus.-1')
                };
            }

        };
    }]);

    helpers.constant('getLocale', function (needCountryCode) {
        var locale = 'en-us';
        if(angular.isDefined(navigator.languages)) {
            locale = navigator.languages[0];
        }
        else {
            locale = navigator.browserLanguage;
        }

        if (locale === undefined) {
            locale = 'en-us';
        }

        if (angular.isDefined(needCountryCode) && needCountryCode === true) {
            return locale; //locale with country
        }

        return locale.split("-")[0];
    });

    helpers.factory('baseUrl', ['$location', function ($location) {
        return $location.protocol() + "://" + $location.host() + ":" + $location.port();
    }]);

    /* Do not use this constant directly, (unless you are FTI and $rootScope is not available). Instead,
     * use $rootScope.appConfig.bll_url directly.
     */
    helpers.constant('buildBllUrl', function () {
        if(angular.isDefined(window.appConfig) && angular.isDefined(window.appConfig.bll_url)){
            return  window.appConfig.bll_url;
        }

        return window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/api/v1/";
    });

    helpers.constant('getUniqueList', function(list) {
        var unique =  list.filter(function(elem, pos) {
            return list.indexOf(elem) == pos;
        });
        return unique;
    });

    helpers.factory('getBllHost', ['buildBllUrl', function(buildBllUrl){
        return function() {
            var bllHostUrl = buildBllUrl();
            var chopIndex = bllHostUrl.indexOf('//');
            bllHostUrl = bllHostUrl.substring(chopIndex + 2);
            chopIndex = bllHostUrl.indexOf(':');
            bllHostUrl = bllHostUrl.substring(0, chopIndex);
            return bllHostUrl;
        };
    }]);

    helpers.factory('loadConfig', ['$rootScope', 'buildBllUrl', function ($rootScope, buildBllUrl) {
        return function () {
            var defaultConfig = {
                bll_url: buildBllUrl(),
                default_route: "/summary",
                integerated_logging_url:"index.html#/dashboard/file/logstash.json",
                activity_feed_url :"#dashboard/file/activity",
                console_logging: ["warn", "error", "log", "info", "debug"]
            };

            var defaultVersion = {
                "version": "none",
                "build_time": "none",
                "sha": "none",
                "commit_date": "none"
            };

            $rootScope.appConfig = defaultConfig;
            if(angular.isDefined(window.appConfig)){
                for(var key in window.appConfig){
                    $rootScope.appConfig[key] = window.appConfig[key];
                }
            }

            $rootScope.build_info = angular.isDefined(window.appVersion) ? window.appVersion : defaultVersion;
        };
    }]);

    helpers.factory('getBrowserLanguage', ['$window', function($window) {
      return function() {
        var possibleBrowserLanguageNames = ['languages', 'browserLanguage', 'systemLanguage', 'userLanguage'],
            nav = window.navigator,
            lang;

        for(var ii=0;ii<possibleBrowserLanguageNames.length;ii++) {
          var this_entry = nav[possibleBrowserLanguageNames[ii]];
          if(this_entry) {
            if(Array.isArray(this_entry)) {
              lang = this_entry[0];
            } else if(typeof this_entry === 'string') {
              lang = this_entry;
            }
          }
          if(lang) {
            break;
          }
        }
        if(!lang && nav.language) {
          return nav.language;
        } else {
          return lang;
        }
      };
    }]);

    helpers.factory('$moment', ['getBrowserLanguage', '$window', function(getBrowserLanguage, $window) {
      var _moment = $window.moment,
          lang = getBrowserLanguage();
      _moment.locale(lang);
      return _moment;
    }]);

    // checks for a level of info, warn, or other and adds to notification queue.  Other defaults to red.
    helpers.factory('addNotification', ['$rootScope', '$translate', 'log', 'isUndefined', 'clearNotifications', '$moment',
        function ($rootScope, $translate, log, isUndefined, clearNotifications, $moment) {
            return function (level, message, action) {
                if (isUndefined($rootScope.notification)) {
                    clearNotifications();
                }
                var time = '[' + $moment().format('L') + ' - ' + $moment().format('H:mm:ss') + ']';
                switch (level) {
                    case "info":
                        $rootScope.notification.message_queue.push({        // "unshift()" to add to beginning
                            color: 'toast-green',
                            level: level,
                            message: time + " " + $translate.instant(message),
                            status: "new",
                            action: action
                        });
                        log("info", "Notification: " + $translate.instant(message));
                        break;
                    case "warn":
                        $rootScope.notification.message_queue.push({
                            color: 'toast-yellow',
                            level: level,
                            message: time + " " + $translate.instant(message),
                            status: "new",
                            action: action
                        });
                        log("warn", "Notification: " + $translate.instant(message));
                        break;
                    default: // error, etc.
                        $rootScope.notification.message_queue.push({
                            color: 'toast-red',
                            level: level,
                            message: time + " " + $translate.instant(message),
                            status: "new",
                            action: action
                        });
                        log("error", "Notification: " + $translate.instant(message));
                }
                $rootScope.notification.message_stats.new += 1;

                // set current index to last added message
                $rootScope.notification.current_index = $rootScope.notification.message_queue.length - 1;
                $rootScope.notification_message = $rootScope.notification.message_queue[$rootScope.notification.current_index];
            };
        }]);

    // checks for a level of info, warn, or other and adds to notification queue.  Other defaults to red.
    helpers.factory('addGlobalNotification', ['$rootScope', '$translate', 'log', 'isUndefined', function($rootScope, $translate, log, isUndefined) {
        return function(level, message){
            if(isUndefined($rootScope.global_notification)) {
                $rootScope.global_notification = {
                    message_queue: [],
                    current_index: 0
                };
                $rootScope.global_notification_message = null;
            }

            switch(level) {
                case "info":
                    $rootScope.global_notification.message_queue.push({color:'toast-green', message: $translate.instant(message)});
                    log("info", "Notification: " + $translate.instant(message));
                    break;
                case "warn":
                    $rootScope.global_notification.message_queue.push({color:'toast-yellow', message: $translate.instant(message)});
                    log("warn", "Notification: " + $translate.instant(message));
                    break;
                default: // error, etc.
                    $rootScope.global_notification.message_queue.push({color:'toast-red', message: $translate.instant(message)});
                    log("error", "Notification: " + $translate.instant(message));
            }
            // set current index to last added message
            $rootScope.global_notification.current_index = $rootScope.global_notification.message_queue.length - 1;
            $rootScope.global_notification_message = $rootScope.global_notification.message_queue[$rootScope.global_notification.current_index];
        };
    }]);

    helpers.factory('clearGlobalNotifications', ['$rootScope', function($rootScope) {
        return function(level, message){
            $rootScope.global_notification = {
                message_queue: [],
                current_index: 0
            };
            $rootScope.global_notification_message = null;
        };
    }]);

    // Mark all notifications as "not new"
    helpers.factory('markNotificationsRead', ['$rootScope', 'isUndefined', function ($rootScope, isUndefined) {
        return function (level) {
            if (isUndefined($rootScope.notification)) {
                return;
            }
            angular.forEach($rootScope.notification.message_queue, function (item) {
                item.status = "";
            });
            $rootScope.notification.message_stats.new = 0;
        };
    }]);

    // remove all notifications
    helpers.factory('clearNotifications', ['$rootScope', function ($rootScope) {
        return function (level) {
            $rootScope.notification = {
                message_queue: [],
                message_stats: {"new": 0},
                current_index: 0
            };
            $rootScope.notification_message = null;
        };
    }]);



    // checks for a level of info, warn, or other and adds to notification queue.  Other defaults to red.
    helpers.factory('addRecommendation', ['$rootScope', 'isUndefined', function ($rootScope, isUndefined) {
        return function (messagekey, url, done) {
            if (!isUndefined(messagekey) && !isUndefined(url)) {
                done = done || false;
                $rootScope.$broadcast('addRecommendationEvent', {messageKey: messagekey, url: url, done: done});
            }

        };
    }]);

    // checks for a level of info, warn, or other and adds to notification queue.  Other defaults to red.
    helpers.factory('remRecommendation', ['$rootScope', 'isUndefined', function ($rootScope, isUndefined) {
        return function (messagekey, url, done) {
            if (!isUndefined(messagekey) && !isUndefined(url)) {
                done = done || false;
                $rootScope.$broadcast('remRecommendationEvent', {messageKey: messagekey, url: url, done: done});
            }

        };
    }]);


    helpers.factory('Base64', function() {

        var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

      // private method for UTF-8 encoding
      function _utf8_encode(string) {
          string = string.replace(/\r\n/g,"\n");
          var utftext = "";

          for (var n = 0; n < string.length; n++) {

              var c = string.charCodeAt(n);

              if (c < 128) {
                  utftext += String.fromCharCode(c);
              }
              else if((c > 127) && (c < 2048)) {
                  utftext += String.fromCharCode((c >> 6) | 192);
                  utftext += String.fromCharCode((c & 63) | 128);
              }
              else {
                  utftext += String.fromCharCode((c >> 12) | 224);
                  utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                  utftext += String.fromCharCode((c & 63) | 128);
              }
          }

          return utftext;
      }

      // private method for UTF-8 decoding
      function _utf8_decode(utftext) {
          var string = "";
          var i = 0;
          var c, c1, c2, c3;
          c = c1 = c2 = c3 = 0;

          while ( i < utftext.length ) {

              c = utftext.charCodeAt(i);

              if (c < 128) {
                  string += String.fromCharCode(c);
                  i++;
              }
              else if((c > 191) && (c < 224)) {
                  c2 = utftext.charCodeAt(i+1);
                  string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                  i += 2;
              }
              else {
                  c2 = utftext.charCodeAt(i+1);
                  c3 = utftext.charCodeAt(i+2);
                  string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                  i += 3;
              }
          }
          return string;
      }

      function encode(input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = _utf8_encode(input);

        while (i < input.length) {
          chr1 = input.charCodeAt(i++);
          chr2 = input.charCodeAt(i++);
          chr3 = input.charCodeAt(i++);

          enc1 = chr1 >> 2;
          enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
          enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
          enc4 = chr3 & 63;

          if (isNaN(chr2)) {
              enc3 = enc4 = 64;
          } else if (isNaN(chr3)) {
              enc4 = 64;
          }

          output = output +
          _keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
          _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
        }

        return output;
      }


      function decode(input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {
          enc1 = _keyStr.indexOf(input.charAt(i++));
          enc2 = _keyStr.indexOf(input.charAt(i++));
          enc3 = _keyStr.indexOf(input.charAt(i++));
          enc4 = _keyStr.indexOf(input.charAt(i++));

          chr1 = (enc1 << 2) | (enc2 >> 4);
          chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
          chr3 = ((enc3 & 3) << 6) | enc4;

          output = output + String.fromCharCode(chr1);

          if (enc3 != 64) {
              output = output + String.fromCharCode(chr2);
          }
          if (enc4 != 64) {
              output = output + String.fromCharCode(chr3);
          }
        }

        output = _utf8_decode(output);
        return output;
      }

      return {
        encode : encode, // public method for encoding
        decode : decode // public method for decoding
      };

    });

    /**
     * utility to generate guid
     * We need to be able to generate a transaction uuid
     * based on answer here: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
     */
    helpers.factory('genUUID', function() {
        function generate() {
            function bytes() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            return bytes() + bytes() + '-' + bytes() + '-' + bytes() + '-' +
                bytes() + '-' + bytes() + bytes() + bytes();
        }

        return generate;
    });

    helpers.factory('chars', function() {
      var chars = "abcdefghijklmnopqrstuvwxyz";
      return (chars + chars.toUpperCase()).split("");
    });

    /**
     * utility to generate a random string
     */
    helpers.factory('genRandomString', ['chars', function(chars) {
        function generate(n) {
            var result = "";
            for(var i =0;i<n;i++) {
                result += chars[Math.floor(Math.random() * chars.length)];
            }
            return result;
        }

        return generate;
    }]);

     /**
     * utility to return a ISO date string like
     * 2015-07-29T16:50:20.000Z minus timeToGoBack
     * timeToBack is like 60000 (1 minute)
     */
    helpers.factory('getTimeToGoBackISODateStr', function() {
        function getDateTimeString(timeToGoBack) {
            if (angular.isUndefined(timeToGoBack)){
                return '';
            }

            var now_utc = (new Date()).getTime();
            var backtime_utc = now_utc - Number(timeToGoBack);

            return (new Date(backtime_utc).toISOString());
        }
        return getDateTimeString;
    });

    /*
    // utility to filter raw alarm count data into a useful json object
    // input: the .data subobject that alarmCount provides on succesful return
    // outputs: json object that contains a services and hostnames list of counts
    // EX: { hostname: {
                    count: {
                        critical: 0
                        ok: 1
                        total: 1
                        unknown: 0
                        warning: 0
                    }
                    apprentice-ccp-ca-ma-mgt: {
                        critical: 0
                        ok: 1
                        total: 1
                        unknown: 0
                        warning: 0
                    }
                }
            }
    */
    helpers.factory('filterAlarmCount', function() {
        function filterAlarmCount(unfilteredList) {
            // this parsing maybe either simpl or hard.
            var simple = false;
            //create a count section in the list somewhere
            var templateCount = function() {
                return { total : 0, ok : 0, warning : 0, critical : 0, unknown : 0 };
            };

            //template for the list
            var list = {};
            var columnTypes = unfilteredList.columns.toString();
            unfilteredList = unfilteredList.counts;

            if(columnTypes.indexOf('dimension_name') !== -1) {
                list.service = {count: templateCount()};
                list.hostname = {count: templateCount()};
            }
            else {
                list = templateCount();
                simple = true;
            }

            //used for counting
            var metricName = '';
            var count = 0;
            var target;

            //tricky counting of state + severity, genric call
            var countUIState = function(filter, idx) {
                //the name of entry in the json object

                //did we find an entry that falls under this filter?
                if(unfilteredList[idx][1] == filter) {

                    //the target for counting
                    target = list[filter];

                    //get metric name and make an entry if it doesnt exist yet
                    metricName = unfilteredList[idx][2];
                    if(!target[metricName])
                        target[metricName] = templateCount();

                    //add to total entry
                    target.count.total += count;
                    target[metricName].total += count;

                    // determine ui_status value of this alarm and update  proper sub-total
                    switch ( unfilteredList[idx][3] ) {
                        //add to ok entry
                        case 'OK':
                            target[metricName].ok += count;
                            target.count.ok += count;
                            break;
                        //add to undetermined entry
                        case 'UNDETERMINED':
                            target[metricName].unknown += count;
                            target.count.unknown += count;
                            break;
                        //now find out if its a critical or warning
                        case 'ALARM':
                            //add to warning entry
                            if(unfilteredList[idx][4] === "LOW" ||
                                unfilteredList[idx][4] === "MEDIUM") {
                                    target[metricName].warning += count;
                                    target.count.warning += count;
                                }
                            //add to critical entry
                            else {
                                target[metricName].critical += count;
                                target.count.critical += count;
                            }
                            break;
                    }//end ui_status switch
                }//end service check
            };

            if(simple) {
                for(var idx in unfilteredList) {
                    count = unfilteredList[idx][0];
                    list.total += count;
                    switch (unfilteredList[idx][1]) {
                        case 'OK':
                            list.ok += count;
                            break;
                        case 'UNDETERMINED':
                            list.unknown += count;
                            break;
                        case 'ALARM':
                            if(unfilteredList[idx][2] === "LOW" ||
                                unfilteredList[idx][2] === "MEDIUM") {
                                    list.warning += count;
                            }
                            else {
                                list.critical += count;
                            }
                            break;
                    }
                }
            }
            else {
                for(var idx2 in unfilteredList) {
                    count = unfilteredList[idx2][0];
                    //count services
                    countUIState('service', idx2);
                    //count hostnames
                    countUIState('hostname', idx2);
                }
            }

            return list;
        }

        return filterAlarmCount;
    });

    /**
     * utility to check if the lastCheck is within the time
     * time could be like 60000 which is within last minute
     * lastCheck string is like 2015-07-29T16:50:20.000Z
     */
    helpers.factory('isLastCheckWithinTimeRange', function() {
        function check(lastestRefreshTime, lastCheck, timeToCheck) {
            if (angular.isUndefined(timeToCheck)){
                return true;
            }
            if (angular.isUndefined(lastCheck)){
                return false;
            }

            var end_utc = 0;
            if (angular.isUndefined(lastestRefreshTime) || lastestRefreshTime === '...') {
                var newDate = new Date();
                end_utc = newDate.getTime();
            }
            else {
                var endDate = lastestRefreshTime;
                end_utc = Date.parse(endDate);
            }

            var start_utc = end_utc - Number(timeToCheck);
            var input_utc = Date.parse(lastCheck);

            if (input_utc >= start_utc && input_utc < end_utc) {
                return true;
            }

            return false;
        }
        return check;
    });

    /**
     * utility to  get start update time based latestRefreshTime - timeToCheck
     * timeToCheck could be like 60000 which is within last minute
     */
    helpers.factory('getStartUpdateTimeISODateString', function() {
        function check(latestRefreshTime, timeToCheck) {
            if (angular.isUndefined(timeToCheck)){
                timeToCheck = 60000;
            }

            var end_utc = 0;
            if (angular.isUndefined(latestRefreshTime) || latestRefreshTime === '...') {
                var newDate = new Date();
                end_utc = newDate.getTime();
            }
            else {
                var endDate = latestRefreshTime;
                end_utc = Date.parse(endDate);
            }

            var start_utc = end_utc - Number(timeToCheck);

            return (new Date(start_utc).toISOString());
        }
        return check;
    });

    /**
     * constants for time selections in milliseconds
     */
    helpers.constant('ocTimeSelections', {
        'ONE_MINUTE': 60000,
        'FIVE_MINUTES': 300000,
        'FIFTEEN_MINUTES': 900000,
        'THIRTY_MINUTES': 1800000,
        'ONE_HOUR': 3600000,
        'TWO_HOURS': 7200000,
        'FOUR_HOURS': 14400000,
        'EIGHT_HOURS': 28800000
    });

    /**
     * utility to convert a dimensions object which has data like
     * "{"process_name":"mysqld","hostname":"mini-mon","service":"monitoring"}"
     * string will be like proccess_name=mysqld,hostname=mini-mon,service=monitoring
     */
    helpers.factory('dimObjToStr', function() {
        function convert(dimObj, delimiter) {
            if (angular.isUndefined(dimObj)){
                return '';
            }

            var str = '';
            for (var p in dimObj) {
                if (dimObj.hasOwnProperty(p)){
                    if (angular.isDefined(delimiter)) {
                        str += p + delimiter + dimObj[p] + ',' + '\n';
                    }
                    else {
                        str += p + '=' + dimObj[p] + ',' + '\n';
                    }
                }
            }
            var retStr = str.length === 0 ? '' : str.substring(',', str.length - 2);

            return retStr;
        }
        return convert;
    });

    /**
     * utility to convert a measurement object which has data like
     * {"rc": "404","error": "Not Found"}
     * string array will be like :
     * rc:404
     * error:Not Found
     */
    helpers.factory('measObjToStrArray', function() {
        function convert(measObj) {
            if (angular.isUndefined(measObj)){
                return '';
            }

            return Object.keys(measObj).map(function(key) {
                return key + ':' + measObj[key];
            });
        }
        return convert;
    });

    /**
     * utility to make the line of dimension string
     * proccess_name=mysqld,hostname=mini-mon,service=monitoring to break
     * html strings
     */
    helpers.factory('renderLineOfDimension', function() {
        function render(data) {
            if (angular.isUndefined(data) || angular.isUndefined(data.dimension)){
                return '';
            }
            var dimStr = data.dimension;
            dimStr = dimStr.replace(/(\r\n|\n|\r)/gm,"");
            var htmlStr = dimStr.split(",").join(",<br />");
            return htmlStr;
        }
        return render;
    });

    /**
     * bllApiRequest class provides a method to make an asynchronous API request to the BLL.
     *
     * methods:
     *  get - make a "get" request
     *  put - make a "put" request
     *  post - make a "post" request
     *  delete - make a "post" request
     *
     * paramaters:
     *  serviceName - The name of the service that the request is for
     *  data - API request data
     *  options.filter - *Optional* - The filter object to be added to the request
     *  options.sort - *Optional* - The sort object to be added to the request
     *  options.page - *Optional* - The page object to be added to the request
     *  options.txn_id - *Optional* - The transaction to query status of
     *  options.maxRetry - *Optional* - The max retry count to use
     *  options.region - *Optional* - The region to direct the request to
     *
     *
     *  Returns - a $q deferred promise. This can be used with "then()" to
     *  have one of 3 functions called:
     *
     *    "answer" - this function is called when the API call completes successfully and is passed
     *               the data object returned from the API call
     *
     *    "error"  - this function is called if an error occurs (i.e. the BLL
     *               returns a status code other than 2xx). It is passed an object containing
     *                 .statusCode - the HTTP status code
     *                 .message    - a textual message with more information about the error.
     *
     *   "progress" - this function is called periodically while the API call is in progress.
     *                It is passed an object containing:
     *                 .percentComplete - A percentage (1-99) of completeness of the call
     *                 .statusLines[] - An array of strings of status lines. This are cumulative and could
     *                                  be something like the output lines of a script being run by the BLL.
     */

    /*
     // Sample usage:
     api_test = function() {
     var req;
     req = {
     page: {start_index: 0, page_size: 10},
     sort: {key: 'id'},
     payload: {username: "admin", password: "coffee"}
     };

     bllApiRequest.get("host_manager", req).then (
     function(data) {
     console.log("------------------------------------------------- COMPLETE");
     },
     function(error_data) {
     console.log("------------------------------------------------- ERROR" + error_data);
     },
     function(progress_data) {
     console.log("------------------------------------------------- IN PROGRESS: " + progress_data.progress.percentComplete)
     }

     );
     };
     */
    helpers.factory('bllApiRequest', ['$rootScope', '$http', '$q', '$timeout', 'isUndefined', 'loadConfig', 'logout',
                                      'addGlobalNotification', 'addNotification', '$interval','buildBllUrl', '$translate', 'bllApiRequestCache',
        function ($rootScope, $http, $q, $timeout, isUndefined, loadConfig, logout, addGlobalNotification,
                  addNotification, $interval, buildBllUrl, $translate, bllApiRequestCache) {
        var make_request = function (target, action, data, options) {

            var filter, sort, page, txn_id, parmMaxRetry, region;
            if(options) {
              filter = options.filter;
              sort = options.sort;
              page = options.page;
              txn_id = options.txn_id;
              parmMaxRetry = options.maxRetry;
              region = options.region;
            }

            var request_interval;
            var retryCount = 0;
            var notFoundCount = 0;

            // default retries, if not specified
            var defaultMaxRetry = 120;
            var maxRetry = parmMaxRetry || defaultMaxRetry;

            var intervalTime = 1;

            /*
             * Send the actual BLL API request. Note that this is a _Javascript closure_, i.e. this inner function
             * is passed to $timeout, but since it is inside another function, the outer function's scope variables
             * (bllUrl and httpReq) get carried along "with" this inner function and so will still contain their
             * original values when $timeout calls this function - black magic!
             */
            function send_BLL_request() {
                var jobStatusReq;
                if(httpReq.job_status_request) {
                  jobStatusReq = {
                    job_status_request: httpReq.job_status_request,
                    txn_id: httpReq.txn_id
                  };
                }
                $http({
                    method: 'POST',
                    url: bllUrl,
                    data: jobStatusReq || httpReq,
                    timeout: 60 * 1000 //one minute timeout
                })
                    .success(function (data, status, headers, config) {
                        // The HTTP request was successful. Check for the the status sent by the BLL

                        if(!httpReq.txn_id) {
                          httpReq.txn_id = data.txn_id;
                        }

                        if (data.status === "inprogress" || data.status === "not_found") {

                            if (data.status === "inprogress") {
                                // set request_interval only when inprogess
                                // NOT_FOUND will not return interval
                                request_interval = data.recommendedPollingInterval || 1;
                                //adjust the max retry based on recommendedPollingInterval
                                if(request_interval > 1 && maxRetry === defaultMaxRetry) {
                                  maxRetry = Math.ceil(maxRetry / request_interval);
                                }
                                // Reset the counter
                                retryCount = 0;
                                // Call the promise "notify" callback with the current progress
                                deferred.notify(data);
                            }

                            // The backend is waiting for a message to appear, it may never appear.
                            // It is like bigfoot elusive and hand to spot.
                            if(data.status === "not_found") {
                                retryCount += 1;
                                notFoundCount += 1;
                                request_interval = 10;//make it go slow to send the request
                            }

                            if(maxRetry === 0 || retryCount <= maxRetry) {
                              // The progress is not complete yet, make the request again shortly using
                              // the polling interval suggest by the BLL. (request_interval is in seconds)
                              httpReq.job_status_request = true;
                              $timeout(send_BLL_request, request_interval*1000);
                            } else {
                              // We have exhausted our recources and never saw even a glimpse of bigfoot.
                              // (we reached max retry)
                              deferred.reject("Max retry reached: " + retryCount);
                            }

                        } else if (data.status === "error") {

                          /* If the BLL service we are calling cannot connect to the actual service (because, for example, some services
                           * only run on MA1 so if MA1 is down, the service is unavailable), log a helpful message.
                           */
                          if (JSON.stringify(data).indexOf("Connection aborted") > 0) {
                              addNotification('error', $translate.instant('common.ma_connection_error'));
                          }

                          //BLL says that this failed
                          data.statusCode = status;
                          deferred.reject(data);
                        } else if (data.status === "warning") {

                          //BLL says that this is a warning
                          data.statusCode = status;
                          deferred.reject(data);
                        } else if (data.status === "complete") {

                            // call the promise "success" callback with the response data
                            deferred.resolve(data);
                        } else {
                            console.error("BLL returned unknown status type: " + data.status);
                            console.error(JSON.stringify(data));
                            deferred.reject(data);
                        }
                    })
                    .error(function (data, status, headers, config) {

                        // Something didn't go right with the BLL call.

                        console.error("BLL returned status " + status);
                        console.error(JSON.stringify(data));

                        if(status === 401 ||
                           (angular.isDefined(data) && (typeof data === 'string') && data.indexOf('HTTP 401') > 0)) {
                          if(!window.patchingInProgress) {
                            logout();
                          }
                        }
                        else {
                          // The caller should handle this error, so an additional notification is not needed
                          if ($rootScope.appConfig.dev_mode) {
                            addNotification("warn", 'Backend error: ' + status + ' (' + (typeof data === 'string' ? data : JSON.stringify(data)) + ')');
                            if(data === null && status === 0) {
                              console.error('---- There may be a connectivity issue. ----');
                            }
                          }
                          if(!data) {
                            data = {};
                          }
                          if (typeof data !== 'string') {
                              data.statusCode = status;
                          }
                          deferred.reject(data);
                        }
                    });
            }

            if(!ng.isDefined($rootScope.appConfig)){
                loadConfig();
            }

            var bllUrl = $rootScope.appConfig.bll_url + "bll/";

            var deferred = $q.defer();

            var httpReq = {
                target: target,
                action: action,
                region: region,
                data: data,
                filter: filter,
                sort: sort,
                page: page
            };

            if(txn_id) {
              httpReq.txn_id = txn_id;
            }

            var is_ea_deploy = data.operation === 'deploy_ea';

            if(bllApiRequestCache.isPending(httpReq)) {
              return bllApiRequestCache.getPending(httpReq);
            } else {
              bllApiRequestCache.addPending(httpReq, deferred.promise);
              send_BLL_request();
              // Return the promise to the caller
              return deferred.promise;
            }
        };

        var get_request_function = function (action) {
            return function (target, data, options) {
                return make_request(target, action, data, options);
            };
        };

        return {
            get: get_request_function("GET"),
            post: get_request_function("POST"),
            put: get_request_function("PUT"),
            delete: get_request_function("DELETE"),
            patch: get_request_function("PATCH")
        };
    }]);

    helpers.factory('authrequest',
        ['$rootScope', '$http', '$location', '$translate', 'isUndefined', 'log', 'addNotification',
         '$cookieStore', 'clearGlobalNotifications', 'logout', '$q', 'buildBllUrl',
        function($rootScope, $http, $location, $translate, isUndefined, log, addNotification,
                 $cookieStore, clearGlobalNotifications, logout, $q, buildBllUrl) {

            return function (username, pass) {
                var deferred = $q.defer();

                // base url to connect to the cloud system bll
                var bll_url = buildBllUrl();

                //init first
                $rootScope.notification = undefined;
                $rootScope.notification_message = undefined;
                $rootScope.auth_token = undefined;
                $rootScope.user_name = undefined;

                $http({
                    url: bll_url + "auth_token",
                    method: 'POST',
                    data: {username: username, password: pass},
                    headers: {'Content-Type': 'application/json'}
                }).success(function (data, status, headers, config) {
                    if (!angular.isUndefined(data)) {

                        var expires = new Date(data.expires);

                        log("info", "User:         " + username);
                        log("info", "Expires at:   " + expires.toString());

                        $rootScope.auth_token = data.token;
                        $rootScope.user_name = username;

                        // store the user, token, bll_url, expiration in auth cookie for page refresh
                        var auth_cookie = {
                            "token": data.token,
                            "expires_at": data.expires,
                            "user_name": username,
                            "bll_url": bll_url
                        };
                        //put the auth_cookie in cookie store
                        $cookieStore.put('auth_cookie', auth_cookie);

                        // default header uses the auth token
                        $http.defaults.headers.common["X-AUTH-TOKEN"] = $rootScope.auth_token;

                        clearGlobalNotifications();

                        // redirect to the dashboard
                        if ($location.$$search.redirect) {
                            var oldSearch = $location.$$search;
                            var redirect = $location.$$search.redirect;
                            delete oldSearch.redirect;
                            $location.path(redirect).search(oldSearch);
                        } else {
                            $location.path("/");
                        }
                        deferred.resolve();
                    }
                    else {
                        var msg = $translate.instant('common.login.empty_data_error');
                        //cleanup the auth info in $rootScope
                        logout();
                        deferred.reject(msg);
                    }
                }).error(function (data, status, headers, config) {
                    //cleanup the auth info in $rootScope
                    logout();
                    var msg = $translate.instant('common.login_error');
                    if(data === null && status === 0) {
                        msg = $translate.instant('common.connectivity_problem');
                    }
                    deferred.reject(msg);
                });

                return deferred.promise;
            };
        }
    ]);

    helpers.factory('bllApiRequestCache', ['$timeout', '$rootScope', function($timeout, $rootScope) {
      var cache = {};

      //periodic checks, remove resolved promises
      if ($rootScope.appConfig && !$rootScope.appConfig.protractor_testing) {
        $timeout(function() {
          angular.forEach(cache, function(promise, key) {
            if(promise.$$state.status === 1) {
              delete cache[key];
            }
          });
        },60*1000);
      }

      this.isPending = function(req) {
        var hash = objectHash(req);
        //status 0 (pending), 1 (resolved);
        var result = cache[hash] && cache[hash].$$state.status === 0;
        if(!result) {
          delete cache[hash];
        }
        return result;
      };

      this.addPending = function(req, promise) {
        var hash = objectHash(req);
        cache[hash] = promise;
      };

      this.getPending = function(req) {
        var hash = objectHash(req);
        return cache[hash];
      };

      return this;
    }]);

    helpers.directive('matches', function() {
      return {
        require: "ngModel",
        restrict: "A",
        scope: {
          otherValue: "=matches"
        },
        link: function(scope, element, attributes, ngModel) {
          ngModel.$validators.matches = function(modelValue) {
            return modelValue === scope.otherValue;
          };

          scope.$watch("otherValue", function() {
            ngModel.$validate();
          });
        }
      };
    });

    helpers.constant('getUniqueList', function(list) {
        var unique =  list.filter(function(elem, pos) {
            return list.indexOf(elem) == pos;
        });
        return unique;
    });

    helpers.factory('loadAllMetrics', ['$q', 'bllApiRequest', 'addNotification', 'log', '$translate', function($q, bllApiRequest, addNotification, log, $translate) {
      var loadedMetrics;
      return function() {
        var deferred = $q.defer(),
           req = {operation: 'metric_names'};
        //if the metrics have not bee loaded, or are more than 1 hour old
        bllApiRequest.get('monitor', req).then(function(res) {
          var metrics = res.data,
          metricNames = metrics.map(function(metric) {
            return metric.name;
          });
          deferred.resolve(metricNames);
        }, function(err) {
            addNotification(
                "error",
                $translate.instant("alarm.metrics.error"));
            log('error', 'Failed to get metrics names list' + JSON.stringify(err));
            deferred.reject(err);
        });
        return deferred.promise;
      };
    }]);

    helpers.factory('loadDimensions', ['bllApiRequest', '$q', 'addNotification', 'log', '$translate', function(bllApiRequest, $q, addNotification, log, $translate) {
      return function(metric) {
        var deffered = $q.defer(),
        req = {
          operation: 'metric_list',
          name: metric
        };
        bllApiRequest.get('monitor', req).then(function(res) {
          var dimensions = {};
          res.data.forEach(function(metric) {
            var metric_dimensions = metric.dimensions;
            angular.forEach(metric_dimensions, function(did_value, did_key) {
              if(!Array.isArray(dimensions[did_key])) {
                dimensions[did_key] = [];
              }
              if(dimensions[did_key].indexOf(did_value) === -1) {
                dimensions[did_key].push(did_value);
              }
            });
          });
          deffered.resolve({
            allMetrics: res.data,
            dimensions: dimensions
          });
        },function(err) {
          addNotification(
              "error",
              $translate.instant("alarm.dimensions.error"));
          log('error', 'Failed to get metrics list with ' + metric + ' ' + JSON.stringify(err));
          deffered.reject(err);
        });
        return deffered.promise;
      };
    }]);

    helpers.constant('generateDimensionsForSelection', function(currentDimensionScope) {
      var dimensions = [];

      angular.forEach(currentDimensionScope, function(value, key) {
        value.forEach(function(inner_value) {
          dimensions.push({
            key: key,
            value: inner_value,
            '$canSelect': true,
            '$matchBy': false
          });
        });
      });
      return dimensions;
    });

    helpers.constant('generateMatchByFromDimensions', function(currentDimensions, currentMatchBys) {
        var matchBys = [];
        var matchByExclusionKeys = [];

        angular.forEach(currentDimensions, function(value) {
            //if a row is selected, do not allow it to be in the matchby set
            if(value.$rowSelected && (matchByExclusionKeys.indexOf(value.key) === -1)){
                matchByExclusionKeys.push(value.key);
                if(matchBys.indexOf(value.key) !== -1){
                    //if the key was previously added to the matchBys, remove it
                    matchBys.splice(matchBys.indexOf(value.key), 1);
                }
            } else if(matchByExclusionKeys.indexOf(value.key) === -1 && matchBys.indexOf(value.key) === -1){
                //the row isnt selected, and the key isnt already in the array
                matchBys.push(value.key);
            }
        });

        var i = 0, index;
        var fullMatchByModelObjs = [];
        if(angular.isDefined(currentMatchBys)){
            for(i = currentMatchBys.length - 1; i >= 0 ; i--){
                //if the key is IN the exclusion list, or NOT in the inclusion list, remove the element
                if(matchByExclusionKeys.indexOf(currentMatchBys[i].key) !== -1 ||
                   matchBys.indexOf(currentMatchBys[i].key) === -1){
                    //remove the entry from currentMatchBys
                    currentMatchBys.splice(i,1);
                }
            }

            fullMatchByModelObjs = currentMatchBys;

            //avoid duplicates later by removing from the matchbys list any that are already
            //in the list
            //easier to do here than in the for loop below since fullMatchByModelObjs contains objects
            //while matchBys is a simple array of strings that can be searched with indexOf
            for (i = 0; i < fullMatchByModelObjs.length; i++) {
                index = matchBys.indexOf(fullMatchByModelObjs[i].key);
                if(index !== -1){
                    matchBys.splice(index, 1);
                }
            }
        }

        for (i = 0; i < matchBys.length; i++) {
            fullMatchByModelObjs.push({
                key: matchBys[i],
                '$matchBy': false
            });
        }

        return fullMatchByModelObjs;
    });

    helpers.factory('watchDimensionSelection', ['dimensionCanSelect', function(dimensionCanSelect) {
      return function($scope) {
        return function() {
          if($scope.selectedCurrentDimensions) {
            var selected = $scope.selectedCurrentDimensions.reduce(function(a,b) {return a || b;});
            if(!selected) { //If none are selected we don't need to perform the more complex calculation
              $scope.currentDimensions.forEach(function(dimension, idx) {
                dimension.$canSelect = true;
              });
            } else {
              $scope.selectedCurrentDimensions.forEach(function(value, idx) {
                $scope.currentDimensions[idx].$rowSelected = value;
              });
              $scope.currentDimensions.forEach(function(dimension, idx) {
                dimension.$canSelect = dimensionCanSelect(dimension, $scope.currentDimensions, $scope.currentAllMetrics);
              });
            }
          }
        };
      };
    }]);

    helpers.constant('dimensionCanSelect', function(dimension, dimensions, allMetrics) {
      if(dimension.$rowSelected) {
        //this is a deselection, its allowed ;)
        return true;
      }
      var isNotSameKey = dimensions.filter(function (d){
        return dimension.key === d.key;
      }).map(function(d) {
        return !d.$rowSelected;
      }).reduce(function(a, b) {
        return a && b;
      }, true),
      selectedDimensions = dimensions.filter(function(d) {
        return d.$rowSelected;
      }),
      canBeSelected = allMetrics.filter(function(m) { //Filter to metrics based on what is selected
        return selectedDimensions.map(function(d) {
          return m.dimensions.hasOwnProperty(d.key) &&  m.dimensions[d.key] === d.value;
        }).reduce(function(a, b) {
          return a && b;
        }, true);
      }).map(function(m) {
        return m.dimensions[dimension.key] === dimension.value;
      }).reduce(function(a, b) {
        return a || b;
      }, false);
      return isNotSameKey && canBeSelected;
    });

    /**
     * utility to get current date and utc string in certain format
     */
    helpers.factory('getDisplayDateAndUTC', ['$moment', function($moment) {
        function getDateAndUTC() {
            var displayDate = $moment().calendar();
            var displayUTC = moment().format('Z') + 'UTC';

            return {'date': displayDate, 'utc': displayUTC};
        }
        return getDateAndUTC;
    }]);

    /**
     * utility to hide active masthead popoover
     */
    helpers.factory('hideActiveMastheadPopover',
        ['$rootScope',
        function($rootScope) {
            function hide() {
                var activePopover = $rootScope.activeMastheadPopover;
                if (activePopover !== undefined) {
                    $(activePopover).popover('hide');
                    $(activePopover).removeClass('selected');
                    $rootScope.activeMastheadPopover = undefined;
                }
            }
            return hide;
        }]
    );

    helpers.factory('d3Service', ['$document', '$window', '$q', '$rootScope', '$timeout',
        function ($document, $window, $q, $rootScope, $timeout) {
            return $window.d3;
        }]);

    helpers.factory('generateDynamicID', [function () {
        return function (data) {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for (var i = 0; i < 5; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
            return data + text;
        };
    }]);

    helpers.factory('labelFormatterDay', ['$translate',function ($translate) {
        return function (val) {
            var day = Math.floor((moment().diff(moment(val))) / (24 * 3600 * 1000));
            if (day <= 0) {
                return $translate.instant('common.d3.charts.xaxis.tick.today');
            } else {
                return '-' + day + 'd';
            }
        };
    }]);

    helpers.factory('labelFormatterHour', ['$translate',function ($translate) {
        return function (val) {
            var hour = Math.floor((moment().diff(moment(val))) / (60 * 60 * 1000));
            if (hour <= 0) {
                return '0 hr';
            } else {
                return '-' + hour + 'hr';
            }
        };
    }]);

    helpers.factory('labelFormatterMinute', ['$translate',function ($translate) {
        return function (val) {
            var minute = Math.floor((moment().diff(moment(val)))/ (60 * 1000));
            if (minute <= 1) {
                return $translate.instant('common.d3.charts.xaxis.tick.now');
            } else {
                return '-' + minute + 'm';
            }
        };
    }]);

    helpers.factory('getRoundOffValue', [function () {
        return function (value) {
            var result = 2;
            while (value < 1.0 && value > 0) {
                value *= 100;
                result++;
            }
            return result;
        };
    }]);

    helpers.factory('generateTickValues', ['getRoundOffValue', function (getRoundOffValue) {
        return function (min, max) {
            var tickValues = [];
            var interval = (max - min) / 10, tick = 0;

            for (var i = 0; i <= 10; i++) {
                tick = min + (i * interval);
                tickValues.push(tick.toFixed(getRoundOffValue(tick)));
            }

            return tickValues;
        };
    }]);

    helpers.factory('validateChartData', [function () {
        return function (dataType, data) {
            if (dataType === 'chartColor') {
                var graphColors = {fill: "", stroke: ""};
                if (data.hasOwnProperty("graphColors")) {
                    graphColors.fill = data.graphColors.hasOwnProperty("fill") ? data.graphColors.fill : "steelblue";
                    graphColors.stroke = data.graphColors.hasOwnProperty("stroke") ? data.graphColors.stroke : "steelblue";
                } else {
                    graphColors.fill = "steelblue";
                    graphColors.stroke = "steelblue";
                }
                return graphColors;
            } else if (dataType === 'chartAxis') {
                var axisData = {
                    range: "",
                    interval: [],
                    tickFormat: ""
                };

                if (data.hasOwnProperty("graphAxisConfig")) {
                    var graphAxisConfig = data.graphAxisConfig;
                    if (graphAxisConfig.hasOwnProperty("xAxis")) {
                        var xaxis = graphAxisConfig.xAxis;
                        axisData.range = xaxis.hasOwnProperty('range') ? xaxis.range : "none";
                        axisData.interval = xaxis.hasOwnProperty('interval') ? xaxis.interval : [-1, "none"];
                        axisData.tickFormat = xaxis.hasOwnProperty('tickFormat') ? xaxis.tickFormat : "none";
                    } else {
                        axisData.range = "none";
                        axisData.interval = [-1, "none"];
                        axisData.tickFormat = "none";
                    }
                    if (graphAxisConfig.hasOwnProperty("yAxis")) {
                        var yaxis = graphAxisConfig.yAxis;
                        if (yaxis.hasOwnProperty('domain')) {
                          axisData.yDomain = yaxis.domain;
                        } else {
                          axisData.yDomain = undefined;
                          axisData.yMin = yaxis.hasOwnProperty("min") ? yaxis.min : undefined;
                        }
                    }
                } else {
                    axisData.range = "none";
                    axisData.interval = [-1, "none"];
                    axisData.tickFormat = "none";
                }

                return axisData;
            } else if (dataType === 'chartTitle') {
                var chartTitleData = {title: "", styleClass: ""};

                if (data.hasOwnProperty("graphTitleConfig")) {
                    chartTitleData.title = data.graphTitleConfig.hasOwnProperty("name") ? data.graphTitleConfig.name : "";
                    chartTitleData.styleClass = data.graphTitleConfig.hasOwnProperty("styleClass") ? data.graphTitleConfig.styleClass : "default-title-class";
                } else {
                    chartTitleData.title = "";
                    chartTitleData.styleClass = "default-title-class";
                }
                return chartTitleData;
            }

        };
    }]);

    // get groupings of hosts by clusters and control planes
    helpers.factory('getClusterGrouping', ['$q', 'bllApiRequest', 'log', 'addNotification', '$translate',
        function($q, bllApiRequest, log, addNotification, $translate) {
        return function() {
            /* sample data from this call:
                "data": {
                    "cluster": "compute",
                    "control_planes": "ccp",
                    "nodes": [
                        "apprentice-ccp-comp0001-mgmt",
                        "apprentice-ccp-comp0002-mgmt",
                        "apprentice-ccp-comp0003-mgmt"
                    ]
                }
            */
            var clusterGrouping = $q.defer();
            bllApiRequest.get('catalog', {operation: 'get_compute_clusters'}).then(
                function (res) {
                    var clusterData = [];
                    if (angular.isDefined(res.data)) {
                        var controlPlanes = res.data;
                        for (var cp in controlPlanes) {
                            var names = cp.split(":");
                            var cData = {
                                control_plane: names[0],
                                cluster: names[1],
                                nodes: controlPlanes[cp]
                            };
                            clusterData.push(cData);
                        }
                    }
                    clusterGrouping.resolve(clusterData);
                },
                function (error) {
                    addNotification('error', $translate.instant('compute.inventory.data.get_error',
                        {details: JSON.stringify(error)}));
                    log('error', 'Failed to get cluster grouping data: ' + JSON.stringify(error));
                    clusterGrouping.reject(error);
                }
            );
            return clusterGrouping.promise;
        };
    }]);

    // get host utilization data by clusters and control planes
    helpers.factory('getClusterUtilization', ['$q', 'bllApiRequest', 'log', 'addNotification', '$translate',
        function($q, bllApiRequest, log, addNotification, $translate) {
        return function() {
            /* sample data from this call:
                "data": {
                    "cluster": "compute",
                    "control_planes": "ccp",
                    "nodes": [
                        "apprentice-ccp-comp0001-mgmt": {data},
                        "apprentice-ccp-comp0002-mgmt": {data},
                        "apprentice-ccp-comp0003-mgmt": {data}
                    ]
                }
            */
            var clusterUtilization = $q.defer();
            bllApiRequest.get('compute', {operation: 'get_cluster_utilization'}).then(
                function (res) {
                    var clusterData = [];
                    if (angular.isDefined(res.data)) {
                        var controlPlanes = res.data;
                        for (var cp in controlPlanes) {
                            var names = cp.split(":");
                            var cData = {
                                control_plane: names[0],
                                cluster: names[1],
                                nodes: controlPlanes[cp]
                            };
                            clusterData.push(cData);
                        }
                    }
                    clusterUtilization.resolve(clusterData);
                },
                function (error) {
                    addNotification('error', $translate.instant('compute.inventory.data.get_error',
                        {details: JSON.stringify(error)}));
                    log('error', 'Failed to get cluster grouping data: ' + JSON.stringify(error));
                    clusterUtilization.reject(error);
                }
            );
            return clusterUtilization.promise;
        };
    }]);

    helpers.factory('getAllAlarmByState', ['$q', 'bllApiRequest', 'log', 'addNotification', '$translate',
        function($q, bllApiRequest, log, addNotification, $translate) {
            return function(controlPlanes, clusters) {
                var alarmCount = $q.defer();
                var req = {
                    operation: 'alarm_count',
                    metric_dimensions: {control_plane: controlPlanes, cluster: clusters},
                    group_by: "state, severity"
                };
                bllApiRequest.get('monitor', req).then(
                    function(data) {
                        alarmCount.resolve(data.data.counts);
                    },
                    function(error) {
                        addNotification('error', $translate.instant('compute.inventory.data.get_error',
                            {details: JSON.stringify(error)}));
                        log('error', "Failed to retrieve alarm data: " + JSON.stringify(error));
                        alarmCount.reject(error);
                    }
                );
                return alarmCount.promise;
            };
        }
    ]);

    // get alarm count for hosts in the cluster and control plane group
    helpers.factory('getHostAlarmCountForGroup', ['$q', 'bllApiRequest', 'log', 'addNotification', '$translate',
        function($q, bllApiRequest, log, addNotification, $translate) {
        return function(group) {
            var hostAlarmCount = $q.defer();
            var req = {
                operation: 'alarm_count',
                metric_dimensions: {control_plane: group.control_plane, cluster: group.cluster},
                group_by: "dimension_name, dimension_value, state, severity",
                dimension_name_filter: "hostname"
            };
            bllApiRequest.get('monitor', req).then(
                function(data) {
                    hostAlarmCount.resolve({alarms: data.data.counts, group: group});
                },
                function(error) {
                    addNotification('error', $translate.instant('compute.inventory.data.get_error',
                        {details: JSON.stringify(error)}));
                    log('error', "Failed to retrieve alarm data: " + JSON.stringify(error));
                    hostAlarmCount.reject(error);
                }
            );
            return hostAlarmCount.promise;
        };
    }]);

    // get worst alarm level for each host in the group
    helpers.factory('getHostWorstAlarmForGroup', [function() {
        return function(alarmCountList, hostList) {
            var hostCountByAlarm = [[], [], [], []];   // [unknown, ok, warning, critical]
            var hostAlarmData = [];
            hostList.forEach(function(host) {
                var highestAlarmLevel = 0;
                var alarmLevel, alarmSublevel;
                if (angular.isDefined(alarmCountList) && alarmCountList.length > 0) {
                    alarmCountList.forEach(function(alarmCount) {
                        if (alarmCount[2] === host) {
                            var currentAlarmLevel;
                            switch(alarmCount[3]) {
                                case "UNDETERMINED":
                                    currentAlarmLevel = 1;
                                    break;
                                case "OK":
                                    currentAlarmLevel = 2;
                                    break;
                                case "ALARM":
                                    currentAlarmLevel = (alarmCount[4] === 'CRITICAL' || alarmCount[4] === 'HIGH') ? 4 : 3;
                                    break;
                            }
                            if (currentAlarmLevel > highestAlarmLevel) {
                                highestAlarmLevel = currentAlarmLevel;
                                alarmLevel = alarmCount[3];
                                alarmSublevel = alarmCount[4];
                            }
                        }
                    });
                    // no. of hosts with this highest alarm level
                    if (highestAlarmLevel > 0) {
                        hostCountByAlarm[highestAlarmLevel - 1].push(host);
                    }

                    // loop again to get the total alarm count of the highest alarm level for this host
                    var totalAlarmCount = 0;
                    alarmCountList.forEach(function(alarmCount) {
                        if (alarmCount[2] === host) {
                            if (alarmCount[3] === alarmLevel) {
                                if (alarmCount[3] === 'ALARM') {
                                    if (alarmCount[4] === alarmSublevel) {
                                        totalAlarmCount += alarmCount[0];
                                    }
                                } else {
                                    totalAlarmCount += alarmCount[0];
                                }
                            }
                        }
                    });
                    hostAlarmData.push({hostname: host, alarmCount: totalAlarmCount, state: getState(highestAlarmLevel),
                        stateLevel: highestAlarmLevel});
                }
            });
            hostAlarmData.sort(function(a,b) {return b.stateLevel - a.stateLevel;});
            return {hostCountByAlarm: hostCountByAlarm, hostAlarmData: hostAlarmData};
        };
    }]);

    // translate state level to text
    function getState(state) {
        switch(state) {
            case 1: return 'unknown';
            case 2: return 'ok';
            case 3: return 'warning';
            case 4: return 'critical';
        }
    }

    helpers.factory('getHostAlarmData', [
        '$q', 'bllApiRequest', 'log', 'filterAlarmCount',
        function($q, bllApiRequest, log, filterAlarmCount) {

        return function(host, type) {
            var host_alarm_data = $q.defer();
            var req_alarms = {
                'operation': 'alarm_count',
                'group_by': 'state, severity',
                'metric_dimensions': {}
            };

            if(angular.isDefined(type) && type.toLowerCase() === "esxcluster"){
                req_alarms.metric_dimensions.esx_cluster_id = host;
            }else {
                req_alarms.metric_dimensions.hostname = host;
            }

            bllApiRequest.get('monitor', req_alarms).then(
                function (response) {
                    var alarmData = {};
                    var countData = response.data || [];
                    //{"total":33,"ok":33,"warning":0,"critical":0,"unknown":0}"
                    var tempData = filterAlarmCount(countData);
                    //need this format for horseshoe donut
                    //"{"critical":{"count":0},"warning":{"count":0},"unknown":{"count":0},"ok":{"count":33},"count":33}"
                    for (var key in tempData) {
                        if (tempData.hasOwnProperty(key)) {
                            var value = tempData[key];
                            if (key === 'total') {
                                alarmData.count = value;
                            }
                            else {
                                alarmData[key] = {'count': value};
                            }
                        }
                    }

                    log('info', 'Successfully finished getting the alarm data for host=' + host +
                        ' total = ' + alarmData.count);
                    host_alarm_data.resolve(alarmData);
                },
                function (error_data) {
                    addNotification(
                        "error",
                        $translate.instant("alarm.summary.details.host_alarms.state.error"));
                    log('error', 'Failed to get alarm data for host=' + host);
                    log('error', 'error data = ' + JSON.stringify(error_data));
                    host_alarm_data.resolve();
                }
            );

            return host_alarm_data.promise;
        };
    }]);

    helpers.factory('arrayContains', ['booleanValuesOr', function(booleanValuesOr) {
        return function(array, obj) {
            if(Array.isArray(array)) {
                return array.map(function(item) {
                    return item.key === obj.key && item.value === obj.value;
                }).reduce(booleanValuesOr, false);
            } else {
                return false;
            }
        };
    }]);

    helpers.constant('booleanValuesOr', function (a,b) {
        return a || b;
    });

    helpers.constant('booleanValuesAnd', function (a,b) {
        return a && b;
    });

    helpers.factory('arrayContainsKey', ['booleanValuesOr', function(booleanValuesOr) {
        return function(array, key) {
            if(Array.isArray(array)) {
                return array.map(function(item) {
                    return item.key == key;
                }).reduce(booleanValuesOr, false);
            } else {
                return false;
            }
        };
    }]);

    helpers.factory('arrayContainsString', ['booleanValuesOr', function(booleanValuesOr) {
        return function(array, string) {
            if(Array.isArray(array)) {
                return array.map(function(item) {
                    return item === string;
                }).reduce(booleanValuesOr, false);
            } else {
                return false;
            }
        };
    }]);

    helpers.factory('ifValueNA', [function () {
        return function (compareKey, value) {
            return value <= compareKey ? "N/A" : parseFloat(value.toFixed(2));
        };
    }]);

    helpers.factory('setNAifValueNA', [function () {
        return function (compareKey, value) {
            return compareKey !== "N/A" ? parseFloat(value).toFixed(2) : "N/A";
        };
    }]);

    helpers.factory('unitCheckForNA', [function () {
        return function (unit, value) {
            return value === "N/A" ? "" : unit;
        };
    }]);

    helpers.factory('getCurrentISOTime', [function () {
        return function (offset) {
            /*
             offset: This variable is used to add/subtract an 'n' amount of time from the current time.
                     Value of `offset` can be determined by following:
                     if you want to subtract 1 minute from the current time then pass `6000` and so on.
             */

            return new Date((new Date()).getTime() - (offset)).toISOString().split('.')[0]+"Z";
        };
    }]);

    helpers.factory('humanReadableTime', [function () {
        return function (val) {
            var result = {value: 0, label: ""};
            if (val >= 3600) {
                result.value = (val / 3600).toFixed(2);
                result.label = "HR";
            } else if (val >= 60 && val < 3600) {
                result.value = (val / 60).toFixed(2);
                result.label = "MIN";
            } else {
                result.value = val;
                result.label = "SEC";
            }

            return result;
        };
    }]);

    helpers.factory('bytesToSize', [function () {
        return function (bytes, decimals) {
            //TODO units need to be localized
            //bytes come in should be positive number
            if (bytes <= 1) {
                var dc = decimals ? decimals : 2;
                return parseFloat(bytes.toFixed(dc)) + ' Byte';
            }
            var k = 1000;
            var dm = decimals + 1 || 2;
            var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            var i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        };
    }]);

    helpers.factory('trimNegativeValuesFromData', [function () {
        return function (data) {
            for (var i = data.length - 1; i >= 0; i--) {
                if (data[i][1] < 0) {
                    data.splice(i, 1);
                }
            }
            return data;
        };
    }]);

    helpers.factory('stackModalVis', [function () {
        return function () {
            var $allstackableModals = angular.element(document).find('stackablemodal');
            var visible = false;

            for(var i=0; i<$allstackableModals.length;i++) {
                var attr = angular.element($allstackableModals[i]).attr('showAttribute');
                if(angular.element($allstackableModals[i]).scope()[attr] && attr !== 'showTableDetails') {
                    visible = true;
                    break;
                }
            }

            return visible;
        };
    }]);

    helpers.constant('round', function (number, places) {
        var offset = places * 10 || 2 * 10;

        return Math.round(number  * offset) / offset;
    });

    helpers.factory('animationLoop', ['$window', function($window) {
        return function(interval, cb, cont) {
          var startTime = null;
          function animationLoop(timestamp) {
              if (!startTime) startTime = timestamp;
              var progress = timestamp - startTime;
              if ((progress === 0) || (progress >= interval)) {
                  cb();
                  startTime = timestamp;
              }

              if (cont()) {
                  $window.requestAnimationFrame(animationLoop);
              }
          }
          $window.requestAnimationFrame(animationLoop);
        };
    }]);

    helpers.factory('processAlarmCount', function() {
      return function(filter, alarmCounts) {
        var data = {}, alarmList = {
          ok:{count:0},
          warning:{count:0},
          critical:{count:0},
          unknown:{count:0}};
        var filteredData = typeof filter === 'function' ? alarmCounts.filter(filter) : alarmCounts;
        filteredData.forEach(function(count) {
          var dimension_name = count[1],
              dimension_value = count[2],
              severity = count[3],
              state = count[4];
              data[dimension_value] = data[dimension_value] || {};
              data[dimension_value][state] = data[dimension_value][state] || {};
              data[dimension_value][state][severity] = (data[dimension_value][state][severity] || 0) + count[0];

        });
        angular.forEach(data, function(value, key) {
          if(value.OK && !value.ALARM && !value.UNDETERMINED) { //ok
            alarmList.ok.count++;
          } else if(!value.ALARM && value.UNDETERMINED) { //unknown
            alarmList.unknown.count++;
          } else { //alarm
            if(!value.ALARM.HIGH && !value.ALARM.CRITICAL && (value.ALARM.LOW || value.ALARM.MEDIUM)) {
              alarmList.warning.count++;
            } else {
              alarmList.critical.count++;
            }
          }
        });
        return alarmList;
      };
    });

    /**
     * utility to remove duplicate entries in an array
     */
    helpers.factory('removeDuplicateInArray', function() {
        function remove(array) {
            var input = array;
            if(!angular.isDefined(array) || !Array.isArray(array)) {
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
        }
        return remove;
    });

    /**
     * utility to populate empty data page
     */
    helpers.factory('updateEmptyDataPage', ['$translate', function($translate) {
        function update(page, type, reasonMsg,
                        actionMsgKey, actionLabelKey, action) {
            if(!angular.isDefined(page)) {
                return page;
            }
            page.type = type;
            page.reasonMessage = reasonMsg;
            page.actionMessage =
                actionMsgKey ? $translate.instant(actionMsgKey) : '';
            page.actionLabel =
                actionLabelKey ? $translate.instant(actionLabelKey) : '';
            page.action = action;

            return page;
        }
        return update;
    }]);

    helpers.factory('calcStandardDeviation', [function() {
      return function(values) {
        var mean = _.mean(values);
        var variance = _.mean(values.map(function(value) {
          return Math.pow(value - mean, 2);
        }));
        return {
          mean: mean,
          sd: Math.sqrt(variance)
        };
      };
    }]);

    helpers.factory('commonChartLegendButtons', ['$translate', function($translate) {
      return [{
        "name": "date_range",
        "label": $translate.instant("common.day"),
        "value": "1day",
        "type": "radio"
       }, {
        "name": "date_range",
        "label": $translate.instant("common.days", {count:7}),
        "value": "7days",
        "type": "radio"
        }, {
         "name": "date_range",
         "label": $translate.instant("common.days", {count:30}),
         "value": "30days",
         "type": "radio"
        }, {
         "name": "date_range",
         "label": $translate.instant("common.days", {count:45}),
         "value": "45days",
         "type": "radio"
      }];
    }]);

    helpers.constant('computeHostRoles', [
        'ESX-COMPUTE-ROLE',
        'OVSVAPP-ROLE',
        'COMPUTE-ROLE',
        'HYPERV-COMPUTE-ROLE']
    );
    // filterOutComputeRole(appliances) returns list of hosts not containing
    // compute hosts
    helpers.factory('filterOutComputeRoles', ['computeHostRoles', function(computeHostRoles) {
        return function(appl_dict) {
            var appliances = [];
            for (var key in appl_dict) appliances.push(appl_dict[key]);
            return appliances.filter(function(appliance) {
                return computeHostRoles.indexOf(appliance.role) === -1 &&
                    appliance.role.indexOf('KVM-COMPUTE-ROLE') !== 0;
            });
        };
    }]);

    helpers.factory('getRegions', [
        '$q', 'bllApiRequest', 'log',
        function($q, bllApiRequest, log) {

        return function() {
            var regions_data = $q.defer();
            var req = {'operation': 'get_regions'};

            bllApiRequest.get('catalog', req).then(
                function (response) {
                    var regionData = response.data || [];

                    log(
                        'info',
                        'Successfully finished getting region data = ' + JSON.stringify(regionData)
                    );
                    regions_data.resolve(regionData);
                },
                function (error_data) {
                    addNotification(
                        "error",
                        $translate.instant(
                            "common.region.data.error",
                            {'details': error_data.data ? error_data.data[0].data : ''}
                        )
                    );
                    log('error', 'Failed to get region data');
                    log('error', 'error data = ' + JSON.stringify(error_data));
                    regions_data.resolve();
                }
            );

            return regions_data.promise;
        };
    }]);

    //re-using the compute localization strings here to avoid having to re-translate
    helpers.factory('getCommonStateString', ['$translate', function($translate) {
        return function(value) {
            if (angular.isUndefined(value)) {
                return $translate.instant('compute.notavailable.data');
            } else {
                switch(value) {
                    case 'activated':
                        return $translate.instant('compute.compute_nodes.state.activated');
                    case 'activating':
                        return $translate.instant('compute.compute_nodes.state.activating');
                    case 'deactivated':
                        return $translate.instant('compute.compute_nodes.state.deactivated');
                    case 'deactivating':
                        return $translate.instant('compute.compute_nodes.state.deactivating');
                    case 'deleting':
                        return $translate.instant('compute.compute_nodes.state.deleting');
                    case 'provisioned':
                        return $translate.instant('compute.table.filter.state.provisioned');
                    case 'imported':
                        return $translate.instant('compute.compute_nodes.state.imported');
                    default:
                        return angular.isDefined(value.toUpperCase) ? value.toUpperCase() : value;
                }
            }
        };
    }]);

    helpers.factory('getComputeHostStateString', ['$translate', 'getCommonStateString', function($translate, getCommonStateString) {
        return function(data) {
            return getCommonStateString(data.state);
        };
    }]);

    helpers.factory('getVolumeStatusString', ['$translate', 'getCommonStateString', function($translate, getCommonStateString) {
        return function(data) {
            var stateString = getCommonStateString(data.status);
            return typeof stateString === String ? stateString.toUpperCase() : stateString;
        };
    }]);

})(angular);
