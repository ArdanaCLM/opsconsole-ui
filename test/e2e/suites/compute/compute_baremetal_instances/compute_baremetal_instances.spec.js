// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// Specs for the Compute Baremetal Instances page at: /#/compute/compute_baremetal_instances

var ComputeBaremetalInstances = require('./compute_baremetal_instances.pageObject.js');

describe('compute baremetal instances', function() {

  var computeBaremetalInstances = new ComputeBaremetalInstances();

  beforeAll(function() {
    computeBaremetalInstances.get();
  });

  if(browser.params.dev_mode === "true") {
    it('should have the correct url', function() {
      expect(browser.getCurrentUrl())
        .toBe(browser.baseUrl + '/#/compute/baremetal_instances');
    });

    it('should have the correct title', function() {
      expect(browser.getTitle()).toEqual('Compute Baremetal');
    });
  } else {
    console.log('Compute Baremetal Instances skipped - dev_mode false.');
  }
});
