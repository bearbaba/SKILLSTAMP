# SKILLSTAMP — Evidence-scoped competency credentials

**SKILLSTAMP connects a wallet-signed challenge response to a narrowly scoped GenLayer assessment, then turns a PASS consensus verdict into an independently readable, revocable credential. It is not an identity provider or a professional qualification registry.**

> **State:** Source implementation and offline tests are available. **No Studionet deployment, on-chain acceptance or website production verification is claimed yet.** The application disables signing until two real contract addresses are configured.

## Workflow

1. Issuer signs `create_challenge` with a frozen rubric and reference input.
2. Applicant uses a distinct wallet to sign `submit_evidence` and exact SHA-256.
3. Issuer signs `assess_attempt`; validators independently evaluate the frozen text, returning `PASS`, `FAIL` or `REVIEW`.
4. Applicant with `PASS` signs `issue_credential` on the second contract.
5. Anyone reads `get_credential` / `credential_for` at `LATEST_FINAL`; issuer may revoke with an explicit reason.

## Architecture

- ChallengeBoard: immutable issuer-authored challenge rubric and reference fixture; exactly one applicant attempt per challenge; signed SHA-256 evidence; independent leader/validator consensus returns PASS, FAIL or REVIEW; current permission read.
- CredentialRegistry: cross-contract reads current PASS permission, restricts issuance to the actual applicant, blocks attempt/holder replay, records a credential linked to rubric and evidence hashes, and permits issuer-only revocation while preserving historical record.

The browser interface uses EIP-1193 wallet signing with GenLayer's JavaScript client. The public serverless read API exposes an allowlist and uses `LATEST_FINAL`; the transaction tracker separately checks `FINALIZED`, GenVM `SUCCESS` and persisted state before reporting verified execution. Incomplete transactions remain stored for manual recheck, preventing duplicate submission attempts.

## Security and acceptance scenarios

**Positive:** PASS → permission true → one valid credential; same attempt cannot mint twice.

**Negative:** FAIL/REVIEW denied, wrong issuer and applicant denied, duplicate attempt blocked, hash mismatch rejected, revoked/closed challenge access false; validator disagreement fails closed.

Tests are deterministic and mock GenLayer consensus; they are not substitutes for signed validator acceptance. The source includes no private keys, wallet seeds or assumed API secrets.

## Reproduce locally

Node.js >=22, Python >=3.11:

```bash
npm install
npm test
npm run build
python -m unittest discover -s tests -v
python -m py_compile contracts/*.py
```

For local UI, `npm run dev`. On Vercel, set `CHALLENGE_BOARD_ADDRESS` and `CREDENTIAL_REGISTRY_ADDRESS` only after deploying the two real contracts and verifying the constructor linkage. The local Vite development server does not expose Vercel serverless APIs; use the deployed serverless environment for on-chain read/sign workflows.

[Deployment procedure](docs/DEPLOYMENT.md) · [Studio verification checklist](docs/STUDIO_TESTS.md) · [Source: first contract](contracts/challenge_board.py) · [Source: second contract](contracts/credential_registry.py)

## Boundaries

The assessment interprets supplied evidence text against a frozen rubric. It does not run arbitrary repository code, verify the authorship of a GitHub commit, certify qualifications or provide a real-world identity claim. Credentials attest to a limited, issuer-defined PASS verdict.

Everything in this repository concerns product behavior, source code, reproducible tests and technical evidence.
