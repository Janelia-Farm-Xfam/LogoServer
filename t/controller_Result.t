use strict;
use warnings;
use Test::More;


use Catalyst::Test 'LogoServer';
use LogoServer::Controller::Result;

ok( request('/logo')->is_success, 'Request should succeed' );
done_testing();
