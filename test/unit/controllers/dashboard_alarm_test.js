// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// needs new test to handle alarm count vs alarm list in dashboard
/*'use strict';
describe('plugins', function(){
    describe('plugins.DashboardControllerAlarms', function(){
        var controller,
            targetController,
            rootScope,
            scope,
            q,
            translate,
            bllApiRequest,
            selectedData;
        beforeEach(module('helpers'));
        beforeEach(module('operations-ui'));

        beforeEach(module('plugins', function($provide){
            bllApiRequest = {
                get: function(){
                    var deferred = q.defer();
                    deferred.resolve({
                        data: [{
                            'state': 'OK',
                            'alarm_definition': {'name': 'test', 'id': '56789'},
                            'state_updated_timestamp': '2015-09-29T18:27:33.000Z',
                            'lifecycle_state': 'OPEN',
                            'alarm_definition.severity': 'ALARM',
                            'link': 'comment',
                            'id': '1234567',
                            'metrics': [{'name': 'test'}]
                        }]
                    });
                    return deferred.promise;
                },
                post: function(){
                    var deferred = q.defer();
                    deferred.resolve({
                        data: {}
                    });
                    return deferred.promise;
                }
            };
            selectedData = [{
                'state': 'OK',
                'alarm_definition': {'name': 'test', 'id': '56789'},
                'state_updated_timestamp': '2015-09-29T18:27:33.000Z',
                'lifecycle_state': 'OPEN',
                'alarm_definition.severity': 'ALARM',
                'link': 'comment',
                'id': '1234567',
                'metrics': [{'name': 'test'}]
            }];
            $provide.value('bllApiRequest', bllApiRequest);
            $provide.value('selectedData', selectedData);
        }))

        beforeEach(inject(function(_$controller_, _$rootScope_, _$q_, _$translate_){
            q = _$q_;
            controller = _$controller_;
            rootScope = _$rootScope_;
            scope = _$rootScope_.$new();
            translate = _$translate_;
            targetController = controller('DashboardControllerAlarms', {
                $scope: scope
            });
        }));


        it('should be available', function () {
            expect(targetController).toBeDefined();
            expect(scope).toBeDefined();
        });

        it('should load alarms', function(){
            scope = rootScope.$new();

            spyOn(translate, 'instant').and.callFake(function(data){
                return data;
            });

            targetController = controller('DashboardControllerAlarms', {
                $scope: scope
            });
            spyOn(bllApiRequest, 'get').and.callThrough();
            scope.getAlarmTableData(['all'],'test');
            expect(bllApiRequest.get).toHaveBeenCalled();

        });

        it('should post an alarm condition', function(){
            scope = rootScope.$new();
            spyOn(translate, 'instant').and.callFake(function(data){
                return data;
            });

            targetController = controller('DashboardControllerAlarms', {
                $scope: scope
            });
            scope.selectedData = selectedData;
            spyOn(bllApiRequest, 'post').and.callThrough();
            scope.setCndtnBtn();
            expect(bllApiRequest.post).toHaveBeenCalled();

        });

        it('Post Open Condition', function(){
            scope = rootScope.$new();
            targetController = controller('AlarmExplorerController', {
                $scope: scope
            });
            scope.selectedData = selectedData;
            spyOn(bllApiRequest, 'post').and.callThrough();
            scope.commitSetOpenCondition('OPEN');
            expect(bllApiRequest.post).toHaveBeenCalled();

        });

        it('Post Acknowledged Condition', function(){
            scope = rootScope.$new();
            targetController = controller('AlarmExplorerController', {
                $scope: scope
            });
            scope.selectedData = selectedData;
            spyOn(bllApiRequest, 'post').and.callThrough();
            scope.commitSetAckCondition('ACKNOWLEDGED');
            expect(scope.alarmSummaryModalOverlayFlag).toBeTruthy();
            expect(bllApiRequest.post).toHaveBeenCalled();

        });

        it('Post Resolved Condition', function(){
            scope = rootScope.$new();
            targetController = controller('AlarmExplorerController', {
                $scope: scope
            });
            scope.selectedData = selectedData;
            spyOn(bllApiRequest, 'post').and.callThrough();
            scope.commitSetResolvedCondition('RESOVLED');
            expect(scope.alarmSummaryModalOverlayFlag).toBeTruthy();
            expect(bllApiRequest.post).toHaveBeenCalled();

        });

        it('Update Comments', function(){
            scope = rootScope.$new();
            targetController = controller('AlarmExplorerController', {
                $scope: scope
            });
            scope.selectedData = selectedData;
            spyOn(bllApiRequest, 'post').and.callThrough();
            scope.commitUpdateComment('id');
            expect(scope.alarmSummaryModalOverlayFlag).toBeTruthy();
            expect(bllApiRequest.post).toHaveBeenCalled();

        });

    });
});
*/
