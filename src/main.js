import './style.css';
import {project} from './project.js';
import {parseValue,classifyTx,verifyStored} from '../lib/verification.js';
import {createClient} from 'genlayer-stable';
import {studionet} from 'genlayer-stable/chains';

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ADDRESS=/^0x[a-fA-F0-9]{40}$/;
const CHAIN=61999, txPrefix='https://explorer-studio.genlayer.com/tx/';
const pendingKey=project.id+'-pending-write-v1';
let config=null,account='',busy=false,checking=false;
const same=(x,y)=>String(x).toLowerCase()===String(y).toLowerCase();
const short=x=>ADDRESS.test(x||'')?x.slice(0,6)+'…'+x.slice(-4):'Connect wallet';
function field([key,title,kind],method){
 const id='f_'+method+'_'+key;
 const common='id="'+id+'" name="'+key+'" required ';
 const input=kind==='textarea'?'<textarea '+common+' rows="4"></textarea>':
  '<input '+common+' type="'+(kind==='number'?'number':'text')+'" '+(kind==='number'?'min="1" step="1"':'')+
  ' placeholder="'+(kind==='address'?'0x…':kind==='hash'?'sha256 of exact content':'')+'">';
 return '<label class="'+(kind==='textarea'?'wide':'')+'">'+esc(title)+input+'</label>';
}
function formHTML(action){
 const index=project.forms.findIndex(x=>x.method===action.method);
 const phase=index<3?'ASSESSMENT':'CREDENTIAL';
 return '<article class="action"><div class="actionTop"><div class="action-number">'+String(index+1).padStart(2,'0')+'</div><div class="action-intro"><span class="eyebrow">'+phase+' · '+esc(action.scope==='first'?project.labels[0]:project.labels[1])+'</span><h2>'+esc(action.title)+'</h2><p class="hint">'+esc(action.subtitle)+'</p></div><span class="role">'+esc(action.role)+'</span></div>'+
 '<form data-form="'+esc(action.method)+'"><div class="fields">'+action.fields.map(f=>field(f,action.method)).join('')+'</div>'+
 '<div class="actionFooter">'+(action.preset?'<button class="soft" type="button" data-fill="'+esc(action.method)+'">Load example</button>':'')+
 (action.hashSource?'<button class="soft" type="button" data-digest="'+esc(action.method)+'">Generate SHA-256</button>':'')+
 '<small>Wallet approval required · Studionet</small><button type="submit" class="primary" data-sign>Sign transaction <span aria-hidden="true">↗</span></button></div></form></article>';
}
function render(){
 document.title='SKILLSTAMP — Verifiable skill credentials';
 const cards=project.cards.map((c,i)=>'<article class="path-card"><div class="path-top"><span>MODULE / '+esc(c[0])+'</span><span>0'+(i+1)+' — 04</span></div><div class="path-symbol">'+['✧','◇','◎','✳'][i]+'</div><h3>'+esc(c[1])+'</h3><p>'+esc(c[2])+'</p></article>').join('');
 const methods=project.forms.map((a,i)=>'<div class="rail-step"><span>'+String(i+1).padStart(2,'0')+'</span><div><b>'+esc(a.title)+'</b><small>'+esc(a.role)+'</small></div></div>').join('');
 const queryOptions=project.reads.map((r,i)=>'<option value="'+i+'">'+esc(r[0])+'</option>').join('');
 $('app').innerHTML=
 '<div class="academy-app"><header class="academy-header"><a class="academy-brand" href="#overview"><span class="brand-monogram">S<span>✳</span></span><span>SKILLSTAMP<small>PROOF OF PRACTICE</small></span></a>'+
 '<nav class="nav" aria-label="Primary navigation"><button class="active" type="button" data-page="overview">Discover</button><button type="button" data-page="workflow">Assessment studio</button><button type="button" data-page="explorer">Verify a credential</button></nav>'+
 '<div class="header-actions"><span class="network" id="network">Connecting to Studionet…</span><button class="wallet" id="wallet">Connect wallet ↗</button></div></header>'+
 '<main class="main-shell"><div class="content"><section class="page" id="overview">'+
 '<div class="hero-grid"><div class="hero-copy"><div class="eyebrow"><span class="spark">✳</span> SKILLS DESERVE BETTER PROOF <span class="eyebrow-line"></span> GENLAYER / 61999</div>'+
 '<h1>Make your<br><em>work</em> your<br>credential<span class="fullstop">.</span></h1>'+
 '<p class="lede">A challenge. Your evidence. An independent AI decision. A credential tied to the exact work — not just a badge on a profile.</p>'+
 '<div class="buttons"><button class="primary" data-page="workflow">Enter the assessment studio <span aria-hidden="true">↗</span></button><button class="outline" data-page="explorer">Verify on-chain ↗</button></div>'+
 '<div class="hero-micro"><span class="micro-dot"></span><span id="deployState">CHECKING</span><span> · </span><span>GenLayer Studionet / Test network</span></div></div>'+
 '<div class="certificate-stage"><div class="halo halo-a"></div><div class="halo halo-b"></div><div class="specimen-card">'+
 '<div class="specimen-head"><span class="tiny-star">✳</span><span>SKILLSTAMP / STUDIO</span><span>NO. —</span></div>'+
 '<div class="specimen-main"><span class="specimen-kicker">EVIDENCE-BOUND / SAMPLE FORMAT</span><div class="specimen-badge">S<span>✧</span></div><strong>Proof of<br>competency</strong>'+
 '<p>Scoped assessment · Versioned rubric · Linked to a wallet</p></div>'+
 '<div class="specimen-bottom"><span>UNISSUED EXAMPLE<br><b>Not a live credential</b></span><span class="barcode">▌▌▏▌▏▌▌▏▌▏</span></div></div>'+
 '<span class="decor-note">TRUST IS EARNED, NOT CLAIMED ↗</span></div></div>'+
 '<div class="metric-bar"><div><small>01 / NETWORK</small><b>Studionet <span>61999</span></b></div><div><small>02 / ON-CHAIN CORE</small><b>02 contracts</b></div><div><small>03 / EVIDENCE</small><b>SHA-256 linked</b></div><div><small>04 / REVIEW</small><b>Independent AI</b></div></div>'+
 '<section class="section-wrap"><div class="section-intro"><div class="eyebrow">LEARNING, VERIFIED</div><h2>From a skill to<br><em>something provable.</em></h2><p>No mysterious reputation score. Every pass is scoped to a specific challenge, evidence and rubric version.</p></div>'+
 '<div class="path-grid">'+cards+'</div></section>'+
 '<div class="boundary-strip"><span>IMPORTANT / SCOPE</span><p>'+esc(project.scope)+'</p></div>'+
 '</section>'+
 '<section class="page" id="workflow" hidden><div class="section-heading"><span class="eyebrow">ASSESSMENT / WORKSPACE</span><h1>Your credential begins<br>with <em>evidence.</em></h1><p>Complete only the step that matches your wallet role. Every action is signed; success is confirmed against final on-chain state.</p></div>'+
 '<div class="workspace-grid"><aside class="workspace-guide"><div class="guide-label">THE CREDENTIAL JOURNEY</div><div class="guide-steps">'+methods+'</div><div class="guide-foot"><span>✳</span><p>Keep the exact evidence text and SHA-256 together. A PASS is bound to this specific rubric.</p></div></aside>'+
 '<div class="workspace-body"><div class="notice warning" id="workflowNotice">Checking deployed contracts before wallet signing…</div><div class="gridForms">'+project.forms.map(formHTML).join('')+'</div></div></div></section>'+
 '<section class="page" id="explorer" hidden><div class="verify-hero"><div class="eyebrow">CREDENTIAL LOOKUP / LATEST_FINAL</div><h1>Verify the<br><em>evidence trail.</em></h1><p>No wallet connection needed. Read records directly from the deployed contracts and inspect their current status.</p></div>'+
 '<div class="verify-layout"><div class="verify-illustration"><div class="verify-big">✳</div><span>AUTHENTICITY IS A PROCESS</span><p>Credential records contain the holder, challenge, rubric digest, evidence digest and status. A revoked credential remains readable.</p></div>'+
 '<section class="panel lookup-panel"><div class="eyebrow">ON-CHAIN QUERY</div><h2>Check a record</h2>'+
 '<form id="readForm" class="readForm"><div class="fields"><label class="wide">Which record?<select id="readMethod">'+queryOptions+'</select></label>'+
 '<label>Record ID<input id="readId" type="number" value="1" min="1" step="1"></label>'+
 '<label>Wallet address<input id="readActor" type="text" placeholder="0x…"></label></div><button class="primary" type="submit">Read final state <span aria-hidden="true">↗</span></button></form>'+
 '<pre id="readResult" class="readResult">Select a record to load its on-chain state.</pre></section></div></section></div></main>'+
 '<aside class="activity" aria-live="polite"><div class="activity-head"><span class="eyebrow">SIGNATURE / ACTIVITY</span><span class="activity-mini">STUDIONET</span></div>'+
 '<h2 class="txState" id="txTitle">Your signature, your proof.</h2><p class="txInfo" id="txInfo">Choose an assessment action to begin. No transaction has been sent.</p>'+
 '<div class="txSteps"><div id="phase1">01 / Sign</div><div id="phase2">02 / Finalize</div><div id="phase3">03 / Verify</div></div>'+
 '<div class="txHash" id="txHash">No pending transaction</div><div class="activity-bottom"><a id="txLink" target="_blank" rel="noopener" hidden>View on Explorer ↗</a>'+
 '<button id="retry" type="button" hidden>Recheck transaction</button></div><div class="walletIdentity" id="walletIdentity">No wallet selected.</div></aside></div>';
 bind();
}
function notice(title,info,phase=0,hash=''){
 $('txTitle').textContent=title;$('txInfo').textContent=info;
 $('txHash').textContent=hash||'No pending transaction';
 $('txLink').hidden=!hash;if(hash)$('txLink').href=txPrefix+encodeURIComponent(hash);
 for(let i=1;i<=3;i++)$('phase'+i).className=i<phase?'done':i===phase?'current':'';
}
function showPage(page){
 const id=['overview','workflow','explorer'].includes(page)?page:'overview';
 for(const p of ['overview','workflow','explorer'])$(p).hidden=p!==id;
 for(const b of document.querySelectorAll('[data-page]'))b.classList.toggle('active',b.dataset.page===id);
 $('breadcrumb').textContent=id[0].toUpperCase()+id.slice(1);
 if(location.hash!=='#'+id)history.replaceState(null,'','#'+id);
}
function setBusy(value){
 busy=value;
 for(const b of document.querySelectorAll('[data-sign]'))b.disabled=value||!config?.configured;
}
function bind(){
 for(const b of document.querySelectorAll('[data-page]'))b.onclick=()=>showPage(b.dataset.page);
 window.addEventListener('hashchange',()=>showPage(location.hash.slice(1)));
 $('wallet').onclick=()=>connect().catch(e=>notice('Wallet not connected',e.message));
 for(const action of project.forms){
  const f=document.querySelector('form[data-form="'+action.method+'"]');
  f.onsubmit=e=>{e.preventDefault();write(action).catch(err=>{setBusy(false);notice('Not submitted',err.message)})};
 }
 for(const button of document.querySelectorAll('[data-fill]'))button.onclick=()=>{
  const m=button.dataset.fill,a=project.forms.find(x=>x.method===m),data=project.presets[a.preset]||{};
  for(const [key,val] of Object.entries(data)){
   const field=$('f_'+m+'_'+key);if(field)field.value=String(val);
  }
  notice('Example loaded','Edit the values and verify the signer. Nothing was sent.');
 };
 for(const button of document.querySelectorAll('[data-digest]'))button.onclick=async()=>{
  try{const m=button.dataset.digest,a=project.forms.find(x=>x.method===m);
   const text=$('f_'+m+'_'+a.hashSource).value.trim();
   if(!text)throw Error('Enter the exact evidence or delivery content first');
   const field=a.fields.find(x=>x[2]==='hash');
   $('f_'+m+'_'+field[0]).value=await sha256(text);
   notice('Content hash ready','SHA-256 computed locally from the exact text. No transaction sent.');
  }catch(e){notice('Unable to calculate hash',e.message)}
 };
 $('readForm').onsubmit=e=>{e.preventDefault();runRead()};
 $('readMethod').onchange=updateReadFields;
 $('retry').onclick=()=>{const p=loadPending();if(p)follow(p)};
 window.ethereum?.on?.('accountsChanged',a=>setAccount(a?.[0]||''));
 window.ethereum?.on?.('chainChanged',()=>notice('Network changed','Studionet 61999 required to sign'));
 showPage(location.hash.slice(1)||'overview');
 updateReadFields();
 const pending=loadPending();
 if(pending){$('retry').hidden=false;notice('Pending transaction saved','Recheck this transaction before signing anything else.',2,pending.hash)}
}
function updateReadFields(){
 const r=project.reads[Number($('readMethod').value)];
 $('readId').parentElement.hidden=!r[3].includes('id');
 $('readActor').parentElement.hidden=!r[3].includes('address');
}
async function api(scope,method,args=[]){
 const url=new URL('/api/state',location.origin);
 url.searchParams.set('scope',scope);url.searchParams.set('method',method);
 args.forEach((v,i)=>url.searchParams.set('a'+i,String(v)));
 const resp=await fetch(url,{cache:'no-store'});
 let json;try{json=await resp.json()}catch{throw Error('Read API unavailable. Deploy on Vercel or configure dev server API.')}
 if(!resp.ok||!json.ok)throw Error(json.error||'Read failed');
 return parseValue(json.value);
}
async function runRead(){
 try{
  if(!config?.configured)throw Error('Two deployed contracts must be configured for on-chain reads');
  const r=project.reads[Number($('readMethod').value)];
  const args=r[3].map(type=>type==='address'?$('readActor').value.trim():positive($('readId').value));
  for(const v of args)if(typeof v==='string'&&!ADDRESS.test(v))throw Error('Invalid address');
  $('readResult').textContent='Reading GenLayer LATEST_FINAL…';
  const value=await api(r[1],r[2],args);
  $('readResult').textContent=JSON.stringify({network:61999,scope:r[1],method:r[2],args,
   finality:'LATEST_FINAL',value},null,2);
 }catch(e){$('readResult').textContent='Read failed: '+e.message}
}
function setAccount(a){
 account=ADDRESS.test(a||'')?a:'';
 $('wallet').textContent=account?short(account)+' · Switch':'Connect wallet';
 $('walletIdentity').textContent=account?'Active signer: '+account:'No wallet selected.';
}
async function connect(){
 if(!window.ethereum)throw Error('Install a wallet extension with EIP-1193 support');
 if(account){
  try{await window.ethereum.request({method:'wallet_requestPermissions',params:[{eth_accounts:{}}]})}
  catch(e){if(e?.code===4001)throw Error('Account selection rejected')}
 }
 const accounts=await window.ethereum.request({method:'eth_requestAccounts'});
 if(!ADDRESS.test(accounts?.[0]||''))throw Error('No valid wallet selected');
 setAccount(accounts[0]);
}
async function ensureWallet(){
 if(!account)await connect();
 let id=await window.ethereum.request({method:'eth_chainId'});
 if(parseInt(id,16)!==CHAIN){
  const hex='0x'+CHAIN.toString(16);
  try{await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:hex}]})}
  catch(e){
   if(e?.code!==4902)throw Error('Switch to GenLayer Studionet 61999');
   await window.ethereum.request({method:'wallet_addEthereumChain',params:[{
    chainId:hex,chainName:'GenLayer Studionet',rpcUrls:['https://studio.genlayer.com/api'],
    nativeCurrency:{name:'GEN',symbol:'GEN',decimals:18},
    blockExplorerUrls:['https://explorer-studio.genlayer.com']}]});
  }
 }
 id=await window.ethereum.request({method:'eth_chainId'});
 if(parseInt(id,16)!==CHAIN)throw Error('Wrong network');
 const selected=await window.ethereum.request({method:'eth_accounts'});
 if(!same(selected?.[0],account))throw Error('Active wallet changed. Connect again.');
 return createClient({chain:studionet,account,provider:window.ethereum});
}
function positive(s){if(!/^[1-9][0-9]*$/.test(String(s))||!Number.isSafeInteger(Number(s)))throw Error('Positive integer ID required');return Number(s)}
async function sha256(text){
 const out=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
 return Array.from(new Uint8Array(out),x=>x.toString(16).padStart(2,'0')).join('');
}
async function precheck(record){
 const m=record.method,a=record.args,actor=record.actor;
 if(m==='submit_evidence'){
  const c=await api('first','get_challenge',[a[0]]);
  if(!c.active||same(c.issuer,actor))throw Error('Applicant must differ from issuer and challenge must be active');
  const old=await api('first','attempt_for',[a[0],actor]);
  if(old)throw Error('Applicant already attempted this challenge');
 }else if(m==='assess_attempt'){
  const attempt=await api('first','get_attempt',[a[0]]);
  const challenge=await api('first','get_challenge',[attempt.challenge_id]);
  if(!same(challenge.issuer,actor)||attempt.status!=='SUBMITTED')throw Error('Use the issuer wallet on a pending attempt');
 }else if(m==='issue_credential'){
  const perm=await api('first','credential_permission',[a[0],actor]);
  if(perm.allowed!==true||!same(perm.applicant,actor))throw Error('Not authorized: requires a current PASS for this applicant');
 }else if(m==='revoke_credential'){
  const c=await api('second','get_credential',[a[0]]);
  if(!same(c.issuer,actor)||c.status!=='VALID')throw Error('Only issuer may revoke a valid credential');
 }else if(m==='close_challenge'){
  const c=await api('first','get_challenge',[a[0]]);
  if(!same(c.issuer,actor)||!c.active)throw Error('Issuer only; challenge must be active');
 }else if(m==='open_job'){
  if(same(actor,a[0]))throw Error('Client and agent wallets must be distinct');
 }else if(['submit_delivery','open_dispute','accept_delivery','adjudicate'].includes(m)){
  const j=await api('first','get_job',[a[0]]);
  if(m==='submit_delivery'&&(!same(j.agent,actor)||j.stage!=='OPEN'))
   throw Error('Assigned agent only, before delivery closes');
  if(['open_dispute','accept_delivery'].includes(m)&&(!same(j.client,actor)||j.stage!=='DELIVERED'))
   throw Error('Client only; job must be delivered but not decided');
  if(m==='adjudicate'&&(j.stage!=='DISPUTED'||j.verdict!=='PENDING'))
   throw Error('Only a pending dispute can be adjudicated');
 }else if(m==='record_outcome'){
  const [perm,old]=await Promise.all([api('first','reputation_permission',[a[0]]),api('second','outcome_for',[a[0]])]);
  if(perm.allowed!==true||old)throw Error('Only a final eligible unrecorded outcome can enter the ledger');
 }
}
const countNames={create_challenge:['first','challenges'],submit_evidence:['first','attempts'],
 issue_credential:['second','credentials'],open_job:['first','jobs'],record_outcome:['second','outcomes']};
