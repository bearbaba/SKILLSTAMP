# SKILLSTAMP — Verified Studionet state

**Network:** GenLayer Studionet (61999)

This document records actual signed contract executions and independent finalized-state reads, not hypothetical cases or operational instructions.

## Deployed source and bindings

| Contract | Address | Source verification |
| --- | --- | --- |
| ChallengeBoard | `0xD0CD74bfD7BaEE48Bdc57304F062e8f17A1566A6` | Deployed source and schema matched GitHub |
| CredentialRegistry | `0x2cb21FaE6d3c712f00004806e9e583a89910ce1c` | Deployed source and schema matched GitHub |

Read-only [source and constructor binding check](https://github.com/bearbaba/SKILLSTAMP/actions/runs/42560760845): **PASS**. Registry `stats().board` resolves exactly to the ChallengeBoard address.

## Signed execution — Challenge #1

| Field | Observed value |
| --- | --- |
| Operation | `ChallengeBoard.create_challenge(title, rubric, reference_fixture)` |
| Transaction | [`0x83c1563ce9041881cdd1cefa04773353d72d7a5a6d544616e672c8a25c746cac`](https://explorer-studio.genlayer.com/tx/0x83c1563ce9041881cdd1cefa04773353d72d7a5a6d544616e672c8a25c746cac) |
| Signer / issuer | `0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb` |
| Destination | `0xD0CD74bfD7BaEE48Bdc57304F062e8f17A1566A6` |
| Block execution | `FINALIZED`, GenVM `SUCCESS` / `Return` |
| Consensus | `Accepted` |
| Return value | `1` |

Independent `LATEST_FINAL` readback through the live `get_challenge(1)` endpoint matched:

- `id=1`, `active=true`, `version=1`
- `issuer=0x4c7cb73ac8f8999af21cfc9ff4cf2333a9508dcb`
- `title=Event Indexing Reliability Challenge`
- `rubric_sha256=5100921b49985346d315d0577db9048a70db71fb5d1060a7ad00db78513ee2b6`
- `fixture_sha256=e6cf91c8a0d41a5844f4674765899933bfa59e41fbbc8f6221c4b35b56d7548f`
- `stats()={challenges:1,attempts:0}`

## Signed execution — Applicant attempt #1

| Field | Observed value |
| --- | --- |
| Operation | `ChallengeBoard.submit_evidence(1, evidence, evidence_sha256)` |
| Transaction | [`0xb343659255091f9a13451e88d8838550e748169085a473c3a4deeb60115c4251`](https://explorer-studio.genlayer.com/tx/0xb343659255091f9a13451e88d8838550e748169085a473c3a4deeb60115c4251) |
| Signer / applicant | `0xD6b8A3A5eB329410D9504784812b8569afA8C2aF` |
| Destination | `0xD0CD74bfD7BaEE48Bdc57304F062e8f17A1566A6` |
| Execution | `FINALIZED`, GenVM `SUCCESS` / `Return` |
| Consensus | `Accepted` |
| Return / attempt ID | `1` |
| Evidence SHA-256 | `bcd17a099c28e5f77f2e6f87a69346d5574584186c27619087233dc7b8be982e` |

Independent `LATEST_FINAL` readback of `get_attempt(1)` confirmed:

- `id=1`, `challenge_id=1`, `challenge_version=1`
- `applicant=0xd6b8a3a5eb329410d9504784812b8569afa8c2af`
- `evidence_sha256=bcd17a099c28e5f77f2e6f87a69346d5574584186c27619087233dc7b8be982e`
- `rubric_sha256=5100921b49985346d315d0577db9048a70db71fb5d1060a7ad00db78513ee2b6`
- `status=SUBMITTED`, `verdict=PENDING`
- `stats()={challenges:1,attempts:1}`

At the time of submission, the attempt was `SUBMITTED/PENDING`; its status was subsequently changed by the following separately signed AI assessment.

## Signed execution — AI assessment for Attempt #1

| Field | Observed value |
| --- | --- |
| Operation | `ChallengeBoard.assess_attempt(1)` |
| Transaction | [`0xdf213c1de77d7f6c66dc7e2e8e3749d67a737a584b235d663c3d530ae69f85bc`](https://explorer-studio.genlayer.com/tx/0xdf213c1de77d7f6c66dc7e2e8e3749d67a737a584b235d663c3d530ae69f85bc) |
| Signer / issuer | `0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb` |
| Destination | `0xD0CD74bfD7BaEE48Bdc57304F062e8f17A1566A6` |
| Execution | `FINALIZED`, GenVM `SUCCESS` / `Return` |
| Consensus | `Accepted` (Equivalence Principle output: `PASS`) |
| Return verdict | `PASS` |

Independent `LATEST_FINAL` readback returned:

- `get_attempt(1).status=ASSESSED`, `get_attempt(1).verdict=PASS`
- `get_attempt(1).challenge_id=1`, `challenge_version=1`, `evidence_sha256=bcd17a099c28e5f77f2e6f87a69346d5574584186c27619087233dc7b8be982e`
- `credential_permission(1,0xD6b8A3A5eB329410D9504784812b8569afA8C2aF).allowed=true`
- Permission explicitly matches `applicant=actor=0xd6b8a3a5eb329410d9504784812b8569afa8c2af`, `verdict=PASS`, `challenge_version=1`, and original rubric/evidence SHA-256 digests.
- `CredentialRegistry.stats()={board:"0xD0CD74bfD7BaEE48Bdc57304F062e8f17A1566A6",credentials:0}`.

## Signed execution — Credential #1 issued

| Field | Observed value |
| --- | --- |
| Operation | `CredentialRegistry.issue_credential(1)` |
| Transaction | [`0x6114d888b68d017599ac0969901352fef8f5d2ec8c1dcb67098672973c93b061`](https://explorer-studio.genlayer.com/tx/0x6114d888b68d017599ac0969901352fef8f5d2ec8c1dcb67098672973c93b061) |
| Signer / credential holder | `0xD6b8A3A5eB329410D9504784812b8569afA8C2aF` |
| Destination | `0x2cb21FaE6d3c712f00004806e9e583a89910ce1c` |
| Execution | `FINALIZED`, GenVM `SUCCESS` / `Return` |
| Consensus | `Accepted` |
| Returned credential ID | `1` |

Independent `LATEST_FINAL` readback after issuance:

- `CredentialRegistry.stats().credentials=1` and `board=0xD0CD74bfD7BaEE48Bdc57304F062e8f17A1566A6`.
- `get_credential(1)` and `credential_for(1,0xD6b8A3A5eB329410D9504784812b8569afA8C2aF)` returned the same stored credential.
- `id=1`, `attempt_id=1`, `challenge_id=1`, `challenge_version=1`.
- `holder=0xd6b8a3a5eb329410d9504784812b8569afa8c2af`, `issuer=0x4c7cb73ac8f8999af21cfc9ff4cf2333a9508dcb`.
- `status=VALID`, `verdict=PASS`, `revocation_reason=""`.
- `evidence_sha256=bcd17a099c28e5f77f2e6f87a69346d5574584186c27619087233dc7b8be982e`.
- `rubric_sha256=5100921b49985346d315d0577db9048a70db71fb5d1060a7ad00db78513ee2b6`.
- `ChallengeBoard.get_attempt(1)` remains `ASSESSED/PASS`.

The registry enforces one issuance per attempt, but a separately signed duplicate-issue rollback has not yet been observed. `credential_permission(...).allowed=true` remains a valid prerequisite read; it is **not** evidence that repeated issuance is allowed, since replay prevention is enforced by `CredentialRegistry` state.

## Signed rollback — repeated credential issuance denied

| Field | Observed value |
| --- | --- |
| Operation | `CredentialRegistry.issue_credential(1)` repeated after successful issuance |
| Transaction | [`0x81386f3b1f3332f2fdb4d55f40ce64aaf39179b9cf2063691fefb11ba1b074d9`](https://explorer-studio.genlayer.com/tx/0x81386f3b1f3332f2fdb4d55f40ce64aaf39179b9cf2063691fefb11ba1b074d9) |
| Execution | `FINALIZED`, GenVM `ERROR` — **expected rollback** |
| Consensus | `Accepted` — 3 validators agreed on the rollback, 2 were idle after quorum |
| Reason | `[rollback] attempt already issued` |

A post-rollback `LATEST_FINAL` read confirmed `CredentialRegistry.stats().credentials=1`. The same Credential #1 remained `VALID`, `verdict=PASS`, issued to `0xd6b8a3a5eb329410d9504784812b8569afa8c2af`, with unchanged `evidence_sha256=bcd17a099c28e5f77f2e6f87a69346d5574584186c27619087233dc7b8be982e` and `rubric_sha256=5100921b49985346d315d0577db9048a70db71fb5d1060a7ad00db78513ee2b6`. `get_credential(1)` matched `credential_for(1,holder)`. Read API confirmed the repeated transaction was `FINALIZED / ERROR`, not a successful second issuance.

**Proof boundary:** Five signed executions establish Challenge #1, Applicant Attempt #1, AI consensus `PASS`, one persisted `VALID` Credential #1 and an expected rollback preventing a duplicate issuance. No credential revocation or separate `FAIL`/`REVIEW` assessment is claimed. `PASS` evaluates synthetic evidence under this rubric, not independent real-world qualification or identity.


## Signed execution — Live demo challenge #2

| Field | Observed value |
| --- | --- |
| Operation | `ChallengeBoard.create_challenge(title,rubric,reference_fixture)` |
| Transaction | [`0x00795697b250a253b4a6ac7044f01bf9c57646c8c059aaca3db56a54e0d7a627`](https://explorer-studio.genlayer.com/tx/0x00795697b250a253b4a6ac7044f01bf9c57646c8c059aaca3db56a54e0d7a627) |
| Chain execution | `FINALIZED` / GenVM `SUCCESS` (independent public API check) |
| Issuer | `0x4c7cb73ac8f8999af21cfc9ff4cf2333a9508dcb` |
| Challenge ID | `2` |
| Title | `Event Indexing Reliability SKILLSTAMP` |

Independent `LATEST_FINAL` readback of `get_challenge(2)` confirmed
`active=true`, `version=1`,
`rubric_sha256=5100921b49985346d315d0577db9048a70db71fb5d1060a7ad00db78513ee2b6` and
`fixture_sha256=e6cf91c8a0d41a5844f4674765899933bfa59e41fbbc8f6221c4b35b56d7548f`.
At this verification point, `stats()={challenges:2,attempts:1}` and `CredentialRegistry.stats().credentials=1`.
The new challenge had no recorded new applicant attempt at this point. No subsequent AI assessment or issuance for Challenge #2 is claimed by this entry.


## Signed execution — Live demo applicant attempt #2

| Field | Observed value |
| --- | --- |
| Operation | `ChallengeBoard.submit_evidence(2, evidence, evidence_sha256)` |
| Transaction | [`0xe8d2a9801847d45f0340bb14d73379e69bc924dae6fd0c783e17bc065dcd96a9`](https://explorer-studio.genlayer.com/tx/0xe8d2a9801847d45f0340bb14d73379e69bc924dae6fd0c783e17bc065dcd96a9) |
| Signer / applicant | `0xD6b8A3A5eB329410D9504784812b8569afA8C2aF` |
| Contract | `0xD0CD74bfD7BaEE48Bdc57304F062e8f17A1566A6` |
| Execution | `FINALIZED` / GenVM `SUCCESS` |
| Consensus | `Accepted` |
| Return value | Attempt ID `2` |
| Evidence SHA-256 | `bcd17a099c28e5f77f2e6f87a69346d5574584186c27619087233dc7b8be982e` |

Independent `LATEST_FINAL` readback from `get_attempt(2)` verified `id=2`, `challenge_id=2`, `challenge_version=1`, `applicant=0xd6b8a3a5eb329410d9504784812b8569afa8c2af`, and an unchanged rubric digest `5100921b49985346d315d0577db9048a70db71fb5d1060a7ad00db78513ee2b6`. Immediately after signing, `status=SUBMITTED` and `verdict=PENDING`; `stats()={challenges:2,attempts:2}`. This transaction does **not** establish a PASS or credential for Attempt #2 without later AI adjudication.


## Signed execution — Live demo AI assessment for Attempt #2

| Field | Observed value |
| --- | --- |
| Method | `ChallengeBoard.assess_attempt(2)` |
| Transaction | [`0xe25db20b1871d47633413c588c234e8f89869cb9b613147ee48574dedf63f954`](https://explorer-studio.genlayer.com/tx/0xe25db20b1871d47633413c588c234e8f89869cb9b613147ee48574dedf63f954) |
| Issuer | `0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb` |
| Execution | `FINALIZED` / GenVM `SUCCESS` |
| Verdict | `PASS` |

The direct `LATEST_FINAL` read `get_attempt(2)` returned `status=ASSESSED`, `verdict=PASS`, `challenge_id=2` and `applicant=0xd6b8a3a5eb329410d9504784812b8569afa8c2af`. `credential_permission(2,0xD6b8A3A5eB329410D9504784812b8569afA8C2aF)` returned `allowed=true`, linked to Challenge #2 and the original `evidence_sha256=bcd17a099c28e5f77f2e6f87a69346d5574584186c27619087233dc7b8be982e`, `rubric_sha256=5100921b49985346d315d0577db9048a70db71fb5d1060a7ad00db78513ee2b6`. At this point the CredentialRegistry still contained `credentials=1`; there was **not yet** a second issued credential.

The visible signing, finality tracking and verdict were captured in the user's separate 2026-11-09 live demo recording, which is not committed to this source repository.


## Signed execution — Live demo Credential #2 issued

| Field | Observed value |
| --- | --- |
| Method | `CredentialRegistry.issue_credential(2)` |
| Transaction | [`0x0bbbfeab9ebfd689bae70a47dc5aa51a21bb82505a1ec99f654efb26195b4fd2`](https://explorer-studio.genlayer.com/tx/0x0bbbfeab9ebfd689bae70a47dc5aa51a21bb82505a1ec99f654efb26195b4fd2) |
| Signer / holder | `0xD6b8A3A5eB329410D9504784812b8569afA8C2aF` |
| Contract | `0x2cb21FaE6d3c712f00004806e9e583a89910ce1c` |
| Execution | `FINALIZED` / GenVM `SUCCESS` (independent API read) |
| Credential ID | `2` |

Independent `LATEST_FINAL` state reads verified `CredentialRegistry.stats().credentials=2`, and both `get_credential(2)` and `credential_for(2, holder)` returned the same persisted record:

- `id=2`, `attempt_id=2`, `challenge_id=2`, `challenge_version=1`.
- `holder=0xd6b8a3a5eb329410d9504784812b8569afa8c2af`, `issuer=0x4c7cb73ac8f8999af21cfc9ff4cf2333a9508dcb`.
- `status=VALID`, `verdict=PASS`, `revocation_reason=""`.
- `evidence_sha256=bcd17a099c28e5f77f2e6f87a69346d5574584186c27619087233dc7b8be982e`.
- `rubric_sha256=5100921b49985346d315d0577db9048a70db71fb5d1060a7ad00db78513ee2b6`.
- `ChallengeBoard.get_attempt(2)` remained `ASSESSED/PASS` and `get_challenge(2).active=true`.

**Proof boundary:** The separate live-recorded Challenge #2 workflow reached issuance and state-verified Credential #2. Its credential was not revoked, and Challenge #2 was not closed. These two administrative operations are available but are not part of the four-step issuance journey. Signed proof and readback establish a challenge-scoped AI consensus PASS over synthetic evidence, not external validation of applicant identity or execution of software.
