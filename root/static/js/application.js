/*global alphabet, logo_data */
(function ($) {
  "use strict";

  var document,
    hmm_logo;

  $(document).ready(function () {
    if (typeof logo_data !== 'undefined') {
      hmm_logo = $('#logo_graphic').hmm_logo({height_toggle: 1, column_width: 34, data: logo_data, scaled_max: true});
    }

    $('#model_type').on('click', function () {
      $('.ali_calc').attr('disabled', 'disabled');
      $('.model_calc').attr('disabled', false);
      $('#emission_calc').click();
    });
    $('#ali_type').on('click', function () {
      $('.model_calc').attr('disabled', 'disabled');
      $('.ali_calc').attr('disabled', false);
      $('#emission_calc').click();
    });


    // disable the alignment calculations by default.
    if ($('.logo_type:checked').attr('value') === 'model') {
      $('.ali_calc').attr('disabled', 'disabled');
    } else {
      $('.model_calc').attr('disabled', 'disabled');
    }

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


    // start up the carousel.
    $('#showcase').carousel();
  });

})(jQuery);
