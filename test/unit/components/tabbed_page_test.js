// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
    'use strict';

    describe("Directive: Tabbed Page", function() {
        var $compile, scope, logholder = {
          error: angular.noop,
          info: angular.noop,
          warn: angular.noop,
          debug: angular.noop,
          log: angular.noop
        };
        var testPages = [
            {header: 'example.tabbedpage.content1', template: 'example/templates/tabbed_page_content1.html'},
            {header: 'example.tabbedpage.content2', template: 'example/templates/tabbed_page_content2.html'},
            {header: 'example.tabbedpage.content3', template: 'example/templates/tabbed_page_content3.html'}
        ];

        beforeEach(module('operations-ui', function($provide) {
            $provide.value('$log', logholder);
        }));

        beforeEach(inject(function(_$compile_, _$rootScope_, $injector) {
            $compile = _$compile_;
            scope = _$rootScope_.$new();
        }));

        describe('with missing value for pagelist', function() {
            var tabbedElement;

            beforeEach(function() {
                spyOn(logholder, 'error');
                var pages = '<tabbedpage></tabbedpage>';
                tabbedElement = $compile(pages)(scope);
                scope.$digest();
            });

            it('should print out an error message', function() {
                expect(logholder.error).toHaveBeenCalled();
            });
        });

        describe('with pagelist value', function() {
           var tabbedElement;

            beforeEach(function() {
                scope.myPages = testPages;
                var pages = '<tabbedpage pageList="myPages"></tabbedpage>';
                tabbedElement = $compile(pages)(scope);
                scope.$digest();
            });

            it('should create tabbed pages succesfully', function() {
                expect(tabbedElement).toBeDefined();
                var tabCount = tabbedElement.find('div.tabbed-page-container ul li').length;
                expect(tabCount).toBe(3);
                var pageCount = tabbedElement.find('div.tabbed-page-container div.page-content ng-form').length;
                expect(pageCount).toBe(3);
            });
        });
    })
})()
