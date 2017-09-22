// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// alarm definition creation modal built off of stackable modal pageObject
var StackableModal = require('./stackable_modal.pageObject.js');

var CreateAlarmDefinition = function() {
  stackableModal = new StackableModal();

  this.base_modal = stackableModal.top_modal;
  this.button_group = this.base_modal.$('.oc-btn-group').$$('button');
  this.cancel_button = this.button_group.first();
  this.create_button = this.button_group.last();
  this.update_button = this.button_group.get(1);

  // left form - Alarm Definition Details
  this.left_form = this.base_modal.$('.left-form');
  this.top_heading = this.left_form.$('h2.oc-heading');
  this.left_form_header = this.left_form.$('h3.oc-heading');
  //name section
  this.alarm_name_field = this.left_form.$('oc-input[value="definition.name"]');
  this.alarm_name_label = this.alarm_name_field.$$('.input-label').first();
  this.alarm_name = this.alarm_name_field.$('input[name ="inputName"]');
  //description section
  this.alarm_description_field = this.left_form.$('oc-input[value="definition.description"]');
  this.alarm_description_label = this.left_form.$$('.input-label').first();
  this.alarm_description = this.alarm_description_field.$('textarea[name="inputDescription"]');
  // right form - Alarm Expression
  this.right_form = this.base_modal.$('.right-form');
  this.right_form_header = this.right_form.$('h3.oc-heading');
  //Function Section
  this.alarm_function_field = this.right_form.$('oc-input[label="alarm_definitions.edit.modal.function"]');
  this.alarm_function_label = this.alarm_function_field.$$('.input-label').first();
  this.alarm_function_placeholder = this.alarm_function_field.$('.select-placeholder.active');
  this.alarm_function_select_list = this.alarm_function_field.$$('.oc-select-list div');
  //Metric Section
  this.alarm_metric_field = this.right_form.$('oc-input[label="alarm_definitions.edit.modal.metric"]');
  this.alarm_metric_label = this.alarm_metric_field.$$('.input-label').first();
  this.alarm_metric_value = this.alarm_metric_field.$('.button-value');
  this.alarm_metric_button = this.alarm_metric_field.$('button');
  //Relational Operator Section
  this.alarm_relational_operator_field = this.right_form.$('oc-input[label="alarm_definitions.edit.modal.operator"]');
  this.alarm_relational_operator_label = this.alarm_relational_operator_field.$$('.input-label').first();
  this.alarm_relational_operator_placeholder = this.alarm_relational_operator_field.$('.select-placeholder.active');
  this.alarm_relational_operator_select_list = this.alarm_relational_operator_field.$$('.oc-select-list div');
  //Value Section
  this.alarm_value_field = this.right_form.$('oc-input[value="definition.value"]');
  this.alarm_value_label = this.right_form.$$('.input-label').first();
  this.alarm_value = this.alarm_value_field.$('input[name="inputValue"]');
  //Dimension Section
  this.alarm_dimension_field = this.right_form.$('oc-input[type="dimension"]');
  this.alarm_dimension_label = this.alarm_dimension_field.$$('.input-label').first();
  this.alarm_dimension_button = this.alarm_dimension_field.$('button');
  this.alarm_dimension = this.alarm_dimension_field.$('.dimension-container');
  //MatchBy Section
  this.alarm_matchby_field = this.right_form.$('oc-input[type="matchby"]');
  this.alarm_matchby_label = this.alarm_matchby_field.$$('.input-label').first();
  this.alarm_matchby_button = this.alarm_matchby_field.$('button');
  this.alarm_matchby = this.alarm_matchby_field.$('.dimesion-container');
  // col-md-8 - Notifications and Severity
  this.col_md_8 = this.base_modal.$('.col-md-8');
  this.col_md_8_header = this.col_md_8.$('h3.oc-heading');
  this.alarm_nav_tabs = this.col_md_8.$('.nav.nav-tabs').$$('li');
  this.selected_alarm_nav_tab = this.col_md_8.$('.nav.nav-tabs').$$('li.selected').first();
  this.page_content = this.col_md_8.$$('.page-content .content-form:not(.ng-hide)').first();
  this.state_alarm_tab = this.alarm_nav_tabs.get(0);
  this.state_alarm_severity_field = this.page_content.$('oc-input[type="select"]');
  this.state_alarm_severity_label = this.state_alarm_severity_field.$$('.input-label').first();
  this.state_alarm_severity_placeholder = this.state_alarm_severity_field.$('.select-placeholder.active');
  this.state_alarm_severity_dropdown = this.state_alarm_severity_field.$$('.oc-select-list div');
  this.state_alarm_severity_options = this.state_alarm_severity_dropdown.$$('div[ng-repeat="option in selectOptions || internalSelectOptions"]');
  this.state_undetermined_tab = this.alarm_nav_tabs.get(1);
  this.state_ok_tab = this.alarm_nav_tabs.get(2);
  // functions on the visible tab
  this.state_notification_field = this.page_content.$('oc-input[type="multiselect"]');
  this.state_notification_label = this.state_notification_field.$$('.input-label').first();
  this.state_notification_list = this.state_notification_field.$$('.multiselect');
};

module.exports = CreateAlarmDefinition;
