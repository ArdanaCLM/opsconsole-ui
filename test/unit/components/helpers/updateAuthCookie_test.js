// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
  'use strict';

  describe('Component: updateAuthCookie', function () {
    var updateAuthCookie,
    $cookieStore = { get: angular.noop, remove: angular.noop },
    $rootScope = { auth_token: undefined },
    $translate = {instant: angular.noop};

    beforeEach(module('helpers', function($provide) {
      $provide.value('$cookieStore', $cookieStore);
      $provide.value('$rootScope', $rootScope);
      $provide.value('$translate', $translate);
      $provide.value('log', angular.noop);
    }));

    beforeEach(inject(function($injector) {
      updateAuthCookie = $injector.get('updateAuthCookie');
    }));

    it('should be available', function () {
      expect(updateAuthCookie).toBeDefined();
      expect(typeof updateAuthCookie).toBe('function');
    });

    it('should clear auth values', function() {
      spyOn($cookieStore, 'get').and.returnValue(undefined);
      $rootScope.auth_token = "something";
      updateAuthCookie();
      expect($cookieStore.get).toHaveBeenCalledWith("auth_cookie");
      expect($rootScope.auth_token).toBeUndefined();
    });

    it('should clear auth values with different urls', function() {
      var future = new Date();
      future.setHours(future.getHours()+4);
      spyOn($cookieStore, 'get').and.returnValue({expires_at: future.toISOString(), bll_url: "http://yahoo.com" });
      spyOn($cookieStore, 'remove');
      $rootScope.auth_token = "something";
      $rootScope.appConfig = {
        bll_url: "http://google.com"
      };
      updateAuthCookie();
      expect($cookieStore.get).toHaveBeenCalledWith("auth_cookie");
      expect($cookieStore.remove).toHaveBeenCalledWith("auth_cookie");
      expect($rootScope.auth_token).toBeUndefined();
    });

    it('should clear auth values old cookie', function() {
      var old = new Date();
      old.setHours(old.getHours()-4);
      spyOn($cookieStore, 'get').and.returnValue({expires_at: old.toISOString(), bll_url: "http://yahoo.com" });
      spyOn($cookieStore, 'remove');
      $rootScope.auth_token = "something";
      $rootScope.appConfig = {
        bll_url: "http://yahoo.com"
      };
      updateAuthCookie();
      expect($cookieStore.get).toHaveBeenCalledWith("auth_cookie");
      expect($cookieStore.remove).toHaveBeenCalledWith("auth_cookie");
      expect($rootScope.auth_token).toBeUndefined();
    });


    it('should add token to scope', function() {
      var future = new Date();
      future.setHours(future.getHours()+4);
      var token = "super secret token";
      var user_name = "spy user";
      spyOn($cookieStore, 'get').and.returnValue({expires_at: future.toISOString(), token: token, user_name: user_name, bll_url: "http://yahoo.com" });
      $rootScope.auth_token = "something";
      $rootScope.appConfig = {
        bll_url:  "http://yahoo.com"
      };
      updateAuthCookie();
      expect($cookieStore.get).toHaveBeenCalledWith("auth_cookie");
      expect($rootScope.auth_token).toBe(token);
      expect($rootScope.user_name).toBe(user_name);
    });

  });

})();
