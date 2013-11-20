#include "p7_config.h"
#include "esl_config.h"

#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <stdarg.h>

#include "easel.h"
#include "esl_msa.h"
#include "esl_alphabet.h"
#include "esl_fileparser.h"
#include "esl_sqio.h"
#include "esl_sq.h"
#include "hmmer.h"
#include "hmmpgmd.h"


#define ALPHOPTS "--amino,--dna,--rna"                         /* Exclusive options for alphabet choice */
#define CONOPTS "--fast,--hand"                                /* Exclusive options for model construction                    */
#define EFFOPTS "--eent,--eclust,--eset,--enone"               /* Exclusive options for effective sequence number calculation */
#define WGTOPTS "--wgsc,--wblosum,--wpb,--wnone,--wgiven"      /* Exclusive options for relative weighting                    */

static ESL_OPTIONS options[] = {
  /* name           type      default  env  range     toggles      reqs   incomp  help   docgroup*/
  { "-h",        eslARG_NONE,   FALSE, NULL, NULL,      NULL,      NULL,    NULL, "show brief help on version and usage",                  1 },
  { "-n",        eslARG_STRING,  NULL, NULL, NULL,      NULL,      NULL,    NULL, "name the HMM <s>",                                      1 },
  { "-o",        eslARG_OUTFILE,FALSE, NULL, NULL,      NULL,      NULL,    NULL, "direct summary output to file <f>, not stdout",         1 },
  { "-O",        eslARG_OUTFILE,FALSE, NULL, NULL,      NULL,      NULL,    NULL, "resave annotated, possibly modified MSA to file <f>",   1 },
/* Selecting the alphabet rather than autoguessing it */
  { "--amino",   eslARG_NONE,   FALSE, NULL, NULL,   ALPHOPTS,    NULL,     NULL, "input alignment is protein sequence data",              2 },
  { "--dna",     eslARG_NONE,   FALSE, NULL, NULL,   ALPHOPTS,    NULL,     NULL, "input alignment is DNA sequence data",                  2 },
  { "--rna",     eslARG_NONE,   FALSE, NULL, NULL,   ALPHOPTS,    NULL,     NULL, "input alignment is RNA sequence data",                  2 },
/* Alternate model construction strategies */
  { "--fast",    eslARG_NONE,"default",NULL, NULL,    CONOPTS,    NULL,     NULL, "assign cols w/ >= symfrac residues as consensus",       3 },
  { "--hand",    eslARG_NONE,   FALSE, NULL, NULL,    CONOPTS,    NULL,     NULL, "manual construction (requires reference annotation)",   3 },
  { "--symfrac", eslARG_REAL,   "0.5", NULL, "0<=x<=1", NULL,   "--fast",   NULL, "sets sym fraction controlling --fast construction",     3 },
  { "--fragthresh",eslARG_REAL, "0.5", NULL, "0<=x<=1", NULL,     NULL,     NULL, "if L <= x*alen, tag sequence as a fragment",            3 },
/* Alternate relative sequence weighting strategies */
  /* --wme not implemented in HMMER3 yet */
  { "--wpb",     eslARG_NONE,"default",NULL, NULL,    WGTOPTS,    NULL,      NULL, "Henikoff position-based weights",                      4 },
  { "--wgsc",    eslARG_NONE,   NULL,  NULL, NULL,    WGTOPTS,    NULL,      NULL, "Gerstein/Sonnhammer/Chothia tree weights",             4 },
  { "--wblosum", eslARG_NONE,   NULL,  NULL, NULL,    WGTOPTS,    NULL,      NULL, "Henikoff simple filter weights",                       4 },
  { "--wnone",   eslARG_NONE,   NULL,  NULL, NULL,    WGTOPTS,    NULL,      NULL, "don't do any relative weighting; set all to 1",        4 },
  { "--wgiven",  eslARG_NONE,   NULL,  NULL, NULL,    WGTOPTS,    NULL,      NULL, "use weights as given in MSA file",                     4 },
  { "--wid",     eslARG_REAL, "0.62",  NULL,"0<=x<=1",   NULL,"--wblosum",   NULL, "for --wblosum: set identity cutoff",                   4 },
/* Alternative effective sequence weighting strategies */
  { "--eent",    eslARG_NONE,"default",NULL, NULL,    EFFOPTS,    NULL,      NULL, "adjust eff seq # to achieve relative entropy target",  5 },
  { "--eclust",  eslARG_NONE,  FALSE,  NULL, NULL,    EFFOPTS,    NULL,      NULL, "eff seq # is # of single linkage clusters",            5 },
  { "--enone",   eslARG_NONE,  FALSE,  NULL, NULL,    EFFOPTS,    NULL,      NULL, "no effective seq # weighting: just use nseq",          5 },
  { "--eset",    eslARG_REAL,   NULL,  NULL, NULL,    EFFOPTS,    NULL,      NULL, "set eff seq # for all models to <x>",                  5 },
  { "--ere",     eslARG_REAL,   NULL,  NULL,"x>0",       NULL, "--eent",     NULL, "for --eent: set minimum rel entropy/position to <x>",  5 },
  { "--esigma",  eslARG_REAL, "45.0",  NULL,"x>0",       NULL, "--eent",     NULL, "for --eent: set sigma param to <x>",                   5 },
  { "--eid",     eslARG_REAL, "0.62",  NULL,"0<=x<=1",   NULL,"--eclust",    NULL, "for --eclust: set fractional identity cutoff to <x>",  5 },
/* Alternative prior strategies */
  { "--pnone",   eslARG_NONE,  FALSE,  NULL, NULL,       NULL,  NULL,"--plaplace", "don't use any prior; parameters are frequencies",      9 },
  { "--plaplace",eslARG_NONE,  FALSE,  NULL, NULL,       NULL,  NULL,   "--pnone", "use a Laplace +1 prior",                               9 },
/* Single sequence methods */
  { "--singlemx", eslARG_NONE,   FALSE, NULL,   NULL,   NULL,  NULL,           "",   "use substitution score matrix for single-sequence inputs",     10 },
  { "--popen",    eslARG_REAL,   "0.02", NULL,"0<=x<0.5",NULL, NULL,           "",   "gap open probability (with --singlemx)",                         10 },
  { "--pextend",  eslARG_REAL,    "0.4", NULL, "0<=x<1", NULL, NULL,           "",   "gap extend probability (with --singlemx)",                       10 },
  { "--mx",     eslARG_STRING, "BLOSUM62", NULL, NULL,   NULL, NULL,   "--mxfile",   "substitution score matrix (built-in matrices, with --singlemx)", 10 },
  { "--mxfile", eslARG_INFILE,     NULL, NULL,   NULL,   NULL, NULL,       "--mx",   "read substitution score matrix from file <f> (with --singlemx)", 10 },

  /* Control of E-value calibration */
  { "--EmL",     eslARG_INT,    "200", NULL,"n>0",       NULL,    NULL,      NULL, "length of sequences for MSV Gumbel mu fit",            6 },
  { "--EmN",     eslARG_INT,    "200", NULL,"n>0",       NULL,    NULL,      NULL, "number of sequences for MSV Gumbel mu fit",            6 },
  { "--EvL",     eslARG_INT,    "200", NULL,"n>0",       NULL,    NULL,      NULL, "length of sequences for Viterbi Gumbel mu fit",        6 },
  { "--EvN",     eslARG_INT,    "200", NULL,"n>0",       NULL,    NULL,      NULL, "number of sequences for Viterbi Gumbel mu fit",        6 },
  { "--EfL",     eslARG_INT,    "100", NULL,"n>0",       NULL,    NULL,      NULL, "length of sequences for Forward exp tail tau fit",     6 },
  { "--EfN",     eslARG_INT,    "200", NULL,"n>0",       NULL,    NULL,      NULL, "number of sequences for Forward exp tail tau fit",     6 },
  { "--Eft",     eslARG_REAL,  "0.04", NULL,"0<x<1",     NULL,    NULL,      NULL, "tail mass for Forward exponential tail tau fit",       6 },

/* Other options */
#ifdef HMMER_THREADS
  { "--cpu",     eslARG_INT,    NULL,"HMMER_NCPU","n>=0",NULL,     NULL,  NULL,  "number of parallel CPU workers for multithreads",       8 },
#endif
#ifdef HAVE_MPI
  { "--mpi",     eslARG_NONE,   FALSE, NULL, NULL,      NULL,      NULL,  NULL,  "run as an MPI parallel program",                        8 },
#endif
  { "--stall",   eslARG_NONE,       FALSE, NULL, NULL,    NULL,     NULL,    NULL, "arrest after start: for attaching debugger to process", 8 },
  { "--informat", eslARG_STRING,     NULL, NULL, NULL,    NULL,     NULL,    NULL, "assert input alifile is in format <s> (no autodetect)", 8 },
  { "--seed",     eslARG_INT,        "42", NULL, "n>=0",  NULL,     NULL,    NULL, "set RNG seed to <n> (if 0: one-time arbitrary seed)",   8 },
  { "--w_beta",   eslARG_REAL,       NULL, NULL, NULL,    NULL,     NULL,    NULL, "tail mass at which window length is determined",        8 },
  { "--w_length", eslARG_INT,        NULL, NULL, NULL,    NULL,     NULL,    NULL, "window length ",                                        8 },
  { "--maxinsertlen",  eslARG_INT,   NULL, NULL, "n>=5",  NULL,     NULL,    NULL, "pretend all inserts are length <= <n>",   8 },
  {  0, 0, 0, 0, 0, 0, 0, 0, 0, 0 },
};

