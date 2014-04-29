package LogoServer::Model::LogoData;
use Moose;
use namespace::autoclean;
use File::Slurp;
use JSON;
use File::Path qw( make_path );
use File::Copy;

extends 'Catalyst::Model';

has logo_dir => (
  isa => 'Str',
  is  => 'ro',
);

=head1 NAME

LogoServer::Model::LogoData - Catalyst Model

=head1 DESCRIPTION

Catalyst Model.


=head1 METHODS

=head2 save

=cut

sub set_hmm {
  my ($self, $uuid, $hmm) = @_;

}

sub get_hmm_path {
  my ($self, $uuid) = @_;
  return $self->_data_dir($uuid) . '/hmm';
}

sub get_options {
  my ($self, $uuid) = @_;
  my $param_json = read_file( $self->_data_dir($uuid) . "/options" );
  my $params = JSON->new->decode($param_json);
  return $params;
}

sub save_upload {
  my ($self, $uuid, $upload) = @_;
  my $data_dir = $self->_data_dir($uuid);
  make_path($data_dir);
  my $new_path = "$data_dir/upload";
  copy($upload->tempname, $new_path);
  return;
}

sub upload_path {
  my ($self, $uuid) = @_;
  return $self->_data_dir($uuid) . '/upload';
}

sub set_options {
  my ($self, $uuid, $options) = @_;
  my $data_dir = $self->_data_dir($uuid);
  make_path($data_dir);

  open my $opts_file, '>', "$data_dir/options";
  my $json = JSON->new->encode($options);
  print $opts_file $json;
  close $opts_file;
  return;
}

sub _data_dir {
  my ($self, $uuid) = @_;
  my @dirs = split /-/, $uuid;
  # mkdir the path
  return $self->logo_dir .'/'. join '/', @dirs;
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
