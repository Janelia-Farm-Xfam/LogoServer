package LogoServer::Controller::Result;
use Moose;
use namespace::autoclean;
use IO::File;

BEGIN { extends 'Catalyst::Controller'; }

=head1 NAME

LogoServer::Controller::Result - Catalyst Controller

=head1 DESCRIPTION

Catalyst Controller.

=head1 METHODS

=cut


=head2 index

=cut

sub index :Path('/logo') :Args(1) Does('ValidateUUID') {
  my ( $self, $c ) = @_;
  # grab the uuid and figure out directory
  my $uuid = $c->stash->{uuid};

  if (!$uuid) {
    return;
  }


  my $data = $c->model('LogoData');
  my $data_dir = $data->_data_dir($uuid);

  my $hmm_path = "$data_dir/hmm";

  if (! -e $hmm_path) {
    $c->stash->{error} = {uuid => "We were unable to find a result for the supplied identifier."};
    return;
  }

  open my $hmm, '<', $hmm_path;
  my $alphabet = 'dna';

  # check to see if HMM is DNA or AA
  while (my $line = <$hmm>) {
    if ($line =~ /^ALPH/) {
      if ($line =~ /amino/i) {
        $alphabet = 'aa';
      }
      elsif ($line =~ /rna/i) {
        $alphabet = 'rna';
      }
    }
    # grab out the length of the hmm
    if ($line =~ /LENG/) {
      ($c->stash->{hmm_length}) = $line =~ /(\d+)/;
    }
    if ($line =~ /DATE/) {
      ($c->stash->{hmm_created}) = $line =~ /^DATE\s+(.*)?/;
    }
    # grab out the number of sequences
    if ($line =~ /^NSEQ/) {
      ($c->stash->{nseq}) = $line =~ /(\d+)/;
      # quit here as there is nothing past this point that we want at this time.
    }
    if ($line =~ /^CKSUM/) {
      last;
    }
  }
  close $hmm;

  my $params = $data->get_options($uuid);

  if (exists $params->{logo_type}) {
    $c->stash->{logo_type} = $params->{logo_type};
  }

  if (exists $params->{height_calc}) {
    $c->stash->{height_calc} = $params->{height_calc};
  }
  else {
    $c->stash->{height_calc} = 'emission';
  }

  # run the logo generation
  my $json = $c->model('LogoGen')->generate_json($hmm_path, $c->stash->{height_calc});
  # save it to a temp file
  $c->stash->{alphabet} = $alphabet;
  $c->stash->{logo} = $json;

  if ($c->req->preferred_content_type eq 'text/plain') {
    $c->stash->{rest} = $c->model('LogoGen')->generate_tabbed($hmm_path, $c->stash->{height_calc});
    $c->stash->{template} = 'result/tabbed.tt';
  }
  elsif ($c->req->preferred_content_type eq 'image/png') {
    $c->stash->{rest} = $c->model('LogoGen')->generate_png($hmm_path, $c->stash->{alphabet});
  }
  else {
    $c->stash->{rest} = $c->model('LogoGen')->generate_raw($hmm_path, $c->stash->{height_calc});
  }

  return;
}

sub hmm :Path('/logo') : Args(2) Does('ValidateUUID') {
  my ($self, $c) = @_;
  my $uuid = $c->stash->{uuid};

  if (!$uuid) {
    #bail out if we didn't get a uuid from validation.
    return;
  }

  # if content-type not text/plain, then throw not supported error.
  if ($c->req->preferred_content_type ne 'text/plain') {
    $c->res->status(415);
    $c->stash->{rest}  = {error => "HMM files are only available as plain text."};
    $c->stash->{error} = {format => "HMM files are only available as plain text."};
  }
  # else fetch out the hmm and return it if we allow that.
  else {
    my @dirs = split /-/, $uuid;
    # mkdir the path
    my $data_dir = $c->config->{logo_dir} .'/'. join '/', @dirs;
    my $hmm_path = "$data_dir/hmm";

    if (! -e $hmm_path) {
      $c->stash->{rest} = {error => "We were unable to find a result for the supplied uuid."};
      $c->stash->{error} = {missing => "We were unable to find a result for the supplied uuid."};
      return;
    }

    my $io = IO::File->new($hmm_path);
    $c->res->body($io);

  }
  return;
}

sub example : Path('/logo/example') :Args(0) {
  my ($self, $c) = @_;
  my $hmm_path = $c->config->{example_path};
  my $json = $c->model('LogoGen')->generate_json($hmm_path);
  # save it to a temp file
  $c->stash->{uuid} = 'example';
  $c->stash->{alphabet} = 'aa';
  $c->stash->{logo} = $json;
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
