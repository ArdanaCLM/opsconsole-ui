// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
  'use strict';

  describe('Component: isLastCheckWithinTimeRange', function () {
    var isLastCheckWithinTimeRange;

    beforeEach(module('helpers'));

    beforeEach(inject(function($injector) {
      isLastCheckWithinTimeRange = $injector.get('isLastCheckWithinTimeRange');
    }));

    it('should be available', function () {
      expect(isLastCheckWithinTimeRange).toBeDefined();
      expect(typeof isLastCheckWithinTimeRange).toBe('function');
    });

    it('should return values', function() {
      expect(isLastCheckWithinTimeRange).toBeDefined();

      expect(isLastCheckWithinTimeRange()).toBeTruthy();

      expect(isLastCheckWithinTimeRange('something', 'else')).toBeTruthy();
      expect(isLastCheckWithinTimeRange('something', undefined, 'else')).toBeFalsy();
    });

    it('should return values', function() {
      expect(isLastCheckWithinTimeRange).toBeDefined();

      expect(isLastCheckWithinTimeRange()).toBeTruthy();

      expect(isLastCheckWithinTimeRange('something', 'else')).toBeTruthy();
      expect(isLastCheckWithinTimeRange('something', undefined, 'else')).toBeFalsy();
    });

    it('should return correct values', function() {
      expect(isLastCheckWithinTimeRange).toBeDefined();

      expect(isLastCheckWithinTimeRange( moment().subtract(1, 'm').toISOString(), moment().subtract(1, 'd').toISOString()), moment().subtract(1, 'm').toISOString()).toBeTruthy();
    });

  });

})();
