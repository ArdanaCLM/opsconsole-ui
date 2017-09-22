// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
  'use strict';

  describe('Component: dirtyForm', function () {
    var dirtyForm;

    beforeEach(module('pascalprecht.translate'));
    beforeEach(module('ngCookies'));
    beforeEach(module('ngMock'));
    beforeEach(module('helpers'));

    beforeEach(inject(function($injector) {
      dirtyForm = $injector.get('dirtyForm');
    }));

    it('should be available', function () {
      expect(dirtyForm).toBeDefined();
      expect(typeof dirtyForm).toBe('function');
    });

    it('should dirty a from', function () {
      expect(dirtyForm).toBeDefined();
      expect(typeof dirtyForm).toBe('function');

      var form = {
        one: {
          $setDirty: angular.noop
        },
        two: {
          $setDirty: angular.noop
        },
        $setDirty: angular.noop,
        $iterate: angular.noop
      };

      spyOn(form, '$setDirty');
      spyOn(form, '$iterate');
      spyOn(form.one, '$setDirty');
      spyOn(form.two, '$setDirty');

      dirtyForm(form);

      expect(form.$setDirty.calls.count()).toEqual(0);
      expect(form.$iterate.calls.count()).toEqual(0);
      expect(form.one.$setDirty.calls.count()).toEqual(1);
      expect(form.two.$setDirty.calls.count()).toEqual(1);
    });

    it('should not thow an exception', function () {
      expect(dirtyForm).toBeDefined();
      expect(typeof dirtyForm).toBe('function');

      dirtyForm({});
      dirtyForm([]);
      dirtyForm(5);
      dirtyForm(false);
    });

  });

})();
