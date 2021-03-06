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
