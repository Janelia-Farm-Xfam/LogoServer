package LogoServer::Controller::Download;
use Moose;
use namespace::autoclean;
use IO::File;

BEGIN { extends 'LogoServer::Controller::Base' }

=head1 NAME

LogoServer::Controller::Download - Catalyst Controller

=head1 DESCRIPTION

Catalyst Controller.

=head1 METHODS

=cut


sub capture_uuid : Chained : PathPart('download') : CaptureArgs(1) : Does('ValidateUUID') {
  my ( $self, $c, $uuid ) = @_;
  $c->stash->{uuid} = $uuid;
  my $hmm_path = $c->model('LogoData')->get_hmm_path($uuid);

  if (! -e $hmm_path) {
    $c->stash->{error} = {uuid => "We were unable to find a result for the supplied identifier."};
    $c->stash->{template} = 'missing.tt';
    $c->forward('end');
  }
  else {
    $c->stash->{logo_params} = $c->model('LogoData')->get_options($uuid);
    $c->stash->{hmm_path} = $hmm_path;
    $c->stash->{logo_ops} = {
      hmm           => $hmm_path,
      letter_height => $c->stash->{logo_params}->{letter_height},
      processing    => $c->stash->{logo_params}->{processing},
    };

    if ($c->req->param('scaled')) {
      $c->stash->{logo_ops}->{scaled} = 1;
    }

    if ($c->req->param('colors') && $c->req->param('colors') eq 'consensus') {
      $c->stash->{logo_ops}->{colorscheme} = 'consensus';
    }

  }
  return;
}

sub missing : Chained('capture_uuid') : PathPart('') {
  my ( $self, $c ) = @_;
  # by default we redirect to the image if no type is given.
  my $uri = $c->uri_for($c->stash->{uuid}, 'image');
  $c->res->redirect($uri);
  return;
}

sub image : Chained('capture_uuid') : PathPart('image') {
  my ( $self, $c ) = @_;
  my $type = $c->req->param('format') || 'png';
  if ($type eq 'svg') {
    $c->forward('svg');
  }
  elsif ($type eq 'spng') {
    $c->stash->{logo_ops}->{scaled} = 1;
    $c->forward('png');
  }
  else {
    $c->forward('png');
  }
  return;
}

sub svg : Chained('capture_uuid') : PathPart('svg') {
  my ( $self, $c ) = @_;
  my $uuid = $c->stash->{uuid};
  my $svg = $c->model('LogoGen')->generate_svg($c->stash->{logo_ops});
  $c->response->body($svg);
  my $fname = "$uuid.svg";
  $c->res->header( 'Content-Disposition' => "attachment; filename=$fname" );
  $c->res->header( 'Content-Type'        => 'image/svg+xml' );
  return;
}

sub png : Chained('capture_uuid') : PathPart('png') {
  my ( $self, $c ) = @_;
  # run the logo generation
  my $uuid = $c->stash->{uuid};

  my $png = $c->model('LogoGen')->generate_png($c->stash->{logo_ops});
  $c->response->body($png);
  my $fname = "$uuid.png";
  $c->res->header( 'Content-Disposition' => "attachment; filename=$fname" );
  $c->res->header( 'Content-Type'        => 'text/plain' );
  return;
}

sub text : Chained('capture_uuid') : PathPart('text') {
  my ( $self, $c ) = @_;
  my $uuid = $c->stash->{uuid};
  my $data = $c->model('LogoGen')->generate_tabbed(
    $c->stash->{hmm_path},
    $c->stash->{logo_params}->{letter_height}
  );
  my $output = "#ID\t$uuid\n" . $data;

  my $fname = "$uuid.txt";
  $c->response->body($output);
  $c->res->header( 'Content-Disposition' => "attachment; filename=$fname" );
  $c->res->header( 'Content-Type'        => 'text/plain' );
  return;
}

sub json : Chained('capture_uuid') : PathPart('json') {
  my ( $self, $c ) = @_;
  my $uuid = $c->stash->{uuid};
  my $json = $c->model('LogoGen')->generate_json(
    $c->stash->{hmm_path},
    $c->stash->{logo_params}->{letter_height},
    $c->stash->{logo_params}->{processing}
  );
  $c->response->body($json);
  my $fname = "$uuid.json";
  $c->res->header( 'Content-Disposition' => "attachment; filename=$fname" );
  $c->res->header( 'Content-Type'        => 'application/json' );
  return;
}

sub hmm : Chained('capture_uuid') : PathPart('hmm') {
  my ( $self, $c ) = @_;
  my $uuid = $c->stash->{uuid};
  my $io = IO::File->new($c->stash->{hmm_path});
  $c->res->body($io);
  my $fname = "$uuid.hmm";
  $c->res->header( 'Content-Disposition' => "attachment; filename=$fname" );
  $c->res->header( 'Content-Type'        => 'text/plain' );
  return;
}

sub missing_uuid : Path : Args(0) {
  my ( $self, $c ) = @_;
  $c->res->redirect($c->uri_for('/'));
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
