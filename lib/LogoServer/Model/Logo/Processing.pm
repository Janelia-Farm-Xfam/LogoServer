package LogoServer::Model::Logo::Processing;
use Moose;
use namespace::autoclean;
use Easel::Validation;
use File::Slurp;
use File::Temp qw/ tempfile /;

extends 'Catalyst::Model';

=head1 NAME

LogoServer::Model::Logo::Processing - Catalyst Model

=head1 DESCRIPTION

Catalyst Model.

=head1 AUTHOR

Clements, Jody

=head1 LICENSE

This library is free software. You can redistribute it and/or modify
it under the same terms as Perl itself.

=cut

sub convert_upload {
  my ($self, $upload) = @_;
  my $input = read_file( $upload );
  my $result = Easel::Validation::guessInput($input);

  # if we can get an hmm out then we need to save it
  if ($result->{type} =~ /^MSA|HMM$/) {

    my $hmm = $result->{hmmpgmd};

    # open temporary file and save the hmm
    my ($fh, $filename) = tempfile('/opt/data/logos/hmmXXXXX', UNLINK => 0);
    print $fh $hmm;
    seek $fh, 0, 0;
    return [$fh, $filename];

  }
  elsif ($result->{type} =~ /^SS$/) {
    die "Uploaded data looks like a single sequence. Logo generation requires an alignment or HMM.\n";
  }
  elsif ($result->{type} =~ /^MS$/) {
    die "Uploaded data looks like multiple unaligned sequences. Logo generation requires an alignment or HMM.\n";
  }
  else {
    # otherwise die and throw an error
    die "Uploaded data was not a valid multiple sequence alignment or HMM.\n";
  }
  return;
}

__PACKAGE__->meta->make_immutable;

1;
