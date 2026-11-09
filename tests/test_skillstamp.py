"""Offline tests simulate GenLayer caller/storage/consensus; not signed on-chain proof."""
import hashlib
import importlib.util
import json
import pathlib
import sys
import types
import unittest

ISSUER="0x"+"1"*40
ALICE="0x"+"2"*40
BOB="0x"+"3"*40
BOARD="0x"+"4"*40

class Address:
    def __init__(self,value): self.as_hex=value.as_hex.lower() if hasattr(value,"as_hex") else str(value).lower()
class Return:
    def __init__(self,calldata): self.calldata=calldata
class Contract:
    def view(self): return self
    def __new__(cls,*args,**kwargs):
        inst=super().__new__(cls)
        for key,annotation in cls.__annotations__.items():
            if getattr(annotation,"__origin__",None) is dict: setattr(inst,key,{})
        return inst
class Runtime:
    def __init__(self):
        self.answer="PASS";self.sequence=None;self.calls=0;self.contracts={}
        self.message=types.SimpleNamespace(sender_address=types.SimpleNamespace(as_hex=ISSUER))
        self.vm=types.SimpleNamespace(UserError=ValueError,Return=Return,run_nondet_unsafe=self.agree)
        self.nondet=types.SimpleNamespace(exec_prompt=self.answer_prompt)
        self.public=types.SimpleNamespace(write=lambda fn:fn,view=lambda fn:fn)
        self.Contract=Contract
    def answer_prompt(self,_prompt):
        if self.sequence:
            value=self.sequence[self.calls%len(self.sequence)]
            self.calls+=1
            return value
        return self.answer
    def agree(self,leader,validator):
        answer=leader()
        if not validator(Return(answer)): raise ValueError("validator disagreement")
        return answer
    def get_contract_at(self,address): return self.contracts[address.as_hex]
runtime=Runtime()
mock=types.ModuleType("genlayer")
mock.gl=runtime;mock.Address=Address;mock.TreeMap=dict;mock.u256=int
sys.modules["genlayer"]=mock

def load(name,path):
    spec=importlib.util.spec_from_file_location(name,pathlib.Path(__file__).parents[1]/path)
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    return module
board_module=load("challenge_board","contracts/challenge_board.py")
registry_module=load("credential_registry","contracts/credential_registry.py")
RUBRIC=("To PASS, the evidence must report exactly two unique records EVT-1 and EVT-2 after the fixture is replayed; "
        "duplicate EVT-1 must be ignored using ID idempotency; an invalid ID or malformed amount must be rejected with an audit entry. "
        "Any contradictory count is FAIL; missing details are REVIEW.")
FIXTURE='{"events":[{"id":"EVT-1","value":8},{"id":"EVT-2","value":5},{"id":"EVT-1","value":8}],"uniqueCount":2}'
EVIDENCE='{"uniqueIds":["EVT-1","EVT-2"],"uniqueCount":2,"duplicate":"ignored by event ID","invalid":"reject malformed ID and audit"}'

def digest(s):return hashlib.sha256(s.encode("utf-8")).hexdigest()

