(function (ng) {
    'use strict';
    ng.module('operations-ui').controller('MastheadSettingsController', [
        '$scope',
        '$element',
        '$rootScope',
        'bllApiRequest',
        'logout',
        'clearForm',
        'addNotification',
        'authrequest',
        'isUndefined',
        'log',
        '$translate',
        'hideActiveMastheadPopover',
        function ($scope, $element, $rootScope, bllApiRequest, logout, clearForm, addNotification,
                  authrequest, isUndefined, log, $translate, hideActiveMastheadPopover) {

            $scope.loading = false;
            $scope.showPass = false;
            $scope.noProject = false;
            $scope.dataError = false;
            $scope.showAccountSettingsModalFlag = false;

            $scope.checkProject = function (user) {
                if(isUndefined(user)) {
                    return;
                }

                if (isUndefined(user.project_name) || user.project_name === "") {
                    $scope.noProject = true;
                }
            };

            $scope.getUserData = function() {
                $scope.loading = true;
                if (!$rootScope.current_user) {
                    bllApiRequest.get('user_group', {operation: 'users_list'}).then (
                        function (res) {
                            $rootScope.current_user = res.data.filter(function (item) {
                                return (angular.isDefined($rootScope.auth_token) &&
                                        item.username === $rootScope.user_name);
                            })[0];
                            $scope.user = angular.copy($rootScope.current_user);
                            $scope.checkProject($scope.user);
                            $scope.loading = false;
                        },
                        function (error) {
                            $scope.loading = false;
                            $scope.dataError = true;
                            log('error', 'Failed to retrieve user settings.');
                            log('error', 'error data = ' + JSON.stringify(error));
                            addNotification('error', $translate.instant('masthead.settings.error.retrieveuser'));
                        }
                    );
                } else {
                    $scope.user = angular.copy($rootScope.current_user);
                    $scope.checkProject($scope.user);
                    $scope.loading = false;
                }
            };

            $scope.logout = logout;

            $scope.toggleShowPass = function(){
                $scope.showPass = !$scope.showPass;
            };

            $scope.update = function (form) {
                $scope.showOverlay = true;

                var data = {
                    operation: 'user_update',
                    user_id: $scope.user.user_id,
                    project_name: $scope.user.project_name
                };

                //login name is different from form's username
                if($rootScope.user_name !== $scope.user.username &&
                    $scope.user.username.length > 0) {
                  data.username = $scope.user.username;
                }

                data.email = $scope.user.email;

                //password has been updated
                if(angular.isDefined($scope.user.password) &&
                   $scope.user.password.length > 0) {
                  data.password = $scope.user.password;
                }

                var reset = function(resp_data, error) {

                    //username was updated - logout
                    if(!error && angular.isDefined(data.username) && data.username.length > 0){
                        logout();
                    }

                    //password was updated - get token again
                    if(!error && angular.isDefined(data.password) && data.password.length > 0){
                        authrequest($scope.user.username, data.password);
                    }

                    $scope.showOverlay = false;

                    clearForm(form);
                    $rootScope.current_user = $scope.user = undefined;
                    $scope.cancelAccountSettingsModal();
                    if(angular.isDefined($scope.accountSettingsModal)) {
                        $scope.accountSettingsModal.closeModal();
                    }
                };

                bllApiRequest.get('user_group', data).then(
                    reset,
                    function(error) {
                        reset(data, true);
                        log('error', 'Failed to update user settings.');
                        log('error', 'error data = ' + JSON.stringify(error));
                        addNotification('error', $translate.instant('masthead.settings.error.updateuser'));
                    }
                );
            }; //end of $scope.update

            $scope.showAccountSettingsModal = function() {
                //get fresh data
                if (!$scope.loading) {
                    $scope.getUserData();
                }
                $scope.showAccountSettingsModalFlag = true;
            };

            $scope.cancelAccountSettingsModal = function(settings_form) {
                //clean the form
                if(angular.isDefined(settings_form)) {
                    settings_form.$setPristine();
                }
                $scope.user = angular.copy($rootScope.current_user);
                $scope.showAccountSettingsModalFlag = false;
                hideActiveMastheadPopover();
            };

            $scope.$on('accountPopOpen', function() {
                //populate with original data when open again
                //don't do it when it is loading to avoid initial double loading
                if (!$scope.loading) {
                    $scope.getUserData();
                }
            });
        }]
    );
})(angular);
