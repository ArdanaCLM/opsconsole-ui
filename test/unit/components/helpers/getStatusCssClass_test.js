// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
  'use strict';

  describe('Component: getStatusCssClass', function () {
    var getStatusCssClass;

    beforeEach(module('helpers'));

    beforeEach(inject(function($injector) {
      getStatusCssClass = $injector.get('getStatusCssClass');
    }));

    it('should be available', function () {
      expect(getStatusCssClass).toBeDefined();
      expect(typeof getStatusCssClass).toBe('function');
    });

    it('should return on non string', function() {
      expect(getStatusCssClass).toBeDefined();

      expect(getStatusCssClass()).toBe('table_unknown_status');
    });

    it('should return correct value', function() {
      expect(getStatusCssClass).toBeDefined();

      var values = {
        'ERROR': 'table_error_status',
        'CRITICAL': 'table_error_status',
        'ALARM': 'table_error_status',
        'DOWN': 'table_error_status',
        'WARN': 'table_warn_status',
        'OK': 'table_ok_status',
        'RUNNING': 'table_ok_status',
        'POWERED ON': 'table_ok_status',
        'UP': 'table_ok_status',
        'IN_PROGRESS': 'table_progress_status',
        'DONE': 'table_done_status'
      };

      var keys = Object.keys(values);

      for(var ii=0;ii<keys.length;ii++) {
        expect(getStatusCssClass(keys[ii])).toBe(values[keys[ii]]);
      }
    });

  });

})();
