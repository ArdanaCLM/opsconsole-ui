// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// octable standard header, repeated element

var OCTable = function() {
  this.container = $$('.content-form.ng-scope:not(.ng-hide) octable').first();
  this.octable_std_header = this.container.$('octable .octable_std_header');
  this.standard_table = this.container.$('.octable table');
  this.tile_grid = this.container.$('.octable div#tile_grid');

  // above filter buttons
  this.globalActionsContainer = $('oct-global-actions-control');
  this.globalActionButtons = this.globalActionsContainer.$$('button');

  // under filter buttons
  this.multiRowActionsContainer = $('oct-multi-row-actions-control');
  this.mutliRowActionButtons = this.multiRowActionsContainer.$$('button');

  // table view selection
  this.viewControls = this.octable_std_header.$('oct-view-controls');

  this.listBtn = this.viewControls.$('.solid_table_btn');
  this.gridBtn = this.viewControls.$('.tile_table_btn');

  // should have 1 item if grid option is selected, 0 if not
  this.isGrid =  this.viewControls.$$('.tile_table_btn.selected');

  this.tableFilterContainer = this.octable_std_header.$('.enum_filter_wrapper');
  this.tableFilterInput = this.tableFilterContainer.$('.enum_filter_input');

  this.tableFilterItems = this.tableFilterInput
    .$$('button[ng-repeat="filter in enumFilters"]');
  this.tableFilterItemClearBtns = this.tableFilterItems
    .$$('span.ardana-icon-Close');
  this.tableFilterItemTextSpans = this.tableFilterInput.$$('span.ng-binding');

  this.rowCount = this.tableFilterContainer.$('.row_count');

  // the contents will change depending on which menu is open
  this.tableFilterDropdownContainers = this.tableFilterContainer
    .$$('.enum_filter_menu_container.open');

  this.tableFilterDropdown = this.tableFilterContainer
    .$('.enum_filter_menu_container.open');

  this.tableFilterDropdownList = this.tableFilterDropdown
    .$$('.enumFilterSelection');
  this.tableFilterDropdownInput = this.tableFilterDropdown
    .$$('#enum_text_filter_input').filter(function(elem, index) {
      return elem.isDisplayed();
    }).first();

  /* standard_table elements */
  this.tableHeader = this.standard_table.$('thead tr');

  this.tableRows = this.standard_table.$$('tbody tr[ng-repeat-start]');
  this.tableRowCheckBoxes = this.tableRows.$$('td.selectRow');

  /* tile_grid elements */
  this.gridTiles = this.tile_grid.$$('div[ng-repeat]');

  /* table controls */
  this.tableControls = this.container.$('.table-page-controls');
  this.firstPageBtn = this.tableControls.$('.pagebtn.first');
  this.prevPageBtn = this.tableControls.$('.pagebtn.prev');
  this.nextPageBtn = this.tableControls.$('.pagebtn.next');
  this.lastPageBtn = this.tableControls.$('.pagebtn.last');

  // returns a count of all items in the table
  this.getItemCount = function() {
    var maxTablePage = this.tableControls.evaluate('tableConfig.pageConfig.maxPage');
    var pageSize = this.tableControls.evaluate('tableConfig.pageConfig.pageSize');
    if(maxTablePage.then(function(value){return value > 1;})){
      this.lastPageBtn.click();
      var finalRowCount = this.tableRows.count().then(function(lastPageCount) {
        return maxTablePage.then(function(maxTablePageValue) {
          return pageSize.then(function(pageSizeValue) {
            return ((--maxTablePageValue) * pageSizeValue) + lastPageCount;
          });
        });
      });
      this.firstPageBtn.click();
      return finalRowCount;
    } else {
      return this.tableRows.count();
    }
  };

  // returns the current page of the table
  this.getCurrentTablePage = function() {
    return this.tableControls.evaluate('tableConfig.pageConfig.page');
  };

  this.getMaxTablePage = function() {
    return this.tableControls.evaluate('tableConfig.pageConfig.maxPage');
  };

  // returns rowCount from the octable_std_header as a value
  this.getRowCountValue = function() {
    return this.rowCount.getText().then(function(text) {
      return +text.split(' ')[0];
    });
  };
};

module.exports = OCTable;
