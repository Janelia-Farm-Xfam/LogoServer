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

sub generate_json {
  my ($self, $hmm) = @_;
  return Bio::HMM::Logo::hmmToLogoJson($hmm, "emission");
}

sub generate_png {
  my ($self, $hmm, $alphabet, $scaled) = @_;
  return Bio::HMM::Logo::hmmToLogoPNG($hmm, "emission", $alphabet, $scaled);
}

__PACKAGE__->meta->make_immutable;

1;
