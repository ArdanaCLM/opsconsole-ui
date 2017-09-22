// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
	'use strict';

	ng.module('operations-ui').directive('gridColumn', ['getKeyFromScope', function(getKeyFromScope) {
		return {
			restrict: 'E',
			scope: {},
			templateUrl: 'components/grid_column.html',
			link: function(scope, el, attrs) {
				//grab config from parent scope
				scope.rows = getKeyFromScope(attrs.config, scope.$parent);
			}
		};
	}]);
})(angular);