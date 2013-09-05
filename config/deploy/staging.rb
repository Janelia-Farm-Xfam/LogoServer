set :application, "Skylign"

if variables.include?(:branch)
  set :branch,  "#{branch}"
else
  set :branch,  "master"
end

set :repository, "git@github.com:Janelia-Farm-Xfam/LogoServer.git"  # Your clone URL

set :scm, :git
# Or: `accurev`, `bzr`, `cvs`, `darcs`, `git`, `mercurial`, `perforce`, `subversion` or `none`

set :deploy_to, "/opt/www/#{application}"
set :use_sudo, false

set :default_environment, {
  'PATH' => "/opt/bin/:$PATH"
}

set :deploy_via, :remote_cache

role :web, "dfam-web-stage"                          # Your HTTP server, Apache/etc
role :app, "dfam-web-stage"                          # This may be the same as your `Web` server
