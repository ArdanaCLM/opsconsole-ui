// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// Specs for the Compute Instances page at: /#/compute/compute_instances

var ComputeInstances = require('./compute_instances.pageObject.js');

describe('compute instances', function() {

  var computeInstances = new ComputeInstances();

  beforeAll(function() {
    computeInstances.get();
  });

  it('should have the correct url', function() {
    expect(browser.getCurrentUrl())
      .toBe(browser.baseUrl + '/#/compute/compute_instances');
  });

  it('should have the correct title', function() {
    expect(browser.getTitle()).toEqual('Compute Instances');
  });
});
