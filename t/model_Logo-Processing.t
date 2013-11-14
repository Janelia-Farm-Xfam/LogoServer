use strict;
use warnings;
use Test::Most tests => 11;
use FindBin;
use File::Slurp;

BEGIN { use_ok 'LogoServer::Model::Logo::Processing' }

my $data = $FindBin::Bin . '/data';

my $model = 'LogoServer::Model::Logo::Processing';
my $obj = $model->new();

isa_ok($obj, $model);
can_ok($obj, 'convert_upload');

#########
# test a valid hmm
my $file = $data . '/valid_hmm';
my $converted_file = $obj->convert_upload($file);
my $hmm = read_file( "$file/upload" );
my $converted = read_file( $converted_file );
is($hmm, $converted, "valid_hmm wasn't changed");

unlink $converted_file;

#########
# test a valid msa
$file = $data . '/valid_msa';
$converted_file = $obj->convert_upload($file);

open my $converted_msa, '<', $data . '/converted_msa'
  or die "Couldn't open converted_msa for reading\n";

# strip off the date lines or the comparison will never work.
my $expected = undef;
while (my $line = <$converted_msa>) {
  if ($line !~ /^DATE/) {
    $expected .= $line;
  }
}

open my $fh, '<', $converted_file
  or die "Couldn't open the converted hmm\n";

my $msa_2_hmm = undef;
while (my $line = <$fh>) {
  if ($line !~ /^DATE/) {
    $msa_2_hmm .= $line;
  }
}

is($msa_2_hmm, $expected, "valid_msa was changed into expected hmm");

unlink $converted_file;


#########
# test an invalid hmm
$file = $data . '/bad_hmm';
throws_ok { $obj->convert_upload($file) } qr/Uploaded data was not a valid multiple/, 'caught bad hmm';

#########
# test an invalid msa
$file = $data . '/bad_msa';
throws_ok { $obj->convert_upload($file) } qr/Uploaded data was not a valid multiple/, 'caught bad msa';

#########
# test a single sequence
$file = $data . '/single_sequence';
throws_ok { $obj->convert_upload($file) } qr/The file you have uploaded looks like a single sequence./, 'caught single sequence';

#########
# test multiple sequences
$file = $data . '/multiple_sequences';
throws_ok { $obj->convert_upload($file) } qr/The file you have uploaded looks like multiple unaligned sequences./, 'caught multiple sequences';

#########
# test a corrupt single sequence
$file = $data . '/bad_sequence';
throws_ok { $obj->convert_upload($file) } qr/AFA format, but we couldn't parse it because: one or more invalid sequence characters at or near line 2/, 'caught bad sequence';

#########
# test a zipped file?
$file = $data . '/multiple_seqs.gz';
throws_ok { $obj->convert_upload($file) } qr/Uploaded data was not a valid multiple sequence alignment or HMM/, 'caught sequence that was zipped';


