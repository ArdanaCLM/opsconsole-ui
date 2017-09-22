// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(){
    'use strict';
    angular.module('operations-ui').directive("dualgraphCntr", [
        '$translate',
        'styleutils',
        function($translate, styleutils) {
            return {
                restrict: "E",

                scope: {
                    data : '=',
                    ctitle : '='
                },

                templateUrl: 'components/dualgraphContainer.html',

                bindToController: true,
                controllerAs : 'ctrl',
                controller : function() {
                    console.log('launched container');
                },

                link : function(scope, el, attr) {
                    console.log('linked container');

                    scope.showZones = false;


                    // test data generated here till we get some topology going....
                    //

                    var zoneData = [];

                    function getRandom(min, max) {
                        return Math.floor(Math.random() * (max - min)) + min;
                    }

                    function generateTestData(iterator) {

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

                      data.ctitle = 'Zone - ' + iterator;

                      return data;
                    }

                    for(var i = 0; i < getRandom(0,411); i++) {
                        zoneData.push( generateTestData(i) );
                    }

                    scope.ctrl.data.zoneData = zoneData;

                    scope.$watch('ctrl.data', function() {
                        
                    }, true);
                }
            };
        }
    ]);
})();