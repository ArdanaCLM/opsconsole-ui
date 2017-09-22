// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// Specs for the Central / Alarms Dashboard page at: /#/general/dashboard_alarms_summary

var CentralDashboard = require('./central_dashboard.pageObject.js');
var Login = require('../../login/login.pageObject.js');
var HamburgerMenu = require('../../common/hamburger_menu.pageObject.js');

describe('central dashboard', function() {

  var centralDashboard = new CentralDashboard();
  var navigate = new HamburgerMenu();

  beforeAll(function() {
    centralDashboard.get();
  });

  it('should have the correct url', function() {
    expect(browser.getCurrentUrl())
      .toBe(browser.baseUrl + '/#/general/dashboard_alarms_summary');
  });

  it('should have the correct title', function() {
    if (browser.params.env == 'stdcfg') {
      expect(browser.getTitle()).toEqual('Central Dashboard');
    } else {
      expect(browser.getTitle()).toEqual('Alarms Dashboard');
    }
  });

  it('should show/hide alarm timer configuration', function() {
    expect(centralDashboard.configureAlarmsDropdown.isDisplayed()).toBe(false);
    centralDashboard.clickConfigureAlarms();
    expect(centralDashboard.configureAlarmsDropdown.isDisplayed()).toBe(true);
    centralDashboard.clickConfigureAlarms();
    expect(centralDashboard.configureAlarmsDropdown.isDisplayed()).toBe(false);
  });

  it('should select alarm timer configuration', function () {
    centralDashboard.clickConfigureAlarms();
    centralDashboard.configureAlarmsDropdown.click();
    var lastOption = centralDashboard.configureAlarmsOptions.last().getText();
    centralDashboard.configureAlarmsOptions.last().click();
    expect(centralDashboard.configureAlarmsSelection.getText())
        .toEqual(lastOption);
  });

  it('should navigate through the hamburger menu', function() {
    navigate.hamburgerMenu.click();
    navigate.expandHamburgerSections();
    navigate.hamburgerMenu.click();
  });

  it('should clear new dashboard/alarm card on a cancel', function() {
    centralDashboard.createDashboardCard('Testing Card', false);
    centralDashboard.addDashboardCardBtn.click();
    expect(centralDashboard.createCardName.getText()).toBe('');
    centralDashboard.cancelCardBtn.click();
  });

  it('should edit alarm card', function() {
    centralDashboard.editAlarmCard(0);
  });

  it('should add and delete a new dashboard card', function() {
    centralDashboard.createDashboardCard('Testing Card', true);
    var cardTitles = centralDashboard.alarmCards.all(by.css('.header .text')).getText();
    expect(cardTitles).toContain('Testing Card'.toUpperCase());

    centralDashboard.removeDashboardCard('Testing Card');
    cardTitles = centralDashboard.alarmCards.all(by.css('.header .text')).getText();
    expect(cardTitles).not.toContain('Testing Card'.toUpperCase());
  });

  it('should log out and log back in', function() {
    centralDashboard.logout();
    expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/login');

    loginPage.login(browser.params.login.user, browser.params.login.password);
    return browser.wait(function () {
      return browser.getCurrentUrl().then(function(url) {
        return url === browser.baseUrl + '/#/general/dashboard_alarms_summary';
      });
    }, 5000, 'login did not make it to /#/general/dashboard_alarms_summary');
  });
});
