// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// Specs for the System Backup & Restore page at: /#/system/backup_restore

var BackupRestore = require('./backup_restore.pageObject.js');

describe('backup & restore', function() {

  var backupRestore = new BackupRestore();

  beforeAll(function() {
    backupRestore.get();
  });

  if (browser.params.dev_mode === "true") {
    it('should have the correct url', function() {
      expect(browser.getCurrentUrl())
        .toBe(browser.baseUrl + '/#/system/backup_restore');
    });

    it('should have the correct title', function() {
      expect(browser.getTitle()).toEqual('Backup & Restore');
    });
  } else {
    console.log('System Backup Restore skipped - dev_mode false.');
  }
});
