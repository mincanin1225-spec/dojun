(function(){
  'use strict';
  if(typeof render!=='function')return;
  const DATA_URL='./data/naver-places.json';
  const STORAGE_KEY='dj:outingPlaces1';
  const HASH_KEY='dj:naverSyncHash1';
  const baseRender=render;
  let loading=false,lastData=null;

  function esc(s){return String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}
  function naverPlaceUrl(p){
    if(p.sid)return `https://map.naver.com/p/entry/place/${encodeURIComponent(p.sid)}`;
    return `https://map.naver.com/p/search/${encodeURIComponent([p.name,p.address].filter(Boolean).join(' '))}`;
  }
  function formatTime(s){try{return new Date(s).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}catch(e){return''}}
  function injectCss(){
    if(document.getElementById('outing-v38-css'))return;
    const s=document.createElement('style');s.id='outing-v38-css';s.textContent=`
      .naver-sync-card{margin:10px 0 14px;background:#fff;border:1px solid #dce8dc;border-radius:20px;padding:14px;box-shadow:var(--sh)}
      .naver-sync-head{display:flex;gap:10px;align-items:flex-start}.naver-sync-logo{width:36px;height:36px;border-radius:11px;background:#03c75a;color:#fff;display:grid;place-items:center;font-size:19px;font-weight:900;flex:none}
      .naver-sync-copy{min-width:0;flex:1}.naver-sync-copy b{display:block;font-size:14px;line-height:1.35}.naver-sync-copy span{display:block;margin-top:3px;font-size:11px;line-height:1.45;color:var(--muted);word-break:keep-all}
      .naver-sync-badge{white-space:nowrap;border-radius:99px;padding:5px 8px;font-size:10px;font-weight:900;background:#effcf4;color:#167844}.naver-sync-badge.err{background:#fff3ed;color:#a5542d}
      .naver-sync-tools{display:grid;grid-template-columns:1fr auto;gap:7px;margin-top:11px}.naver-sync-tools button{min-height:38px;border-radius:12px;border:1px solid #cfe8d7;background:#fff;color:#167844;font-weight:800;font-size:11.5px;padding:8px 10px}.naver-sync-tools button:first-child{background:#03c75a;color:#fff;border-color:#03c75a}
      .naver-sync-list{display:grid;gap:8px;margin-top:11px}.naver-sync-place{width:100%;text-align:left;border:1px solid var(--line);background:#fff;border-radius:14px;padding:11px 12px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center}.naver-sync-place .grow{min-width:0}.naver-sync-place b{display:block;font-size:13px;line-height:1.35;white-space:normal;word-break:keep-all;overflow-wrap:anywhere}.naver-sync-place small{display:block;margin-top:3px;color:var(--muted);font-size:10.5px;line-height:1.4;white-space:normal;word-break:keep-all}.naver-sync-place em{font-style:normal;font-size:10px;font-weight:800;color:#167844;white-space:nowrap}
      .naver-sync-empty{margin-top:10px;padding:13px;border-radius:14px;background:var(--line2);font-size:11.5px;line-height:1.55;color:var(--muted);word-break:keep-all}
      @media(max-width:390px){.naver-sync-tools{grid-template-columns:1fr}.naver-sync-place{grid-template-columns:minmax(0,1fr) auto}.naver-sync-head{align-items:flex-start}}
    `;document.head.appendChild(s);
  }

  function hashFor(data){return JSON.stringify((data?.places||[]).map(p=>[p.id,p.name,p.address,p.lat,p.lng,p.lastUpdateTime]));}
  function importIntoOuting(data){
    if(!data||data.status!=='ok'||!Array.isArray(data.places))return false;
    const hash=hashFor(data);if(localStorage.getItem(HASH_KEY)===hash)return false;
    let raw=[];try{raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');if(!Array.isArray(raw))raw=[];}catch(e){raw=[]}
    const localOnly=raw.filter(x=>!String(x?.id||'').startsWith('naver:'));
    const old=new Map(raw.filter(x=>String(x?.id||'').startsWith('naver:')).map(x=>[String(x.id),x]));
    const synced=data.places.map(p=>{
      const id=`naver:${p.id||p.sid||p.name}`;const prev=old.get(id)||{};
      return {...prev,id,name:String(p.name||prev.name||''),address:String(p.address||prev.address||''),lat:Number.isFinite(Number(p.lat))?Number(p.lat):null,lng:Number.isFinite(Number(p.lng))?Number(p.lng):null,category:String(p.category||prev.category||''),space:prev.space||'혼합',parking:!!prev.parking,stroller:!!prev.stroller,nursingRoom:!!prev.nursingRoom,diaper:!!prev.diaper,fee:prev.fee||'',hours:prev.hours||'',closed:prev.closed||'',reservation:!!prev.reservation,link:p.sid?naverPlaceUrl(p):(p.url||prev.link||naverPlaceUrl(p)),memo:prev.memo||String(p.memo||''),status:prev.status||'가고싶음',visitDate:prev.visitDate||'',reaction:prev.reaction||'',createdAt:prev.createdAt||Number(p.creationTime)||Date.now(),updatedAt:Number(p.lastUpdateTime)||Date.now()};
    }).filter(x=>x.name);
    localStorage.setItem(STORAGE_KEY,JSON.stringify([...synced,...localOnly]));localStorage.setItem(HASH_KEY,hash);return true;
  }

  function section(data){
    const places=Array.isArray(data?.places)?data.places:[];const ok=data?.status==='ok';const shown=places.slice(0,30);
    return `<section id="naverSyncSection" class="naver-sync-card"><div class="naver-sync-head"><div class="naver-sync-logo">N</div><div class="naver-sync-copy"><b>네이버 저장목록 자동 동기화</b><span>${ok?`네이버에 저장한 장소 ${places.length}곳을 앱에 불러왔어요.${data.syncedAt?` · ${esc(formatTime(data.syncedAt))} 기준`:''}`:esc(data?.message||'네이버 목록을 불러오는 중이에요.')}</span></div><span class="naver-sync-badge ${ok?'':'err'}">${ok?`${places.length}곳`:'확인중'}</span></div><div class="naver-sync-tools"><button type="button" data-v38="refresh">목록 새로고침</button><button type="button" data-v38="open">네이버 원본</button></div>${shown.length?`<div class="naver-sync-list">${shown.map(p=>`<button type="button" class="naver-sync-place" data-v38-place="${esc(p.id||p.sid||'')}"><span class="grow"><b>${esc(p.name)}</b><small>${esc([p.category,p.address].filter(Boolean).join(' · ')||'주소 정보 없음')}</small></span><em>지도 ›</em></button>`).join('')}</div>${places.length>shown.length?`<div class="naver-sync-empty">전체 ${places.length}곳 중 최근 ${shown.length}곳을 표시하고 있어요. 모든 장소는 앱의 장소 목록에도 자동 반영됩니다.</div>`:''}`:`<div class="naver-sync-empty">아직 동기화된 장소가 없어요. 자동 동기화가 완료되면 이 영역에 네이버 저장목록이 바로 나타납니다.</div>`}</section>`;
  }

  function mount(data){
    if(typeof tab!=='undefined'&&tab!=='outing')return;injectCss();lastData=data||lastData;
    const main=document.querySelector('main');if(!main)return;
    let node=document.getElementById('naverSyncSection');
    const html=section(lastData||{status:'pending',places:[]});
    if(node){node.outerHTML=html;return}
    const map=document.getElementById('outingMap');
    const host=document.createElement('div');host.innerHTML=html;node=host.firstElementChild;
    if(map){const sec=map.previousElementSibling;main.insertBefore(node,sec||map)}else main.prepend(node);
  }

  async function loadData(force=false){
    if(loading)return;loading=true;mount(lastData||{status:'pending',places:[]});
    try{
      const r=await fetch(`${DATA_URL}?v=${force?Date.now():'20260916-v38'}`,{cache:'no-store'});if(!r.ok)throw new Error(`목록 HTTP ${r.status}`);
      const data=await r.json();lastData=data;const changed=importIntoOuting(data);mount(data);
      if(changed&&typeof render==='function')setTimeout(()=>render(true),0);
    }catch(e){lastData={status:'error',places:lastData?.places||[],message:'네이버 목록을 아직 가져오지 못했어요.'};mount(lastData);
    }finally{loading=false}
  }

  render=function(keep){const r=baseRender(keep);if(typeof tab!=='undefined'&&tab==='outing'){setTimeout(()=>{mount(lastData||{status:'pending',places:[]});loadData(false)},0)}return r};

  document.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-v38]');if(b){const cmd=b.dataset.v38;if(cmd==='refresh')return loadData(true);if(cmd==='open')return window.open('https://naver.me/xfboSqg8','_blank','noopener')}
    const p=e.target.closest?.('[data-v38-place]');if(p&&lastData){const item=(lastData.places||[]).find(x=>String(x.id||x.sid||'')===p.dataset.v38Place);if(item)return window.open(naverPlaceUrl(item),'_blank','noopener')}
  },true);

  injectCss();if(typeof tab!=='undefined'&&tab==='outing')setTimeout(()=>loadData(false),0);
})();
