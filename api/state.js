import {createClient} from 'genlayer-stable';
import {studionet} from 'genlayer-stable/chains';
import {TransactionHashVariant} from 'genlayer-stable/types';
import {readConfig, METHODS} from '../lib/config.js';

const client=createClient({chain:studionet});
const ADDRESS=/^0x[0-9a-fA-F]{40}$/;
const valid=config=>ADDRESS.test(config.first)&&ADDRESS.test(config.second)&&config.first.toLowerCase()!==config.second.toLowerCase();
const clean=v=>JSON.parse(JSON.stringify(v,(_,x)=>typeof x==='bigint'?x.toString():x));

export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({ok:false,error:'GET only'});
 const config=readConfig(process.env);
 if(req.query?.op==='config')return res.status(200).json({
  ok:true,configured:valid(config),chainId:61999,
  first:valid(config)?config.first:'',second:valid(config)?config.second:''
 });
 if(!valid(config))return res.status(503).json({ok:false,error:'Contracts not configured. Deploy and set the two addresses.'});
 const scope=req.query?.scope, method=req.query?.method;
 const types=METHODS[scope]?.[method];
 if(!types)return res.status(400).json({ok:false,error:'Method is not in read allowlist'});
 const args=[];
 for(let i=0;i<types.length;i++){
  const value=req.query?.['a'+i];
  if(typeof value!=='string')return res.status(400).json({ok:false,error:'Missing argument '+i});
  if(types[i]==='address'){
   if(!ADDRESS.test(value))return res.status(400).json({ok:false,error:'Invalid wallet'});
   args.push(value);
  }else{
   if(!/^[1-9][0-9]{0,7}$/.test(value)||!Number.isSafeInteger(Number(value)))
     return res.status(400).json({ok:false,error:'Invalid positive ID'});
   args.push(Number(value));
  }
 }
 if(Object.keys(req.query||{}).some(key=>/^a\d+$/.test(key)&&Number(key.slice(1))>=types.length))
  return res.status(400).json({ok:false,error:'Unexpected argument'});
 try{
  const value=await client.readContract({address:config[scope],functionName:method,args,
   transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
  return res.status(200).json({ok:true,value:clean(value),finality:'LATEST_FINAL'});
 }catch(e){return res.status(502).json({ok:false,error:'GenLayer read failed: '+String(e?.message||e).slice(0,190)})}
}
