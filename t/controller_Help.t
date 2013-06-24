use strict;
use warnings;
use Test::More;


use Catalyst::Test 'LogoServer';
use LogoServer::Controller::Help;

ok( request('/help')->is_success, 'Request should succeed' );
done_testing();
