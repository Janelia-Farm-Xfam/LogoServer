package LogoServer::Model::LogoGen;
use Moose;
use namespace::autoclean;
use Bio::HMM::Logo;

extends 'Catalyst::Model';

=head1 NAME

LogoServer::Model::LogoGen - Catalyst Model

=head1 DESCRIPTION

Catalyst Model.

=head1 AUTHOR

Clements, Jody

=head1 LICENSE

This library is free software. You can redistribute it and/or modify
it under the same terms as Perl itself.

=cut

=head2 generate_json(SCALAR)

  Takes the hmm in a scalar variable and returns a JSON string.

=cut

sub generate_json {
  my ($self, $hmm) = @_;
  return Bio::HMM::Logo::hmmToLogoJson($hmm, "emission");
}

=head2 generate_png(SCALAR, SCALAR, SCALAR)

  Takes the hmm in the first poistion. The second argument is the
  type of alphabet to use, either 'aa' or 'dna'. The final argument
  is optional and determines if the png should be scaled or left at
  the theroetical maximum height.

=cut

sub generate_png {
  my ($self, $hmm, $alphabet, $scaled) = @_;
  return Bio::HMM::Logo::hmmToLogoPNG($hmm, "emission", $alphabet, $scaled);
}

sub generate_raw {
  my ($self, $hmm) = @_;
  my $data = Bio::HMM::Logo::hmmToLogo($hmm, "emission");
  my @keys = keys $data;

  use DDP; p @keys;
  my $residues = scalar @{$data->{height_arr}->[0]};
  my $height_header = "\t" x $residues;
  my $text = qq(# Max Height\t$data->{max_height_theory}
# Observed Height\t$data->{max_height_obs}
# Column\tHeight${height_header}Insert Length\tInsert Probability\tOccupancy Probability\tModel Mask\n);

  # get the number of columns we need
  my $length = scalar @{$data->{height_arr}};
  for (my $i = 0; $i < $length; $i++) {
    # generate the heights column
    my $heights = join "\t", @{$data->{height_arr}->[$i]};
    # build the row
    $text .= sprintf "%s\t%s\t%s\t%s\t%s\t%s\n",
      $i,
      $heights,
      $data->{insert_lengths}->[$i],
      $data->{insert_probs}->[$i],
      $data->{occupancy_probs}->[$i],
      $data->{mmline}->[$i];
  }
  return $text;
}

__PACKAGE__->meta->make_immutable;

1;
