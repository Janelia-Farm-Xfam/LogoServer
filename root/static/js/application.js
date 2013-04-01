(function ($) {
  "use strict";

  var document,
    hmm_logo;

  $(document).ready(function () {
    if (typeof logo_data !== 'undefined') {
      hmm_logo = $('#logo_graphic').hmm_logo({column_width: 34, data: logo_data, alphabet: alphabet});
    }
  });

})(jQuery);
