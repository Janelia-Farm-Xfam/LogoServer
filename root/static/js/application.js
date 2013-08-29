/*jslint browser: true */
/*global alphabet, logo_data */
(function ($) {
  "use strict";

  var document;

  $(document).ready(function () {
    $('div#logo').hmm_logo({
      height_toggle: 1,
      column_width: 34,
      column_info: "#col_info",
      scaled_max: true
    });

    if ($("#joyRideTipContent").length > 0) {
      $("#joyRideTipContent").joyride({
        'autoStart' : true,
        'localStorage' : false,
        'localStorageKey' : 'joyride',
        'postRideCallback' : function () {
          $('.tour_control').show('slow');
        },
        'preRideCallback' : function () {
          $('.tour_control').hide();
        }
      });

      $('#restart').on('click', function () {
        $("#joyRideTipContent").joyride('restart');
      });
    }

    $('#file_upload').on('change', function () {
      // if the api to read a file is available, then we can decide if we have
      // an hmm on the client side.
      if (window.FileReader()) {
        // do we have a file to read?
        if (this.files.length >= 1) {
          var reader = new FileReader();

          reader.onload = function (e) {
            if (/^[\n\r\s]*HMMER/.test(e.target.result) && /\/\/[\n\r\s]*$/.test(e.target.result)) {
              $('#hmm_process').prop('checked',true);
            } else {
              console.log('this is not an hmm');
            }
          }

          reader.readAsText(this.files[0]);
        }
      }
    });


    // start up the carousel.
    $('#showcase').carousel();
  });

})(jQuery);
