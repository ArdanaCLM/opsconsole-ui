// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
  'use strict';

  describe('Component: bllApiRequest', function () {
    var bllApiRequest, $httpBackend, $timeout, oldTimeout, $rootScope, genUUID;

    beforeEach(function() {
      module('pascalprecht.translate');
      module('ngCookies');
      module('helpers', function($provide) {
        $provide.value('loadConfig', function() {
          $rootScope.appConfig= {
            bll_url: '/api/v1/',
            console_logging: ["warn", "error", "log", "info", "debug"]
          };
        });
      });

      inject(function(_$httpBackend_, _bllApiRequest_, _$rootScope_, _$timeout_, _genUUID_) {
        $httpBackend = _$httpBackend_;
        bllApiRequest = _bllApiRequest_;
        $timeout = _$timeout_;
        _$rootScope_.appConfig= {
          bll_url: '/',
          console_logging: ["warn", "error", "log", "info", "debug"]
        };
        $rootScope = _$rootScope_;
        genUUID = _genUUID_;
      });

      oldTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 120 * 1000;
    });

    afterEach(function() {
      //$httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
      jasmine.DEFAULT_TIMEOUT_INTERVAL = oldTimeout;
    });

    it('should be available', function () {
      expect(bllApiRequest).toBeDefined();
      expect(bllApiRequest.get).toBeDefined();
      expect(bllApiRequest.post).toBeDefined();
      expect(bllApiRequest.delete).toBeDefined();
      expect(bllApiRequest.put).toBeDefined();
      expect(bllApiRequest.patch).toBeDefined();
    });

    it('should be able to make a simple get request', function (done) {
      $httpBackend.whenPOST('/bll/').respond(200, {status: 'complete'});

      bllApiRequest.get('target', {})
        .then(function(res) {
          expect(res.status).toBe('complete');
        }, fail)
        .finally(defer(done));
      $httpBackend.flush(); // make request return

    });

    it('should be able to make a more complex request', function (done) {
      var times = 0, txn_id;
      $httpBackend.whenPOST('/bll/').respond(function(method, url, data, headers) {
        var json = JSON.parse(data);
        times += 1;
        if(times === 1) {
          expect(json.target).toBeDefined();
          expect(json.target).toBe('target');
          txn_id = genUUID();
          var txnIdParts = txn_id.split('-');
          expect(txnIdParts.length).toBe(5);

          expect(txnIdParts[0].length).toBe(8);
          expect(txnIdParts[1].length).toBe(4);
          expect(txnIdParts[2].length).toBe(4);
          expect(txnIdParts[3].length).toBe(4);
          expect(txnIdParts[4].length).toBe(12);
          return [200, {status: 'inprogress', recommendedPollingInterval: 2, txn_id: txn_id}, {}];
        }
        if(times === 2) {
          expect(json.job_status_request).toBe(true);
          expect(json.txn_id).toBe(txn_id);
          return [200, {status: 'not_found'}, {}];
        }
        if(times === 3) {
          expect(json.job_status_request).toBe(true);
          expect(json.txn_id).toBe(txn_id);
          return [200, {status: 'inprogress'}, {}];
        }
        if(times === 4) {
          expect(json.job_status_request).toBe(true);
          expect(json.txn_id).toBe(txn_id);
          return [200, {status: 'complete'}, {}];
        }
      });

      bllApiRequest.get('target', {})
        .then(function(res) {
          expect(res.status).toBe('complete');
        }, fail)
        .finally(defer(done));
      $httpBackend.flush(); // first request, return inprogress
      $timeout.flush(); //make second request should be job status request
      $httpBackend.flush(); //complete second request should be not_found
      $timeout.flush(); //make third request should be job status request
      $httpBackend.flush(); //complete third request should be status inprogress
      $timeout.flush(); //make fourth request should be job status request
      $httpBackend.flush(); //complete third request should be status complete

    });

    it('should be able to return error', function (done) {
      $httpBackend.whenPOST('/bll/').respond(200, {status: 'error', data:{message: 'an error occured'}});

      bllApiRequest.get('target', {})
        .then(fail, function(res) {
          expect(res.data.message).toBe('an error occured');
        })
        .finally(defer(done));
      $httpBackend.flush(); // first request, return error
    });

    it('should be able to return error with connection problem', function (done) {
      $httpBackend.whenPOST('/bll/').respond(200, {status: 'error', data:{message: 'Connection aborted'}});

      bllApiRequest.get('target', {})
        .then(fail, function(res) {
          expect($rootScope.notification.message_queue.length).toBe(1);
          expect($rootScope.notification.message_queue[0].level).toBe('error');
          expect($rootScope.notification.message_queue[0].message.indexOf('common.ma_connection_error')).not.toBe(-1);
          expect(res.data.message).toBe('Connection aborted');
        })
        .finally(defer(done));
      $httpBackend.flush(); // first request, return error
    });

    it('should be able to return unknown status', function (done) {
      $httpBackend.whenPOST('/bll/').respond(200, {status: 'my_status', data:{message: 'Connection aborted'}});

      bllApiRequest.get('target', {})
        .then(fail, function(res) {
          expect(res.status).toBe('my_status');
          expect(res.data.message).toBe('Connection aborted');
        })
        .finally(defer(done));
      $httpBackend.flush(); // first request, return error
    });

    it('should retrun error when max retry is reached', function (done) {
      var times = 0, txn_id;
      $httpBackend.whenPOST('/bll/').respond(function(method, url, data, headers) {
        var json = JSON.parse(data);
        times += 1;
        if(times === 1) {

          expect(json.target).toBeDefined();
          expect(json.target).toBe('target');
          txn_id = genUUID();
          var txnIdParts = txn_id.split('-');
          expect(txnIdParts.length).toBe(5);

          expect(txnIdParts[0].length).toBe(8);
          expect(txnIdParts[1].length).toBe(4);
          expect(txnIdParts[2].length).toBe(4);
          expect(txnIdParts[3].length).toBe(4);
          expect(txnIdParts[4].length).toBe(12);
          return [200, {status: 'inprogress', recommendedPollingInterval: 1, txn_id: txn_id}, {}];
        }
        if(times > 1) {
          expect(json.job_status_request).toBe(true);
          expect(json.txn_id).toBe(txn_id);
          return [200, {status: 'not_found'}, {}];
        }
      });

      bllApiRequest.get('target', {}, {maxRetry: 2})
        .then(fail, function(res) {
          expect(res).toBe('Max retry reached: 3');
        })
        .finally(defer(done));
      $httpBackend.flush(); // first request, return inprogress
      $timeout.flush(); //make second request should be job status request
      $httpBackend.flush(); //complete second request should be not_found
      $timeout.flush(); //make third request should be job status request
      $httpBackend.flush(); //complete third request should be status not_found
      $timeout.flush(); //make fourth request should be job status request
      $httpBackend.flush(); //complete third request should be status not_found

    });

    it('should call loadConfig', function (done) {
      $httpBackend.whenPOST('/api/v1/bll/').respond(200, {status: 'complete'});

      $rootScope.appConfig = undefined;

      bllApiRequest.get('target', {})
        .then(function(res) {
          expect(res.status).toBe('complete');
          expect($rootScope.appConfig).toBeDefined();
        }, fail)
        .finally(defer(done));
      $httpBackend.flush(); // make request return

    });

    it('should return error', function (done) {
      $httpBackend.whenPOST('/bll/').respond(400, {status: 'error'});

      bllApiRequest.get('target', {})
        .then(fail, function(res) {
          console.log(JSON.stringify(res));
          expect(res.statusCode).toBe(400);
          expect(res.status).toBe('error');
        })
        .finally(defer(done));
      $httpBackend.flush(); // make request return

    });


    it('should call loadConfig', function (done) {
      $httpBackend.whenPOST('/api/v1/bll/').respond(200, {status: 'complete'});

      $rootScope.appConfig = undefined;

      bllApiRequest.get('target', {})
        .then(function(res) {
          expect($rootScope.appConfig).toBeDefined();
        }, fail)
        .finally(defer(done));
      $httpBackend.flush(); // make request return

    });

  });
})();
