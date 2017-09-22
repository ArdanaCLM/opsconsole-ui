// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
    'use strict';

    var initInjector = angular.injector(["ng",'helpers']);
    var $http = initInjector.get("$http");
    var $q = initInjector.get("$q");
    var $rootScope = initInjector.get('$rootScope');

    var getInitialData = function() {
        var defer = $q.defer();
        var promises = [];

        var config = {};

        window.enabledLocales = ['en', 'ja','zh'];

        // set it now in case bll request fails

        window.fti_state = "bll_failure";

        promises.push($http.get("/opscon_config.json").then(function(response) {
            config = response.data;
            window.appConfig = response.data;
            if(typeof window.appConfig.env === 'undefined') {
              //assume we are in standard Openstack env "stdcfg" if there is not an env specified
              window.appConfig.env = "stdcfg";
            }
        }));

        promises.push($http.get("/version.json").then(function(response) {
            window.appVersion = response.data;
        }));

        $q.all(promises).then(defer.resolve, defer.reject);

        return defer.promise;
    };

    //manually boot the app once our config, version and fti state are known.
    getInitialData().then(function() {
        angular.element(document).ready(function () {
            var this_body = document.getElementById("ops_console_body");
            angular.bootstrap(this_body, ["operations-ui"]);
            $(".main-footer").show();
        });
    }, function(error) {
        window.master_error = "error";

        angular.element(document).ready(function() {
            var this_body = document.getElementById("ops_console_body");
            angular.bootstrap(this_body, ["operations-ui"]);
        });

        $("#communication-error").show();
        console.error("ERROR: " + JSON.stringify(error));
    });
})();
