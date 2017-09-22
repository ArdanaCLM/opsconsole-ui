// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
/**
 * Jasmine RequestAnimationFrame: a set of helpers for testing funcionality
 * that uses requestAnimationFrame under the Jasmine BDD framework for JavaScript.
 */
;(function() {

    var index = 0,
        callbacks = {};

    function MockRAF(global) {
        var realRAF = global.requestAnimationFrame,
            realCAF = global.cancelAnimationFrame;

        /**
         * Mock for window.requestAnimationFrame
         */
        var mockRAF = function(fn) {
            if (typeof fn !== 'function') {
                throw new Error('You should pass a function to requestAnimationFrame');
            }

            index++;
            callbacks[index] = fn;

            return index;
        };

        /**
         * Mock for window.cancelAnimationFrame
         */
        var mockCAF = function(requestID) {
            delete callbacks[requestID];
        };

        /**
         * Install request animation frame mocks.
         */
        this.install = function() {
            global.requestAnimationFrame = mockRAF;
            global.cancelAnimationFrame = mockCAF;
        };

        /**
         * Uninstall request animation frame mocks.
         */
        this.uninstall = function() {
            global.requestAnimationFrame = realRAF;
            global.cancelAnimationFrame = realCAF;
        };

        /**
         * Simulate animation frame readiness.
         */
        this.tick = function() {
            var fns = callbacks, fn, i;

            callbacks = {};

            for (i in fns) {
                fn = fns[i];
                fn.call(global, (new Date).getTime());
            }
        };
    }


    jasmine.RequestAnimationFrame = new MockRAF(window);
}());