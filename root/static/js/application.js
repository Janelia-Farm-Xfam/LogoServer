/*global alphabet, logo_data */
(function ($) {
  "use strict";

  var document,
    hmm_logo;

  $(document).ready(function () {
    if (typeof logo_data !== 'undefined') {
      hmm_logo = $('#logo_graphic').hmm_logo({height_toggle: 1, column_width: 34, data: logo_data, alphabet: alphabet});
    }

    $('#try_again').on('click', function (e) {
      e.preventDefault();
      $(this).siblings('div').toggle('fast');
    });

  });

})(jQuery);
