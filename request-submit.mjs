import {encryptRequest} from './request-encryption.mjs';
export async function submitRequest(endpoint,payload,request=fetch,publicKey=null){
  if(!endpoint)throw Error('NOT_CONFIGURED');
  const url=new URL(endpoint,location.origin);
  if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['127.0.0.1','localhost'].includes(url.hostname)))throw Error('INVALID_ENDPOINT');
  const body=publicKey?await encryptRequest(payload,publicKey):payload;
  const response=await request(url.href,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error(response.status===429?'RATE_LIMIT':'NOT_ACCEPTED');
  const result=await response.json();
  if(result.accepted!==true||result.request_id!==payload.request_id)throw Error('NOT_ACCEPTED');
  return result;
}