class Workflow(unittest.TestCase):
    def setUp(self):
        runtime.answer="PASS";runtime.sequence=None;runtime.calls=0
        self.board=board_module.ChallengeBoard()
        self.ledger=registry_module.CredentialRegistry(BOARD)
        runtime.contracts={BOARD:self.board}
        self.actor(ISSUER)
        self.challenge=self.board.create_challenge("Event indexing evidence",RUBRIC,FIXTURE)
    def actor(self,w):runtime.message.sender_address.as_hex=w
    def attempt(self,actor=ALICE):
        self.actor(actor)
        return self.board.submit_evidence(self.challenge,EVIDENCE,digest(EVIDENCE))
    def assess(self,i,verdict="PASS"):
        self.actor(ISSUER);runtime.answer=verdict
        return self.board.assess_attempt(i)
    def issue(self,i,actor=ALICE):
        self.actor(actor)
        return self.ledger.issue_credential(i)
    def perm(self,i,actor=ALICE):
        return json.loads(self.board.credential_permission(i,actor))
    def test_pass_issues_one_wallet_bound_credential(self):
        i=self.attempt()
        self.assertEqual(self.assess(i),"PASS")
        self.assertTrue(self.perm(i)["allowed"])
        receipt=self.issue(i)
        self.assertEqual(receipt,1)
        c=json.loads(self.ledger.get_credential(1))
        self.assertEqual(c["status"],"VALID")
        self.assertEqual(c["evidence_sha256"],digest(EVIDENCE))
        self.assertEqual(json.loads(self.ledger.credential_for(self.challenge,ALICE)),c)
        with self.assertRaisesRegex(ValueError,"already issued"):self.issue(i)
    def test_failed_and_unverifiable_do_not_issue(self):
        i=self.attempt()
        self.assertEqual(self.assess(i,"FAIL"),"FAIL")
        self.assertFalse(self.perm(i)["allowed"])
        with self.assertRaisesRegex(ValueError,"not authorized"):self.issue(i)
        j=self.attempt(BOB)
        self.assertEqual(self.assess(j,"REVIEW"),"REVIEW")
        self.assertFalse(self.perm(j,BOB)["allowed"])
        with self.assertRaises(ValueError):self.issue(j,BOB)
    def test_hash_and_duplicate_attempt_guards(self):
        self.actor(ALICE)
        with self.assertRaisesRegex(ValueError,"hash mismatch"):
            self.board.submit_evidence(self.challenge,EVIDENCE,"0"*64)
        self.attempt()
        with self.assertRaisesRegex(ValueError,"already attempted"):
            self.board.submit_evidence(self.challenge,EVIDENCE,digest(EVIDENCE))
        self.actor(ISSUER)
        with self.assertRaisesRegex(ValueError,"issuer cannot"):
            self.board.submit_evidence(self.challenge,EVIDENCE,digest(EVIDENCE))
    def test_wrong_actor_cannot_issue(self):
        i=self.attempt();self.assess(i)
        with self.assertRaisesRegex(ValueError,"not authorized"):self.issue(i,BOB)
    def test_only_issuer_can_assess_and_close(self):
        i=self.attempt();self.actor(ALICE)
        with self.assertRaisesRegex(ValueError,"issuer only"):self.board.assess_attempt(i)
        with self.assertRaisesRegex(ValueError,"issuer only"):self.board.close_challenge(self.challenge)
        self.assess(i);self.actor(ISSUER);self.board.close_challenge(self.challenge)
        self.assertFalse(self.perm(i)["allowed"])
        with self.assertRaisesRegex(ValueError,"challenge closed"):self.attempt(BOB)
        with self.assertRaisesRegex(ValueError,"not authorized"):self.issue(i)
    def test_issuer_revocation_keeps_public_history(self):
        i=self.attempt();self.assess(i);self.issue(i)
        self.actor(BOB)
        with self.assertRaisesRegex(ValueError,"issuer only"):
            self.ledger.revoke_credential(1,"The challenge verification was revoked.")
        self.actor(ISSUER)
        self.ledger.revoke_credential(1,"The challenge verification was revoked.")
        c=json.loads(self.ledger.get_credential(1))
        self.assertEqual(c["status"],"REVOKED")
        self.assertEqual(c["evidence_sha256"],digest(EVIDENCE))
        with self.assertRaisesRegex(ValueError,"already revoked"):
            self.ledger.revoke_credential(1,"Cannot revoke twice after being revoked.")
    def test_consensus_disagreement_keeps_pending(self):
        i=self.attempt();self.actor(ISSUER);runtime.sequence=["PASS","FAIL"]
        with self.assertRaisesRegex(ValueError,"validator disagreement"):
            self.board.assess_attempt(i)
        self.assertEqual(json.loads(self.board.get_attempt(i))["status"],"SUBMITTED")
        self.assertFalse(self.perm(i)["allowed"])
if __name__=="__main__":unittest.main()
