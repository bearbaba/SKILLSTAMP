import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {HISTORY_KEY,readHistory,rememberTx,updateTxStatus,displayStatus} from '../lib/tx-history.js';
function fakeStorage(){
 const items=new Map();
 return {getItem:k=>items.get(k)||null,setItem:(k,v)=>items.set(k,v),raw:items};
}
const HASH='0x'+'a'.repeat(64);
test('save one signed tx with public hash and metadata, never signed payload',()=>{
 const store=fakeStorage();
 rememberTx(store,{hash:HASH,method:'create_challenge',actor:'0x'+'b'.repeat(40),
  args:['private evidence'],status:'pending'});
 const parsed=JSON.parse(store.getItem(HISTORY_KEY));
 assert.equal(parsed.length,1);
 assert.equal(parsed[0].method,'create_challenge');
 assert.equal(parsed[0].actor,'0x'+'b'.repeat(40));
 assert.equal(store.getItem(HISTORY_KEY).includes('private evidence'),false);
});
test('update finality without duplicating a hash or downgrading metadata',()=>{
 const store=fakeStorage();
 rememberTx(store,{hash:HASH,method:'create_challenge',status:'pending'});
 updateTxStatus(store,HASH,'verified');
 assert.equal(readHistory(store).length,1);
 assert.equal(readHistory(store)[0].status,'verified');
 assert.equal(displayStatus('verified'),'Verified on-chain');
 assert.equal(readHistory(store)[0].method,'create_challenge');
});
test('duplicate imported hashes are normalized case-insensitively',()=>{
 const store=fakeStorage();
 rememberTx(store,{hash:HASH.toUpperCase().replace('0X','0x'),status:'pending'});
 rememberTx(store,{hash:HASH,status:'finalized-success'});
 assert.equal(readHistory(store).length,1);
});
test('reject malformed hashes and invalid states',()=>{
 const store=fakeStorage();
 assert.throws(()=>rememberTx(store,{hash:'0x123'}),/hash/);
 assert.throws(()=>updateTxStatus(store,HASH,'invented'),/Invalid/);
 assert.deepEqual(readHistory(store),[]);
});
test('persisted journal is bounded and corrupt storage does not crash the web app',()=>{
 const store=fakeStorage();
 for(let i=0;i<110;i++)rememberTx(store,{hash:'0x'+i.toString(16).padStart(64,'0'),status:'pending'});
 assert.equal(readHistory(store).length,100);
 store.raw.set(HISTORY_KEY,'invalid JSON');
 assert.deepEqual(readHistory(store),[]);
});
