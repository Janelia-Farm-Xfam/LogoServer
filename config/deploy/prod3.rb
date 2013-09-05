set :application, "HmmerWeb"

if variables.include?(:branch)
  set :repository,  "https://subversion2.int.janelia.org/HmmerServer/projects/HmmerWeb/branches/#{branch}"
else
  set :repository,  "https://subversion2.int.janelia.org/HmmerServer/projects/HmmerWeb/trunk"
end

set :scm, :subversion
# Or: `accurev`, `bzr`, `cvs`, `darcs`, `git`, `mercurial`, `perforce`, `subversion` or `none`

set :deploy_to, "/opt/www/#{application}"
set :use_sudo, false

set :default_environment, {
  'PATH' => "/opt/bin/:$PATH"
}

role :web, "hmmer-web-prod3", :primary => true
role :app, "hmmer-web-prod3", :primary => true
