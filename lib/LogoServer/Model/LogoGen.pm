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
  my ($self, $hmm, $letter_height) = @_;
  $letter_height ||= 'entropy_all';
  return Bio::HMM::Logo::hmmToLogoJson($hmm, $letter_height);
}

=head2 generate_png(SCALAR, SCALAR, SCALAR)

  Takes the hmm in the first poistion. The second argument is the
  type of alphabet to use, either 'aa' or 'dna'. The final argument
  is optional and determines if the png should be scaled or left at
  the observed maximum height.

=cut

sub generate_png {
  my ($self, $ops ) = @_;
  if (!exists $ops->{letter_height}) {
    $ops->{'letter_height'} = 'entropy_all';
  }
  return Bio::HMM::Logo::hmmToLogoPNG(
    $ops->{hmm},
    $ops->{letter_height},
    $ops->{scaled}
  );
}

=head2 genreate_raw

=cut

sub generate_raw {
  my ($self, $hmm, $letter_height) = @_;
  $letter_height ||= 'entropy_all';
  my $data = Bio::HMM::Logo::hmmToLogo($hmm, $letter_height);
  return $data;
}

=head2 generate_tabbed

=cut

sub generate_tabbed {
  my ($self, $hmm, $letter_height) = @_;
  my $data = $self->generate_raw($hmm, $letter_height);
  my @keys = keys %$data;

  my $sorted = $self->sort_residues($data->{height_arr}->[0]);
  my $letter_header = join "\t", @$sorted;

  my $height_header = "\t" x scalar @$sorted;
  my $text = qq(# Theoretical Max Height\t$data->{max_height_theory}
# Observed Max Height\t$data->{max_height_obs}
# Column\tHeights${height_header}Expected Insert Length\tInsert Probability\tDelete Probability\tModel Mask
#       \t$letter_header\n);

  # get the number of columns we need
  my $length = scalar @{$data->{height_arr}};
  for (my $i = 0; $i < $length; $i++) {
    # generate the heights column
    my %residues = ();
    for my $res (@{$data->{height_arr}->[$i]}) {
      my ($letter, $value) = split(':', $res);
      $residues{$letter} = $value;
    }
    my @sorted = sort {$a cmp $b} keys %residues;

    my @sorted_vals = ();

    for my $sorted_letter (@sorted) {
      push @sorted_vals, $residues{$sorted_letter};
    }

    my $heights = join "\t", @sorted_vals;
    # build the row
    $text .= sprintf "%s\t%s\t%s\t%s\t%s\t%s\n",
      $i + 1,
      $heights,
      $data->{insert_lengths}->[$i],
      $data->{insert_probs}->[$i],
      $data->{delete_probs}->[$i],
      $data->{mmline}->[$i];
  }
  return $text;
}

sub sort_residues {
  my ($self, $residue_list) = @_;
  my %residues = ();
  # work out what letters to place in the header.
  for my $res (@$residue_list) {
    my $letter = [split(':', $res)]->[0];
    $residues{$letter}++;
  }
  my @sorted = sort {$a cmp $b} keys %residues;
  return \@sorted;
}

__PACKAGE__->meta->make_immutable;

1;
