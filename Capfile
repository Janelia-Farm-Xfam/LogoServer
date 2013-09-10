load 'deploy' if respond_to?(:namespace) # cap2 differentiator

require 'rubygems'
require 'railsless-deploy'
require 'capistrano/ext/multistage'

set :stages, %w(staging production)

before 'deploy:symlink', 'deploy:compresscss'
before 'deploy:symlink', 'deploy:minifyjs'
before 'deploy:symlink', 'deploy:modify_ownership'
after 'deploy:symlink', 'deploy:restart'

# Always cleanup after ourselves. This will keep only the
# five most recent versions of the site around.
after "deploy:restart", "deploy:cleanup"


namespace :deploy do

  desc "Make sure the checkout is owned by nobody so Inline-C can build"
  task :modify_ownership, :roles => :web do
    run "chown -R nobody: #{release_path}"
  end

  desc "Restart the fast cgi server"
  task :restart, :roles => :web do
    puts "Restarting the fastcgi"
    run "/opt/bin/monit -c /opt/etc/monitrc restart skylign"
  end

  desc "Compress css files into one file for production"
  task :compresscss, :roles => :web do
    run "/opt/bin/lessc --yui-compress #{release_path}/root/static/css/main.less #{release_path}/root/static/css/main.min.css"
  end

  desc "Minify javascript with Google closure compiler"
  task :minifyjs, :roles => :web do
    run "cat #{release_path}/root/static/js/*.js > #{release_path}/root/static/js/main.js"
    run "/usr/bin/java -jar /opt/lib/java/compiler.jar --js #{release_path}/root/static/js/main.js --js_output_file #{release_path}/root/static/js/main.min.js"
  end

end

namespace :local do

  task :default do
    compresscss
    minifyjs
  end

  desc "Compress css files into one production file"
  task :compresscss, :roles => :web do
    existing = Dir.glob('root/static/css/main.*')
    existing.each {|file|
      system("rm #{file}")
    }
    system("/opt/bin/lessc --yui-compress root/static/css/main.less root/static/css/main.min.css")
    system("/opt/bin/lessc root/static/css/main.less root/static/css/main.css")
  end

  desc "Minify javascript with Google closure compiler"
  task :minifyjs, :roles => :web do
    existing = Dir.glob('root/static/js/main.*')
    existing.each {|file|
      system("rm #{file}")
    }
    system('cd root/static/js;cat *.js > main.js;cd -')
    system("/usr/bin/java -jar /opt/lib/java/compiler.jar --js root/static/js/main.js --js_output_file root/static/js/main.min.js")
  end
end


