#!/bin/bash -x

export OUTPUT=$WORKSPACE/logs
export DISPLAY=:1
export PATH=/opt/bin:$PATH

# minify css

/opt/bin/lessc --yui-compress root/static/css/main.less root/static/css/main.min.css

# minify and compress the javascript

cat /opt/www/Skylign/current/root/static/js/*.js > /opt/www/Skylign/current/root/static/js/main.js

/usr/bin/java -jar /opt/lib/java/compiler.jar --js /opt/www/Skylign/current/root/static/js/main.js --js_output_file /opt/www/Skylign/current/root/static/js/main.min.js


# set permission on the build directory for Inline-C
chown -R nobody: $WORKSPACE/*

mkdir -p $OUTPUT

/etc/init.d/skylign restart
