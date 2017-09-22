// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
  'use strict';

  describe('Component: duplicateVlanCheck', function () {
    var duplicateVlanCheck;

    beforeEach(module('pascalprecht.translate'));
    beforeEach(module('ngCookies'));
    beforeEach(module('ngMock'));
    beforeEach(module('helpers'));

    beforeEach(inject(function($injector) {
      duplicateVlanCheck = $injector.get('duplicateVlanCheck');
    }));

    it('should be available', function () {
      expect(duplicateVlanCheck).toBeDefined();
      expect(typeof duplicateVlanCheck).toBe('function');
    });

    it('should return true', function () {
      expect(duplicateVlanCheck).toBeDefined();
      expect(typeof duplicateVlanCheck).toBe('function');

      expect(duplicateVlanCheck([1,2,3],4,1)).toBeTruthy();
      expect(duplicateVlanCheck([1,2,3],1,0)).toBeTruthy();

      expect(duplicateVlanCheck({one:1,two:2,three:3},4,1)).toBeTruthy();
      expect(duplicateVlanCheck({one:1,two:2,three:3},1,'one')).toBeTruthy();
      expect(duplicateVlanCheck({one:1,two:2,three:3},0,'one')).toBeFalsy();

      expect(duplicateVlanCheck('454','554','one')).toBeTruthy();
    });

    it('should return false', function () {
      expect(duplicateVlanCheck).toBeDefined();
      expect(typeof duplicateVlanCheck).toBe('function');

      expect(duplicateVlanCheck([1,2,3],5000,1)).toBeFalsy();
      expect(duplicateVlanCheck([1,2,3],-5,1)).toBeFalsy();
      expect(duplicateVlanCheck([1,2,3],1,15)).toBeFalsy();

      expect(duplicateVlanCheck({one:1,two:2,three:3},1,1)).toBeFalsy();
      expect(duplicateVlanCheck({one:1,two:2,three:3},2,'one')).toBeFalsy();
    });

  });

})();