P7_HMM * constructHMM(ESL_MSA *msa, ESL_ALPHABET *abc, int ali_hmm, int frag, P7_HMM **ret_hmm, char *errbuf);


SV* isaHMM (char *input){
  P7_HMMFILE      *hfp      = NULL;                 /* open input HMM file */
  P7_HMM          *hmm      = NULL;                 /* HMM object */
  ESL_ALPHABET    *abc      = NULL;                 /* alphabet (set from the HMM file)*/
  int             isaHMM = 1;
  int             status;
  int             cnt = 0;
  HV* hash        = newHV();
  hv_store(hash, "type", strlen("type"), newSVpv("UNK", 3), 0);

  /* read the hmm */
  if ((status = p7_hmmfile_OpenBuffer(input, strlen(input), &hfp)) != 0 ) {
    hv_store(hash, "error", strlen("error"), newSViv(status), 0);
  }else{
    hv_store(hash, "type", strlen("type"), newSVpv("HMM", 3), 0);
  }

  if(status == 0){
    /* double check that we can read the whole HMM */
    status = p7_hmmfile_Read(hfp, &abc, &hmm);
    cnt++;
    if (status != eslOK ){
      hv_store(hash, "error", strlen("error"), newSVpv("Error in HMM format",19 ), 0);
    }else{
      hv_store(hash, "alpha", strlen("alpha"), newSViv(abc->type), 0);
      hv_store(hash, "hmmpgmd", strlen("hmmpgmd"), newSVpv(input, strlen(input)), 0);
      hv_store(hash, "count", strlen("count"), newSViv(cnt), 0);
    }
  }


  if (abc != NULL) esl_alphabet_Destroy(abc);
  if(hfp != NULL) p7_hmmfile_Close(hfp);
  if(hmm != NULL) p7_hmm_Destroy(hmm);
  return newRV_noinc((SV*) hash);
}

