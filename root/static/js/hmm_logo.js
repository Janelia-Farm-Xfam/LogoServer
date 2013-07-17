/*jslint browser:true */
/*global G_vmlCanvasManager, EasyScroller */
(function ($) {
  "use strict";

  // checking for canvas support and caching result
  var canv_support = null;
  function canvasSupport() {
    if (!canv_support) {
      var elem = document.createElement('canvas');
      canv_support = !!(elem.getContext && elem.getContext('2d'));
    }
    return canv_support;
  }

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

    this.alphabet = options.data.alphabet || 'dna';
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

    function draw_ticks(context, x, y, height, color) {
      color = color || '#999999';
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x, y + height);
      context.strokeStyle = color;
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
        draw_ticks(context, x + col_width, height - 30, -30 + height, fill);
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


    function attach_canvas(DOMid, height, width, id, canv_width) {
      var canvas = $(DOMid).find('#canv_' + id);

      if (!canvas.length) {
        $(DOMid).append('<canvas class="canvas_logo" id="canv_' + id + '"  height="' + height + '" width="' + width + '" style="left:' + canv_width * id + 'px"></canvas>');
        canvas = $(DOMid).find('#canv_' + id);
      }

      $(canvas).attr('width', width).attr('height', height);

      if (!canvasSupport()) {
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
      var zoom   = options.zoom || this.zoom,
        target = options.target || 1,
        scaled = options.scaled || null,
        parent_width = $(this.dom_element).parent().width(),
        max_canvas_width = 1,
        i = 0;

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


      for (i = 0; i < canvas_count; i++) {

        var split_start = (this.columns_per_canvas * i) + start,
          split_end   = split_start + this.columns_per_canvas - 1;
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
        if (canvasSupport()) {
          this.scrollme = new EasyScroller($(this.dom_element)[0], {
            scrollingX: 1,
            scrollingY: 0
          });
        }
      }

      if (target !== 1 && canvasSupport()) {
        this.scrollme.reflow();
      }
      return;
    };

    this.render_x_axis_label = function () {
      $(this.dom_element).parent().before('<div id="logo_xaxis" class="centered" style="margin-left:40px"><p class="xaxis_text" style="width:10em;margin:1em auto">Model Position</p></div>');
    };

    this.render_y_axis_label = function () {
      //attach a canvas for the y-axis
      $(this.dom_element).parent().before('<canvas id="logo_yaxis" class="logo_yaxis" height="300" width="40"></canvas>');
      var canvas = $('#logo_yaxis'),
        top_pix_height = 0,
        bottom_pix_height = 0,
        top_height = Math.abs(this.data.max_height),
        bottom_height = this.data.min_height_obs;
      if (!canvasSupport()) {
        canvas[0] = G_vmlCanvasManager.initElement(canvas[0]);
      }
      var context = canvas[0].getContext('2d');
      //draw min/max tick marks
      context.beginPath();
      context.moveTo(40, 1);
      context.lineTo(30, 1);

      context.moveTo(40, 271);
      context.lineTo(30, 271);


      if (this.data.min_height_obs === 0) {
        context.moveTo(40, (271 / 2));
        context.lineTo(30, (271 / 2));
      } else {
        // we need to draw three more ticks.
        // work out the center point
        var total_height = top_height + Math.abs(bottom_height),
          top_percentage    = Math.round((Math.abs(this.data.max_height) * 100) / total_height),
          bottom_percentage = Math.round((Math.abs(this.data.min_height_obs) * 100) / total_height);
        //convert % to pixels
        top_pix_height = Math.round((271 * top_percentage) / 100);
        bottom_pix_height = 271 - top_pix_height;
        // draw 0 tick
        context.moveTo(40, top_pix_height + 1);
        context.lineTo(30, top_pix_height + 1);
        //draw top mid-point
        context.moveTo(40, top_pix_height / 2);
        context.lineTo(30, top_pix_height / 2);
        //draw bottom mid-point
        context.moveTo(40, top_pix_height + (bottom_pix_height / 2));
        context.lineTo(30, top_pix_height + (bottom_pix_height / 2));
      }
      context.lineWidth = 1;
      context.strokeStyle = "#666666";
      context.stroke();

      //draw the label text
      context.fillStyle = "#666666";
      context.textAlign = "right";
      context.font = "bold 10px Arial";

      // draw the max label
      context.textBaseline = "top";
      context.fillText(this.data.max_height.toFixed(1), 28, 0);
      context.textBaseline = "middle";

      // draw the midpoint labels
      if (this.data.min_height_obs === 0) {
        context.fillText(parseFloat((this.data.max_height + this.data.min_height_obs) / 2).toFixed(1), 28, (271 / 2));
      } else {
        //draw 0
        context.fillText(0, 28, top_pix_height + 1);
        // draw top mid-point
        context.fillText(parseFloat(top_height / 2).toFixed(1), 28, top_pix_height / 2);
        //draw bottom mid-point
        context.fillText(parseFloat(bottom_height / 2).toFixed(1), 28, top_pix_height + (bottom_pix_height / 2));
      }
      // draw the min label
      context.fillText(this.data.min_height_obs.toFixed(1), 28, 271);

      // draw the axis label
      context.save();
      context.translate(5, this.height / 2);
      context.rotate(-Math.PI / 2);
      context.textAlign = "center";
      context.font = "normal 12px Arial";
      context.fillText("Information Content", 1, 0);
      context.restore();
    };

    this.render_x_axis_label();
    this.render_y_axis_label();

    this.render_with_text = function (start, end, context_num, fontsize) {
      var x = 0,
        column_num = start,
        i = 0,
        top_height = Math.abs(this.data.max_height),
        bottom_height = this.data.min_height_obs,
        total_height = top_height + Math.abs(bottom_height),
        top_percentage    = Math.round((Math.abs(this.data.max_height) * 100) / total_height),
        //convert % to pixels
        top_pix_height = Math.round((271 * top_percentage) / 100),
        bottom_pix_height = 271 - top_pix_height,
        // this is used to transform the 271px high letters into the correct size
        // when displaying negative values, so that they fit above the 0 line.
        top_pix_conversion = top_pix_height / 271,
        bottom_pix_conversion = bottom_pix_height / 271;

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
            var previous_height = 0,
              letters = column.length,
              previous_neg_height = top_pix_height,
              j = 0;
            for (j = 0; j < letters; j++) {
              var letter = column[j],
                values = letter.split(':', 2),
                x_pos = x + (this.zoomed_column / 2),
                // fonts are scaled to fit into the column width
                // formula is y = 0.0024 * col_width + 0.0405
                x_scale = ((0.0024 * this.zoomed_column) + 0.0405).toFixed(2);

              // we don't render anything with a value between 0 and 0.01. These
              // letters would be too small to be meaningful on any scale, so we
              // just squash them out.
              if (values[1] > 0.01) {
                var letter_height = (1 * values[1]) / this.data.max_height;
                var y_pos = top_pix_height - previous_height;
                var glyph_height = top_pix_height * letter_height;

                // The positioning in IE is off, so we need to modify the y_pos when
                // canvas is not supported and we are using VML instead.
                if (!canvasSupport()) {
                  y_pos = y_pos + (glyph_height * (letter_height / 2));
                }


                this.contexts[context_num].font = "bold 350px Arial";
                this.contexts[context_num].textAlign = "center";
                this.contexts[context_num].fillStyle = this.colors[values[0]];
                this.contexts[context_num].transform(x_scale, 0, 0, top_pix_conversion * letter_height, x_pos, y_pos);
                this.contexts[context_num].fillText(values[0], 0, 0);
                this.contexts[context_num].setTransform(1, 0, 0, 1, 0, 0);
                previous_height = previous_height + glyph_height;
              } else if (values[1] < 0) {
                var letter_height = (Math.abs(values[1])) / Math.abs(this.data.min_height_obs);
                var glyph_height = bottom_pix_height * letter_height;
                var y_pos = glyph_height + previous_neg_height;

                // The positioning in IE is off, so we need to modify the y_pos when
                // canvas is not supported and we are using VML instead.
                if (!canvasSupport()) {
                  y_pos = y_pos + (glyph_height * (letter_height / 2));
                }


                this.contexts[context_num].font = "bold 350px Arial";
                this.contexts[context_num].textAlign = "center";
                this.contexts[context_num].fillStyle = this.colors[values[0]];
                this.contexts[context_num].transform(x_scale, 0, 0, bottom_pix_conversion * letter_height, x_pos, y_pos);
                this.contexts[context_num].fillText(values[0], 0, 0);
                this.contexts[context_num].setTransform(1, 0, 0, 1, 0, 0);
                previous_neg_height = previous_neg_height + glyph_height;
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
            draw_ticks(this.contexts[context_num], x + this.zoomed_column, this.height - 30, -30 + this.height, '#dddddd');
            // draw top ticks
            draw_ticks(this.contexts[context_num], x + this.zoomed_column, 0, 5);
            // draw column numbers
            draw_column_number(this.contexts[context_num], x + 2, 10, this.zoomed_column, column_num, 10, true);
          }
        } else {
          // draw column dividers
          draw_ticks(this.contexts[context_num], x, this.height - 30, -30 + this.height, '#dddddd');
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
      this.draw_zero_divider(context_num);


      // draw other dividers
      draw_border(this.contexts[context_num], this.height - 15, this.total_width);
      draw_border(this.contexts[context_num], this.height - 30, this.total_width);
      draw_border(this.contexts[context_num], 0, this.total_width);
    };

    this.draw_zero_divider = function (context_num) {
      // draw horizontal divider line for 0
      var top_height = Math.abs(this.data.max_height),
        bottom_height = Math.abs(this.data.min_height_obs),
        total_height = top_height + bottom_height,
        top_percentage    = Math.round((Math.abs(this.data.max_height) * 100) / total_height),
        bottom_percentage = Math.round((Math.abs(this.data.min_height_obs) * 100) / total_height),
      //convert % to pixels
        top_pix_height = Math.round((271 * top_percentage) / 100);
      draw_border(this.contexts[context_num], top_pix_height, this.total_width);

    };

    this.render_with_rects = function (start, end, context_num) {
      var x = 0,
        column_num = start,
        i = 0,
        top_height = Math.abs(this.data.max_height),
        bottom_height = Math.abs(this.data.min_height_obs),
        total_height = top_height + bottom_height,
        top_percentage    = Math.round((Math.abs(this.data.max_height) * 100) / total_height),
        //convert % to pixels
        top_pix_height = Math.round((271 * top_percentage) / 100),
        bottom_pix_height = 271 - top_pix_height,
        mod = 10;

      for (i = start; i <= end; i++) {
        if (this.data.mmline && this.data.mmline[i - 1] === 1) {
          this.contexts[context_num].fillStyle = '#cccccc';
          this.contexts[context_num].fillRect(x, 10, this.zoomed_column, this.height - 40);
        } else {
          var column = this.data.height_arr[i - 1],
            previous_height = 0,
            previous_neg_height = top_pix_height,
            letters = column.length,
            j = 0;
          for (j = 0; j < letters; j++) {
            var letter = column[j],
              values = letter.split(':', 2);
            if (values[1] > 0.01) {
              var letter_height = parseFloat(values[1]) / this.data.max_height,
                x_pos = x,
                glyph_height = top_pix_height * letter_height,
                y_pos = top_pix_height - previous_height - glyph_height;

              this.contexts[context_num].fillStyle = this.colors[values[0]];
              this.contexts[context_num].fillRect(x_pos, y_pos, this.zoomed_column, glyph_height);

              previous_height = previous_height + glyph_height;
            } else {
              //render the negatives
              var letter_height = Math.abs(values[1]) / Math.abs(this.data.min_height_obs);
              var x_pos = x;
              var glyph_height = bottom_pix_height * letter_height;
              var y_pos = previous_neg_height;
              this.contexts[context_num].fillStyle = this.colors[values[0]];
              this.contexts[context_num].fillRect(x_pos, y_pos, this.zoomed_column, glyph_height);

              previous_neg_height = previous_neg_height + glyph_height;
            }
          }
        }


        if (this.zoom < 0.2) {
          mod = 20;
        } else if (this.zoom < 0.3) {
          mod = 10;
        }

        if (i % mod === 0) {
          // draw column dividers
          draw_ticks(this.contexts[context_num], x + this.zoomed_column, this.height - 30, parseFloat(this.height), '#dddddd');
          // draw top ticks
          draw_ticks(this.contexts[context_num], x + this.zoomed_column, 0, 5);
          // draw column numbers
          draw_column_number(this.contexts[context_num], x - 2,  10, this.zoomed_column, column_num, 10, true);
        }


        // draw insert probabilities/lengths
        draw_small_insert(this.contexts[context_num], x, this.height - 28, this.zoomed_column, this.data.insert_probs[i - 1] / 100, this.data.insert_lengths[i - 1]);

        // draw horizontal divider line for 0
        draw_border(this.contexts[context_num], top_pix_height, this.total_width);
        // draw other dividers
        draw_border(this.contexts[context_num], this.height - 30, this.total_width);
        draw_border(this.contexts[context_num], 0, this.total_width);

        x += this.zoomed_column;
        column_num++;
      }

    };

    this.toggle_scale = function () {
      // work out the current column we are on so we can return there
      var col_total = this.current_column();

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
      this.render_y_axis_label();

      // re-flow and re-render the content
      this.scrollme.reflow();
      //scroll off by one to force a render of the canvas.
      this.scrollToColumn(col_total + 1);
      //scroll back to the location we started at.
      this.scrollToColumn(col_total);
    };

    this.current_column = function () {
      var before_left = this.scrollme.scroller.getValues().left,
        col_width = (this.column_width * this.zoom),
        col_count = before_left / col_width,
        half_visible_columns = ($('#logo_container').width() / col_width) / 2,
        col_total = Math.ceil(col_count + half_visible_columns);
      return col_total;
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
          var col_total = this.current_column();

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
    var logo = null;
    if (canvasSupport()) {
      options = options || {};
      options.dom_element = $(this);
      var zoom = options.zoom || 0.3,
        form = $('<form id="logo_form"><fieldset><label for="position">Column number</label>' +
          '<input type="text" name="position" id="position"></input>' +
          '<button class="button" id="logo_change">Go</button></fieldset>' +
          '</form>');

      logo = new HMMLogo(options);
      logo.render(options);

      if (logo.scale_height_enabled && options.data.min_height_obs >= 0) {
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
        var hmm_logo = logo,
          offset = $(this).offset(),
          x = parseInt((e.pageX - offset.left), 10),

          // get mouse position in the window
          window_position = e.pageX - $(this).parent().offset().left,

          // get column number
          col = hmm_logo.columnFromCoordinates(x),

          // choose new zoom level and zoom in.
          current = hmm_logo.zoom;

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

/*
 * Scroller
 * http://github.com/zynga/scroller
 *
 * Copyright 2011, Zynga Inc.
 * Licensed under the MIT License.
 * https://raw.github.com/zynga/scroller/master/MIT-LICENSE.txt
 *
 * Based on the work of: Unify Project (unify-project.org)
 * http://unify-project.org
 * Copyright 2011, Deutsche Telekom AG
 * License: MIT + Apache (V2)
 *
 * Inspired by: https://github.com/inexorabletash/raf-shim/blob/master/raf.js
 */
(function(global)
{
	if(global.requestAnimationFrame) {
		return;
	}

	// Basic emulation of native methods for internal use

	var now = Date.now || function() {
		return +new Date;
	};

	var getKeys = Object.keys || function(obj) {

		var keys = {};
		for (var key in obj) {
			keys[key] = true;
		}

		return keys;

	};

	var isEmpty = Object.empty || function(obj) {

		for (var key in obj) {
			return false;
		}

		return true;

	};


	// requestAnimationFrame polyfill
	// http://webstuff.nfshost.com/anim-timing/Overview.html

	var postfix = "RequestAnimationFrame";
	var prefix = (function()
	{
		var all = "webkit,moz,o,ms".split(",");
		for (var i=0; i<4; i++) {
			if (global[all[i]+postfix] != null) {
				return all[i];
			}
		}
	})();

	// Vendor specific implementation
	if (prefix)
	{
		global.requestAnimationFrame = global[prefix+postfix];
		global.cancelRequestAnimationFrame = global[prefix+"Cancel"+postfix];
		return;
	}

	// Custom implementation
	var TARGET_FPS = 60;
	var requests = {};
	var rafHandle = 1;
	var timeoutHandle = null;

	global.requestAnimationFrame = function(callback, root)
	{
		var callbackHandle = rafHandle++;

		// Store callback
		requests[callbackHandle] = callback;

		// Create timeout at first request
		if (timeoutHandle === null)
		{
			timeoutHandle = setTimeout(function()
			{
				var time = now();
				var currentRequests = requests;
				var keys = getKeys(currentRequests);

				// Reset data structure before executing callbacks
				requests = {};
				timeoutHandle = null;

				// Process all callbacks
				for (var i=0, l=keys.length; i<l; i++) {
					currentRequests[keys[i]](time);
				}
			}, 1000 / TARGET_FPS);
		}

		return callbackHandle;
	};

	global.cancelRequestAnimationFrame = function(handle)
	{
		delete requests[handle];

		// Stop timeout if all where removed
		if (isEmpty(requests))
		{
			clearTimeout(timeoutHandle);
			timeoutHandle = null;
		}
	};

})(this);/*
 * Scroller
 * http://github.com/zynga/scroller
 *
 * Copyright 2011, Zynga Inc.
 * Licensed under the MIT License.
 * https://raw.github.com/zynga/scroller/master/MIT-LICENSE.txt
 *
 * Based on the work of: Unify Project (unify-project.org)
 * http://unify-project.org
 * Copyright 2011, Deutsche Telekom AG
 * License: MIT + Apache (V2)
 */

/**
 * Generic animation class with support for dropped frames both optional easing and duration.
 *
 * Optional duration is useful when the lifetime is defined by another condition than time
 * e.g. speed of an animating object, etc.
 *
 * Dropped frame logic allows to keep using the same updater logic independent from the actual
 * rendering. This eases a lot of cases where it might be pretty complex to break down a state
 * based on the pure time difference.
 */
(function(global) {
	var time = Date.now || function() {
		return +new Date();
	};
	var desiredFrames = 60;
	var millisecondsPerSecond = 1000;
	var running = {};
	var counter = 1;

	// Create namespaces
	if (!global.core) {
		global.core = { effect : {} };
	} else if (!core.effect) {
		core.effect = {};
	}

	core.effect.Animate = {

		/**
		 * Stops the given animation.
		 *
		 * @param id {Integer} Unique animation ID
		 * @return {Boolean} Whether the animation was stopped (aka, was running before)
		 */
		stop: function(id) {
			var cleared = running[id] != null;
			if (cleared) {
				running[id] = null;
			}

			return cleared;
		},


		/**
		 * Whether the given animation is still running.
		 *
		 * @param id {Integer} Unique animation ID
		 * @return {Boolean} Whether the animation is still running
		 */
		isRunning: function(id) {
			return running[id] != null;
		},


		/**
		 * Start the animation.
		 *
		 * @param stepCallback {Function} Pointer to function which is executed on every step.
		 *   Signature of the method should be `function(percent, now, virtual) { return continueWithAnimation; }`
		 * @param verifyCallback {Function} Executed before every animation step.
		 *   Signature of the method should be `function() { return continueWithAnimation; }`
		 * @param completedCallback {Function}
		 *   Signature of the method should be `function(droppedFrames, finishedAnimation) {}`
		 * @param duration {Integer} Milliseconds to run the animation
		 * @param easingMethod {Function} Pointer to easing function
		 *   Signature of the method should be `function(percent) { return modifiedValue; }`
		 * @param root {Element ? document.body} Render root, when available. Used for internal
		 *   usage of requestAnimationFrame.
		 * @return {Integer} Identifier of animation. Can be used to stop it any time.
		 */
		start: function(stepCallback, verifyCallback, completedCallback, duration, easingMethod, root) {

			var start = time();
			var lastFrame = start;
			var percent = 0;
			var dropCounter = 0;
			var id = counter++;

			if (!root) {
				root = document.body;
			}

			// Compacting running db automatically every few new animations
			if (id % 20 === 0) {
				var newRunning = {};
				for (var usedId in running) {
					newRunning[usedId] = true;
				}
				running = newRunning;
			}

			// This is the internal step method which is called every few milliseconds
			var step = function(virtual) {

				// Normalize virtual value
				var render = virtual !== true;

				// Get current time
				var now = time();

				// Verification is executed before next animation step
				if (!running[id] || (verifyCallback && !verifyCallback(id))) {

					running[id] = null;
					completedCallback && completedCallback(desiredFrames - (dropCounter / ((now - start) / millisecondsPerSecond)), id, false);
					return;

				}

				// For the current rendering to apply let's update omitted steps in memory.
				// This is important to bring internal state variables up-to-date with progress in time.
				if (render) {

					var droppedFrames = Math.round((now - lastFrame) / (millisecondsPerSecond / desiredFrames)) - 1;
					for (var j = 0; j < Math.min(droppedFrames, 4); j++) {
						step(true);
						dropCounter++;
					}

				}

				// Compute percent value
				if (duration) {
					percent = (now - start) / duration;
					if (percent > 1) {
						percent = 1;
					}
				}

				// Execute step callback, then...
				var value = easingMethod ? easingMethod(percent) : percent;
				if ((stepCallback(value, now, render) === false || percent === 1) && render) {
					running[id] = null;
					completedCallback && completedCallback(desiredFrames - (dropCounter / ((now - start) / millisecondsPerSecond)), id, percent === 1 || duration == null);
				} else if (render) {
					lastFrame = now;
					requestAnimationFrame(step, root);
				}
			};

			// Mark as running
			running[id] = true;

			// Init first step
			requestAnimationFrame(step, root);

			// Return unique animation ID
			return id;
		}
	};
})(this);

var EasyScroller = function(content, options) {

	this.content = content;
	this.container = content.parentNode;
	this.options = options || {};

	// create Scroller instance
	var that = this;
	this.scroller = new Scroller(function(left, top, zoom) {
		that.render(left, top, zoom);
	}, options);

	// bind events
	this.bindEvents();

	// the content element needs a correct transform origin for zooming
	this.content.style[EasyScroller.vendorPrefix + 'TransformOrigin'] = "left top";

	// reflow for the first time
	this.reflow();

};

EasyScroller.prototype.render = (function() {

	var docStyle = document.documentElement.style;

	var engine;
	if (window.opera && Object.prototype.toString.call(opera) === '[object Opera]') {
		engine = 'presto';
	} else if ('MozAppearance' in docStyle) {
		engine = 'gecko';
	} else if ('WebkitAppearance' in docStyle) {
		engine = 'webkit';
	} else if (typeof navigator.cpuClass === 'string') {
		engine = 'trident';
	}

	var vendorPrefix = EasyScroller.vendorPrefix = {
		trident: 'ms',
		gecko: 'Moz',
		webkit: 'Webkit',
		presto: 'O'
	}[engine];

	var helperElem = document.createElement("div");
	var undef;

	var perspectiveProperty = vendorPrefix + "Perspective";
	var transformProperty = vendorPrefix + "Transform";

	if (helperElem.style[perspectiveProperty] !== undef) {

		return function(left, top, zoom) {
			this.content.style[transformProperty] = 'translate3d(' + (-left) + 'px,' + (-top) + 'px,0) scale(' + zoom + ')';
		};

	} else if (helperElem.style[transformProperty] !== undef) {

		return function(left, top, zoom) {
			this.content.style[transformProperty] = 'translate(' + (-left) + 'px,' + (-top) + 'px) scale(' + zoom + ')';
		};

	} else {

		return function(left, top, zoom) {
			this.content.style.marginLeft = left ? (-left/zoom) + 'px' : '';
			this.content.style.marginTop = top ? (-top/zoom) + 'px' : '';
			this.content.style.zoom = zoom || '';
		};

	}
})();

EasyScroller.prototype.reflow = function() {

	// set the right scroller dimensions
	this.scroller.setDimensions(this.container.clientWidth, this.container.clientHeight, this.content.offsetWidth, this.content.offsetHeight);

	// refresh the position for zooming purposes
	var rect = this.container.getBoundingClientRect();
	this.scroller.setPosition(rect.left + this.container.clientLeft, rect.top + this.container.clientTop);

};

EasyScroller.prototype.bindEvents = function() {

	var that = this;

	// reflow handling
	$(window).bind("resize", function() {
		that.reflow();
	});

  // added this here, not ideal, but it makes sure that the logo will
  // scroll correctly when the model tab is revealed.
  $('#modelTab').bind('click', function() {
		that.reflow();
  });


	// touch devices bind touch events
	if ('ontouchstart' in window) {

		this.container.addEventListener("touchstart", function(e) {

			// Don't react if initial down happens on a form element
			if (e.touches[0] && e.touches[0].target && e.touches[0].target.tagName.match(/input|textarea|select/i)) {
				return;
			}

			that.scroller.doTouchStart(e.touches, new Date().getTime());
			e.preventDefault();

		}, false);

		document.addEventListener("touchmove", function(e) {
			that.scroller.doTouchMove(e.touches, new Date().getTime(), e.scale);
		}, false);

		document.addEventListener("touchend", function(e) {
			that.scroller.doTouchEnd(new Date().getTime());
		}, false);

		document.addEventListener("touchcancel", function(e) {
			that.scroller.doTouchEnd(new Date().getTime());
		}, false);

	// non-touch bind mouse events
	} else {

		var mousedown = false;

		$(this.container).bind("mousedown", function(e) {

			if (e.target.tagName.match(/input|textarea|select/i)) {
				return;
			}


			that.scroller.doTouchStart([{
				pageX: e.pageX,
				pageY: e.pageY
			}], new Date().getTime());

			mousedown = true;
			e.preventDefault();

		});

		$(document).bind("mousemove", function(e) {

			if (!mousedown) {
				return;
			}

			that.scroller.doTouchMove([{
				pageX: e.pageX,
				pageY: e.pageY
			}], new Date().getTime());

			mousedown = true;

		});

		$(document).bind("mouseup", function(e) {

			if (!mousedown) {
				return;
			}

      that.scroller.doTouchEnd(new Date().getTime());

			mousedown = false;

		});

		$(this.container).bind("mousewheel", function(e) {
			if(that.options.zooming) {
				that.scroller.doMouseZoom(e.wheelDelta, new Date().getTime(), e.pageX, e.pageY);
				e.preventDefault();
			}
		});

	}

};

/*
 * Scroller
 * http://github.com/zynga/scroller
 *
 * Copyright 2011, Zynga Inc.
 * Licensed under the MIT License.
 * https://raw.github.com/zynga/scroller/master/MIT-LICENSE.txt
 *
 * Based on the work of: Unify Project (unify-project.org)
 * http://unify-project.org
 * Copyright 2011, Deutsche Telekom AG
 * License: MIT + Apache (V2)
 */

var Scroller;

(function() {

	/**
	 * A pure logic 'component' for 'virtual' scrolling/zooming.
	 */
	Scroller = function(callback, options) {

		this.__callback = callback;

		this.options = {

			/** Enable scrolling on x-axis */
			scrollingX: true,

			/** Enable scrolling on y-axis */
			scrollingY: true,

			/** Enable animations for deceleration, snap back, zooming and scrolling */
			animating: true,

			/** Enable bouncing (content can be slowly moved outside and jumps back after releasing) */
			bouncing: true,

			/** Enable locking to the main axis if user moves only slightly on one of them at start */
			locking: true,

			/** Enable pagination mode (switching between full page content panes) */
			paging: false,

			/** Enable snapping of content to a configured pixel grid */
			snapping: false,

			/** Enable zooming of content via API, fingers and mouse wheel */
			zooming: false,

			/** Minimum zoom level */
			minZoom: 0.5,

			/** Maximum zoom level */
			maxZoom: 3

		};

		for (var key in options) {
			this.options[key] = options[key];
		}

	};


	// Easing Equations (c) 2003 Robert Penner, all rights reserved.
	// Open source under the BSD License.

	/**
	 * @param pos {Number} position between 0 (start of effect) and 1 (end of effect)
	**/
	var easeOutCubic = function(pos) {
		return (Math.pow((pos - 1), 3) + 1);
	};

	/**
	 * @param pos {Number} position between 0 (start of effect) and 1 (end of effect)
	**/
	var easeInOutCubic = function(pos) {
		if ((pos /= 0.5) < 1) {
			return 0.5 * Math.pow(pos, 3);
		}

		return 0.5 * (Math.pow((pos - 2), 3) + 2);
	};


	var members = {

		/*
		---------------------------------------------------------------------------
			INTERNAL FIELDS :: STATUS
		---------------------------------------------------------------------------
		*/

		/** {Boolean} Whether only a single finger is used in touch handling */
		__isSingleTouch: false,

		/** {Boolean} Whether a touch event sequence is in progress */
		__isTracking: false,

		/**
		 * {Boolean} Whether a gesture zoom/rotate event is in progress. Activates when
		 * a gesturestart event happens. This has higher priority than dragging.
		 */
		__isGesturing: false,

		/**
		 * {Boolean} Whether the user has moved by such a distance that we have enabled
		 * dragging mode. Hint: It's only enabled after some pixels of movement to
		 * not interrupt with clicks etc.
		 */
		__isDragging: false,

		/**
		 * {Boolean} Not touching and dragging anymore, and smoothly animating the
		 * touch sequence using deceleration.
		 */
		__isDecelerating: false,

		/**
		 * {Boolean} Smoothly animating the currently configured change
		 */
		__isAnimating: false,



		/*
		---------------------------------------------------------------------------
			INTERNAL FIELDS :: DIMENSIONS
		---------------------------------------------------------------------------
		*/

		/** {Integer} Available outer left position (from document perspective) */
		__clientLeft: 0,

		/** {Integer} Available outer top position (from document perspective) */
		__clientTop: 0,

		/** {Integer} Available outer width */
		__clientWidth: 0,

		/** {Integer} Available outer height */
		__clientHeight: 0,

		/** {Integer} Outer width of content */
		__contentWidth: 0,

		/** {Integer} Outer height of content */
		__contentHeight: 0,

		/** {Integer} Snapping width for content */
		__snapWidth: 100,

		/** {Integer} Snapping height for content */
		__snapHeight: 100,

		/** {Integer} Height to assign to refresh area */
		__refreshHeight: null,

		/** {Boolean} Whether the refresh process is enabled when the event is released now */
		__refreshActive: false,

		/** {Function} Callback to execute on activation. This is for signalling the user about a refresh is about to happen when he release */
		__refreshActivate: null,

		/** {Function} Callback to execute on deactivation. This is for signalling the user about the refresh being cancelled */
		__refreshDeactivate: null,

		/** {Function} Callback to execute to start the actual refresh. Call {@link #refreshFinish} when done */
		__refreshStart: null,

		/** {Number} Zoom level */
		__zoomLevel: 1,

		/** {Number} Scroll position on x-axis */
		__scrollLeft: 0,

		/** {Number} Scroll position on y-axis */
		__scrollTop: 0,

		/** {Integer} Maximum allowed scroll position on x-axis */
		__maxScrollLeft: 0,

		/** {Integer} Maximum allowed scroll position on y-axis */
		__maxScrollTop: 0,

		/* {Number} Scheduled left position (final position when animating) */
		__scheduledLeft: 0,

		/* {Number} Scheduled top position (final position when animating) */
		__scheduledTop: 0,

		/* {Number} Scheduled zoom level (final scale when animating) */
		__scheduledZoom: 0,



		/*
		---------------------------------------------------------------------------
			INTERNAL FIELDS :: LAST POSITIONS
		---------------------------------------------------------------------------
		*/

		/** {Number} Left position of finger at start */
		__lastTouchLeft: null,

		/** {Number} Top position of finger at start */
		__lastTouchTop: null,

		/** {Date} Timestamp of last move of finger. Used to limit tracking range for deceleration speed. */
		__lastTouchMove: null,

		/** {Array} List of positions, uses three indexes for each state: left, top, timestamp */
		__positions: null,



		/*
		---------------------------------------------------------------------------
			INTERNAL FIELDS :: DECELERATION SUPPORT
		---------------------------------------------------------------------------
		*/

		/** {Integer} Minimum left scroll position during deceleration */
		__minDecelerationScrollLeft: null,

		/** {Integer} Minimum top scroll position during deceleration */
		__minDecelerationScrollTop: null,

		/** {Integer} Maximum left scroll position during deceleration */
		__maxDecelerationScrollLeft: null,

		/** {Integer} Maximum top scroll position during deceleration */
		__maxDecelerationScrollTop: null,

		/** {Number} Current factor to modify horizontal scroll position with on every step */
		__decelerationVelocityX: null,

		/** {Number} Current factor to modify vertical scroll position with on every step */
		__decelerationVelocityY: null,



		/*
		---------------------------------------------------------------------------
			PUBLIC API
		---------------------------------------------------------------------------
		*/

		/**
		 * Configures the dimensions of the client (outer) and content (inner) elements.
		 * Requires the available space for the outer element and the outer size of the inner element.
		 * All values which are falsy (null or zero etc.) are ignored and the old value is kept.
		 *
		 * @param clientWidth {Integer ? null} Inner width of outer element
		 * @param clientHeight {Integer ? null} Inner height of outer element
		 * @param contentWidth {Integer ? null} Outer width of inner element
		 * @param contentHeight {Integer ? null} Outer height of inner element
		 */
		setDimensions: function(clientWidth, clientHeight, contentWidth, contentHeight) {

			var self = this;

			// Only update values which are defined
			if (clientWidth) {
				self.__clientWidth = clientWidth;
			}

			if (clientHeight) {
				self.__clientHeight = clientHeight;
			}

			if (contentWidth) {
				self.__contentWidth = contentWidth;
			}

			if (contentHeight) {
				self.__contentHeight = contentHeight;
			}

			// Refresh maximums
			self.__computeScrollMax();

			// Refresh scroll position
			self.scrollTo(self.__scrollLeft, self.__scrollTop, true);

		},


		/**
		 * Sets the client coordinates in relation to the document.
		 *
		 * @param left {Integer ? 0} Left position of outer element
		 * @param top {Integer ? 0} Top position of outer element
		 */
		setPosition: function(left, top) {

			var self = this;

			self.__clientLeft = left || 0;
			self.__clientTop = top || 0;

		},


		/**
		 * Configures the snapping (when snapping is active)
		 *
		 * @param width {Integer} Snapping width
		 * @param height {Integer} Snapping height
		 */
		setSnapSize: function(width, height) {

			var self = this;

			self.__snapWidth = width;
			self.__snapHeight = height;

		},


		/**
		 * Activates pull-to-refresh. A special zone on the top of the list to start a list refresh whenever
		 * the user event is released during visibility of this zone. This was introduced by some apps on iOS like
		 * the official Twitter client.
		 *
		 * @param height {Integer} Height of pull-to-refresh zone on top of rendered list
		 * @param activateCallback {Function} Callback to execute on activation. This is for signalling the user about a refresh is about to happen when he release.
		 * @param deactivateCallback {Function} Callback to execute on deactivation. This is for signalling the user about the refresh being cancelled.
		 * @param startCallback {Function} Callback to execute to start the real async refresh action. Call {@link #finishPullToRefresh} after finish of refresh.
		 */
		activatePullToRefresh: function(height, activateCallback, deactivateCallback, startCallback) {

			var self = this;

			self.__refreshHeight = height;
			self.__refreshActivate = activateCallback;
			self.__refreshDeactivate = deactivateCallback;
			self.__refreshStart = startCallback;

		},


		/**
		 * Signalizes that pull-to-refresh is finished.
		 */
		finishPullToRefresh: function() {

			var self = this;

			self.__refreshActive = false;
			if (self.__refreshDeactivate) {
				self.__refreshDeactivate();
			}

			self.scrollTo(self.__scrollLeft, self.__scrollTop, true);

		},


		/**
		 * Returns the scroll position and zooming values
		 *
		 * @return {Map} `left` and `top` scroll position and `zoom` level
		 */
		getValues: function() {

			var self = this;

			return {
				left: self.__scrollLeft,
				top: self.__scrollTop,
				zoom: self.__zoomLevel
			};

		},


		/**
		 * Returns the maximum scroll values
		 *
		 * @return {Map} `left` and `top` maximum scroll values
		 */
		getScrollMax: function() {

			var self = this;

			return {
				left: self.__maxScrollLeft,
				top: self.__maxScrollTop
			};

		},


		/**
		 * Zooms to the given level. Supports optional animation. Zooms
		 * the center when no coordinates are given.
		 *
		 * @param level {Number} Level to zoom to
		 * @param animate {Boolean ? false} Whether to use animation
		 * @param originLeft {Number ? null} Zoom in at given left coordinate
		 * @param originTop {Number ? null} Zoom in at given top coordinate
		 */
		zoomTo: function(level, animate, originLeft, originTop) {

			var self = this;

			if (!self.options.zooming) {
				throw new Error("Zooming is not enabled!");
			}

			// Stop deceleration
			if (self.__isDecelerating) {
				core.effect.Animate.stop(self.__isDecelerating);
				self.__isDecelerating = false;
			}

			var oldLevel = self.__zoomLevel;

			// Normalize input origin to center of viewport if not defined
			if (originLeft == null) {
				originLeft = self.__clientWidth / 2;
			}

			if (originTop == null) {
				originTop = self.__clientHeight / 2;
			}

			// Limit level according to configuration
			level = Math.max(Math.min(level, self.options.maxZoom), self.options.minZoom);

			// Recompute maximum values while temporary tweaking maximum scroll ranges
			self.__computeScrollMax(level);

			// Recompute left and top coordinates based on new zoom level
			var left = ((originLeft + self.__scrollLeft) * level / oldLevel) - originLeft;
			var top = ((originTop + self.__scrollTop) * level / oldLevel) - originTop;

			// Limit x-axis
			if (left > self.__maxScrollLeft) {
				left = self.__maxScrollLeft;
			} else if (left < 0) {
				left = 0;
			}

			// Limit y-axis
			if (top > self.__maxScrollTop) {
				top = self.__maxScrollTop;
			} else if (top < 0) {
				top = 0;
			}

			// Push values out
			self.__publish(left, top, level, animate);

		},


		/**
		 * Zooms the content by the given factor.
		 *
		 * @param factor {Number} Zoom by given factor
		 * @param animate {Boolean ? false} Whether to use animation
		 * @param originLeft {Number ? 0} Zoom in at given left coordinate
		 * @param originTop {Number ? 0} Zoom in at given top coordinate
		 */
		zoomBy: function(factor, animate, originLeft, originTop) {

			var self = this;

			self.zoomTo(self.__zoomLevel * factor, animate, originLeft, originTop);

		},


		/**
		 * Scrolls to the given position. Respect limitations and snapping automatically.
		 *
		 * @param left {Number?null} Horizontal scroll position, keeps current if value is <code>null</code>
		 * @param top {Number?null} Vertical scroll position, keeps current if value is <code>null</code>
		 * @param animate {Boolean?false} Whether the scrolling should happen using an animation
		 * @param zoom {Number?null} Zoom level to go to
		 */
		scrollTo: function(left, top, animate, zoom) {

      $(document).trigger("scrolledTo", [left, top, zoom] );

			var self = this;

			// Stop deceleration
			if (self.__isDecelerating) {
				core.effect.Animate.stop(self.__isDecelerating);
				self.__isDecelerating = false;
			}

			// Correct coordinates based on new zoom level
			if (zoom != null && zoom !== self.__zoomLevel) {

				if (!self.options.zooming) {
					throw new Error("Zooming is not enabled!");
				}

				left *= zoom;
				top *= zoom;

				// Recompute maximum values while temporary tweaking maximum scroll ranges
				self.__computeScrollMax(zoom);

			} else {

				// Keep zoom when not defined
				zoom = self.__zoomLevel;

			}

			if (!self.options.scrollingX) {

				left = self.__scrollLeft;

			} else {

				if (self.options.paging) {
					left = Math.round(left / self.__clientWidth) * self.__clientWidth;
				} else if (self.options.snapping) {
					left = Math.round(left / self.__snapWidth) * self.__snapWidth;
				}

			}

			if (!self.options.scrollingY) {

				top = self.__scrollTop;

			} else {

				if (self.options.paging) {
					top = Math.round(top / self.__clientHeight) * self.__clientHeight;
				} else if (self.options.snapping) {
					top = Math.round(top / self.__snapHeight) * self.__snapHeight;
				}

			}

			// Limit for allowed ranges
			left = Math.max(Math.min(self.__maxScrollLeft, left), 0);
			top = Math.max(Math.min(self.__maxScrollTop, top), 0);

			// Don't animate when no change detected, still call publish to make sure
			// that rendered position is really in-sync with internal data
			if (left === self.__scrollLeft && top === self.__scrollTop) {
				animate = false;
			}

			// Publish new values
			self.__publish(left, top, zoom, animate);

		},


		/**
		 * Scroll by the given offset
		 *
		 * @param left {Number ? 0} Scroll x-axis by given offset
		 * @param top {Number ? 0} Scroll x-axis by given offset
		 * @param animate {Boolean ? false} Whether to animate the given change
		 */
		scrollBy: function(left, top, animate) {

			var self = this;

			var startLeft = self.__isAnimating ? self.__scheduledLeft : self.__scrollLeft;
			var startTop = self.__isAnimating ? self.__scheduledTop : self.__scrollTop;

			self.scrollTo(startLeft + (left || 0), startTop + (top || 0), animate);

		},



		/*
		---------------------------------------------------------------------------
			EVENT CALLBACKS
		---------------------------------------------------------------------------
		*/

		/**
		 * Mouse wheel handler for zooming support
		 */
		doMouseZoom: function(wheelDelta, timeStamp, pageX, pageY) {

			var self = this;
			var change = wheelDelta > 0 ? 0.97 : 1.03;

			return self.zoomTo(self.__zoomLevel * change, false, pageX - self.__clientLeft, pageY - self.__clientTop);

		},


		/**
		 * Touch start handler for scrolling support
		 */
		doTouchStart: function(touches, timeStamp) {

			// Array-like check is enough here
			if (touches.length == null) {
				throw new Error("Invalid touch list: " + touches);
			}

			if (timeStamp instanceof Date) {
				timeStamp = timeStamp.valueOf();
			}
			if (typeof timeStamp !== "number") {
				throw new Error("Invalid timestamp value: " + timeStamp);
			}

			var self = this;

			// Stop deceleration
			if (self.__isDecelerating) {
				core.effect.Animate.stop(self.__isDecelerating);
				self.__isDecelerating = false;
			}

			// Stop animation
			if (self.__isAnimating) {
				core.effect.Animate.stop(self.__isAnimating);
				self.__isAnimating = false;
			}

			// Use center point when dealing with two fingers
			var currentTouchLeft, currentTouchTop;
			var isSingleTouch = touches.length === 1;
			if (isSingleTouch) {
				currentTouchLeft = touches[0].pageX;
				currentTouchTop = touches[0].pageY;
			} else {
				currentTouchLeft = Math.abs(touches[0].pageX + touches[1].pageX) / 2;
				currentTouchTop = Math.abs(touches[0].pageY + touches[1].pageY) / 2;
			}

			// Store initial positions
			self.__initialTouchLeft = currentTouchLeft;
			self.__initialTouchTop = currentTouchTop;

			// Store current zoom level
			self.__zoomLevelStart = self.__zoomLevel;

			// Store initial touch positions
			self.__lastTouchLeft = currentTouchLeft;
			self.__lastTouchTop = currentTouchTop;

			// Store initial move time stamp
			self.__lastTouchMove = timeStamp;

			// Reset initial scale
			self.__lastScale = 1;

			// Reset locking flags
			self.__enableScrollX = !isSingleTouch && self.options.scrollingX;
			self.__enableScrollY = !isSingleTouch && self.options.scrollingY;

			// Reset tracking flag
			self.__isTracking = true;

			// Dragging starts directly with two fingers, otherwise lazy with an offset
			self.__isDragging = !isSingleTouch;

			// Some features are disabled in multi touch scenarios
			self.__isSingleTouch = isSingleTouch;

			// Clearing data structure
			self.__positions = [];

		},


		/**
		 * Touch move handler for scrolling support
		 */
		doTouchMove: function(touches, timeStamp, scale) {

			// Array-like check is enough here
			if (touches.length == null) {
				throw new Error("Invalid touch list: " + touches);
			}

			if (timeStamp instanceof Date) {
				timeStamp = timeStamp.valueOf();
			}
			if (typeof timeStamp !== "number") {
				throw new Error("Invalid timestamp value: " + timeStamp);
			}

			var self = this;

			// Ignore event when tracking is not enabled (event might be outside of element)
			if (!self.__isTracking) {
				return;
			}


			var currentTouchLeft, currentTouchTop;

			// Compute move based around of center of fingers
			if (touches.length === 2) {
				currentTouchLeft = Math.abs(touches[0].pageX + touches[1].pageX) / 2;
				currentTouchTop = Math.abs(touches[0].pageY + touches[1].pageY) / 2;
			} else {
				currentTouchLeft = touches[0].pageX;
				currentTouchTop = touches[0].pageY;
			}

			var positions = self.__positions;

			// Are we already in dragging mode?
			if (self.__isDragging) {

				// Compute move distance
				var moveX = currentTouchLeft - self.__lastTouchLeft;
				var moveY = currentTouchTop - self.__lastTouchTop;

				// Read previous scroll position and zooming
				var scrollLeft = self.__scrollLeft;
				var scrollTop = self.__scrollTop;
				var level = self.__zoomLevel;

				// Work with scaling
				if (scale != null && self.options.zooming) {

					var oldLevel = level;

					// Recompute level based on previous scale and new scale
					level = level / self.__lastScale * scale;

					// Limit level according to configuration
					level = Math.max(Math.min(level, self.options.maxZoom), self.options.minZoom);

					// Only do further compution when change happened
					if (oldLevel !== level) {

						// Compute relative event position to container
						var currentTouchLeftRel = currentTouchLeft - self.__clientLeft;
						var currentTouchTopRel = currentTouchTop - self.__clientTop;

						// Recompute left and top coordinates based on new zoom level
						scrollLeft = ((currentTouchLeftRel + scrollLeft) * level / oldLevel) - currentTouchLeftRel;
						scrollTop = ((currentTouchTopRel + scrollTop) * level / oldLevel) - currentTouchTopRel;

						// Recompute max scroll values
						self.__computeScrollMax(level);

					}
				}

				if (self.__enableScrollX) {

					scrollLeft -= moveX;
					var maxScrollLeft = self.__maxScrollLeft;

					if (scrollLeft > maxScrollLeft || scrollLeft < 0) {

						// Slow down on the edges
						if (self.options.bouncing) {

							scrollLeft += (moveX / 2);

						} else if (scrollLeft > maxScrollLeft) {

							scrollLeft = maxScrollLeft;

						} else {

							scrollLeft = 0;

						}
					}
				}

				// Compute new vertical scroll position
				if (self.__enableScrollY) {

					scrollTop -= moveY;
					var maxScrollTop = self.__maxScrollTop;

					if (scrollTop > maxScrollTop || scrollTop < 0) {

						// Slow down on the edges
						if (self.options.bouncing) {

							scrollTop += (moveY / 2);

							// Support pull-to-refresh (only when only y is scrollable)
							if (!self.__enableScrollX && self.__refreshHeight != null) {

								if (!self.__refreshActive && scrollTop <= -self.__refreshHeight) {

									self.__refreshActive = true;
									if (self.__refreshActivate) {
										self.__refreshActivate();
									}

								} else if (self.__refreshActive && scrollTop > -self.__refreshHeight) {

									self.__refreshActive = false;
									if (self.__refreshDeactivate) {
										self.__refreshDeactivate();
									}

								}
							}

						} else if (scrollTop > maxScrollTop) {

							scrollTop = maxScrollTop;

						} else {

							scrollTop = 0;

						}
					}
				}

				// Keep list from growing infinitely (holding min 10, max 20 measure points)
				if (positions.length > 60) {
					positions.splice(0, 30);
				}

				// Track scroll movement for decleration
				positions.push(scrollLeft, scrollTop, timeStamp);

				// Sync scroll position
				self.__publish(scrollLeft, scrollTop, level);

			// Otherwise figure out whether we are switching into dragging mode now.
			} else {

				var minimumTrackingForScroll = self.options.locking ? 3 : 0;
				var minimumTrackingForDrag = 5;

				var distanceX = Math.abs(currentTouchLeft - self.__initialTouchLeft);
				var distanceY = Math.abs(currentTouchTop - self.__initialTouchTop);

				self.__enableScrollX = self.options.scrollingX && distanceX >= minimumTrackingForScroll;
				self.__enableScrollY = self.options.scrollingY && distanceY >= minimumTrackingForScroll;

				positions.push(self.__scrollLeft, self.__scrollTop, timeStamp);

				self.__isDragging = (self.__enableScrollX || self.__enableScrollY) && (distanceX >= minimumTrackingForDrag || distanceY >= minimumTrackingForDrag);

			}

			// Update last touch positions and time stamp for next event
			self.__lastTouchLeft = currentTouchLeft;
			self.__lastTouchTop = currentTouchTop;
			self.__lastTouchMove = timeStamp;
			self.__lastScale = scale;

		},


		/**
		 * Touch end handler for scrolling support
		 */
		doTouchEnd: function(timeStamp) {

			if (timeStamp instanceof Date) {
				timeStamp = timeStamp.valueOf();
			}
			if (typeof timeStamp !== "number") {
				throw new Error("Invalid timestamp value: " + timeStamp);
			}

			var self = this;

			// Ignore event when tracking is not enabled (no touchstart event on element)
			// This is required as this listener ('touchmove') sits on the document and not on the element itself.
			if (!self.__isTracking) {
				return;
			}

			// Not touching anymore (when two finger hit the screen there are two touch end events)
			self.__isTracking = false;

			// Be sure to reset the dragging flag now. Here we also detect whether
			// the finger has moved fast enough to switch into a deceleration animation.
			if (self.__isDragging) {

				// Reset dragging flag
				self.__isDragging = false;

				// Start deceleration
				// Verify that the last move detected was in some relevant time frame
				if (self.__isSingleTouch && self.options.animating && (timeStamp - self.__lastTouchMove) <= 100) {

					// Then figure out what the scroll position was about 100ms ago
					var positions = self.__positions;
					var endPos = positions.length - 1;
					var startPos = endPos;

					// Move pointer to position measured 100ms ago
					for (var i = endPos; i > 0 && positions[i] > (self.__lastTouchMove - 100); i -= 3) {
						startPos = i;
					}

					// If start and stop position is identical in a 100ms timeframe,
					// we cannot compute any useful deceleration.
					if (startPos !== endPos) {

						// Compute relative movement between these two points
						var timeOffset = positions[endPos] - positions[startPos];
						var movedLeft = self.__scrollLeft - positions[startPos - 2];
						var movedTop = self.__scrollTop - positions[startPos - 1];

						// Based on 50ms compute the movement to apply for each render step
						self.__decelerationVelocityX = movedLeft / timeOffset * (1000 / 60);
						self.__decelerationVelocityY = movedTop / timeOffset * (1000 / 60);

						// How much velocity is required to start the deceleration
						var minVelocityToStartDeceleration = self.options.paging || self.options.snapping ? 4 : 1;

						// Verify that we have enough velocity to start deceleration
						if (Math.abs(self.__decelerationVelocityX) > minVelocityToStartDeceleration || Math.abs(self.__decelerationVelocityY) > minVelocityToStartDeceleration) {

							// Deactivate pull-to-refresh when decelerating
							if (!self.__refreshActive) {

								self.__startDeceleration(timeStamp);

							}
						}
					}
				}
			}

			// If this was a slower move it is per default non decelerated, but this
			// still means that we want snap back to the bounds which is done here.
			// This is placed outside the condition above to improve edge case stability
			// e.g. touchend fired without enabled dragging. This should normally do not
			// have modified the scroll positions or even showed the scrollbars though.
			if (!self.__isDecelerating) {

				if (self.__refreshActive && self.__refreshStart) {

					// Use publish instead of scrollTo to allow scrolling to out of boundary position
					// We don't need to normalize scrollLeft, zoomLevel, etc. here because we only y-scrolling when pull-to-refresh is enabled
					self.__publish(self.__scrollLeft, -self.__refreshHeight, self.__zoomLevel, true);

					if (self.__refreshStart) {
						self.__refreshStart();
					}

				} else {

					self.scrollTo(self.__scrollLeft, self.__scrollTop, true, self.__zoomLevel);

					// Directly signalize deactivation (nothing todo on refresh?)
					if (self.__refreshActive) {

						self.__refreshActive = false;
						if (self.__refreshDeactivate) {
							self.__refreshDeactivate();
						}

					}
				}
			}

			// Fully cleanup list
			self.__positions.length = 0;

		},



		/*
		---------------------------------------------------------------------------
			PRIVATE API
		---------------------------------------------------------------------------
		*/

		/**
		 * Applies the scroll position to the content element
		 *
		 * @param left {Number} Left scroll position
		 * @param top {Number} Top scroll position
		 * @param animate {Boolean?false} Whether animation should be used to move to the new coordinates
		 */
		__publish: function(left, top, zoom, animate) {

			var self = this;

			// Remember whether we had an animation, then we try to continue based on the current "drive" of the animation
			var wasAnimating = self.__isAnimating;
			if (wasAnimating) {
				core.effect.Animate.stop(wasAnimating);
				self.__isAnimating = false;
			}

			if (animate && self.options.animating) {

				// Keep scheduled positions for scrollBy/zoomBy functionality
				self.__scheduledLeft = left;
				self.__scheduledTop = top;
				self.__scheduledZoom = zoom;

				var oldLeft = self.__scrollLeft;
				var oldTop = self.__scrollTop;
				var oldZoom = self.__zoomLevel;

				var diffLeft = left - oldLeft;
				var diffTop = top - oldTop;
				var diffZoom = zoom - oldZoom;

				var step = function(percent, now, render) {

					if (render) {

						self.__scrollLeft = oldLeft + (diffLeft * percent);
						self.__scrollTop = oldTop + (diffTop * percent);
						self.__zoomLevel = oldZoom + (diffZoom * percent);

						// Push values out
						if (self.__callback) {
							self.__callback(self.__scrollLeft, self.__scrollTop, self.__zoomLevel);
						}

					}
				};

				var verify = function(id) {
					return self.__isAnimating === id;
				};

				var completed = function(renderedFramesPerSecond, animationId, wasFinished) {
					if (animationId === self.__isAnimating) {
						self.__isAnimating = false;
					}

					if (self.options.zooming) {
						self.__computeScrollMax();
					}
				};

				// When continuing based on previous animation we choose an ease-out animation instead of ease-in-out
				self.__isAnimating = core.effect.Animate.start(step, verify, completed, 250, wasAnimating ? easeOutCubic : easeInOutCubic);

			} else {

				self.__scheduledLeft = self.__scrollLeft = left;
				self.__scheduledTop = self.__scrollTop = top;
				self.__scheduledZoom = self.__zoomLevel = zoom;

				// Push values out
				if (self.__callback) {
					self.__callback(left, top, zoom);
				}

				// Fix max scroll ranges
				if (self.options.zooming) {
					self.__computeScrollMax();
				}
			}
		},


		/**
		 * Recomputes scroll minimum values based on client dimensions and content dimensions.
		 */
		__computeScrollMax: function(zoomLevel) {

			var self = this;

			if (zoomLevel == null) {
				zoomLevel = self.__zoomLevel;
			}

			self.__maxScrollLeft = Math.max((self.__contentWidth * zoomLevel) - self.__clientWidth, 0);
			self.__maxScrollTop = Math.max((self.__contentHeight * zoomLevel) - self.__clientHeight, 0);

		},



		/*
		---------------------------------------------------------------------------
			ANIMATION (DECELERATION) SUPPORT
		---------------------------------------------------------------------------
		*/

		/**
		 * Called when a touch sequence end and the speed of the finger was high enough
		 * to switch into deceleration mode.
		 */
		__startDeceleration: function(timeStamp) {

			var self = this;

			if (self.options.paging) {

				var scrollLeft = Math.max(Math.min(self.__scrollLeft, self.__maxScrollLeft), 0);
				var scrollTop = Math.max(Math.min(self.__scrollTop, self.__maxScrollTop), 0);
				var clientWidth = self.__clientWidth;
				var clientHeight = self.__clientHeight;

				// We limit deceleration not to the min/max values of the allowed range, but to the size of the visible client area.
				// Each page should have exactly the size of the client area.
				self.__minDecelerationScrollLeft = Math.floor(scrollLeft / clientWidth) * clientWidth;
				self.__minDecelerationScrollTop = Math.floor(scrollTop / clientHeight) * clientHeight;
				self.__maxDecelerationScrollLeft = Math.ceil(scrollLeft / clientWidth) * clientWidth;
				self.__maxDecelerationScrollTop = Math.ceil(scrollTop / clientHeight) * clientHeight;

			} else {

				self.__minDecelerationScrollLeft = 0;
				self.__minDecelerationScrollTop = 0;
				self.__maxDecelerationScrollLeft = self.__maxScrollLeft;
				self.__maxDecelerationScrollTop = self.__maxScrollTop;

			}

			// Wrap class method
			var step = function(percent, now, render) {
				self.__stepThroughDeceleration(render);
			};

			// How much velocity is required to keep the deceleration running
			var minVelocityToKeepDecelerating = self.options.snapping ? 4 : 0.1;

			// Detect whether it's still worth to continue animating steps
			// If we are already slow enough to not being user perceivable anymore, we stop the whole process here.
			var verify = function() {
				return Math.abs(self.__decelerationVelocityX) >= minVelocityToKeepDecelerating || Math.abs(self.__decelerationVelocityY) >= minVelocityToKeepDecelerating;
			};

			var completed = function(renderedFramesPerSecond, animationId, wasFinished) {
				self.__isDecelerating = false;

				// Animate to grid when snapping is active, otherwise just fix out-of-boundary positions
				self.scrollTo(self.__scrollLeft, self.__scrollTop, self.options.snapping);
			};

			// Start animation and switch on flag
			self.__isDecelerating = core.effect.Animate.start(step, verify, completed);

		},


		/**
		 * Called on every step of the animation
		 *
		 * @param inMemory {Boolean?false} Whether to not render the current step, but keep it in memory only. Used internally only!
		 */
		__stepThroughDeceleration: function(render) {

			var self = this;


			//
			// COMPUTE NEXT SCROLL POSITION
			//

			// Add deceleration to scroll position
			var scrollLeft = self.__scrollLeft + self.__decelerationVelocityX;
			var scrollTop = self.__scrollTop + self.__decelerationVelocityY;


			//
			// HARD LIMIT SCROLL POSITION FOR NON BOUNCING MODE
			//

			if (!self.options.bouncing) {

				var scrollLeftFixed = Math.max(Math.min(self.__maxScrollLeft, scrollLeft), 0);
				if (scrollLeftFixed !== scrollLeft) {
					scrollLeft = scrollLeftFixed;
					self.__decelerationVelocityX = 0;
				}

				var scrollTopFixed = Math.max(Math.min(self.__maxScrollTop, scrollTop), 0);
				if (scrollTopFixed !== scrollTop) {
					scrollTop = scrollTopFixed;
					self.__decelerationVelocityY = 0;
				}

			}


			//
			// UPDATE SCROLL POSITION
			//

			if (render) {

				self.__publish(scrollLeft, scrollTop, self.__zoomLevel);

			} else {

				self.__scrollLeft = scrollLeft;
				self.__scrollTop = scrollTop;

			}


			//
			// SLOW DOWN
			//

			// Slow down velocity on every iteration
			if (!self.options.paging) {

				// This is the factor applied to every iteration of the animation
				// to slow down the process. This should emulate natural behavior where
				// objects slow down when the initiator of the movement is removed
				var frictionFactor = 0.95;

				self.__decelerationVelocityX *= frictionFactor;
				self.__decelerationVelocityY *= frictionFactor;

			}


			//
			// BOUNCING SUPPORT
			//

			if (self.options.bouncing) {

				var scrollOutsideX = 0;
				var scrollOutsideY = 0;

				// This configures the amount of change applied to deceleration/acceleration when reaching boundaries
				var penetrationDeceleration = 0.03;
				var penetrationAcceleration = 0.08;

				// Check limits
				if (scrollLeft < self.__minDecelerationScrollLeft) {
					scrollOutsideX = self.__minDecelerationScrollLeft - scrollLeft;
				} else if (scrollLeft > self.__maxDecelerationScrollLeft) {
					scrollOutsideX = self.__maxDecelerationScrollLeft - scrollLeft;
				}

				if (scrollTop < self.__minDecelerationScrollTop) {
					scrollOutsideY = self.__minDecelerationScrollTop - scrollTop;
				} else if (scrollTop > self.__maxDecelerationScrollTop) {
					scrollOutsideY = self.__maxDecelerationScrollTop - scrollTop;
				}

				// Slow down until slow enough, then flip back to snap position
				if (scrollOutsideX !== 0) {
					if (scrollOutsideX * self.__decelerationVelocityX <= 0) {
						self.__decelerationVelocityX += scrollOutsideX * penetrationDeceleration;
					} else {
						self.__decelerationVelocityX = scrollOutsideX * penetrationAcceleration;
					}
				}

				if (scrollOutsideY !== 0) {
					if (scrollOutsideY * self.__decelerationVelocityY <= 0) {
						self.__decelerationVelocityY += scrollOutsideY * penetrationDeceleration;
					} else {
						self.__decelerationVelocityY = scrollOutsideY * penetrationAcceleration;
					}
				}
			}
		}
	};

	// Copy over members to prototype
	for (var key in members) {
		Scroller.prototype[key] = members[key];
	}

})();
