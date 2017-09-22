// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// Represents the Central Dashboard page at: /#/general/dashboard_alarms_summary

var HamburgerMenu = require('../../common/hamburger_menu.pageObject.js');
var Login = require('../../login/login.pageObject.js');

var CentralDashboard = function() {

  this.navigate = new HamburgerMenu();
  this.loginPage = new Login();

  this.additionalResourcesPopover = $('.popover-items .popover-item .ardana-icon-App');

  this.notificationPopover = $('.popover-items .popover-item .ardana-icon-Notification');
  this.clearNotificationsBtn = $('button[ng-click="clear();"]');
  this.markNotificationsViewedBtn = $('button[ng-click="markViewed();"]');

  this.helpPopover = $('.popover-items .popover-item .ardana-icon-Help');

  this.accountPopover = $('.popover-items .popover-item .ardana-icon-User_settings');
  this.logoutLink = element(by.linkText('Log Out'));

  // Central Dashboard
  this.configureAlarmsBtn = $('.latest-alarms-container .top-line')
    .$('.top-line-right');
  this.configureAlarmsDropdown = $('oc-input[select-options="timeOptions"]').$('.oc-input');
  this.configureAlarmsOptions = this.configureAlarmsDropdown
    .$$('.oc-select-list div');
  this.configureAlarmsSelection = this.configureAlarmsDropdown
    .$('ng-form .select-placeholder.active');
  this.alarmCards = $('.summaryAlarms').$$('alarmcard');
  this.deleteDashboardItemModal = $('opsmodal[showattribute="showDeleteConfirm"]');
  this.deleteDashboardItemConfirm = this.deleteDashboardItemModal.element(by.binding('\'common.confirm\' | translate'));
  this.deleteDashboardItemCancel = this.deleteDashboardItemModal.element(by.binding('\'common.cancel\' | translate'));

  // Dashboard Card
  this.addDashboardCardBtn = $('button[ng-click="launchNewDynCardModal()"]');
  this.createCard = $('.createCard');
  this.createCardName = this.createCard.$('oc-input[value="ctrl.newCardSelections.name"]').$('input[type=text]');
  this.createCardDimension = this.createCard.$('oc-input[value="ctrl.modalCreateAlarmsServiceMode"]').$('ng-form div .active');
  this.createCardDimensionOptions = this.createCard.$('oc-input[value="ctrl.modalCreateAlarmsServiceMode"]').$$('.list-shown div');
  this.createCardSelectServiceBtn = this.createCard.$('oc-input[name="inputService"] button');
  this.createCardSelectionOptions = $('.typePicker').$$('div .metric-picker-item span');
  this.createCardApplySelectionBtn = $('.typePicker').$('.buttonRow button');
  this.createCardBtn = this.createCard.$('button[ng-click="ctrl.processNewDynCardModal(CardCreateUpdateForm)"]');
  this.cancelCardBtn = this.createCard.$('button[ng-click="ctrl.cancelNewDynCardModal(CardCreateUpdateForm)"]');

  this.get = function() {
    this.navigate.get_page('/#/general/dashboard_alarms_summary');
  };

  //
  // Navigation and Popover Functions
  //

  this.logout = function() {
    this.accountPopover.click();
    this.logoutLink.click();
    this.loginPage.get();
  };

  //
  // Central Dashboard Functions
  //

  this.clickConfigureAlarms = function() {
    browser.executeScript('arguments[0].click()', this.configureAlarmsBtn.getWebElement());
  };

  //
  // New Dashboard Card Functions
  //

  this.createDashboardCard = function(cardName, shouldCreate) {
    this.addDashboardCardBtn.click();
    this.createCardName.sendKeys(cardName);
    this.createCardDimension.click();
    // Select Dimension - Server
    this.createCardDimensionOptions.first().click();
    this.createCardSelectServiceBtn.click();
    // Select 5th service option
    this.createCardSelectionOptions.each(function(element, index) {
      if (index == 5) {
        element.click();
      }
    });
    this.createCardApplySelectionBtn.click();
    if (shouldCreate === true) {
      this.createCardBtn.click();
    } else {
      this.cancelCardBtn.click();
    }
  };

  this.removeDashboardCard = function(cardName) {
    var toRemove = this.alarmCards.filter(function(elem, index) {
      return elem.$('.header .text').getText().then(function(text) {
        return text === cardName.toUpperCase();
      });
    }).last();
    toRemove.$('.header .dropDown .dropdown-toggle').click();
    toRemove.element(by.repeater('menuItem in ctrl.amenu').row(1)).click();
    this.deleteDashboardItemConfirm.click();
  };

  this.editAlarmCard = function(cardNum) {
    this.alarmCards.get(cardNum).$('.header .dropDown .dropdown-toggle').click();
    this.alarmCards.get(cardNum).element(by.repeater('menuItem in ctrl.amenu').row(0)).click();
    this.cancelCardBtn.click();
  };
};

module.exports = CentralDashboard;
