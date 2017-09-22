// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng, d3) {
  'use strict';

  ng.module('operations-ui').directive('dynamicHeatMap', ['booleanValuesOr', 'calcStandardDeviation', function(booleanValuesOr, calcStandardDeviation) {
    return {
      restrict: "E",
      templateUrl: "components/dynamic_heat_map.html",
      scope: {
        "data": "=",
        "computeSize": "=",
        "columns": "=",
        "name": "@",
        "type": "@",
        "width": "=",
        "height": "=",
        "overlay": "@",
        "clickfunc": "="
      },
      link: function($scope, element, attributes, ngModel) {
        if($scope.type === 'freeflow') {
          var position = function() {
            this.style("width", function(d) {
              return (d.dx - 2) + "px";
            })
            .style("height", function(d) {
              return (d.dy - 2) + "px";
            })
            .style("left", function(d) {
              return d.x + "px";
            })
            .style("top", function(d) {
              return d.y + "px";
            })
            .attr("small", function(d) {
              if(d.dx < 140 || d.dy < 95) {
                return "true";
              } else {
                return "false";
              }
            });
          },
          color = function() {
            this.style("background",  "#2dd3ca")
            .style("opacity", function(d) {
              return d.utilization / 100;
            });
          };
          $scope.render = function() {
            element.find('.freeflow').children().remove();
            var data = {
              children: angular.copy($scope.data)
            },
            div = d3.select(element.find('.freeflow').get(0))
              .style('width', $scope.width + 'px')
              .style('height', $scope.height + 'px'),
            treemap = d3.layout.treemap()
              .size([$scope.width, $scope.height])
              .round(true)
              .sort(function(a,b) {
                return a.value - b.value;
              }).value(function(d) {
                return d.value;
              })
              .nodes(data);

            //filter out root, its not needed
            treemap = treemap.filter(function(node) {
              return !node.children;
            });

            var nodes = div
              .selectAll(".free-flow-cell")
              .data(treemap)
              .enter()
              .append("div")
              .attr("class", "free-flow-cell")
              .call(position)
              .call(color),
            nodesLabels = div
              .selectAll(".free-flow-cell-label")
              .data(treemap)
              .enter()
              .append("div")
              .attr("class", "free-flow-cell-label")
              .call(position);

            nodesLabels
              .append("div")
              .attr("class", "line-1")
              .text(function(d) {
                return d.id;
              });
            nodesLabels
              .append("div")
              .attr("class", "line-2")
              .text(function(d) {
                return "CAPACITY: " + d.value + "TB";
              });
            nodesLabels
              .append("div")
              .attr("class", "line-3")
              .text(function(d) {
                return "UTILIZATION: " + d.utilization + "%";
              });
          };
        } else {
          var qq, ii,
            SMALL= 'small',
            MEDIUM = 'medium',
            LARGE = 'large',
            currentRow = 0,
            currentColumn = 0;
          $scope.showOverlay = false;

          $scope.action = function(cell) {
            if (angular.isDefined($scope.clickfunc)) {
              $scope.currentCell = cell;
              $scope.clickfunc(cell);
            } else {
              $scope.currentCell = cell;
              $scope.showOverlay = true;
            }
          };

          $scope.hideOverlay = function() {
            $scope.showOverlay = false;
          };

          $scope.ceil = Math.ceil;

          var generateRow = function () {
            var row = [];
            for(qq=0;qq<$scope.columns;qq++) {
              row.push(undefined);
            }
            return row;
          };

          var createCells = function() {
            $scope.cells = [];
            for(ii=0;ii<$scope.rows;ii++) {
              $scope.cells.push(generateRow());
            }
          };

          $scope.calcSizes = function() {
            if($scope.data.length >= 2) {
              var result = calcStandardDeviation($scope.data.map(function(datum) {
                return datum.total;
              }));
              var firstThird = result.mean - result.sd;
              var secondThird = result.mean + result.sd;
              $scope.data.forEach(function(datum) {
                if(datum.total <= firstThird) {
                  datum.size = 'small';
                } else if(datum.total > firstThird && datum.total <= secondThird) {
                  datum.size = 'medium';
                } else if(datum.total > secondThird) {
                  datum.size = 'large';
                } else {
                  datum.size = 'small';
                }
              });
            } else {
              $scope.data.forEach(function(datum) {
                datum.size = 'large';
              });
            }
          };

          $scope.render = function() {
            if($scope.data) {
              currentRow = 0;
              currentColumn = 0;
              $scope.rows = Math.ceil($scope.data.length /  $scope.columns);
              $scope.calcSizes();
              createCells();
              //walk the grid and insert the items
              $scope.data.forEach(function(datum) {
                findNextFree();
                if(canInsert(currentRow, currentColumn, datum.size)) {
                  insert(currentRow, currentColumn, datum);
                } else {
                  findInsertionPoint(datum);
                }
                currentColumn++;
                if(currentColumn >= $scope.columns) {
                  currentColumn = 0;
                  currentRow++;
                  if(currentRow >= $scope.rows) {
                    $scope.rows++;
                    $scope.cells.push(generateRow());
                  }
                }
              });

              //add empty cells when they are still undefined.
              var remove = [];
              for(ii=0;ii<$scope.cells.length;ii++) {
                //find empty rows
                if(!$scope.cells[ii].reduce(booleanValuesOr, false)) {
                  remove.push(ii);
                }
                for(qq=0;qq<$scope.cells[ii].length;qq++) {
                  $scope.cells[ii][qq] = $scope.cells[ii][qq] || {};
                }
              }
              //remove the rows empty
              remove.reverse();
              remove.forEach(function(idx) {
                $scope.cells.splice(idx, 1);
                $scope.rows--;
              });
            }
          };

          var insert = function(row, column, datum) {
            var colorClass = datum.value ? " color-" + (Math.ceil(datum.value / 10) * 10) : ' color-no-data';
            if(datum.size === SMALL) {
              $scope.cells[row][column] = angular.copy(datum);
              $scope.cells[row][column].class = 'small' + colorClass;
            } else if(datum.size === MEDIUM) {
              currentColumn++;
              $scope.cells[row][column] = angular.copy(datum);
              $scope.cells[row][column+1] = angular.copy(datum);
              $scope.cells[row][column].class = 'medium left' + colorClass;
              $scope.cells[row][column+1].class = 'medium right' + colorClass;
            } else if(datum.size === LARGE) {
              currentColumn++;
              $scope.cells[row][column] = angular.copy(datum);
              $scope.cells[row][column+1] = angular.copy(datum);
              $scope.cells[row+1][column] = angular.copy(datum);
              $scope.cells[row+1][column+1] = angular.copy(datum);
              $scope.cells[row][column].class = 'large upper-left' + colorClass;
              $scope.cells[row][column+1].class = 'large upper-right' + colorClass;
              $scope.cells[row+1][column].class = 'large lower-left' + colorClass;
              $scope.cells[row+1][column+1].class = 'large lower-right' + colorClass;
            }
          };

          var canInsert = function canInsert(row, column, size) {
            if(size === SMALL) {
              if(column >= $scope.columns || row >= $scope.row) {
                return false;
              }
              return !$scope.cells[row][column];
            } else if(size === MEDIUM) {
              if(column >= $scope.columns || row >= $scope.row || column+1 >= $scope.columns) {
                return false;
              }
              try {
                return !$scope.cells[row][column] && !$scope.cells[row][column+1];
              } catch(e) {
                return false;
              }
            } else if(size === LARGE) {
              if(column >= $scope.columns || row >= $scope.row || column+1 >= $scope.columns || row+1 >= $scope.rows) {
                return false;
              }
              try {
                return !$scope.cells[row][column] && !$scope.cells[row][column+1] &&
                  !$scope.cells[row+1][column] && !$scope.cells[row+1][column+1];
              } catch(e) {
                return false;
              }
            }
          };

          //walk the grid until an insertain point can be found
          var findInsertionPoint = function (datum) {
            var searchRow = currentRow, searchColumn = currentColumn;
            while(!canInsert(searchRow, searchColumn, datum.size)) {
              if(datum.size === 'large' && searchRow+1 >= $scope.rows) {
                $scope.rows++;
                $scope.cells.push(generateRow());
              } else {
                searchColumn++;
              }
              if(searchColumn >= $scope.columns) {
                searchColumn = 0;
                searchRow++;
                if(searchRow >= $scope.rows) {
                  $scope.rows++;
                  $scope.cells.push(generateRow());
                }
              }
            }
            insert(searchRow, searchColumn, datum);
          };

          var findNextFree = function () {
            var previoudRow = currentRow, previousColumn = currentColumn;
            for(ii=0;ii<$scope.rows;ii++) {
              for(qq=0;qq<$scope.columns;qq++) {
                if(!$scope.cells[ii][qq]) {
                  currentRow = ii;
                  currentColumn = qq;
                  return;
                }
              }
            }
            //we searched everywhere and didn't find a place. add a row.
            if(previoudRow === currentRow && previousColumn === currentColumn) {
              $scope.rows++;
              $scope.cells.push(generateRow());
              currentRow = $scope.rows - 1;
              currentColumn = 0;
            }
          };
        }

        $scope.$watch('data', $scope.render, true);
      }
    };
  }]);
})(angular, d3);
