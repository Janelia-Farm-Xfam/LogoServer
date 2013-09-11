package Easel::Validation;
use Data::Printer;

my $src_file = undef;

BEGIN {
  $src_file = __FILE__;
  $src_file =~ s/\.pm/\.c/;
}

use Inline C         => "$src_file",
           ENABLE    => 'AUTOWRAP',
           #DIRECTORY => '/opt/www/HmmerWeb/current/build',
           INC       => '-I/opt/src/hmmer/easel -I/opt/src/hmmer/src',
           LIBS      => '-L/opt/src/hmmer/easel -L/opt/src/hmmer/src -lhmmer -leasel -lsvml -lirc',
           NAME      => 'Easel::Validation',
           ENABLE    => 'SAFEMODE',
           ENABLE    => 'CLEAN_BUILD_AREA', #Production have enabled
           DISABLE   => 'PRINT_INFO',       #Production have disabled
           DISABLE   => 'FORCE_BUILD';      #Production have disabled

#-------------------------------------------------------------------------------
=head2 guessInput

  Title    : guessInput
  Usage    : my $res = Easel::Validation::guessInput( $userInput )
  Function : Determines what flavour of input the "user" has entered.  Used by
           : the website, to try and figure out if a single sequence, multiple
           : sequence, multiple sequence alignment, profile HMM or junk.
           : If the input is a MSA, it will be converted to a profile HMM.
  Args     : String containing the user input
  Returns  : A hash reference containing the following possible key/value pairings
           :   hmmpgmd - if MSA was found, the profile HMM of it
           :   count   - Number of sequences found
           :   error   - an error message
           :   alpha   - the alphabet as detected by HMMER, so is an integer. 3 is amino acid
           :   type    - One of the following codes -
                         SS  -> single sequence
                         MS  -> multiple sequences
                         MSA -> aligned multiple sequences
                         UNK -> unknow/error
                         MS? -> can not decide between MS/MSA. Only happend when
                                there are multiple sequences that have no gaps and
                                are the same length.

=cut

# easel error status numbers
#define eslOK              0    /* no error/success             */
#define eslFAIL            1    /* failure                      */
#define eslEOL             2    /* end-of-line (often normal)   */
#define eslEOF             3    /* end-of-file (often normal)   */
#define eslEOD             4    /* end-of-data (often normal)   */
#define eslEMEM            5    /* malloc or realloc failed     */
#define eslENOTFOUND       6    /* file or key not found        */
#define eslEFORMAT         7    /* file format not correct      */
#define eslEAMBIGUOUS      8    /* an ambiguity of some sort    */
#define eslEDIVZERO        9    /* attempted div by zero        */
#define eslEINCOMPAT      10    /* incompatible parameters      */
#define eslEINVAL         11    /* invalid argument/parameter   */
#define eslESYS           12    /* generic system call failure  */
#define eslECORRUPT       13    /* unexpected data corruption   */
#define eslEINCONCEIVABLE 14    /* "can't happen" error         */
#define eslESYNTAX        15    /* invalid user input syntax    */
#define eslERANGE         16    /* value out of allowed range   */
#define eslEDUP           17    /* saw a duplicate of something */
#define eslENOHALT        18    /* a failure to converge        */
#define eslENORESULT      19    /* no result was obtained       */
#define eslENODATA        20    /* no data provided, file empty */
#define eslETYPE          21    /* invalid type of argument     */
#define eslEOVERWRITE     22    /* attempted to overwrite data  */
#define eslENOSPACE       23    /* ran out of some resource     */
#define eslEUNIMPLEMENTED 24    /* feature is unimplemented     */
#define eslENOFORMAT      25  /* couldn't guess file format   */
#define eslENOALPHABET    26  /* couldn't guess seq alphabet  */
#define eslEWRITE         27    /* write failed (fprintf, etc)  */
#define eslEINACCURATE    28    /* return val may be inaccurate */

