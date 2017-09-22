// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// Specs for the Alarm Explorer page at: /#/alarm/alarm_explorer
var AlarmExplorer = require('./alarm_explorer.pageObject.js');
var OcTable = require('../../common/octable.pageObject.js');
var CreateAlarmDefModal = require('../../common/create_alarm_definition_modal.pageObject.js');

describe('alarm explorer', function() {

  var alarmExplorer = new AlarmExplorer();
  var octable = new OcTable();
  var createAlarmDefModal = new CreateAlarmDefModal();
  var default_timeout;
  beforeAll(function() {
    default_timeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    alarmExplorer.get();
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 120 * 1000;
  });

  afterAll(function(){
    jasmine.DEFAULT_TIMEOUT_INTERVAL = default_timeout;
  });

  describe('Dashboard', function() {
    it('should have the correct url', function() {
      expect(browser.getCurrentUrl())
        .toBe(browser.baseUrl + '/#/alarm/alarm_explorer');
    });
    it('should have the correct title', function() {
      expect(browser.getTitle()).toEqual('Alarm Explorer');
    });
    it('should have the correct tabs', function() {
      expect(alarmExplorer.navTabList.get(0).getText()).toEqual('Alarm Explorer');
      expect(alarmExplorer.navTabList.get(1).getText()).toEqual('Alarm Definition');
      expect(alarmExplorer.navTabList.get(2).getText()).toEqual('Notification Methods');
    });
    it('should have the correct tab selected', function() {
      expect(alarmExplorer.selectedTab.getText()).toEqual('Alarm Explorer');
    });
  });

  describe('AlarmDefinition', function() {
    it('should clear new alarm definition on a cancel', function() {
      alarmExplorer.createAlarmDefinition('TestAlarmDef', 'SUM', 'ab', 'Greater Than or Equal To', 'cloud_name', 'type', 'MEDIUM', false);
      alarmExplorer.createAlarmButton.click();
      expect(createAlarmDefModal.alarm_name.getText()).toBe('');
      createAlarmDefModal.cancel_button.click();
    });
    it('should create and delete a new alarm definition', function() {
      alarmExplorer.createAlarmDefinition('TestAlarmDef', 'SUM', 'ab', 'Greater Than or Equal To', 'cloud_name', 'type', 'MEDIUM', true);
      alarmExplorer.verifyAlarmDefinition('TestAlarmDef');
      expect(alarmExplorer.tableDataDefName.getText()).toContain('TestAlarmDef');

      alarmExplorer.removeAlarmDefinition('TestAlarmDef');
      alarmExplorer.verifyAlarmDefinition('TestAlarmDef');
      expect(alarmExplorer.tableDataDefName.isPresent()).toBe(false);
    });
  });

  describe('Alarm Notification ', function() {
    it('should create new notification method', function() {
      alarmExplorer.addNewNotificationMethod('Test', 'someone@email.com', true);
      alarmExplorer.verifyNotificationMethod('Test');
      expect(alarmExplorer.notificationName.getText()).toContain('Test');

      alarmExplorer.removeNotificationMethod('Test');
      alarmExplorer.verifyNotificationMethod('Test');
      expect(alarmExplorer.notificationName.isPresent()).toBe(false);
    });
    it('should update new notification method', function() {
      alarmExplorer.addNewNotificationMethod('Test', 'someone@email.com', true);
      alarmExplorer.verifyNotificationMethod('Test');
      expect(alarmExplorer.notificationName.getText()).toContain('Test');

      alarmExplorer.updateNewNotificationMethod('Testupd', 'update@email.com', true);
      alarmExplorer.verifyNotificationMethod('Testupd');
      expect(alarmExplorer.notificationName.getText()).toContain('Testupd');

      alarmExplorer.removeNotificationMethod('Testupd');
      alarmExplorer.verifyNotificationMethod('Testupd');
      expect(alarmExplorer.notificationName.isPresent()).toBe(false);
    });
  });
});
