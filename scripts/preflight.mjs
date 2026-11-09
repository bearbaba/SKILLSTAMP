import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createClient} from 'genlayer-stable';
import {studionet} from 'genlayer-stable/chains';
import {TransactionHashVariant} from 'genlayer-stable/types';
import {readConfig} from '../lib/config.js';
const c=createClient({chain:studionet});
const cfg=readConfig(process.env);
const paths=['FIRST_SOURCE_PATH','SECOND_SOURCE_PATH'];
const local=[process.env[paths[0]],process.env[paths[1]]];
const normalize=s=>s.replace(/\r\n/g,'\n').split('\n').map(x=>x.replace(/\s+$/,'')).join('\n').trimEnd();
const hash=s=>createHash('sha256').update(s,'utf8').digest('hex');
if(!/^0x[a-fA-F0-9]{40}$/.test(cfg.first)||!/^0x[a-fA-F0-9]{40}$/.test(cfg.second)||
cfg.first.toLowerCase()===cfg.second.toLowerCase()){
 console.error('NOT DEPLOYED: distinct addresses must be configured before preflight');
 process.exit(2);
}
for(const [label,address,path] of [['first',cfg.first,local[0]],['second',cfg.second,local[1]]]){
 try{
  if(!path)throw Error('source path not set');
  const source=readFileSync(path,'utf8');
  const deployed=await c.getContractCode(address);
  if(typeof deployed!=='string'||normalize(deployed)!==normalize(source))
   throw Error('Source mismatch or deployed code unavailable');
  const schema=await c.getContractSchema(address);
  if(!Object.keys(schema?.methods||{}).length)throw Error('Missing contract schema');
  const raw=await c.readContract({address,functionName:'stats',args:[],
   transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
  const stats=typeof raw==='string'?JSON.parse(raw):raw;
  if(label==='second'&&String(stats?.[process.env.SECOND_LINK_FIELD]||'').toLowerCase()!==cfg.first.toLowerCase())
   throw Error('Second contract constructor link mismatch');
  console.log(label,'SOURCE_MATCH',true,'SHA256',hash(source),'METHODS',Object.keys(schema.methods),
   'LATEST_FINAL',stats);
 }catch(e){console.error(label,'FAILED',e?.message||e);process.exitCode=1}
}
