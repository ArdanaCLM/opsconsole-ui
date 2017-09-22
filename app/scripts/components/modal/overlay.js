// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(ng) {
    'use strict';

    ng.module('operations-ui').directive("modalOverlay", [
        function () {
            return {
                restrict: "E",
                scope: {
                  showAttribute: "=",
                  longWaitLogout: "="
                },
                templateUrl: 'components/modal/overlay.html'
            };
        }
    ]);
})(angular);
