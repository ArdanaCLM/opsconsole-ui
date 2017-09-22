// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// Specs for the System Appliances page at: /#/system/appliance_list

var Appliances = require('./appliances.pageObject.js');

describe('system appliances', function() {

  var appliances = new Appliances();

  beforeAll(function() {
    appliances.get();
  });

  if (browser.params.dev_mode === "true" || browser.params.env === "legacy") {
    it('should have the correct url', function() {
      expect(browser.getCurrentUrl())
        .toBe(browser.baseUrl + '/#/system/appliance_list');
    });

    it('should have the correct title', function() {
      expect(browser.getTitle()).toEqual('Appliances');
    });
  } else {
    console.log('System Appliances skipped - dev_mode false and in stdcfg environment.');
  }
});
