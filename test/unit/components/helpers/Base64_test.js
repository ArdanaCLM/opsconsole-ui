// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
  'use strict';

  describe('Component: Base64', function () {
    var Base64,
      basicASCI = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{};\':",./<>?\\|',
      encodedASCI = 'QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkhQCMkJV4mKigpXystPVtde307JzoiLC4vPD4/XHw=',
      utf8 = '現在登録解除',
      utf8Encoded = '54++5Zyo55m76Yyy6Kej6Zmk';

    beforeEach(module('helpers'));

    beforeEach(inject(function($injector) {
      Base64 = $injector.get('Base64');
    }));

    it('should be available', function () {
      expect(Base64).toBeDefined();
      expect(typeof Base64).toBe('object');
      expect(typeof Base64.encode).toBe('function');
      expect(typeof Base64.decode).toBe('function');
    });

    it('should encode data', function() {
      expect(Base64).toBeDefined();

      expect(Base64.encode(basicASCI)).toBe(encodedASCI);
      expect(Base64.encode(utf8)).toBe(utf8Encoded);
    });

    it('should decode data', function() {
      expect(Base64).toBeDefined();

      expect(Base64.decode(encodedASCI)).toBe(basicASCI);
      expect(Base64.decode(utf8Encoded)).toBe(utf8);
    });

    it('should encode and decode data', function() {
      expect(Base64).toBeDefined();

      expect(Base64.decode(Base64.encode(basicASCI))).toBe(basicASCI);
      expect(Base64.decode(Base64.encode(utf8))).toBe(utf8);
    });

  });

})();
