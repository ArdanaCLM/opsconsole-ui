// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
    'use strict';

    describe("Directive: Stackable Modal", function() {
        var $compile, scope, $templateCache;

        beforeEach(module('operations-ui'));

        beforeEach(inject(function(_$compile_, _$rootScope_, _$templateCache_) {
            $compile = _$compile_;
            $templateCache = _$templateCache_;
            scope = _$rootScope_.$new();
        }));

        describe('test', function() {

        })

        describe('with missing value for name', function() {
            var modalElement;

            beforeEach(function() {
                spyOn(console, 'log');
                var graph = '<stackablemodal showAttribute="showModal1Flag" modalTemplateUrl="\'example/templates/stackable_modal_content1.html\'""></stackablemodal>';
                modalElement = $compile(graph)(scope);
                scope.$digest();
            });

            it('should print out an error message', function() {
                expect(console.log).toHaveBeenCalled();
            });
        });

        describe('with missing value for showAttribute', function() {
            var modalElement;

            beforeEach(function() {
                spyOn(console, 'log');
                var graph = '<stackablemodal name="stack1" modalTemplateUrl="\'example/templates/stackable_modal_content1.html\'""></stackablemodal>';
                modalElement = $compile(graph)(scope);
                scope.$digest();
            });

            it('should print out an error message', function() {
                expect(console.log).toHaveBeenCalled();
            });
        });

        describe('with missing value for modalTemplateUrl', function() {
            var modalElement;

            beforeEach(function() {
                spyOn(console, 'log');
                var graph = '<stackablemodal name="stack1" showAttribute="showModal1Flag"></stackablemodal>';
                modalElement = $compile(graph)(scope);
                scope.$digest();
            });

            it('should print out an error message', function() {
                expect(console.log).toHaveBeenCalled();
            });
        });

        describe('with all required attributes provided and showAttribute set to true', function() {
            var modalElement, controller;

            beforeEach(inject(function() {
                var graph = '<stackablemodal name="stack1" showAttribute="showModal1Flag" modalTemplateUrl="\'example/templates/stackable_modal_content1.html\'""></stackablemodal>';
                var elem = angular.element(graph);
                scope.showModal1Flag = true;
                modalElement = $compile(elem)(scope);
                scope.$digest();
                controller = elem.controller;
            }));

            it('should create modal successfully', function() {
                expect(modalElement).toBeDefined();
                var tabCount = modalElement.find('.stackable-modal-content').length;
                expect(tabCount).toBe(1);
                expect(scope.$$childHead.showattribute).toBe(true);
            });

            /*it('should have more tabs when adding more modals', inject(function() {
                scope.$$childHead.addStack("example/templates/stackable_modal_content2.html");
                scope.$digest();
                var tabCount = modalElement.find('.stackable-modal-content').length;
                expect(tabCount).toBe(2);
                setTimeout(function() {
                  scope.$$childHead.addStack("example/templates/stackable_modal_content3.html");
                  scope.$digest();
                  tabCount = modalElement.find('.stackable-modal-content').length;
                  expect(tabCount).toBe(3);
              }, 1700);
            }));*/ //removed due to timing issues

            /*it('should have less tabs when closing modals', inject(function($timeout) {
                scope.$$childHead.addStack("example/templates/stackable_modal_content2.html");
                scope.$digest();
                setTimeout(function() {
                  scope.$$childHead.addStack("example/templates/stackable_modal_content3.html");
                  scope.$digest();

                  scope.$$childHead.closeModal();
                  scope.$digest();
                  $timeout.flush();
                  var tabCount = modalElement.find('.stackable-modal-content').length;
                  expect(tabCount).toBe(2);

                  scope.$$childHead.closeModal();
                  scope.$digest();
                  $timeout.flush();
                  var tabCount = modalElement.find('.stackable-modal-content').length;
                  expect(tabCount).toBe(1);

                  scope.$$childHead.closeModal();
                  scope.$digest();
                  $timeout.flush();
                  var tabCount = modalElement.find('.stackable-modal-content').length;
                  expect(tabCount).toBe(1);
                  expect(scope.$$childHead.showattribute).toBe(false);
              }, 1700);
            }));*/ //removed due to timing issues
        });
    })
})()
