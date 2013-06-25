package LogoServer::Controller::Download;
use Moose;
use namespace::autoclean;

BEGIN { extends 'Catalyst::Controller'; }

=head1 NAME

LogoServer::Controller::Download - Catalyst Controller

=head1 DESCRIPTION

Catalyst Controller.

=head1 METHODS

=cut


=head2 index

=cut

sub index :Path :Args(2) {
  my ( $self, $c, $uuid, $type ) = @_;
  my @dirs = split /-/, $uuid;
  # mkdir the path
  my $data_dir = $c->config->{logo_dir} .'/'. join '/', @dirs;
  my $hmm_path = "$data_dir/hmm";

  if (! -e $hmm_path) {
    $c->stash->{error} = {uuid => "We were unable to find a result for the supplied identifier."};
    return;
  }

  open my $hmm, '<', $hmm_path;

  if ($type eq 'image') {

    my $alphabet = 'dna';
    # check to see if HMM is DNA or AA
    while (my $line = <$hmm>) {
      if ($line =~ /^ALPH/) {
        if ($line =~ /amino/) {
          $alphabet = 'aa';
        }
        last;
      }
    }


    # run the logo generation
    my $png = $c->model('LogoGen')->generate_png($hmm_path,$alphabet);
    $c->response->content_type('image/png');
    $c->response->body($png);
  }
  else {
    my $hmm_text = '';
    while (my $line = <$hmm>) {
      $hmm_text .= $line;
    }
    $c->response->content_type('text/plain');
    $c->response->body($hmm_text);
  }

  close $hmm;
  return;
}

sub missing_uuid : Path : Args(0) {
  my ( $self, $c ) = @_;
  $c->res->redirect($c->uri_for('/'));
  return;
}

sub missing_type : Path : Args(1) {
  my ($self, $c, $uuid) = @_;
  # by default we redirect to the image if no type is given.
  my $uri = $c->uri_for($uuid, 'image');
  $c->res->redirect($uri);
  return;
}


=head1 AUTHOR

Clements, Jody

=head1 LICENSE

This library is free software. You can redistribute it and/or modify
it under the same terms as Perl itself.

=cut

__PACKAGE__->meta->make_immutable;

1;