SV* isaMSA (const char *input, int is_msa, int ali_hmm, int dna_ok, int frag){
  ESLX_MSAFILE *mfp         = NULL;
  ESL_MSA      *msa         = NULL;
  ESL_MSA      *msa_clone   = NULL;
  ESL_ALPHABET *abc         = NULL;
  P7_HMM       *ret_hmm     = NULL;
  char         *ascii_hmm   = NULL;
  int alpha;
  int status;
  char            errbuf[eslERRBUFSIZE];
  HV* hash = newHV();
  hv_store(hash, "type", strlen("type"), newSVpv("UNK", 3), 0);

  if ((status = eslx_msafile_OpenMem( &abc, input, -1, NULL, NULL, &mfp)) != eslOK){
    hv_store(hash, "error", strlen("error"), newSViv(status), 0);
  }else{
    status = eslx_msafile_Read(mfp, &msa);

    if(status != eslOK){
      hv_store(hash, "error", strlen("error"), newSVpv(mfp->errmsg, strlen(mfp->errmsg)), 0);
      hv_store(hash, "guess", strlen("guess"), newSViv(mfp->format), 0);
      hv_store(hash, "type", strlen("type"), newSVpv("MSA", 3), 0);
      hv_store(hash, "position", strlen("position"), newSViv(mfp->linenumber), 0);

    }else{
      esl_msa_Textize(msa);
      esl_msa_GuessAlphabet(msa, &alpha);
      hv_store(hash, "alpha", strlen("alpha"), newSViv(alpha), 0);
      if(alpha == eslAMINO || (dna_ok == 1 && (alpha == eslDNA || alpha == eslRNA))){
        abc = esl_alphabet_Create(alpha);
        esl_msa_Digitize( abc, msa, errbuf);
        hv_store(hash, "count", strlen("count"), newSViv(msa->nseq), 0);
        if(msa->nseq == 1 && mfp->format == eslMSAFILE_AFA){
          hv_store(hash, "type", strlen("type"), newSVpv("SS", 2), 0);
          hv_store(hash, "hmmpgmd", strlen("hmmpgmd"), newSVpv(input, strlen(input)), 0);
        }else{
          // We have been told it is an MSA or it is any other format other than AFA
          hv_store(hash, "type", strlen("type"), newSVpv("MSA", 3), 0);
          status = constructHMM( msa, abc, ali_hmm, frag, &ret_hmm, errbuf);

          if (status != eslOK) {
            hv_store(hash, "error", strlen("error"), newSVpv(errbuf, strlen(errbuf)), 0);
            hv_store(hash, "guess", strlen("guess"), newSViv(mfp->format), 0);
          } else {
            p7_hmmfile_WriteToString(&ascii_hmm, -1, ret_hmm);
            hv_store(hash, "hmmpgmd", strlen("hmmpgmd"), newSVpv(ascii_hmm, strlen(ascii_hmm)), 0);
          }

        }
      }else{
        if(alpha == 0 ){
          hv_store(hash, "error", strlen("error"), newSVpv("Could not determine alphabet", 28), 0);
        }else{
          hv_store(hash, "error", strlen("error"), newSVpv("Bad alphabet", 12), 0);
        }
        if (msa->nseq > 1) {
          if( mfp->format == eslMSAFILE_AFA){
            hv_store(hash, "type", strlen("type"), newSVpv("MS?", 3), 0);
          }else{
            hv_store(hash, "type", strlen("type"), newSVpv("MSA", 3), 0);
          }
        }
      }
    }
  }

  if (mfp != NULL) eslx_msafile_Close(mfp);
  if (abc != NULL) esl_alphabet_Destroy(abc);
  if (msa != NULL) esl_msa_Destroy(msa);
  if (ret_hmm != NULL) p7_hmm_Destroy(ret_hmm);
  if (ascii_hmm != NULL ) free( ascii_hmm );

  return newRV_noinc((SV*) hash);
}



