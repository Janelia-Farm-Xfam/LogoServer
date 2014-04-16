package LogoServer::Controller::Root;
use Moose;
use namespace::autoclean;
use Data::Printer;
use Try::Tiny;
use Data::UUID;

BEGIN { extends 'LogoServer::Controller::Base' }

#
# Sets the actions in this controller to be registered with no prefix
# so they function identically to actions created in MyApp.pm
#
__PACKAGE__->config(
  namespace => '',
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

sub index : Path : Args(0) : ActionClass('~REST::ForBrowsers') {
  my ($self, $c) = @_;
  return;
}

=head2 index_GET_html

=cut

sub index_GET_html : Private {
  my ($self, $c) = @_;
  return;
}

=head2 index_GET

=cut

sub index_GET : Private {
  my ( $self, $c ) = @_;
  $c->stash->{rest} = [];
  return;
}

=head2 index_POST

=cut

sub index_POST :Private {
  my ( $self, $c ) = @_;
  $c->forward('save_upload');
  $c->stash->{rest} = {
    'message' => 'Logo generated successfully',
    'uuid' => $c->stash->{uuid},
    'url' => $c->uri_for('/logo', $c->stash->{uuid})->as_string
  };
}

=head2 index_POST_html

=cut

sub index_POST_html :Private {
  my ( $self, $c ) = @_;
  $c->forward('save_upload');
  $c->res->redirect($c->uri_for('/logo', $c->stash->{uuid}));
}

sub build_logo : Private {
  my ($self, $c) = @_;

  my $hmm_file = $c->model('LogoData')->_data_dir($c->stash->{uuid});
  # convert uploaded file to hmm if not already an hmm
  my $hmm = undef;

  my %conversion = (
    'observed' => 1,
    'weighted' => 2,
    'hmm_all' => 3,
    'hmm' => 4,
  );

  my $processing = 4;
  if (exists $conversion{$c->stash->{processing}}) {
    $processing = $conversion{$c->stash->{processing}};
  }

  try {
    $hmm = $c->model('Logo::Processing')->convert_upload(
      $hmm_file,
      $processing,
      $c->stash->{frag},
    );
  }
  catch {
    $c->stash->{error} = {'hmmbuild' => $_ };
    $c->stash->{rest}->{error} = $c->stash->{error};
    $c->detach('end');
  };

  return;

}

sub save_upload : Private {
  my ($self, $c) = @_;
  my $uuid = Data::UUID->new()->create_str();

  my $data = $c->model('LogoData');

  # save uploaded file into the new directory
  my $upload = $c->req->upload('file');


  # If we are missing an upload, check to see if we are getting a
  # UUID from a previous search and use that instead.
  if (!$upload) {
    if ($c->req->param('previous')) {
      my $previous = $c->model('LogoData');
      my $prev_uuid = $c->req->param('previous');

      my $previous_path = $previous->upload_path($prev_uuid);

      my $previous_name = $previous->get_options($prev_uuid)->{'file'};

      $c->req->params->{'file'} = $previous_name;

      $upload = Catalyst::Request::Upload->new(
        filename => $previous_name,
        tempname => $previous_path,
      );
    }
  }

  # if the upload is still missing, then we are going to have to throw an error
  if (!$upload) {
    $c->stash->{error} = {
      'file' => 'Please choose an alignment or HMM file to upload.'
    };
    $c->stash->{rest}->{error} = $c->stash->{error};
    $c->detach('end');
  }
  else {

    $data->save_upload($uuid, $upload);

    my $file_contents = $upload->slurp;

    if ($file_contents =~ /^[\n\r\s]*HMMER/ && $file_contents =~ m|//[\n\r\s]*$|) {
      $c->stash->{file_is_hmm}++;
    }

    # save this info for later use.
    $c->stash->{uuid} = $uuid;

    my $params = $c->req->params;

    # store the upload type for use later in the results page.
    if (exists $c->stash->{file_is_hmm}) {
      $params->{upload_type} = 'hmm';
    }
    else {
      $params->{upload_type} = 'other';
    }

    my $valid = {};

    #need to loop over parameters and validate here, before we store them.

    # 1. check that the processing / file type combo is valid:
    #
    # hmm: processing type
    #   hmm
    #
    #alignment: processing type
    #   observed, weighted or hmm
    #

    if (exists $params->{letter_height}) {
      if ($params->{letter_height} =~ /^(?:score|info_content_(?:all|above))$/) {
        $valid->{letter_height} = $params->{letter_height};
      }
      else {
        $c->stash->{error} = {
          'letter_height' => 'This is not a valid letter height.'
        };
        $c->stash->{rest}->{error} = $c->stash->{error};
        $c->detach('end');
      }
    }


    my @allowed = qw(file upload_type);
    for my $param (@allowed) {
      if (exists $params->{$param}) {
        $valid->{$param} = $params->{$param};
      }
    }

    # check what type of processing we want to do if we are using an MSA
    if (exists $params->{processing}) {
      if ($params->{processing} =~ /^(?:weighted|hmm|hmm_all|observed)$/) {
        $c->stash->{processing} = $valid->{processing} = $params->{processing};
      }
    }
    else {
      $c->stash->{processing} = $valid->{processing} = 'hmm_all';
    }

    # check what type of fragment handling we are going to use
    if (exists $params->{frag}) {
      if ($params->{frag} =~ /^(?:full|frag)$/) {
        $c->stash->{frag} = $valid->{frag} = $params->{frag};
      }
    }
    else {
      $c->stash->{frag} = $valid->{frag} = 'full';
    }



    if ($valid->{processing} =~ /^(?:weighted|observed)$/ && exists $c->stash->{file_is_hmm}) {
      if ($c->request->looks_like_browser) {
        $valid->{processing} = 'hmm';
        $valid->{error} = 'HMM files do not require an alignment processing step. We have modified your alignment processing choice accordingly. In future please select the "Convert to an HMM" option to prevent this message.';
      }
      else {
        $c->stash->{error} = {
          'processing' => 'HMM files do not require an alignment processing step. If you are uploading an hmm file, you can leave the processing argument blank.'
        };
        $c->stash->{rest}->{error} = $c->stash->{error};
        $c->detach('end');
      }
    }

    # if we got nothing, then we don't want the json encode to blow up.
    $params ||= {};

    $data->set_options($uuid, $valid);

    $c->forward('build_logo');
  }
  return;
}


=head2 default

Standard 404 error page

=cut

sub default :Path {
  my ( $self, $c ) = @_;
  $c->response->status(404);
}

=head1 AUTHOR

Clements, Jody

=head1 LICENSE

This library is free software. You can redistribute it and/or modify
it under the same terms as Perl itself.

=cut

__PACKAGE__->meta->make_immutable;

1;
