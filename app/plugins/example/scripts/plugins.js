// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(ng) {
  'use strict';
  var p = ng.module('plugins');

  p.factory('example', ['pluginBase', function() {
    return [
      {
        type: 'menu',
        slug: 'example2',
        label: 'example.menu',
        icon: 'Document_general',
        order:99,
        children: [
          {
            type: 'controller',
            controllerName: "dynamicHeatmapExampleController",
            path: "/dyn_heatmap_example",
            template: "dynamic_heatmap_example.html",
            label: "Dynamic Heatmap",
            order: 0
          },
          {
            type: 'controller',
            controllerName: "d3graph_example",
            path: '/d3graph',
            template: 'd3graph_example.html',
            label: 'D3 Graph Example',
            order: 0
          },
          {
            type: 'controller',
            controllerName: "top_ten_example",
            path: '/top_ten',
            template: 'top_ten_example.html',
            label: 'Top Ten Example',
            order: 0
          },
          {
            type: 'controller',
            controllerName: "DonutSVGExampleController",
            path: '/plugin_path_svg_donut',
            template: 'donut_svg_example.html',
            label: 'example.demo.donut',
            order: 10
          },
          {
            type: 'controller',
            controllerName: "dualgrapgh_example",
            path: '/dualgraph',
            template: 'dualgraph_example.html',
            label: 'example.dualgraph',
            order: 20
          },
          {
            type: 'controller',
            controllerName: "form_example",
            path: '/form_example',
            template: 'form_example.html',
            label: 'example.form',
            order: 30
          },
          {
            type: 'controller',
            controllerName: "ExampleController5",
            path: '/plugin_path_5',
            template: 'example.html',
            label: 'example.controller5',
            order: 40
          },
          {
            type: 'controller',
            controllerName: "HeatmapExampleController",
            path: '/heatmap_example',
            template: 'heatmap_example.html',
            label: 'example.heatmap',
            order: 50
          },
          {
            type: 'controller',
            controllerName: "ardana_icon_example",
            path: '/icon_example_ardana',
            template: 'icons_ardana.html',
            label: 'example.icon.ardana',
            order: 60
          },
          {
            type: 'controller',
            controllerName: "HelpSystemExampleController",
            path: '/help_system_example',
            template: 'help_system_example.html',
            label: 'example.demo.helpsys',
            order: 70
          },
          {
            type: 'controller',
            controllerName: "HorseshoeSVGExampleController",
            path: '/plugin_path_svg_horseshoe',
            template: 'horseshoe_svg_example.html',
            label: 'example.demo.horseshoe',
            order: 80
          },
          {
            type: 'controller',
            controllerName: "LocalizationExampleController",
            path: '/localization_example',
            template: 'localization_example.html',
            label: 'example.demo.localization',
            order: 100
          },
          {
            type: 'controller',
            controllerName: "metricCardExampleController",
            path: '/metric_card_example',
            template: 'metric_card_example.html',
            label: 'example.demo.metric.card',
            order: 110
          },
          {
            type: 'controller',
            controllerName: "ModalDialogExampleController",
            path: '/modal_dialog_example',
            template: 'modal_dialog_example.html',
            label: 'example.demo.modaldialog',
            order: 120
          },
          {
            type: 'controller',
            controllerName: "NotificationExampleController",
            path: '/notification_example',
            template: 'notification_example.html',
            label: 'example.demo.notification',
            order: 130
          },
          {
            type: 'controller',
            controllerName: "PlotExampleController",
            path: '/plugin_path_plot',
            template: 'plot_example.html',
            label: 'example.demo.plot',
            order: 140
          },
          {
            type: 'controller',
            controllerName: "prefs_example",
            path: '/prefs_example',
            template: 'prefs_example.html',
            label: 'example.preferences',
            order: 150
          },
          {
            type: 'controller',
            controllerName: "StackableModalExampleController",
            path: '/stackablemodal',
            template: 'stackable_modal_example.html',
            label: 'example.stackablemodal',
            order: 160
          },
          {
            type: 'controller',
            controllerName: "tabbedpageExampleController",
            path: '/tabbedpage',
            template: 'tabbed_page_example.html',
            label: 'example.tabbedpage',
            order: 170
          },
          {
            type: 'controller',
            controllerName: "TableExampleController",
            path: '/table_example',
            template: 'table_example.html',
            label: 'example.demo.table',
            order: 180
          },
          {
            type: 'controller',
            controllerName: "TimeseriesExampleController",
            path: '/timeseriesgraph',
            template: 'timeseries_graph_example.html',
            label: 'example.demo.timeseries',
            order: 190
          },
          {
            type: 'controller',
            controllerName: "TooltipExampleController",
            path: '/tooltip_example',
            template: 'tooltip_example.html',
            label: 'example.demo.tooltip',
            order: 210
          },
          {
            type: 'controller',
            controllerName: "UtilizationExampleController",
            path: '/plugin_path_utilization',
            template: 'utilization_example.html',
            label: 'example.demo.utilization',
            order: 220
          },
          {
            type: 'controller',
            controllerName: "ValidationExampleController",
            path: '/validation_example',
            template: 'validation_example.html',
            label: 'example.demo.validation',
            order: 230
          },
          {
            type: 'controller',
            controllerName: "ProjectListExampleController",
            path: '/projectlist_example',
            template: 'projectlist_example.html',
            label: 'example.demo.projectlist',
            order: 240
          },
          {
            type: 'controller',
            controllerName: "InlineNotificationsExampleController",
            path: '/inline_notifications',
            template: 'inline_notifications.html',
            label: 'example.demo.inline_notifications',
            order: 250
          },
        ]
      }
    ];
  }]);

  p.controller('ExampleController5', ['$scope', '$cookieStore', function($scope, $cookieStore) {
      $scope.awesomeThings = ['I am a plugin 5'];

      $scope.expireCookie = function() {
        var auth_cookie = $cookieStore.get('auth_cookie');
        var expires_at = new Date(auth_cookie.expires_at);
        auth_cookie.expires_at = (new Date(expires_at-(3600000*24))).toISOString();
        $cookieStore.put("auth_cookie", auth_cookie);
      };
    }
  ]);

  p.controller('ValidationExampleController', ['$scope', 'ocValidators', function($scope, ocValidators) {
      $scope.ocValidators = ocValidators;

  }]);

  p.directive('validateUsername', function() {
    return {
      require: "ngModel",
      restrict: "A",
      link: function(scope, element, attributes, ngModel) {
        ngModel.$validators.matches = function(modelValue) {
          //usernamed must match admin_*
          return /admin_.*/.exec(modelValue) !== null;
        };
      }
    };
  });

  p.directive('customForm', function() {
    return {
      restrict: "E",
      require: "ngModel",
      templateUrl: "example/templates/custom_form.html",
      scope: {},
      link: function(scope, element, attributes, ngModel) {



        scope.type = "string";

        scope.selectType = function(event) {
          scope.type = $(event.target).attr("value");
        };

        ngModel.$validators.validateCustom = function() {
          if(scope.type === "string") {
            return /.+/.exec(scope.value) !== null;
          } else if(scope.type === "number") {
            return /^\d+$/.exec(scope.value) !== null;
          } else {
            return false;
          }
        };

        scope.$watch('value', function() {
          ngModel.$setViewValue(scope.value);
        });

        scope.$watch('type', function() {
          ngModel.$validate();
        });
      }
    };
  });

  p.controller('metricCardExampleController', ['$scope','$http', 'styleutils',
    function($scope, $http, styleutils) {
        $scope.metricCardData1 = {
            value: 34,
            unit: 'ms',
            range: '631 iops (min) - 221 iops (max)',
            condition: 'ok'
        };
        $scope.metricCardData2 = {
            value: 1000,
            unit: 'GB',
            range: '0 (min) - 2000 (max)',
            condition: 'critical'
        };
        $scope.metricCardData3 = {
            value: 1,
            unit: 'horsepower',
            range: '0 (min) - 100 (max)',
            condition: 'critical'
        };
        $scope.metricCardData4 = {
            value: 2,
            unit: 'cat lives',
            range: '1 (min) - 9 (max)',
            condition: 'warn'
        };
        $scope.metricCardData5 = {
            value: 42,
            unit: '',
            range: 'The answer to life, the universe, and everything',
            condition: 'unknown'
        };
        $scope.metricCardData6 = {
            'ok':{count:14},
            'warning':{count:2},
            'critical':{count:9},
            'unknown':{count:10}
        };
        $scope.metricCardHorseshoeData = {
            'data': {'count': 10},
            'max': 12,
            'unit': 'GB',
            'label': 'TOTAL'
        };
  }]);

  p.controller('DonutSVGExampleController', ['$scope','$http', 'styleutils',
    function($scope, $http, styleutils) {
        $scope.donut1Data = {'ok':{'count' : 10},'warning':{'count' : 20},'critical':{'count' : 9},'unknown':{'count' : 1}};
  }]);

  p.controller('HorseshoeSVGExampleController', ['$scope','$http', 'styleutils',
    function($scope, $http, styleutils) {
        $scope.hshoe1Data = {'data' : {'count' : 0}, 'max' : 2, 'label' : 'Widgets', 'unit' : 'XP/Lvl' };
        $scope.hshoe2Data = {'data' : {'count' : 278}, 'max' : 278, 'label' : 'Unicorn Hearts', 'unit' : '' };
        $scope.hshoe3Data = {'data' : {'count' : 14}, 'max' : 20, 'label' : 'given', 'unit' : ' fraks' };
  }]);

  p.controller('TimeseriesExampleControllerOld', ['$scope','$http',
      function($scope, $http) {
          $scope.graphData1 = [//this is sample data, a real graph will need data injected in this format
              {
                  "label": "Time 1",
                  "data": [
                      [1196463600000, 0],
                      [1196550000000, 0],
                      [1196636400000, 0],
                      [1196722800000, 77],
                      [1196809200000, 3636],
                      [1196895600000, 3575],
                      [1196982000000, 2736],
                      [1197068400000, 1086],
                      [1197154800000, 676],
                      [1197241200000, 1205],
                      [1197327600000, 906],
                      [1197414000000, 710],
                      [1197500400000, 639],
                      [1197586800000, 540],
                      [1197673200000, 435],
                      [1197759600000, 301],
                      [1197846000000, 575]
                  ]
              },
              {
                  "label": "Time 2",
                  "data": [
                      [1196463600000, 575],
                      [1196550000000, 301],
                      [1196636400000, 435],
                      [1196722800000, 77],
                      [1196809200000, 540],
                      [1196895600000, 639],
                      [1196982000000, 710],
                      [1197068400000, 906],
                      [1197154800000, 1205],
                      [1197241200000, 676],
                      [1197327600000, 1086],
                      [1197414000000, 2736],
                      [1197500400000, 3575],
                      [1197586800000, 3636],
                      [1197673200000, 77],
                      [1197759600000, 0],
                      [1197846000000, 0]
                  ]
              }
          ];

          $scope.graphData2 = [];//will read real data in from file

          $http.get('./sample_data/sample_data.json').then(function (response) {
              $scope.graphData2 = response.data.timeseriesdata || [];
          });
      }
  ]);

  p.controller('TimeseriesExampleController', ['$scope', '$http',
      function($scope, $http) {
          var actions = [{
              label: 'common.edit',
              action: function(data) {
                  alert('Edit button clicked');
              }
          }, {
              label: 'common.delete',
              action: function(data) {
                  alert('Delete button clicked');
              }
          }];

          $scope.optionsArea = {
              title: 'MEM.USABLE_PERC, MEM.TOTAL_MB',
              type: 'area',
              actionMenu: actions
          };
          $scope.dataArea = [
              {
                  "label": "MEM.USABLE_PERC",
                  "data": [
                      [1196463600000, 0],
                      [1196550000000, 0],
                      [1196636400000, 0],
                      [1196722800000, 77],
                      [1196809200000, 3636],
                      [1196895600000, 3575],
                      [1196982000000, 2736],
                      [1197068400000, 1086],
                      [1197154800000, 676],
                      [1197241200000, 1205],
                      [1197327600000, 906],
                      [1197414000000, 710],
                      [1197500400000, 639],
                      [1197586800000, 540],
                      [1197673200000, 435],
                      [1197759600000, 301],
                      [1197846000000, 575]
                  ]
              },
              {
                  "label": "MEM.TOTAL_MB",
                  "data": [
                      [1196463600000, 575],
                      [1196550000000, 301],
                      [1196636400000, 435],
                      [1196722800000, 77],
                      [1196809200000, 540],
                      [1196895600000, 639],
                      [1196982000000, 710],
                      [1197068400000, 906],
                      [1197154800000, 1205],
                      [1197241200000, 676],
                      [1197327600000, 1086],
                      [1197414000000, 2736],
                      [1197500400000, 3575],
                      [1197586800000, 3636],
                      [1197673200000, 77],
                      [1197759600000, 0],
                      [1197846000000, 0]
                  ]
              }
          ];

          $scope.optionsStackedArea = angular.copy($scope.optionsArea);
          $scope.optionsStackedArea.type = 'stackedArea';
          $scope.dataStackedArea = angular.copy($scope.dataArea);

          $scope.dataLine = [];
          $scope.dataLine1Hour = [];
          $scope.dataLine8Hours = [];
          $scope.dataLine7Days = [];
          $http.get('./sample_data/sample_data.json').then(function (response) {
              $scope.dataLine = response.data.timeseriesdata || [];
              $scope.dataLine1Hour = response.data.timeseriesdata1hour || [];
              $scope.dataLine8Hours = response.data.timeseriesdata8Hours || null;
              $scope.dataLine7Days = response.data.timeseriesdata7Days || null;
          });
          $scope.optionsLine = {
              title: 'CPU.SYSTEM_PERC',
              type: 'line'
          };
          $scope.optionsLine1Hour = {
              title: 'CPU.SYSTEM_PERC - Last 60 Minutes',
              type: 'line',
              timeUnit: 'minute'
          };
          $scope.optionsLine8Hours = {
              title: 'CPU.SYSTEM_PERC - Last 8 Hours',
              type: 'line',
              timeUnit: 'hour'
          };
          $scope.optionsLine7Days = {
              title: 'CPU.SYSTEM_PERC - Last 7 Days',
              type: 'line',
              timeUnit: 'day'
          };

          $scope.dataBar = angular.copy($scope.dataArea);
          $scope.dataBar[0].label = 'CPU Idle';
          $scope.dataBar[0].data = $scope.dataBar[0].data.slice(3, 15);
          $scope.dataBar[1].label = 'CPU Wait';
          $scope.dataBar[1].data = $scope.dataBar[1].data.slice(3, 15);
          $scope.optionsBar = {
              title: 'CPU Idle vs. CPU Wait',
              type: 'bar'
          };

          $scope.dataStackedBar = angular.copy($scope.dataBar);
          $scope.optionsStackedBar = angular.copy($scope.optionsBar);
          $scope.optionsStackedBar.type = 'stackedBar';
          $scope.optionsStackedBar.actionMenu = actions;
      }
  ]);

  p.controller('PlotExampleController', ['$scope','$http',
      function($scope, $http) {
          $scope.graphData1 = [//this is sample data, a real graph will need data injected in this format
              {
                  label: "series1",
                  data: [[-24, 2], [-18, 1.9], [-12, 1.6], [-6, 0.9], [0, 1.8]]
              },
              {
                  label: "series2",
                  data: [[-24, 3], [-18, 1.0], [-12, 2.6], [-6, 1.9], [0, 0.8]]
              }
          ];

          $scope.graphData2 = [];//will read real data in from file

          //load from a file, this could be a REST service instead
          $http.get('./sample_data/sample_data.json').then(function(response){
              $scope.graphData2 = response.data.plotdata || [];
          });

          $scope.getRandomInt = function(min, max) {
              return Math.floor(Math.random() * (max - min + 1)) + min;
          };

          $scope.randomizeData = function(){
              var numDataPoints = $scope.getRandomInt(5, 10);
              var i = 0;
              var newData = [];
              var startingPoint = $scope.getRandomInt(0, 100);
              for(i = 0; i < numDataPoints; i++){
                  newData.push([startingPoint + i, $scope.getRandomInt(0, 100)]);
              }
              $scope.graphData1[0].data = newData;
              for(i = 0; i < numDataPoints; i++){
                  newData.push([startingPoint + i, $scope.getRandomInt(0, 100)]);
              }
              $scope.graphData1[1].data = newData;

              for(i = 0; i < numDataPoints; i++){
                  newData.push([startingPoint + i, $scope.getRandomInt(0, 100)]);
              }
              $scope.graphData2[0].data = newData;
              for(i = 0; i < numDataPoints; i++){
                  newData.push([startingPoint + i, $scope.getRandomInt(0, 100)]);
              }
              $scope.graphData2[1].data = newData;

          };
      }
  ]);

  p.controller('UtilizationExampleController', ['$scope', '$http', function($scope, $http) {
      $scope.graphData1 = [
          {label: '40% Complete (info)', value: "40", type:'info'},
          {label: '20% Complete (success)', value: "20", type: 'success'},
          {label: '60% Complete (warning)', value: "60", type: 'warning'},
          {label: '80% Complete (danger)', value: "80", type: 'danger'}
      ];

      $scope.graphData2 = [];//will read real data in from file

      //load from a file, this could be a REST service instead
      $http.get('./sample_data/sample_data.json').then(function(response){
          $scope.graphData2 = response.data.utilizationdata || [];
      });
    }
  ]);

  p.controller('HeatmapExampleController', ['$scope', '$http', function($scope, $http) {
      $scope.getRandomInt = function(min, max) {
          return Math.floor(Math.random() * (max - min + 1)) + min;
      };

      $scope.title2 = 'Cluster 2';//just an example, typically would pass in some data model object
      $scope.title3 = 'Cluster 3';//just an example, typically would pass in some data model object

      $scope.myfunc = function(data) {
          alert('Clicked on id ' +data.id+ ' which has '+data.value+' alarms');
      };

      $scope.randomizeData = function() {
        $scope.heatMapData = [];
        var num = $scope.getRandomInt(1, 10);
        var i = 0;
        var id = 0;

        for(i=0; i<num; i++) {
            $scope.heatMapData.push({value: $scope.getRandomInt(1,10), state: 'critical', id: id});
            id++;
        }

        num = $scope.getRandomInt(1, 10);
        for(i=0; i<num; i++) {
            $scope.heatMapData.push({value: $scope.getRandomInt(1,10), state: 'warning', id: id});
            id++;
        }

        num = $scope.getRandomInt(1, 20);
        for(i=0; i<num; i++) {
            $scope.heatMapData.push({value: 0, state: 'ok', id: id});
            id++;
        }

        num = $scope.getRandomInt(1, 10);
        for(i=0; i<num; i++) {
            $scope.heatMapData.push({value: 0, state: 'unknown', id: id});
            id++;
        }
      };

      $scope.randomizeData();
    }
  ]);

  p.controller('LocalizationExampleController', ['$scope', '$http', '$translate', '$filter', 'isUndefined',
    function($scope, $http, $translate, $filter, isUndefined) {
        if(isUndefined($scope.translationData)){
            $scope.translationData = {};
        }
        var date = new Date();
        $translate('example.demo.dateformat').then(function(format){
            $scope.translationData.username = "Fred";
            $scope.translationData.sometime = $filter('date')(date, format, date.getTimezoneOffset());
        });

        //load from a file, this could be a REST service instead
        $http.get('./sample_data/sample_data.json').then(function(response){
            var someData = response.data.localizationexample || [];
            if(someData.length > 0){
                $scope.translationData.rawvalue = someData[0].memoryUsed;
                $scope.translationData.units = someData[0].units;
            }
        });
    }
  ]);

    p.controller('NotificationExampleController', ['$scope', 'isUndefined', 'addNotification',
        function($scope, isUndefined, addNotification) {
            $scope.notification_status = [
                {name:'info'},
                {name:'warn'},
                {name:'error'}
            ];
            $scope.notification_messages = [
                {name:'common.welcome'},
                {name:'common.test_message'},
                {name:'common.test_message2'},
                {name:'example.message1'},
                {name:'example.message2'}
            ];

            //sets only one filter on the table
            $scope.addNotification = function(){
                // need both values selected
                if(!isUndefined($scope.mess) && !isUndefined($scope.stat)) {
                    var mess = $scope.mess.name;
                    var stat = $scope.stat.name;
                    addNotification(stat, mess);
                }
            };
        }
    ]);

    p.controller('HelpSystemExampleController', ['$scope', 'addRecommendation', 'remRecommendation',
        function($scope, addRecommendation, remRecommendation){

        $scope.addRecommendation = function(){
            addRecommendation($scope.reco.message, $scope.reco.url, $scope.reco.done);
        };

        $scope.remRecommendation = function(){
            remRecommendation($scope.reco.message, $scope.reco.url, $scope.reco.done);
        };
    }]);

    p.controller('ModalDialogExampleController', ['$scope', '$translate', 'clearForm',
        function($scope, $translate, clearForm){
            $scope.myModalFlag = false;
            $scope.showHideModal = function(){
                $scope.myModalFlag = !$scope.myModalFlag;
            };

            $scope.showHideNoFooterModal = function(){
                $scope.myNoFooterModalFlag = !$scope.myNoFooterModalFlag;
            };

            $scope.showHideSmallerModal = function(){
                $scope.mySmallerModalFlag = !$scope.mySmallerModalFlag;
            };

            $scope.showHideViewlistModal = function(){
                $scope.showListViewSelectorModal = !$scope.showListViewSelectorModal;
            };

            $scope.complete = function(){
                $scope.myModalFlag = false;
                $scope.mySmallerModalFlag = false;
            };

            $scope.commitactionfun = function(form){
                //the form will be passed in here

                //could put business log in here to make the BLL call, mask the modal, and decide
                //later whether to hide the modal... in this example we're just hiding it
                $scope.myModalFlag = false;
            };

            $scope.alternateSuccess = false;
            $scope.closeactionfun = function(form){
                console.log('closeactionfun called, clearing form:' + JSON.stringify(form));
                clearForm(form);

                //could put business log in here to make the BLL call, mask the modal, and decide
                //later whether to hide the modal
                //in this case the close action functions every other time its clicked
                if($scope.alternateSuccess){
                    $scope.alternateSuccess = false;
                    return true;
                } else {
                    $scope.alternateSuccess = true;
                    return false;
                }
            };

            $scope.onDrawerCancel = function(form){
                console.log('onDrawerCancel called - if this returns false it won\'t close the drawer');
                return true;
            };

            $scope.onDrawerCommit = function(form){
                console.log('onDrawerCommit called - if this returns false it won\'t close the drawer');
                return true;
            };

            $scope.viewlistcommit = function(form){
                console.log('form from modal is:' + JSON.stringify(form));
                console.log('model after update is:' + JSON.stringify($scope.viewSelectorData));
                $scope.showListViewSelectorModal = false;
            };

            $scope.modal_example_title = $translate.instant('example.modal.title');

            $scope.loadDrawerInModal = function(modalDrawer) {
                modalDrawer.show({
                    template: 'example/templates/modal_dialog_example_drawer.html',
                    cancel: "common.cancel",
                    commit: "common.ok",
                    cancelaction: $scope.onDrawerCancel,
                    commitaction: $scope.onDrawerCommit,
                    titleKey: "example.modal.drawer.title",
                    disablecommit: false,
                    disablecancel: false
                }).then(function() {
                    console.log('commit called on modal drawer');
                }, function() {
                    console.log('cancel called on modal drawer');
                });
            };

            $scope.viewSelectorData = [{
                label: 'Item1',
                templateurl: 'example/templates/modal_viewlist_subcontent0.html',
                valid: true,
                data: undefined,
                statusClass: '',
                disabled: false
            },{
                label: 'Item2',
                templateurl: 'example/templates/modal_viewlist_subcontent1.html',
                valid: true,
                data: { name: 'demo name'},
                statusClass: '',
                disabled: false
            },{
                label: 'Item3',
                templateurl: 'example/templates/modal_viewlist_subcontent0.html',
                valid: true,
                data: undefined,
                statusClass: '',
                disabled: false
            },{
                label: 'Item4',
                templateurl: 'example/templates/modal_viewlist_subcontent1.html',
                valid: true,
                data: undefined,
                statusClass: '',
                disabled: true
            }];

            $scope.viewSelectorValid = true;

            $scope.$watch('viewSelectorData', function(){
                var valid = true;
                $scope.viewSelectorData.forEach(function(element, index, arr){
                    if(element.disabled === false && element.valid === false){
                        valid = false;
                    }
                });

                $scope.viewSelectorValid = valid;
            }, true);
    }]);

    p.controller('TableExampleController', ['$scope', '$http', '$translate', '$filter',
        function($scope, $http, $translate, $filter) {

            $scope.nameStatusDisplayFunction = function(data){
                var nameStatusFilter = $filter('tableStatusWithNameFilter');
                var statusHtml = nameStatusFilter({name: data.name, status: data.status});
                return statusHtml;
            };

            //this is an example of a filter function
            var priceFilter = function(item, filterArgs){
                if(angular.isUndefined(filterArgs)){
                    return true;
                } else {
                    //check the min and max
                    var priceNumber = Number(item.price.replace(/[^0-9\.]+/g,""));
                    if((angular.isUndefined(filterArgs.min) || priceNumber > filterArgs.min) &&
                        (angular.isUndefined(filterArgs.max) || priceNumber < filterArgs.max)){
                        return true;
                    }
                    return false;
                }
            };

            //filters that are passed into the tableConfig need to have a function and args
            var highPriceFilter = {};
            highPriceFilter.function = priceFilter;
            highPriceFilter.args = {
                min: 100.00,
                max: undefined
            };

            //filters that are passed into the tableConfig need to have a function and args
            var lowPriceFilter = {};
            lowPriceFilter.function = priceFilter;
            lowPriceFilter.args = {
                min: 0.00,
                max: 100.00
            };

            //this is a helper function keeping track of filters
            //this controller is manually tracking the filters that it has added
            //to its data. This function finds the location of those filters in the
            //array in case they need to be removed
            var priceFilterToggleIndex = function(obj){
                var i;
                for(i = 0; i < $scope.tableConfig.filters.length; i++){
                    if($scope.tableConfig.filters[i].args.min === obj.args.min &&
                        $scope.tableConfig.filters[i].args.max === obj.args.max){
                        return i;
                    }
                }
                return -1;
            };

            //sets only one filter on the table
            $scope.setPriceFilterHigh = function(){
                $scope.resetFilters();
                $scope.tableConfig.filters.push(highPriceFilter);//add only the high price filter
            };

            //sets only one filter on the table
            $scope.setPriceFilterLow = function($event){
                $scope.resetFilters();
                $scope.tableConfig.filters.push(lowPriceFilter);//add only the low price filter
            };

            //clears all existing *extra* filters and adds one specific one, the string filter on the
            //input box will still exist if configured
            $scope.resetFilters = function($event){
                $scope.tableConfig.filters = [];//empty the filters list
            };

            //example of a toggler filter, where multiple filters can be additive
            $scope.togglePriceFilterHigh = function($event){
                if($($event.target).hasClass('unselected')){
                    $scope.tableConfig.filters.push(highPriceFilter);
                    $($event.target).removeClass('unselected');
                } else {
                    $scope.tableConfig.filters.splice(priceFilterToggleIndex(highPriceFilter), 1);
                    $($event.target).addClass('unselected');
                }
            };

            //example of a toggler filter, where multiple filters can be additive
            $scope.togglePriceFilterLow = function($event){
                if($($event.target).hasClass('unselected')){
                    $scope.tableConfig.filters.push(lowPriceFilter);
                    $($event.target).removeClass('unselected');
                } else {
                    $scope.tableConfig.filters.splice(priceFilterToggleIndex(lowPriceFilter), 1);
                    $($event.target).addClass('unselected');
                }
            };

            //load from a file, this could be a REST service instead
            $http.get('./sample_data/sample_data.json').then(function(response){
                var someData = response.data.tabledata || [];
                if(someData.length > 0){
                    $scope.data = someData;//"data" is the model name specified in the directive attribute
                }

                someData = response.data.statusTabledata || [];
                if(someData.length > 0){
                    $scope.statusData = someData;//"data" is the model name specified in the directive attribute
                }
            });

            //example that blocks the elephants row from being selected
            $scope.allowRowSelectionCheck = function(data){
                if(data.something === 'elephants'){
                    return false;
                }
                return true;
            };

            $scope.actionMenuPermissionsCheck = function(data, actionName){//rename and document this
                var actionPermissions = {
                    enabled: true,
                    hidden: false
                };

                if(actionName === 'action2'){
                    //if price is one of the values, enable/disable action2 based on the price
                    if(!angular.isUndefined(data.price)){
                        var decimalDelimiter = $translate.instant("number.decimal.delimiter");
                        var replacementString = new RegExp("[^0-9\\" + decimalDelimiter + "]","g");
                        var number1 = Number(data.price.replace(replacementString, ""));
                        if(number1 > 100){
                            actionPermissions = {
                                enabled: true,
                                hidden: false
                            };
                        } else {
                            actionPermissions = {
                                enabled: false,
                                hidden: false
                            };
                        }
                    } else {//if price isnt in the data field
                        actionPermissions = {
                            enabled: true,
                            hidden: true
                        };
                    }
                }

                if(actionName === 'action3'){
                    actionPermissions = {
                        enabled: false,
                        hidden: false
                    };
                }

                return actionPermissions;
            };

            $scope.multiSelectActionMenuPermissionsCheck = function(data, actionName){
                if(!angular.isUndefined(data) && data.length !== 1 && actionName === 'multiSelectAction2'){
                    return {
                        hidden: false,
                        enabled: false
                    };
                }

                return {
                    hidden: false,
                    enabled: true
                };
            };

            //headers will be parsed into columns
            //filters is an optional config with additional filters to apply
            //pageConfig is to customize paging settings if pageable is set on the table
            $scope.tableConfig = {
                headers: [
                    {
                        name: $translate.instant('example.column.name'),
                        type: 'string',
                        sortfield: 'something',
                        displayfield: 'something',
                        highlightExpand: true
                    },
                    {
                        name: $translate.instant('example.column.price'),
                        type: 'number',
                        sortfield: 'price',
                        displayfield: 'price',
                        helpTooltip: function(item){
                            return "I am the mighty tooltip! Your item is:" + item;
                        },
                        tooltipplacement: 'top',
                        tooltipShow: function(data){
                            //shows the tooltip if the row is expanded
                            if(data.$expanded === true){
                                return true;
                            }

                            return false;
                        },
                        filterOptions: [{
                            displayLabel: '$6',
                            value: '$6'
                        },{
                            displayLabel: '$30',
                            value: '$30'
                        },{
                            displayLabel: '$5',
                            value: '$5'
                        },{
                            displayLabel: '$1,000',
                            value: '$1,000'
                        }]
                    }
                ],
                //since these are selected by default, include them in the list
                filters: [highPriceFilter, lowPriceFilter],
                pageConfig: {
                    page: 1,//1 is the default
                    pageSize: 5//1000 is the default
                },
                methods:['showId'],
                rowSelectionCheck: $scope.allowRowSelectionCheck,

                actionMenuConfigFunction: $scope.actionMenuPermissionsCheck,
                actionMenuConfig: [{
                    label: $translate.instant('example.table.menu.action1'),
                    name: 'action1',
                    action: function(data){
                        console.log('triggered action1');
                    }
                },{
                    label: $translate.instant('example.table.menu.action2'),
                    name: 'action2',
                    action: function(data){
                        console.log('triggered action2');
                    }
                },{
                    label: $translate.instant('example.table.menu.action3'),
                    name: 'action3',
                    action: function(data){
                        console.log('triggered action3');
                    }
                }],
                globalActionsConfig: [
                    {
                        label: $translate.instant('example.table.global.action1'),
                        name: 'globalaction1',
                        action: function(){
                            console.log('triggered global action1');
                        }
                    },
                    {
                        label: $translate.instant('example.table.global.action2'),
                        name: 'globalaction2',
                        action: function(){
                            console.log('triggered global action2');
                        }
                    },
                    {
                        label: $translate.instant('example.table.global.action3'),
                        name: 'globalaction3',
                        action: function(){
                            console.log('triggered global action3');
                        }
                    },
                    {
                        label: $translate.instant('example.table.global.action4'),
                        name: 'globalaction4',
                        action: function(){
                            console.log('triggered global action4');
                        }
                    },
                    {
                        label: $translate.instant('example.table.global.action5'),
                        name: 'globalaction5',
                        action: function(){
                            console.log('triggered global action5');
                        }
                    }
                ],
                multiSelectActionMenuConfig: [{
                    label: 'a1 - value',
                    name: 'a1',
                    action: function(){console.log('triggered select action1');}
                },{
                    label: 'b2 - value',
                    name: 'b2',
                    action: function(){console.log('triggered select action2');},
                    disabled: true
                },{
                    label: 'c3 - value',
                    name: 'c3',
                    action: function(){
                        console.log('triggered select action3');
                    }},{
                    label: 'd4 - value',
                    name: 'd4',
                    action: function(){
                        console.log('triggered select action4');
                    }},{
                    label: 'e5 - value',
                    name: 'e5',
                    action: function(){
                        console.log('triggered select action5');
                    }}
                ]
            };

            //headers will be parsed into columns
            //filters is an optional config with additional filters to apply
            //pageConfig is to customize paging settings if pageable is set on the table
            $scope.otherTableConfig = {
                headers: [
                    {
                        name: $translate.instant('example.column.price'),
                        type: 'number',
                        sortfield: 'price',
                        displayfield: 'price'
                    },
                    {
                        name: $translate.instant('example.column.name'),
                        type: 'string',
                        sortfield: 'something',
                        displayfield: 'something'
                    }

                ],
                //since these are selected by default, include them in the list
                filters: [highPriceFilter, lowPriceFilter],
                pageConfig: {
                    page: 1,//1 is the default
                    pageSize: 3//1000 is the default
                }
            };

            $scope.showId = function(itemData){
                //a more useful call here would use some data from the item and pass it along
                //to a webservice... this is just an example of pulling data from the
                //passed in data object
                alert('itemId is:' + itemData.id);
            };

            $scope.checkNotApplicable = function(data, header){
                if(header.type === 'status' && data[header.type] === 'WARN'){
                    return true;
                }
                return false;
            };

            //headers will be parsed into columns
            //filters is an optional config with additional filters to apply
            //pageConfig is to customize paging settings if pageable is set on the table
            $scope.statusTableConfig = {
                headers: [
                    {
                        name: $translate.instant('example.column.status'),
                        type: 'status',
                        sortfield: 'status',
                        displayfield: 'status',
                        filter: 'tableStatusFilter',
                        //hidden: true,//columns can be hidden but still sorted on
                        filterOptions: [{
                            displayLabel: $translate.instant('example.filter.status.unknown'),
                            value: 'UNKNOWN'
                        },{
                            displayLabel: $translate.instant('example.filter.status.ok'),
                            value: 'OK'
                        },{
                            displayLabel: $translate.instant('example.filter.status.warn'),
                            value: 'WARN'
                        },{
                            displayLabel: $translate.instant('example.filter.status.error'),
                            value: 'ERROR'
                        }]
                    },
                    {
                        name: $translate.instant('example.column.name'),
                        type: 'caselessString',
                        sortfield: 'name',
                        displayfield: 'name',
                        specialColumnType: 'custom',
                        customDisplayFilter: $scope.nameStatusDisplayFunction
                    },
                    {
                        name: $translate.instant('example.column.freespace'),
                        type: 'string',
                        sortfield: 'freespace',
                        displayfield: 'freespace',
                        filterOptions: [{
                            displayLabel: '10GB',
                            value: '10GB'
                        },{
                            displayLabel: '100GB',
                            value: '100GB'
                        },{
                            displayLabel: '1000GB',
                            value: '1000GB'
                        },{
                            displayLabel: '110GB',
                            value: '110GB'
                        }]
                    },
                    {
                        name: $translate.instant('example.column.freespacepct'),
                        type: 'string',
                        sortfield: 'freespace_pct',
                        displayfield: 'freespace_pct',
                        specialColumnType: 'percentmeter'
                    }

                ],

                filters: [],
                pageConfig: {
                    page: 1,//1 is the default
                    pageSize: 5//1000 is the default
                },
                //rowCustomizers are filters declared to change the appearance of a whole row based on the
                //data in that row
                rowCustomizers: ['statusRowHighlightFilter'],
                cellCustomizers: ['naCellFilter'],
                naValueCheck: $scope.checkNotApplicable,
                actionMenuConfigFunction: $scope.actionMenuPermissionsCheck,
                actionMenuConfig: [{
                    label: $translate.instant('example.table.menu.action1'),
                    name: 'action1',
                    action: function(data){
                        console.log('triggered action1');
                    }
                },{
                    label: $translate.instant('example.table.menu.action2'),
                    name: 'action2',
                    action: function(data){
                        console.log('triggered action2');
                    }
                },{
                    label: $translate.instant('example.table.menu.action3'),
                    name: 'action3',
                    action: function(data){
                        console.log('triggered action3');
                    }
                }],
                globalActionsConfig: [
                    {
                        label: $translate.instant('example.table.global.action1'),
                        name: 'globalaction1',
                        action: function(){
                            console.log('triggered global action1');
                        }
                    },
                    {
                        label: $translate.instant('example.table.global.action2'),
                        name: 'globalaction2',
                        action: function(){
                            console.log('triggered global action2');
                        }
                    }
                ]
            };

            $scope.$on('tableSelectionChanged', function($event, selections, tableid){
                console.log('got a selections list of length:' + selections.length + ' , from table with id of:' + tableid);
                $scope.titleWithSelectionCount = $translate.instant('example.title.table.count', {num: selections.length});
            });

            $scope.$on('tableSelectionExpanded', function($event, data, tableid){
                console.log('table selection exampled:' + data + ' , from table with id of:' + tableid);
            });

            $scope.titleWithSelectionCount = $translate.instant('example.title.table.count', {num: 0});

        }
    ]);

    p.controller('TooltipExampleController', ['$scope', function($scope) {

    }]);

    p.controller('dualgrapgh_example', ['$scope', '$rootScope', '$translate', '$http', '$cookieStore', 'isUndefined', 'addNotification', 'bllApiRequest', '$filter', 'styleutils',
        function ($scope, $rootScope, $translate, $http, $cookieStore, isUndefined, addNotification, bllApiRequest, $filter, styleutils) {
            console.log('dg example controller: launch');

            function generateTestData(iterator) {
              function getRandom(min, max) {
                return Math.floor(Math.random() * (max - min)) + min;
              }

              var data = [];

              for(var i=0;i<getRandom(0,201);i++) {
                var datum = {
                  ui_status : '',
                  condition : ''
                };
                var status = ['OK','WARN','ERROR','UNKNOWN'];
                var cndtn = ['OPEN','ACKNOWLEDGED','RESOLVED'];

                datum.ui_status = status[getRandom(0,status.length)];
                datum.condition = cndtn[getRandom(0,cndtn.length)];

                data.push(datum);
              }

              return data;
            }

            $scope.test_alarm_data1 = generateTestData('1');
            $scope.test_alarm_data2 = generateTestData('2');
            $scope.test_alarm_data3 = generateTestData('3');
            $scope.test_alarm_data4 = generateTestData('4');
            $scope.test_alarm_data5 = generateTestData('5');
        }
    ]);

    p.controller('tabbedpageExampleController', ['$scope',
        function($scope) {
            $scope.myPages = [
                {header: 'example.tabbedpage.content1', template: 'example/templates/tabbed_page_content1.html'},
                {header: 'example.tabbedpage.content2', template: 'example/templates/tabbed_page_content2.html'},
                {header: 'example.tabbedpage.content3', template: 'example/templates/tabbed_page_content3.html'}
            ];

            $scope.doSomething = function() {
                alert("Done!!");
            };
        }
    ]);

    p.controller('StackableModalExampleController', ['$scope',
        function($scope) {
            $scope.closedTab1 = function(){
                console.log('tabOneWasClosed!');
            };
            $scope.closedTab2 = function(){
                console.log('tabTwoWasClosed!');
            };
            $scope.showModal1 = function() {
                $scope.showModal1Flag = true;
            };
            $scope.showModal2 = function() {
                $scope.addStack("example/templates/stackable_modal_content2.html", $scope.closedTab2);
            };
            $scope.showModal3 = function() {
                $scope.addStack("example/templates/stackable_modal_content3.html");
            };
            $scope.actionModal3 = function() {
                alert("Done!!");
            };
        }
    ]);

    p.controller('prefs_example', ['$scope', '$rootScope', '$translate',
        '$http', '$cookieStore', 'isUndefined', 'addNotification',
        'bllApiRequest', '$filter', 'styleutils', 'prefSaver',
        function ($scope, $rootScope, $translate, $http, $cookieStore, isUndefined, addNotification, bllApiRequest, $filter, styleutils, prefSaver) {
            console.log('preferences controller: ignition!');

            console.log('USERNAME IS ' + $rootScope.user_name);

            //prefSaver.load().then(
            //    function (data) {
            //        $scope.data = data;
            //        console.log('XXLOAD IS ');
            //        console.dir(data);
            //    },
            //    function (error) {
            //        console.log('XXLOAD ERROR ');
            //    }
            //);
            // migration test
            prefSaver.load().then(
                function (data) {
                    $scope.data = data;
                    console.log('XXLOAD IS ');
                    console.dir(data);
                    prefSaver.save(data).then(
                        console.log('saved loaded prefs')
                    );
                },
                function (error) {
                    console.log('XXLOAD ERROR ');
                }
            );
           // prefSaver.save(prefs).then(
           //     function () {
           //         prefSaver.load().then(
           //             function (data) {
           //                 $scope.data = data;
           //                 console.log('XXLOAD IS ');
           //                 console.dir(data);
           //             }
           //         );
           //     });
            //$scope.test_dynamic_card = 'sdfsdf';
        }
    ]);

    p.controller('ProjectListExampleController', ['$scope', '$translate', 'bllApiRequest', 'isUndefined', '$q',
        function ($scope, $translate, bllApiRequest, isUndefined, $q) {

            $scope.projectFilter = 'all';
        }

    ]);

    p.controller('d3graph_example', ['$scope', '$http', 'commonChartLegendButtons',
        function ($scope, $http, commonChartLegendButtons) {
            $scope.sample_data = [];
            $http.get('./sample_data/sample_data.json').then(function (response) {
                $scope.sample_data = response.data;
                $scope.d3Data = response.data.chartData || [];
                $scope.barData = response.data.barData || [];
                $scope.stackArea = response.data.stackarea || [];
                $scope.stackBar = response.data.stackbar || [];
                $scope.multiLineData = response.data.multiLineData || [];
                $scope.multiLineDataGaps = angular.copy(response.data.multiLineData) || [];
                $scope.multiLineDataGaps[0].data.splice(150 , 150);
                $scope.multiLineDataGaps[1].data.splice(50 , 50);
            });

            var actions = [{
                label: 'common.edit',
                action: function (config) {
                    console.log(config);
                }
            }, {
                label: 'common.delete',
                action: function (config) {
                    console.log(config);
                }
            }];

            $scope.chart_config = {
                legendConfig: {
                    legendButtons: commonChartLegendButtons,
                    legendButtonsValue: '1day',
                    legendLabels: []
                },
                graphOptions: {
                    graphTitleConfig: {
                        name: "D3 Charts",
                        styleClass: "chartTitle"
                        // In this variable pass user-defined css class to style the Chart Title
                    },

                    graphColors: {
                        fill: "#2AD2C9",
                        // In this variable pass the color to be filled in Bar & Area Charts.
                        stroke: "#2AD2C9",
                        // In this variable pass the color of the stroke which to be used to define stroke color.
                        stackColors: ["#2AD2C9", "#FD9A69"]
                    },
                    graphAxisConfig: {
                        xAxis: {
                            range: "hours",
                            interval: [1, "hours"],
                            tickFormat: "%H:%M"
                        }
                    }
                },
                actionMenu: actions
            };

            $scope.linechartConfig = angular.copy($scope.chart_config);
            $scope.linechartConfig.legendConfig.legendLabels.push({
                label: "Cpu.Idle_perc:hostname=devstack",
                color: "#2AD2C9"
            });
            $scope.barchartConfig = angular.copy($scope.linechartConfig);
            $scope.areachartConfig = angular.copy($scope.linechartConfig);
            $scope.stackChartsConfig = angular.copy($scope.chart_config);
            $scope.stackChartsConfig.legendConfig.legendLabels.push({
                label: "Cpu.Idle_perc:hostname=devstack",
                color: "#2AD2C9"
            }, {label: "Cpu.Idle_perc:hostname=devstack2", color: "#FD9A69"});


            $scope.$on('d3ChartLegendButtonAction', function ($event, data1, data2) {
                console.log(data1);
                console.log(data2);

                if (data2.toString() === "d3_graph_chart001") {
                    if (data1.toString() === "1day") {
                        $scope.linechartConfig.graphOptions.graphAxisConfig.xAxis = {};
                        $scope.linechartConfig.graphOptions.graphAxisConfig.xAxis = {
                            range: "hours",
                            interval: [1, "hours"],
                            tickFormat: "%H:%M"
                        };
                        $scope.d3Data = $scope.sample_data.chartData || [];
                    } else {
                        $scope.linechartConfig.graphOptions.graphAxisConfig.xAxis = {};
                        $scope.linechartConfig.graphOptions.graphAxisConfig.xAxis = {
                            range: "days",
                            interval: [1, "days"],
                            tickFormat: "%m-%d"
                        };
                        $scope.d3Data = $scope.sample_data.chartData7Days || [];
                    }
                } else if (data2.toString() === "d3_graph_bar002") {
                    if (data1.toString() === "1day") {
                        $scope.barchartConfig.graphOptions.graphAxisConfig.xAxis = {};
                        $scope.barchartConfig.graphOptions.graphAxisConfig.xAxis = {
                            range: "hours",
                            interval: [1, "hours"],
                            tickFormat: "%H:%M"
                        };
                        $scope.barData = $scope.sample_data.barData || [];
                    } else {
                        $scope.barchartConfig.graphOptions.graphAxisConfig.xAxis = {};
                        $scope.barchartConfig.graphOptions.graphAxisConfig.xAxis = {
                            range: "days",
                            interval: [1, "days"],
                            tickFormat: "%m-%d"
                        };
                        $scope.barData = $scope.sample_data.barData7Days || [];
                    }
                }
            });
        }
    ]);
})(angular);
