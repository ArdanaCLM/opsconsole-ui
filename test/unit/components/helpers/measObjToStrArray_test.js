// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
  'use strict';

  describe('Component: measObjToStrArray', function () {
    var measObjToStrArray;

    beforeEach(module('helpers'));

    beforeEach(inject(function($injector) {
      measObjToStrArray = $injector.get('measObjToStrArray');
    }));

    it('should be available', function () {
      expect(measObjToStrArray).toBeDefined();
      expect(typeof measObjToStrArray).toBe('function');
    });

    it('should return empty values', function () {
      expect(measObjToStrArray).toBeDefined();

      expect(measObjToStrArray()).toBe('');
      expect(Array.isArray(measObjToStrArray([]))).toBeTruthy();
      expect(measObjToStrArray([]).length).toBe(0);
    });

    it('should return valid values', function () {
      expect(measObjToStrArray).toBeDefined();

      var result = measObjToStrArray({a:1});

      expect(result.length).toBe(1);
      expect(result[0]).toBe('a:1');

      result = measObjToStrArray([1]);
      expect(result.length).toBe(1);
      expect(result[0]).toBe('0:1');

      result = measObjToStrArray({a:1, b:2});
      expect(result.length).toBe(2);
      expect(result[0]).toBe('a:1');
      expect(result[1]).toBe('b:2');

      result = measObjToStrArray([1,2]);
      expect(result.length).toBe(2);
      expect(result[0]).toBe('0:1');
      expect(result[1]).toBe('1:2');
    });

  });

})();
