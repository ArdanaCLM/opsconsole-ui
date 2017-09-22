// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(){
    'use strict';

    angular.module('operations-ui').directive("ocloading", [
        function() {
            return {
                restrict: "E",
                scope: {},
                templateUrl: 'components/loading_spinner.html'
            };
        }
    ]);
})();