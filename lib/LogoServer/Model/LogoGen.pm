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

=head2 generate_json(SCALAR)

  Takes the hmm in a scalar variable and returns a JSON string.

=cut

sub generate_json {
  my ($self, $hmm, $letter_height, $processing) = @_;
  $letter_height ||= 'info_content_all';
  $processing ||= 'hmm';
  return Bio::HMM::Logo::hmmToLogoJson($hmm, $letter_height, $processing);
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
    $ops->{'letter_height'} = 'info_content_all';
  }
  return Bio::HMM::Logo::hmmToLogoPNG(
    $ops->{hmm},
    $ops->{letter_height},
    $ops->{scaled},
    $ops->{processing},
    $ops->{colorscheme},
  );
}

=head2 generate_svg

=cut

sub generate_svg {
  my ($self, $ops ) = @_;
  if (!exists $ops->{letter_height}) {
    $ops->{'letter_height'} = 'info_content_all';
  }
  return Bio::HMM::Logo::hmmToLogoSVG(
    $ops->{hmm},
    $ops->{letter_height},
    $ops->{scaled},
    $ops->{processing},
    $ops->{colorscheme},
  );
}


=head2 generate_raw

=cut

sub generate_raw {
  my ($self, $hmm, $letter_height) = @_;
  $letter_height ||= 'info_content_all';
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
