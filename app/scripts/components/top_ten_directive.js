// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
  'use strict';

  ng.module('operations-ui').directive('ocTopTen', function() {
    return {
      restrict: "E",
      templateUrl: "components/top_ten.html",
      scope: {
          "data": "=",
          "legend": "=",
          "legendtitle": "=",
          "sortby": "@"
      },
      link: function($scope, element, attributes) {
        $scope.$watch('data', function (newVal,oldVal,$scope) {

          var maxSize = 0;
          var maxSizeIdx = 0;
          var rawSize = 0;
          if($scope.data !== undefined && $scope.data.length > 0) {
              if($scope.sortby === 'size' || $scope.sortby === 'rawSize') {
                  $scope.data.forEach(function(obj,idx,data) {

                      // find the numerical value of size
                      rawSize = obj.rawSize || Number(obj.size.match(/\d+/)[0]);

                      if($scope.sortby === 'size') {

                        // make a raw size attribute for each data point
                        data[idx].rawSize = rawSize;
                      }

                      // determine a max size for all raw sizes
                      if(rawSize > maxSize) {
                        maxSize = rawSize;
                        maxSizeIdx = idx;
                      }
                  });

                  // we want the user friendly size (number only) for display
                  $scope.maxSizeDisp = Number($scope.data[maxSizeIdx].size.match(/[0-9\.]+/)[0]);
                  // we want the user firendly legend title to be the first alpha numeric 'word' (if no title is provided)
                  $scope.maxSizeLegend = $scope.data[maxSizeIdx].size.match(/[a-zA-Z]+/)[0];
                  // we want the raw max size to get accurate bar widths
                  $scope.maxSize = maxSize;
              }
          }

        });
      }
    };
  });
})(angular);
