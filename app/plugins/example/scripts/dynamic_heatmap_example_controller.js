// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(ng) {
  'use strict';
  var p = ng.module('plugins');

  p.controller('dynamicHeatmapExampleController', ['$scope', 'genUUID', '$translate',
      function ($scope, genUUID, $translate) {
        $scope.sampleAction = function(cell) {
          alert(JSON.stringify(cell));
        };
        $scope.generateData = function() {
          $scope.heatMapData = [];
          for(var i=0; i<25;i++) {
            var number = Math.floor(Math.random() * 100);
            var sizeNumber = Math.ceil(Math.random() * 100);
            $scope.heatMapData.push({
              value: number === 0 ? undefined : number,
              //utilization: sizeNumber,
              //id: genUUID(),
              total: sizeNumber,
              title: number === 0 ? $translate.instant("common.not_applicable") : number + '%'
            });
          }
        };
        $scope.generateData();
      }
  ]);

})(angular);
