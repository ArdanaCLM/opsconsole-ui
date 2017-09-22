// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(globals) {
  var defer = function(done) {
    return function() {
      setTimeout(done, 1);
    };
  };

  globals.defer = defer;
})(window);
