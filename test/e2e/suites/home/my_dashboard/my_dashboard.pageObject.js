// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// Represents the My Dashboard page at: /#/alarm/dashboard
var StackableModal = require('../../common/stackable_modal.pageObject.js');
var HamburgerMenu = require('../../common/hamburger_menu.pageObject.js');

var MyDashboard = function() {

  var myHamburgerMenu = new HamburgerMenu();
  this.get = function() {
    myHamburgerMenu.get_page('/#/alarm/dashboard');
  };

  // 1. Get Stackable Modal for Adding New Widgets
  stackableModal = new StackableModal();

  //Finding Currently Selected Dashboard Tab
  this.currentSelectedTab = $$('.content-form.ng-scope').filter(function(elem, index) { return elem.isDisplayed(); }).first();

  // 2. Adding New Custom Tab
  this.createNewTabBtn = $('button[ng-click="initTabCreate()"]');
  this.addNewTabModal = $('opsmodal[showattribute="showCreateTab"]');
  this.addTabName = this.addNewTabModal.$('input[name="inputName"]');
  this.confirmAddTabBtn = this.addNewTabModal.element(by.binding('\'common.confirm\' | translate'));
  this.cancelAddTabBtn = this.addNewTabModal.element(by.binding('\'common.cancel\' | translate'));

  // 3. Editing Name of Custom Tab
  this.editTabBtn = this.currentSelectedTab.$('button[ng-click="ctrl.editTab($index)"]');
  this.editNewTabModal = $('opsmodal[showattribute="showEditeTab"]');
  this.editTabName = this.editNewTabModal.$('input[name="inputName"]');
  this.confirmEditTabBtn = this.editNewTabModal.element(by.binding('\'common.confirm\' | translate'));
  this.cancelEditTabBtn = this.editNewTabModal.element(by.binding('\'common.cancel\' | translate'));

  // 4. Deleting New Custom Tab
  this.deleteTabBtn = this.currentSelectedTab.$('button[ng-click="ctrl.initDeleteTab($index)"]');
  this.deleteNewTabModal = $('opsmodal[showattribute="showTabDeleteConfirm"]');
  this.confirmDeleteTabBtn = this.deleteNewTabModal.element(by.binding('\'common.confirm\' | translate'));
  this.cancelDeleteTabBtn = this.deleteNewTabModal.element(by.binding('\'common.cancel\' | translate'));

  // 5. Adding New Widget to My Dashboard Card
  this.addWidgetBtn = this.currentSelectedTab.$('button[ng-click="ctrl.showAddWidgetModal($index)"]');
  this.addWidgetName = stackableModal.top_modal.element( by.model('itemsFilter') );
  this.selectWidgetService = stackableModal.top_modal.element( by.model('item.$rowSelected'));
  this.AddDashboardItemBtn = stackableModal.top_modal.$('button[ng-click="ctrl.addDashboardItems()"]');

  // 6. Top Navbar for All Custom Dashboard Tabs
  this.navTabs = $$('.nav.nav-tabs').first();
  this.navTabList = this.navTabs.all(by.repeater('tabbedpage in pagelist'));
  // 6.1 The Currently Selected navTab
  this.selectedTab = this.navTabs.$('.selected');

  // 7. Adding New Chart to Existing Dashboard
  this.createNewChartBtn = this.currentSelectedTab.$('button[ng-click="ctrl.initiateChartCreation($index)"]');
  this.chartTitleModalLbl = stackableModal.top_modal.$('h2.oc-heading');
  this.cancelAddChartBtn = stackableModal.top_modal.$( 'button[ng-click="ctrl.chartCreateModal.closeModal()"]');
  this.createNewChartConfBtn = stackableModal.top_modal.$( 'button[ng-click="ctrl.createChart()"]');

  // 7.1 Adding Chart definition - Creating new chart
  this.formTitleModalLbl = stackableModal.top_modal.$('h3.oc-heading');
  this.chartNameTxtBox = stackableModal.top_modal.$('input[name="inputName"]');
  // 7.1.1 Selecting Time Range Locators
  this.timeRangePlaceholder = stackableModal.top_modal.$('oc-input[name="chartTimeRange"]');
  this.timeRangeLabel = this.timeRangePlaceholder.$('.input-label.select');
  this.timeRangeSelectList = this.timeRangePlaceholder.$$('div[ng-click="selectOption(option)"]');
  // 7.1.2 Selecting Chart Update Rate Locators
  this.chartUpdateRatePlaceholder = stackableModal.top_modal.$('oc-input[name="chartUpdateRate"]');
  this.chartUpdateRateLabel = this.chartUpdateRatePlaceholder.$('.input-label.select');
  this.chartUpdateRateSelectList = this.chartUpdateRatePlaceholder.$$('div[ng-click="selectOption(option)"]');
  // 7.1.3 Selecting Chart Type Locators
  this.chartTypePlaceholder = stackableModal.top_modal.$('oc-input[name="chartType"]');
  this.chartTypeLabel = this.chartTypePlaceholder.$('.input-label.select');
  this.chartTypeSelectList = this.chartTypePlaceholder.$$('div[ng-click="selectOption(option)"]');
  // 7.1.4 Selecting Chart Size Locators
  this.chartSizePlaceholder = stackableModal.top_modal.$('oc-input[name="chartSize"]');
  this.chartSizeLabel = this.chartSizePlaceholder.$('.input-label.select');
  this.chartSizeSelectList = this.chartSizePlaceholder.$$('div[ng-click="selectOption(option)"]');

  // 7.2 Added Chart Data - Creating New Chart
  // 7.2.1 Select Metric from metric list
  this.metricFieldListTitle = stackableModal.top_modal.$('.oc-heading');
  this.selectMetricBtn = stackableModal.top_modal.$$('button[ng-click="action()"]').get(0);
  this.metricFilterInput = stackableModal.top_modal.element( by.model('metricFilter'));
  this.metricFieldList = stackableModal.top_modal.$$('dev[ng-bind="label | translate"]');
  this.metricPlaceholder = stackableModal.top_modal.$('oc-input[name="inputMetric"]').$('.button-value');

  // 7.2.2 Select Dimension from Added Chart Data
  this.editDimensionBtn = stackableModal.top_modal.$$('button[ng-click="action()"]').get(1);
  this.editDimensionFilterInput = stackableModal.top_modal.element( by.model('dimensionFilter'));
  this.editDimensionChkBox = stackableModal.top_modal.$$('oc-checkbox[ng-model="ctrl.selectedCurrentDimensions[$index]"]');
  this.addDimensionBtn = stackableModal.top_modal.$('button[ng-click="ctrl.selectDimension()"]');
  this.dimensionPlaceholder = stackableModal.top_modal.$('oc-input[name="inputDimension"]').$('i[ng-click="removeDimension(dimension)"]');

  // 7.2.3 Chart Element Function from Added Chart Data
  this.chartFunctionContainer = stackableModal.top_modal.$('oc-input[name="chartElementFunction"]');
  this.chartFunctionLabel = this.chartFunctionContainer.$('.input-label.select');
  this.chartFunctionSelectList = this.chartFunctionContainer.$$('div[ng-click="selectOption(option)"]');
  this.chartFunctionPlaceholder = this.chartFunctionContainer.$('.select-placeholder.active');

  // 7.2.4 Chart Update and Cancel Buttons
  this.addDataToChartBtn = stackableModal.top_modal.$('button[ng-disabled="ctrl.newChart.chartElements.length > 5 || !ctrl.currentMetric"]');
  this.createChartModalBtn = stackableModal.top_modal.$('button[ng-click="ctrl.createChart()"]');
  this.cancelCreateChartModalBtn = stackableModal.top_modal.$('button[ng-click="ctrl.chartCreateModal.closeModal()"]');

  // 8 Deleting Widget From Custom Dashboard
  this.allDashboardWidgets = this.currentSelectedTab.$$('div[ng-repeat="item in tabbedpage.items"]');
  this.currentWidget = this.allDashboardWidgets.get(0);
  this.threeDotWidgetMenu = this.currentWidget.$('.dropDown');
  this.widgetTitle = this.currentWidget.$('.header .text');
  this.dropDownMenuItems = this.currentWidget.all( by.repeater('menuItem in ctrl.amenu'));

  // 8.1 Delete Widget Modal - Locators
  this.deleteWidgetModal = $('opsmodal[showattribute="showDeleteConfirm"]');
  this.confirmDelWidgetBtn = this.deleteWidgetModal.element(by.binding('\'common.confirm\' | translate'));
  this.cancelDelWidgetBtn = this.deleteWidgetModal.element(by.binding('\'common.cancel\' | translate'));
  this.disabledDeleteWidgetBtn = $('button[ng-click="ctrl.initDeleteTab($index)"]');

  // 9. Delete Chart From Custom Dashboard
  this.allDashboardCharts = this.currentSelectedTab.$$('div[ng-repeat="item in tabbedpage.items"]');
  this.currentChart = this.allDashboardCharts.get(0);
  this.threeDotChartMenu = this.currentChart.$('.dropdown-toggle');
  this.chartTitle = this.currentChart.$('.chartTitle');
  this.chartDropdownMenuItems = this.currentChart.all(by.repeater('menuItem in actionMenu'));

  // 9.1 Delete Chart Modal - Locators
  this.deleteChartModal = $$('opsmodal[showattribute="showDeleteConfirm"]').filter(function(elem, index) { return elem.isDisplayed(); }).first();
  this.confirmDelChartBtn = this.deleteChartModal.element(by.binding('\'common.confirm\' | translate'));
  this.cancelDelChartBtn  = this.deleteChartModal.element(by.binding('\'common.cancel\' | translate'));

  //**
  //*My Dashboard card functions
  //**

  //Delete Added Widget On My Dashboard
  this.deleteAddedWidget = function(shouldDelete){
    this.threeDotWidgetMenu.click();
    this.dropDownMenuItems.get(0).click();
    if(shouldDelete)
      this.confirmDelWidgetBtn.click();
    else
      this.cancelDelWidgetBtn.click();
  };

  //Add New Tab on My Dashboard
  this.createNewTab = function(tabName, shouldCreate){
    this.createNewTabBtn.click();
    //Check if Confirm Button is Disabled
    expect( this.confirmAddTabBtn.isEnabled() ).toBe(false);
    this.addTabName.sendKeys(tabName);
    if(shouldCreate)
      this.confirmAddTabBtn.click();
    else
      this.cancelAddTabBtn.click();
  };

  //Change name of added tab on dashboard
  this.editDashboardTabName = function(tabName, shouldEdit){
    this.editTabBtn.click();
    this.editTabName.clear().sendKeys(tabName);
    if(shouldEdit)
      this.confirmEditTabBtn.click();
    else
      this.cancelEditTabBtn.click();
  };

  //Delete Newly Added Tab on My Dashboard
  this.deleteNewTab = function(shouldDelete){
    this.deleteTabBtn.click();
    if( shouldDelete ){
      this.confirmDeleteTabBtn.click();
      return true;
    }
    else{
      this.cancelDeleteTabBtn.click();
      return false;
    }
  };

  //Adding new Widget to existing Dashboard
  this.addNewWidget = function(widgetName, shouldAdd){
    this.addWidgetBtn.click();
    this.addWidgetName.sendKeys(widgetName);
    this.selectWidgetService.click();
    if(shouldAdd)
      this.AddDashboardItemBtn.click();
    else
      stackableModal.top_close.click();
  };

  //Creating new chart on existing dashboard
  this.addChartToDashboard = function(chartName, metricName, dimensionName, shouldAdd){
    this.addChartDefinition(chartName);
    this.selectMetricField(metricName);
    this.editDimensionField(dimensionName);
    this.selectChartFunction();
    this.updateChartOnDashboard(shouldAdd);
  };

  //Adding Chart Definition
  this.addChartDefinition = function(chartName){
    this.chartNameTxtBox.sendKeys(chartName);
    //Selecting time range
    this.timeRangeLabel.click();
    this.timeRangeSelectList.get(2).click();
    //Selecting chart update
    this.chartUpdateRateLabel.click();
    this.chartUpdateRateSelectList.get(2).click();
    //Selecting chart type
    this.chartTypeLabel.click();
    this.chartTypeSelectList.get(2).click();
    //Selecting chart size
    this.chartSizeLabel.click();
    this.chartSizeSelectList.get(1).click();
  };

  //Select Metric from metric list - creating new chart
  this.selectMetricField = function(metricName){
    this.selectMetricBtn.click();
    this.metricFilterInput.sendKeys(metricName);
    this.metricFieldList.get(0).click();
  };

  //Edit Dimension from dimension list - Creating New Chart
  this.editDimensionField = function(dimensionName){
    this.editDimensionBtn.click();
    this.editDimensionFilterInput.sendKeys(dimensionName);
    this.editDimensionChkBox.get(0).click();
    this.addDimensionBtn.click();
  };

  //Select Chart Function - Creating New Chart
  this.selectChartFunction = function(){
    this.chartFunctionLabel.click();
    this.chartFunctionSelectList.get(2).click();
  };

  //Adding Chart Finally Dashboard
  this.updateChartOnDashboard = function(shouldAdd) {
    this.addDataToChartBtn.click();
    if(shouldAdd)
      this.createChartModalBtn.click();
    else
      this.cancelCreateChartModalBtn.click();
  };

  //Delete Added Chart on My Dashboard
  this.deleteNewChart = function(shouldDelete){
    //browser.sleep(2000);
    this.threeDotChartMenu.click();
    this.chartDropdownMenuItems.get(1).click();
    if(shouldDelete)
      this.confirmDelChartBtn.click();
    else
      this.cancelDelChartBtn.click();
  };

};

module.exports = MyDashboard;
