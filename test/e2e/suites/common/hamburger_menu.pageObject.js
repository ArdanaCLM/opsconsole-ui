// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// PageObject used for navigating the hamburger menu

var HamburgerMenu = function() {
  this.hamburgerMenu = $('.menu-button');
  this.hamburgerSections = $$('.menu .section');

  var get_section = function(url) {
    var split_url = url.split('/');

    // find the section
    switch(split_url[2]) {
      case "general":
      case "alarm":
        return "HOME";
      case "compute":
        return "COMPUTE";
      case "storage":
        return "STORAGE";
      case "networking":
        return "NETWORKING";
      case "system":
        return "SYSTEM";
      default:
        return "ERROR";
    }
  };

  var section = function(section_index) {
    return $$('.menu .section').get(section_index);
  };

  this.get_page = function(url) {
    var page_link = 'a[href="' + url.slice(1) + '"]';
    var section_title = get_section(url);

    this.hamburgerMenu.click();
    var section_index = this.hamburgerSections.getText()
      .then(function(text_array) {
        return text_array.indexOf(section_title);
      });

    section(section_index).click();
    $(page_link).click();
    section(section_index).click();

    this.hamburgerMenu.click();
  };

  this.expandHamburgerSections = function() {
    this.hamburgerSections.each(function(element, index) {
      element.click();
    });
  };
};

module.exports = HamburgerMenu;
