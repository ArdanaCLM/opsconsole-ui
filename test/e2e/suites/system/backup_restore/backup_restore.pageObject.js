// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// Represents the System Backup & Restore page at: /#/system/backup_restore

var HamburgerMenu = require('../../common/hamburger_menu.pageObject.js');

var BackupRestore = function() {

  var navigate = new HamburgerMenu();

  this.get = function() {
    navigate.get_page('/#/system/backup_restore');
  };
};

module.exports = BackupRestore;
