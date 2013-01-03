use strict;
use warnings;

use LogoServer;

my $app = LogoServer->apply_default_middlewares(LogoServer->psgi_app);
$app;

