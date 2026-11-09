import {createClient} from 'genlayer-stable';
import {studionet} from 'genlayer-stable/chains';
const client=createClient({chain:studionet});
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({ok:false,error:'GET only'});
 const hash=req.query?.hash;
 if(typeof hash!=='string'||!/^0x[a-fA-F0-9]{64}$/.test(hash))
  return res.status(400).json({ok:false,error:'Invalid transaction hash'});
 try{
  const t=await client.getTransaction({hash});
  if(!t)return res.status(200).json({ok:true,status:'UNKNOWN',execution:'UNKNOWN'});
  const c=t.consensus_data??t.consensusData??{};
  const r=c.leader_receipt??c.leaderReceipt;
  const receipts=Array.isArray(r)?r:r?[r]:[];
  const results=receipts.map(x=>String(x.execution_result??x.executionResult??'UNKNOWN').toUpperCase());
  const explicit=String(t.txExecutionResultName??'').toUpperCase();
  let execution='UNKNOWN';
  if(['FINISHED_WITH_RETURN','SUCCESS'].includes(explicit))execution='SUCCESS';
  else if(['FINISHED_WITH_ERROR','ERROR','REVERT'].includes(explicit))execution='ERROR';
  else if(results.length&&results.every(x=>x==='SUCCESS'))execution='SUCCESS';
  else if(results.some(x=>['ERROR','FAILURE','FINISHED_WITH_ERROR'].includes(x)))execution='ERROR';
  return res.status(200).json({ok:true,hash,
    status:String(t.statusName??t.status_name??t.status??'UNKNOWN').toUpperCase(),execution});
 }catch(e){return res.status(502).json({ok:false,error:'Transaction query failed: '+String(e?.message||e).slice(0,190)})}
}
