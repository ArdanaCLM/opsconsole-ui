// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
//sorting utilities for object datasets, primarily for sorting tables
//NOT DONE YET
angular.module("operations-ui").factory("sortUtils", ['isUndefined', '$translate', function(isUndefined, $translate) {
    var stringComparator = function(str1, str2, reverse){
        var str1Clean = isUndefined(str1) ? '' : str1;//sorting was failing with null values
        var str2Clean = isUndefined(str2) ? '' : str2;//sorting was failing with null values
        return reverse ? str1Clean < str2Clean : str2Clean < str1Clean;
    };

    var caselessStringComparator = function(str1, str2, reverse){
        var str1Caseless = angular.isDefined(str1) ?  str1.toUpperCase() : str1;
        var str2Caseless = angular.isDefined(str2) ?  str2.toUpperCase() : str2;
        if(isUndefined(str1Caseless)){
            str1Caseless = '';
        }

        if(isUndefined(str2Caseless)){
            str2Caseless = '';
        }

        return reverse ? str1Caseless < str2Caseless : str2Caseless < str1Caseless;
    };

    var statusStringValueConverter = function(str){
        switch(str){
            case "ERROR":
            case "CRITICAL":
            case "ALARM":
                return 4;
            case "WARN":
                return 3;
            case "UNKNOWN":
                return 2;
            case "OK":
                return 0;
            case "POWERED ON":
                return 0;
            case "POWERED OFF":
                return 1;
        }

        return 0;
    };

    //TODO - update with REAL status values from backend
    var statusStringComparator = function(str1, str2, reverse){
        var str1_val = statusStringValueConverter(str1);
        var str2_val = statusStringValueConverter(str2);

        return reverse ? str1_val < str2_val : str2_val < str1_val;
    };

    var numberComparator = function(str1, str2, reverse){
        var decimalDelimiter = $translate.instant("number.decimal.delimiter");
        var replacementString = new RegExp("[^0-9\\" + decimalDelimiter + "]","g");
        var number1, number2;
        if(typeof str1 === 'number'){
            number1 = str1;
        } else {
            number1 = Number(str1.replace(replacementString, ""));
        }

        if(typeof str2 === 'number') {
            number2 = str2;
        } else {
            number2 = Number(str2.replace(replacementString,""));
        }

        return reverse ? number1 < number2 : number2 < number1;
    };

    var comparisonSort = function (itemsArray, sortField, direction, comparator, sortInPlace) {
        var index = 0, resultsIndex;
        var resultsArray = [];
        if (angular.isUndefined(itemsArray) || itemsArray.length === 0) {
            return resultsArray;
        }

        var reverse = false;
        if(direction === "asc"){
            reverse = true;
        }
        resultsArray[0] = itemsArray[0];
        var insertComplete = false;
        for (index = 1; index < itemsArray.length; index++) {
            insertComplete = false;
            for(resultsIndex = 0; resultsIndex < resultsArray.length; resultsIndex++){
                if(comparator(itemsArray[index][sortField],resultsArray[resultsIndex][sortField], reverse)){
                    resultsArray.splice(resultsIndex, 0, itemsArray[index]);
                    insertComplete = true;
                    break;
                }
            }
            if(!insertComplete){
                resultsArray.splice(resultsIndex, 0, itemsArray[index]);
            }
        }

        if(sortInPlace) {
            for (index = 0; index < resultsArray.length; index++) {
                itemsArray[index] = resultsArray[index];
            }
        }

        return resultsArray;
    };

    var stringComparisonSort = function (itemsArray, sortField, direction, sortInPlace) {
        return comparisonSort(itemsArray, sortField, direction, stringComparator, sortInPlace);
    };

    var caselessStringComparisonSort = function (itemsArray, sortField, direction, sortInPlace) {
        return comparisonSort(itemsArray, sortField, direction, caselessStringComparator, sortInPlace);
    };

    var numberComparisonSort = function(itemsArray, sortField, direction, sortInPlace){
        return comparisonSort(itemsArray, sortField, direction, numberComparator, sortInPlace);
    };

    var statusStringComparisonSort = function(itemsArray, sortField, direction, sortInPlace){
        return comparisonSort(itemsArray, sortField, direction, statusStringComparator, sortInPlace);
    };

    var doSort = function(itemsArray, sortField, direction, sortType, sortInPlace){
        if(isUndefined(sortInPlace)){
            sortInPlace = false;
        }

        if(isUndefined(sortType) || sortType === 'string'){
            return stringComparisonSort(itemsArray, sortField, direction, sortInPlace);
        } else if (sortType === 'caselessString'){
            return caselessStringComparisonSort(itemsArray, sortField, direction, sortInPlace);
        } else if (sortType === "number"){
            return numberComparisonSort(itemsArray, sortField, direction, sortInPlace);
        } else if (sortType === "status"){
            return statusStringComparisonSort(itemsArray, sortField, direction, sortInPlace);
        }

        return stringComparisonSort(itemsArray, sortField, direction, sortInPlace);
    };

    return{
        stringComparisonSort: stringComparisonSort,
        numComparisonSort: numberComparisonSort,
        doSort: doSort
    };

}]);
