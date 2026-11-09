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
 return '<section class="action"><div class="actionTop"><div><span class="eyebrow">'+esc(action.scope==='first'?project.labels[0]:project.labels[1])+
 '</span><h2>'+esc(action.title)+'</h2><div class="hint">'+esc(action.subtitle)+'</div></div><span class="role">'+esc(action.role)+'</span></div>'+
 '<form data-form="'+esc(action.method)+'"><div class="fields">'+action.fields.map(f=>field(f,action.method)).join('')+'</div>'+
 '<div class="actionFooter">'+(action.preset?'<button type="button" data-fill="'+esc(action.method)+'">Fill example</button>':'')+
 (action.hashSource?'<button type="button" data-digest="'+esc(action.method)+'">Calculate SHA-256</button>':'')+
 '<small>Review every value before signing.</small><button type="submit" class="primary" data-sign>Sign & verify →</button></div></form></section>';
}
function render(){
 document.title=project.name+' · GenLayer Studionet';
 document.documentElement.style.setProperty('--accent',project.id==='reputrail'?'#956d42':'#2a7b76');
 $('app').innerHTML=
 '<div class="app"><aside class="sidebar"><a class="brand" href="#overview"><span class="logo">'+esc(project.name[0])+'</span><span>'+esc(project.name)+'<small>GENLAYER PROTOCOL</small></span></a>'+
 '<div class="label">WORKSPACE</div><nav class="nav" aria-label="App navigation">'+
 '<button type="button" data-page="overview" class="active">Overview <span>01</span></button>'+
 '<button type="button" data-page="workflow">Workspace <span>02</span></button>'+
 '<button type="button" data-page="explorer">Chain explorer <span>03</span></button></nav>'+
 '<div class="sideFoot"><b>● STUDIONET · 61999</b><div>No mainnet or external identity verification.</div><a href="https://github.com/bearbaba/'+esc(project.name)+'" rel="noopener" target="_blank">Open source ↗</a></div></aside>'+
 '<main><header><span id="breadcrumb">Overview</span><div class="right"><span class="network" id="network">Checking deployment…</span><button class="wallet" id="wallet">Connect wallet</button></div></header>'+
 '<div class="content">'+
 '<section class="page" id="overview"><span class="eyebrow">'+esc(project.eyebrow)+'</span><h1>'+esc(project.hero)+'</h1><p class="lede">'+esc(project.intro)+'</p>'+
 '<div class="buttons"><button class="primary" data-page="workflow">Open workspace →</button><button data-page="explorer">Inspect on-chain state</button></div>'+
 '<div class="stats"><div class="stat"><small>Network</small><strong>Studionet</strong><p>Chain 61999 · test GEN</p></div>'+
 '<div class="stat"><small>Intelligent Contracts</small><strong>02</strong><p>'+esc(project.labels.join(' + '))+'</p></div>'+
 '<div class="stat"><small>Live integration</small><strong id="deployState">CHECKING</strong><p>Source parity requires separate verification</p></div></div>'+
 '<div class="panel"><h2>A complete evidence workflow</h2><p>Signed identities, version-aware permission checks and independent consensus where judgment matters.</p>'+
 '<div class="process">'+project.cards.map(c=>'<article><span>'+esc(c[0])+'</span><strong>'+esc(c[1])+'</strong><p>'+esc(c[2])+'</p></article>').join('')+'</div></div>'+
 '<p class="footnote"><strong>Proof boundary.</strong> '+esc(project.scope)+'</p></section>'+
 '<section class="page" id="workflow" hidden><span class="eyebrow">SIGNED OPERATIONS · WALLET ROLES</span><h1>Work with real contracts.</h1>'+
 '<p class="lede">Follow the cards in order. Switch to the specified signer. Every write waits for GenLayer finality and verifies persisted state before confirmation.</p>'+
 '<div class="notice warning" id="workflowNotice">Contract deployment is required before signing. You can inspect example fields without submitting transactions.</div>'+
 '<div class="gridForms">'+project.forms.map(formHTML).join('')+'</div></section>'+
 '<section class="page" id="explorer" hidden><span class="eyebrow">READ ONLY · LATEST_FINAL</span><h1>Inspect the chain.</h1>'+
 '<p class="lede">Public readback of actual stored contract state. A transaction hash alone never proves successful execution.</p>'+
 '<section class="panel"><h2>Query a record</h2><form id="readForm" class="readForm"><div class="fields">'+
 '<label class="wide">Read method<select id="readMethod">'+project.reads.map((r,i)=>'<option value="'+i+'">'+esc(r[0])+'</option>').join('')+'</select></label>'+
 '<label>ID (when required)<input id="readId" type="number" value="1" min="1" step="1"></label>'+
 '<label>Wallet (when required)<input id="readActor" type="text" placeholder="0x…"></label></div>'+
 '<button type="submit" class="primary">Read LATEST_FINAL →</button></form>'+
 '<pre id="readResult" class="readResult">Choose a query and run readback.</pre></section>'+
 '<p class="footnote">No signatures or wallet connection required for reads. Evidence can be compared to on-chain values and contract source.</p></section></div></main>'+
 '<aside class="activity" aria-live="polite"><div class="eyebrow">TRANSACTION TRACKER</div><h2 id="txTitle" class="txState">Ready to inspect.</h2>'+
 '<p id="txInfo" class="txInfo">Connect the required wallet and choose one action. No transaction has been sent.</p>'+
 '<div id="txHash" class="txHash">No pending transaction</div>'+
 '<div class="txSteps"><div id="phase1">01 · Wallet signature</div><div id="phase2">02 · Finalized execution</div><div id="phase3">03 · State readback</div></div>'+
 '<a id="txLink" target="_blank" rel="noopener" hidden>Open transaction in Explorer ↗</a>'+
 '<button id="retry" hidden>Recheck pending transaction</button>'+
 '<div id="walletIdentity" class="walletIdentity">No wallet selected.</div></aside></div>';
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
   const text=$('f_'+m+'_'+a.hashSource).value;
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
