# Studionet deployment and source verification

Network: **GenLayer Studionet 61999**. Deploy `contracts/challenge_board.py` first, then `contracts/credential_registry.py` with its constructor parameter set to the **actual** first contract address.

The repository contains no verified deployed addresses as of initialization. Do **not** fabricate successful transaction hashes or state. Configure Vercel environment variables `CHALLENGE_BOARD_ADDRESS` and `CREDENTIAL_REGISTRY_ADDRESS` only after both deployments. Keep frontend server-side config and browser signing on Studionet.

Run local verification:

```bash
npm install
npm test
npm run build
python -m py_compile contracts/*.py
```

After deployment, run a read-only source/schema/linkage check:

```bash
FIRST_SOURCE_PATH=contracts/challenge_board.py SECOND_SOURCE_PATH=contracts/credential_registry.py SECOND_LINK_FIELD=board \\
CHALLENGE_BOARD_ADDRESS=0x... CREDENTIAL_REGISTRY_ADDRESS=0x... npm run preflight
```

Evidence must include source parity, methods, actual signed transactions, GenVM execution result, validator consensus, and `LATEST_FINAL` state. A transaction with `FINALIZED` and `ERROR` is a rollback, not a successful write.
