// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
  'use strict';

  describe('Component: ipInSubnet', function () {
    var ipInSubnet;

    beforeEach(module('pascalprecht.translate'));
    beforeEach(module('ngCookies'));
    beforeEach(module('ngMock'));
    beforeEach(module('helpers'));

    beforeEach(inject(function($injector) {
      ipInSubnet = $injector.get('ipInSubnet');
    }));

    it('should be available', function () {
      expect(ipInSubnet).toBeDefined();
      expect(typeof ipInSubnet).toBe('function');
    });

    it('should be true', function () {
      expect(ipInSubnet).toBeDefined();
      expect(typeof ipInSubnet).toBe('function');

      expect(ipInSubnet('192.168.1.0', '192.168.1.0/24')).toBeTruthy();
      expect(ipInSubnet('192.168.1.255', '192.168.1.0/24')).toBeTruthy();
    });

    it('should be false', function () {
      expect(ipInSubnet).toBeDefined();
      expect(typeof ipInSubnet).toBe('function');

      expect(ipInSubnet('192.168.2.0', '192.168.1.0/24')).toBeFalsy();
      expect(ipInSubnet('192.168.2.255', '192.168.1.0/24')).toBeFalsy();
      expect(ipInSubnet([], '192.168.1.0/24')).toBeFalsy();
      expect(ipInSubnet('192.168.1.1', 5333552)).toBeFalsy();
    });

  });

})();
