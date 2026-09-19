const b64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes)));
export async function encryptRequest(payload,publicKey){
  const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt']);
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const recipient=await crypto.subtle.importKey('jwk',publicKey,{name:'RSA-OAEP',hash:'SHA-256'},false,['encrypt']);
  const wrapped=await crypto.subtle.encrypt({name:'RSA-OAEP'},recipient,await crypto.subtle.exportKey('raw',key));
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(payload)));
  return {version:1,key:b64(wrapped),iv:b64(iv),ciphertext:b64(ciphertext)};
}