function argsOf(a){
 return a.fields.map(([key,,kind])=>{
  const input=$('f_'+a.method+'_'+key),v=input.value;
  if(!v.trim())throw Error('Missing '+key);
  if(kind==='number')return positive(v.trim());
  if(kind==='address'&&!ADDRESS.test(v.trim()))throw Error('Invalid wallet address');
  if(kind==='hash'&&!/^[a-f0-9]{64}$/.test(v.trim()))throw Error('Expected lowercase SHA-256');
  return v.trim();
 });
}
function pending(){try{return JSON.parse(sessionStorage.getItem(pendingKey)||'null')}catch{return null}}
function loadPending(){return pending()}
function savePending(r){sessionStorage.setItem(pendingKey,JSON.stringify(r))}
function clearPending(){sessionStorage.removeItem(pendingKey)}
async function write(action){
 if(busy)return;
 if(!config?.configured)throw Error('Deploy both contracts and configure the addresses before signing');
 const old=loadPending();
 if(old){$('retry').hidden=false;notice('Previous transaction pending','Recheck the saved hash before signing again.',2,old.hash);return}
 setBusy(true);
 try{
  const args=argsOf(action);
  if(action.hashSource){
   const field=action.fields.findIndex(f=>f[0]===action.hashSource);
   const hashIndex=action.fields.findIndex(f=>f[2]==='hash');
   if(args[hashIndex]!==await sha256(args[field]))throw Error('SHA-256 does not match the exact submitted content');
  }
  const client=await ensureWallet();
  const rec={scope:action.scope,method:action.method,args,actor:account.toLowerCase(),hash:'',prior:null};
  await precheck(rec);
  const counters=countNames[action.method];
  if(counters){
   const stat=await api(counters[0],'stats');
   rec.prior=stat[counters[1]];
   if(!Number.isSafeInteger(rec.prior))throw Error('Cannot verify pre-write count');
  }
  notice('Confirm in wallet','Check the destination contract, signer and method. No automatic retries.',1);
  const hash=await client.writeContract({address:config[action.scope],functionName:action.method,args,value:0n});
  if(!/^0x[a-f0-9]{64}$/i.test(hash||''))throw Error('Wallet did not return valid transaction hash');
  rec.hash=hash;savePending(rec);$('retry').hidden=false;
  setBusy(false);await follow(rec);
 }finally{setBusy(false)}
}
async function readProof(rec){
 const m=rec.method,a=rec.args;
 let value;
 if(m==='create_challenge')value=await api('first','get_challenge',[(await api('first','stats')).challenges]);
 else if(m==='submit_evidence')value=await api('first','get_attempt',[(await api('first','stats')).attempts]);
 else if(m==='assess_attempt')value=await api('first','get_attempt',[a[0]]);
 else if(m==='issue_credential')value=await api('second','get_credential',[(await api('second','stats')).credentials]);
 else if(m==='revoke_credential')value=await api('second','get_credential',[a[0]]);
 else if(m==='close_challenge')value=await api('first','get_challenge',[a[0]]);
 else if(m==='open_job')value=await api('first','get_job',[(await api('first','stats')).jobs]);
 else if(['submit_delivery','accept_delivery','open_dispute','adjudicate'].includes(m))value=await api('first','get_job',[a[0]]);
 else if(m==='record_outcome')value=await api('second','outcome_for',[a[0]]);
 return {ok:verifyStored(rec,value),value};
}
async function follow(rec){
 if(checking)return;
 checking=true;setBusy(true);
 notice('Checking finality','Do not sign again. Waiting for execution result and exact stored-state readback.',2,rec.hash);
 try{
  for(let i=0;i<55;i++){
   let tx;
   try{
    const resp=await fetch('/api/tx?hash='+encodeURIComponent(rec.hash),{cache:'no-store'});
    tx=await resp.json();
    if(!resp.ok||!tx.ok)throw Error(tx.error||'Transaction fetch failed');
   }catch{await new Promise(r=>setTimeout(r,3200));continue}
   const state=classifyTx(tx);
   if(state==='error'){
    clearPending();$('retry').hidden=true;
    notice('Finalized execution rejected','Transaction rolled back or failed. No successful state is claimed.',2,rec.hash);
    return;
   }
   if(state==='success'){
    for(let n=0;n<9;n++){
     try{
      const proof=await readProof(rec);
      if(proof.ok){
       clearPending();$('retry').hidden=true;
       notice('Signed and verified','FINALIZED / SUCCESS and exact LATEST_FINAL persisted state match. '+rec.method+'.',3,rec.hash);
       return;
      }
     }catch{}
     await new Promise(r=>setTimeout(r,2500));
    }
    notice('Finalized, readback not verified','Keep the hash and use Recheck. The app will not infer success without matching state.',2,rec.hash);
    return;
   }
   await new Promise(r=>setTimeout(r,3200));
  }
  notice('Finality unresolved','Transaction retained for safe recheck. Do not send duplicate writes.',2,rec.hash);
 }finally{checking=false;setBusy(false)}
}
async function init(){
 render();
 try{
  const response=await fetch('/api/state?op=config',{cache:'no-store'});
  const json=await response.json();
  if(!response.ok||!json.ok)throw Error('Configuration endpoint unavailable');
  config=json;
  $('deployState').textContent=json.configured?'CONFIGURED':'NOT DEPLOYED';
  $('network').textContent=json.configured?'Studionet · addresses configured':'Studionet · deployment required';
  $('workflowNotice').textContent=json.configured?
   'Two contract addresses are configured. Verify deployed source and constructor binding before signing.':
   'Contracts are not deployed/configured in this environment. Signing is disabled.';
  $('workflowNotice').className=json.configured?'notice':'notice warning';
 }catch{
  config={configured:false};
  $('deployState').textContent='NOT DEPLOYED';
  $('network').textContent='API unavailable';
  $('workflowNotice').textContent='No serverless configuration available. Deploy contracts and API before signing.';
 }
 setBusy(false);
}
init();
