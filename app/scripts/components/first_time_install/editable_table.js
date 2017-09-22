// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';

    /*

    <editable-table editable selectable edit-table-config="config" ng-model="imported.networks" drawer="modalDrawer"></editable-table>

        ng-model        - an object containing the data for this table, for example:

                            networks: {
                                columns: ["usage", "vlan", "dhcp", "cidr", "gateway"],
                                // these correspond to the columns and indicate whether or not the row values should be passed through translate
                                translate: [true, false, true, false, false],
                                rows: [
                                    {
                                        type: "mgmt_trunk_dcm",       // "mgmt_trunk_dcm" indicates that mgmt_trunk_dcm.html is the template to be used when editing this row
                                        usage: "common.dc_management",
                                        vlan: 1000,
                                        dhcp: false,
                                        cidr: "10.1.0.1/24",
                                        _hide: false               // if true, this row won't be visible
                                    },
                                    {
                                        type:...
                                    }
                                ]

        edit-table-config - an object describing the table layout, for example
                    table_config: {
                            item_name: "common.network", // this text goes on the buttons
                            active_column: 0,
                            headers: [
                                "common.usage_prompt",
                                "common.vlan_prompt",
                                "common.dhcp_prompt",
                                "common.cidr_prompt",
                                "common.gateway_prompt"
                            ]
                        }
        table-type - if specified, use a predefined table config (see below). Cannot be specified with edit-table-config.

        If the user choose "ok", then table-data._edited will be set to true.
        If the user "cancels", it will not be set.


     */
    ng.module('operations-ui').directive('editableTable', [
        '$translate',
        'getKeyFromScope',
        'isUndefined',
        'ocValidators',
        'genRandomString',
        function ($translate,
                  getKeyFromScope,
                  isUndefined,
                  ocValidators,
                  genRandomString) {
            return {
                restrict: "E",
                templateUrl: "components/first_time_install/editable_table.html",
                require: "ngModel",
                scope: {
                    "modalDrawer": "=drawer",
                    "editTableConfig": "=",
                    "customValidator": "=",
                    "validity": "=?"
                },
                link: function (scope, element, attributes, ngModel) {
                    ngModel.$render = function() {
                        scope.tableData = this.$viewValue;
                        //save original data for ip_range
                        if (!angular.isUndefined(scope.tableConfig) &&
                            scope.tableConfig.item_name === "common.ip_range") {
                            if (!angular.isUndefined(scope.$parent.$parent.$parent) &&
                                !angular.isUndefined(scope.$parent.$parent.$parent.this_data) &&
                                !angular.isUndefined(scope.$parent.$parent.$parent.this_data.original_ip_ranges)) {

                                //get the original data from controller for example system_summary_controller
                                //need this to avoid removing the original ip ranges
                                scope.origin_ip_ranges =
                                    scope.$parent.$parent.$parent.this_data.original_ip_ranges.map(
                                        function (range) {
                                            return range.ip_range;
                                        }
                                );
                            }
                        }

                        //listen to the drawer cancel event so ip_range table and route table can clean itself
                        if (scope.tableConfig &&
                            (scope.tableConfig.item_name === "common.ip_range" ||
                             scope.tableConfig.item_name === "common.route")){
                            scope.$on('drawerCanceled', scope.resetForm);
                        }
                    };

                    var watcher = function() {
                      scope.tableData = ngModel.$modelValue ? ngModel.$modelValue : ngModel.$viewValue;
                      scope.validity = ngModel.$valid;
                    };

                    scope.$watch(ngModel, watcher);

                     //forced to update data
                    scope.$on('editableTableDataChange', watcher);

                    var configs;
                    if (!angular.isUndefined(scope.editTableConfig)) {
                        scope.tableConfig = scope.editTableConfig;
                    } else {

                        // predefined tables

                        configs = {
                            route: {
                                item_name: "common.route",
                                active_column: 0,
                                headers: [
                                    "common.destination",
                                    "common.next_hop"
                                ],
                                column_types: [
                                    "string",
                                    "string"
                                ],
                                column_placeholders: [
                                    "a.b.c.d/n",
                                    "a.b.c.d"
                                ],
                                column_patterns: [
                                    ocValidators.cidr,
                                    ocValidators.ipAddress
                                ],
                                column_errors: [
                                  "ocvalidate.cidr",
                                  "ocvalidate.ipAddress"
                                ]
                            },
                            ip_range: {
                                item_name: "common.ip_range",
                                active_column: 0,
                                headers: ["common.ip_range"],
                                column_types: ["string"],
                                column_placeholders: ['a.b.c.d-e.f.g.h or a.b.c.d or a.b.c.d,a.b.c.e'],
                                column_patterns: [ocValidators.ipRange],
                                column_errors: ["ocvalidate.ipRange"]
                            }
                        };


                        if (attributes.tableType) {
                            scope.tableConfig = configs[attributes.tableType];
                        }
                    }

                    if(scope.customValidator && typeof scope.customValidator === "function") {
                      ngModel.$validators['customEditableTableValidator' + genRandomString(5)] = function() {
                        scope.validity = scope.customValidator.apply(undefined, arguments);
                        return scope.validity;
                      };
                    }

                    scope.drawer = !angular.isUndefined(scope.modalDrawer);

                    scope.sort = {
                        column: scope.tableConfig.active_column,
                        desc: true
                    };

                    scope.button_translation = {
                        item: ""
                    };

                    scope.calcHeaderWidth = function() {
                      var headers = scope.tableConfig.headers;
                      return Math.floor(100/headers.length);
                    };

                    var itemName = attributes.itemName ? attributes.itemName : scope.tableConfig.item_name;
                    $translate(itemName).then(function (translation) {
                        scope.button_translation.item = translation;
                    });
                    //if read_only defined...will not add prefix (for example Edit) for the button
                    //use whatever the translated item_name in the table config
                    scope.read_only =
                        !isUndefined(scope.tableConfig.read_only) ? scope.tableConfig.read_only : false ;

                    //setup headings

                    scope.headings_selected = scope.tableConfig.headers.map(function () {
                        return false;
                    });
                    scope.headings_selected[scope.tableConfig.active_column] = true;

                    scope.typeof = function (item) {
                        return typeof item;
                    };

                    scope.editable = !isUndefined(attributes.editable);
                    scope.selectable = !isUndefined(attributes.selectable);
                    scope.disableable = !isUndefined(attributes.disableable);

                    var makeAllFalse = function (array) {
                        for (var ii = 0; ii < array.length; ii++) {
                            array[ii] = false;
                        }
                    };

                    scope.selectRow = function ($index) {
                        if (scope.drawer) {

                            var dd = new Date();
                            var dbl_click = dd.getTime() - scope.last_click_time < 500;
                            if (dbl_click) {
                                // unselect any text that the browser selected on the double-click
                                window.getSelection().removeAllRanges();

                                makeAllFalse(scope.row_selected);
                                scope.row_selected[$index] = true;
                                scope.row_not_selected = false;
                                scope.editWithDrawer($index);
                                return;
                            }
                            scope.last_click_time = dd.getTime();
                        }
                        if (scope.getSelectedItem() === $index) {
                            makeAllFalse(scope.row_selected);
                            scope.row_not_selected = true;
                        } else if (scope.selectable) {
                            makeAllFalse(scope.row_selected);
                            scope.row_selected[$index] = true;
                            scope.row_not_selected = false;

                            //assumption here is the original ip ranges will be at the first section of
                            //the ip range table, so check if the selected index is within the range of
                            //origin_ip_ranges
                            if (!angular.isUndefined(scope.tableConfig) &&
                                scope.tableConfig.item_name === "common.ip_range") {
                                if (!angular.isUndefined(scope.origin_ip_ranges)) {
                                    var len = scope.origin_ip_ranges.length;
                                    if ($index >= 0 && $index < len) {
                                        scope.ip_range_delete_disabled = true;
                                    }
                                    else {
                                        scope.ip_range_delete_disabled = false;
                                    }
                                }
                            }
                        }
                    };

                    scope.selectRoleRow = function (row, $index) {
                        // A different function apart from selectrow to access the virtual machine name in the row.data
                        if (scope.drawer) {

                            var dd = new Date();
                            var dbl_click = dd.getTime() - scope.last_click_time < 500;
                            if (dbl_click) {
                                // unselect any text that the browser selected on the double-click
                                window.getSelection().removeAllRanges();

                                makeAllFalse(scope.row_selected);
                                scope.row_selected[$index] = true;
                                scope.row_not_selected = false;
                                scope.editRoleWithDrawer(row, $index);
                                return;
                            }
                            scope.last_click_time = dd.getTime();
                        }
                        if (scope.getSelectedItem() === $index) {
                            makeAllFalse(scope.row_selected);
                            scope.row_not_selected = true;
                        } else if (scope.selectable) {
                            makeAllFalse(scope.row_selected);
                            scope.row_selected[$index] = true;
                            scope.row_not_selected = false;
                        }
                    };

                    scope.selectColumn = function ($index) {
                        makeAllFalse(scope.headings_selected);
                        scope.headings_selected[$index] = true;
                    };

                    scope.addItem = function () {
                        scope.current_model = {};
                        scope.editing = true;
                        scope.newItem = true;
                    };

                    scope.resetForm = function () {
                        scope.editing = false;
                        scope.deleting = false;
                        scope.newItem = false;
                        scope.row_not_selected = true;
                        scope.last_click_time = 0;
                        scope.current_model_index = undefined;
                        scope.current_model = undefined;
                        if (angular.isObject(scope.tableData) && angular.isArray(scope.tableData.rows)) {
                            scope.row_selected = scope.tableData.rows.map(function () {
                                return false;
                            });
                        } else {
                            scope.row_selected = [];
                        }

                        if (scope.newEntry) {
                            scope.newEntry.$setPristine();
                        }
                    };

                    scope.getSelectedItem = function () {
                        for (var ii = 0; ii < scope.tableData.rows.length; ii++) {
                            if (scope.row_selected[ii]) {
                                return ii;
                            }
                        }
                        return undefined;
                    };

                    scope.editItem = function (itemIndex) {
                        scope.current_model = ng.copy(scope.tableData.rows[itemIndex]);
                        scope.current_model_index = itemIndex;
                        scope.editing = true;
                    };

                    scope.deleteItem = function (itemIndex) {
                        scope.current_model = scope.tableData.rows[itemIndex];
                        scope.current_model_index = itemIndex;
                        scope.deleting = true;
                        scope.editing = true;
                    };

                    scope.commitItem = function () {
                        scope.tableData.rows.push(scope.current_model);
                        scope.row_selected.push(false);
                        scope.resetForm();
                        ngModel.$setViewValue(angular.copy(scope.tableData));
                    };

                    scope.commitChanges = function () {
                        scope.tableData.rows[scope.current_model_index] = scope.current_model;
                        scope.row_selected[scope.current_model_index] = false;
                        scope.resetForm();
                        ngModel.$setViewValue(angular.copy(scope.tableData));
                    };

                    scope.commitDelete = function () {
                        scope.tableData.rows.splice(scope.current_model_index, 1);
                        scope.row_selected.splice(scope.current_model_index, 1);
                        scope.resetForm();
                        ngModel.$setViewValue(angular.copy(scope.tableData));
                    };

                    scope.editWithDrawer = function (itemIndex) {
                        var current_item = scope.tableData.rows[itemIndex];
                        var read_only_row =
                            !isUndefined(current_item.read_only) ? current_item.read_only : false;
                        var editTemplate = 'components/first_time_install/drawer/' + current_item.type + '.html';
                        var editCommitAction;
                        var editTitleKey;

                        if(!isUndefined(scope.tableConfig)) {
                            if (!isUndefined(scope.tableConfig.editTemplateUrl)) {
                                editTemplate = scope.tableConfig.editTemplateUrl;
                            }
                            if (!isUndefined(scope.tableConfig.editTemplatePath)) {
                                editTemplate = scope.tableConfig.editTemplatePath + current_item.type + '.html';
                            }
                            if (!isUndefined(scope.tableConfig.editCommitAction)) {
                                editCommitAction = scope.tableConfig.editCommitAction;
                            }
                            if (!isUndefined(scope.tableConfig.editTitleKey)) {
                                editTitleKey = scope.tableConfig.editTitleKey;
                            }
                        }

                        var drawConf = {
                            template: editTemplate,
                            //copy the data so its not a live edit of the model, (in case the user cancels)
                            data: angular.copy(current_item),
                            cancel: "common.cancel",
                            commit: $translate.instant("common.update_item", scope.button_translation),
                            selectedItemIndex: itemIndex, //for one row change update
                            read_only: read_only_row
                        };

                        // use "Close" button instead of "Cancel" when row is read-only
                        if (read_only_row) {
                            drawConf.cancel = "common.close";
                        }

                        //add the edit commitaction if it is available from tableConfig into drawConf
                        if (!angular.isUndefined(editCommitAction)){
                            drawConf.commitaction = editCommitAction;
                        }
                        //add the edit titleKey if it is available from tableConfig into drawConf
                        if (!angular.isUndefined(editTitleKey)){
                            drawConf.titleKey = editTitleKey;
                        }

                        scope.modalDrawer.show(drawConf).
                            then(function(data) {
                            // all done - mark the data as edited a put the updated data in the row
                            data._edited = true;
                            scope.tableData.rows[itemIndex] = data;
                            ngModel.$setViewValue(angular.copy(scope.tableData));
                        });
                    };

                    scope.editRoleWithDrawer = function (row, itemIndex) {
                        var current_item = row;
                        var read_only_row =
                            !isUndefined(current_item.read_only) ? current_item.read_only : false;
                        var editTemplate = 'components/first_time_install/drawer/' + current_item.type + '.html';
                        var editCommitAction;
                        var editTitleKey;

                        if(!isUndefined(scope.tableConfig)) {
                            if (!isUndefined(scope.tableConfig.editTemplateUrl)) {
                                editTemplate = scope.tableConfig.editTemplateUrl;
                            }
                            if (!isUndefined(scope.tableConfig.editTemplatePath)) {
                                editTemplate = scope.tableConfig.editTemplatePath + current_item.type + '.html';
                            }
                            if (!isUndefined(scope.tableConfig.editCommitAction)) {
                                editCommitAction = scope.tableConfig.editCommitAction;
                            }
                            if (!isUndefined(scope.tableConfig.editTitleKey)) {
                                editTitleKey = scope.tableConfig.editTitleKey;
                            }
                        }

                        var drawConf = {
                            template: editTemplate,
                            //copy the data so its not a live edit of the model, (in case the user cancels)
                            data: angular.copy(current_item),
                            cancel: "common.cancel",
                            commit: $translate.instant("common.update_item", scope.button_translation),
                            selectedItemIndex: itemIndex, //for one row change update
                            read_only: read_only_row
                        };

                        //add the edit commitaction if it is available from tableConfig into drawConf
                        if (!angular.isUndefined(editCommitAction)){
                            drawConf.commitaction = editCommitAction;
                        }
                        //add the edit titleKey if it is available from tableConfig into drawConf
                        if (!angular.isUndefined(editTitleKey)){
                            drawConf.titleKey = editTitleKey;
                        }

                        scope.modalDrawer.show(drawConf).
                            then(function(data) {
                            // all done - mark the data as edited a put the updated data in the row
                            data._edited = true;
                            scope.tableData.rows[itemIndex] = data;
                        });
                    };

                    scope.disableWithDrawer = function (itemIndex) {
                        var disableTemplate = 'components/first_time_install/drawer/disable_mt.html';

                        if(!angular.isUndefined(scope.tableConfig) &&
                            !angular.isUndefined(scope.tableConfig.disableTemplateUrl)){
                            disableTemplate = scope.tableConfig.disableTemplateUrl;
                        }

                        scope.modalDrawer.show({
                            template: disableTemplate,
                            //copy the data so its not a live edit of the model
                            data: angular.copy(scope.tableData.rows[itemIndex]),
                            cancel: "common.cancel",
                            commit: $translate.instant("common.disable_item", scope.button_translation)
                        }).then(function () {
                            scope.tableData.rows[itemIndex].disabled = true;
                            ngModel.$setViewValue(angular.copy(scope.tableData));
                        });
                    };

                    scope.resetForm();
                }
            };
    }]);

})(angular);
