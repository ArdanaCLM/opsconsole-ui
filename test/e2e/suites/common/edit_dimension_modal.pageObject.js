// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// edit dimension modal depends on stackable_modal pageObject

var StackableModal = require('./stackable_modal.pageObject.js');

var EditDimensionModal = function() {
  this.stackable_modal = new StackableModal();
  this.base_modal = this.stackable_modal.top_modal;

  this.heading = this.base_modal.$('h2.oc-heading');
  this.filter_heading = this.base_modal.$('h3.oc-heading');

  this.add_dimension_button = this.base_modal.$('h3 button');

  this.enum_filter = this.base_modal.$('.enum_filter_wrapper.metric-selector');
  this.enum_filter_input = this.enum_filter.element(by.model('dimensionFilter'));
  this.enum_filter_clear = this.enum_filter.$('.enum_filter_clear');

  this.dimension_header_list = this.base_modal.$$('.dimension-header');
  this.dimension_item_list = this.base_modal.$$('.metric-picker-item');
};

module.exports = EditDimensionModal;
