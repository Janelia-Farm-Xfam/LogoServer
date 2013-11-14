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

This library is free software. You can redistribute it and/or modify
it under the same terms as Perl itself.

=cut

__PACKAGE__->meta->make_immutable;

1;
