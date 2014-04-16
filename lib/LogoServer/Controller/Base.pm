package LogoServer::Controller::Base;
use Moose;
use namespace::autoclean;

BEGIN {extends 'Catalyst::Controller::REST'; }

=head1 NAME

LogoServer::Controller::Base - Catalyst Controller

=head1 DESCRIPTION

Catalyst Controller.

=cut

# set up the REST response serializing.
__PACKAGE__->config(
  default   => 'text/html',
  stash_key => 'rest',
  "map"     => {
    "application/json"   => "JSON",
    "application/x-yaml" => "YAML",
    "application/yaml"   => "YAML",
    "text/html"          => [ "View", "HTML" ],
    "text/plain"         => [ "View", "Text" ],
    "text/x-yaml"        => "YAML",
    "text/xml"           => "XML::Simple",
    "application/xml"    => "XML::Simple",
    "text/yaml"          => "YAML",
    "image/png"          => [ 'Callback', {
                                            deserialize => \&_deserialize_image,
                                            serialize   => \&_serialize_image,
                                          }
                            ],
  }
);


=head1 METHODS

=cut

sub begin : ActionClass('Deserialize') {
  my ( $self, $c ) = @_;

  my $contentType =
    ( defined( $c->req->content_type ) and $c->req->content_type ne '' )
    ? $c->req->content_type
    : 'text/html';
  $c->log->debug( "Got content type " . $contentType .", from ".$c->req->header('Accept')) if ( $c->debug );
  # if a user agent sends the accpets header, then we want to make sure we
  # are returning the correct type of content. So check the accpets header
  # matches one of the values in our map and override content-type if it does.
  if ($c->req->header('Accept')) {
    my @accepts = split (/\,|\;/ , $c->req->header('Accept'));
    my $matched = 0;
    foreach my $accept (@accepts) {
      if (exists $self->{map}->{$accept}) {
        if($contentType eq $accept or $accept =~ /html/){
          $contentType = $accept;
          $matched = 1;
          last;
        }
      }
    }
    unless($matched == 1){
      foreach my $accept (@accepts) {
        if (exists $self->{map}->{$accept}) {
          $contentType = $accept;
          last;
        }
      }
    }
  }
  $c->log->debug( "After inspecting Accept, got: " . $contentType ) if ( $c->debug );

  if ( $contentType eq 'application/x-www-form-urlencoded'
    or $contentType eq 'multipart/form-data'
    #or $contentType eq 'text/plain'
    or $contentType eq 'text/html' )
  {

    $c->log->debug('Probably came from a browser, inspecting params') if ( $c->debug );
  }
  else {
    $c->stash( _serialize => 1 );
  }

  $c->stash( no_wrapper => 1) if( $contentType eq 'text/plain');

  return;
}

sub _deserialize_image {
  return 1;
}

sub _serialize_image {
  my ($data, $self, $c) = @_;
  return $data;
}

sub end : ActionClass('+LogoServer::Action::RenderView::ErrorHandler') {}

=head1 AUTHOR

Jody Clements

=head1 LICENSE

This library is free software. You can redistribute it and/or modify
it under the same terms as Perl itself.

=cut

__PACKAGE__->meta->make_immutable;

1;