/* This is a different construction method to that found in Easel::Align!!! */

P7_HMM * constructHMM(ESL_MSA *msa, ESL_ALPHABET *abc, int ali_hmm, int frag, P7_HMM **ret_hmm, char *errbuf){
  int status;
  ESL_GETOPTS  *go          = esl_getopts_Create(options);
  P7_BUILDER      *bld      = NULL;
  P7_BG           *bg       = NULL;

  char            *args = NULL;

  esl_strcat(&args, -1, "X ", -1);

  status = esl_msa_SetName(msa, "Query", -1);
  /* Now take this alignment and make an HMM from it */
  if(status != eslOK){
    ESL_XFAIL(status, errbuf, "Easel MSA SetNAME returned an error %d\n", status);
  }
  bg = p7_bg_Create(abc);
  if(bg == NULL){
    ESL_XFAIL(status, errbuf, "Error generating bg\n");
  }

  if (frag == 1) {
    // add --fragthresh 0
    esl_strcat(&args, -1, "--fragthresh 0 ", -1);
  }

  // if these flags are set, then we want a non standard hmm out. Used by the logo server.
  if (ali_hmm == 1) {
    // observed counts
    // arguments "X --pnone --wnone --enone"
    esl_strcat(&args, -1, "--pnone --wnone --enone --symfrac 0 ", -1);
  }
  else if (ali_hmm == 2) {
    // weighted counts
    // arguments  "X --pnone");
    esl_strcat(&args, -1, "--pnone --symfrac 0 ", -1);
  }
  else if (ali_hmm == 3) {
    // Create HMM - keep all columns
    esl_strcat(&args, -1, "--symfrac 0 ", -1);
  }
  else {
    // no arguments ?
  }


  // pass in arguments to hmm builder
  esl_opt_ProcessSpoof(go, args);

  if (args != NULL) free(args);

  bld = p7_builder_Create(go, abc);
  if(bld == NULL){
    ESL_XFAIL(eslEMEM, errbuf, "Error creating builder\n");
  }

  status = p7_Builder(bld, msa, bg, ret_hmm, NULL, NULL, NULL, NULL);


  if (status != eslOK) {
    strcpy( errbuf, bld->errbuf );
    goto ERROR;
  }


  p7_bg_Destroy(bg);
  p7_builder_Destroy(bld);
  esl_getopts_Destroy(go);
  return status;

ERROR:
  if (bg != NULL) p7_bg_Destroy(bg);
  if (bld != NULL) p7_builder_Destroy(bld);
  if (go != NULL) esl_getopts_Destroy(go);
  return status;
}


