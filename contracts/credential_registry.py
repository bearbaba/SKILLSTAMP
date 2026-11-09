# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""CredentialRegistry: wallet-bound receipts sourced from assessed ChallengeBoard attempts."""
from genlayer import *
import json
import re

def require(ok: bool, why: str):
    if not ok:
        raise gl.vm.UserError(why)

def wallet(value: str) -> str:
    require(type(value) is str and re.fullmatch(r"0x[a-fA-F0-9]{40}", value) is not None,
            "invalid wallet")
    return Address(value).as_hex.lower()

class CredentialRegistry(gl.Contract):
    board: Address
    credential_count: u256
    credentials: TreeMap[u256, str]
    credential_by_attempt: TreeMap[u256, u256]
    credential_by_holder: TreeMap[str, u256]

    def __init__(self, board_address: str):
        self.board = Address(board_address)
        self.credential_count = u256(0)

    @gl.public.write
    def issue_credential(self, attempt_id: int) -> int:
        require(type(attempt_id) is int and attempt_id > 0, "invalid attempt")
        actor = gl.message.sender_address.as_hex.lower()
        require(self.credential_by_attempt.get(u256(attempt_id), u256(0)) == u256(0),
                "attempt already issued")
        board = gl.get_contract_at(self.board)
        raw = board.view().credential_permission(attempt_id, actor)
        require(type(raw) is str and 1 < len(raw) <= 1800, "invalid Board permission")
        auth = json.loads(raw)
        require(auth.get("allowed") is True and auth.get("verdict") == "PASS",
                "not authorized for credential")
        require(auth.get("attempt_id") == attempt_id and auth.get("actor") == actor and
                auth.get("applicant") == actor, "permission identity mismatch")
        challenge_id = auth.get("challenge_id")
        require(type(challenge_id) is int and challenge_id > 0, "invalid challenge")
        key = str(challenge_id) + ":" + actor
        require(self.credential_by_holder.get(key, u256(0)) == u256(0),
                "holder already has credential for challenge")
        require(type(auth.get("evidence_sha256")) is str and
                re.fullmatch(r"[0-9a-f]{64}", auth["evidence_sha256"]) is not None,
                "invalid evidence digest")
        require(type(auth.get("rubric_sha256")) is str and
                re.fullmatch(r"[0-9a-f]{64}", auth["rubric_sha256"]) is not None,
                "invalid rubric digest")
        issuer = wallet(auth.get("issuer"))
        self.credential_count += u256(1)
        index = int(self.credential_count)
        self.credentials[u256(index)] = json.dumps({
            "id": index, "attempt_id": attempt_id, "challenge_id": challenge_id,
            "holder": actor, "issuer": issuer, "verdict": "PASS",
            "title": auth["title"], "challenge_version": auth["challenge_version"],
            "evidence_sha256": auth["evidence_sha256"], "rubric_sha256": auth["rubric_sha256"],
            "status": "VALID", "revocation_reason": ""
        }, sort_keys=True, separators=(",", ":"))
        self.credential_by_attempt[u256(attempt_id)] = u256(index)
        self.credential_by_holder[key] = u256(index)
        return index

    @gl.public.write
    def revoke_credential(self, credential_id: int, reason: str) -> None:
        r = json.loads(self.get_credential(credential_id))
        require(gl.message.sender_address.as_hex.lower() == r["issuer"], "issuer only")
        require(r["status"] == "VALID", "credential already revoked")
        require(type(reason) is str and 20 <= len(reason.strip()) <= 300,
                "revocation reason length 20-300")
        r["status"] = "REVOKED"
        r["revocation_reason"] = reason.strip()
        self.credentials[u256(credential_id)] = json.dumps(r, sort_keys=True, separators=(",", ":"))

    @gl.public.view
    def get_credential(self, credential_id: int) -> str:
        require(type(credential_id) is int and 0 < credential_id <= int(self.credential_count),
                "unknown credential")
        return self.credentials[u256(credential_id)]

    @gl.public.view
    def credential_for(self, challenge_id: int, holder: str) -> str:
        require(type(challenge_id) is int and challenge_id > 0, "invalid challenge")
        key = str(challenge_id) + ":" + wallet(holder)
        index = self.credential_by_holder.get(key, u256(0))
        return self.credentials[index] if index != u256(0) else ""

    @gl.public.view
    def stats(self) -> str:
        return json.dumps({"credentials": int(self.credential_count),
                           "board": self.board.as_hex}, sort_keys=True, separators=(",", ":"))
