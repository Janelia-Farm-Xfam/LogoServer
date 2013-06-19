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
  my $input = read_file( $upload->tempname);
  my $result = Easel::Validation::guessInput($input);

  my $hmm = $result->{hmmpgmd};

  # open temporary file and save the hmm
  my ($fh, $filename) = tempfile();
  print $fh $hmm;
  seek $fh, 0, 0;

  # return path to temp file.
  return [$fh, $filename];
}

__PACKAGE__->meta->make_immutable;

1;
