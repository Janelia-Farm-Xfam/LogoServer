package LogoServer::Action::REST::ForBrowsers;

use Moose;
use namespace::autoclean;

our $VERSION = '1.12';
$VERSION = eval $VERSION;

extends 'Catalyst::Action::REST';
use Catalyst::Request::REST::ForBrowsers;

sub BUILDARGS {
    my $class  = shift;
    my $config = shift;
    Catalyst::Request::REST::ForBrowsers->_insert_self_into( $config->{class} );
    return $class->SUPER::BUILDARGS( $config, @_ );
}

override dispatch => sub {
    my $self = shift;
    my $c    = shift;

    my $req = $c->request();

    return super()
        unless $req->can('looks_like_browser')
            && $req->looks_like_browser()
            && uc $c->request()->method() =~ /GET|POST/;

    my $controller  = $c->component( $self->class );

    my $rest_method = $self->name() . '_GET_html';
    if ($c->request()->method() =~ /POST/) {
      $rest_method = $self->name() . '_POST_html';
    }

    if (   $controller->action_for($rest_method)
        || $controller->can($rest_method) ) {

        return $self->_dispatch_rest_method( $c, $rest_method );
    }

    return super();
};

__PACKAGE__->meta->make_immutable;

1;

=head1 NAME

LogoServer::Action::REST::ForBrowsers - Automated REST Method Dispatching that Accommodates Browsers

=head1 SYNOPSIS

    sub foo :Local :ActionClass('REST::ForBrowsers') {
      ... do setup for HTTP method specific handlers ...
    }

    sub foo_GET : Private {
      ... do something for GET requests ...
    }

    sub foo_GET_html : Private {
      ... do something for GET requests from browsers ...
    }

    sub foo_POST : Private {
      ... do something for POST requests ...
    }

    sub foo_POST_html : Private {
      ... do something for POST requests from browsers ...
    }

=head1 DESCRIPTION

This class subclasses L<Catalyst::Action::REST> to add an additional
dispatching hook. If the request is a GET/POST request I<and> the request looks
like it comes from a browser, it tries to dispatch to a C<GET/POST_html> method
before trying to the C<GET/POST> method instead. All other HTTP methods are
dispatched in the same way.

For example, in the synopsis above, calling GET on "/foo" from a browser will
end up calling the C<foo_GET_html> method. If the request is I<not> from a
browser, it will call C<foo_GET>.

See L<Catalyst::Action::REST> for more details on dispatching details.

=head1 METHODS

=over 4

=item dispatch

This method overrides the default dispatch mechanism to the re-dispatching
mechanism described above.

=back

=head1 SEE ALSO

You likely want to look at L<Catalyst::Controller::REST>, which implements a
sensible set of defaults for a controller doing REST.

This class automatically adds the
L<Catalyst::TraitFor::Request::REST::ForBrowsers> role to your request class.

=head1 AUTHOR

Jody Clements clementsj@janelia.hhmi.org

=head1 COPYRIGHT

Copyright the above named AUTHOR

=head1 LICENSE

You may distribute this code under the same terms as Perl itself.

=cut
