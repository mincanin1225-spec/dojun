(function(){
  'use strict';
  if(typeof render!=='function'||typeof bar!=='function'||typeof $!=='function')return;

  const STORAGE_KEY='dj:outingPlaces1';
  const APP_NAME=window.__DOJUN_RELEASE?.name||'도준이키우기';
  const STATUS=['가고싶음','추천','다녀옴','재방문'];
  const REACTIONS=['','잘 놀았음','보통','별로였음'];
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const val=(id)=>document.getElementById(id)?.value||'';
  const bool=(id)=>document.getElementById(id)?.value==='yes';
  const uid=()=>globalThis.crypto?.randomUUID?.()||`outing-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const baseBar=bar,baseRender=render;
  let filter='전체',outingMap=null,pickerMap=null,pickerMarker=null;

  function readPlaces(){
    try{
      const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
      if(!Array.isArray(raw))return [];
      return raw.filter(x=>x&&typeof x==='object').map(x=>({
        id:String(x.id||uid()),name:String(x.name||'').slice(0,80),address:String(x.address||'').slice(0,160),
        lat:Number.isFinite(Number(x.lat))?Number(x.lat):null,lng:Number.isFinite(Number(x.lng))?Number(x.lng):null,
        category:String(x.category||'').slice(0,40),space:['실내','실외','혼합'].includes(x.space)?x.space:'혼합',
        parking:!!x.parking,stroller:!!x.stroller,nursingRoom:!!x.nursingRoom,diaper:!!x.diaper,
        fee:String(x.fee||'').slice(0,80),hours:String(x.hours||'').slice(0,120),closed:String(x.closed||'').slice(0,80),
        reservation:!!x.reservation,link:String(x.link||'').slice(0,500),memo:String(x.memo||'').slice(0,1000),
        status:STATUS.includes(x.status)?x.status:'가고싶음',visitDate:String(x.visitDate||'').slice(0,10),
        reaction:REACTIONS.includes(x.reaction)?x.reaction:'',createdAt:Number(x.createdAt)||Date.now(),updatedAt:Number(x.updatedAt)||Date.now()
      })).filter(x=>x.name);
    }catch(e){return []}
  }
  function savePlaces(list){localStorage.setItem(STORAGE_KEY,JSON.stringify(list));window.__outingPlaces=list}
  function places(){return readPlaces()}
  window.__outingPlaces=places();

  function injectCss(){
    if(document.getElementById('outing-v36-css'))return;
    const s=document.createElement('style');s.id='outing-v36-css';s.textContent=`
      .tabbar.outing-six{grid-template-columns:repeat(6,1fr)}
      .outing-hero{background:linear-gradient(135deg,var(--mint-s),#fff);border:1px solid #dcefe6}
      .outing-title{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
      .outing-title h2{font-size:20px}.outing-title p{margin:4px 0 0;font-size:12.5px;color:var(--ink2)}
      .outing-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:13px}
      .outing-stat{background:#fff;border:1px solid var(--line);border-radius:15px;padding:10px;text-align:center}
      .outing-stat b{display:block;font-size:18px}.outing-stat span{font-size:10.5px;color:var(--muted);font-weight:700}
      .outing-toolbar{display:flex;gap:6px;overflow:auto;padding:2px 0 5px;scrollbar-width:none}.outing-toolbar::-webkit-scrollbar{display:none}
      .outing-toolbar .chip{white-space:nowrap;border:0}.outing-toolbar .chip.on{background:var(--peach);color:#fff}
      .outing-card{background:#fff;border-radius:18px;box-shadow:var(--sh);padding:14px;margin:9px 0}
      .outing-card .top{display:flex;gap:10px;align-items:flex-start}.outing-card .grow{flex:1;min-width:0}
      .outing-card h3{font-size:15px}.outing-card .addr{font-size:11.5px;color:var(--muted);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .outing-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:9px}.outing-tag{font-size:10.5px;padding:3px 8px;border-radius:99px;background:var(--line2);color:var(--ink2);font-weight:700}
      .outing-tag.rec{background:var(--peach-s);color:#95501f}.outing-tag.done{background:var(--mint-s);color:#397760}
      .outing-actions{display:flex;gap:6px;margin-top:11px}.outing-actions button{flex:1;border:1px solid var(--line);border-radius:12px;padding:8px 7px;font-size:11.5px;font-weight:700;background:#fff}.outing-actions .pri{background:var(--peach);color:#fff;border-color:var(--peach)}
      #outingMap{height:260px;border-radius:18px;overflow:hidden;background:var(--line2);position:relative}.outing-map-empty{height:100%;display:grid;place-items:center;text-align:center;padding:24px;color:var(--muted);font-size:12.5px}
      .outing-recs{display:grid;gap:8px}.outing-rec{background:var(--peach-s);border-radius:15px;padding:11px 12px}.outing-rec b{font-size:13.5px}.outing-rec div{font-size:11.5px;color:#8a5b39;margin-top:2px}
      .outing-modal{position:fixed;inset:0;z-index:80;background:rgba(74,64,56,.48);display:flex;align-items:flex-end;justify-content:center}
      .outing-modal-card{width:100%;max-width:480px;max-height:92vh;overflow:auto;background:var(--bg);border-radius:26px 26px 0 0;padding:10px 16px calc(22px + env(safe-area-inset-bottom))}
      .outing-grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px}.outing-toggle{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .outing-toggle select,.outing-modal select{width:100%;border:1.5px solid var(--line);border-radius:13px;padding:10px 11px;font:inherit;background:#fff;color:var(--ink)}
      .outing-modal .fld{margin:9px 0}.outing-modal .fld textarea{min-height:72px}
      .outing-pick{height:210px;border-radius:16px;overflow:hidden;background:var(--line2);margin-top:8px}.outing-map-note{font-size:11.5px;color:var(--muted);margin-top:6px}
      @media(max-width:380px){.outing-stats{grid-template-columns:1fr}.tabbar button{font-size:9.5px}}
    `;document.head.appendChild(s);
  }

  function naverUrl(p){return `https://map.naver.com/p/search/${encodeURIComponent([p.name,p.address].filter(Boolean).join(' '))}`}
  function safeLink(url){try{const u=new URL(url,location.href);return ['http:','https:'].includes(u.protocol)?u.href:''}catch(e){return''}}
  function statusClass(s){return s==='추천'?'rec':(s==='다녀옴'||s==='재방문')?'done':''}

  function recommendation(list){
    return [...list].sort((a,b)=>{
      const score=x=>(x.status==='추천'?30:x.status==='가고싶음'?20:x.status==='재방문'?10:0)+(x.visitDate?0:5)+(x.stroller?2:0)+(x.parking?1:0);
      return score(b)-score(a)||(b.updatedAt-a.updatedAt);
    }).filter(x=>x.status!=='다녀옴').slice(0,3);
  }
  function card(p){
    const tags=[p.status,p.category,p.space,p.parking?'주차':'',p.stroller?'유모차':'',p.nursingRoom?'수유실':'',p.reaction].filter(Boolean);
    return `<article class="outing-card" data-outing-card="${esc(p.id)}"><div class="top"><div class="grow"><h3>${esc(p.name)}</h3><div class="addr">${esc(p.address||'주소 미입력')}</div></div><span class="outing-tag ${statusClass(p.status)}">${esc(p.status)}</span></div><div class="outing-tags">${tags.slice(1).map(x=>`<span class="outing-tag">${esc(x)}</span>`).join('')}</div>${p.visitDate?`<div class="hint" style="margin-top:8px">최근 방문 · <b>${esc(p.visitDate)}</b>${p.reaction?` · ${esc(p.reaction)}`:''}</div>`:''}<div class="outing-actions"><button data-outing="naver:${esc(p.id)}">지도</button><button data-outing="visit:${esc(p.id)}">다녀옴</button><button class="pri" data-outing="edit:${esc(p.id)}">상세·수정</button></div></article>`;
  }
  function vOuting(){
    const list=places(),shown=filter==='전체'?list:list.filter(x=>x.status===filter),rec=recommendation(list);
    const wish=list.filter(x=>['가고싶음','추천'].includes(x.status)).length,done=list.filter(x=>['다녀옴','재방문'].includes(x.status)).length,revisit=list.filter(x=>x.status==='재방문').length;
    return `<div class="card outing-hero"><div class="outing-title"><div><h2>오늘 도준이랑 어디 갈까?</h2><p>장소를 모으고, 가본 날과 도준이 반응까지 한 곳에 기록해요.</p></div><button class="btn pri" data-outing="add">＋ 장소</button></div><div class="outing-stats"><div class="outing-stat"><b>${wish}</b><span>가고 싶은 곳</span></div><div class="outing-stat"><b>${done}</b><span>다녀온 곳</span></div><div class="outing-stat"><b>${revisit}</b><span>재방문 후보</span></div></div></div>
      <div class="sec"><h2>지이사 추천</h2><span class="more">저장 목록 기준</span></div><div class="outing-recs">${rec.length?rec.map(p=>`<button class="outing-rec" data-outing="edit:${esc(p.id)}" style="text-align:left;border:0"><b>${esc(p.name)}</b><div>${esc(p.status==='추천'?'추천으로 표시한 장소':p.status==='재방문'?'다시 가볼 만한 장소':'아직 안 가본 저장 장소')}${p.space?` · ${esc(p.space)}`:''}</div></button>`).join(''):'<div class="card"><p class="hint" style="margin:0">장소를 추가하면 여기서 우선 후보를 골라 보여줄게요. 날씨·행사 추천은 다음 단계에서 연결합니다.</p></div>'}</div>
      <div class="sec"><h2>지도</h2><span class="more">저장 장소 ${list.length}곳</span></div><div id="outingMap"><div class="outing-map-empty">좌표가 저장된 장소를 지도에 표시하는 중…</div></div><p class="hint" style="margin:7px 2px 0">장소 수정에서 지도에 위치를 찍을 수 있어요. 지도 데이터는 OpenStreetMap을 사용하고, 각 장소는 네이버지도 검색으로도 열 수 있어요.</p>
      <div class="sec"><h2>장소 목록</h2><span class="more">${shown.length}곳</span></div><div class="outing-toolbar">${['전체',...STATUS].map(s=>`<button class="chip ${filter===s?'on':''}" data-outing="filter:${esc(s)}">${esc(s)}</button>`).join('')}</div>${shown.length?shown.map(card).join(''):'<div class="card empty">아직 이 상태의 장소가 없어요.</div>'}`;
  }

  bar=function(){
    baseBar();injectCss();
    const nav=document.getElementById('tabbar');if(!nav)return;
    nav.classList.add('outing-six');
    if(!nav.querySelector('[data-a="tab:outing"]')){
      const b=document.createElement('button');b.setAttribute('data-a','tab:outing');b.innerHTML='<svg viewBox="0 0 24 24" fill="none"><path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="2.2" stroke="currentColor" stroke-width="1.8"/></svg>외출';nav.insertBefore(b,nav.lastElementChild);
    }
    nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.a===`tab:${tab}`)));
    const h=document.querySelector('.appbar h1');if(h)h.textContent=APP_NAME;
    document.title=APP_NAME;
  };
  render=function(keep){
    if(tab!=='outing'){
      if(outingMap){try{outingMap.remove()}catch(e){};outingMap=null}
      return baseRender(keep);
    }
    bar();$('main').innerHTML=vOuting();if(!keep)window.scrollTo({top:0});setTimeout(renderOutingMap,0);
  };

  function ensureLeaflet(){
    if(window.L)return Promise.resolve(window.L);
    if(window.__outingLeafletPromise)return window.__outingLeafletPromise;
    window.__outingLeafletPromise=new Promise((resolve,reject)=>{
      if(!document.querySelector('link[data-outing-leaflet]')){const l=document.createElement('link');l.rel='stylesheet';l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';l.dataset.outingLeaflet='1';document.head.appendChild(l)}
      const old=document.querySelector('script[data-outing-leaflet]');if(old){old.addEventListener('load',()=>resolve(window.L),{once:true});old.addEventListener('error',reject,{once:true});return}
      const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.dataset.outingLeaflet='1';s.onload=()=>resolve(window.L);s.onerror=reject;document.head.appendChild(s);
    });return window.__outingLeafletPromise;
  }
  async function renderOutingMap(){
    const el=document.getElementById('outingMap');if(!el)return;
    const pts=places().filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng));
    if(!pts.length){el.innerHTML='<div class="outing-map-empty">아직 지도에 찍힌 장소가 없어요.<br>장소를 추가하고 위치를 찍어 주세요.</div>';return}
    try{
      const L=await ensureLeaflet();if(!document.getElementById('outingMap'))return;
      if(outingMap){try{outingMap.remove()}catch(e){}}
      outingMap=L.map('outingMap',{zoomControl:true,attributionControl:true});L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(outingMap);
      const bounds=[];pts.forEach(p=>{const m=L.marker([p.lat,p.lng]).addTo(outingMap);m.bindPopup(`<b>${esc(p.name)}</b><br>${esc(p.status)}${p.address?`<br>${esc(p.address)}`:''}`);bounds.push([p.lat,p.lng])});
      if(bounds.length===1)outingMap.setView(bounds[0],14);else outingMap.fitBounds(bounds,{padding:[20,20]});
      setTimeout(()=>outingMap?.invalidateSize(),50);
    }catch(e){el.innerHTML='<div class="outing-map-empty">지도를 불러오지 못했어요.<br>장소 카드의 지도 버튼은 계속 사용할 수 있어요.</div>'}
  }

  function selectOpts(list,current){return list.map(x=>`<option value="${esc(x)}" ${x===current?'selected':''}>${esc(x||'선택 안 함')}</option>`).join('')}
  function yesNo(current){return `<option value="no" ${!current?'selected':''}>-</option><option value="yes" ${current?'selected':''}>가능</option>`}
  function openEditor(id){
    const found=places().find(x=>x.id===id),p=found||{id:'',name:'',address:'',lat:null,lng:null,category:'',space:'혼합',parking:false,stroller:false,nursingRoom:false,diaper:false,fee:'',hours:'',closed:'',reservation:false,link:'',memo:'',status:'가고싶음',visitDate:'',reaction:''};
    closeModal();const m=document.createElement('div');m.id='outingModal';m.className='outing-modal';m.innerHTML=`<div class="outing-modal-card"><div class="grab"></div><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><h2>${found?'장소 상세·수정':'새 장소 추가'}</h2><div class="sub">도준이 외출 기록</div></div><button class="btn" data-outing="close">닫기</button></div>
      <input type="hidden" id="outId" value="${esc(p.id)}"><div class="fld"><label>장소명 *</label><input id="outName" maxlength="80" value="${esc(p.name)}" placeholder="예: 어린이과학관"></div><div class="fld"><label>주소</label><input id="outAddress" maxlength="160" value="${esc(p.address)}" placeholder="도로명 또는 장소 주소"></div>
      <div class="outing-grid2"><div class="fld"><label>상태</label><select id="outStatus">${selectOpts(STATUS,p.status)}</select></div><div class="fld"><label>카테고리</label><input id="outCategory" maxlength="40" value="${esc(p.category)}" placeholder="공원·키즈카페·전시"></div></div>
      <div class="outing-grid2"><div class="fld"><label>공간</label><select id="outSpace">${selectOpts(['실내','실외','혼합'],p.space)}</select></div><div class="fld"><label>예약</label><select id="outReservation">${yesNo(p.reservation)}</select></div></div>
      <div class="outing-grid2"><div class="fld"><label>주차</label><select id="outParking">${yesNo(p.parking)}</select></div><div class="fld"><label>유모차</label><select id="outStroller">${yesNo(p.stroller)}</select></div><div class="fld"><label>수유실</label><select id="outNursing">${yesNo(p.nursingRoom)}</select></div><div class="fld"><label>기저귀 교환대</label><select id="outDiaper">${yesNo(p.diaper)}</select></div></div>
      <div class="outing-grid2"><div class="fld"><label>이용요금</label><input id="outFee" maxlength="80" value="${esc(p.fee)}" placeholder="무료 / 성인 5,000원"></div><div class="fld"><label>휴무</label><input id="outClosed" maxlength="80" value="${esc(p.closed)}" placeholder="월요일"></div></div><div class="fld"><label>운영시간</label><input id="outHours" maxlength="120" value="${esc(p.hours)}" placeholder="10:00~18:00"></div>
      <div class="outing-grid2"><div class="fld"><label>방문 날짜</label><input id="outVisitDate" type="date" value="${esc(p.visitDate)}"></div><div class="fld"><label>도준이 반응</label><select id="outReaction">${selectOpts(REACTIONS,p.reaction)}</select></div></div>
      <div class="fld"><label>지도 위치</label><div class="outing-grid2"><input id="outLat" inputmode="decimal" value="${p.lat??''}" placeholder="위도"><input id="outLng" inputmode="decimal" value="${p.lng??''}" placeholder="경도"></div><button class="btn" style="width:100%;margin-top:7px" data-outing="picker">지도에서 위치 찍기</button><div id="outingPicker" class="outing-pick" style="display:none"></div><div class="outing-map-note">지도를 눌러 핀을 옮기면 좌표가 자동 입력돼요.</div></div>
      <div class="fld"><label>참고 링크</label><input id="outLink" maxlength="500" value="${esc(p.link)}" placeholder="공식 홈페이지 등"></div><div class="fld"><label>메모</label><textarea id="outMemo" maxlength="1000" placeholder="도준이와 갈 때 기억할 점">${esc(p.memo)}</textarea></div>
      <div class="btnrow"><button class="btn pri" data-outing="save">저장</button>${found?'<button class="btn" data-outing="naver-form">네이버지도</button><button class="btn warn" data-outing="delete">삭제</button>':''}</div></div>`;document.body.appendChild(m);
  }
  function closeModal(){if(pickerMap){try{pickerMap.remove()}catch(e){};pickerMap=null;pickerMarker=null}document.getElementById('outingModal')?.remove()}
  async function openPicker(){
    const el=document.getElementById('outingPicker');if(!el)return;el.style.display='block';
    try{
      const L=await ensureLeaflet();if(pickerMap){pickerMap.invalidateSize();return}
      const lat=Number(val('outLat')),lng=Number(val('outLng')),has=Number.isFinite(lat)&&Number.isFinite(lng)&&lat!==0&&lng!==0,center=has?[lat,lng]:[37.5665,126.9780];
      pickerMap=L.map(el).setView(center,has?15:10);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(pickerMap);
      if(has)pickerMarker=L.marker(center).addTo(pickerMap);
      pickerMap.on('click',e=>{const {lat,lng}=e.latlng;document.getElementById('outLat').value=lat.toFixed(6);document.getElementById('outLng').value=lng.toFixed(6);if(pickerMarker)pickerMarker.setLatLng(e.latlng);else pickerMarker=L.marker(e.latlng).addTo(pickerMap)});setTimeout(()=>pickerMap.invalidateSize(),50);
    }catch(e){el.innerHTML='<div class="outing-map-empty">지도 선택기를 불러오지 못했어요. 좌표를 직접 입력할 수 있어요.</div>'}
  }
  function collect(){
    const name=val('outName').trim();if(!name){toast('장소명을 입력해 주세요');return null}
    const latRaw=val('outLat').trim(),lngRaw=val('outLng').trim(),lat=latRaw===''?null:Number(latRaw),lng=lngRaw===''?null:Number(lngRaw);
    if(lat!==null&&(!Number.isFinite(lat)||lat<-90||lat>90)){toast('위도를 확인해 주세요');return null}if(lng!==null&&(!Number.isFinite(lng)||lng<-180||lng>180)){toast('경도를 확인해 주세요');return null}
    const visitDate=val('outVisitDate'),status=val('outStatus'),reaction=val('outReaction');
    return {name,address:val('outAddress').trim(),lat,lng,category:val('outCategory').trim(),space:val('outSpace'),parking:bool('outParking'),stroller:bool('outStroller'),nursingRoom:bool('outNursing'),diaper:bool('outDiaper'),fee:val('outFee').trim(),hours:val('outHours').trim(),closed:val('outClosed').trim(),reservation:bool('outReservation'),link:safeLink(val('outLink').trim()),memo:val('outMemo').trim(),status:STATUS.includes(status)?status:'가고싶음',visitDate,reaction:REACTIONS.includes(reaction)?reaction:''};
  }
  function saveEditor(){
    const data=collect();if(!data)return;const list=places(),id=val('outId'),now=Date.now(),i=list.findIndex(x=>x.id===id);
    if(i>=0)list[i]={...list[i],...data,updatedAt:now};else list.unshift({...data,id:uid(),createdAt:now,updatedAt:now});savePlaces(list);closeModal();toast(i>=0?'장소를 수정했어요':'장소를 추가했어요');render(true);
  }
  function quickVisit(id){
    const list=places(),i=list.findIndex(x=>x.id===id);if(i<0)return;const today=new Date(),date=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;list[i]={...list[i],status:'다녀옴',visitDate:date,updatedAt:Date.now()};savePlaces(list);toast('다녀온 곳으로 기록했어요');render(true);
  }
  function removeCurrent(){const id=val('outId'),list=places(),p=list.find(x=>x.id===id);if(!p)return;if(!confirm(`${p.name}을(를) 삭제할까요?`))return;savePlaces(list.filter(x=>x.id!==id));closeModal();toast('장소를 삭제했어요');render(true)}
  function openNaver(id){const p=places().find(x=>x.id===id);if(p)window.open(naverUrl(p),'_blank','noopener')}

  document.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-outing]');if(!b)return;const [cmd,arg]=b.dataset.outing.split(':');
    if(cmd==='add')return openEditor();if(cmd==='edit')return openEditor(arg);if(cmd==='close')return closeModal();if(cmd==='save')return saveEditor();if(cmd==='delete')return removeCurrent();if(cmd==='picker')return openPicker();if(cmd==='visit')return quickVisit(arg);if(cmd==='naver')return openNaver(arg);if(cmd==='filter'){filter=arg;return render(true)}
    if(cmd==='naver-form'){const p={name:val('outName'),address:val('outAddress')};return window.open(naverUrl(p),'_blank','noopener')}
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('outingModal'))closeModal()});

  injectCss();try{const meta=document.querySelector('meta[name="apple-mobile-web-app-title"]');if(meta)meta.content=APP_NAME;document.title=APP_NAME;render(true)}catch(e){}
})();
