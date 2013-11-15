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

=head2 convert_upload(SCALAR);

   Takes the path to the uploaded file. Figures out if it is an HMM
   or multiple sequence alignment. If the uploaded file can be used
   it returns an ARRAYREF containing the FILEHANDLE and the file
   name. Otherwise it throws an error and returns undef.

=cut

sub convert_upload {
  my ($self, $tmpdir, $alignment_only, $frag_handling) = @_;
  my $input = read_file( "$tmpdir/upload" );

  $alignment_only ||= 3;
  $frag_handling ||= 'full';
  my $dna_rna_ok = 1;

  my $result = Easel::Validation::guessInput($input, $alignment_only, $dna_rna_ok, $frag_handling);

  # if we can get an hmm out then we need to save it
  if ($result->{type} =~ /^MSA|HMM$/) {
    if ($result->{type} =~ /^MSA/ && exists $result->{error}) {
      my $message = sprintf "There was a problem parsing your multiple sequence alignment. It looked like you were trying to upload using %s format, but we couldn't parse it because: %s", $result->{guess}, $result->{error};
      if (exists $result->{position} && $result->{position}) {
        $message .= sprintf " at or near line %s.\n", $result->{position};
      }
      else {
        $message .= ".\n";
      }
      die $message;
    }

    my $hmm = $result->{hmmpgmd};

    # open temporary file and save the hmm
    open my $fh, '>', "$tmpdir/hmm"
      or die qq(We are experiencing dificulties saving your results. Please try you request again. If you continue to have problems please email us at the address found in the footer of this page\n);
    print $fh $hmm;
    return "$tmpdir/hmm";

  }
  elsif ($result->{type} =~ /^SS$/) {
    die "The file you have uploaded looks like a single sequence. Logo generation requires an alignment or an HMM.\n";
  }
  elsif ($result->{type} =~ /^MS$/) {
    die "The file you have uploaded looks like multiple unaligned sequences. Logo generation requires an alignment or an HMM.\n";
  }
  else {
    # otherwise die and throw an error
    die "Uploaded data was not a valid multiple sequence alignment or HMM.\n";
  }
  return;
}

__PACKAGE__->meta->make_immutable;

1;
