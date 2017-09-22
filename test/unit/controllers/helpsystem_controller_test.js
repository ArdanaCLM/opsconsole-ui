// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
'use strict';

describe('Controller: HelpSystemController', function () {
    var ctrl, scope, addRec, remRec, rootScope;
    beforeEach(module('helpers'));
    beforeEach(module('operations-ui'));

    beforeEach(inject(function ($controller, $rootScope, addRecommendation, remRecommendation) {
        rootScope = $rootScope;
        scope = $rootScope.$new();
        addRec = addRecommendation;
        remRec = remRecommendation;
        ctrl = $controller('HelpSystemController',{
            $scope: scope
        });
    }));

    it('should be available', function () {
        expect(ctrl).toBeDefined();
        expect(scope).toBeDefined();
    });

    it('should add and remove recommendations', function () {
        expect(addRec).toBeDefined();
        expect(remRec).toBeDefined();
        addRec("testMessage", "http://www.openstack.org", false);
        expect(scope.helpOptions.recommended.length === 1).toBe(true);
        remRec("testMessage", "http://www.openstack.org", false);
        expect(scope.helpOptions.recommended.length === 0).toBe(true);
    });

    it('supports enable/disable of inline help', function () {
        expect(scope.enableInlineHelp).toBeDefined();
        expect(scope.disableInlineHelp).toBeDefined();
        scope.enableInlineHelp();
        expect(rootScope.inlineHelpEnabled).toBe(true);
        scope.disableInlineHelp();
        expect(rootScope.inlineHelpEnabled).toBe(false);
    });

    it('updates help url when page changes', function () {
        var i = 0;
        var url1, url2;
        for(i = scope.helpOptions.documentation.length - 1; i >= 0; i--){
            if(scope.helpOptions.documentation[i].messageKey === 'help.helpOnThisPage'){
                url1 = scope.helpOptions.documentation[i].url;
            }
        }

        rootScope.$broadcast('$locationChangeStart', "http://localhost:8080/#summary" , location.url);

        for(i = scope.helpOptions.documentation.length - 1; i >= 0; i--){
            if(scope.helpOptions.documentation[i].messageKey === 'help.helpOnThisPage'){
                url2 = scope.helpOptions.documentation[i].url;
            }
        }
        expect(url1 === url2).toBe(false);

        rootScope.$broadcast('$locationChangeStart', "http://localhost:8080/#summary" , location.url);

        for(i = scope.helpOptions.documentation.length - 1; i >= 0; i--){
            if(scope.helpOptions.documentation[i].messageKey === 'help.helpOnThisPage'){
                url1 = scope.helpOptions.documentation[i].url;
            }
        }

        expect(url1 === url2).toBe(true);

        rootScope.$broadcast('$locationChangeStart', "http://localhost:8080/#login" , location.url);

        for(i = scope.helpOptions.documentation.length - 1; i >= 0; i--){
            if(scope.helpOptions.documentation[i].messageKey === 'help.helpOnThisPage'){
                url2 = scope.helpOptions.documentation[i].url;
            }
        }
        expect(url1 === url2).toBe(false);
    });
});
})();
