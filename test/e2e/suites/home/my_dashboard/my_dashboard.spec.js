// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// Specs for the My Dashboard page at: /#/alarm/dashboard

var MyDashboard = require('./my_dashboard.pageObject.js');

describe('my dashboard', function() {

  var myDashboard = new MyDashboard();

  beforeAll(function() {
    myDashboard.get();
  });

  it('should have the correct url', function() {
    expect(browser.getCurrentUrl())
      .toBe(browser.baseUrl + '/#/alarm/dashboard');
  });

  it('should have the correct title', function() {
    expect(browser.getTitle()).toEqual('My Dashboard');
  });

  describe('tabs',function(){

    it('should be creatable',function(){
      myDashboard.createNewTab('My card',true);
      //Check if new tab was added successfully
      expect(myDashboard.navTabList.last().getText()).toEqual('My Card'.toUpperCase());
     });

    it('should be editable', function(){
      myDashboard.navTabList.last().click();
      var flag = myDashboard.editDashboardTabName('Edited Tab Name',true);
      if(flag)
        expect(myDashboard.navTabList.last().getText()).toEqual('Edited Tab Name'.toUpperCase());
     });

    it('should be deletable',function(){
      myDashboard.deleteNewTab(true);
      //Check if new tab was deleted successfully
      expect(myDashboard.navTabList.last().getText()).not.toEqual('Edited Tab Name');
     });
  });

  describe('widgets', function(){

    it('should be creatable', function(){
      //Adding new tab for testing tabs and widgets
      myDashboard.createNewTab('Testing widgets Charts',true);
      //Switching to the newly added tab
      myDashboard.navTabList.last().click();
      myDashboard.addNewWidget('Alarm - compute', true);
      //Check if new widget was added successfully
      expect(myDashboard.widgetTitle.getText()).toEqual('COMPUTE');
    });

    it('should be deletable', function(){
      myDashboard.deleteAddedWidget('true');
      //Check if new widget was deleted successfully
      expect(myDashboard.currentWidget.isPresent()).toBe(false);
      myDashboard.deleteNewTab(true);
    });
  });

  describe('chart', function(){
    describe('creation', function() {
      beforeAll(function() {
        myDashboard.createNewChartBtn.click();
      });

      it('should take a chart name', function() {
        myDashboard.addChartDefinition('My Chart');
        browser.executeScript(function() {
          // Chart Name Input
          return $('oc-input[name="inputName"] input[name="inputName"]').val();
        }).then(function(text) {
          expect(text).toEqual('My Chart');
        });
      });

      it('should select a metric', function() {
        myDashboard.selectMetricBtn.click();
        // simple filter to get many options
        myDashboard.metricFilterInput.sendKeys('st');
        myDashboard.metricFieldList.get(0).click();
        expect(myDashboard.metricPlaceholder.getText()).not.toEqual('');
      });

      it('should select a dimension', function() {
        myDashboard.editDimensionBtn.click();
        myDashboard.editDimensionFilterInput.sendKeys('control_plane');
        myDashboard.editDimensionChkBox.get(0).click();
        myDashboard.addDimensionBtn.click();
        expect(myDashboard.dimensionPlaceholder.isDisplayed()).toBe(true);
      });

      it('should select a chart function', function() {
        myDashboard.selectChartFunction();
        expect(myDashboard.chartFunctionPlaceholder.getText()).toEqual('SUM');
      });

      it('should add the chart to the dashboard', function() {
        myDashboard.createChartModalBtn.click();
        expect(myDashboard.chartTitle.getText()).toEqual('My Chart');
      });
    });

    it('should be deletable', function(){
      myDashboard.deleteNewChart(true);
      //Check if new chart was deleted successfully
      expect(myDashboard.currentChart.isPresent()).toBe(false);
      //Deleting tabs after testing tabs and widgets
      myDashboard.deleteNewTab(true);
    });
  });
});
