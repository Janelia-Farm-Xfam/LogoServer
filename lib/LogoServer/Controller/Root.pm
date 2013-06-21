package LogoServer::Controller::Root;
use Moose;
use namespace::autoclean;
use Data::Printer;
use Try::Tiny;

BEGIN { extends 'Catalyst::Controller::REST' }

#
# Sets the actions in this controller to be registered with no prefix
# so they function identically to actions created in MyApp.pm
#
__PACKAGE__->config(
  namespace => '',
  default   => 'text/html',
  stash_key => 'rest',
  "map"     => {
    "application/json"   => "JSON",
    "application/x-yaml" => "YAML",
    "application/yaml"   => "YAML",
    "text/html"          => [ "View", "HTML" ],
    "text/plain"         => [ "View", "HTML" ],
    "text/x-yaml"        => "YAML",
    "text/xml"           => "XML::Simple",
    "application/xml"    => "XML::Simple",
    "text/yaml"          => "YAML",
  }
);


=head1 NAME

LogoServer::Controller::Root - Root Controller for LogoServer

=head1 DESCRIPTION

[enter your description here]

=head1 METHODS

=head2 index

The root page (/)

=cut

=head2 index

=cut

sub index : Path : Args(0) : ActionClass('REST::ForBrowsers') {}

=head2 index_GET_html

=cut

sub index_GET_html : Private {

}

=head2 index_GET

=cut

sub index_GET : Private {

}

=head2 index_POST

=cut

sub index_POST :Private {
  my ( $self, $c ) = @_;

  my $alphabet = 'dna';
  my $hmm_file = $c->req->upload('hmm');

  if (!$hmm_file) {
    $c->stash->{error} = {'upload' => 'Please choose an alignment file, HMM file to upload.' };
    return;
  }

  # convert uploaded file to hmm if not already an hmm
  my $hmm = undef;
  try {
    $hmm = $c->model('Logo::Processing')->convert_upload($hmm_file->tempname);
  }
  catch {
    $c->stash->{error} = {'hmmbuild' => $_ };
  };

  return if (!$hmm);

  # check to see if HMM is DNA or AA
  my $fh = $hmm->[0];

  while (my $line = <$fh>) {
    if ($line =~ /^ALPH/) {
      if ($line =~ /amino/) {
        $alphabet = 'aa';
      }
      last;
    }
  }

  # run the logo generation

  if ($c->req->param('format') eq 'js') {
    my $json = $c->model('LogoGen')->generate_json($hmm->[1]);
    # save it to a temp file
    $c->stash->{alphabet} = $alphabet;
    $c->stash->{logo} = $json;
  }
  else {
    my $png = $c->model('LogoGen')->generate_png($hmm->[1],$alphabet);
    $c->response->content_type('image/png');
    $c->response->body($png);
  }
}

=head2 default

Standard 404 error page

=cut

sub default :Path {
    my ( $self, $c ) = @_;
    $c->response->body( 'Page not found' );
    $c->response->status(404);
}

=head2 end

Attempt to render a view, if needed.

=cut

sub end : ActionClass('RenderView') {}

=head1 AUTHOR

Clements, Jody

=head1 LICENSE

This library is free software. You can redistribute it and/or modify
it under the same terms as Perl itself.

=cut

__PACKAGE__->meta->make_immutable;

1;
