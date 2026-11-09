import './style.css';
import {project} from './project.js';
import {parseValue,classifyTx,verifyStored} from '../lib/verification.js';
import {createClient} from 'genlayer-stable';
import {studionet} from 'genlayer-stable/chains';
import {HASH_RE,readHistory,rememberTx,updateTxStatus,displayStatus} from '../lib/tx-history.js';

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ADDRESS=/^0x[a-fA-F0-9]{40}$/;
const CHAIN=61999, txPrefix='https://explorer-studio.genlayer.com/tx/';
const pendingKey=project.id+'-pending-write-v1';
const txStorage=()=>{try{return localStorage}catch{return {getItem:()=>null,setItem:()=>{}}}};
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
 const actionTabs=project.forms.map((a,i)=>'<button type="button" role="tab" aria-selected="false" aria-controls="actionPanel_'+esc(a.method)+'" data-action-tab="'+esc(a.method)+'"><span class="studio-tab-num">'+String(i+1).padStart(2,'0')+'</span><span class="studio-tab-text">'+esc(a.title)+'</span><span class="studio-tab-role">'+esc(a.role)+'</span></button>').join('');
 const actionPanels=project.forms.map(a=>'<div class="studio-action-panel" id="actionPanel_'+esc(a.method)+'" data-action-panel="'+esc(a.method)+'" role="tabpanel" hidden>'+formHTML(a)+'</div>').join('');
 const queryOptions=project.reads.map((r,i)=>'<option value="'+i+'">'+esc(r[0])+'</option>').join('');
 $('app').innerHTML=
 '<div class="academy-app"><header class="academy-header"><a class="academy-brand" href="#overview"><span class="brand-monogram">S<span>✳</span></span><span>SKILLSTAMP<small>PROOF OF PRACTICE</small></span></a>'+
 '<nav class="nav" aria-label="Primary navigation"><button class="active" type="button" data-page="overview">Discover</button><button type="button" data-page="workflow">Assessment studio</button><button type="button" data-page="explorer">Verify a credential</button><button type="button" data-page="transactions">Transactions</button></nav>'+
 '<div class="header-actions"><span id="breadcrumb" class="sr-only" aria-live="polite">Discover</span><span class="network" id="network">Connecting to Studionet…</span><button class="wallet" id="wallet">Connect wallet ↗</button></div></header>'+
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
 '<section class="page studio-page" id="workflow" hidden><div class="studio-heading"><div><span class="eyebrow">SKILLSTAMP / ASSESSMENT STUDIO</span><h1>One action.<br><em>One clear result.</em></h1><p>Select a function, use the appropriate wallet, and sign only what you intend to do.</p></div><div class="studio-heading-tag">GENLAYER · STUDIONET 61999</div></div>'+
 '<div class="studio-gate" id="workspaceDisconnected"><span class="studio-gate-symbol">✳</span><div><strong>Connect your wallet to start</strong><p>The studio will display one operation at a time. Public credential verification remains available without a wallet.</p></div><button class="primary" id="connectWorkspace" type="button">Connect wallet ↗</button></div>'+
 '<div class="studio-connected" id="workspaceConnected" hidden><div class="studio-account"><span class="studio-account-dot"></span><div><small>CONNECTED WALLET</small><strong id="studioWallet">—</strong></div><span id="studioRole" class="studio-role">Wallet connected</span></div>'+
 '<div id="workflowNotice" class="notice warning">Checking contract connection…</div><div id="workspaceFeedback" class="workspace-feedback" role="status" aria-live="polite" hidden></div>'+
 '<div class="studio-control"><nav class="studio-tabs" id="actionTabs" role="tablist" aria-label="Assessment functions">'+actionTabs+'</nav><div class="studio-detail"><div class="studio-detail-caption"><span id="activeActionMeta">SELECT A FUNCTION</span><span>STUDIONET · SIGNED OPERATION</span></div><div id="studioPanels">'+actionPanels+'</div></div></div></div></section>'+
 '<section class="page" id="explorer" hidden><div class="verify-hero"><div class="eyebrow">CREDENTIAL LOOKUP / LATEST_FINAL</div><h1>Verify the<br><em>evidence trail.</em></h1><p>No wallet connection needed. Read records directly from the deployed contracts and inspect their current status.</p></div>'+
 '<div class="verify-layout"><div class="verify-illustration"><div class="verify-big">✳</div><span>AUTHENTICITY IS A PROCESS</span><p>Credential records contain the holder, challenge, rubric digest, evidence digest and status. A revoked credential remains readable.</p></div>'+
 '<section class="panel lookup-panel"><div class="eyebrow">ON-CHAIN QUERY</div><h2>Check a record</h2>'+
 '<form id="readForm" class="readForm"><div class="fields"><label class="wide">Which record?<select id="readMethod">'+queryOptions+'</select></label>'+
 '<label>Record ID<input id="readId" type="number" value="1" min="1" step="1"></label>'+
 '<label>Wallet address<input id="readActor" type="text" placeholder="0x…"></label></div><button class="primary" type="submit">Read final state <span aria-hidden="true">↗</span></button></form>'+
 '<pre id="readResult" class="readResult">Select a record to load its on-chain state.</pre></section></div></section>'+
 '<section class="page" id="transactions" hidden><div class="verify-hero"><div class="eyebrow">ON-CHAIN TRANSACTIONS / STUDIONET 61999</div><h1>Every signature.<br><em>A trace you can follow.</em></h1><p>Transactions initiated in this browser are saved automatically. History stays on this device; anyone can look up an existing GenLayer transaction hash below.</p></div>'+
 '<div class="history-summary"><div><span class="eyebrow">LOCAL TRANSACTION INDEX</span><strong id="transactionCount">0</strong><small>Saved hashes · this browser only</small></div><div><span class="eyebrow">VERIFICATION POLICY</span><strong>FINALIZED + SUCCESS</strong><small>State verification is displayed separately when available</small></div></div>'+
 '<section class="panel transaction-panel"><div class="tx-panel-title"><div><span class="eyebrow">TRANSACTION LOG</span><h2>Recent activity</h2></div><button type="button" id="refreshTxHistory">Refresh statuses ↻</button></div>'+
 '<p class="history-hint">This is a local index of signed transaction hashes, not a global database. Public transactions can always be checked using their hash.</p>'+
 '<div id="transactionList" class="transaction-list" aria-live="polite"><p>Loading local history…</p></div></section>'+
 '<section class="panel transaction-panel"><span class="eyebrow">VERIFY AN EXISTING HASH</span><h2>Look up a transaction</h2><p>Paste a GenLayer Studionet transaction hash to fetch its finalized/execution status. No wallet connection required.</p>'+
 '<form id="trackTxForm" class="tx-import"><label for="trackTxHash">Transaction hash</label><div class="tx-import-row"><input id="trackTxHash" name="hash" type="text" autocomplete="off" spellcheck="false" placeholder="0x… 64 hexadecimal digits" required><button class="primary" type="submit">Track hash ↗</button></div></form>'+
 '<div id="trackTxMessage" class="history-message" role="status"></div></section></section>'+
 '</div></main>'+
 '<aside class="activity" id="txPanel" aria-live="polite" role="status" hidden><div class="activity-head"><span class="eyebrow">LIVE TRANSACTION</span><button type="button" id="closeTx" class="tx-close" aria-label="Close transaction status">×</button></div>'+
 '<div class="txStateRow"><span class="txSpinner" id="txSpinner" aria-label="Processing" hidden></span><h2 class="txState" id="txTitle">Waiting for wallet</h2></div><p class="txInfo" id="txInfo">Your signed transaction will be tracked here.</p>'+
 '<div class="txHash" id="txHash" hidden></div><div class="activity-bottom"><a id="txLink" target="_blank" rel="noopener" hidden>View on Explorer ↗</a>'+
 '<button id="retry" type="button" hidden>Recheck transaction</button><button id="openTransactions" type="button" class="activity-history">Transaction history ↗</button></div><div class="walletIdentity" id="walletIdentity" hidden></div></aside></div>';
 bind();
}
const ACTION_NAMES={create_challenge:'Create challenge',submit_evidence:'Submit evidence',assess_attempt:'AI assessment',issue_credential:'Issue credential',revoke_credential:'Revoke credential',close_challenge:'Close challenge'};
let activeAction='create_challenge',issuerWallet='',activityTimer=null,noticeSerial=0;
function actionName(method){return ACTION_NAMES[method]||method.replaceAll('_',' ')}
function workspaceMessage(message,error=false){
 const area=$('workspaceFeedback');
 if(!area)return;
 area.textContent=String(message);
 area.hidden=false;
 area.className='workspace-feedback'+(error?' is-error':'');
}
function clearWorkspaceMessage(){const area=$('workspaceFeedback');if(area){area.hidden=true;area.textContent=''}}
function hideActivity(){
 if(activityTimer)clearTimeout(activityTimer);
 activityTimer=null;noticeSerial++;
 $('txPanel').hidden=true;
}
function notice(title,info,phase=0,hash='',working=false,kind='pending'){
 if(activityTimer)clearTimeout(activityTimer);
 activityTimer=null;
 noticeSerial++;
 const token=noticeSerial,panel=$('txPanel');
 panel.hidden=false;panel.dataset.state=kind;
 $('txTitle').textContent=title;$('txInfo').textContent=info;
 $('txSpinner').hidden=!working;
 $('txHash').hidden=!hash;$('txHash').textContent=hash||'';
 $('txLink').hidden=!hash;if(hash)$('txLink').href=txPrefix+encodeURIComponent(hash);
 if(!working&&['success','error','cancelled'].includes(kind)){
  activityTimer=setTimeout(()=>{if(noticeSerial===token&& !checking && !loadPending())hideActivity()},9000);
 }
}
function selectAction(method){
 if(!project.forms.some(a=>a.method===method))return;
 activeAction=method;
 for(const b of document.querySelectorAll('[data-action-tab]')){
  const chosen=b.dataset.actionTab===method;
  b.classList.toggle('active',chosen);
  b.setAttribute('aria-selected',String(chosen));
  b.tabIndex=chosen?0:-1;
 }
 for(const pane of document.querySelectorAll('[data-action-panel]'))pane.hidden=pane.dataset.actionPanel!==method;
 const action=project.forms.find(a=>a.method===method);
 $('activeActionMeta').textContent=action.role.toUpperCase()+' / '+actionName(method).toUpperCase();
 clearWorkspaceMessage();
}
function updateStudioAccount(switched=false){
 const connected=Boolean(account);
 $('workspaceDisconnected').hidden=connected;
 $('workspaceConnected').hidden=!connected;
 if(!connected)return;
 $('studioWallet').textContent=account;
 const issuer=issuerWallet&&same(account,issuerWallet);
 $('studioRole').textContent=issuer?'Issuer wallet':'Applicant / participant wallet';
 for(const b of document.querySelectorAll('[data-action-tab]')){
  const action=project.forms.find(a=>a.method===b.dataset.actionTab);
  b.classList.toggle('studio-role-match',issuer?action.role==='Issuer':action.role==='Applicant');
 }
 if(switched||!document.querySelector('[data-action-tab].active')){
  selectAction(issuer?'create_challenge':'submit_evidence');
 }
}
async function loadIssuer(){
 if(!config?.configured)return;
 try{
  const stats=await api('first','stats');
  if(Number(stats.challenges)>0){
   const challenge=await api('first','get_challenge',[1]);
   if(ADDRESS.test(challenge.issuer))issuerWallet=challenge.issuer;
  }
 }catch{}
 updateStudioAccount();
}
function showPage(page){
 const id=['overview','workflow','explorer','transactions'].includes(page)?page:'overview';
 for(const p of ['overview','workflow','explorer','transactions'])$(p).hidden=p!==id;
 for(const b of document.querySelectorAll('[data-page]'))b.classList.toggle('active',b.dataset.page===id);
 const breadcrumb=$('breadcrumb');
 if(breadcrumb)breadcrumb.textContent=id[0].toUpperCase()+id.slice(1);
 if(location.hash!=='#'+id)history.replaceState(null,'','#'+id);
 if(id==='transactions')renderHistory();
}
function setBusy(value){
 busy=value;
 for(const b of document.querySelectorAll('[data-sign]'))b.disabled=value||!config?.configured;
}
function bind(){
 for(const b of document.querySelectorAll('[data-page]'))b.onclick=()=>showPage(b.dataset.page);
 window.addEventListener('hashchange',()=>showPage(location.hash.slice(1)));
 $('wallet').onclick=()=>connect().catch(e=>workspaceMessage('Wallet: '+e.message,true));
 $('connectWorkspace').onclick=()=>connect().catch(e=>workspaceMessage('Wallet: '+e.message,true));
 for(const b of document.querySelectorAll('[data-action-tab]'))b.onclick=()=>selectAction(b.dataset.actionTab);
 $('closeTx').onclick=hideActivity;
 for(const action of project.forms){
  const f=document.querySelector('form[data-form="'+action.method+'"]');
  f.onsubmit=e=>{e.preventDefault();write(action).catch(err=>{setBusy(false);if(!$('txPanel').hidden)notice('Signature not completed',String(err.message||err),0,'',false,'error');else workspaceMessage(String(err.message||err),true)})};
 }
 for(const button of document.querySelectorAll('[data-fill]'))button.onclick=()=>{
  const m=button.dataset.fill,a=project.forms.find(x=>x.method===m),data=project.presets[a.preset]||{};
  for(const [key,val] of Object.entries(data)){
   const field=$('f_'+m+'_'+key);if(field)field.value=String(val);
  }
  workspaceMessage('Example loaded. Review the fields before signing.');
 };
 for(const button of document.querySelectorAll('[data-digest]'))button.onclick=async()=>{
  try{const m=button.dataset.digest,a=project.forms.find(x=>x.method===m);
   const text=$('f_'+m+'_'+a.hashSource).value.trim();
   if(!text)throw Error('Enter the exact evidence or delivery content first');
   const field=a.fields.find(x=>x[2]==='hash');
   $('f_'+m+'_'+field[0]).value=await sha256(text);
   workspaceMessage('SHA-256 generated from the exact text. Nothing has been sent.');
  }catch(e){workspaceMessage('Cannot calculate digest: '+e.message,true)}
 };
 $('readForm').onsubmit=e=>{e.preventDefault();runRead()};
 $('readMethod').onchange=updateReadFields;
 $('retry').onclick=()=>{const p=loadPending();if(p)follow(p)};
 $('openTransactions').onclick=()=>showPage('transactions');
 $('trackTxForm').onsubmit=e=>{e.preventDefault();const hash=$('trackTxHash').value.trim();if(!HASH_RE.test(hash)){ $('trackTxMessage').textContent='Enter a valid 0x-prefixed, 64-digit hexadecimal hash.';return; }rememberTx(txStorage(),{hash,method:'unknown',status:'pending'});$('trackTxHash').value='';renderHistory();void checkHistoryHash(hash);};
 $('refreshTxHistory').onclick=()=>{void refreshHistoryStatuses()};
 $('transactionList').onclick=e=>{const b=e.target.closest('button[data-check-hash]');if(b)void checkHistoryHash(b.dataset.checkHash)};
 window.ethereum?.on?.('accountsChanged',a=>setAccount(a?.[0]||''));
 window.ethereum?.on?.('chainChanged',()=>workspaceMessage('For signing, select GenLayer Studionet · 61999.',true));
 showPage(location.hash.slice(1)||'overview');
 selectAction(activeAction);updateStudioAccount();
 updateReadFields();
 const pending=loadPending();
 if(pending?.hash){const old=readHistory(txStorage()).find(x=>x.hash.toLowerCase()===pending.hash?.toLowerCase());
  if(!old||['pending','state-unverified'].includes(old.status))rememberTx(txStorage(),{hash:pending.hash,method:pending.method,actor:pending.actor,status:old?.status||'pending'});
  $('retry').hidden=false;notice('Transaction still pending',actionName(pending.method)+' is waiting for a final result.',0,pending.hash,true);}
}
function updateReadFields(){
 const r=project.reads[Number($('readMethod').value)];
 $('readId').parentElement.hidden=!r[3].includes('id');
 $('readActor').parentElement.hidden=!r[3].includes('address');
}

