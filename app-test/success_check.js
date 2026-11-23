// ===== Ситиус · экран успеха с анимированной галочкой (переиспользуемый: Апп, опрос)
// Использование: sitiusSuccess({title:'Заявка принята', text:'Мы скоро вам перезвоним.', btn:'Вернуться', onClose:fn})
// Самодостаточный: сам добавляет стили; тёмная/светлая тема по [data-theme]; prefers-reduced-motion — без анимации.
(function(){if(window.sitiusSuccess)return;
 const css=`.sx-ov{position:fixed;inset:0;z-index:99990;display:flex;align-items:center;justify-content:center;background:rgba(20,32,52,.62);padding:18px;animation:sxfade .25s ease-out}
.sx-card{max-width:360px;width:100%;background:#1e2f4a;color:#f7f3ea;border:1px solid #c9a46a;border-radius:16px;padding:22px 20px 18px;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.35);font-family:Montserrat,system-ui,sans-serif}
[data-theme=light] .sx-card{background:#fbf8f1;color:#243248}
.sx-card svg{width:92px;height:92px;display:block;margin:0 auto 10px}
.sx-c{fill:none;stroke:#c9a46a;stroke-width:3.5;stroke-linecap:round;stroke-dasharray:1.05;stroke-dashoffset:1.05;animation:sxdraw .6s ease-out forwards}
.sx-k{fill:none;stroke:#c9a46a;stroke-width:5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;animation:sxdraw .45s ease-out .55s forwards}
.sx-t{font-family:'Playfair Display',Georgia,serif;font-size:21px;font-weight:700;margin:2px 0 6px}
.sx-x{font-size:14.5px;line-height:1.45;margin:0 0 14px}
.sx-b{width:100%;padding:11px;border-radius:10px;border:0;background:linear-gradient(90deg,#d4b57e,#f0dcb0 50%,#c9a46a);color:#1e2f4a;font:700 15px Montserrat,system-ui,sans-serif;cursor:pointer}
.sx-b:focus-visible{outline:2px solid #f0dcb0;outline-offset:2px}
@keyframes sxdraw{to{stroke-dashoffset:0}}@keyframes sxfade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.sx-ov{animation:none}.sx-c,.sx-k{animation:none;stroke-dashoffset:0}}`;
 function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
 window.sitiusSuccess=function(o){o=o||{};if(!document.getElementById('sx-css')){const st=document.createElement('style');st.id='sx-css';st.textContent=css;document.head.appendChild(st)}
  const old=document.getElementById('sx-ov');if(old)old.remove();
  const ov=document.createElement('div');ov.className='sx-ov';ov.id='sx-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-labelledby','sx-t');
  ov.innerHTML=`<div class="sx-card"><svg viewBox="0 0 52 52" aria-hidden="true"><circle class="sx-c" pathLength="1" cx="26" cy="26" r="23"/><path class="sx-k" pathLength="1" d="M15 27 L23 35 L38 18"/></svg>
  <div class="sx-t" id="sx-t">${esc(o.title||'Заявка принята')}</div><div class="sx-x" role="status">${esc(o.text||'')}</div><button type="button" class="sx-b">${esc(o.btn||'Вернуться')}</button></div>`;
  const close=()=>{ov.remove();document.removeEventListener('keydown',kd);if(typeof o.onClose==='function')o.onClose()};const kd=e=>{if(e.key==='Escape')close()};
  ov.querySelector('.sx-b').onclick=close;ov.addEventListener('click',e=>{if(e.target===ov)close()});document.addEventListener('keydown',kd);
  document.body.appendChild(ov);setTimeout(()=>{const b=ov.querySelector('.sx-b');b&&b.focus()},50);return ov}})();
