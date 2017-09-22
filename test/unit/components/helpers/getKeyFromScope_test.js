// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
  'use strict';

  describe('Component: getKeyFromScope', function () {
    var getKeyFromScope, $scope;

    beforeEach(module('helpers'));

    beforeEach(inject(function($injector) {
      getKeyFromScope = $injector.get('getKeyFromScope');
      $scope = $injector.get('$rootScope').$new();
    }));

    it('should be available', function () {
      expect(getKeyFromScope).toBeDefined();
      expect(typeof getKeyFromScope).toBe('function');
    });

    it('should return the correct key', function() {
      $scope.this_data = {
        file: '123'
      };
      expect(getKeyFromScope('this_data.file', $scope)).toBe('123');
    });

  });

})();
