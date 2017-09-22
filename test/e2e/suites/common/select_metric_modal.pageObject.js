// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// select metric modal depends on the stackable_modal pageObject
var StackableModal = require('./stackable_modal.pageObject.js');

var SelectMetricModal = function() {
  this.stackable_modal = new StackableModal();
  this.base_modal = this.stackable_modal.top_modal;

  this.heading = this.base_modal.$('h2.oc-heading');
  this.filter_heading = this.base_modal.$('h3.oc-heading');

  this.enum_filter = this.base_modal.$('.enum_filter_wrapper.metric-selector');
  this.enum_filter_input = this.enum_filter.element(by.model('metricFilter'));
  this.enum_filter_clear = this.enum_filter.$('.enum_filter_clear');

  this.metric_header = this.base_modal.$('.metric-header');
  this.metric_item_list = this.base_modal
    .$$('oc-radio[name="metricPicker"]');
};

module.exports = SelectMetricModal;
