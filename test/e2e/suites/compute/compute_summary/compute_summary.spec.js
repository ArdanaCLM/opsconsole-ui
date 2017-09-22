// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// Specs for the Compute Summary page at: /#/compute/compute_alarm_summary

var ComputeSummary = require('./compute_summary.pageObject.js');
var LatestAlarmsBox = require('../../common/latest_alarms_box.pageObject.js');
var OCTable = require('../../common/octable.pageObject.js');
var CreateAlarmDefinitionModal = require('../../common/create_alarm_definition_modal.pageObject.js');
var SelectMetricModal = require('../../common/select_metric_modal.pageObject.js');
var EditDimensionModal = require('../../common/edit_dimension_modal.pageObject.js');
var EditMatchbyModal = require('../../common/edit_matchby_modal.pageObject.js');

describe('compute summary', function() {

  var computeSummary = new ComputeSummary();
  var latestAlarms = new LatestAlarmsBox();
  var ocTable = new OCTable();
  var createAlarmDefModal = new CreateAlarmDefinitionModal();
  var selectMetricModal = new SelectMetricModal();
  var editDimensionModal = new EditDimensionModal();
  var editMatchbyModal = new EditMatchbyModal();

  beforeAll(function() {
    computeSummary.get();
  });

  it('should have the correct url', function() {
    expect(browser.getCurrentUrl())
      .toBe(browser.baseUrl + '/#/compute/compute_alarm_summary');
  });

  describe('on initial load', function() {
    it('should have a browser title', function() {
      expect(browser.getTitle()).toEqual('Compute Summary');
    });

    it('should have a module title', function() {
      expect(computeSummary.pageTitle.getText()).toEqual('Compute Summary');
    });

    if (browser.params.env === 'stdcfg') {
      it('should have correct stdcfg tabs', function() {
        expect(computeSummary.navTabList.get(2).getText())
          .toEqual('Alarm Summary');
        expect(computeSummary.navTabList.get(0).getText())
          .toEqual('Inventory Summary');
        expect(computeSummary.navTabList.get(1).getText())
          .toEqual('Capacity Summary');
      });

      it('should have the correct stdcfg tab selected', function() {
        expect(computeSummary.selectedTab.getText())
          .toEqual('Inventory Summary');
      });
    } else if(browser.params.env === 'legacy') {
      it('should have the correct legacy tabs', function() {
        expect(computeSummary.navTabList.get(0).getText())
          .toEqual('Compute Summary');
        expect(computeSummary.navTabList.get(1).getText())
          .toEqual('Alarm Summary');
      });

      it('should have the correct legacy tab selected', function() {
        expect(computeSummary.selectedTab.getText()).toEqual('Compute Summary');
      });
    }
  });

  describe('alarm summary tab', function() {
    beforeAll(function() {
      computeSummary.getNavTab('Alarm Summary').click();
    });

    it('should be the selected tab', function() {
      expect(computeSummary.selectedTab.getText()).toEqual('Alarm Summary');
    });

    it('should show the correct tab', function() {
      expect(computeSummary.alarmContainer.isDisplayed()).toBe(true);
    });

    describe('latest alarm box', function() {
      it('should be displayed when the Alarm Summary tab is selected', function() {
        expect(latestAlarms.newAlarmContainer.isDisplayed()).toBe(true);
      });

      describe('config dropdown', function() {
        beforeAll(function() {
          latestAlarms.configBtn.click();
        });

        afterAll(function() {
          latestAlarms.configBtn.click();
        });

        it('should show when the config button is pressed', function() {
          expect(latestAlarms.configDropdown.isDisplayed()).toBe(true);
        });

        it('should show when the config icon is pressed', function() {
          expect(latestAlarms.configDropdown.isDisplayed()).toBe(true);
          latestAlarms.configIcon.click();
          expect(latestAlarms.configDropdown.isDisplayed()).toBe(false);
          latestAlarms.configIcon.click();
          expect(latestAlarms.configDropdown.isDisplayed()).toBe(true);
        });

        it('should open and close when it is selected', function() {
          latestAlarms.configDropdown.click();
          expect(latestAlarms.configDropdown.$$('.oc-select-list.list-shown').count()).toEqual(1);

          latestAlarms.configDropdown.click();
          expect(latestAlarms.configDropdown.$$('.oc-select-list.list-shown').count()).toEqual(0);
        });

        it('should close when an option is selected', function() {
          latestAlarms.configDropdown.click();
          expect(latestAlarms.configDropdown.$$('.oc-select-list.list-shown').count()).toEqual(1);

          latestAlarms.configDropdownList.get(0).click();
          expect(latestAlarms.configDropdown.$$('.oc-select-list.list-shown').count()).toEqual(0);
        });

        it('should change the placeholder when a new option is selected', function() {
          latestAlarms.select_config_option(0);

          var old_placeholder = latestAlarms.configDropdownPlaceholder.getText();

          // select last item
          latestAlarms.select_config_option(
            latestAlarms.configDropdownList.then(
              function(array) { return array.length - 1; }
            )
          );

          expect(latestAlarms.configDropdownPlaceholder.getText()).not.toEqual(old_placeholder);

          latestAlarms.select_config_option(0);
        });
      });

      it('should filter the octable when the new critical alarm button is selected', function() {
        // returns the text of the new critical alarm button as a value
        var criticalAlarms = latestAlarms.criticalValue.getText()
          .then(function(text) { return +text; });

        latestAlarms.criticalBox.click();
        expect(ocTable.getItemCount()).toEqual(criticalAlarms);
        latestAlarms.criticalBox.click();
        expect(ocTable.getItemCount()).toEqual(ocTable.getRowCountValue());
      });

      it('should filter the octable when the new warning alarm button is selected', function() {
        // returns the text of the new warning alarm button as a value
        var warningAlarms = latestAlarms.warningValue.getText()
          .then(function(text) { return +text; });

        latestAlarms.warningBox.click();
        expect(ocTable.getItemCount()).toEqual(warningAlarms);
        latestAlarms.warningBox.click();
        expect(ocTable.getItemCount()).toEqual(ocTable.getRowCountValue());
      });

      it('should filter the octable when the new unknown alarm button is selected', function() {
        // returns the text of the new unknown alarm button as a value
        var unknownAlarms = latestAlarms.unknownValue.getText()
          .then(function(text) { return +text; });

        latestAlarms.unknownBox.click();
        expect(ocTable.getItemCount()).toEqual(unknownAlarms);
        latestAlarms.unknownBox.click();
        expect(ocTable.getItemCount()).toEqual(ocTable.getRowCountValue());
      });

      it('should filter the octable when the new total alarm button is selected', function() {
        // returns the text of the new total alarm button as a value
        var totalAlarms = latestAlarms.totalValue.getText()
          .then(function(text) { return +text; });

        latestAlarms.totalBox.click();
        expect(ocTable.getItemCount()).toEqual(totalAlarms);
        latestAlarms.totalBox.click();
        expect(ocTable.getItemCount()).toEqual(ocTable.getRowCountValue());
      });
    });

    describe('filter', function() {
      beforeEach(function() {
        ocTable.tableFilterContainer.click();
      });

      afterEach(function() {
        ocTable.tableFilterItems.click();
      });

      it('should display an options menu when clicked', function() {
        expect(ocTable.tableFilterDropdownContainers.count()).toBe(1);
        ocTable.tableFilterContainer.click();
      });

      it('should filter by dimension', function() {
        ocTable.tableFilterDropdownList.get(0).click();
        ocTable.tableFilterDropdownInput
          .sendKeys('service=compute' + protractor.Key.ENTER);

        computeSummary.thAlarm.click();

        // filtered row count should equal total rows
        expect(computeSummary.testFirstTablePageRows(
          computeSummary.filterDimension('service=compute')
        )).toEqual(true);

        computeSummary.thAlarm.click();

        expect(computeSummary.testFirstTablePageRows(
          computeSummary.filterDimension('service=compute')
        )).toEqual(true);

        // reset table sort
        computeSummary.thState.click();
      });

      it('should filter by state', function() {
        ocTable.tableFilterDropdownList.get(1).click();
        ocTable.tableFilterDropdownList.get(0).click();

        // filtered row count should equal total rows
        expect(computeSummary.testFirstTablePageRows(
          computeSummary.filterAlarmState('table_ok_status')
        )).toEqual(true);

        computeSummary.thState.click();

        expect(computeSummary.testFirstTablePageRows(
          computeSummary.filterAlarmState('table_ok_status')
        )).toEqual(true);

        computeSummary.thState.click();
      });

      it('should filter by service', function() {
        ocTable.tableFilterDropdownList.get(2).click();
        ocTable.tableFilterDropdownList.get(0).click();

        computeSummary.thAlarm.click();

        // filtered row count should equal total rows
        expect(computeSummary.testFirstTablePageRows(
          computeSummary.filterService('baremetal')
        )).toEqual(true);

        computeSummary.thAlarm.click();

        expect(computeSummary.testFirstTablePageRows(
          computeSummary.filterService('baremetal')
        )).toEqual(true);

        computeSummary.thState.click();
      });
    });
  });

  // stdcfg ONLY
  // these tests are placeholders until I figure out what to test here
  if(browser.params.env === 'stdcfg') {
    describe('inventory summary tab', function() {
      beforeAll(function() {
        computeSummary.getNavTab('Inventory Summary').click();
      });

      it('should be the selected tab', function() {
        expect(computeSummary.selectedTab.getText()).toEqual('Inventory Summary');
      });

      it('should be visible when the tab is selected', function() {
        expect(computeSummary.inventoryContainer.isDisplayed()).toBe(true);
      });

      // test elements in this tab
    });

    // whatever test begins here takes longer than the test timeout
    describe('capacity summary tab', function() {
      beforeAll(function() {
        computeSummary.getNavTab('CAPACITY SUMMARY').click();
      });

      // it('should be the selected tab', function() {
      //   expect(computeSummary.selectedTab.getText()).toEqual('CAPACITY SUMMARY');
      // });
      //
      // it('should be visible when the tab is selected', function() {
      //   expect(computeSummary.capacityContainer.isDisplayed()).toBe(true);
      // });

      // test elements in this tab
    });
  }

  // legacy ONLY
  if(browser.params.env === 'legacy') {
    describe('compute summary tab', function() {
      beforeAll(function() {
        computeSummary.getNavTab('Compute Summary').click();
      });

      it('should be the selected tab', function() {
        expect(computeSummary.selectedTab.getText()).toEqual('Compute Summary');
      });

      it('should be visible when the tab is selected', function() {
        expect(computeSummary.computeContainer.isDisplayed()).toBe(true);
      });

      // test elements in this tab
    });
  }
});
