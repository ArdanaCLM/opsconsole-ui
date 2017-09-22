// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(ng) {
  'use strict';
  var p = ng.module('plugins');

  p.controller('form_example', ['$scope',
      function ($scope) {
        $scope.settings = {
          user: {
            email: "person@email.com"
          }
        };
        $scope.select_options = [
          {
            label: "example.options.label.1",
            value: 1
          },
          {
            label: "example.options.label.2",
            value: 2
          },
          {
            label: "example.options.label.3",
            value: 3
          },
          {
            label: "example.options.label.4",
            value: 4
          }
        ];
        $scope.radioValue = 'one';
      }
  ]);

})(angular);
