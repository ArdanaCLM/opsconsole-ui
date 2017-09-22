// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(ng) {
  'use strict';

    ng.module('operations-ui').controller('MainController', ['$rootScope', '$location',
        function($rootScope, $location) {
	    if (angular.isDefined($rootScope.auth_token)){
    		$location.path($rootScope.appConfig.default_route);
	    }
	    else {
		$location.path('/login');
	    }
	}]);
})(angular);