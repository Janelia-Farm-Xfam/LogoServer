package LogoServer::Controller::Result;
use Moose;
use namespace::autoclean;
use IO::File;

BEGIN { extends 'LogoServer::Controller::Base' }

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

  my $hmm_path = $c->model('LogoData')->get_hmm_path($uuid);

  if (! -e $hmm_path) {
    $c->stash->{error} = {uuid => "We were unable to find a result for the supplied identifier."};
    $c->stash->{template} = 'missing.tt';
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

  my $params = $c->model('LogoData')->get_options($uuid);

  $c->stash->{uploaded} = $params->{file};
  $c->stash->{upload_type} = $params->{upload_type};

  if (exists $params->{processing}) {
    $c->stash->{processing} = $params->{processing};
    $c->req->params->{processing} = $params->{processing};
  }

  if (exists $params->{letter_height}) {
    my %conversion = (
      info_content_all   => 'Information Content - All',
      info_content_above => 'Information Content - Above Background',
      score              => 'Score',
    );
    $c->stash->{letter_height_display} = $conversion{$params->{letter_height}};
    $c->stash->{letter_height} = $params->{letter_height};
    $c->req->params->{letter_height} = $params->{letter_height};
  }
  else {
    $c->stash->{letter_height} = 'info_content_all';
    $c->stash->{letter_height_display} = 'Information Content - All';
  }

  if (exists $params->{frag}) {
    $c->stash->{frag} = $params->{frag};
    $c->req->params->{frag} = $params->{frag};
  }


  # run the logo generation
  my $json = $c->model('LogoGen')->generate_json($hmm_path, $c->stash->{letter_height}, $c->stash->{processing});
  # save it to a temp file
  $c->stash->{alphabet} = $alphabet;
  $c->stash->{logo} = $json;

  if ($c->req->preferred_content_type eq 'text/plain') {
    $c->stash->{rest} = $c->model('LogoGen')->generate_tabbed($hmm_path, $c->stash->{letter_height});
    $c->stash->{template} = 'result/tabbed.tt';
  }
  elsif ($c->req->preferred_content_type eq 'image/png') {
    my $options = {
      hmm => $hmm_path,
      letter_height => $params->{letter_height},
    };

    if ($c->req->param('scaled')) {
      $options->{scaled} = 1;
    }

    $c->stash->{rest} = $c->model('LogoGen')->generate_png($options);
  }
  else {
    $c->stash->{rest} = $c->model('LogoGen')->generate_raw($hmm_path, $c->stash->{letter_height});
  }

  # if there is an error message, then we should display it once and remove
  # it so that doesn't keep popping up.
  if (exists $params->{error}) {
    $c->stash->{message} = $params->{error};
    delete $params->{error};
    $c->model('LogoData')->set_options($uuid, $params);
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

The MIT License (MIT)

Copyright (c) 2014 Jody Clements, Travis Wheeler & Robert Finn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


=cut

__PACKAGE__->meta->make_immutable;

1;
