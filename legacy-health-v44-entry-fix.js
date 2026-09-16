(function(){
  'use strict';
  if(typeof render!=='function')return;
  const DISPLAY_VER='v44';
  const baseRender=render;

  function patchVersion(){
    document.querySelectorAll('.card .hint').forEach(el=>{
      if(!/버전\s*v(?:24|39|40|41|42|43)\b/.test(el.textContent||''))return;
      el.innerHTML=el.innerHTML
        .replace(/버전\s*<b([^>]*)>v(?:24|39|40|41|42|43)<\/b>/,`버전 <b$1>${DISPLAY_VER}</b>`)
        .replace(/버전\s*v(?:24|39|40|41|42|43)\b/,`버전 ${DISPLAY_VER}`);
    });
  }

  function addHealthEntry(){
    if(typeof tab==='undefined'||tab!=='shop'||window.__mgStage!=='home')return;
    if(document.getElementById('healthHomeEntry'))return;
    const main=document.getElementById('main')||document.querySelector('main');
    if(!main)return;
    const wrap=document.createElement('div');
    wrap.id='healthHomeEntry';
    wrap.innerHTML=`<div class="sec"><h2>건강관리</h2><span class="more">검진·접종 일정</span></div><button class="card health-entry" data-health-open="1" style="width:100%;text-align:left;border:1.5px solid #dfeee7;background:linear-gradient(135deg,#f4fcf8,#fff)"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><div><div style="display:flex;align-items:center;gap:9px;font-weight:900"><span style="width:34px;height:34px;border-radius:12px;background:var(--mint-s);display:grid;place-items:center;font-size:18px">🩺</span><span>건강관리</span></div><div class="hint" style="margin-top:7px">건강검진·예방접종 일정과 완료 기록을 관리해요.</div></div><span class="more">검진·접종 ›</span></div></button>`;
    const nav=[...main.querySelectorAll('.card')].find(x=>x.querySelector('[data-mg="stock"]'));
    if(nav)nav.insertAdjacentElement('afterend',wrap);else main.prepend(wrap);
  }

  function apply(){addHealthEntry();patchVersion()}
  render=function(keep){const r=baseRender(keep);apply();setTimeout(apply,0);setTimeout(apply,120);return r};

  window.addEventListener('click',e=>{
    const v=e.target.closest?.('[data-a="checkver"]');if(!v)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();patchVersion();
    if(typeof toast==='function')toast(`현재 앱 버전 ${DISPLAY_VER}`);
  },true);

  let scheduled=false;
  const obs=new MutationObserver(()=>{
    if(scheduled)return;scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;apply()});
  });
  obs.observe(document.body,{childList:true,subtree:true});
  try{apply()}catch(e){}
})();
