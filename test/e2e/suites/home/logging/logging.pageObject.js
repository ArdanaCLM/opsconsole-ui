// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// Represents the Logging page at: /#/general/logging

var HamburgerMenu = require('../../common/hamburger_menu.pageObject.js');

var Logging = function() {

  var navigate = new HamburgerMenu();

  this.get = function() {
    navigate.get_page('/#/general/logging');
  };
};

module.exports = Logging;
