// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
  'use strict';

  describe('Component: errorSpan', function () {
    var $compile, $scope, test_text = "This is Some text text!?><現在登録解除";

    beforeEach(module('pascalprecht.translate'));
    beforeEach(module('templates'));
    beforeEach(module('helpers'));

    beforeEach(inject(function(_$compile_, _$rootScope_) {
      $compile = _$compile_;
      $scope = _$rootScope_.$new();
      $scope.test_text = test_text;
    }));

    it('dependancies should be available', function () {
      expect($compile).toBeDefined();
      expect($scope).toBeDefined();
      expect(typeof $compile).toBe('function');
      expect(typeof $scope).toBe('object');
    });

    it('should compile', function() {
      var element = $compile('<error-span></error-span>')($scope);
      $scope.$digest();
      expect(element).toBeDefined();
      expect(element.children()).toBeDefined();
      expect(element.children().scope()).toBeDefined();
      expect(element.find('span').text()).toMatch(/\s/);
    });

    it('should display text', function() {
      var element = $compile('<error-span boolean-condition="{{false}}" text="{{test_text}}"></error-span>')($scope);
      $scope.$digest();
      expect(element).toBeDefined();
      expect(element.children()).toBeDefined();
      expect(element.children().scope()).toBeDefined();
      expect(element.children().scope().booleanCondition).toBe('false');
      expect(element.find('span.oc-validate-error')).toBeDefined();
      expect(element.find('span.oc-validate-error').text()).toBe(test_text);
    });

    it('should not display text', function() {
      var element = $compile('<error-span boolean-condition="{{true}}" text="{{test_text}}"></error-span>')($scope);
      $scope.$digest();
      expect(element).toBeDefined();
      expect(element.children()).toBeDefined();
      expect(element.children().scope()).toBeDefined();
      expect(element.children().scope().booleanCondition).toBe('true');
      expect(element.find('span.oc-validate-error').get(0)).not.toBeDefined();
    });

    it('should display text', function() {
      $scope.test_value = false;
      var element = $compile('<error-span boolean-condition="{{test_value}}" text="{{test_text}}"></error-span>')($scope);
      $scope.$digest();
      expect(element).toBeDefined();
      expect(element.children()).toBeDefined();
      expect(element.children().scope()).toBeDefined();
      expect(element.children().scope().booleanCondition).toBe('false');
      expect(element.find('span.oc-validate-error')).toBeDefined();
      expect(element.find('span.oc-validate-error').text()).toBe(test_text);
    });

    it('should not display text 1', function() {
      $scope.test_value = true;
      var element = $compile('<error-span boolean-condition="{{test_value}}" text="{{test_text}}"></error-span>')($scope);
      $scope.$digest();
      expect(element).toBeDefined();
      expect(element.children()).toBeDefined();
      expect(element.children().scope()).toBeDefined();
      expect(element.children().scope().booleanCondition).toBe('true');
      expect(element.find('span.oc-validate-error').get(0)).not.toBeDefined();
    });

    it('should not display text 2', function() {
      $scope.testForm = {
        $invalid: false,
        $dirty: true
      };
      var element = $compile('<error-span condition="testForm" text="{{test_text}}"></error-span>')($scope);
      $scope.$digest();
      expect(element).toBeDefined();
      expect(element.find('span.oc-validate-error').get(0)).not.toBeDefined();
    });

    it('should not display text 3', function() {
      $scope.testForm = {
        $invalid: true,
        $dirty: false
      };
      var element = $compile('<error-span condition="testForm" text="{{test_text}}"></error-span>')($scope);
      $scope.$digest();
      expect(element).toBeDefined();
      expect(element.find('span.oc-validate-error').get(0)).not.toBeDefined();
    });

    it('should display text 1', function() {
      $scope.testForm = {
        $invalid: true,
        $dirty: true
      };
      var element = $compile('<error-span condition="testForm" text="{{test_text}}"></error-span>')($scope);
      $scope.$digest();
      expect(element).toBeDefined();
      expect(element.find('span.oc-validate-error').get(0)).toBeDefined();
      expect(element.find('span.oc-validate-error').text()).toBe(test_text);
    });

    it('should not display text 4', function() {
      $scope.test_value1 = {
        $invalid: true,
        $dirty: false
      };
      var element = $compile('<error-span condition-map="{{\'test_value\' + 1}}" text="{{test_text}}"></error-span>')($scope);
      $scope.$digest();
      expect(element).toBeDefined();
      expect(element.find('span.oc-validate-error').get(0)).not.toBeDefined();
    });


    it('should not display text 5', function() {
      $scope.test_value1 = {
        $invalid: false,
        $dirty: true
      };
      var element = $compile('<error-span condition-map="{{\'test_value\' + 1}}" text="{{test_text}}"></error-span>')($scope);
      $scope.$digest();
      expect(element).toBeDefined();
      expect(element.find('span.oc-validate-error').get(0)).not.toBeDefined();
    });

    it('should not display text 6', function() {
      $scope.test_value1 = {
        $invalid: false,
        $dirty: false
      };
      var element = $compile('<error-span condition-map="{{\'test_value\' + 1}}" text="{{test_text}}"></error-span>')($scope);
      $scope.$digest();
      expect(element).toBeDefined();
      expect(element.find('span.oc-validate-error').get(0)).not.toBeDefined();
    });

    it('should display text 2', function() {
      $scope.test_value1 = {
        $invalid: true,
        $dirty: true
      };
      var element = $compile('<error-span condition-map="{{\'test_value\' + 1}}" text="{{test_text}}"></error-span>')($scope);
      $scope.$digest();
      expect(element).toBeDefined();
      expect(element.find('span.oc-validate-error').get(0)).toBeDefined();
      expect(element.find('span.oc-validate-error').text()).toBe(test_text);
    });

    it('should display text 3', function() {
      $scope.test_value1 = {
        $invalid: true,
        $dirty: true
      };
      $scope.nodirty = true;
      var element = $compile('<error-span condition-map="{{\'test_value\' + 1}}" nodirty="nodirty" text="{{test_text}}"></error-span>')($scope);
      $scope.$digest();
      expect(element).toBeDefined();
      expect(element.find('span.oc-validate-error').get(0)).toBeDefined();
      expect(element.find('span.oc-validate-error').text()).toBe(test_text);
    });

    it('should display text 4', function() {
      $scope.test_value1 = {
        $invalid: true,
        $dirty: true
      };
      $scope.nodirty = false;
      var element = $compile('<error-span condition-map="{{\'test_value\' + 1}}" nodirty="nodirty" text="{{test_text}}"></error-span>')($scope);
      $scope.$digest();
      expect(element).toBeDefined();
      expect(element.find('span.oc-validate-error').get(0)).toBeDefined();
      expect(element.find('span.oc-validate-error').text()).toBe(test_text);
    });

    it('should display text 5', function() {
      $scope.test_value1 = {
        $invalid: true,
        $dirty: false
      };
      $scope.nodirty = true;
      var element = $compile('<error-span condition-map="{{\'test_value\' + 1}}" nodirty="nodirty" text="{{test_text}}"></error-span>')($scope);
      $scope.$digest();
      expect(element).toBeDefined();
      expect(element.find('span.oc-validate-error').get(0)).toBeDefined();
      expect(element.find('span.oc-validate-error').text()).toBe(test_text);
    });

    it('should not display text 7', function() {
      $scope.test_value1 = {
        $invalid: true,
        $dirty: false
      };
      $scope.nodirty = false;
      var element = $compile('<error-span condition-map="{{\'test_value\' + 1}}" nodirty="nodirty" text="{{test_text}}"></error-span>')($scope);
      $scope.$digest();
      expect(element).toBeDefined();
      expect(element.find('span.oc-validate-error').get(0)).not.toBeDefined();
    });

  });

})();
