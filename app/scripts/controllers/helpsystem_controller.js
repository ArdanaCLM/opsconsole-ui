// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(ng) {
    'use strict';

    ng.module('operations-ui').controller('HelpSystemController', ['$scope', '$rootScope',
        function ($scope, $rootScope) {
            $scope.getHelpOnPageUrl = function(hash){
                var helpBaseUrl = location.protocol + "//" + location.hostname + ":" + location.port + "/doc";
                return helpBaseUrl + hash;
            };

            $scope.helpOptions = {};
            $scope.helpOptions.recommended = [];//this list will be dynamic

            //help on this page will change by page via the scope listener defined farther down
            $scope.helpOptions.documentation = [{messageKey:'help.helpOnThisPage', url: $scope.getHelpOnPageUrl(location.hash)},
                {messageKey:'help.browseHelp', url: $scope.getHelpOnPageUrl("")}];
            $scope.helpOptions.license = [{messageKey:'help.license', url:"#license"}];//URL to be updated

            $scope.$on('addRecommendationEvent', function(event, recomendation){
                $scope.helpOptions.recommended.push(recomendation);
            });

            $scope.$on('remRecommendationEvent', function(event, recomendation){
                var i = 0;
                for(i = $scope.helpOptions.recommended.length - 1; i >= 0; i--){
                    if($scope.helpOptions.recommended[i].messageKey === recomendation.messageKey){
                        $scope.helpOptions.recommended.splice(i, 1);
                    }
                }
            });

            $scope.$on('$locationChangeStart', function(event, next, current){
                var i = 0;
                for(i = $scope.helpOptions.documentation.length - 1; i >= 0; i--){
                    if($scope.helpOptions.documentation[i].messageKey === 'help.helpOnThisPage'){
                        $scope.helpOptions.documentation[i].url = $scope.getHelpOnPageUrl(next.substring(next.indexOf('#')));
                    }
                }
            });

            $rootScope.inlineHelpEnabled = true;
            $scope.enableInlineHelp = function(){
                $rootScope.inlineHelpEnabled = true;
            };

            $scope.disableInlineHelp = function(){
                $rootScope.inlineHelpEnabled = false;
            };
        }
    ]);
})(angular);