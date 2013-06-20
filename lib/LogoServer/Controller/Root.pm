package LogoServer::Controller::Root;
use Moose;
use namespace::autoclean;
use Data::Printer;

BEGIN { extends 'Catalyst::Controller' }

#
# Sets the actions in this controller to be registered with no prefix
# so they function identically to actions created in MyApp.pm
#
__PACKAGE__->config(namespace => '');

=head1 NAME

LogoServer::Controller::Root - Root Controller for LogoServer

=head1 DESCRIPTION

[enter your description here]

=head1 METHODS

=head2 index

The root page (/)

=cut

sub index :Path :Args(0) {
  my ( $self, $c ) = @_;

  if ($c->req->param('hmm')) {

    my $alphabet = 'dna';
    my $hmm_file = $c->req->upload('hmm');

    # convert uploaded file to hmm if not already an hmm
    #
    my $hmm = $c->model('Logo::Processing')->convert_upload($hmm_file->tempname);

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
