// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// Specs for the Logging page at: /#/general/logging

var Logging = require('./logging.pageObject.js');

describe('logging page', function() {

  var loggingPage = new Logging();

  beforeAll(function() {
    loggingPage.get();
  });

  it('should have the correct url', function() {
    expect(browser.getCurrentUrl())
      .toBe(browser.baseUrl + '/#/general/logging');
  });

  it('should have the correct title', function() {
    expect(browser.getTitle()).toEqual('Logging');
  });
});
