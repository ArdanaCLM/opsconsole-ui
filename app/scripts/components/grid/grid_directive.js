// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(ng) {
	'use strict';

	ng.module('operations-ui').directive('grid', ['getKeyFromScope', function(getKeyFromScope) {
		return {
			restrict: 'E',
			scope: {},
			templateUrl: 'components/grid.html',
			link: function(scope, el, attrs) {
				//grab table from config
				scope.grid = getKeyFromScope(attrs.config, scope.$parent);
			}
		};
	}]);
})(angular);