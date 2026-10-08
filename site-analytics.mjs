// Only explicit consent enables the counter. Form text is never sent to analytics.
const events=new Set(['product_view','catalog_filter','quote_product_added','quote_start','quote_submitted','messenger_open','phone_click','email_click']);
let counterId=null,consent=false;
const consentKey='alidika-analytics-consent-v2';
const sourceKey='alidika-request-source-v1';
const sourceFields=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','yclid'];
let requestSource={};
export function requestAttribution(){
  if(!consent)return {};
  try{
    const url=new URL(location.href),tags={};
    for(const key of sourceFields){const value=url.searchParams.get(key);if(value&&value.length<=160&&!/[\u0000-\u001f<>]/.test(value))tags[key]=value}
    if(Object.keys(tags).length){requestSource={...tags,landing_path:url.pathname};try{sessionStorage.setItem(sourceKey,JSON.stringify(requestSource))}catch{}}
    else if(!Object.keys(requestSource).length){try{requestSource=JSON.parse(sessionStorage.getItem(sourceKey)||'{}')}catch{}}
  }catch{}
  return Object.fromEntries(Object.entries(requestSource).filter(([key,value])=>[...sourceFields,'landing_path'].includes(key)&&typeof value==='string'&&value.length<=200&&!/[\u0000-\u001f<>]/.test(value)));
}
export function safeParams(params={}){
  return Object.fromEntries(Object.entries(params).filter(([key,value])=>['product_id','category','messenger'].includes(key)&&typeof value==='string'&&/^[a-z0-9_-]{1,80}$/.test(value)));
}
export function track(event,params={},callback){
  let done=false;
  const finish=()=>{if(!done){done=true;callback?.()}};
  if(!events.has(event)||!consent||!counterId){finish();return}
  window.ym(counterId,'reachGoal',event,safeParams(params),finish);
  if(callback)setTimeout(finish,350);
}
function start(id){
  counterId=id;consent=true;
  requestAttribution();
  window.ym=window.ym||function(){(window.ym.a=window.ym.a||[]).push(arguments)};
  window.ym.l=Date.now();
  const script=document.createElement('script');script.async=true;script.src='https://mc.yandex.ru/metrika/tag.js';document.head.append(script);
  window.ym(id,'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});
}
async function init(){
  const response=await fetch('/analytics-config.json');if(!response.ok)return;
  const config=await response.json(),id=config.metrikaId;
  if(!Number.isSafeInteger(id)||id<=0||!config.allowedHosts.includes(location.hostname))return;
  const settings=document.createElement('button');settings.type='button';settings.className='analytics-settings';settings.textContent='Настройки аналитики';
  settings.addEventListener('click',()=>{try{localStorage.removeItem(consentKey);sessionStorage.removeItem(sourceKey)}catch{};location.reload()});
  document.querySelector('footer .wrap')?.append(settings);
  let saved;try{saved=localStorage.getItem(consentKey)}catch{}
  if(saved==='accepted'){start(id);return}
  if(saved==='declined')return;
  const banner=document.createElement('aside');banner.className='analytics-consent';banner.setAttribute('aria-label','Настройки аналитики');
  banner.innerHTML='<p>Разрешить Яндекс Метрику и Вебвизор? Они собирают статистику посещений, источников, кликов и прокрутки, записывают действия на странице. Введённые контакты и комментарий скрыты. <a href="/cookies/">Cookies и аналитика</a> · <a href="/privacy/">Политика обработки данных</a></p><div><button type="button" data-analytics-accept>Разрешить аналитику</button><button type="button" data-analytics-decline>Без аналитики</button></div>';
  banner.addEventListener('click',event=>{const accepted=event.target.closest('[data-analytics-accept]'),declined=event.target.closest('[data-analytics-decline]');if(!accepted&&!declined)return;try{localStorage.setItem(consentKey,accepted?'accepted':'declined')}catch{};if(accepted)start(id);banner.remove()});
  document.body.append(banner);
}
if(typeof window!=='undefined')init().catch(()=>{});
