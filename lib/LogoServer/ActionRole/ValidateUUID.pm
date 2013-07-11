package LogoServer::ActionRole::ValidateUUID;

use Moose::Role;
use namespace::autoclean;

before execute => sub {
  my $orig = shift;
  my( $self, $c, $uuid) = @_;
  # check that the uuid is a string of the format 8-4-4-4-12
  if ($uuid =~ /[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/i) {
    $c->stash->{uuid} = $uuid;
  }
  else {
    $c->stash->{error} = {uuid => 'The logo id passed was not vaild. It should be characters seperated by dashes in the form 8-4-4-4-12.'};
  }
};

1;

