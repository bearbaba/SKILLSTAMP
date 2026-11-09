# SKILLSTAMP

**Evidence-scoped, wallet-bound skill credentials on GenLayer.**

SKILLSTAMP links a clearly defined challenge to evidence signed by an applicant wallet. A GenLayer Intelligent Contract assesses that evidence against an immutable rubric using independent validators; a separate registry records credentials only for a qualifying `PASS` assessment.

## System architecture

- **ChallengeBoard** — challenge records, issuer and applicant roles, version-bound rubrics, reference fixtures, signed evidence digests, and `PASS` / `FAIL` / `REVIEW` consensus assessment.
- **CredentialRegistry** — cross-contract authorization, one credential per eligible attempt, digest-linked credential records, and issuer-controlled revocation with preserved history.
- **Web application** — a responsive interface for the challenge and credential lifecycle, wallet connectivity, transaction status, and public record inspection.
- **Read API** — strict contract-method allowlist and finalized chain-state reads.
- **Verification code** — local deterministic checks, source schema validation, and CI.

## Technical boundaries

The network target is GenLayer Studionet (**61999**). **No contract deployment, signed on-chain acceptance, or production website availability is claimed yet.** The web application does not enable writes without configured deployed addresses.

An on-chain `PASS` would attest to a verdict on supplied evidence under a particular rubric; it would not independently establish real-world identity, authorship, code execution, or professional certification.

## Source

- [ChallengeBoard](contracts/challenge_board.py)
- [CredentialRegistry](contracts/credential_registry.py)
- [Web application](src/main.js)
- [Verification logic](lib/verification.js)
