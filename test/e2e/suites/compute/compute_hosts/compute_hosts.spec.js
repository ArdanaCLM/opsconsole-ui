// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// Specs for the Compute Hosts page at: /#/compute/compute_nodes

var ComputeHosts = require('./compute_hosts.pageObject.js');

describe('compute hosts', function() {

  var computeHosts = new ComputeHosts();

  beforeAll(function() {
    computeHosts.get();
  });

  it('should have the correct url', function() {
    expect(browser.getCurrentUrl())
      .toBe(browser.baseUrl + '/#/compute/compute_nodes');
  });

  it('should have the correct title', function() {
    expect(browser.getTitle()).toEqual('Compute Hosts');
  });
});
