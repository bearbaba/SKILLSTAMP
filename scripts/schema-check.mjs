import {readFileSync} from 'node:fs';
import {createClient} from 'genlayer-stable';
import {studionet} from 'genlayer-stable/chains';
const client=createClient({chain:studionet});
const contracts=[["ChallengeBoard","contracts/challenge_board.py",["create_challenge","submit_evidence","assess_attempt","close_challenge","credential_permission","get_challenge","get_attempt","attempt_for","stats"]],["CredentialRegistry","contracts/credential_registry.py",["issue_credential","revoke_credential","get_credential","credential_for","stats"]]];
for(const [name,path,methods] of contracts){
 try{
  const code=readFileSync(path,'utf8');
  if(!code.startsWith('# { "Depends": "py-genlayer:'))throw Error('Invalid runner pin');
  const schema=await client.getContractSchemaForCode(code);
  if(!schema||!schema.methods)throw Error('Schema unavailable');
  const missing=methods.filter(m=>!Object.hasOwn(schema.methods,m));
  if(missing.length)throw Error('Missing methods: '+missing.join(', '));
  console.log('UNSIGNED_SCHEMA_PASS',name,JSON.stringify({constructor:schema.ctor,methods:Object.keys(schema.methods)}));
 }catch(e){console.error('UNSIGNED_SCHEMA_FAIL',name,String(e.message||e));process.exitCode=1}
}
