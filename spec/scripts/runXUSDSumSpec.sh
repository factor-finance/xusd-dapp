certoraRun ../spec/harnesses/XUSDHarness.sol --verify XUSDHarness:../spec/xusdSum.spec --solc solc5.11 --settings -useNonLinearArithmetic,-t=300,-ignoreViewFunctions,-s=cvc4,-ruleSanityChecks --cache xusd --cloud --msg "XUSD Sums NLA"