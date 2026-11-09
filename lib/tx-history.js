// Browser-local transaction index. No signed payloads or private keys are stored.
export const HISTORY_KEY='skillstamp-transaction-history-v1';
export const HASH_RE=/^0x[a-fA-F0-9]{64}$/;
const statuses=new Set(['pending','finalized-success','verified','error','state-unverified']);
const address=/^0x[a-fA-F0-9]{40}$/;
const method=/^[a-z][a-z0-9_]{0,80}$/;

export function readHistory(storage){
 try{
  const records=JSON.parse(storage.getItem(HISTORY_KEY)||'[]');
  if(!Array.isArray(records))return [];
  return records.filter(r=>r&&HASH_RE.test(r.hash||'')&&r.chainId===61999)
   .slice(0,100)
   .sort((a,b)=>(Number(b.savedAt)||0)-(Number(a.savedAt)||0));
 }catch{return []}
}
export function rememberTx(storage,input){
 if(!input||!HASH_RE.test(input.hash||''))throw Error('Valid GenLayer transaction hash required');
 const previous=readHistory(storage);
 const existing=previous.find(r=>r.hash.toLowerCase()===input.hash.toLowerCase());
 const record={
  hash:input.hash.toLowerCase(),
  chainId:61999,
  method:method.test(input.method||'')?input.method:(existing?.method||'unknown'),
  actor:address.test(input.actor||'')?input.actor.toLowerCase():(existing?.actor||''),
  savedAt:existing?.savedAt||Date.now(),
  status:statuses.has(input.status)?input.status:(existing?.status||'pending'),
  checkedAt:Number.isFinite(input.checkedAt)?input.checkedAt:(existing?.checkedAt||null)
 };
 const updated=[record,...previous.filter(r=>r.hash.toLowerCase()!==record.hash)]
   .sort((a,b)=>b.savedAt-a.savedAt).slice(0,100);
 try{storage.setItem(HISTORY_KEY,JSON.stringify(updated))}catch{}
 return record;
}
export function updateTxStatus(storage,hash,status){
 if(!HASH_RE.test(hash||'')||!statuses.has(status))throw Error('Invalid transaction update');
 const existing=readHistory(storage).find(r=>r.hash.toLowerCase()===hash.toLowerCase());
 return rememberTx(storage,{...existing,hash,status,checkedAt:Date.now()});
}
export function displayStatus(status){
 return ({
  pending:'Waiting for finality',
  'finalized-success':'Finalized · SUCCESS',
  verified:'Verified on-chain',
  error:'Finalized · Rolled back',
  'state-unverified':'Finalized · readback pending'
 })[status]||'Unknown';
}
