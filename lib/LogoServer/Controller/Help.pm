package LogoServer::Controller::Help;
use Moose;
use namespace::autoclean;

BEGIN { extends 'LogoServer::Controller::Base' }

=head1 NAME

LogoServer::Controller::Help - Catalyst Controller

=head1 DESCRIPTION

Catalyst Controller.

=head1 METHODS

=cut


=head2 index

=cut

sub index :Path :Args(0) {
  my ( $self, $c ) = @_;
  return;
}

sub install :Path('/help/install') :Args(0) {
  return;
}

sub api :Path('/help/api') :Args(0) {
  my ($self, $c) = @_;
  return;
}

sub post :Path('/help/api/post') :Args(0) {
  my ($self, $c) = @_;
  return;
}

sub get_logo :Path('/help/api/get/logo/:uuid') :Args(0) {
  my ($self, $c) = @_;
  return;
}

sub get_hmm :Path('/help/api/get/logo/:uuid/hmm') :Args(0) {
  my ($self, $c) = @_;
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
