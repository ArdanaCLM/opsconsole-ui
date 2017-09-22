// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(ng) {
    'use strict';

    ng.module('operations-ui').directive('ocnotification', [
        'isUndefined',
        '$rootScope',
        function(isUndefined, $rootScope) {
            return {
                restrict: 'E',
                templateUrl: 'components/notification.html',
                scope: {},
                link: function($scope, el, attrs) {
                    $rootScope.$watch('global_notification_message', function() {
                        $scope.message = $rootScope.global_notification_message;
                    });
                    $scope.remove = function() {
                        // remove current notification item from queue
                        if(!isUndefined($rootScope.global_notification) && $rootScope.global_notification.current_index < $rootScope.global_notification.message_queue.length) {
                            // remove the current indexed notification
                            if($rootScope.global_notification.message_queue.length >= 1 && $rootScope.global_notification.current_index <= $rootScope.global_notification.message_queue.length - 1 ) {
                                // remove current selected notification
                                $rootScope.global_notification.message_queue.splice($rootScope.global_notification.current_index, 1);

                                // update current index and message if list not empty
                                if($rootScope.global_notification.message_queue.length > 0) {
                                    if($rootScope.global_notification.current_index <= $rootScope.global_notification.message_queue.length - 1) {
                                        // keep current index and update the current message
                                        $rootScope.global_notification_message = $rootScope.global_notification.message_queue[$rootScope.global_notification.current_index];
                                    } else if($rootScope.global_notification.current_index == $rootScope.global_notification.message_queue.length -1) {
                                        // current index on last item so use that
                                        rootScope.notification_message = $rootScope.global_notification.message_queue[$rootScope.global_notification.current_index];
                                    } else {
                                        // use the last element
                                        $rootScope.global_notification.current_index = $rootScope.global_notification.message_queue.length - 1;
                                        $rootScope.global_notification_message = $rootScope.global_notification.message_queue[$rootScope.global_notification.current_index];
                                    }
                                } else {
                                    // remove references so notification block NOT displayed
                                    $rootScope.global_notification = null;
                                    $rootScope.global_notification_message = null;
                                }
                            }
                        }
                    };

                    // enable or disable left & right buttons
                    // disable buttons when there is only one notification in queue
                    var updateDirectionButtons = function(){
                        if(!isUndefined($rootScope.global_notification)) {
                            // 2 or more notification then left & right buttons enabled
                            if ($rootScope.global_notification.message_queue.length > 1) {
                                el.find('.toastbtn.prev').removeAttr('disabled');
                                el.find('.toastbtn.prev').removeClass('disabled');
                                el.find('.toastbtn.next').removeAttr('disabled');
                                el.find('.toastbtn.next').removeClass('disabled');
                            } else { // disable left and right buttons
                                el.find('.toastbtn.prev').attr('disabled', '');
                                el.find('.toastbtn.prev').addClass('disabled');
                                el.find('.toastbtn.next').attr('disabled', '');
                                el.find('.toastbtn.next').addClass('disabled');
                            }
                        }
                    };

                    // process a notification queue direction change event
                    // navigation wraps in circular queue
                    $scope.changeMessage = function(direction){
                        // only move when more than 1 notification in list
                        if(!isUndefined($rootScope.global_notification) && $rootScope.global_notification.message_queue.length > 1) {
                            var inc = 0;
                            if (direction === 'prev') {
                                inc = -1;
                            } else if (direction === 'next') {
                                inc = 1;
                            }

                            if($rootScope.global_notification.current_index + inc < 0) {
                                // before queue - wrap to last item
                                $rootScope.global_notification.current_index = $rootScope.global_notification.message_queue.length - 1;
                            } else if($rootScope.global_notification.current_index + inc > $rootScope.global_notification.message_queue.length - 1) {
                                // exceed queue - wrap item to first item
                                $rootScope.global_notification.current_index = 0;
                            } else {
                                // just move direction
                                $rootScope.global_notification.current_index += inc;
                            }
                            // copy current notification for display
                            $rootScope.global_notification_message = $rootScope.global_notification.message_queue[$rootScope.global_notification.current_index];
                        }
                    };

                    // watch for changes to queue to enable/disable the direction buttons
                    $rootScope.$watchCollection("notification", updateDirectionButtons);
                }
            };
        }]);
})(angular);
