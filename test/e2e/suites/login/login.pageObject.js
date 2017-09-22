// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// Represents the Login page at: /#/login

var Login = function() {
  this.loginField = element(by.model('user.name'));
  this.passField = element(by.id('password_border_frame'))
      .$('input[type=password]');
  this.showPassField = element(by.id('password_border_frame'))
      .$('input[type=text]');
  this.revealPassBtn = element(by.id('password_border_frame'))
      .$('.logineye');
  this.loginBtn = element(by.id('login-btn')).$('button');

  this.get = function() {
    browser.get('/#/login');
  };

  this.login = function(username, passwd) {
    this.loginField.sendKeys(username);
    this.passField.sendKeys(passwd);
    this.loginBtn.click();
  };
};

module.exports = Login;
