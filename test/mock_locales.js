// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function($) {
  'use strict';

  //Trick the frontend code into thinking that it will get all the locale bundles from the DOM
  $('body').append('<script type="application/json" name="test">{}</script>');
  window.testing = true;

})(jQuery);
