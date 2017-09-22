// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
  'use strict';

  describe('Component: genRandomString', function () {
    var genRandomString;

    beforeEach(module('helpers'));

    beforeEach(inject(function($injector) {
      genRandomString = $injector.get('genRandomString');
    }));

    it('should be available', function () {
      expect(genRandomString).toBeDefined();
      expect(typeof genRandomString).toBe('function');
    });

    it('should generate a string', function() {
      expect(genRandomString).toBeDefined();

      expect(typeof genRandomString()).toBe('string');

      var string = genRandomString();

      expect(string.length).toBe(0);

      var length = 10;
      string = genRandomString(length);

      expect(string.length).toBe(length);
    });

    it('should generate stings every time', function() {
      expect(genRandomString).toBeDefined();

      var strings = [];

      for(var ii=0;ii<=100;ii++) {
        var string = genRandomString();
        for(var qq=0;qq<string.length;qq++) {
          expect(strings[qq]).not.toBe(string);
        }
        strings.push(string);
      }
    });

  });

})();