SV* isaSeq(const char *input){
  ESL_ALPHABET *abc       = NULL;
  ESL_SQ       *sq        = NULL;
  int           format    = eslSQFILE_FASTA;
  int           alphatype = eslAMINO;
  int           status;
  int           pos;
  int           cnt = 0;
  int           size;
  char         *copyInput     = NULL;
  char         *copyInput2    = NULL;
  char         *hmmpgmd       = NULL;
  char          buf[61];
  HV*           hash = newHV();
  int           newlines;


  size = sizeof(char) * ( strlen(input) + 1);
  copyInput  = (char *)malloc(size);
  copyInput2 = (char *)malloc(size);


  strncpy( copyInput, input, size);
  hv_store(hash, "type", strlen("type"), newSVpv("UNK", 3), 0);

  abc = esl_alphabet_Create(alphatype);
  sq  = esl_sq_CreateDigital(abc);

  status = eslOK;

  while(status == eslOK){
    status = esl_sqio_Parse(copyInput, strlen(copyInput) * sizeof(char), sq, format);

    if(status != eslOK){
      hv_store(hash, "error", strlen("error"), newSVpvn("Error parsing input", 19), 0);
      break;
    }

    cnt++;

    newlines = (int)( sq->n / 60 ) + 1;
    if(hmmpgmd != NULL){
      hmmpgmd = (char *) realloc(hmmpgmd, sizeof(char) * (strlen(hmmpgmd) + sq->n + strlen(sq->name) + 5) + newlines );
    }else{
      hmmpgmd = (char *) malloc( sizeof(char) * ( sq->n + strlen(sq->name) + 5) + newlines );
      hmmpgmd[0] = '\0';
    }
    strcat(hmmpgmd, ">");
    strcat(hmmpgmd, sq->name);
    strcat(hmmpgmd, "\n");

    buf[60] = '\0';
    for (pos = 0; pos < sq->n; pos += 60){
        if (sq->dsq != NULL) esl_abc_TextizeN(sq->abc, sq->dsq+pos+1, 60, buf);
        else                 strncpy(buf, sq->seq+pos, 60);
        strcat(hmmpgmd, buf);
        strcat(hmmpgmd, "\n");
    }

    if(sq->eoff > 0 ){
      strcpy(copyInput2, copyInput+(sq->eoff + 2));
      copyInput = copyInput2;
    }
    if(strlen(copyInput)==0){
      break;
    }
    esl_sq_Reuse(sq);
  }

  if(hmmpgmd != NULL){
    hv_store(hash, "hmmpgmd", strlen("hmmpgmd"), newSVpv(hmmpgmd, strlen(hmmpgmd)), 0);
    hv_store(hash, "count", strlen("count"), newSViv(cnt), 0);
    if(cnt > 1){
      hv_store(hash, "type", strlen("type"), newSVpv("MS", 2), 0);
    }else{
      hv_store(hash, "type", strlen("type"), newSVpv("SS", 2), 0);
    }
    hv_store(hash, "alpha", strlen("alpha"), newSViv(sq->abc->type), 0);
  }

  if(hmmpgmd != NULL) free(hmmpgmd);
  if(copyInput != NULL) free(copyInput);
  if(sq != NULL) esl_sq_Destroy(sq);
  if(abc != NULL ) esl_alphabet_Destroy(abc);

  return newRV_noinc((SV*) hash);
}
