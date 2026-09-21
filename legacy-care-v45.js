(function(){
  'use strict';
  if(typeof render!=='function'||typeof bar!=='function')return;

  const DISPLAY_VER=window.__DOJUN_RELEASE?.version||'v68';
  const baseRender=render;
  let careStage='home';
  let healthActive=false;

  function mainEl(){return document.getElementById('main')||document.querySelector('main')}

  function injectCss(){
    if(document.getElementById('care-v45-css'))return;
    const s=document.createElement('style');
    s.id='care-v45-css';
    s.textContent=`
      #healthHomeEntry{display:none!important}
      .care-hero{background:linear-gradient(135deg,var(--butter-s),#fff);border:1px solid #f3e7bd}
      .care-hero h2{font-size:20px}.care-hero p{margin:5px 0 0;font-size:12.5px;color:var(--ink2)}
      .care-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
      .care-card{display:block;width:100%;text-align:left;background:#fff;border:1.5px solid var(--line);border-radius:20px;padding:16px;box-shadow:var(--sh)}
      .care-card .ico{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;font-size:21px;margin-bottom:11px}
      .care-card.outing .ico{background:var(--mint-s)}.care-card.health .ico{background:var(--peach-s)}
      .care-card b{display:block;font-size:15px}.care-card span{display:block;font-size:11.5px;color:var(--muted);line-height:1.5;margin-top:5px}
      .care-back{margin-bottom:12px}
      @media(max-width:360px){.care-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  function renameOutingTab(){
    const b=document.querySelector('#tabbar [data-a="tab:outing"]');
    if(!b)return;
    const texts=[...b.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE);
    if(texts.length)texts[texts.length-1].textContent='육아';
    else b.insertAdjacentText('beforeend','육아');
    b.setAttribute('aria-label','육아');
  }

  function selectCareTab(){
    const nav=document.getElementById('tabbar');if(!nav)return;
    nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.a==='tab:outing')));
  }

  function patchVersion(){
    document.querySelectorAll('.card .hint').forEach(el=>{
      if(!/버전\s*v(?:24|39|40|41|42|43|44)\b/.test(el.textContent||''))return;
      el.innerHTML=el.innerHTML
        .replace(/버전\s*<b([^>]*)>v(?:24|39|40|41|42|43|44)<\/b>/,`버전 <b$1>${DISPLAY_VER}</b>`)
        .replace(/버전\s*v(?:24|39|40|41|42|43|44)\b/,`버전 ${DISPLAY_VER}`);
    });
  }

  function hubHtml(){
    return `<div class="card care-hero"><h2>도준이 육아</h2><p>외출 장소와 건강 일정을 한 곳에서 관리해요.</p></div>
      <div class="sec"><h2>육아 메뉴</h2><span class="more">필요할 때 골라서</span></div>
      <div class="care-grid">
        <button class="care-card outing" data-care="outing"><span class="ico">📍</span><b>외출</b><span>가고 싶은 곳, 방문기록, 도준이 반응을 관리해요.</span></button>
        <button class="care-card health" data-care="health"><span class="ico">🩺</span><b>건강관리</b><span>건강검진과 예방접종 일정·완료 기록을 관리해요.</span></button>
      </div>`;
  }

  function renderHub(keep){
    bar();injectCss();
    const m=mainEl();if(!m)return;
    m.innerHTML=hubHtml();
    renameOutingTab();selectCareTab();patchVersion();
    if(!keep)window.scrollTo({top:0});
  }

  function addOutingBack(){
    if(typeof tab==='undefined'||tab!=='outing'||careStage!=='outing')return;
    const m=mainEl();if(!m||document.getElementById('careOutingBack'))return;
    const w=document.createElement('div');w.id='careOutingBack';w.className='card care-back';
    w.style.padding='10px';
    w.innerHTML='<button class="more" data-care="home">‹ 육아로 돌아가기</button>';
    m.prepend(w);
  }

  function patchHealthBack(){
    if(!healthActive)return;
    const b=document.querySelector('[data-health-back]');if(b)b.textContent='‹ 육아로 돌아가기';
    selectCareTab();
  }

  function apply(){
    injectCss();renameOutingTab();patchVersion();
    if(healthActive)patchHealthBack();
    if(typeof tab!=='undefined'&&tab==='outing'&&careStage==='outing')addOutingBack();
  }

  render=function(keep){
    if(typeof tab!=='undefined'&&tab==='outing'&&careStage==='home'){
      healthActive=false;
      renderHub(keep);
      return;
    }
    const r=baseRender(keep);
    apply();
    setTimeout(apply,0);setTimeout(apply,120);
    return r;
  };

  document.addEventListener('click',e=>{
    const tabBtn=e.target.closest?.('[data-a^="tab:"]');
    if(tabBtn){
      if(tabBtn.dataset.a==='tab:outing'){
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
        healthActive=false;careStage='home';
        if(typeof tab!=='undefined')tab='outing';
        if(typeof window.__mgStage!=='undefined')window.__mgStage='home';
        render();return;
      }
      if(healthActive){healthActive=false;careStage='home';if(typeof window.__mgStage!=='undefined')window.__mgStage='home'}
    }

    const c=e.target.closest?.('[data-care]');
    if(c){
      const dest=c.dataset.care;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      if(dest==='home'){
        healthActive=false;careStage='home';if(typeof tab!=='undefined')tab='outing';if(typeof window.__mgStage!=='undefined')window.__mgStage='home';render();return;
      }
      if(dest==='outing'){
        healthActive=false;careStage='outing';if(typeof tab!=='undefined')tab='outing';render();return;
      }
      if(dest==='health'){
        careStage='health';healthActive=true;if(typeof tab!=='undefined')tab='shop';window.__mgStage='health';render();return;
      }
    }

    const hb=e.target.closest?.('[data-health-back]');
    if(hb&&healthActive){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      healthActive=false;careStage='home';if(typeof tab!=='undefined')tab='outing';window.__mgStage='home';render();return;
    }
  },true);

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
  try{apply()}catch(e){}
})();
