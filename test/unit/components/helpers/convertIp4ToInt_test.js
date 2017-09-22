// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
  'use strict';

  describe('Component: convertIp4ToInt', function () {
    var convertIp4ToInt;

    beforeEach(module('pascalprecht.translate'));
    beforeEach(module('ngCookies'));
    beforeEach(module('ngMock'));
    beforeEach(module('helpers'));

    beforeEach(inject(function($injector) {
      convertIp4ToInt = $injector.get('convertIp4ToInt');
    }));

    it('should be available', function () {
      expect(convertIp4ToInt).toBeDefined();
      expect(typeof convertIp4ToInt).toBe('function');
    });

    it('should return an int when given an int', function () {
      expect(convertIp4ToInt).toBeDefined();
      expect(typeof convertIp4ToInt).toBe('function');

      expect(convertIp4ToInt(15)).toBe(15);
      expect(convertIp4ToInt(100000)).toBe(100000);
      expect(convertIp4ToInt(NaN)).toBeFalsy();
    });

    it('should return an int when given an ip', function () {
      expect(convertIp4ToInt).toBeDefined();
      expect(typeof convertIp4ToInt).toBe('function');

      expect(convertIp4ToInt('192.168.1.1')).toBe(3232235777);
      expect(convertIp4ToInt('15.1.5.16')).toBe(251725072);
    });

  });

})();
