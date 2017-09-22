// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
  'use strict';

  ng.module('operations-ui').directive('ocTranslate', ['$sce', function($sce) {
    return {
      restrict: "E",
      templateUrl: "components/oc_translate.html",
      scope: {},
      link: function(scope, element, attrs) {
        attrs.$observe('text', function() {
          scope.value = $sce.trustAsHtml(attrs.text);
        });
      }
    };
  }]);
})(angular);
