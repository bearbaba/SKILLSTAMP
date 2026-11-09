# SKILLSTAMP — Studio technical verification

Network: **GenLayer Studionet 61999**. This is a reproducible acceptance protocol, not a report of already-performed signed executions.

## Deployment order

1. Deploy \`contracts/challenge_board.py\` with no constructor args. Record actual address, deployed source and ABI.
2. Deploy \`contracts/credential_registry.py\` with one constructor string, **the exact ChallengeBoard address**.
3. Set server \`CHALLENGE_BOARD_ADDRESS\` and \`CREDENTIAL_REGISTRY_ADDRESS\`; verify on-chain \`CredentialRegistry.stats().board\` matches the first address.
4. Run read-only preflight documented in \`docs/DEPLOYMENT.md\`. No source mismatch may be waived.

## Positive path

Use different wallets: Issuer, Applicant A, Applicant B, Applicant C. Load the "Event Indexing Reliability Challenge" example from \`src/project.js\` (it contains the full rubric and fixture).

1. Issuer calls \`create_challenge(title,rubric,reference_fixture)\` and records challenge ID.
2. Applicant A calls \`submit_evidence(challenge_id,evidence,sha256(evidence))\` with the correctly deduplicated JSON sample. Retain original exact bytes and SHA-256.
3. Issuer calls \`assess_attempt(attempt_id)\`. Record actual consensus outcome. Only if it is \`PASS\`, inspect \`credential_permission(attempt_id, ApplicantA)\` for \`allowed=true\`.
4. Applicant A calls \`CredentialRegistry.issue_credential(attempt_id)\`. Record actual credential ID. Confirm \`get_credential(id)\` and \`credential_for(challenge_id,ApplicantA)\` agree on holder, rubric hash, evidence hash and status \`VALID\`.
5. Re-call \`issue_credential\` for the same attempt. Expected: GenVM rollback; \`stats().credentials\` unchanged.

Do not fabricate a \`PASS\`. If GenLayer returns \`REVIEW\` or \`FAIL\`, keep the denied permission and inspect the specific rubric/evidence gap.

## Denial and invalidation

- Applicant B signs evidence with a contradictory unique count. Evaluate and verify that a \`FAIL\` verdict cannot issue a credential (if that is the actual consensus result).
- Applicant C signs materially incomplete evidence. \`REVIEW\` should deny issuance.
- Wrong-wallet \`issue_credential\` and issuer self-submission must revert.
- Invalid SHA-256, duplicate attempt for one applicant/challenge, and duplicate credential issue must revert without changing counts.
- Issuer calls \`revoke_credential(id,reason)\`; verify \`status=REVOKED\` while hashes and receipt identity remain readable; wrong issuer must be denied.
- Issuer \`close_challenge\` must stop new attempts and prevent new issuance.

## Evidence standard

For each test: actual caller, method, parameters, transaction hash, execution result, validator consensus (for AI operations) and final-state views at \`LATEST_FINAL\`. \`FINALIZED\` with \`ERROR\` is a rolled-back test, not a successful write. Self-reported skill evidence is not externally verified identity, GitHub authorship or executable-code correctness.
