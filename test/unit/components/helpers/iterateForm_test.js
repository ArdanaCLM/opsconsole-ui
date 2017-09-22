// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
  'use strict';

  describe('Component: iterateForm', function () {
    var iterateForm;

    beforeEach(module('pascalprecht.translate'));
    beforeEach(module('ngCookies'));
    beforeEach(module('ngMock'));
    beforeEach(module('helpers'));

    beforeEach(inject(function($injector) {
      iterateForm = $injector.get('iterateForm');
    }));

    it('should be available', function () {
      expect(iterateForm).toBeDefined();
      expect(typeof iterateForm).toBe('function');
    });

    it('should be able to iterate over an object', function () {
      expect(iterateForm).toBeDefined();
      expect(typeof iterateForm).toBe('function');

      var callback = {
        cb: function () {},
      };

      var object = {
        'one': '1',
        'two': '2',
        '$iterate': angular.noop,
        '$validate': angular.noop
      };

      spyOn(callback, 'cb');

      iterateForm(object, callback.cb);
      expect(callback.cb.calls.count()).toEqual(2);
      expect(callback.cb.calls.argsFor(0)).toEqual(['1', 'one']);
      expect(callback.cb.calls.argsFor(1)).toEqual(['2', 'two']);
    });

    it('should be able to skip an empty object', function () {
      expect(iterateForm).toBeDefined();
      expect(typeof iterateForm).toBe('function');

      var callback = {
        cb: function () {},
      };

      var object = {
      };

      spyOn(callback, 'cb');

      iterateForm(object, callback.cb);
      expect(callback.cb.calls.count()).toEqual(0);
    });

    it('should be able to skip over $ items in an object', function () {
      expect(iterateForm).toBeDefined();
      expect(typeof iterateForm).toBe('function');

      var callback = {
        cb: function () {},
      };

      var object = {
        '$iterate': angular.noop,
        '$validate': angular.noop
      };

      spyOn(callback, 'cb');

      iterateForm(object, callback.cb);
      expect(callback.cb.calls.count()).toEqual(0);
    });

    it('should not throw an exception', function () {
      expect(iterateForm).toBeDefined();
      expect(typeof iterateForm).toBe('function');

      iterateForm({}, 5);
      iterateForm(5, 5);
      iterateForm(angular.noop, 5);
    });
  });

})();
