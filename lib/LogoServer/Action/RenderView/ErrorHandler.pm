package LogoServer::Action::RenderView::ErrorHandler;
our $VERSION = '0.1';

use warnings;
use strict;

use Carp;
use MRO::Compat;
use Class::Inspector;

use Moose;
extends qw(Catalyst::Action::RenderView  Catalyst::Action::SerializeBase);

has 'handlers' => ( is => 'rw', isa => 'ArrayRef', default => sub { [] } );
has 'actions'  => ( is => 'rw', isa => 'HashRef',  default => sub { {} } );
has _encoders  => (
  is      => 'ro',
  isa     => 'HashRef',
  default => sub { {} },
);

sub action {
  my $self = shift;
  my $id   = shift;
  return $self->actions->{$id};
}

sub execute {
  my $self = shift;
  my ( $controller, $c ) = @_;

  my $rv = $self->maybe::next::method(@_);

  if( (scalar( @{ $c->error }) != 0 ) ){
    $c->response->status('500');
  }

  $DB::Single = 1;

  #If we have come through the restful begin and it does not look like a browser
  #we need to serialize the response.
  if(exists($c->stash->{_serialize}) and $c->stash->{_serialize}){
    return 1 if $c->req->method eq 'HEAD';

    return 1 if scalar @{ $c->error };
    return 1 if $c->response->status =~ /^(?:204)$/;
    my ( $sclass, $sarg, $content_type ) =
    $self->_load_content_plugins( "Catalyst::Action::Serialize", $controller, $c );
    unless ( defined($sclass) ) {
      if ( defined($content_type) ) {
        $c->log->info("Could not find a serializer for $content_type");
      }
      else {
        $c->log->info("Could not find a serializer for an empty content-type");
      }
      return 1;
    }
    $c->log->debug( "Serializing with $sclass" . ( $sarg ? " [$sarg]" : '' ) )
      if $c->debug;

    $self->_encoders->{$sclass} ||= $sclass->new;
    my $sobj = $self->_encoders->{$sclass};
    my $rc;
    eval {
      if ( defined($sarg) ) {
        $rc = $sobj->execute( $controller, $c, $sarg );
      }
      else {
        $rc = $sobj->execute( $controller, $c );
      }
    };
    if ($@) {
      $c->log->debug($@);
      return $self->serialize_bad_request( $c, $content_type, $@ );
    }
    elsif ( !$rc ) {
      return $self->unsupported_media_type( $c, $content_type );
    }

    return 1;
  }
  else {
    # don't use error template for 400 errors as these are handled by the
    # standard templates
    return 1 if ( $c->res->status =~ /^400/ );
    return 1 unless ( scalar( @{ $c->error } ) or $c->res->status =~ /^4\d\d/ );
    return 1 if ( $c->debug );
    $self->actions( {} );
    $self->handlers( [] );
    $self->_parse_config($c);
    $self->handle($c);
  }
}

sub handle {
  my $self = shift;
  my $c    = shift;

  my $code = $c->res->status;
  if ( $code == 200 and scalar( @{ $c->error } ) ) {
    $code =
      500;    # We default to 500 for errors unless something else has been set.
    $c->res->status($code);
  }
  my $body;
  foreach my $h ( @{ $self->handlers } ) {
    if ( $code =~ $h->{decider} ) {
      eval { $body = $self->render( $c, $h->{render} ); };
      if ( $@ and $@ =~ m/Error rendering/ ) {

        # we continue to next step
        next;
      }
      elsif ($@) {
        croak $@;
      }

      # We have successfully rendered something, so we clear errors
      # and set content
      $c->res->body($body);
      if ( $h->{actions} ) {
        foreach my $a ( @{ $h->{actions} } ) {
          next unless defined $a;
          $a->perform($c);
        }
      }
      $c->clear_errors;

      # We have some actions to perform
      last;
    }
  }
}

sub render {
  my $self = shift;
  my $c    = shift;
  my $args = shift;

  if ( $args->{static} ) {
    my $file =
      ( $args->{static} !~ m|^/| )
      ? $c->path_to( $args->{static} )
      : $args->{static};
    open( my $fh, "<", $file ) or croak "cannot read: $file";
    return $fh;
  }
  elsif ( $args->{template} ) {

    # We try to render it using the view, but will catch errors we hope
    my $content;
    eval {
      $content =
        $c->view->render( $c, $args->{template},
        { additional_template_paths => [ $c->path_to('root') ] } );
    };
    unless ($@) {
      return $content;
    }
    else {
      croak "Error rendering - TT error on template " . $args->{template};
    }
  }
  else {
    croak "Error rendering - no template or static";
  }
}

sub _parse_config {
  my $self = shift;
  my $c    = shift;

  $self->_parse_actions( $c, $c->config->{'error_handler'}->{'actions'} );
  $self->_parse_handlers( $c, $c->config->{'error_handler'}->{'handlers'} );

}

sub _parse_actions {
  my $self = shift;
  my $c    = shift;

  my $actions = shift;

  if ($actions and ref($actions) eq 'HASH') {
    $actions = [$actions];
  }

  unless ( $actions and scalar(@$actions) ) {

    # We dont have any actions, lets create a default log action.
    my $action = {
      type  => 'Log',
      id    => 'default-log-error',
      level => 'error',
    };
    push @$actions, $action;
  }
  foreach my $action (@$actions) {
    $self->_expand( $c, $action );
    my $class;
    if ( $action->{'type'} and $action->{'type'} =~ /^\+/ ) {
      $class = $action->{'type'};
    }
    elsif ( $action->{'type'} ) {
      $class = ref($self) . "::Action::" . $action->{'type'};
    }
    else {
      croak "No type specified";
    }

    unless ( Class::Inspector->loaded($class) ) {
      eval "require $class";
      if ($@) {
        croak "Could not load '$class': $@";
      }
    }
    my $act = $class->new(%$action);
    $self->actions->{ $act->id } = $act;
  }
}

sub _parse_handlers {
  my $self     = shift;
  my $c        = shift;
  my $handlers = shift;
  my $codes    = {};
  my $blocks   = {};
  my $fallback = {
    render  => { static => 'root/static/error.html' },
    decider => qr/./,
    actions => [
        $self->action('default-log-error')
      ? $self->action('default-log-error')
      : undef
    ]
  };
  foreach my $status ( keys %$handlers ) {
    my $handler = {
      actions =>
        [ map { $self->action($_) } @{ $handlers->{$status}->{actions} } ],
      render => (
        $handlers->{$status}->{template}
        ? { template => $handlers->{$status}->{template} }
        : { static   => $handlers->{$status}->{static} }
      ),
    };

    if ( $status =~ m/\dxx/ ) {

      #codegroup
      my $decider = $status;
      $decider =~ s/x/\\d/g;
      $handler->{decider} = qr/$decider/;
      $blocks->{$status} = $handler;
    }
    elsif ( $status =~ m/\d{3}/ ) {
      $handler->{decider} = qr/$status/;
      $codes->{$status} = $handler;
    }
    elsif ( $status eq 'fallback' ) {
      $handler->{decider} = qr/./;
      $fallback = $handler;
    }
    else {
      carp "Wrong status: $status specified";
    }
  }
  my @handlers;
  push( @handlers, values(%$codes), values(%$blocks), $fallback );
  $self->handlers( \@handlers );
}

sub _expand {
  my $self = shift;
  my $c    = shift;
  my $h    = shift;

  foreach my $k ( keys %$h ) {
    my $v    = $h->{$k};
    my $name = $c->config->{name};
    $v =~ s/__MYAPP__/$name/g;
    $h->{$k} = $v;
  }
}

1;
