// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// Specs for the Login page at: /#/login

var Login = require('./login.pageObject.js');
var CentralDashboard = require('../home/central_dashboard/central_dashboard.pageObject.js');

describe('login page', function() {

  var loginPage = new Login();

  beforeAll(function() {
    // make sure site is logged out, if not logout
    browser.getCurrentUrl().then(function(url) {
      if(url !== browser.baseUrl + '/#/login'){
        dashboard = new CentralDashboard();
        dashboard.logout();
      } else {
        loginPage.get();
      }
    });
  });

  it('should have the correct url', function() {
    expect(browser.getCurrentUrl())
      .toBe(browser.baseUrl + '/#/login');
  });

  describe('login button', function() {

    it('should initially be disabled', function() {
      expect(loginPage.loginBtn.isEnabled())
        .toEqual(false);
    });

    it('should be disabled with only one login field filled', function() {
      loginPage.loginField.sendKeys('username');

      expect(loginPage.loginBtn.isEnabled())
        .toEqual(false);

      loginPage.loginField.clear();


      loginPage.passField.sendKeys('password');

      expect(loginPage.loginBtn.isEnabled())
        .toEqual(false);

      loginPage.passField.clear();
    });

    it('should be enabled with both login fields filled', function() {
      loginPage.loginField.sendKeys('username');
      loginPage.passField.sendKeys('password');

      expect(loginPage.loginBtn.isEnabled())
        .toEqual(true);

      loginPage.loginField.clear();
      loginPage.passField.clear();
    });
  });

  it('should show password on showPassword icon click', function() {
    var password = 'matching';
    loginPage.passField.sendKeys(password);
    loginPage.revealPassBtn.click();
    expect(loginPage.showPassField.getAttribute('value')).toEqual(password);
    expect(loginPage.showPassField.getAttribute('type')).toEqual('text');
    loginPage.revealPassBtn.click();
    loginPage.passField.clear();
  });

  describe('after rejecting incorrect credentials', function() {

    beforeAll(function() {
      loginPage.login('incorrect', 'invalid');
    });

    afterAll(function() {
      // clear incorrect account input field
      loginPage.loginField.clear();
    });

    it('should remain on the login page', function() {
      expect(browser.getCurrentUrl())
        .toBe(browser.baseUrl + '/#/login');
    });

    it('should display a login error box and input error borders', function() {
      expect(element(by.id('login-error-box')).isPresent())
        .toBe(true);
      expect(element(by.id('username_border_frame')).getAttribute('class'))
        .toBe('login-edit-error');
      expect(element(by.id('password_border_frame')).getAttribute('class'))
        .toBe('login-edit-error');
    });

    it('should clear password input', function() {
      expect(loginPage.passField.getAttribute('value'))
        .toBe('');
    });
  });

  it('should login and redirect', function() {
    loginPage.login(browser.params.login.user, browser.params.login.password);
    expect(browser.getCurrentUrl())
        .toBe(browser.baseUrl + '/#/general/dashboard_alarms_summary');
  });
});
