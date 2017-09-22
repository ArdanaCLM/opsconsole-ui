// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// Represents the Alarm Explorer page at: /#/alarm/alarm_explorer
var HamburgerMenu = require('../../common/hamburger_menu.pageObject.js');
var CreateAlarmDefModal = require('../../common/create_alarm_definition_modal.pageObject.js');
var SelectMetricModal = require('../../common/select_metric_modal.pageObject.js');
var EditDimensionModal = require('../../common/edit_dimension_modal.pageObject.js');
var EditMatchbyModal = require('../../common/edit_matchby_modal.pageObject.js');
var OcTable = require('../../common/octable.pageObject.js');

var AlarmExplorer = function() {

  var navigate = new HamburgerMenu();
  var createAlarmDefModal = new CreateAlarmDefModal();
  var selectMetricModal = new SelectMetricModal();
  var editDimensionModal = new EditDimensionModal();
  var editMatchbyModal = new EditMatchbyModal();
  var octable = new OcTable();
  this.get = function() {
    navigate.get_page('/#/alarm/alarm_explorer');
  };
  //Alarm Def Creation button
  this.createAlarmButton = octable.globalActionButtons.first();
  //AlarmExplorer Dashboard
  this.navTabs = $$('.nav.nav-tabs').first();
  this.navTabList = this.navTabs.all(by.repeater('tabbedpage in pagelist'));
  // the currently selected navTab
  this.selectedTab = this.navTabs.$('.selected');
  //Functions on Visible Tab
  this.update_alarm_definition_button = $('ng-click="ctrl.$parent.editAlarmDefinition()"');
  this.delete_alarm_definition_button = $('ng-click="ctrl.$parent.showDeleteModal(definition)"');

  //OcTable Section
  this.notificationContent = octable.tableRows.$$('td[ng-repeat]').first();
  this.notificationName = this.notificationContent.element(by.binding('data[header.displayfield] | tableDisplayFilter:header.filter'));
  this.tableDataDefName = octable.tableRows.$$('td.clickable_content.highlight').first();
  this.tableEditButton = octable.tableRows.$$('button.dropdown-toggle').first();
  this.tableEditDropdown = octable.tableRows.$$('.dropdown.open button.actionMenuItem').first();
  this.selected_action_controller = octable.container.$('octable .selected_action_controller');
  this.deleteDefButton = this.selected_action_controller.$('button.oc-btn-default');

  //OcTable Delete Alarm Popup Section
  this.container_delete = $$('.content-form.ng-scope:not(.ng-hide) opsmodal').first();
  this.deleteAlarmDefModal = this.container_delete.$('.oc-modal-footer');
  this.deleteAlarmDefConfirm = this.deleteAlarmDefModal.element(by.binding('\'common.confirm\' | translate'));
  var today = new Date();
  var timeStamp = today.getMonth() + '' + today.getDate() + '' + today.getHours() + '' + today.getMinutes() + '';
  //Functions Section
  this.selectFunction = function(functionType) {
    createAlarmDefModal.alarm_function_placeholder.click();
    createAlarmDefModal.alarm_function_select_list.get(this.selectFunctionType(functionType)).click();
  };
  this.selectFunctionType = function(functionType) {
    // find the section
    switch (functionType) {
      case "MIN":
        return 0;
      case "MAX":
        return 1;
      case "SUM":
        return 2;
      case "COUNT":
        return 3;
      case "AVG":
        return 4;
      case "LAST":
        return 5;
      default:
        return 0;
    }
  };
  this.selectMetric = function(metricName, shouldAdd) {
    createAlarmDefModal.alarm_metric_button.click();
    selectMetricModal.enum_filter_input.sendKeys(metricName);
    if (shouldAdd)
      selectMetricModal.metric_item_list.get(0).click();
    else
      selectMetricModal.alarm_metric_cancel_button.click();
  };
  this.selectRelationalOperator = function(RelationalType) {
    createAlarmDefModal.alarm_relational_operator_placeholder.click();
    createAlarmDefModal.alarm_relational_operator_select_list.get(this.selectRelationalType(RelationalType)).click();
  };
  this.selectRelationalType = function(RelationalType) {
    // find the section
    switch (RelationalType) {
      case "Less Than":
        return 0;
      case "Less Than or Equal To":
        return 1;
      case "Greater Than or Equal To":
        return 2;
      case "Greater Than":
        return 3;
      default:
        return 0;
    }
  };
  this.selectDimension = function(dimesionName, shouldAdd) {
    createAlarmDefModal.alarm_dimension_button.click();
    editDimensionModal.enum_filter_input.sendKeys(dimesionName);
    editDimensionModal.dimension_item_list.get(0).click();
    if (shouldAdd)
      editDimensionModal.add_dimension_button.click();
    else
      this.alarm_dimension_cancel_button.click();
  };
  this.selectMatchBy = function(selectMatchByType, shouldAdd) {
    createAlarmDefModal.alarm_matchby_button.click();
    editMatchbyModal.enum_filter_input.sendKeys(selectMatchByType);
    editMatchbyModal.dimension_item_list.click();
    if (shouldAdd)
      editMatchbyModal.add_match_button.click();
    else
      this.alarm_matchby_cancel_button.click();
  };
  this.state_alarm_severity_checkbox = function(index, severity) {
    this.selectSeverity(severity);
    $$('i.ardana-icon.ardana-icon-Checkbox').filter(function(elem, index) {
      return elem.isDisplayed();
    }).get(index).click();
  };
  this.state_undetermined_severity_checkbox = function(index) {
    createAlarmDefModal.state_undetermined_tab.click();
    $$('i.ardana-icon.ardana-icon-Checkbox').filter(function(elem, index) {
      return elem.isDisplayed();
    }).get(index).click();
  };
  this.state_ok_severity_checkbox = function(index) {
    createAlarmDefModal.state_ok_tab.click();
    $$('i.ardana-icon.ardana-icon-Checkbox').filter(function(elem, index) {
      return elem.isDisplayed();
    }).get(index).click();
  };
  this.selectSeverity = function(ServerityType) {
    createAlarmDefModal.state_alarm_severity_placeholder.click();
    createAlarmDefModal.state_alarm_severity_dropdown.get(this.selectAlarmSeverityType(ServerityType)).click();
  };
  this.selectAlarmSeverityType = function(ServerityType) {
    // find the section
    switch (ServerityType) {
      case "CRITICAL":
        return 0;
      case "HIGH":
        return 1;
      case "MEDIUM":
        return 2;
      case "LOW":
        return 3;
      default:
        return 0;
    }
  };
  //
  //Create Alarm Definition Funcion
  //
  this.createAlarmDefinition = function(definitionName, functionType, metricName, relationalOpr, dimension, matchBy, severity, shouldCreate) {
    this.createAlarmButton.click();
    //Enter AlarmName
    createAlarmDefModal.alarm_name.sendKeys(definitionName + timeStamp);
    //Enter AlarmDescription
    createAlarmDefModal.alarm_description.sendKeys(definitionName + '_Desctiption');
    //select Function
    this.selectFunction(functionType);
    //select Metric
    this.selectMetric(metricName, true);
    //select Relational Operator
    this.selectRelationalOperator(relationalOpr);
    //Enter Value
    createAlarmDefModal.alarm_value.sendKeys('10');
    //select Dimension
    this.selectDimension(dimension, true);
    //select MatchBy
    this.selectMatchBy(matchBy, true);
    //select severity & Notification Method
    this.state_alarm_severity_checkbox(0, severity);
    if (shouldCreate === true) {
      createAlarmDefModal.create_button.click();
    } else {
      createAlarmDefModal.cancel_button.click();
    }
  };
  this.verifyAlarmDefinition = function(definitionName) {
    this.navTabList.get(1).click();
    octable.tableFilterInput.click();
    octable.tableFilterDropdownList.click();
    octable.tableFilterDropdownInput.sendKeys(definitionName + timeStamp, protractor.Key.ENTER);
  };
  this.removeAlarmDefinition = function(definitionName) {
    this.navTabList.get(0).click();
    this.navTabList.get(1).click();
    octable.tableFilterItemClearBtns.click();
    octable.tableFilterInput.click();
    octable.tableFilterDropdownList.click();
    octable.tableFilterDropdownInput.sendKeys(definitionName + timeStamp, protractor.Key.ENTER);
    octable.tableRowCheckBoxes.first().click();
    this.deleteDefButton.click();
    this.deleteAlarmDefConfirm.click();
    this.navTabList.get(0).click();
    this.navTabList.get(1).click();
    octable.tableFilterItemClearBtns.click();
  };

  //Notification Method Tab
  this.container_notificationMethod = $$('.content-form.ng-scope:not(.ng-hide) oct-global-actions-control').first();
  this.createNotificationMethodBtn = this.container_notificationMethod.$('button.oc-btn-primary');
  this.notificationMtdname = stackableModal.top_modal.$('input[name="inputName"]');
  this.notificationTypeDropdown = stackableModal.top_modal.$$('oc-input[value="notifCtrl.updateNotificationData.type"]').first();
  this.expandNotificationDropdown = this.notificationTypeDropdown.$('.select-placeholder.active');
  this.notificationTypeSelect = stackableModal.top_modal.$$('div[ng-click="selectOption(option)"]');
  this.notificationAddress = stackableModal.top_modal.$('input[name="inputDescription"]');
  this.confirmCreateNotificationMethod = stackableModal.top_modal.$('button[ng-click="notifCtrl.commitCreateNotification()"]');
  this.confirmUpdateNotificationMethod = stackableModal.top_modal.$('button[ng-click="notifCtrl.commitEditNotification()"]');
  this.cancelCreateNotificationMethod = stackableModal.top_modal.$('button[ng-click="notifCtrl.closeCreateModal()"]');

  this.addNewNotificationMethod = function(notifName, notifAddress, shouldAdd) {
    this.navTabList.get(2).click();
    this.createNotificationMethodBtn.click();
    this.notificationMtdname.sendKeys(notifName + timeStamp);
    this.expandNotificationDropdown.click();
    this.notificationTypeSelect.get(0).click();
    this.notificationAddress.sendKeys(notifAddress);
    if (shouldAdd)
      this.confirmCreateNotificationMethod.click();
    else
      this.cancelCreateNotificationMethod.click();
  };
  this.verifyNotificationMethod = function(notifName) {
    this.navTabList.get(2).click();
    octable.tableFilterItemClearBtns.click();
    octable.tableFilterInput.click();
    octable.tableFilterDropdownList.click();
    octable.tableFilterDropdownInput.sendKeys(notifName + timeStamp, protractor.Key.ENTER);
  };
  this.removeNotificationMethod = function(notifName) {
    this.navTabList.get(0).click();
    this.navTabList.get(2).click();
    octable.tableFilterItemClearBtns.click();
    octable.tableFilterInput.click();
    octable.tableFilterDropdownList.click();
    octable.tableFilterDropdownInput.sendKeys(notifName + timeStamp, protractor.Key.ENTER);
    octable.tableRowCheckBoxes.first().click();
    this.deleteDefButton.click();
    this.deleteAlarmDefConfirm.click();
    this.navTabList.get(0).click();
    this.navTabList.get(2).click();
    octable.tableFilterItemClearBtns.click();
  };
  this.updateNewNotificationMethod = function(notifName, notifAddress, shouldAdd) {
    this.tableEditButton.click();
    this.tableEditDropdown.click();
    this.notificationMtdname.clear().sendKeys(notifName + timeStamp);
    this.expandNotificationDropdown.click();
    this.notificationTypeSelect.get(0).click();
    this.notificationAddress.clear().sendKeys(notifAddress);
    if (shouldAdd)
      this.confirmUpdateNotificationMethod.click();
    else
      this.cancelCreateNotificationMethod.click();
  };
};
module.exports = AlarmExplorer;
