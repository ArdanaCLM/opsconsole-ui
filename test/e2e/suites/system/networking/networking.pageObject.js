// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// Represents the System Networking page at: /#/system/system_networking

var HamburgerMenu = require('../../common/hamburger_menu.pageObject.js');

var SystemNetworking = function() {

  var navigate = new HamburgerMenu();

  this.get = function() {
    navigate.get_page('/#/system/system_networking');
  };
};

module.exports = SystemNetworking;
