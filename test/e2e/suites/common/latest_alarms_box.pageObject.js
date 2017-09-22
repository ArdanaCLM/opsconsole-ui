// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// Represents the Latest Alarms Box Element present on a few pagelist

var LatestAlarmsBox = function() {
  this.newAlarmHeader = $('.alarmList .latest-alarms-header');
  this.newAlarmContainer = $('.latest-alarms-container');

  // string top left
  this.topLine = this.newAlarmContainer.$('.top-line oc-translate');
  this.topLineDate = Date.parse(String(this.topLine.getText()).split("NEW ALARMS AS OF "));

  // Config button & dropdown
  this.config = this.newAlarmContainer.$('.top-line-right');
  this.configIcon = this.config.$('.config-button');
  this.configBtn = this.config.$('.configure');

  this.configDropdown = this.newAlarmContainer.$('.config-dropdown');
  this.configDropdownLabel = this.configDropdown.$('.oc-input')
    .$$('.input-label').first();

  this.configDropdownList = this.configDropdown.$('.oc-select-list')
    .$$('div[ng-click="selectOption(option)"]');
  this.configDropdownPlaceholder = this.configDropdown
    .$('.select-placeholder.active');

  // Alarm Count Summary
  this.alarmCounts = this.newAlarmContainer.$('.upperRow').$$('.datum');
  this.criticalBox = this.alarmCounts.get(0);
  this.warningBox = this.alarmCounts.get(1);
  this.unknownBox = this.alarmCounts.get(2);
  this.totalBox = this.alarmCounts.get(3);

  this.criticalLabel = this.criticalBox.$('.oc-unit');
  this.warningLabel = this.warningBox.$('.oc-unit');
  this.unknownLabel = this.unknownBox.$('.oc-unit');
  this.totalLabel = this.totalBox.$('.oc-unit');

  this.criticalValue = this.criticalBox.$('.oc-value');
  this.warningValue = this.warningBox.$('.oc-value');
  this.unknownValue = this.unknownBox.$('.oc-value');
  this.totalValue = this.totalBox.$('.oc-value');

  // config dropdown needs to be open for this to work
  this.select_config_option = function(index) {
    this.configDropdown.click();
    this.configDropdownList.get(index).click();
  };
};

module.exports = LatestAlarmsBox;