function renderHistory(){
 const records=readHistory(txStorage());
 $('transactionCount').textContent=String(records.length);
 const rows=records.map((t,i)=>{
  const label=displayStatus(t.status);
  const when=Number.isFinite(t.savedAt)?new Date(t.savedAt).toLocaleString():'Time unavailable';
  return '<article class="tx-entry"><div class="tx-entry-top"><span class="tx-entry-number">'+String(i+1).padStart(2,'0')+'</span>'+
   '<div class="tx-entry-meta"><strong>'+esc(t.method==='unknown'?'Tracked transaction':t.method.replaceAll('_',' '))+'</strong><small>'+esc(when)+' · Chain 61999</small></div>'+
   '<span class="tx-status tx-status-'+esc(t.status)+'">'+esc(label)+'</span></div>'+
   '<div class="tx-entry-hash">'+esc(t.hash)+'</div>'+
   (t.actor?'<div class="tx-entry-actor">Signer: '+esc(t.actor)+'</div>':'')+
   '<div class="tx-entry-actions"><a href="'+txPrefix+encodeURIComponent(t.hash)+'" target="_blank" rel="noopener">View on Explorer ↗</a>'+
   '<button type="button" data-check-hash="'+esc(t.hash)+'">Recheck status ↻</button></div></article>';
 }).join('');
 $('transactionList').innerHTML=rows||'<div class="history-empty"><strong>No saved transactions yet</strong><p>Signed transactions will appear here automatically. You can also track an existing public hash below.</p></div>';
}
async function checkHistoryHash(hash){
 if(!HASH_RE.test(hash))return;
 const message=$('trackTxMessage');
 message.textContent='Checking GenLayer status for '+hash.slice(0,10)+'…';
 const refreshButton=$('refreshTxHistory');refreshButton.disabled=true;
 try{
  const response=await fetch('/api/tx?hash='+encodeURIComponent(hash),{cache:'no-store'});
  const tx=await response.json();
  if(!response.ok||!tx.ok)throw Error(tx.error||'Read unavailable');
  const verdict=classifyTx(tx);
  if(verdict==='error'){
   updateTxStatus(txStorage(),hash,'error');
   const pending=loadPending();
   if(pending?.hash?.toLowerCase()===hash.toLowerCase()){clearPending();$('retry').hidden=true}
  }else if(verdict==='success'){
   const pending=loadPending();
   let verified=false;
   if(pending?.hash?.toLowerCase()===hash.toLowerCase()){
    try{verified=Boolean((await readProof(pending)).ok)}catch{}
    if(verified){clearPending();$('retry').hidden=true}
   }
   const previouslyVerified=readHistory(txStorage()).some(r=>r.hash===hash.toLowerCase()&&r.status==='verified');
   updateTxStatus(txStorage(),hash,verified||previouslyVerified?'verified':'finalized-success');
  }else{
   const old=readHistory(txStorage()).find(r=>r.hash===hash.toLowerCase());
   if(!old||['pending','state-unverified'].includes(old.status))
    updateTxStatus(txStorage(),hash,'pending');
  }
  const latest=readHistory(txStorage()).find(r=>r.hash===hash.toLowerCase());
  message.textContent='Chain check: '+(latest?displayStatus(latest.status):'Unknown')+
   (verdict==='pending'?' (not yet finalized or temporarily unavailable)':'')+
   '. A finalized success without matching saved write context is not labeled state-verified.';
 }catch(error){message.textContent='Could not refresh status: '+String(error.message||error)}
 finally{refreshButton.disabled=false;renderHistory()}
}
async function refreshHistoryStatuses(){
 const records=readHistory(txStorage()).slice(0,15);
 if(!records.length){$('trackTxMessage').textContent='No saved transactions to refresh.';return}
 // Limit RPC load and keep controls responsive.
 for(const item of records)await checkHistoryHash(item.hash);
}
function rememberWrite(rec,status='pending'){
 rememberTx(txStorage(),{hash:rec.hash,method:rec.method,actor:rec.actor,status});
 if(!$('transactions').hidden)renderHistory();
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
 $('walletIdentity').textContent=account?'Signer: '+account:'No signer selected';
 updateStudioAccount(true);
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
 if(old){$('retry').hidden=false;notice('Transaction still pending',actionName(old.method)+' must be resolved before signing another request.',0,old.hash,true);return}
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
  notice('Confirm '+actionName(action.method),'Approve the transaction in your wallet. Nothing is recorded until the network confirms it.',0,'',true);
  const hash=await client.writeContract({address:config[action.scope],functionName:action.method,args,value:0n});
  if(!/^0x[a-f0-9]{64}$/i.test(hash||''))throw Error('Wallet did not return valid transaction hash');
  rec.hash=hash;savePending(rec);rememberWrite(rec);$('retry').hidden=false;
  notice(actionName(action.method)+' submitted','Signed transaction received. Waiting for GenLayer finality…',0,hash,true);
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
 notice(actionName(rec.method)+' is processing','GenLayer is confirming this transaction. Please do not sign it again.',0,rec.hash,true);
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
    rememberWrite(rec,'error');clearPending();$('retry').hidden=true;
    notice(actionName(rec.method)+' rejected','Transaction finalized with an error (rollback). No state change was claimed.',0,rec.hash,false,'error');
    return;
   }
   if(state==='success'){
    notice(actionName(rec.method)+' finalized','GenVM SUCCESS. Checking the exact stored result…',0,rec.hash,true);
    for(let n=0;n<9;n++){
     try{
      const proof=await readProof(rec);
      if(proof.ok){
       rememberWrite(rec,'verified');clearPending();$('retry').hidden=true;
       const result=rec.method==='assess_attempt'?('Verdict: '+String(proof.value?.verdict||'ASSESSED')):
        (Number.isSafeInteger(proof.value?.id)?('#'+proof.value.id+' recorded'):'On-chain state updated');
       notice(actionName(rec.method)+' successful',result+' · Verified at LATEST_FINAL.',0,rec.hash,false,'success');
       return;
      }
     }catch{}
     await new Promise(r=>setTimeout(r,2500));
    }
    rememberWrite(rec,'state-unverified');
    notice(actionName(rec.method)+' needs verification','GenVM SUCCESS, but final stored state could not yet be matched. Use Recheck; do not sign again.',0,rec.hash,false,'warning');
    return;
   }
   await new Promise(r=>setTimeout(r,3200));
  }
  rememberWrite(rec,'pending');
  notice(actionName(rec.method)+' still pending','Transaction is saved. Use Recheck in the transaction panel; do not submit again.',0,rec.hash,false,'warning');
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
 await loadIssuer();
 try{const wallets=await window.ethereum?.request?.({method:'eth_accounts'});if(ADDRESS.test(wallets?.[0]||''))setAccount(wallets[0]);}catch{}
 const pending=loadPending();
 if(pending?.hash&&config?.configured)void follow(pending);
}
init();
