import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {classifyTx,parseValue,verifyStored} from '../lib/verification.js';

test('finality never treats finalized rollback or unknown execution as success',()=>{
 assert.equal(classifyTx({status:'FINALIZED',execution:'ERROR'}),'error');
 assert.equal(classifyTx({status:'FINALIZED',execution:'UNKNOWN'}),'pending');
 assert.equal(classifyTx({status:'FINALIZED',execution:'SUCCESS'}),'success');
 assert.equal(classifyTx({status:'UNDETERMINED',execution:'SUCCESS'}),'error');
});
test('parse returned JSON and preserve empty results',()=>{
 assert.deepEqual(parseValue('{"id":1}'),{id:1});
 assert.equal(parseValue(''), '');
});
test('skill credential cannot be marked verified for wrong signer/status/attempt',()=>{
 const rec={method:'issue_credential',actor:'0x'+'a'.repeat(40),args:[2],prior:0};
 const value={id:1,attempt_id:2,holder:rec.actor,status:'VALID',verdict:'PASS'};
 assert.equal(verifyStored(rec,value),true);
 assert.equal(verifyStored(rec,{...value,status:'REVOKED'}),false);
 assert.equal(verifyStored(rec,{...value,attempt_id:3}),false);
 assert.equal(verifyStored(rec,{...value,holder:'0x'+'b'.repeat(40)}),false);
});
test('reputation outcome must contain eligible verdict with new ID',()=>{
 const rec={method:'record_outcome',actor:'0x'+'a'.repeat(40),args:[7],prior:2};
 assert.equal(verifyStored(rec,{id:3,job_id:7,verdict:'AGENT_AT_FAULT'}),true);
 assert.equal(verifyStored(rec,{id:2,job_id:7,verdict:'AGENT_AT_FAULT'}),false);
 assert.equal(verifyStored(rec,{id:3,job_id:7,verdict:'REVIEW_REQUIRED'}),false);
});
test('signed agent evidence must exactly match signer, text and hash',()=>{
 const actor='0x'+'a'.repeat(40);
 const rec={method:'submit_delivery',actor,args:[1,'my text','abc'],prior:null};
 const job={id:1,agent:actor,delivery:'my text',delivery_sha256:'abc',stage:'DELIVERED'};
 assert.equal(verifyStored(rec,job),true);
 assert.equal(verifyStored(rec,{...job,agent:'0x'+'b'.repeat(40)}),false);
 assert.equal(verifyStored(rec,{...job,delivery:'other'}),false);
});
