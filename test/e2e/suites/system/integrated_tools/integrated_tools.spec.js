// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// Specs for the System Integrated Tools page at: /#/system/integrated_tools

var IntegratedTools = require('./integrated_tools.pageObject.js');

describe('integrated tools', function() {

  var integratedTools = new IntegratedTools();

  beforeAll(function() {
    integratedTools.get();
  });

  if (browser.params.dev_mode === "true" || browser.params.env === "legacy") {
    it('should have the correct url', function() {
      expect(browser.getCurrentUrl())
        .toBe(browser.baseUrl + '/#/system/integrated_tools');
    });

    it('should have the correct title', function() {
      expect(browser.getTitle()).toEqual('Integrated Tools');
    });
  } else {
    console.log('System Integrated Tools skipped - dev_mode false and in stdcfg environment.');
  }
});
