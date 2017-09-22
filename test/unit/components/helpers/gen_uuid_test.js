// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
  'use strict';

  describe('Component: genUUID', function () {
    var genUUID;

    beforeEach(module('helpers'));

    beforeEach(inject(function($injector) {
      genUUID = $injector.get('genUUID');
    }));

    it('should be available', function () {
      expect(genUUID).toBeDefined();
      expect(typeof genUUID).toBe('function');
    });

    it('should generate a valid uuid', function() {
      expect(genUUID).toBeDefined();

      expect(typeof genUUID()).toBe('string');

      var uuid = genUUID();
      var uuidParts = uuid.split('-');

      expect(uuidParts.length).toBe(5);

      expect(uuidParts[0].length).toBe(8);
      expect(uuidParts[1].length).toBe(4);
      expect(uuidParts[2].length).toBe(4);
      expect(uuidParts[3].length).toBe(4);
      expect(uuidParts[4].length).toBe(12);
    });

    it('should generate different uuids every time', function() {
      expect(genUUID).toBeDefined();

      var uuids = [];

      for(var ii=0;ii<=100;ii++) {
        var uuid = genUUID();
        for(var qq=0;qq<uuids.length;qq++) {
          expect(uuids[qq]).not.toBe(uuid);
        }
        uuids.push(uuid);
      }
    });

  });

})();
