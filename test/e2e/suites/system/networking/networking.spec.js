// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// Specs for the System Networking page at: /#/system/system_networking

var SystemNetworking = require('./networking.pageObject.js');

describe('system networking', function() {

  var systemNetworking = new SystemNetworking();

  beforeAll(function() {
    systemNetworking.get();
  });

  if (browser.params.dev_mode === "true" || browser.params.env === "legacy") {
    it('should have the correct url', function() {
      expect(browser.getCurrentUrl())
        .toBe(browser.baseUrl + '/#/system/system_networking');
    });

    it('should have the correct title', function() {
      expect(browser.getTitle()).toEqual('Networking');
    });
  } else {
    console.log('System Networking skipped - dev_mode false and in stdcfg environment.');
  }
});
