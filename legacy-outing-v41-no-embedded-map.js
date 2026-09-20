(function(){
  'use strict';
  if(typeof render!=='function')return;

  const DISPLAY_VER=window.__DOJUN_RELEASE?.version||'v67';
  const baseRender=render;

  function removeEmbeddedMaps(){
    document.getElementById('outingMapFallbackTools')?.remove();
    document.getElementById('outingMap')?.remove();
    document.querySelectorAll('.outing-v37-map-note').forEach(el=>el.remove());

    document.querySelectorAll('#outingModal [data-outing="picker"]').forEach(el=>el.remove());
    document.querySelectorAll('#outingModal .outing-pick').forEach(el=>el.remove());
    document.querySelectorAll('#outingModal .outing-map-note').forEach(el=>el.remove());
  }

  function patchVersion(){
    document.querySelectorAll('.card .hint').forEach(el=>{
      if(!/버전\s*v(?:24|39|40)\b/.test(el.textContent||''))return;
      el.innerHTML=el.innerHTML
        .replace(/버전\s*<b([^>]*)>v(?:24|39|40)<\/b>/,`버전 <b$1>${DISPLAY_VER}</b>`)
        .replace(/버전\s*v(?:24|39|40)\b/,`버전 ${DISPLAY_VER}`);
    });
  }

  render=function(keep){
    const r=baseRender(keep);
    removeEmbeddedMaps();
    patchVersion();
    setTimeout(()=>{removeEmbeddedMaps();patchVersion()},0);
    setTimeout(()=>{removeEmbeddedMaps();patchVersion()},120);
    return r;
  };

  window.addEventListener('click',e=>{
    const ver=e.target.closest?.('[data-a="checkver"]');
    if(!ver)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    patchVersion();
    if(typeof toast==='function')toast(`현재 앱 버전 ${DISPLAY_VER}`);
  },true);

  let scheduled=false;
  const obs=new MutationObserver(()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      removeEmbeddedMaps();
      patchVersion();
    });
  });
  obs.observe(document.body,{childList:true,subtree:true});

  try{removeEmbeddedMaps();patchVersion()}catch(e){}
})();
