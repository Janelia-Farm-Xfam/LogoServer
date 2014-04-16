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
      scaled_max: true,
      help: 1
    });

    // Check that CSS fonts haven't been disabled.
    // some people cant be trusted to do the right thing, so we have to
    // tell them that they screwed up.
    if ($('.canvas_logo').length > 0 && !/^.*?Helvetica Neue/.test($('.canvas_logo').css('font-family'))) {
      $('.logo_wrapper').after('<div class="offset1 span11"><div id="message" class="alert alert-error"><span>It looks like you have set your browser to prevent loading fonts chosen by us. This may cause a significant drop in the quality of the logo rendered. For the best logo, we recommend allowing this site to choose its own fonts. Information on how to do this should be provided in the help documentation provided with your browser.</span></div></div>');
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


    // we need to hide some of the form elements if we can.
    if (window.FileReader) {
      if ($('#file_upload').length > 0 && $('#file_upload').get(0).files.length >= 1) {

        var reader = new FileReader();

        reader.onload = function (e) {
          if (/^[\n\r\s]*HMMER/.test(e.target.result) && /\/\/[\n\r\s]*$/.test(e.target.result)) {
            $('.processing').hide();
          }
        }

        reader.readAsText($('#file_upload').get(0).files[0]);
      } else {
        if ($('#previous').data('type')) {
          if ($('#previous').data('type') === 'hmm') {
            $('.processing').hide();
          }
        }
        else {
          $('.processing').hide();
        }
      }
    }

    $('#file_upload').on('change', function () {
      // if the api to read a file is available, then we can decide if we have
      // an hmm on the client side.
      if (window.FileReader) {
        // do we have a file to read?
        if (this.files.length >= 1) {
          var reader = new FileReader();

          reader.onload = function (e) {
            if (/^[\n\r\s]*HMMER/.test(e.target.result) && /\/\/[\n\r\s]*$/.test(e.target.result)) {
              $('#hmm_process').prop('checked',true);
              $('.processing').hide();
            } else {
              $('.processing').show();
            }
          }

          reader.readAsText(this.files[0]);
        }
      }
    });

    //tooltips for the help icons.
    $.fn.tooltip = function () {
      $(this).each(function () {

        $(this).click(function (e) {
          e.preventDefault();
        });

        // if this has a title attribute, then use that
        var content = $('<p>');
        content.append($(this).attr('title'));
        content.append('<br/>').append($('<a>more</a>').attr('href',$(this).attr('href'))).html();

        $(this).qtip({
          content: {
            text: content
          },
          style: {
            classes: 'qtip-bootstrap'
          },
          position: {
            my: 'center left',
            at: 'center right',
            target: $(this)
          },
          hide: {
            fixed: true,
            delay: 1000,
            event: "mouseleave"
          },
          show: {
            solo: true
          }
        });

      });
      return this;
    };

    $('.help').tooltip();

    // start up the carousel.
    $('#showcase').carousel();
  });

})(jQuery);
