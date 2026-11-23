// ===== Ситиус · реальная отправка заявок (звонок / заказ услуги) → Apps Script → Telegram-бот + почта владельца
// LEADS_URL — адрес веб-приложения Apps Script (…/macros/s/…/exec). Пока пустой — честный режим «не отправлено».
const LEADS_URL='https://script.google.com/macros/s/AKfycbzA8ot_zMJwTqcMp8YwNQ7MOIRmHcXO5e39qAmmSduxfCwik9ikWuVX_DCyd6JNljEj/exec';
const LEADS_Q='sitius-leadq';
// Возвращает Promise<{ok:boolean,id?:string}>. Запрос — text/plain, чтобы не было CORS preflight.
function sendLead(lead){
 const body=Object.assign({sentAt:new Date().toISOString(),page:typeof cur!=='undefined'?cur:'',ua:navigator.userAgent,app:'app-test'},lead);
 if(!LEADS_URL)return Promise.resolve({ok:false,err:'no_url'});
 const ctl=typeof AbortController!=='undefined'?new AbortController():null,tm=setTimeout(()=>ctl&&ctl.abort(),15000);
 return fetch(LEADS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body),redirect:'follow',signal:ctl&&ctl.signal})
  .then(r=>r.ok?r.json():{ok:false,err:'http '+r.status}).catch(e=>({ok:false,err:String(e)})).then(res=>{clearTimeout(tm);
   if(!res.ok)leadQueue(body);return res})}
// Неотправленные заявки держим на устройстве и пробуем ещё раз при следующем открытии
function leadQueue(b){try{const q=JSON.parse(localStorage.getItem(LEADS_Q)||'[]');q.push(b);localStorage.setItem(LEADS_Q,JSON.stringify(q.slice(-10)))}catch(e){}}
function leadRetry(){if(!LEADS_URL)return;let q=[];try{q=JSON.parse(localStorage.getItem(LEADS_Q)||'[]')}catch(e){}if(!q.length)return;localStorage.removeItem(LEADS_Q);
 q.forEach(b=>fetch(LEADS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(Object.assign(b,{retry:1}))}).then(r=>r.json()).then(r=>{if(!r.ok)leadQueue(b)}).catch(()=>leadQueue(b)))}
setTimeout(leadRetry,3000);
// Запасной путь, если отправка не удалась: письмо и звонок напрямую (текст заявки уже вставлен)
function leadFallbackHtml(text){const m='mailto:citius.solutions@yandex.ru?subject='+encodeURIComponent('Заявка из приложения')+'&body='+encodeURIComponent(text);
 return `<div class="hint err" role="alert">Не получилось отправить заявку через интернет. Позвоните нам: <a href="tel:+79215725085">+7 921 572-50-85</a> или <a href="${m}">отправьте письмо</a> — текст заявки уже подставлен.</div>`}
