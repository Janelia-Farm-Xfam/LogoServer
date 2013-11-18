/*

 HMM logo
 http://github.com/url/here
 Copyright 2013, Jody Clements.
 Licensed under the MIT License.
 http://url/to/license
*/
(function(c){function k(){if(!b){var a=document.createElement("canvas");b=!(!a.getContext||!a.getContext("2d"))}return b}function g(a,b){b=b||{};this.value=a;this.width=parseInt(b.width,10)||100;"W"===this.value&&(this.width+=30*this.width/100);this.height=parseInt(b.height,10)||100;this.color=b.color||"#000000";this.fontSize=b.fontSize||138;this.scaled=function(){};this.draw=function(a,b,e,y,u){var c=a.font;a.transform(e/this.width,0,0,b/this.height,y,u);a.fillStyle=this.color;a.textAlign="center";
a.font="bold "+this.fontSize+"px Arial";a.fillText(this.value,0,0);a.setTransform(1,0,0,1,0,0);a.fillStyle="#000000";a.font=c}}function m(a){function b(e,a,u){e.beginPath();e.moveTo(0,a);e.lineTo(u,a);e.lineWidth=1;e.strokeStyle="#999999";e.stroke()}function f(e,a,b,u,f){f=f||"#999999";e.beginPath();e.moveTo(a,b);e.lineTo(a,b+u);e.lineWidth=1;e.strokeStyle=f;e.stroke()}function d(e,a,b,u,f,c,d,l){e.font=f+"px Arial";e.fillStyle=d;e.fillRect(a,b-10,c,14);e.textAlign="center";e.fillStyle=l;e.fillText(u,
a+c/2,b)}a=a||{};this.column_width=a.column_width||34;this.height=a.height||300;this.data=a.data||null;this.debug=a.debug||null;this.scale_height_enabled=a.height_toggle||null;this.zoom_enabled=a.zoom_buttons&&"disabled"===a.zoom_buttons?null:!0;this.display_ali_map=0;this.alphabet=a.data.alphabet||"dna";this.dom_element=a.dom_element||c("body");this.called_on=a.called_on||null;this.start=a.start||1;this.end=a.end||this.data.height_arr.length;this.default_zoom=this.zoom=parseFloat(a.zoom)||0.4;this.data.max_height=
a.scaled_max?a.data.max_height_obs||this.data.max_height||2:a.data.max_height_theory||this.data.max_height||2;this.dna_colors={A:"#cbf751",C:"#5ec0cc",G:"#ffdf59",T:"#b51f16",U:"#b51f16"};this.aa_colors={A:"#FF9966",C:"#009999",D:"#FF0000",E:"#CC0033",F:"#00FF00",G:"#f2f20c",H:"#660033",I:"#CC9933",K:"#663300",L:"#FF9933",M:"#CC99CC",N:"#336666",P:"#0099FF",Q:"#6666CC",R:"#990000",S:"#0000FF",T:"#00FFFF",V:"#FFCC33",W:"#66CC66",Y:"#006600"};this.colors=this.dna_colors;"aa"===this.alphabet&&(this.colors=
this.aa_colors);this.canvas_width=5E3;this.letters={};a=null;for(a in this.colors)this.letters[a]=new g(a,{color:this.colors[a]});this.scrollme=null;this.previous_target=0;this.rendered=[];this.previous_zoom=0;this.render=function(e){if(this.data){e=e||{};var a=e.zoom||this.zoom,b=e.target||1,u=c(this.dom_element).parent().width(),f=1,d=0;if(b!==this.previous_target){this.previous_target=b;e.start&&(this.start=e.start);e.end&&(this.end=e.end);0.1>=a?a=0.1:1<=a&&(a=1);this.zoom=a;e=this.end||this.data.height_arr.length;
var h=this.start||1;e=e>this.data.height_arr.length?this.data.height_arr.length:e;e=e<h?h:e;h=h>e?e:h;h=1<h?h:1;this.y=this.height-20;this.max_width=this.column_width*(e-h+1);u>this.max_width&&(a=1,this.zoom_enabled=!1);this.zoom=a;this.zoomed_column=this.column_width*a;this.total_width=this.zoomed_column*(e-h+1);if(1>a)for(;this.total_width<u&&!(this.zoom+=0.1,this.zoomed_column=this.column_width*this.zoom,this.total_width=this.zoomed_column*(e-h+1),this.zoom_enabled=!1,1<=a););b>this.total_width&&
(b=this.total_width);c(this.dom_element).attr({width:this.total_width+"px"}).css({width:this.total_width+"px"});u=Math.ceil(this.total_width/this.canvas_width);this.columns_per_canvas=Math.ceil(this.canvas_width/this.zoomed_column);this.previous_zoom!==this.zoom&&(c(this.dom_element).find("canvas").remove(),this.previous_zoom=this.zoom,this.rendered=[]);this.canvases=[];this.contexts=[];for(d=0;d<u;d++){var l=this.columns_per_canvas*d+h,g=l+this.columns_per_canvas-1;g>e&&(g=e);var s=(g-l+1)*this.zoomed_column;
s>f&&(f=s);var p=f*d,x=p+s;if(b<x+x/2&&b>p-p/2&&1!==this.rendered[d]){var p=this.canvases,B=d,v=this.dom_element,t=this.height,m=s,C=d,D=f,z=c(v).find("#canv_"+C);z.length||(c(v).append('<canvas class="canvas_logo" id="canv_'+C+'"  height="'+t+'" width="'+m+'" style="left:'+D*C+'px"></canvas>'),z=c(v).find("#canv_"+C));c(z).attr("width",m).attr("height",t);k()||(z[0]=G_vmlCanvasManager.initElement(z[0]));p[B]=z[0];this.contexts[d]=this.canvases[d].getContext("2d");this.contexts[d].setTransform(1,
0,0,1,0,0);this.contexts[d].clearRect(0,0,s,this.height);this.contexts[d].fillStyle="#ffffff";this.contexts[d].fillRect(0,0,x,this.height);12<this.zoomed_column?(s=parseInt(10*a,10),s=10<s?10:s,this.debug&&this.render_with_rects(l,g,d,1),this.render_with_text(l,g,d,s)):this.render_with_rects(l,g,d);this.rendered[d]=1}}!this.scrollme&&k()&&(this.scrollme=new EasyScroller(c(this.dom_element)[0],{scrollingX:1,scrollingY:0,eventTarget:this.called_on}));1!==b&&k()&&this.scrollme.reflow()}}};this.render_x_axis_label=
function(){var e="Model Position";this.display_ali_map&&(e="Alignment Column");c(this.called_on).find(".logo_xaxis").remove();c(this.called_on).prepend('<div class="logo_xaxis" class="centered" style="margin-left:40px"><p class="xaxis_text" style="width:10em;margin:1em auto">'+e+"</p></div>")};this.render_y_axis_label=function(){c(this.dom_element).parent().before('<canvas class="logo_yaxis" height="300" width="55"></canvas>');var e=c(this.called_on).find(".logo_yaxis");Math.abs(this.data.max_height);
isNaN(this.data.min_height_obs)||parseInt(this.data.min_height_obs,10);k()||(e[0]=G_vmlCanvasManager.initElement(e[0]));var e=e[0].getContext("2d"),a="Information Content (bits)";e.beginPath();e.moveTo(55,1);e.lineTo(40,1);e.moveTo(55,256);e.lineTo(40,256);e.moveTo(55,128);e.lineTo(40,128);e.lineWidth=1;e.strokeStyle="#666666";e.stroke();e.fillStyle="#666666";e.textAlign="right";e.font="bold 10px Arial";e.textBaseline="top";e.fillText(parseFloat(this.data.max_height).toFixed(1),38,0);e.textBaseline=
"middle";e.fillText(parseFloat(this.data.max_height/2).toFixed(1),38,128);e.fillText("0",38,256);"score"===this.data.height_calc&&(a="Score (bits)");e.save();e.translate(5,this.height/2-20);e.rotate(-Math.PI/2);e.textAlign="center";e.font="normal 12px Arial";e.fillText(a,1,0);e.restore();e.fillText("occupancy",55,263);e.fillText("ins. prob.",50,280);e.fillText("ins. len.",46,296)};this.render_x_axis_label();this.render_y_axis_label();this.render_with_text=function(a,y,c,r){var n=0,g=a,h=null,l=0,
l=Math.abs(this.data.max_height),h=isNaN(this.data.min_height_obs)?0:parseInt(this.data.min_height_obs,10),l=l+Math.abs(h),l=Math.round(100*Math.abs(this.data.max_height)/l);Math.round(256*l/100);y+3<=this.end&&(y+=3);for(l=a;l<=y;l++){if(this.data.mmline&&1===this.data.mmline[l-1])this.contexts[c].fillStyle="#cccccc",this.contexts[c].fillRect(n,10,this.zoomed_column,this.height-40);else if(a=this.data.height_arr[l-1],h=[],a){for(var q=0,s=a.length,p=0,p=0;p<s;p++){var x=a[p].split(":",2),m=n+this.zoomed_column/
2,v=null;if(0.01<x[1]){var v=parseFloat(x[1])/this.data.max_height,x=255-q,t=255*v;k()||(x+=t*(v/2));h[p]=[t,this.zoomed_column,m,x];q+=t}}for(p=s;0<=p;p--)h[p]&&this.letters[a[p][0]]&&this.letters[a[p][0]].draw(this.contexts[c],h[p][0],h[p][1],h[p][2],h[p][3])}f(this.contexts[c],n,this.height-15,5);f(this.contexts[c],n,this.height-30,5);f(this.contexts[c],n,this.height-45,5);h=this.display_ali_map?this.data.ali_map[l-1]:g;0.7>this.zoom?0===l%5&&this.draw_column_divider({context_num:c,x:n,fontsize:10,
column_num:h,ralign:!0}):this.draw_column_divider({context_num:c,x:n,fontsize:r,column_num:h});a=this.data.delete_probs[l-1];h=this.height-35;q="#ffffff";s="#555555";0.75>a?(q="#2171b5",s="#ffffff"):0.85>a?q="#6baed6":0.95>a&&(q="#bdd7e7");d(this.contexts[c],n,h,a,r,this.zoomed_column,q,s);a=this.contexts[c];h=n;q=this.height;s=this.zoomed_column;p=this.data.insert_probs[l-1];m=q-20;v="#ffffff";x="#555555";0.1<p?(v="#d7301f",x="#ffffff"):0.05<p?v="#fc8d59":0.03<p&&(v="#fdcc8a");d(a,h,m,p,r,s,v,x);
0.03<p&&f(a,h+s,q-30,-30-q,v);a=this.data.insert_lengths[l-1];h="#ffffff";q="#555555";9<a?(h="#d7301f",q="#ffffff"):7<a?h="#fc8d59":4<a&&(h="#fdcc8a");d(this.contexts[c],n,this.height-5,a,r,this.zoomed_column,h,q);n+=this.zoomed_column;g++}b(this.contexts[c],this.height-15,this.total_width);b(this.contexts[c],this.height-30,this.total_width);b(this.contexts[c],this.height-45,this.total_width);b(this.contexts[c],0,this.total_width)};this.draw_column_divider=function(a){var b=a.ralign?a.x+this.zoomed_column:
a.x,u=a.ralign?a.x+2:a.x;f(this.contexts[a.context_num],b,this.height-30,-30-this.height,"#dddddd");f(this.contexts[a.context_num],b,0,5);var b=this.contexts[a.context_num],c=this.zoomed_column,d=a.column_num,g=a.ralign;b.font=a.fontsize+"px Arial";b.textAlign=g?"right":"center";b.fillStyle="#666666";b.fillText(d,u+c/2,10)};this.render_with_rects=function(a,c,d,g){var n=0,w=a,h=null,l=0,l=Math.abs(this.data.max_height),q=Math.abs(this.data.min_height_obs),l=l+q,l=Math.round(100*Math.abs(this.data.max_height)/
l);Math.round(256*l/100);q=10;for(l=a;l<=c;l++){if(this.data.mmline&&1===this.data.mmline[l-1])this.contexts[d].fillStyle="#cccccc",this.contexts[d].fillRect(n,10,this.zoomed_column,this.height-40);else{a=this.data.height_arr[l-1];for(var h=0,s=a.length,p=0,p=0;p<s;p++){var k=a[p].split(":",2);if(0.01<k[1]){var m=parseFloat(k[1])/this.data.max_height,v=n,m=256*m,t=256-h-m;g?(this.contexts[d].strokeStyle=this.colors[k[0]],this.contexts[d].strokeRect(v,t,this.zoomed_column,m)):(this.contexts[d].fillStyle=
this.colors[k[0]],this.contexts[d].fillRect(v,t,this.zoomed_column,m));h+=m}}}0.2>this.zoom?q=20:0.3>this.zoom&&(q=10);0===l%q&&(f(this.contexts[d],n+this.zoomed_column,this.height-30,parseFloat(this.height),"#dddddd"),f(this.contexts[d],n+this.zoomed_column,0,5),h=this.display_ali_map?this.data.ali_map[l-1]:w,a=this.contexts[d],s=n-2,p=this.zoomed_column,a.font="10px Arial",a.textAlign="right",a.fillStyle="#666666",a.fillText(h,s+p/2,10));a=this.contexts[d];h=n;s=this.height-42;p=this.zoomed_column;
k=this.data.insert_probs[l-1]/100;v=this.data.insert_lengths[l-1];m=this.data.delete_probs[l-1]/100;t="#ffffff";0.1<k?t="#d7301f":0.05<k?t="#fc8d59":0.03<k&&(t="#fdcc8a");a.fillStyle=t;a.fillRect(h,s+12,p,10);t="#ffffff";9<v?t="#d7301f":7<v?t="#fc8d59":4<v&&(t="#fdcc8a");a.fillStyle=t;a.fillRect(h,s+24,p,10);t="#ffffff";0.25<m?t="#2171b5":0.15<m?t="#6baed6":0.05<m&&(t="#bdd7e7");a.fillStyle=t;a.fillRect(h,s,p,10);b(this.contexts[d],this.height-45,this.total_width);b(this.contexts[d],0,this.total_width);
n+=this.zoomed_column;w++}};this.toggle_scale=function(){var a=this.current_column();this.data.max_height=this.data.max_height===this.data.max_height_obs?this.data.max_height_theory:this.data.max_height_obs;this.rendered=[];c(this.called_on).find(".logo_yaxis").remove();this.render_y_axis_label();this.scrollme.reflow();this.scrollToColumn(a+1);this.scrollToColumn(a)};this.toggle_ali_map=function(){var a=this.current_column();this.display_ali_map=1===this.display_ali_map?0:1;this.render_x_axis_label();
this.rendered=[];this.scrollme.reflow();this.scrollToColumn(a+1);this.scrollToColumn(a)};this.current_column=function(){var a=this.scrollme.scroller.getValues().left,b=this.column_width*this.zoom,a=a/b,b=c(this.called_on).find(".logo_container").width()/b/2;return Math.ceil(a+b)};this.change_zoom=function(a){var b=0.3;a.target?b=a.target:a.distance&&(b=(parseFloat(this.zoom)-parseFloat(a.distance)).toFixed(1),"+"===a.direction&&(b=(parseFloat(this.zoom)+parseFloat(a.distance)).toFixed(1)));1<b?b=
1:0.1>b&&(b=0.1);c(this.called_on).find(".logo_graphic").width()*b/this.zoom>c(this.called_on).find(".logo_container").width()&&(a.column?(this.zoom=b,this.render({zoom:this.zoom}),this.scrollme.reflow(),b=this.coordinatesFromColumn(a.column),this.scrollme.scroller.scrollTo(b-a.offset)):(a=this.current_column(),this.zoom=b,this.render({zoom:this.zoom}),this.scrollme.reflow(),this.scrollToColumn(a)));return this.zoom};this.columnFromCoordinates=function(a){return Math.ceil(a/(this.column_width*this.zoom))};
this.coordinatesFromColumn=function(a){return(a-1)*this.column_width*this.zoom+this.column_width*this.zoom/2};this.scrollToColumn=function(a,b){var d=c(this.called_on).find(".logo_container").width()/2,u=this.coordinatesFromColumn(a);this.scrollme.scroller.scrollTo(u-d,0,b)}}var b=null;c.fn.hmm_logo=function(a){var b=null,f=c('<div class="logo_graphic">');if(k()){a=a||{};c(this).append(c('<div class="logo_container">').append(f).append('<div class="logo_divider">'));a.data=c(this).data("logo");if(null===
a.data)return;a.dom_element=f;a.called_on=this;var d=c('<form class="logo_form"><fieldset><label for="position">Column number</label><input type="text" name="position" class="logo_position"></input><button class="button logo_change">Go</button></fieldset></form>'),e=c('<div class="logo_controls">'),b=new m(a);b.render(a);b.zoom_enabled&&e.append('<button class="logo_zoomout button">-</button><button class="logo_zoomin button">+</button>');b.scale_height_enabled&&b.data.max_height_obs<b.data.max_height_theory&&
e.append('<button class="logo_scale button">Toggle Scale</button>');b.data.ali_map&&e.append('<button class="logo_ali_map button">Toggle Alignment Coordinates</button>');d.append(e);c(this).append(d);c(this).find(".logo_reset").bind("click",function(a){a.preventDefault();a=b;a.change_zoom({target:a.default_zoom})});c(this).find(".logo_change").bind("click",function(a){a.preventDefault()});c(this).find(".logo_zoomin").bind("click",function(a){a.preventDefault();b.change_zoom({distance:0.1,direction:"+"})});
c(this).find(".logo_zoomout").bind("click",function(a){a.preventDefault();b.change_zoom({distance:0.1,direction:"-"})});c(this).find(".logo_scale").bind("click",function(a){a.preventDefault();b.toggle_scale()});c(this).find(".logo_ali_map").bind("click",function(a){a.preventDefault();b.toggle_ali_map()});c(this).find(".logo_position").bind("change",function(){var a=b;this.value.match(/^\d+$/m)&&a.scrollToColumn(this.value,1)});f.bind("dblclick",function(a){var d=b,e=c(this).offset(),e=parseInt(a.pageX-
e.left,10);a=a.pageX-c(this).parent().offset().left;e=d.columnFromCoordinates(e);1>d.zoom?d.change_zoom({target:1,offset:a,column:e}):d.change_zoom({target:0.3,offset:a,column:e})});a.column_info&&f.bind("click",function(d){var e=b,f=c('<table class="logo_col_info"></table>'),g="<tr>",k="",h=c(this).offset();d=parseInt(d.pageX-h.left,10);c(this).parent().offset();e=e.columnFromCoordinates(d);d=[];var l=h=0,q=0,q="Probability";b.data.height_calc&&"score"===b.data.height_calc?(q="Score",d=b.data.height_arr[e-
1].slice(0).reverse()):d=b.data.probs_arr[e-1].slice(0).reverse();h=Math.ceil(d.length/5);for(l=0;l<h;l++)g=1<h&&l<h-1?g+('<th>Residue</th><th class="odd">'+q+"</th>"):g+("<th>Residue</th><th>"+q+"</th>");f.append(c(g+"</tr>"));for(l=0;5>l;l++){k+="<tr>";for(q=l;d[q];)g=d[q].split(":",2),k=1<h&&15>q?k+('<td class="'+b.alphabet+"_"+g[0]+'"><div></div>'+g[0]+'</td><td class="odd">'+g[1]+"</td>"):k+('<td class="'+b.alphabet+"_"+g[0]+'"><div></div>'+g[0]+"</td><td>"+g[1]+"</td>"),q+=5;k+="</tr>"}f.append(c(k));
c(a.column_info).empty().append(c("<p> Column:"+e+"</p><div><p>Occupancy: "+b.data.delete_probs[e-1]+"</p><p>Insert Probability: "+b.data.insert_probs[e-1]+"</p><p>Insert Length: "+b.data.insert_lengths[e-1]+"</p></div>")).append(f).show()});c(document).bind(this.attr("id")+".scrolledTo",function(a,d,e,c){b.render({target:d})});c(document).keydown(function(a){a.ctrlKey||(61!==a.which&&107!==a.which||b.change_zoom({distance:0.1,direction:"+"}),109!==a.which&&0!==a.which||b.change_zoom({distance:0.1,
direction:"-"}))})}else c("#logo").replaceWith(c("#no_canvas").html());return b}})(jQuery);/*

 Scroller
 http://github.com/zynga/scroller

 Copyright 2011, Zynga Inc.
 Licensed under the MIT License.
 https://raw.github.com/zynga/scroller/master/MIT-LICENSE.txt

 Based on the work of: Unify Project (unify-project.org)
 http://unify-project.org
 Copyright 2011, Deutsche Telekom AG
 License: MIT + Apache (V2)

 Inspired by: https://github.com/inexorabletash/raf-shim/blob/master/raf.js
*/
(function(c){if(!c.requestAnimationFrame){var k=Date.now||function(){return+new Date},g=Object.keys||function(a){var b={},c;for(c in a)b[c]=!0;return b},m=Object.empty||function(a){for(var b in a)return!1;return!0},b=function(){for(var a=["webkit","moz","o","ms"],b=0;4>b;b++)if(null!=c[a[b]+"RequestAnimationFrame"])return a[b]}();if(b)c.requestAnimationFrame=c[b+"RequestAnimationFrame"],c.cancelRequestAnimationFrame=c[b+"CancelRequestAnimationFrame"];else{var a={},u=1,f=null;c.requestAnimationFrame=
function(b,e){var c=u++;a[c]=b;null===f&&(f=setTimeout(function(){var b=k(),d=a,e=g(d);a={};f=null;for(var c=0,u=e.length;c<u;c++)d[e[c]](b)},1E3/60));return c};c.cancelRequestAnimationFrame=function(b){delete a[b];m(a)&&(clearTimeout(f),f=null)}}}})(this);
(function(c){var k=Date.now||function(){return+new Date},g={},m=1;c.core?core.effect||(core.effect={}):c.core={effect:{}};core.effect.Animate={stop:function(b){var a=null!=g[b];a&&(g[b]=null);return a},isRunning:function(b){return null!=g[b]},start:function(b,a,c,f,d,e){var y=k(),A=y,r=0,n=0,w=m++;e||(e=document.body);if(0===w%20){var h={},l;for(l in g)h[l]=!0;g=h}var q=function(l){l=!0!==l;var h=k();if(!g[w]||a&&!a(w))g[w]=null,c&&c(60-n/((h-y)/1E3),w,!1);else{if(l)for(var m=Math.round((h-A)/(1E3/
60))-1,B=0;B<Math.min(m,4);B++)q(!0),n++;f&&(r=(h-y)/f,1<r&&(r=1));m=d?d(r):r;!1!==b(m,h,l)&&1!==r||!l?l&&(A=h,requestAnimationFrame(q,e)):(g[w]=null,c&&c(60-n/((h-y)/1E3),w,1===r||null==f))}};g[w]=!0;requestAnimationFrame(q,e);return w}}})(this);
var EasyScroller=function(c,k){this.content=c;this.container=c.parentNode;this.options=k||{};var g=this;this.scroller=new Scroller(function(c,b,a){g.render(c,b,a)},k);this.bindEvents();this.content.style[EasyScroller.vendorPrefix+"TransformOrigin"]="left top";this.reflow()};
EasyScroller.prototype.render=function(){var c=document.documentElement.style,k;window.opera&&"[object Opera]"===Object.prototype.toString.call(opera)?k="presto":"MozAppearance"in c?k="gecko":"WebkitAppearance"in c?k="webkit":"string"===typeof navigator.cpuClass&&(k="trident");c=EasyScroller.vendorPrefix={trident:"ms",gecko:"Moz",webkit:"Webkit",presto:"O"}[k];k=document.createElement("div");var g=c+"Transform";return void 0!==k.style[c+"Perspective"]?function(c,b,a){this.content.style[g]="translate3d("+
-c+"px,"+-b+"px,0) scale("+a+")"}:void 0!==k.style[g]?function(c,b,a){this.content.style[g]="translate("+-c+"px,"+-b+"px) scale("+a+")"}:function(c,b,a){this.content.style.marginLeft=c?-c/a+"px":"";this.content.style.marginTop=b?-b/a+"px":"";this.content.style.zoom=a||""}}();
EasyScroller.prototype.reflow=function(){this.scroller.setDimensions(this.container.clientWidth,this.container.clientHeight,this.content.offsetWidth,this.content.offsetHeight);var c=this.container.getBoundingClientRect();this.scroller.setPosition(c.left+this.container.clientLeft,c.top+this.container.clientTop)};
EasyScroller.prototype.bindEvents=function(){var c=this;$(window).bind("resize",function(){c.reflow()});$("#modelTab").bind("click",function(){c.reflow()});if("ontouchstart"in window)this.container.addEventListener("touchstart",function(g){g.touches[0]&&g.touches[0].target&&g.touches[0].target.tagName.match(/input|textarea|select/i)||(c.scroller.doTouchStart(g.touches,(new Date).getTime()),g.preventDefault())},!1),document.addEventListener("touchmove",function(g){c.scroller.doTouchMove(g.touches,
(new Date).getTime(),g.scale)},!1),document.addEventListener("touchend",function(g){c.scroller.doTouchEnd((new Date).getTime())},!1),document.addEventListener("touchcancel",function(g){c.scroller.doTouchEnd((new Date).getTime())},!1);else{var k=!1;$(this.container).bind("mousedown",function(g){g.target.tagName.match(/input|textarea|select/i)||(c.scroller.doTouchStart([{pageX:g.pageX,pageY:g.pageY}],(new Date).getTime()),k=!0,g.preventDefault())});$(document).bind("mousemove",function(g){k&&(c.scroller.doTouchMove([{pageX:g.pageX,
pageY:g.pageY}],(new Date).getTime()),k=!0)});$(document).bind("mouseup",function(g){k&&(c.scroller.doTouchEnd((new Date).getTime()),k=!1)});$(this.container).bind("mousewheel",function(g){c.options.zooming&&(c.scroller.doMouseZoom(g.wheelDelta,(new Date).getTime(),g.pageX,g.pageY),g.preventDefault())})}};var Scroller;
(function(){Scroller=function(b,a){this.__callback=b;this.options={scrollingX:!0,scrollingY:!0,animating:!0,bouncing:!0,locking:!0,paging:!1,snapping:!1,zooming:!1,minZoom:0.5,maxZoom:3,eventTarget:null};for(var c in a)this.options[c]=a[c]};var c=function(b){return Math.pow(b-1,3)+1},k=function(b){return 1>(b/=0.5)?0.5*Math.pow(b,3):0.5*(Math.pow(b-2,3)+2)},g={__isSingleTouch:!1,__isTracking:!1,__isGesturing:!1,__isDragging:!1,__isDecelerating:!1,__isAnimating:!1,__clientLeft:0,__clientTop:0,__clientWidth:0,
__clientHeight:0,__contentWidth:0,__contentHeight:0,__snapWidth:100,__snapHeight:100,__refreshHeight:null,__refreshActive:!1,__refreshActivate:null,__refreshDeactivate:null,__refreshStart:null,__zoomLevel:1,__scrollLeft:0,__scrollTop:0,__maxScrollLeft:0,__maxScrollTop:0,__scheduledLeft:0,__scheduledTop:0,__scheduledZoom:0,__lastTouchLeft:null,__lastTouchTop:null,__lastTouchMove:null,__positions:null,__minDecelerationScrollLeft:null,__minDecelerationScrollTop:null,__maxDecelerationScrollLeft:null,
__maxDecelerationScrollTop:null,__decelerationVelocityX:null,__decelerationVelocityY:null,setDimensions:function(b,a,c,f){b&&(this.__clientWidth=b);a&&(this.__clientHeight=a);c&&(this.__contentWidth=c);f&&(this.__contentHeight=f);this.__computeScrollMax();this.scrollTo(this.__scrollLeft,this.__scrollTop,!0)},setPosition:function(b,a){this.__clientLeft=b||0;this.__clientTop=a||0},setSnapSize:function(b,a){this.__snapWidth=b;this.__snapHeight=a},activatePullToRefresh:function(b,a,c,f){this.__refreshHeight=
b;this.__refreshActivate=a;this.__refreshDeactivate=c;this.__refreshStart=f},finishPullToRefresh:function(){this.__refreshActive=!1;this.__refreshDeactivate&&this.__refreshDeactivate();this.scrollTo(this.__scrollLeft,this.__scrollTop,!0)},getValues:function(){return{left:this.__scrollLeft,top:this.__scrollTop,zoom:this.__zoomLevel}},getScrollMax:function(){return{left:this.__maxScrollLeft,top:this.__maxScrollTop}},zoomTo:function(b,a,c,f){if(!this.options.zooming)throw Error("Zooming is not enabled!");
this.__isDecelerating&&(core.effect.Animate.stop(this.__isDecelerating),this.__isDecelerating=!1);var d=this.__zoomLevel;null==c&&(c=this.__clientWidth/2);null==f&&(f=this.__clientHeight/2);b=Math.max(Math.min(b,this.options.maxZoom),this.options.minZoom);this.__computeScrollMax(b);c=(c+this.__scrollLeft)*b/d-c;f=(f+this.__scrollTop)*b/d-f;c>this.__maxScrollLeft?c=this.__maxScrollLeft:0>c&&(c=0);f>this.__maxScrollTop?f=this.__maxScrollTop:0>f&&(f=0);this.__publish(c,f,b,a)},zoomBy:function(b,a,c,
f){this.zoomTo(this.__zoomLevel*b,a,c,f)},scrollTo:function(b,a,c,f){$(document).trigger(this.options.eventTarget.attr("id")+".scrolledTo",[b,a,f]);this.__isDecelerating&&(core.effect.Animate.stop(this.__isDecelerating),this.__isDecelerating=!1);if(null!=f&&f!==this.__zoomLevel){if(!this.options.zooming)throw Error("Zooming is not enabled!");b*=f;a*=f;this.__computeScrollMax(f)}else f=this.__zoomLevel;this.options.scrollingX?this.options.paging?b=Math.round(b/this.__clientWidth)*this.__clientWidth:
this.options.snapping&&(b=Math.round(b/this.__snapWidth)*this.__snapWidth):b=this.__scrollLeft;this.options.scrollingY?this.options.paging?a=Math.round(a/this.__clientHeight)*this.__clientHeight:this.options.snapping&&(a=Math.round(a/this.__snapHeight)*this.__snapHeight):a=this.__scrollTop;b=Math.max(Math.min(this.__maxScrollLeft,b),0);a=Math.max(Math.min(this.__maxScrollTop,a),0);b===this.__scrollLeft&&a===this.__scrollTop&&(c=!1);this.__publish(b,a,f,c)},scrollBy:function(b,a,c){this.scrollTo((this.__isAnimating?
this.__scheduledLeft:this.__scrollLeft)+(b||0),(this.__isAnimating?this.__scheduledTop:this.__scrollTop)+(a||0),c)},doMouseZoom:function(b,a,c,f){return this.zoomTo(this.__zoomLevel*(0<b?0.97:1.03),!1,c-this.__clientLeft,f-this.__clientTop)},doTouchStart:function(b,a){if(null==b.length)throw Error("Invalid touch list: "+b);a instanceof Date&&(a=a.valueOf());if("number"!==typeof a)throw Error("Invalid timestamp value: "+a);this.__isDecelerating&&(core.effect.Animate.stop(this.__isDecelerating),this.__isDecelerating=
!1);this.__isAnimating&&(core.effect.Animate.stop(this.__isAnimating),this.__isAnimating=!1);var c,f,d=1===b.length;d?(c=b[0].pageX,f=b[0].pageY):(c=Math.abs(b[0].pageX+b[1].pageX)/2,f=Math.abs(b[0].pageY+b[1].pageY)/2);this.__initialTouchLeft=c;this.__initialTouchTop=f;this.__zoomLevelStart=this.__zoomLevel;this.__lastTouchLeft=c;this.__lastTouchTop=f;this.__lastTouchMove=a;this.__lastScale=1;this.__enableScrollX=!d&&this.options.scrollingX;this.__enableScrollY=!d&&this.options.scrollingY;this.__isTracking=
!0;this.__isDragging=!d;this.__isSingleTouch=d;this.__positions=[]},doTouchMove:function(b,a,c){if(null==b.length)throw Error("Invalid touch list: "+b);a instanceof Date&&(a=a.valueOf());if("number"!==typeof a)throw Error("Invalid timestamp value: "+a);if(this.__isTracking){var f;2===b.length?(f=Math.abs(b[0].pageX+b[1].pageX)/2,b=Math.abs(b[0].pageY+b[1].pageY)/2):(f=b[0].pageX,b=b[0].pageY);var d=this.__positions;if(this.__isDragging){var e=f-this.__lastTouchLeft,g=b-this.__lastTouchTop,k=this.__scrollLeft,
r=this.__scrollTop,n=this.__zoomLevel;if(null!=c&&this.options.zooming){var m=n,n=n/this.__lastScale*c,n=Math.max(Math.min(n,this.options.maxZoom),this.options.minZoom);if(m!==n){var h=f-this.__clientLeft,l=b-this.__clientTop,k=(h+k)*n/m-h,r=(l+r)*n/m-l;this.__computeScrollMax(n)}}this.__enableScrollX&&(k-=e,m=this.__maxScrollLeft,k>m||0>k)&&(k=this.options.bouncing?k+e/2:k>m?m:0);this.__enableScrollY&&(r-=g,e=this.__maxScrollTop,r>e||0>r)&&(this.options.bouncing?(r+=g/2,this.__enableScrollX||null==
this.__refreshHeight||(!this.__refreshActive&&r<=-this.__refreshHeight?(this.__refreshActive=!0,this.__refreshActivate&&this.__refreshActivate()):this.__refreshActive&&r>-this.__refreshHeight&&(this.__refreshActive=!1,this.__refreshDeactivate&&this.__refreshDeactivate()))):r=r>e?e:0);60<d.length&&d.splice(0,30);d.push(k,r,a);this.__publish(k,r,n)}else g=this.options.locking?3:0,k=Math.abs(f-this.__initialTouchLeft),r=Math.abs(b-this.__initialTouchTop),this.__enableScrollX=this.options.scrollingX&&
k>=g,this.__enableScrollY=this.options.scrollingY&&r>=g,d.push(this.__scrollLeft,this.__scrollTop,a),this.__isDragging=(this.__enableScrollX||this.__enableScrollY)&&(5<=k||5<=r);this.__lastTouchLeft=f;this.__lastTouchTop=b;this.__lastTouchMove=a;this.__lastScale=c}},doTouchEnd:function(b){b instanceof Date&&(b=b.valueOf());if("number"!==typeof b)throw Error("Invalid timestamp value: "+b);if(this.__isTracking){this.__isTracking=!1;if(this.__isDragging&&(this.__isDragging=!1,this.__isSingleTouch&&this.options.animating&&
100>=b-this.__lastTouchMove)){for(var a=this.__positions,c=a.length-1,f=c,d=c;0<d&&a[d]>this.__lastTouchMove-100;d-=3)f=d;f!==c&&(c=a[c]-a[f],d=this.__scrollTop-a[f-1],this.__decelerationVelocityX=(this.__scrollLeft-a[f-2])/c*(1E3/60),this.__decelerationVelocityY=d/c*(1E3/60),a=this.options.paging||this.options.snapping?4:1,Math.abs(this.__decelerationVelocityX)>a||Math.abs(this.__decelerationVelocityY)>a)&&(this.__refreshActive||this.__startDeceleration(b))}this.__isDecelerating||(this.__refreshActive&&
this.__refreshStart?(this.__publish(this.__scrollLeft,-this.__refreshHeight,this.__zoomLevel,!0),this.__refreshStart&&this.__refreshStart()):(this.scrollTo(this.__scrollLeft,this.__scrollTop,!0,this.__zoomLevel),this.__refreshActive&&(this.__refreshActive=!1,this.__refreshDeactivate&&this.__refreshDeactivate())));this.__positions.length=0}},__publish:function(b,a,g,f){var d=this,e=d.__isAnimating;e&&(core.effect.Animate.stop(e),d.__isAnimating=!1);if(f&&d.options.animating){d.__scheduledLeft=b;d.__scheduledTop=
a;d.__scheduledZoom=g;var m=d.__scrollLeft,A=d.__scrollTop,r=d.__zoomLevel,n=b-m,w=a-A,h=g-r;d.__isAnimating=core.effect.Animate.start(function(a,b,c){c&&(d.__scrollLeft=m+n*a,d.__scrollTop=A+w*a,d.__zoomLevel=r+h*a,d.__callback&&d.__callback(d.__scrollLeft,d.__scrollTop,d.__zoomLevel))},function(a){return d.__isAnimating===a},function(a,b,c){b===d.__isAnimating&&(d.__isAnimating=!1);d.options.zooming&&d.__computeScrollMax()},250,e?c:k)}else d.__scheduledLeft=d.__scrollLeft=b,d.__scheduledTop=d.__scrollTop=
a,d.__scheduledZoom=d.__zoomLevel=g,d.__callback&&d.__callback(b,a,g),d.options.zooming&&d.__computeScrollMax()},__computeScrollMax:function(b){null==b&&(b=this.__zoomLevel);this.__maxScrollLeft=Math.max(this.__contentWidth*b-this.__clientWidth,0);this.__maxScrollTop=Math.max(this.__contentHeight*b-this.__clientHeight,0)},__startDeceleration:function(b){var a=this;if(a.options.paging){b=Math.max(Math.min(a.__scrollLeft,a.__maxScrollLeft),0);var c=Math.max(Math.min(a.__scrollTop,a.__maxScrollTop),
0),f=a.__clientWidth,d=a.__clientHeight;a.__minDecelerationScrollLeft=Math.floor(b/f)*f;a.__minDecelerationScrollTop=Math.floor(c/d)*d;a.__maxDecelerationScrollLeft=Math.ceil(b/f)*f;a.__maxDecelerationScrollTop=Math.ceil(c/d)*d}else a.__minDecelerationScrollLeft=0,a.__minDecelerationScrollTop=0,a.__maxDecelerationScrollLeft=a.__maxScrollLeft,a.__maxDecelerationScrollTop=a.__maxScrollTop;var e=a.options.snapping?4:0.1;a.__isDecelerating=core.effect.Animate.start(function(b,c,d){a.__stepThroughDeceleration(d)},
function(){return Math.abs(a.__decelerationVelocityX)>=e||Math.abs(a.__decelerationVelocityY)>=e},function(b,c,d){a.__isDecelerating=!1;a.scrollTo(a.__scrollLeft,a.__scrollTop,a.options.snapping)})},__stepThroughDeceleration:function(b){var a=this.__scrollLeft+this.__decelerationVelocityX,c=this.__scrollTop+this.__decelerationVelocityY;if(!this.options.bouncing){var f=Math.max(Math.min(this.__maxScrollLeft,a),0);f!==a&&(a=f,this.__decelerationVelocityX=0);f=Math.max(Math.min(this.__maxScrollTop,c),
0);f!==c&&(c=f,this.__decelerationVelocityY=0)}b?this.__publish(a,c,this.__zoomLevel):(this.__scrollLeft=a,this.__scrollTop=c);this.options.paging||(this.__decelerationVelocityX*=0.95,this.__decelerationVelocityY*=0.95);this.options.bouncing&&(f=b=0,a<this.__minDecelerationScrollLeft?b=this.__minDecelerationScrollLeft-a:a>this.__maxDecelerationScrollLeft&&(b=this.__maxDecelerationScrollLeft-a),c<this.__minDecelerationScrollTop?f=this.__minDecelerationScrollTop-c:c>this.__maxDecelerationScrollTop&&
(f=this.__maxDecelerationScrollTop-c),0!==b&&(this.__decelerationVelocityX=0>=b*this.__decelerationVelocityX?this.__decelerationVelocityX+0.03*b:0.08*b),0!==f&&(this.__decelerationVelocityY=0>=f*this.__decelerationVelocityY?this.__decelerationVelocityY+0.03*f:0.08*f))}},m;for(m in g)Scroller.prototype[m]=g[m]})();
