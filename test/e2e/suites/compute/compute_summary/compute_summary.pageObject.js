// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// Represents the Compute Summary page at: /#/compute/compute_alarm_summary

var HamburgerMenu = require('../../common/hamburger_menu.pageObject.js');
var OCTable = require('../../common/octable.pageObject.js');

var ComputeSummary = function() {

  var navigate = new HamburgerMenu();
  var octable = new OCTable();

  this.pageTitle = $('.page-title');

  this.navTabs = $$('.nav.nav-tabs').first();
  this.navTabList = this.navTabs.all(by.repeater('tabbedpage in pagelist'));

  // the currently selected navTab
  this.selectedTab = this.navTabs.$('.selected');

  // tab containers (stdcfg only?)
  this.alarmContainer = $('div#compute_alarm_main');

  // header before octable_std_header
  this.octableTitle = $$('.latest-alarms-header').last();

  this.createAlarmButton = octable.globalActionButtons.first();
  this.deleteAlarmButton = octable.mutliRowActionButtons.first();

  this.thAlarm = octable.tableHeader.$('th[column-sort="name"]');
  this.thState = octable.tableHeader.$('th[column-sort="ui_status"]');
  this.thAlarmID = octable.tableHeader.$('th[column-sort="id"]');
  this.thLastCheck = octable.tableHeader.$('th[column-sort="lastCheck"]');
  this.thDimension = octable.tableHeader.$('th[column-sort="dimension"]');

  ///////////////// legacy SPECIFIC ELEMENTS BELOW ////////////////////////////

  this.computeContainer = $('div[ng-controller="ComputeSummaryController"]');

  this.gridContainer = $('.compute.grid-container');
  this.oldGridContainer = $('.oldComputeGrid');

  // grab new grid cards that are visible
  this.gridCards = this.gridContainer
    .$$('div[ng-repeat]').filter(function(card) {
      return card.isDisplayed();
    });

  ///////////////// END legacy SPECIFIC ELEMENTS //////////////////////////////

  ///////////////// stdcfg SPECIFIC ELEMENTS /////////////////////////////////

  this.inventoryContainer = $('div.compute_inventory_summary');
  this.capacityContainer = $('div[ng-controller="ComputeCapacitySummaryController"]');

  ///////////////// END stdcfg SPECIFIC ELEMETNS /////////////////////////////

  // returns a navTab element by text
  this.getNavTab = function(tab_name) {
    return this.navTabList.filter(function(tab, index) {
      return tab.getText().then(function(text) {
        return text.toUpperCase() === tab_name.toUpperCase();
      });
    }).first();
  };

  this.filterAlarmState = function(state_class) {
    return octable.tableRows.filter(function(row) {
      return row.$$('td[ng-repeat]').get(1).$('div').getAttribute('class')
        .then(function(classes) {
          return classes.split(' ').indexOf(state_class) !== -1;
        });
    });
  };

  this.filterDimension = function(dimension) {
    return octable.tableRows.filter(function(row) {
      return row.$$('td[ng-repeat]').get(4).getText().then(function(dimensions) {
        return dimensions.replace('\n','').split(',').indexOf(dimension) !== -1;
      });
    });
  };

  this.filterService = function(service) {
    var filter = 'service=' + service;
    return octable.tableRows.filter(function(row) {
      return row.$$('td[ng-repeat]').get(4).getText().then(function(dimensions) {
        var mod_dimensions = dimensions.replace('\n', '').split(',');
        return dimensions.replace('\n','').split(',').indexOf(filter) !== -1;
      });
    });
  };

  this.testFirstTablePageRows = function(rowFilter) {
    // allows promises to return values before checking equality
    return rowFilter.count().then(function(filterCount) {
      return octable.tableRows.count().then(function(rowCount){
        return filterCount === rowCount;
      });
    });
  };

  this.get = function() {
    navigate.get_page('/#/compute/compute_alarm_summary');
  };
};

module.exports = ComputeSummary;
