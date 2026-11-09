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

The deployment target is GenLayer Studionet (**61999**). Two deployed Intelligent Contracts are connected to the public web app at [skillstamp-omega.vercel.app](https://skillstamp-omega.vercel.app/):

- **ChallengeBoard:** [`0xD0CD74bfD7BaEE48Bdc57304F062e8f17A1566A6`](https://explorer-studio.genlayer.com/address/0xD0CD74bfD7BaEE48Bdc57304F062e8f17A1566A6)
- **CredentialRegistry:** [`0x2cb21FaE6d3c712f00004806e9e583a89910ce1c`](https://explorer-studio.genlayer.com/address/0x2cb21FaE6d3c712f00004806e9e583a89910ce1c)

The complete signed on-chain workflow (challenge creation, evidence submission, AI assessment and credential issuance), an expected duplicate-issuance rollback, transaction links, and independent `LATEST_FINAL` state readbacks are recorded in [the technical on-chain evidence](docs/ONCHAIN_EVIDENCE.md). The verification logic distinguishes finalized successful execution from exact persisted-state verification. The web application disables signing if deployment addresses are not configured.

An on-chain `PASS` attests to a verdict on supplied evidence under a particular rubric; it would not independently establish real-world identity, authorship, code execution, or professional certification.

## Source

- [ChallengeBoard](contracts/challenge_board.py)
- [CredentialRegistry](contracts/credential_registry.py)
- [Web application](src/main.js)
- [Verification logic](lib/verification.js)
