// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
    'use strict';

    describe("Directive: Time Series Graph", function() {
        var $compile, scope;
        var data1 = {
            "label": "MEM.USABLE_MB",
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
        };
        var data2 = {
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
        };

        beforeEach(module('operations-ui'));

        beforeEach(inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_.$new();

        }));

        describe('with two required parameters', function() {
            var widgetElement;

            beforeEach(function() {
                scope.config = {title: 'Memory Usable in MB', type: 'area'};
                scope.data = [data1];
                var graph = '<timeseries data="data" config="config"></timeseries>';
                widgetElement = $compile(graph)(scope);
                scope.$digest();
            });

            it('should create a graph widget in small size', function() {
                // widget is created
                expect(widgetElement).toBeDefined();

                // widget contains a flot graph
                var flotElement = widgetElement.find('flot');
                expect(flotElement).toBeDefined();

                // flot graph is in small size
                var width = flotElement.attr('width');
                expect(width).toBe('510px');

                // widget title is set
                var headerElement = widgetElement.find('div.header');
                expect(headerElement.html()).toContain('Memory Usable in MB');

                // widget contains a legend area
                var legendAreaElement = widgetElement.find('div.legend-area');
                expect(legendAreaElement).toBeDefined();

                // legend area contains one data name
                var legendElement = legendAreaElement.find('div.legend-text');
                expect(legendElement).toBeDefined();
                expect(legendElement.length).toBe(1);
                expect(legendElement.eq(0).text()).toBe('MEM.USABLE_MB');
            });

        });

        describe('with two required parameters and one optional parameter', function() {
            var widgetElement;

            beforeEach(function() {
                var actions = [{
                    label: 'Edit',
                    action: function(data) {
                        alert('Edit button clicked');
                    }
                }, {
                    label: 'Delete',
                    action: function(data) {
                        alert('Delete button clicked');
                    }
                }];
                scope.config = {title: 'Memory Usable vs. Memory Total', type: 'line', actionMenu: actions};
                scope.data = [data1, data2];
                var graph = '<timeseries data="data" config="config" wide=true></timeseries>';
                widgetElement = $compile(graph)(scope);
                scope.$digest();
            });

            it('should create a graph widget in large size', function() {
                // widget is created
                expect(widgetElement).toBeDefined();

                // widget contains a flot graph
                var flotElement = widgetElement.find('flot');
                expect(flotElement).toBeDefined();

                // flot graph is in large size
                var width = flotElement.attr('width');
                expect(width).toBe('1100px');

                // widget title is set
                var headerElement = widgetElement.find('div.header');
                expect(headerElement.html()).toContain('Memory Usable vs. Memory Total');

                // widget contains action menu
                var actionsElements = headerElement.find('button.actionMenuItem');
                expect(actionsElements).toBeDefined();
                expect(actionsElements.length).toBe(2);
                expect(actionsElements.eq(0).text()).toBe('Edit');
                expect(actionsElements.eq(1).text()).toBe('Delete');

                // widget contains a legend area
                var legendAreaElement = widgetElement.find('div.legend-area');
                expect(legendAreaElement).toBeDefined();

                // legend area contains data names
                var legendElements = legendAreaElement.find('div.legend-text');
                expect(legendElements).toBeDefined();
                expect(legendElements.length).toBe(2);
                expect(legendElements.eq(0).text()).toBe('MEM.USABLE_MB');
                expect(legendElements.eq(1).text()).toBe('MEM.TOTAL_MB');
            });
        });
    })
})()