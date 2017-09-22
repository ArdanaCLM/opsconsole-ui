// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
    'use strict';

    describe('Time Series Graph controller', function() {
        var $controller, scope;

        beforeEach(module('operations-ui'));

        beforeEach(inject(function(_$controller_, _$rootScope_) {
            $controller = _$controller_;
            scope = _$rootScope_.$new();
        }));

        describe('to create a line graph', function() {
            it('should set up config for a line graph', function() {
                scope.config = {title: 'Memory Usable in MB', type: 'line'};
                var timeseriesController = $controller('timeseriesController', {$scope: scope, $element: null});

                // graphOptions is created
                expect(scope.graphOptions).toBeDefined();

                // graphOptions contains line config
                expect(scope.graphOptions.series.lines).toBeDefined();

                // line config is set to show but not filled
                expect(scope.graphOptions.series.lines.show).toBeDefined();
                expect(scope.graphOptions.series.lines.show).toBe(true);
                expect(scope.graphOptions.series.lines.fill).not.toBeDefined();
            });
        });

        describe('to create an area graph', function() {
            it('should set up config for an area graph', function() {
                scope.config = {title: 'Memory Usable in MB', type: 'area'};
                var timeseriesController = $controller('timeseriesController', {$scope: scope, $element: null});

                // graphOptions is created
                expect(scope.graphOptions).toBeDefined();

                // graphOptions contains line config
                expect(scope.graphOptions.series.lines).toBeDefined();

                // line config is set to show and filled
                expect(scope.graphOptions.series.lines.show).toBeDefined();
                expect(scope.graphOptions.series.lines.show).toBe(true);
                expect(scope.graphOptions.series.lines.fill).toBeDefined();

                // graphOptions does not contain stack config
                expect(scope.graphOptions.series.stack).not.toBeDefined();
            });
        });

        describe('to create a stacked area graph', function() {
            it('should set up config for a stacked area graph', function() {
                scope.config = {title: 'Memory Usable in MB', type: 'stackedArea'};
                $controller('timeseriesController', {$scope: scope, $element: null});

                // graphOptions is created
                expect(scope.graphOptions).toBeDefined();

                // graphOptions contains lines config
                expect(scope.graphOptions.series.lines).toBeDefined();

                // lines config is set to show and filled
                expect(scope.graphOptions.series.lines.show).toBeDefined();
                expect(scope.graphOptions.series.lines.show).toBe(true);
                expect(scope.graphOptions.series.lines.fill).toBeDefined();

                // graphOptions contains stack config
                expect(scope.graphOptions.series.stack).toBeDefined();
                expect(scope.graphOptions.series.stack).toBe(true);
            });
        });

        describe('to create a bar graph', function() {
            it('should set up config for a bar graph', function() {
                scope.config = {title: 'Memory Usable in MB', type: 'bar'};
                $controller('timeseriesController', {$scope: scope, $element: null});

                // graphOptions is created
                expect(scope.graphOptions).toBeDefined();

                // graphOptions contains bars config
                expect(scope.graphOptions.series.bars).toBeDefined();

                // bars config is set to show
                expect(scope.graphOptions.series.bars.show).toBeDefined();
                expect(scope.graphOptions.series.bars.show).toBe(true);

                // graphOptions does not contain stack config
                expect(scope.graphOptions.series.stack).not.toBeDefined();
            });
        });

        describe('to create a stacked bar graph', function() {
            it('should set up config for a stacked bar graph', function() {
                scope.config = {title: 'Memory Usable in MB', type: 'stackedBar'};
                $controller('timeseriesController', {$scope: scope, $element: null});

                // graphOptions is created
                expect(scope.graphOptions).toBeDefined();

                // graphOptions contains lines config
                expect(scope.graphOptions.series.bars).toBeDefined();

                // bars config is set to show
                expect(scope.graphOptions.series.bars.show).toBeDefined();
                expect(scope.graphOptions.series.bars.show).toBe(true);

                // graphOptions contains stack config
                expect(scope.graphOptions.series.stack).toBeDefined();
                expect(scope.graphOptions.series.stack).toBe(true);
            });
        });

        describe('to create a graph with "minute" time unit', function() {
            it('should set up minute config for x axis tick formatter', function() {
                scope.config = {title: 'Memory Usable in MB', type: 'bar', timeUnit: 'minute'};
                $controller('timeseriesController', {$scope: scope, $element: null});

                // graphOptions is created
                expect(scope.graphOptions).toBeDefined();

                // tick formatter is set in minute unit
                var func = scope.graphOptions.xaxis.tickFormatter;
                expect(func).toBeDefined();
                expect(func.name).toBe('labelFormatterMinute');
                func();
                expect(scope.graphOptions.xaxis.max).not.toBeDefined();
                expect(scope.graphOptions.xaxis.min).not.toBeDefined();
                expect(scope.graphOptions.series.bars.barWidth).toBeDefined();
                var oldBarWidth = scope.graphOptions.series.bars.barWidth;

                scope.data = [{data: [
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
                ]}]
                // trigger the digest cycle to read the data
                scope.$digest();

                expect(scope.graphOptions.xaxis.max).toBeDefined();
                expect(scope.graphOptions.xaxis.min).toBeDefined();
                expect(scope.graphOptions.series.bars.barWidth).not.toEqual(oldBarWidth);

            });
        });

        describe('to create a graph with "hour" time unit', function() {
            it('should set up hour config for x axis tick formatter', function() {
                scope.config = {title: 'Memory Usable in MB', type: 'bar', timeUnit: 'hour'};
                $controller('timeseriesController', {$scope: scope, $element: null});

                // graphOptions is created
                expect(scope.graphOptions).toBeDefined();

                // tick formatter is set in hour unit
                var func = scope.graphOptions.xaxis.tickFormatter;
                expect(func).toBeDefined();
                expect(func.name).toBe('labelFormatterHour');
                func();
                expect(scope.graphOptions.xaxis.max).not.toBeDefined();
                expect(scope.graphOptions.xaxis.min).not.toBeDefined();
                expect(scope.graphOptions.series.bars.barWidth).toBeDefined();
                var oldBarWidth = scope.graphOptions.series.bars.barWidth;

                scope.data = [{data: [
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
                ]}]
                // trigger the digest cycle to read the data
                scope.$digest();

                expect(scope.graphOptions.xaxis.max).toBeDefined();
                expect(scope.graphOptions.xaxis.min).toBeDefined();
                expect(scope.graphOptions.series.bars.barWidth).not.toEqual(oldBarWidth);
            });
        });

        describe('to create a graph with "day" time unit and > 7 days of data', function() {
            it('should set up hour config for x axis tick formatter', function() {
                scope.config = {title: 'Memory Usable in MB', type: 'bar', timeUnit: 'day'};
                $controller('timeseriesController', {$scope: scope, $element: null});

                // graphOptions is created
                expect(scope.graphOptions).toBeDefined();

                // tick formatter is set not set until data comes in
                expect(scope.graphOptions.xaxis.tickFormatter).not.toBeDefined();

                scope.data = [{data: [
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
                ]}]
                // trigger the digest cycle to read the data
                scope.$digest();

                var func = scope.graphOptions.xaxis.tickFormatter;
                expect(func).toBeDefined();
                expect(func.name).toBe('labelFormatterDay');
                func();
            });
        });

        describe('to create a graph with action menu', function() {
            it('should set up actionable config and action menu', function() {
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
                scope.config = {title: 'Memory Usable in MB', type: 'line', actionMenu: actions};
                $controller('timeseriesController', {$scope: scope, $element: null});

                // actionable config is set to true
                expect(scope.actionable).toBeDefined();
                expect(scope.actionable).toBe(true);

                // action menu is set
                expect(scope.actionMenu).toBeDefined();
                expect(scope.actionMenu.length).toBe(2);
                expect(scope.actionMenu[0].label).toBe('Edit');
                expect(scope.actionMenu[1].label).toBe('Delete');
            });
        });
    });
})();