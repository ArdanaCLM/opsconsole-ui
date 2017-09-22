// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function() {
'use strict';

describe('Component: Sort Utils', function () {
    var utils;

    beforeEach(module('helpers'));
    beforeEach(module('operations-ui'));

    beforeEach(inject(function(sortUtils) {
        utils = sortUtils;
    }));

    it('should have a factory available', function(){
        expect(utils).toBeDefined();
    });

    it('should sort numeric entries', function(){
        expect(utils.numComparisonSort).toBeDefined();
        var unsortedNumberData = [], sortedNumberData;
        var i = 0;
        for(i = 0; i < 100; i++){
            unsortedNumberData[i] = {};
            unsortedNumberData[i].value = parseInt(Math.random() * 1000);
        }

        //check sort descending
        sortedNumberData = utils.numComparisonSort(unsortedNumberData, 'value', 'desc');
        for(i = 0; i < 99; i++){
            expect(sortedNumberData[i].value >= sortedNumberData[i+1].value).toBe(true);
        }

        //check sort ascending
        sortedNumberData = utils.numComparisonSort(unsortedNumberData, 'value', 'asc');
        for(i = 0; i < 99; i++){
            expect(sortedNumberData[i].value <= sortedNumberData[i+1].value).toBe(true);
        }
    });

    it('should sort alphabetical entries', function(){
        expect(utils.stringComparisonSort).toBeDefined();
        var unsortedStringData = [], sortedStringData, value;
        var i = 0, strValue;
        for(i = 0; i < 100; i++){
            unsortedStringData[i] = {};
            strValue = '';
            while(strValue === ''){
                strValue = Math.random().toString(36).substring(7);
            }
            unsortedStringData[i].value = strValue;
        }

        //check sort descending
        sortedStringData = utils.stringComparisonSort(unsortedStringData, 'value', 'desc');
        for(i = 0; i < 99; i++){
            expect(sortedStringData[i].value >= sortedStringData[i+1].value).toBe(true);
        }

        //check sort ascending
        sortedStringData = utils.stringComparisonSort(unsortedStringData, 'value', 'asc');
        for(i = 0; i < 99; i++){
            expect(sortedStringData[i].value <= sortedStringData[i+1].value).toBe(true);
        }
    });

    it('should switch between sorts based on parameter', function(){
        expect(utils.stringComparisonSort).toBeDefined();
        var unsortedStringData = [], sortedStringData, value;
        var i = 0, strValue;
        for(i = 0; i < 100; i++){
            unsortedStringData[i] = {};
            strValue = '';
            while(strValue === ''){
                strValue = Math.random().toString(36).substring(7);
            }
            unsortedStringData[i].value = strValue;
        }

        //check string sort
        sortedStringData = utils.doSort(unsortedStringData, 'value', 'desc', 'string');
        for(i = 0; i < 99; i++){
            expect(sortedStringData[i].value >= sortedStringData[i+1].value).toBe(true);
        }

        var unsortedNumberData = [], sortedNumberData;
        for(i = 0; i < 100; i++){
            unsortedNumberData[i] = {};
            unsortedNumberData[i].value = parseInt(Math.random() * 1000);
        }

        //check sort descending
        sortedNumberData = utils.doSort(unsortedNumberData, 'value', 'desc', 'number');
        for(i = 0; i < 99; i++){
            expect(sortedNumberData[i].value >= sortedNumberData[i+1].value).toBe(true);
        }
    });

});
})();
