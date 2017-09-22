// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
    'use strict';

    describe('Directive: Metric Chart', function() {
        var $compile, scope, q, bllApiRequest, realNextFrame, realCancelFrame;
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
        var element1 = {
            metric: 'cpu.system_perc',
            dimensions: [{
                key: 'hostname',
                value: 'apprentice-ccp-c1-m1-mgmt'
            }]
        };
        var element2 = {
            metric: 'cpu.user_perc',
            dimensions: [{
                key: 'hostname',
                value: 'apprentice-ccp-c1-m1-mgmt'
            }]
        };
        var rawData = [
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
        ];

        describe('when getting data successfully', function() {
            beforeEach(module('operations-ui', function($provide) {
                bllApiRequest = {
                    get: function(ops, chart) {
                        var deferred = q.defer();
                        if (chart.operation === 'metric_statistics') {
                            deferred.resolve({
                                data: [{statistics: rawData}]
                            });
                        } else {
                            deferred.resolve({
                                data: [{measurements: rawData}]
                            });
                        }
                        return deferred.promise;
                    }
                };
                $provide.value('bllApiRequest', bllApiRequest);
                $provide.value('d3Service', window.d3);
            }));

            beforeEach(inject(function(_$compile_, _$rootScope_, _$q_) {
                q = _$q_;
                $compile = _$compile_;
                scope = _$rootScope_.$new();
            }));

            beforeEach(function() {
                jasmine.clock().install();
                jasmine.RequestAnimationFrame.install();
                realNextFrame = window.nextFrame;
                realCancelFrame = window.cancelFrame;
                window.nextFrame = window.requestAnimationFrame;
                window.cancelFrame = window.cancelAnimationFrame;
            });

            afterEach(function() {
                jasmine.clock().uninstall();
                jasmine.RequestAnimationFrame.uninstall();
                window.nextFrame = realNextFrame;
                window.cancelFrame = realCancelFrame;
            });

            describe('to create a line, area, or stacked area chart', function() {
                var chartElement;

                beforeEach(function() {
                    scope.metric = {
                        config: {title: 'Memory Usable in MB', type: 'line', actionMenu: actions},
                        wide: false,
                        rightCol: false,
                        interval: 5,
                        range: 4,
                        elements: [element1],
                        data: [[new Date().getTime(), 0]]
                    };

                    var graph = '<metric-chart metric="metric"></metric-chart>';
                    chartElement = $compile(graph)(scope);
                    scope.$digest();
                });

                it('should get measurements data', function() {
                    expect(chartElement).toBeDefined();
                    expect(scope.$$childHead.config).toEqual(scope.metric.config);
                    expect(scope.$$childHead.wide).toEqual(scope.metric.wide);
                    expect(scope.$$childHead.rightCol).toEqual(scope.metric.rightCol);
                    expect(scope.$$childHead.data).toBeDefined();
                    expect(scope.$$childHead.data.length).toEqual(0);

                    spyOn(bllApiRequest, 'get').and.callThrough();
                    // simulate window.requestAnimationFrame call
                    jasmine.RequestAnimationFrame.tick();
                    // Important - need to trigger a new digest cycle so that the bblApiRequest's
                    // callback gets called after the data was mocked
                    scope.$digest();

                    expect(bllApiRequest.get).toHaveBeenCalled();
                    expect(scope.$$childHead.showOverlay).toBe(false);
                    expect(scope.$$childHead.data.length).toBeGreaterThan(0);
                });
            });

            describe('to create a bar or stacked bar chart', function() {
                var chartElement;

                beforeEach(function() {
                    scope.metric = {
                        config: {title: 'Memory Usable in MB', type: 'bar', actionMenu: actions},
                        wide: false,
                        rightCol: false,
                        interval: 5,
                        range: 4,
                        elements: [element1, element2],
                        data: [[new Date().getTime(), 0]]
                    };

                    var graph = '<metric-chart metric="metric"></metric-chart>';
                    chartElement = $compile(graph)(scope);
                    scope.$digest();
                });

                it('should get statistics data', function() {
                    expect(chartElement).toBeDefined();
                    expect(scope.$$childHead.config).toEqual(scope.metric.config);
                    expect(scope.$$childHead.wide).toEqual(scope.metric.wide);
                    expect(scope.$$childHead.rightCol).toEqual(scope.metric.rightCol);
                    expect(scope.$$childHead.data).toBeDefined();
                    expect(scope.$$childHead.data.length).toEqual(0);

                    spyOn(bllApiRequest, 'get').and.callThrough();
                    jasmine.RequestAnimationFrame.tick();
                    scope.$digest();

                    expect(bllApiRequest.get).toHaveBeenCalled();
                    expect(scope.$$childHead.showOverlay).toBe(false);
                    expect(scope.$$childHead.data.length).toBeGreaterThan(0);
                });
            });
        });

        describe('when getting data failed', function() {
            beforeEach(module('operations-ui', function($provide) {
                bllApiRequest = {
                    get: function(ops, chart) {
                        var deferred = q.defer();
                        if (chart.operation === 'metric_statistics') {
                            deferred.reject('error getting statistics data');
                        } else {
                            deferred.reject('error getting measurements data');
                        }
                        return deferred.promise;
                    }
                };
                $provide.value('bllApiRequest', bllApiRequest);
            }));

            beforeEach(inject(function(_$compile_, _$rootScope_, _$q_) {
                q = _$q_;
                $compile = _$compile_;
                scope = _$rootScope_.$new();
            }));

            beforeEach(function() {
                jasmine.clock().install();
                jasmine.RequestAnimationFrame.install();
                realNextFrame = window.nextFrame;
                realCancelFrame = window.cancelFrame;
                window.nextFrame = window.requestAnimationFrame;
                window.cancelFrame = window.cancelAnimationFrame;
            });

            afterEach(function() {
                jasmine.clock().uninstall();
                jasmine.RequestAnimationFrame.uninstall();
                window.nextFrame = realNextFrame;
                window.cancelFrame = realCancelFrame;
            });

            describe('to create a line, area, or stacked area chart', function() {
                var chartElement;

                beforeEach(function() {
                    scope.metric = {
                        config: {title: 'Memory Usable in MB', type: 'line', actionMenu: actions},
                        wide: false,
                        rightCol: false,
                        interval: 5,
                        range: 4,
                        elements: [element1],
                        data: [[new Date().getTime(), 0]]
                    };

                    var graph = '<metric-chart metric="metric"></metric-chart>';
                    chartElement = $compile(graph)(scope);
                    scope.$digest();
                });

                it('should get no measurements data', function() {
                    expect(chartElement).toBeDefined();
                    expect(scope.$$childHead.config).toEqual(scope.metric.config);
                    expect(scope.$$childHead.wide).toEqual(scope.metric.wide);
                    expect(scope.$$childHead.rightCol).toEqual(scope.metric.rightCol);
                    expect(scope.$$childHead.data).toBeDefined();
                    expect(scope.$$childHead.data.length).toEqual(0);

                    spyOn(bllApiRequest, 'get').and.callThrough();
                    jasmine.RequestAnimationFrame.tick();
                    scope.$digest();

                    expect(bllApiRequest.get).toHaveBeenCalled();
                    expect(scope.$$childHead.chart_config.loading).toBe(false);
                    expect(scope.$$childHead.data).toBeDefined();
                    expect(scope.$$childHead.data.length).toBe(0);
                });
            });

            describe('to create a bar or stacked bar chart', function() {
                var chartElement;

                beforeEach(function() {
                    scope.metric = {
                        config: {title: 'Memory Usable in MB', type: 'bar', actionMenu: actions},
                        wide: false,
                        rightCol: false,
                        interval: 5,
                        range: 4,
                        elements: [element1, element2],
                        data: [[new Date().getTime(), 0]]
                    };

                    var graph = '<metric-chart metric="metric"></metric-chart>';
                    chartElement = $compile(graph)(scope);
                    scope.$digest();
                });

                it('should get no statistics data', function() {
                    expect(chartElement).toBeDefined();
                    expect(scope.$$childHead.config).toEqual(scope.metric.config);
                    expect(scope.$$childHead.wide).toEqual(scope.metric.wide);
                    expect(scope.$$childHead.rightCol).toEqual(scope.metric.rightCol);
                    expect(scope.$$childHead.data).toBeDefined();
                    expect(scope.$$childHead.data.length).toEqual(0);

                    spyOn(bllApiRequest, 'get').and.callThrough();
                    jasmine.RequestAnimationFrame.tick();
                    scope.$digest();

                    expect(bllApiRequest.get).toHaveBeenCalled();
                    expect(scope.$$childHead.chart_config.loading).toBe(false);
                    expect(scope.$$childHead.data).toBeDefined();
                    expect(scope.$$childHead.data.length).toBe(0);
                });
            });
        });
    });
})();
