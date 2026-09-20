(function(){
  'use strict';
  if(typeof render!=='function')return;

  const DISPLAY_VER=window.__DOJUN_RELEASE?.version||'v60';
  const NAVER_HOME='https://map.naver.com/';
  const NAVER_SAVED='https://naver.me/xfboSqg8';
  const baseRender=render;

  function openExternal(url){
    try{
      const w=window.open(url,'_blank','noopener,noreferrer');
      if(w)return;
    }catch(e){}
    try{window.top.location.href=url}catch(e){location.href=url}
  }

  function patchVersion(){
    document.querySelectorAll('.card .hint').forEach(el=>{
      if(!/버전\s*v24\b/.test(el.textContent||''))return;
      el.innerHTML=el.innerHTML.replace(/버전\s*<b([^>]*)>v24<\/b>/,`버전 <b$1>${DISPLAY_VER}</b>`).replace(/버전\s*v24\b/,`버전 ${DISPLAY_VER}`);
    });
  }

  function placeForId(id){
    try{return (window.__outingPlaces||[]).find(x=>String(x.id)===String(id))||null}catch(e){return null}
  }
  function naverSearch(p){
    const q=[p?.name,p?.address].filter(Boolean).join(' ').trim();
    return q?`https://map.naver.com/p/search/${encodeURIComponent(q)}`:NAVER_HOME;
  }

  function patchOuting(){
    if(typeof tab!=='undefined'&&tab!=='outing')return;

    document.querySelectorAll('[data-outing^="naver:"]').forEach(btn=>{
      const raw=btn.getAttribute('data-outing')||'';
      const id=raw.slice('naver:'.length);
      btn.removeAttribute('data-outing');btn.setAttribute('data-v39-naver',id);btn.textContent='네이버지도';
    });
    document.querySelectorAll('[data-outing="naver-form"]').forEach(btn=>{
      btn.removeAttribute('data-outing');btn.setAttribute('data-v39-form','1');
    });
    document.querySelectorAll('[data-outing-v37="naver-list"]').forEach(btn=>{btn.removeAttribute('data-outing-v37');btn.setAttribute('data-v39-url',NAVER_SAVED)});
    document.querySelectorAll('[data-outing-v37="naver-home"]').forEach(btn=>{btn.removeAttribute('data-outing-v37');btn.setAttribute('data-v39-url',NAVER_HOME)});
    document.querySelectorAll('[data-outing-v37="naver-search"]').forEach(btn=>{btn.removeAttribute('data-outing-v37');btn.setAttribute('data-v39-form','1')});

    const live=document.getElementById('naverLiveSection');
    if(live){
      const badge=live.querySelector('.naver-live-badge');if(badge)badge.textContent='원본 링크';
      const copy=live.querySelector('.naver-live-copy span');if(copy)copy.textContent='네이버는 외부 사이트 안에서 저장목록 화면을 막을 수 있어서, 앱 안에 억지로 띄우지 않고 원본을 직접 열어요.';
      const wrap=live.querySelector('.naver-live-frame-wrap');
      if(wrap)wrap.innerHTML='<div style="padding:22px 16px;text-align:center;color:var(--muted);font-size:12.5px;line-height:1.65">네이버 저장목록은 기기에 따라 앱 안에서 표시가 차단될 수 있어요.<br><b style="color:var(--ink)">아래 버튼으로 네이버 원본을 바로 열어 주세요.</b></div>';
      const reload=live.querySelector('[data-v38="reload"]');if(reload){reload.removeAttribute('data-v38');reload.setAttribute('data-v39-url',NAVER_SAVED);reload.textContent='네이버 저장목록 열기'}
      const open=live.querySelector('[data-v38="open"]');if(open){open.removeAttribute('data-v38');open.setAttribute('data-v39-url',NAVER_SAVED);open.textContent='네이버에서 크게 보기'}
      const note=live.querySelector('.naver-live-note');if(note)note.textContent='앱이 멈춘 것이 아니라 네이버의 외부 표시 제한 때문이에요. 버튼은 현재 창/새 창 중 가능한 방식으로 열립니다.';
    }

    const map=document.getElementById('outingMap');
    if(map&&!document.getElementById('outingMapFallbackTools')){
      const tools=document.createElement('div');tools.id='outingMapFallbackTools';tools.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px';
      tools.innerHTML='<button class="btn" type="button" data-v39-map-retry="1" style="width:100%">앱 지도 다시 불러오기</button><button class="btn pri" type="button" data-v39-url="https://map.naver.com/" style="width:100%">네이버지도 열기</button>';
      map.insertAdjacentElement('afterend',tools);
    }
  }

  render=function(keep){
    const r=baseRender(keep);
    setTimeout(()=>{patchVersion();patchOuting()},0);
    setTimeout(()=>{patchVersion();patchOuting()},150);
    return r;
  };

  document.addEventListener('click',e=>{
    const ver=e.target.closest?.('[data-a="checkver"]');
    if(ver){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();patchVersion();if(typeof toast==='function')toast(`현재 앱 버전 ${DISPLAY_VER}`);return}

    const direct=e.target.closest?.('[data-v39-url]');
    if(direct){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();return openExternal(direct.getAttribute('data-v39-url'))}

    const naver=e.target.closest?.('[data-v39-naver]');
    if(naver){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();return openExternal(naverSearch(placeForId(naver.getAttribute('data-v39-naver'))))}

    const form=e.target.closest?.('[data-v39-form]');
    if(form){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const p={name:document.getElementById('outName')?.value||'',address:document.getElementById('outAddress')?.value||''};return openExternal(naverSearch(p))}

    const retry=e.target.closest?.('[data-v39-map-retry]');
    if(retry){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();try{window.__outingLeafletPromise=null;document.querySelector('script[data-outing-leaflet]')?.remove();document.querySelector('link[data-outing-leaflet]')?.remove();if(typeof render==='function')render(true)}catch(err){if(typeof toast==='function')toast('지도를 다시 불러오지 못했어요')};return}
  },true);

  try{patchVersion();patchOuting()}catch(e){}
})();
