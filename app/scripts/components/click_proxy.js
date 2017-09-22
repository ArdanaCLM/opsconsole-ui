// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';

    var p = ng.module('plugins');

    p.directive('clickProxy', function() {
      return {
        restrict: "A",
        link: function(scope, el, attrs) {
          el.on('click', function (event) {
            el.parent().find(attrs.clickProxy).click();
          });
        }
      };
    });

})(angular);
