// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(ng) {
  'use strict';
  var p = ng.module('plugins');

  p.controller('top_ten_example', ['$scope',
    function ($scope) {
      $scope.topTenData = [];
      for(var ii=0;ii<10;ii++) {
        $scope.topTenData.push({
          size: Math.ceil(Math.random() * 100) + "TB",
          utilization: Math.ceil(Math.random() * 100),
          name: "Project " + ii
        });
      }
    }
  ]);

})(angular);
