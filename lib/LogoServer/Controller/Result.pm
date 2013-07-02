package LogoServer::Controller::Result;
use Moose;
use namespace::autoclean;
use JSON;
use File::Slurp;

BEGIN { extends 'Catalyst::Controller'; }

=head1 NAME

LogoServer::Controller::Result - Catalyst Controller

=head1 DESCRIPTION

Catalyst Controller.

=head1 METHODS

=cut


=head2 index

=cut

sub index :Path('/logo') :Args(1) {
  my ( $self, $c, $uuid ) = @_;
  # grab the uuid and figure out directory
  $c->stash->{uuid} = $uuid;

  my @dirs = split /-/, $uuid;
  # mkdir the path
  my $data_dir = $c->config->{logo_dir} .'/'. join '/', @dirs;

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

  my $param_json = read_file( "$data_dir/options" );
  my $params = JSON->new->decode($param_json);

  if ($params->{logo_type}) {
    $c->stash->{logo_type} = $params->{logo_type};
  }

  # run the logo generation
  my $json = $c->model('LogoGen')->generate_json($hmm_path);
  # save it to a temp file
  $c->stash->{alphabet} = $alphabet;
  $c->stash->{logo} = $json;


  return;
}

sub example : Path('/logo/example') :Args(0) {
  my ($self, $c) = @_;
  my $hmm_path = $c->config->{example_path};
  my $json = $c->model('LogoGen')->generate_json($hmm_path);
  # save it to a temp file
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
