/** Deterministic finality and record checks. No on-chain success from FINALIZED alone. */
export function parseValue(v){
 if(typeof v==='string'){try{if(/^\s*[\[{]/.test(v))return JSON.parse(v)}catch{}}
 return v;
}
export function classifyTx(raw){
 const status=String(raw?.status||'').toUpperCase();
 const exec=String(raw?.execution||'').toUpperCase();
 if(/ERROR|REVERT|FAILED|UNDETERMINED|CANCEL/.test(status+' '+exec))return 'error';
 if(status==='FINALIZED'&&exec==='SUCCESS')return 'success';
 return 'pending';
}
const same=(a,b)=>String(a).toLowerCase()===String(b).toLowerCase();
export function verifyStored(record,value){
 if(!value||typeof value!=='object')return false;
 const a=record.args,actor=record.actor,method=record.method;
 switch(method){
  case 'create_challenge':
   return Number.isSafeInteger(record.prior)&&value.id>record.prior&&same(value.issuer,actor)&&
    value.title===a[0]&&value.rubric===a[1]&&value.reference_fixture===a[2]&&value.active===true;
  case 'submit_evidence':
   return Number.isSafeInteger(record.prior)&&value.id>record.prior&&value.challenge_id===a[0]&&
    same(value.applicant,actor)&&value.evidence===a[1]&&value.evidence_sha256===a[2]&&value.status==='SUBMITTED';
  case 'assess_attempt':
   return value.id===a[0]&&value.status==='ASSESSED'&&['PASS','FAIL','REVIEW'].includes(value.verdict);
  case 'close_challenge':
   return value.id===a[0]&&value.active===false&&same(value.issuer,actor);
  case 'issue_credential':
   return Number.isSafeInteger(record.prior)&&value.id>record.prior&&value.attempt_id===a[0]&&
    same(value.holder,actor)&&value.status==='VALID'&&value.verdict==='PASS';
  case 'revoke_credential':
   return value.id===a[0]&&same(value.issuer,actor)&&value.status==='REVOKED'&&value.revocation_reason===a[1];
  case 'open_job':
   return Number.isSafeInteger(record.prior)&&value.id>record.prior&&same(value.client,actor)&&
    same(value.agent,a[0])&&value.agreement===a[1]&&value.reference_input===a[2]&&value.stage==='OPEN';
  case 'submit_delivery':
   return value.id===a[0]&&same(value.agent,actor)&&value.delivery===a[1]&&value.delivery_sha256===a[2]&&value.stage==='DELIVERED';
  case 'open_dispute':
   return value.id===a[0]&&same(value.client,actor)&&value.claim===a[1]&&value.stage==='DISPUTED';
  case 'accept_delivery':
   return value.id===a[0]&&same(value.client,actor)&&value.stage==='DECIDED'&&value.verdict==='CLIENT_ACCEPTED';
  case 'adjudicate':
   return value.id===a[0]&&value.stage==='DECIDED'&&
    ['AGENT_AT_FAULT','CLAIM_UNSUPPORTED','REVIEW_REQUIRED'].includes(value.verdict);
  case 'record_outcome':
   return Number.isSafeInteger(record.prior)&&value.id>record.prior&&value.job_id===a[0]&&
    ['CLIENT_ACCEPTED','AGENT_AT_FAULT','CLAIM_UNSUPPORTED'].includes(value.verdict);
  default:return false;
 }
}
