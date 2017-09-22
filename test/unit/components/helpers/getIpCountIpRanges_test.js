// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
  'use strict';

  describe('Component: getIpCountIpRanges', function () {
    var getIpCountIpRanges;

    beforeEach(module('pascalprecht.translate'));
    beforeEach(module('ngCookies'));
    beforeEach(module('ngMock'));
    beforeEach(module('helpers'));

    beforeEach(inject(function($injector) {
      getIpCountIpRanges = $injector.get('getIpCountIpRanges');
    }));

    it('should be available', function () {
      expect(getIpCountIpRanges).toBeDefined();
      expect(typeof getIpCountIpRanges).toBe('function');
    });

    it('should return a zero on non-array', function () {
      expect(getIpCountIpRanges).toBeDefined();
      expect(typeof getIpCountIpRanges).toBe('function');

      expect(getIpCountIpRanges('15.1.5.16')).toBe(0);
    });

    it('should return a range value with one range', function () {
      expect(getIpCountIpRanges).toBeDefined();
      expect(typeof getIpCountIpRanges).toBe('function');

      var data = [
        '15.1.5.16-15.1.5.17'
      ];

      expect(getIpCountIpRanges(data)).toBe(2);
    });

    it('should return a range value with two range', function () {
      expect(getIpCountIpRanges).toBeDefined();
      expect(typeof getIpCountIpRanges).toBe('function');

      var data = [
        '15.1.5.16-15.1.5.17',
        '15.1.5.50-15.1.5.51'
      ];

      expect(getIpCountIpRanges(data)).toBe(4);
    });

    it('should return a range value with large range', function () {
      expect(getIpCountIpRanges).toBeDefined();
      expect(typeof getIpCountIpRanges).toBe('function');

      var data = [
        '15.1.5.16-17.1.5.17',
        '100.1.5.50-100.1.5.51'
      ];

      expect(getIpCountIpRanges(data)).toBe(25603);
    });

    it('should return a range value with undefined value', function () {
      expect(getIpCountIpRanges).toBeDefined();
      expect(typeof getIpCountIpRanges).toBe('function');

      expect(getIpCountIpRanges(undefined)).toBe(0);
    });

    it('should return a range value with two overlapping ranges', function () {
      expect(getIpCountIpRanges).toBeDefined();
      expect(typeof getIpCountIpRanges).toBe('function');

      var data = [
        '15.1.5.16-15.1.5.17',
        '15.1.5.17-15.1.5.18'
      ];

      expect(getIpCountIpRanges(data)).toBe(3);

      data = [
        '15.1.5.17-15.1.5.18',
        '15.1.5.16-15.1.5.17'
      ];

      expect(getIpCountIpRanges(data)).toBe(3);

      data = [
        '15.1.5.16-15.1.5.100',
        '15.1.5.50-15.1.5.250'
      ];

      expect(getIpCountIpRanges(data)).toBe(235);

      data = [
        '15.1.5.50-15.1.5.250',
        '15.1.5.16-15.1.5.100'
      ];

      expect(getIpCountIpRanges(data)).toBe(235);
    });

    it('should return a range simgle ips', function () {
      expect(getIpCountIpRanges).toBeDefined();
      expect(typeof getIpCountIpRanges).toBe('function');

      var data = [
        '15.1.5.16',
        '15.1.5.17'
      ];

      expect(getIpCountIpRanges(data)).toBe(2);

      data = [
        '15.1.5.17-15.1.5.18',
        '15.1.5.16-15.1.5.17',
        '15.1.5.19'
      ];

      expect(getIpCountIpRanges(data)).toBe(4);

      data = [
        '15.1.5.16-15.1.5.100',
         '15.1.5.1',
         '15.1.5.50-15.1.5.250'
      ];

      expect(getIpCountIpRanges(data)).toBe(236);
    });

  });

})();
