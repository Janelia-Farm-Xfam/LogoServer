var canv_support = null;

function isCanvasSupported() {
  if (!canv_support) {
    var elem = document.createElement('canvas');
    canv_support = !!(elem.getContext && elem.getContext('2d'));
  }
  return canv_support;
}

(function ($) {

  function HMMLogo(options) {
    options = options || {};

    this.column_width = options.column_width || 34;
    this.height = options.height || 300;
    this.data = options.data || null;
    this.scale_height_enabled = options.height_toggle || null;
    if (options.zoom_buttons && options.zoom_buttons === 'disabled') {
      this.zoom_enabled = null;
    } else {
      this.zoom_enabled = true;
    }

    this.alphabet = options.alphabet || 'dna';
    this.dom_element = options.dom_element || $('body');
    this.start = options.start || 1;
    this.end = options.end || this.data.height_arr.length;
    this.zoom = parseFloat(options.zoom) || 0.4;
    this.default_zoom = this.zoom;

    if (options.scaled_max) {
      this.data.max_height = options.data.max_height_obs || this.data.max_height || 2;
    } else {
      this.data.max_height = options.data.max_height_theory || this.data.max_height || 2;
    }


    this.dna_colors = {
      'A': '#cbf751',
      'C': '#5ec0cc',
      'G': '#ffdf59',
      'T': '#b51f16',
      'U': '#b51f16'
    };

    this.aa_colors = {
      'A': '#FF9966',
      'C': '#009999',
      'D': '#FF0000',
      'E': '#CC0033',
      'F': '#00FF00',
      'G': '#f2f20c',
      'H': '#660033',
      'I': '#CC9933',
      'K': '#663300',
      'L': '#FF9933',
      'M': '#CC99CC',
      'N': '#336666',
      'P': '#0099FF',
      'Q': '#6666CC',
      'R': '#990000',
      'S': '#0000FF',
      'T': '#00FFFF',
      'V': '#FFCC33',
      'W': '#66CC66',
      'Y': '#006600'
    };

    // set the color library to use.
    this.colors = this.dna_colors;

    if (this.alphabet === 'aa') {
      this.colors = this.aa_colors;
    }

    this.canvas_width = 5000;

    // this needs to be set to null here so that we can initialise it after
    // the render function has fired and the width determined.
    this.scrollme = null;

    this.previous_target = 0;
    // keeps track of which canvas elements have been drawn and which ones haven't.
    this.rendered = [];
    this.previous_zoom = 0;

    function draw_small_insert(context, x, y, col_width, odds, length) {
      var fill = "#ffffff";
      if (odds > 0.1) {
        fill = '#d7301f';
      } else if (odds > 0.05) {
        fill = '#fc8d59';
      } else if (odds > 0.03) {
        fill = '#fdcc8a';
      }
      context.fillStyle = fill;
      context.fillRect(x, y, col_width, 10);

      fill = "#ffffff";
      // draw insert length
      if (length > 9) {
        fill = '#2171b5';
      } else if (length > 7) {
        fill = '#6baed6';
      } else if (length > 4) {
        fill = '#bdd7e7';
      }
      context.fillStyle = fill;
      context.fillRect(x, y + 12, col_width, 10);
    }

    function draw_border(context, y, width) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.lineWidth = 1;
      context.strokeStyle = "#999999";
      context.stroke();
    }

    function draw_insert_odds(context, x, height, col_width, text, fontsize) {
      var y        = height - 20,
        fill     = '#ffffff',
        textfill = '#000000';

      if (text > 0.1) {
        fill     = '#d7301f';
        textfill = '#ffffff';
      } else if (text > 0.05) {
        fill = '#fc8d59';
      } else if (text > 0.03) {
        fill = '#fdcc8a';
      }

      context.font = fontsize + "px Arial";
      context.fillStyle = fill;
      context.fillRect(x, y - 10, col_width, 14);
      context.textAlign = "center";
      context.fillStyle = textfill;
      context.fillText(text, x + (col_width / 2), y);

      //draw vertical line to indicate where the insert would occur
      if (text > 0.1) {
        draw_ticks(context, x + col_width, height - 30, 0 - height - 30, fill);
      }
    }

    function draw_insert_length(context, x, y, col_width, text, fontsize) {
      var fill = '#ffffff',
        textfill = '#000000';

      if (text > 9) {
        fill     = '#2171b5';
        textfill = '#ffffff';
      } else if (text > 7) {
        fill = '#6baed6';
      } else if (text > 4) {
        fill = '#bdd7e7';
      }
      context.font = fontsize + "px Arial";
      context.fillStyle = fill;
      context.fillRect(x, y - 10, col_width, 14);
      context.textAlign = "center";
      context.fillStyle = textfill;
      context.fillText(text, x + (col_width / 2), y);
    }

    function draw_column_number(context, x, y, col_width, col_num, fontsize, right) {
      context.font = fontsize + "px Arial";
      if (right) {
        context.textAlign = "right";
      } else {
        context.textAlign = "center";
      }
      context.fillStyle = "#666666";
      context.fillText(col_num, x + (col_width / 2), y);
    }

    function draw_ticks(context, x, y, height, color) {
      color = color || '#999999';
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x, y + height);
      context.strokeStyle = color;
      context.stroke();
    }

    function attach_canvas(DOMid, height, width, id, canv_width) {
      var canvas = $(DOMid).find('#canv_' + id);

      if (!canvas.length) {
        $(DOMid).append('<canvas class="canvas_logo" id="canv_' + id + '"  height="' + height + '" width="' + width + '" style="left:' + canv_width * id + 'px"></canvas>');
        canvas = $(DOMid).find('#canv_' + id);
      }

      $(canvas).attr('width', width).attr('height', height);

      if(!isCanvasSupported()) {
        canvas[0] = G_vmlCanvasManager.initElement(canvas[0]);
      }

      return canvas[0];
    }

    // the main render function that draws the logo based on the provided options.
    this.render = function (options) {
      if (!this.data) {
        return;
      }
      options    = options || {};
      var zoom   = options.zoom || this.zoom;
      var target = options.target || 1;
      var scaled = options.scaled || null;

      if (target === this.previous_target) {
        return;
      }

      this.previous_target = target;


      if (options.start) {
        this.start = options.start;
      }
      if (options.end) {
        this.end = options.end;
      }

      if (zoom <= 0.1) {
        zoom = 0.1;
      } else if (zoom >= 1) {
        zoom = 1;
      }

      this.zoom = zoom;

      var end = this.end || this.data.height_arr.length;
      var start = this.start || 1;
      end     = (end > this.data.height_arr.length) ? this.data.height_arr.length : end;
      end     = (end < start) ? start : end;

      start     = (start > end) ? end : start;
      start     = (start > 1) ? start : 1;


      this.y = this.height - 20;
      // Check to see if the logo will fit on the screen at full zoom.
      this.max_width = this.column_width * ((end - start) + 1);
      var parent_width = $(this.dom_element).parent().width();
      // If it fits then zoom out and disable zooming.
      if (parent_width > this.max_width) {
        zoom = 1;
        this.zoom_enabled = false;
      }
      this.zoom = zoom;

      this.zoomed_column = this.column_width * zoom;
      this.total_width = this.zoomed_column * ((end - start) + 1);

      // If zoom is not maxed and we still aren't filling the window
      // then ramp up the zoom level until it fits, then disable zooming.
      // Then we get a decent logo with out needing to zoom in or out.
      if (zoom < 1) {
        while (this.total_width < parent_width) {
          this.zoom += 0.1;
          this.zoomed_column = this.column_width * this.zoom;
          this.total_width = this.zoomed_column * ((end - start) + 1);
          this.zoom_enabled = false;
          if (zoom >= 1) {
            break;
          }
        }
      }

      if (target > this.total_width) {
        target = this.total_width;
      }
      $(this.dom_element).attr({'width': this.total_width + 'px'}).css({width: this.total_width + 'px'});

      var canvas_count = Math.ceil(this.total_width / this.canvas_width);
      this.columns_per_canvas = Math.ceil(this.canvas_width / this.zoomed_column);


      if (this.previous_zoom !== this.zoom) {
        $(this.dom_element).find('canvas').remove();
        this.previous_zoom = this.zoom;
        this.rendered = [];
      }

      this.canvases = [];
      this.contexts = [];

      var max_canvas_width = 1,
        i = 0;

      for (i = 0; i < canvas_count; i++) {

        var split_start = (this.columns_per_canvas * i) + start;
        var split_end   = split_start + this.columns_per_canvas - 1;
        if (split_end > end) {
          split_end = end;
        }

        var adjusted_width = ((split_end - split_start) + 1) * this.zoomed_column;

        if (adjusted_width > max_canvas_width) {
          max_canvas_width = adjusted_width;
        }

        var canv_start = max_canvas_width * i,
          canv_end = canv_start + adjusted_width;

        if (target < canv_end + (canv_end / 2) && target > canv_start - (canv_start / 2)) {
          // Check that we aren't redrawing the canvas and if not, then attach it and draw.
          if (this.rendered[i] !== 1) {

            this.canvases[i] = attach_canvas(this.dom_element, this.height, adjusted_width, i, max_canvas_width);
            this.contexts[i] = this.canvases[i].getContext('2d');
            this.contexts[i].setTransform(1, 0, 0, 1, 0, 0);
            this.contexts[i].clearRect(0, 0, adjusted_width, this.height);
            this.contexts[i].fillStyle = "#ffffff";
            this.contexts[i].fillRect(0, 0, canv_end, this.height);


            if (this.zoomed_column > 12) {
              var fontsize = parseInt(10 * zoom, 10);
              fontsize = (fontsize > 10) ? 10 : fontsize;
              this.render_with_text(split_start, split_end, i, fontsize);
            } else {
              this.render_with_rects(split_start, split_end, i);
            }
            this.rendered[i] = 1;
          }
        }

      }

      // check if the scroller object has been initialised and if not then do so.
      // we do this here as opposed to at object creation, because we need to
      // make sure the logo has been rendered and the width is correct, otherwise
      // we get a weird initial state where the canvas will bounce back to the
      // beginning the first time it is scrolled, because it thinks it has a
      // width of 0.
      if (!this.scrollme) {
        if (Modernizr.canvas) {
          this.scrollme = new EasyScroller($(this.dom_element)[0], {
            scrollingX: 1,
            scrollingY: 0
          });
        }
      }

      if (target !== 1 && Modernizr.canvas) {
        this.scrollme.reflow();
      }
      return;
    };

    this.render_x_axis = function () {
      $(this.dom_element).parent().before('<div id="logo_xaxis" class="centered" style="margin-left:40px"><p class="xaxis_text" style="width:10em;margin:1em auto">Model Position</p></div>');
    };

    this.render_y_axis = function () {
      //attach a canvas for the y-axis
      $(this.dom_element).parent().before('<canvas id="logo_yaxis" class="logo_yaxis" height="300" width="40"></canvas>');
      var canvas = $('#logo_yaxis');
      if(!isCanvasSupported()) {
        canvas[0] = G_vmlCanvasManager.initElement(canvas[0]);
      }
      var context = canvas[0].getContext('2d');
      //draw tick marks
      context.beginPath();
      context.moveTo(40, 1);
      context.lineTo(30, 1);
      context.moveTo(40, 271);
      context.lineTo(30, 271);
      context.moveTo(40, (271 / 2));
      context.lineTo(30, (271 / 2));
      context.lineWidth = 1;
      context.strokeStyle = "#666666";
      context.stroke();
      context.fillStyle = "#000000";
      context.textAlign = "right";
      context.font = "bold 10px Arial";
      context.textBaseline = "top";
      context.fillText(this.data.max_height.toFixed(1), 28, 0);
      context.textBaseline = "middle";
      context.fillText(parseFloat(this.data.max_height / 2).toFixed(1), 28, (271 / 2));
      context.fillText('0', 28, 271);
      // draw the label
      context.save();
      context.translate(10, this.height / 2);
      context.rotate(-Math.PI / 2);
      context.textAlign = "center";
      context.font = "normal 12px Arial";
      context.fillText("Information Content", 1, 0);
      context.restore();
    };

    this.render_x_axis();
    this.render_y_axis();

    this.render_with_text = function (start, end, context_num, fontsize) {
      var x = 0,
        column_num = start,
        i = 0;
      // add 3 extra columns so that numbers don't get clipped at the end of a canvas
      // that ends before a large column. DF0000830 was suffering at zoom level 0.6,
      // column 2215. This adds a little extra overhead, but is the easiest fix for now.
      if (end + 3 <= this.end) {
        end += 3;
      }

      for (i = start; i <= end; i++) {
        if (this.data.mmline && this.data.mmline[i - 1] === 1) {
          this.contexts[context_num].fillStyle = '#cccccc';
          this.contexts[context_num].fillRect(x, 10, this.zoomed_column, this.height - 40);
        } else {
          var column = this.data.height_arr[i - 1];
          if (column) {
            var previous_height = 0;
            var letters = column.length;
            var j = 0;
            for (j = 0; j < letters; j++) {
              var letter = column[j];
              var values = letter.split(':', 2);
              if (values[1] > 0.01) {
                var letter_height = (1 * values[1]) / this.data.max_height;
                var x_pos = x + (this.zoomed_column / 2);
                var y_pos = 269 - previous_height;
                var glyph_height = 258 * letter_height;

                // The positioning in IE is off, so we need to modify the y_pos when
                // canvas is not supported and we are using VML instead.
                if(!isCanvasSupported()) {
                  y_pos = y_pos + (glyph_height * (letter_height / 2));
                }

                this.contexts[context_num].font = "bold 350px Arial";
                this.contexts[context_num].textAlign = "center";
                this.contexts[context_num].fillStyle = this.colors[values[0]];
                // fonts are scaled to fit into the column width
                // formula is y = 0.0024 * col_width + 0.0405
                var x_scale = ((0.0024 * this.zoomed_column) + 0.0405).toFixed(2);
                this.contexts[context_num].transform(x_scale, 0, 0, letter_height, x_pos, y_pos);
                this.contexts[context_num].fillText(values[0], 0, 0);
                this.contexts[context_num].setTransform(1, 0, 0, 1, 0, 0);
                previous_height = previous_height + glyph_height;
              }
            }
          }
        }

        //draw insert length ticks
        draw_ticks(this.contexts[context_num], x, this.height - 15, 5);
        // draw insert probability ticks
        draw_ticks(this.contexts[context_num], x, this.height - 30, 5);

        if (this.zoom < 0.7) {
          if (i % 5 === 0) {
            // draw column dividers
            draw_ticks(this.contexts[context_num], x + this.zoomed_column, this.height - 30, 0 - this.height - 30, '#dddddd');
            // draw top ticks
            draw_ticks(this.contexts[context_num], x + this.zoomed_column, 0, 5);
            // draw column numbers
            draw_column_number(this.contexts[context_num], x + 2, 10, this.zoomed_column, column_num, 10, true);
          }
        } else {
          // draw column dividers
          draw_ticks(this.contexts[context_num], x, this.height - 30, 0 - this.height - 30, '#dddddd');
          // draw top ticks
          draw_ticks(this.contexts[context_num], x, 0, 5);
          // draw column numbers
          draw_column_number(this.contexts[context_num], x, 10, this.zoomed_column, column_num, fontsize);
        }



        draw_insert_odds(this.contexts[context_num], x, this.height, this.zoomed_column, this.data.insert_probs[i - 1] / 100, fontsize);
        draw_insert_length(this.contexts[context_num], x, this.height - 5, this.zoomed_column, this.data.insert_lengths[i - 1], fontsize);



        x += this.zoomed_column;
        column_num++;
      }
      draw_border(this.contexts[context_num], this.height - 15, this.total_width);
      draw_border(this.contexts[context_num], this.height - 30, this.total_width);
      draw_border(this.contexts[context_num], 0, this.total_width);
    };

    this.render_with_rects = function (start, end, context_num) {
      var x = 0,
        column_num = start,
        i = 0;
      for (i = start; i <= end; i++) {
        if (this.data.mmline && this.data.mmline[i - 1] === 1) {
          this.contexts[context_num].fillStyle = '#cccccc';
          this.contexts[context_num].fillRect(x, 10, this.zoomed_column, this.height - 40);
        } else {
          var column = this.data.height_arr[i - 1];
          var previous_height = 0;
          var letters = column.length;
          var j = 0;
          for (j = 0; j < letters; j++) {
            var letter = column[j];
            var values = letter.split(':', 2);
            if (values[1] > 0.01) {
              var letter_height = (1 * values[1]) / this.data.max_height;
              var x_pos = x;
              var glyph_height = 258 * letter_height;
              var y_pos = 269 - previous_height - glyph_height;

              this.contexts[context_num].fillStyle = this.colors[values[0]];
              this.contexts[context_num].fillRect(x_pos, y_pos, this.zoomed_column, glyph_height);

              previous_height = previous_height + glyph_height;
            }
          }
        }

        var mod = 10;

        if (this.zoom < 0.2) {
          mod = 20;
        } else if (this.zoom < 0.3) {
          mod = 10;
        }

        if (i % mod === 0) {
          // draw column dividers
          draw_ticks(this.contexts[context_num], x + this.zoomed_column, this.height - 30, 0 - this.height, '#dddddd');
          // draw top ticks
          draw_ticks(this.contexts[context_num], x + this.zoomed_column, 0, 5);
          // draw column numbers
          draw_column_number(this.contexts[context_num], x - 2,  10, this.zoomed_column, column_num, 10, true);
        }


        // draw insert probabilities/lengths
        draw_small_insert(this.contexts[context_num], x, this.height - 28, this.zoomed_column, this.data.insert_probs[i - 1] / 100, this.data.insert_lengths[i - 1]);

        x += this.zoomed_column;
        column_num++;
      }

    };

    this.toggle_scale = function () {
      // work out the current column we are on so we can return there
      var before_left = this.scrollme.scroller.getValues().left,
        col_width = (this.column_width * this.zoom),
        col_count = before_left / col_width,
        half_visible_columns = ($('#logo_container').width() / col_width) / 2,
        col_total = Math.ceil(col_count + half_visible_columns);

      // toggle the max height
      if (this.data.max_height === this.data.max_height_obs) {
        this.data.max_height = this.data.max_height_theory;
      } else {
        this.data.max_height = this.data.max_height_obs;
      }
      // reset the redered counter so that each section will re-render
      // with the new heights
      this.rendered = [];
      //update the y-axis
      $('#logo_yaxis').remove();
      this.render_y_axis();

      // re-flow and re-render the content
      this.scrollme.reflow();
      //scroll off by one to force a render of the canvas.
      this.scrollToColumn(col_total + 1);
      //scroll back to the location we started at.
      this.scrollToColumn(col_total);
    };

    this.change_zoom = function (options) {
      var zoom_level = 0.3;
      if (options.target) {
        zoom_level = options.target;
      } else if (options.distance) {
        zoom_level = (parseFloat(this.zoom) - parseFloat(options.distance)).toFixed(1);
        if (options.direction === '+') {
          zoom_level = (parseFloat(this.zoom) + parseFloat(options.distance)).toFixed(1);
        }
      }

      if (zoom_level > 1) {
        zoom_level = 1;
      } else if (zoom_level < 0.1) {
        zoom_level = 0.1;
      }

      // see if we need to zoom or not
      var expected_width = ($('#logo_graphic').width() * zoom_level) / this.zoom;
      if (expected_width > $('#logo_container').width()) {
        // if a center is not specified, then use the current center of the view
        if (!options.column) {
          //work out my current position
          var before_left = this.scrollme.scroller.getValues().left;

          var col_width = (this.column_width * this.zoom);
          var col_count = before_left / col_width;
          var half_visible_columns = ($('#logo_container').width() / col_width) / 2;
          var col_total = Math.ceil(col_count + half_visible_columns);


          this.zoom = zoom_level;
          this.render({zoom: this.zoom});
          this.scrollme.reflow();

          //scroll to previous position
          this.scrollToColumn(col_total);
        } else { // center around the mouse click position.
          this.zoom = zoom_level;
          this.render({zoom: this.zoom});
          this.scrollme.reflow();

          var coords = this.coordinatesFromColumn(options.column);
          this.scrollme.scroller.scrollTo(coords - options.offset);
        }
      }
      return this.zoom;
    };

    this.columnFromCoordinates = function (x) {
      var column = Math.ceil(x / (this.column_width * this.zoom));
      return column;
    };

    this.coordinatesFromColumn = function (col) {
      var new_column = col - 1,
        x = (new_column  * (this.column_width * this.zoom)) + ((this.column_width * this.zoom) / 2);
      return x;
    };

    this.scrollToColumn = function (num, animate) {
      var half_view = ($('#logo_container').width() / 2),
        new_left = this.coordinatesFromColumn(num);
      this.scrollme.scroller.scrollTo(new_left - half_view, 0, animate);
    };


  }


  $.fn.hmm_logo = function (options) {
    if(Modernizr.canvas) {
      options = options || {};
      options.dom_element = $(this);
      var zoom = options.zoom || 0.3,
        logo = new HMMLogo(options),
        form = $('<form id="logo_form"><fieldset><label for="position">Column number</label>' +
          '<input type="text" name="position" id="position"></input>' +
          '<button class="button" id="logo_change">Go</button></fieldset>' +
          '</form>');

      logo.render(options);

      if (logo.scale_height_enabled) {
        form.append('<button id="scale" class="button">Toggle Scale</button><br/>');
      }

      if (logo.zoom_enabled) {
        form.append('<button id="zoomout" class="button">-</button>' +
          '<button id="zoomin" class="button">+</button>');
      }

      $(this).parent().after(form);

      $('#zoom_reset').bind('click', function (e) {
        e.preventDefault();
        var default_zoom = options.zoom,
          zoom = $('#zoom');
        zoom[0].value = default_zoom;
        zoom.trigger('change');
      });

      $('#logo_reset').bind('click', function (e) {
        e.preventDefault();
        var hmm_logo = logo;
        hmm_logo.change_zoom({'target': hmm_logo.default_zoom});
      });

      $('#logo_change').bind('click', function (e) {
        e.preventDefault();
      });

      $('#zoomin').bind('click', function (e) {
        e.preventDefault();
        var hmm_logo = logo;
        hmm_logo.change_zoom({'distance': 0.1, 'direction': '+'});
      });

      $('#zoomout').bind('click', function (e) {
        e.preventDefault();
        var hmm_logo = logo;
        hmm_logo.change_zoom({'distance': 0.1, 'direction': '-'});
      });

      $('#scale').bind('click', function (e) {
        e.preventDefault();
        var hmm_logo = logo;
        hmm_logo.toggle_scale();
      });

      $('#position').bind('change', function () {
        var hmm_logo = logo;
        if (!this.value.match(/^\d+$/m)) {
          return;
        }
        hmm_logo.scrollToColumn(this.value, 1);
      });

      $('#logo_graphic').bind('dblclick', function (e) {
        // need to get coordinates of mouse click
        var hmm_logo = logo;
        var offset = $(this).offset();
        var x = parseInt((e.pageX - offset.left), 10);

        // get mouse position in the window
        var window_position = e.pageX - $(this).parent().offset().left;

        // get column number
        var col = hmm_logo.columnFromCoordinates(x);

        // choose new zoom level and zoom in.
        var current = hmm_logo.zoom;
        if (current < 1) {
          hmm_logo.change_zoom({'target': 1, offset: window_position, column: col});
        } else {
          hmm_logo.change_zoom({'target': 0.3, offset: window_position, column: col});
        }

        return;
      });

      $(document).bind("scrolledTo", function (e, left, top, zoom) {
        var hmm_logo = logo;
        logo.render({target: left});
      });

      $(document).keydown(function (e) {
        if (!e.ctrlKey) {
          if (e.which === 61 || e.which === 107) {
            zoom += 0.1;
            logo.change_zoom({'distance': 0.1, 'direction': '+'});
          }
          if (e.which === 109 || e.which === 0) {
            zoom = zoom - 0.1;
            logo.change_zoom({'distance': 0.1, 'direction': '-'});
          }
        }
      });

    } else {
      $('#logo').replaceWith($('#no_canvas').html());
    }


   return logo;
  };
})(jQuery);
