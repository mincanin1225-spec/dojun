(function(){
  'use strict';
  const APP_NAME=window.__DOJUN_RELEASE?.name||'도준이키우기';
  const DISPLAY_VER=window.__DOJUN_RELEASE?.version||'v66';

  function patchBrand(){
    if(document.title!==APP_NAME)document.title=APP_NAME;
    const h=document.querySelector('.appbar h1');if(h&&h.textContent!==APP_NAME)h.textContent=APP_NAME;
    const a=document.querySelector('meta[name="apple-mobile-web-app-title"]');if(a&&a.getAttribute('content')!==APP_NAME)a.setAttribute('content',APP_NAME);
  }

  function injectCss(){
    if(document.getElementById('ui-v47-css'))return;
    const s=document.createElement('style');
    s.id='ui-v47-css';
    s.textContent=`
      .outing-card{padding:11px!important;margin:6px 0!important;border-radius:16px!important}
      .outing-card .top{gap:7px!important}
      .outing-card h3{font-size:14px!important;line-height:1.3!important}
      .outing-card .addr{margin-top:2px!important;line-height:1.35!important}
      .outing-tags{margin-top:6px!important;gap:4px!important}
      .outing-tag{padding:2px 7px!important;font-size:10px!important}
      .outing-card .hint{margin-top:5px!important}
      .outing-actions{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:5px!important;margin-top:7px!important}
      .outing-actions button{min-height:32px!important;padding:5px 4px!important;font-size:10.5px!important;line-height:1.15!important;border-radius:10px!important}
      .outing-actions button.pri{grid-column:auto!important}
    `;
    document.head.appendChild(s);
  }

  function patchVersion(){
    document.querySelectorAll('.card .hint').forEach(el=>{
      if(!/버전\s*v(?:24|39|40|41|42|43|44|45|46)\b/.test(el.textContent||''))return;
      el.innerHTML=el.innerHTML
        .replace(/버전\s*<b([^>]*)>v(?:24|39|40|41|42|43|44|45|46)<\/b>/,`버전 <b$1>${DISPLAY_VER}</b>`)
        .replace(/버전\s*v(?:24|39|40|41|42|43|44|45|46)\b/,`버전 ${DISPLAY_VER}`);
    });
  }

  if(typeof bar==='function'){
    const baseBar=bar;
    bar=function(){const r=baseBar.apply(this,arguments);patchBrand();return r};
  }

  function apply(){injectCss();patchBrand();patchVersion()}
  apply();
  setTimeout(apply,0);setTimeout(apply,120);

  window.addEventListener('click',e=>{
    const v=e.target.closest?.('[data-a="checkver"]');if(!v)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    patchVersion();if(typeof toast==='function')toast(`현재 앱 버전 ${DISPLAY_VER}`);
  },true);

  let scheduled=false;
  const obs=new MutationObserver(()=>{
    if(scheduled)return;scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;apply()});
  });
  obs.observe(document.body,{childList:true,subtree:true});
})();
