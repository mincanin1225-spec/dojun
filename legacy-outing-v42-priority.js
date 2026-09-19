(function(){
  'use strict';
  if(typeof render!=='function')return;

  const DISPLAY_VER=window.__DOJUN_RELEASE?.version||'v58';
  const baseRender=render;
  const PRIORITY={
    '가고싶음':0,
    '추천':0,
    '재방문':1,
    '다녀옴':2
  };

  function sortOutingCards(){
    if(typeof tab!=='undefined'&&tab!=='outing')return;
    const cards=[...document.querySelectorAll('article.outing-card[data-outing-card]')];
    if(cards.length<2)return;
    const byId=new Map((window.__outingPlaces||[]).map((p,i)=>[String(p.id),{p,i}]));
    cards.sort((a,b)=>{
      const aa=byId.get(String(a.dataset.outingCard||''));
      const bb=byId.get(String(b.dataset.outingCard||''));
      const ap=PRIORITY[aa?.p?.status]??9;
      const bp=PRIORITY[bb?.p?.status]??9;
      if(ap!==bp)return ap-bp;
      return (aa?.i??9999)-(bb?.i??9999);
    });
    const parent=cards[0].parentNode;
    if(!parent)return;
    cards.forEach(card=>parent.appendChild(card));
  }

  function patchVersion(){
    document.querySelectorAll('.card .hint').forEach(el=>{
      if(!/버전\s*v(?:24|39|40|41)\b/.test(el.textContent||''))return;
      el.innerHTML=el.innerHTML
        .replace(/버전\s*<b([^>]*)>v(?:24|39|40|41)<\/b>/,`버전 <b$1>${DISPLAY_VER}</b>`)
        .replace(/버전\s*v(?:24|39|40|41)\b/,`버전 ${DISPLAY_VER}`);
    });
  }

  function apply(){
    sortOutingCards();
    patchVersion();
  }

  render=function(keep){
    const r=baseRender(keep);
    apply();
    setTimeout(apply,0);
    setTimeout(apply,120);
    return r;
  };

  document.addEventListener('click',e=>{
    const ver=e.target.closest?.('[data-a="checkver"]');
    if(!ver)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    patchVersion();
    if(typeof toast==='function')toast(`현재 앱 버전 ${DISPLAY_VER}`);
  },true);

  let scheduled=false;
  const obs=new MutationObserver(()=>{
    if(scheduled||typeof tab==='undefined'||tab!=='outing')return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;apply()});
  });
  obs.observe(document.body,{childList:true,subtree:true});

  try{apply()}catch(e){}
})();
