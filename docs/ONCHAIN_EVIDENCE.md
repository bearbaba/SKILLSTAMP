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

**Proof boundary:** The above establishes creation of one rubric-bound challenge, not a successful applicant submission, GenLayer AI assessment, issuance, or revocation. No additional execution is claimed without a signed transaction and finalized readback.
