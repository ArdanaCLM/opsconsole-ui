// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
  'use strict';

  describe('Component: log', function () {
    var log, $log = {
      warn: function() {},
      error: function() {},
      log: function() {},
      info: function() {},
      debug: function() {}
    };

    describe('configured logs', function() {
      beforeEach(module('helpers', function($provide) {
        $provide.value('$log', $log);
        $provide.value('$rootScope', {
          appConfig: {
            console_logging: ["warn", "error", "log", "info", "debug"]
          }
        });
      }));

      beforeEach(inject(function($injector) {
        log = $injector.get('log');
      }));

      it('should be available', function () {
        expect(log).toBeDefined();
        expect(typeof log).toBe('function');
      });

      it('warn should call $log.warn', function() {
        spyOn($log, 'warn');
        log('warn', 'message');
        expect($log.warn).toHaveBeenCalledWith('message');
      });

      it('log should call $log.log', function() {
        spyOn($log, 'log');
        log('log', 'message');
        expect($log.log).toHaveBeenCalledWith('message');
      });

      it('error should call $log.error', function() {
        spyOn($log, 'error');
        log('error', 'message');
        expect($log.error).toHaveBeenCalledWith('message');
      });

      it('info should call $log.info', function() {
        spyOn($log, 'info');
        log('info', 'message');
        expect($log.info).toHaveBeenCalledWith('message');
      });

      it('debug should call $log.debug', function() {
        spyOn($log, 'debug');
        log('debug', 'message');
        expect($log.debug).toHaveBeenCalledWith('message');
      });

      it('default shouldn\'t call $log.debug', function() {
        spyOn($log, 'debug');
        log('default', 'message');
        expect($log.debug).not.toHaveBeenCalled();
      });
    });

    describe('configured logs error only', function() {
      beforeEach(module('helpers', function($provide) {
        $provide.value('$log', $log);
        $provide.value('$rootScope', {
          appConfig: {
            console_logging: ["error"]
          }
        });
      }));

      beforeEach(inject(function($injector) {
        log = $injector.get('log');
      }));

      it('should be available', function () {
        expect(log).toBeDefined();
        expect(typeof log).toBe('function');
      });

      it('warn should call $log.warn', function() {
        spyOn($log, 'warn');
        log('warn', 'message');
        expect($log.warn).not.toHaveBeenCalled();
      });

      it('log should call $log.log', function() {
        spyOn($log, 'log');
        log('log', 'message');
        expect($log.log).not.toHaveBeenCalled();
      });

      it('error should call $log.error', function() {
        spyOn($log, 'error');
        log('error', 'message');
        expect($log.error).toHaveBeenCalledWith('message');
      });

      it('info should call $log.info', function() {
        spyOn($log, 'info');
        log('info', 'message');
        expect($log.info).not.toHaveBeenCalled();
      });

      it('debug should call $log.debug', function() {
        spyOn($log, 'debug');
        log('debug', 'message');
        expect($log.debug).not.toHaveBeenCalled();
      });

      it('default shouldn\'t call $log.debug', function() {
        spyOn($log, 'debug');
        log('default', 'message');
        expect($log.debug).not.toHaveBeenCalled();
      });
    });

  });

})();