# easel MSA format numbers
#
#define eslMSAFILE_UNKNOWN     0    /* unknown format
#define eslMSAFILE_STOCKHOLM   101  /* Stockholm format, interleaved
#define eslMSAFILE_PFAM        102  /* Pfam/Rfam one-line-per-seq Stockholm format
#define eslMSAFILE_A2M         103  /* UCSC SAM's fasta-like a2m format
#define eslMSAFILE_PSIBLAST    104  /* NCBI PSI-BLAST alignment format
#define eslMSAFILE_SELEX       105  /* old SELEX format (largely obsolete)
#define eslMSAFILE_AFA         106  /* aligned FASTA format
#define eslMSAFILE_CLUSTAL     107  /* CLUSTAL format
#define eslMSAFILE_CLUSTALLIKE 108  /* CLUSTAL-like formats (MUSCLE, PROBCONS)
#define eslMSAFILE_PHYLIP      109  /* interleaved PHYLIP format
#define eslMSAFILE_PHYLIPS     110  /* sequential PHYLIP format

  my %msa_types = (
    0    => 'UNKNOWN',
    101  => 'STOCKHOLM',
    102  => 'PFAM',
    103  => "A2M",
    104  => "PSIBLAST",
    105  => "SELEX",
    106  => 'AFA',
    107  => 'CLUSTAL',
    108  => 'CLUSTALLIKE',
    109  => 'PHYLIP',
    110  => 'PHYLIPS',
  );

sub guessInput {
  my ( $inputData, $ali_hmm, $dna_rna_ok) = @_;

  # By default we don't want an alignment hmm, so passing nothing gets us that.
  $ali_hmm ||= 0;

  $dna_rna_ok ||= 0;

  #Hopefully this will go.....
  my $test_results = {};
  $test_results = isaHMM($inputData);
  if ( exists($test_results->{type}) and $test_results->{type} eq 'HMM') {
    if (defined($test_results->{error})) {
      $test_results->{type} = 'UNK';
    }
    elsif ( $test_results->{alpha} != 3 ) {
      if ($dna_rna_ok && $test_results->{alpha} =~ /^1|2$/) {
        # By default we don't want dna or rna alphabets as they are not valid on the
        # HMMER website. We do want them for the logo website, hence the flag.
      }
      else {
        $test_results->{error} = "Bad alphabet";
        delete $test_results->{hmmpgmd};
      }
    }
    return $test_results;
  }

  #We have not detected a HMM, how about an MSA
  $test_results = {};
  $test_results = isaMSA($inputData, 0, $ali_hmm, $dna_rna_ok);

  # if we get what looks like an aligned fasta file, but the sequence
  # lengths are wrong then we should set this to unknown and pass it to
  # the sequence checks to see if it is just a bunch of sequences.
  if (exists $test_results->{guess} && $test_results->{guess} == '106') {
    if (exists $test_results->{error}
      && $test_results->{error} =~ /sequence .* has alen .* expected/ ) {
      $test_results->{type} = 'UNK';
    }
  }

  if( exists($test_results->{type}) ){
    if($test_results->{type} eq 'MS?'){
      #Can we detect and gap residues in non-header lines.
      my $found =0;
      foreach(split(/\n/, $inputData)){
        next if(/^>/);
        if(/\.|\-/){
          $test_results->{type} = 'MSA';
          $found++;
          last;
        }
      }
      #now force it to be a MSA
      if($found){
        $test_results = isaMSA($inputData, 1, $ali_hmm, $dna_rna_ok);
      }
    }

    if( $test_results->{type} eq 'MSA' && exists $test_results->{alpha}){
      if ($test_results->{alpha} == 3 ) {
        return $test_results;
      }
      else {
        if ($dna_rna_ok && $test_results->{alpha} =~ /^1|2$/) {
          return $test_results;
        }
        else {
          $test_results->{error} = "Bad alphabet";
          delete $test_results->{hmmpgmd};
        }
      }
    }
    elsif( $test_results->{type} eq 'MS?' ){
      if ($test_results->{alpha} == 3 ) {
        return $test_results;
      }
      else {
        if ($dna_rna_ok && $test_results->{alpha} =~ /^1|2$/) {
          return $test_results;
        }
        else {
          $test_results->{error} = "Bad alphabet";
          delete $test_results->{hmmpgmd};
        }
      }
    }
  }

  # we want to save the guess for use later on. The test_results hash
  # gets overwritten by the Seq check, so storing it here to add back
  # on later
  my $guess = undef;
  if (exists $test_results->{'guess'}) {
    $guess = $test_results->{'guess'};
  }

  if($test_results->{type} eq 'UNK' && $test_results->{alpha} != 1){
    $test_results = isaSeq($inputData);
  }

  # if there was a guess, then we probably failed at a multiple sequence
  # alignment, but were very close. Add it back to the test results, so that
  # we can change the error message returned to the user.
  if ($guess) {
    $test_results->{'guess'} = $msa_types{$guess};
  }

  return $test_results;

}

1;
