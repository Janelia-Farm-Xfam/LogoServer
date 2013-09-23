#!/bin/bash -x

export OUTPUT=$WORKSPACE/logs
export DISPLAY=:1
export PATH=/opt/bin:$PATH

# minify css

/opt/bin/lessc --yui-compress root/static/css/main.less root/static/css/main.min.css

# clear out old build files
rm /opt/www/Skylign/current/root/static/js/main.js
rm /opt/www/Skylign/current/root/static/js/main.min.js
rm /opt/www/Skylign/current/root/static/js/00-libs.js


# minify and compress the javascript
cat /opt/www/Skylign/current/root/static/js/libs/*.js > /opt/www/Skylign/current/root/static/js/00-libs.js
cat /opt/www/Skylign/current/root/static/js/*.js > /opt/www/Skylign/current/root/static/js/main.js


/usr/bin/java -jar /opt/lib/java/compiler.jar --js /opt/www/Skylign/current/root/static/js/main.js --js_output_file /opt/www/Skylign/current/root/static/js/main.min.js


# set permission on the build directory for Inline-C
chown -R nobody: $WORKSPACE/*

mkdir -p $OUTPUT

/etc/init.d/skylign restart
