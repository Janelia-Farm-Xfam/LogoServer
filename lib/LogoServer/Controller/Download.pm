package LogoServer::Controller::Download;
use Moose;
use namespace::autoclean;
use IO::File;

BEGIN { extends 'Catalyst::Controller'; }

=head1 NAME

LogoServer::Controller::Download - Catalyst Controller

=head1 DESCRIPTION

Catalyst Controller.

=head1 METHODS

=cut


=head2 index

=cut

sub index :Path :Args(2) Does('ValidateUUID') {
  my ( $self, $c, $uuid, $type ) = @_;
  if ($c->stash->{uuid}) {
    $uuid = $c->stash->{uuid};
  }
  else {
    #validation failed.
    return;
  }

  my $hmm_path = $c->model('LogoData')->get_hmm_path($uuid);

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

    my $params = $c->model('LogoData')->get_options($uuid);

    # run the logo generation
    my $png = $c->model('LogoGen')->generate_png($hmm_path,$alphabet);
    $c->response->body($png);
    my $fname = "$uuid.png";
    $c->res->header( 'Content-Disposition' => "attachment; filename=$fname" );
    $c->res->header( 'Content-Type'        => 'text/plain' );
  }
  elsif ($type eq 'json') {
    my $json = $c->model('LogoGen')->generate_json($hmm_path);
    $c->response->body($json);
    my $fname = "$uuid.json";
    $c->res->header( 'Content-Disposition' => "attachment; filename=$fname" );
    $c->res->header( 'Content-Type'        => 'application/json' );
  }
  elsif ($type eq 'text') {
    my $data = $c->model('LogoGen')->generate_tabbed($hmm_path);
    my $output = "#ID\t$uuid\n" . $data;

    my $fname = "$uuid.txt";
    $c->response->body($output);
    $c->res->header( 'Content-Disposition' => "attachment; filename=$fname" );
    $c->res->header( 'Content-Type'        => 'text/plain' );

  }
  else {
    my $io = IO::File->new($hmm_path);
    $c->res->body($io);
    my $fname = "$uuid.hmm";
    $c->res->header( 'Content-Disposition' => "attachment; filename=$fname" );
    $c->res->header( 'Content-Type'        => 'text/plain' );
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
