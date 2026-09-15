(function(){
  'use strict';
  if(typeof render!=='function')return;

  const NAVER_LIST_URL='https://naver.me/xfboSqg8';
  const NAVER_HOME='https://map.naver.com/';
  const baseRender=render;

  function injectCss(){
    if(document.getElementById('outing-v37-css'))return;
    const s=document.createElement('style');
    s.id='outing-v37-css';
    s.textContent=`
      /* v37 outing UX polish */
      .tabbar.outing-six{grid-template-columns:repeat(6,minmax(0,1fr));padding-left:2px;padding-right:2px}
      .tabbar.outing-six button{min-width:0;white-space:nowrap;font-size:10px;gap:2px;line-height:1.1}
      .tabbar.outing-six svg{width:21px;height:21px;flex:none}

      .outing-hero{padding:17px!important;border-radius:22px!important}
      .outing-title{display:grid!important;grid-template-columns:minmax(0,1fr) auto;align-items:start!important;gap:12px!important}
      .outing-title>div{min-width:0}
      .outing-title h2{font-size:clamp(17px,5vw,20px)!important;line-height:1.28!important;word-break:keep-all;overflow-wrap:anywhere}
      .outing-title p{line-height:1.55;word-break:keep-all}
      .outing-title>.btn{white-space:nowrap;flex:none;padding:8px 12px!important;font-size:12px!important}
      .outing-stats{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px!important}
      .outing-stat{min-width:0;padding:9px 5px!important}
      .outing-stat b{font-size:17px!important;line-height:1.2}
      .outing-stat span{display:block;font-size:10px!important;line-height:1.25;word-break:keep-all}

      .outing-recs{gap:9px!important}
      .outing-rec{width:100%;min-width:0;box-shadow:0 1px 0 rgba(74,64,56,.03);border:1px solid rgba(242,146,92,.12)!important}
      .outing-rec b{display:block;min-width:0;white-space:normal;word-break:keep-all;overflow-wrap:anywhere;line-height:1.35}
      .outing-rec div{line-height:1.45;word-break:keep-all}

      .outing-card{padding:15px!important;border:1px solid rgba(240,230,218,.75)}
      .outing-card .top{display:grid!important;grid-template-columns:minmax(0,1fr) auto;gap:10px!important;align-items:start!important}
      .outing-card .grow{min-width:0!important}
      .outing-card h3{font-size:15px!important;line-height:1.35!important;white-space:normal!important;word-break:keep-all;overflow-wrap:anywhere;margin:0!important}
      .outing-card .addr{font-size:11.5px!important;line-height:1.45!important;white-space:normal!important;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden!important;word-break:keep-all}
      .outing-card .outing-tag{flex:none;white-space:nowrap;max-width:92px;overflow:hidden;text-overflow:ellipsis}
      .outing-tags{gap:5px!important;margin-top:10px!important}
      .outing-tag{line-height:1.3;white-space:nowrap}
      .outing-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;margin-top:12px!important}
      .outing-actions button{min-width:0!important;min-height:39px;padding:8px 7px!important;font-size:11.5px!important;line-height:1.25!important;white-space:normal!important;word-break:keep-all}
      .outing-actions button.pri{grid-column:1/-1}

      .outing-toolbar{gap:7px!important;padding:2px 0 7px!important}
      .outing-toolbar .chip{flex:0 0 auto;min-height:34px;padding:6px 12px!important;font-size:11.5px!important}

      .outing-naver-connect{margin:0 0 10px;background:#fff;border:1px solid #dce8dc;border-radius:18px;padding:13px;box-shadow:var(--sh)}
      .outing-naver-head{display:flex;align-items:flex-start;gap:10px}
      .outing-naver-logo{width:34px;height:34px;flex:none;border-radius:11px;background:#03c75a;color:#fff;display:grid;place-items:center;font-weight:900;font-size:18px}
      .outing-naver-copy{min-width:0;flex:1}
      .outing-naver-copy b{font-size:13.5px;line-height:1.35;display:block}
      .outing-naver-copy span{font-size:11px;color:var(--muted);line-height:1.45;display:block;margin-top:2px;word-break:keep-all}
      .outing-naver-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}
      .outing-naver-actions button{min-height:38px;border-radius:12px;font-size:11.5px;font-weight:800;border:1px solid #dce8dc;background:#fff;color:#397760;padding:8px;word-break:keep-all}
      .outing-naver-actions button:first-child{background:#03c75a;color:#fff;border-color:#03c75a}

      #outingMap{height:250px!important;border:1px solid var(--line);box-shadow:0 1px 0 rgba(74,64,56,.03)}
      .outing-map-empty{line-height:1.65!important;word-break:keep-all}
      .outing-v37-map-note{margin:7px 2px 0!important;line-height:1.55!important;word-break:keep-all}

      .outing-modal-card{padding-left:18px!important;padding-right:18px!important}
      .outing-modal-card>div:first-of-type+div{align-items:flex-start!important}
      .outing-modal h2{font-size:18px!important;line-height:1.35;word-break:keep-all}
      .outing-modal .sub{margin-top:3px!important}
      .outing-modal .fld label{font-size:11.5px!important}
      .outing-modal input,.outing-modal textarea,.outing-modal select{min-width:0!important;font-size:14px!important}
      .outing-modal .btn{white-space:normal;word-break:keep-all}
      .outing-grid2{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important}
      .outing-coords{margin-top:7px;border:1px solid var(--line);border-radius:13px;background:#fff;padding:0 10px}
      .outing-coords summary{cursor:pointer;padding:9px 0;font-size:11.5px;font-weight:700;color:var(--muted);list-style:none}
      .outing-coords summary::-webkit-details-marker{display:none}
      .outing-coords summary:after{content:'›';float:right;font-size:17px;transform:rotate(90deg)}
      .outing-coords[open] summary:after{transform:rotate(-90deg)}
      .outing-coords .outing-grid2{padding-bottom:10px}
      .outing-address-tools{display:grid;grid-template-columns:1fr;gap:6px;margin-top:7px}
      .outing-address-tools button{width:100%;border:1px solid #bceecf;background:#effcf4;color:#167844;border-radius:12px;padding:8px 10px;font-size:11.5px;font-weight:800}

      @media(max-width:390px){
        .outing-title{grid-template-columns:1fr!important}
        .outing-title>.btn{width:100%}
        .outing-stats{grid-template-columns:repeat(3,minmax(0,1fr))!important}
        .outing-actions{grid-template-columns:1fr 1fr!important}
        .outing-grid2{grid-template-columns:1fr!important}
        .outing-naver-actions{grid-template-columns:1fr!important}
        .tabbar.outing-six button{font-size:9px}
        .tabbar.outing-six svg{width:20px;height:20px}
      }
      @media(max-width:340px){
        .outing-stats{grid-template-columns:1fr!important}
      }
    `;
    document.head.appendChild(s);
  }

  function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}
  function openSafe(url){try{window.open(url,'_blank','noopener')}catch(e){location.href=url}}

  function naverSearchUrl(){
    const n=document.getElementById('outName')?.value?.trim()||'';
    const a=document.getElementById('outAddress')?.value?.trim()||'';
    const q=[n,a].filter(Boolean).join(' ');
    return q?`https://map.naver.com/p/search/${encodeURIComponent(q)}`:NAVER_HOME;
  }

  function addNaverBridge(){
    const map=document.getElementById('outingMap');
    if(!map||document.getElementById('outingNaverConnect'))return;
    const box=document.createElement('div');
    box.id='outingNaverConnect';box.className='outing-naver-connect';
    box.innerHTML=`<div class="outing-naver-head"><div class="outing-naver-logo">N</div><div class="outing-naver-copy"><b>네이버지도 연결</b><span>네이버 저장목록을 바로 열고, 장소도 네이버지도에서 바로 확인할 수 있어요.</span></div></div><div class="outing-naver-actions"><button type="button" data-outing-v37="naver-list">내 저장목록 열기</button><button type="button" data-outing-v37="naver-home">네이버지도 열기</button></div>`;
    map.parentNode.insertBefore(box,map);
    const note=map.nextElementSibling;
    if(note&&note.classList?.contains('hint')){
      note.classList.add('outing-v37-map-note');
      setText(note,'앱 안 지도에서는 저장 위치를 한눈에 보고, 네이버지도 버튼으로 실제 장소 검색·길찾기를 이어서 사용할 수 있어요.');
    }
  }

  function polishCards(){
    document.querySelectorAll('.outing-card').forEach(card=>{
      setText(card.querySelector('[data-outing^="naver:"]'),'네이버지도');
      setText(card.querySelector('[data-outing^="visit:"]'),'방문 기록');
      setText(card.querySelector('[data-outing^="edit:"]'),'상세 보기');
    });
  }

  function polishHero(){
    setText(document.querySelector('.outing-title [data-outing="add"]'),'＋ 장소 추가');
    setText(document.querySelector('.outing-title h2'),'오늘 도준이랑 어디 갈까?');
  }

  function polishEditor(){
    const modal=document.getElementById('outingModal');if(!modal)return;
    const addr=document.getElementById('outAddress');
    if(addr&&!modal.querySelector('.outing-address-tools')){
      const fld=addr.closest('.fld');
      const tools=document.createElement('div');tools.className='outing-address-tools';
      tools.innerHTML='<button type="button" data-outing-v37="naver-search">네이버지도에서 이 장소 찾기</button>';
      fld.appendChild(tools);
    }
    const lat=document.getElementById('outLat');
    if(lat&&!modal.querySelector('.outing-coords')){
      const grid=lat.closest('.outing-grid2');
      if(grid){
        const details=document.createElement('details');details.className='outing-coords';
        const summary=document.createElement('summary');summary.textContent='좌표 직접 입력';
        grid.parentNode.insertBefore(details,grid);details.appendChild(summary);details.appendChild(grid);
      }
    }
    setText(modal.querySelector('[data-outing="picker"]'),'앱 지도에서 위치 지정');
    setText(modal.querySelector('[data-outing="naver-form"]'),'네이버지도에서 보기');
  }

  function polishOuting(){
    injectCss();
    if(typeof tab!=='undefined'&&tab!=='outing')return;
    polishHero();polishCards();addNaverBridge();polishEditor();
  }

  render=function(keep){
    const r=baseRender(keep);
    if(typeof tab!=='undefined'&&tab==='outing'){
      polishOuting();setTimeout(polishOuting,0);setTimeout(polishOuting,120);
    }
    return r;
  };

  document.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-outing-v37]');if(!b)return;
    const cmd=b.dataset.outingV37;
    if(cmd==='naver-list')return openSafe(NAVER_LIST_URL);
    if(cmd==='naver-home')return openSafe(NAVER_HOME);
    if(cmd==='naver-search')return openSafe(naverSearchUrl());
  },true);

  let scheduled=false;
  const obs=new MutationObserver(()=>{
    if(scheduled||typeof tab==='undefined'||tab!=='outing')return;
    scheduled=true;requestAnimationFrame(()=>{scheduled=false;polishOuting()});
  });
  obs.observe(document.body,{childList:true,subtree:true});

  injectCss();try{polishOuting()}catch(e){}
})();
