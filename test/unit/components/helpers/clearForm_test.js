// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
  'use strict';

  describe('Component: clearForm', function () {
    var clearForm;

    beforeEach(module('pascalprecht.translate'));
    beforeEach(module('ngCookies'));
    beforeEach(module('ngMock'));
    beforeEach(module('helpers'));

    beforeEach(inject(function($injector) {
      clearForm = $injector.get('clearForm');
    }));

    it('should be available', function () {
      expect(clearForm).toBeDefined();
      expect(typeof clearForm).toBe('function');
    });

    it('should clear a from', function () {
      expect(clearForm).toBeDefined();
      expect(typeof clearForm).toBe('function');

      var form = {
        one: {
          $setPristine: angular.noop
        },
        two: {
          $setPristine: angular.noop
        },
        $setPristine: angular.noop,
        $iterate: angular.noop
      };

      spyOn(form, '$setPristine');
      spyOn(form, '$iterate');
      spyOn(form.one, '$setPristine');
      spyOn(form.two, '$setPristine');

      clearForm(form);

      expect(form.$setPristine.calls.count()).toEqual(1);
      expect(form.$iterate.calls.count()).toEqual(0);
      expect(form.one.$setPristine.calls.count()).toEqual(1);
      expect(form.two.$setPristine.calls.count()).toEqual(1);
    });

    it('should not throw an exception', function () {
      expect(clearForm).toBeDefined();
      expect(typeof clearForm).toBe('function');

      clearForm({});
      clearForm([]);
      clearForm(5);
      clearForm(false);
    });

  });

})();
