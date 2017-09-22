// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
  'use strict';

  describe('Component: dimObjToStr', function () {
    var dimObjToStr;

    beforeEach(module('helpers'));

    beforeEach(inject(function($injector) {
      dimObjToStr = $injector.get('dimObjToStr');
    }));

    it('should be available', function () {
      expect(dimObjToStr).toBeDefined();
      expect(typeof dimObjToStr).toBe('function');
    });

    it('should return empty values', function () {
      expect(dimObjToStr).toBeDefined();

      expect(dimObjToStr()).toBe('');
      expect(dimObjToStr([])).toBe('');
    });

    it('should return valid values', function () {
      expect(dimObjToStr).toBeDefined();

      expect(dimObjToStr({a:1})).toBe('a=1');
      expect(dimObjToStr([1])).toBe('0=1');

      expect(dimObjToStr({a:1, b:2})).toBe('a=1,\nb=2');
      expect(dimObjToStr([1,2])).toBe('0=1,\n1=2');
    });

  });

})();
