/*global alphabet, logo_data */
(function ($) {
  "use strict";

  var document,
    hmm_logo;

  $(document).ready(function () {
    if (typeof logo_data !== 'undefined') {
      hmm_logo = $('#logo_graphic').hmm_logo({height_toggle: 1, column_width: 34, data: logo_data, alphabet: alphabet, scaled_max: true});
    }

    if ($("#joyRideTipContent").length > 0) {
      $("#joyRideTipContent").joyride({
        'autoStart' : true,
        'postRideCallback' : function () {
          $('.tour_control').show('slow');
        },
        'preRideCallback' : function () {
          $('.tour_control').hide();
        }
      });

      $('#restart').on('click', function () {
        console.log('restarting');
        $("#joyRideTipContent").joyride('restart');
      });
    }
  });

})(jQuery);
