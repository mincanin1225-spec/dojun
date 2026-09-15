(function(){
  'use strict';
  if(typeof TABS==='undefined'||typeof vShop!=='function'||typeof weekList!=='function'||typeof sheetBatch!=='function')return;

  TABS[1][1]='관리';
  window.__mgStage='home';

  const mealLabels=['아침','점심','저녁'];
  const cubeBatches=()=>{try{const v=JSON.parse(localStorage.getItem('dj:cubeInventory2')||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}};
  const normName=n=>{n=String(n||'').trim();return ['진밥','밥','밥 (조리 후)'].includes(n)?'밥 (조리 후)':n};
  const windows=()=>[
    {id:'first',start:weekCur,count:4,title:'1차 식단표',range:'월~목 4일치',prep:'일요일 준비'},
    {id:'second',start:addD(weekCur,4),count:3,title:'2차 식단표',range:'금~일 3일치',prep:'목요일 준비'}
  ];
  const weekTitle=()=>{const d=P(addD(weekCur,3));return `${d.getMonth()+1}월 ${Math.ceil(d.getDate()/7)}주차`};
  const rangeText=()=>{const a=P(weekCur),b=P(addD(weekCur,6));return `${a.getMonth()+1}/${a.getDate()} – ${b.getMonth()+1}/${b.getDate()}`};
  const cubeByIngredient=()=>{const out={};for(const b of cubeBatches()){const n=normName(b.ingredient);if(!n)continue;out[n]=(out[n]||0)+(Number(b.unitG)||0)*(Number(b.remainingCount)||0)}return out};
  const rawAvail=()=>{const g={},count={};for(const [k,v] of Object.entries(inventory||{})){const name=normName(invName(k));const q=Math.max(0,Number(v.qty)||0);if(v.unit==='g')g[name]=(g[name]||0)+q;else if(Number(v.gramsPerUnit)>0)g[name]=(g[name]||0)+q*Number(v.gramsPerUnit);else count[name]=(count[name]||0)+q}return{g,count}};

  function requirements(w){
    const t=weekList(w.start,w.count);
    let rice=0;for(let d=0;d<w.count;d++){const on=addD(w.start,d);for(let i=0;i<3;i++)if(mObj(on,i))rice+=stage(on).rice}
    if(rice)t['밥 (조리 후)']={c:'e',g:rice,n:0};
    return t;
  }

  function allocation(){
    const raw=rawAvail(),cube=cubeByIngredient(),result={};
    for(const w of windows()){
      const out={};
      for(const [name0,v] of Object.entries(requirements(w))){
        const name=normName(name0),needG=Math.max(0,Number(v.g)||0),needN=Math.max(0,Number(v.n)||0);
        if(needG>0){
          const cubeUse=Math.min(needG,cube[name]||0);cube[name]=Math.max(0,(cube[name]||0)-cubeUse);
          const makeG=Math.max(0,needG-cubeUse);
          const rawUse=Math.min(makeG,raw.g[name]||0);raw.g[name]=Math.max(0,(raw.g[name]||0)-rawUse);
          out[name]={name,needG,cubeUse,makeG,rawUse,buyG:Math.max(0,makeG-rawUse),unknown:false};
        }else if(name==='계란'){
          const have=raw.count[name]||0,use=Math.min(needN,have);raw.count[name]=Math.max(0,have-use);
          out[name]={name,needN,rawUseN:use,buyN:Math.max(0,needN-use),unknown:false,countUnit:'개'};
        }else{
          out[name]={name,needN,unknown:true};
        }
      }
      result[w.id]=out;
    }
    return result;
  }

  function nav(){
    const stage=window.__mgStage;
    return `<div class="card" style="padding:10px;margin-bottom:12px">
      <div class="chips" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
        <button class="chip ${stage==='stock'?'ok':''}" data-mg="stock">1 재고관리</button>
        <button class="chip ${stage==='shop'?'ok':''}" data-mg="shop">2 장보기</button>
        <button class="chip ${stage==='prep'?'ok':''}" data-mg="prep">3 식단만들기</button>
      </div>
      ${stage!=='home'?'<div style="margin-top:9px"><button class="more" data-mg="home">‹ 이번 주 식단표로</button></div>':''}
    </div>`;
  }

  function dayMeals(on){
    return `<div class="meal" style="display:block"><div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:6px"><b>${P(on).getMonth()+1}/${P(on).getDate()} (${WD[P(on).getDay()]})</b></div>
      ${mealLabels.map((lb,i)=>`<div style="display:grid;grid-template-columns:38px 1fr;gap:7px;padding:3px 0"><span class="hint" style="color:var(--mint);font-weight:800">${lb}</span><span style="font-size:13px">${esc(mText(on,i)||'메뉴 없음')}</span></div>`).join('')}</div>`;
  }
  function planBlock(w){
    let days='';for(let i=0;i<w.count;i++)days+=dayMeals(addD(w.start,i));
    return `<div class="sec"><h2>${weekTitle()} · ${w.title}</h2><span class="more">${w.prep} · ${w.range}</span></div><div class="card">${days}</div>`;
  }
  function homeView(){
    const end=P(addD(weekCur,6));
    return `<div class="sec"><div class="nav"><button class="rd" data-a="wk:-1">‹</button><b>${weekTitle()}</b><button class="rd" data-a="wk:1">›</button></div><span class="more">${rangeText()}</span></div>
      ${nav()}${windows().map(planBlock).join('')}`;
  }

  function rawRows(){
    return Object.entries(inventory||{}).map(([k,v])=>`<div class="inventory-row"><div style="flex:1"><b>${esc(invName(k))}</b><div style="display:flex;gap:6px;align-items:center;margin-top:4px"><input data-rq="${esc(k)}" type="number" min="0" step="0.1" value="${Number(v.qty)||0}" style="width:82px;border:1px solid var(--line);border-radius:9px;padding:6px"> <span>${esc(v.unit)} · ${esc(v.location)}</span></div><div class="hint">${v.gramsPerUnit?`1${esc(v.unit)}=${v.gramsPerUnit}g · `:''}${esc(v.memo||'')}</div></div><button class="btn" data-a="invedit:${esc(k)}">수정</button></div>`).join('');
  }
  function cubeRows(){
    return cubeBatches().map((b,i)=>`<div class="inventory-row"><div style="flex:1"><b>${esc(b.code||'-')} · ${esc(b.ingredient||'')}</b><div style="margin-top:4px">${Number(b.unitG)||0}g × <input data-cq="${i}" type="number" min="0" step="1" value="${Number(b.remainingCount)||0}" style="width:68px;border:1px solid var(--line);border-radius:9px;padding:6px">개</div><div class="hint">${esc(b.madeDate||'')} · ${esc(b.location||'냉동')}</div></div><b>${Math.round((Number(b.unitG)||0)*(Number(b.remainingCount)||0))}g</b></div>`).join('');
  }
  function stockView(){
    const opts=inventoryKeys().map(k=>`<option value="${esc(k)}">${esc(invName(k))}</option>`).join('');
    return `${nav()}<div class="sec"><h2>1단계 · 재고관리</h2><span class="more">냉동실 확인 후 갱신</span></div>
      <p class="hint">밥만 고정으로 쓰지 않고, 집에 있는 재료를 직접 추가해서 실제 남은 양을 맞출 수 있어요.</p>
      <div class="card"><b>우리집 식재료</b>${rawRows()||'<p class="hint">등록된 식재료가 없어요. 아래에서 추가해 주세요.</p>'}
        <div class="btnrow"><button class="btn pri" data-mg="rawsave">실재고 갱신</button></div></div>
      <div class="sec"><h2>식재료 추가</h2></div>
      <div class="card"><div class="fld"><label>재료</label><select id="mgAddKey">${opts}</select></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="fld"><label>현재량</label><input id="mgAddQty" type="number" min="0" step="0.1" placeholder="예: 120"></div><div class="fld"><label>단위</label><select id="mgAddUnit"><option>g</option><option>개</option><option>팩</option></select></div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="fld"><label>1개·1팩당 g</label><input id="mgAddGram" type="number" min="0.1" step="0.1" placeholder="g이면 비워도 됨"></div><div class="fld"><label>보관</label><select id="mgAddLoc"><option>냉동</option><option>냉장</option><option>실온</option></select></div></div>
        <div class="btnrow"><button class="btn pri" data-mg="addraw">재고에 추가</button></div></div>
      <div class="sec"><h2>만들어둔 냉동 큐브</h2></div><div class="card">${cubeRows()||'<p class="hint">등록된 냉동 큐브가 없어요.</p>'}<div class="btnrow"><button class="btn pri" data-mg="cubesave">냉동큐브 재고 갱신</button></div></div>`;
  }

  const checkKey=w=>`mg29|${w.start}`;
  function shoppingRows(w,alloc){
    const chk=shopChk[checkKey(w)]||[];
    const rows=Object.values(alloc).filter(v=>v.unknown||(v.buyG||0)>0||(v.buyN||0)>0);
    if(!rows.length)return '<p class="hint"><b>추가로 살 재료가 없어요.</b> 현재 재고로 준비할 수 있어요.</p>';
    return rows.map(v=>{const on=chk.includes(v.name);const qty=v.unknown?`${v.needN||''}회 · 수량 확인`:v.buyN!==undefined?`${Math.ceil(v.buyN)}${v.countUnit||'개'}`:`${Math.ceil(v.buyG)}g`;return `<div class="shop${on?' on':''}" data-mgcheck="${w.id}|${encodeURIComponent(v.name)}"><div class="bx"></div><div class="nm">${esc(v.name)}<div class="hint">${v.unknown?'재고 단위 확인 필요':v.buyN!==undefined?`필요 ${v.needN}${v.countUnit||'개'} · 집재고 ${v.rawUseN||0}${v.countUnit||'개'} 사용`:`식단 필요 ${Math.ceil(v.needG)}g · 냉동큐브 ${Math.ceil(v.cubeUse||0)}g 사용 · 집재고 ${Math.ceil(v.rawUse||0)}g 사용`}</div></div><div class="qt"><b>${qty}</b></div></div>`}).join('');
  }
  function shopView(){
    const a=allocation();
    return `${nav()}<div class="sec"><h2>2단계 · 장보기</h2><span class="more">재고 갱신과 자동 동기화</span></div><p class="hint">1단계에서 입력한 집 재고와 냉동 큐브를 먼저 쓰고, 모자라는 것만 1차·2차로 나눠 보여줘요. 산 것은 체크해 두면 됩니다.</p>
      ${windows().map(w=>`<div class="sec"><h2>${w.title} 장보기</h2><span class="more">${w.range}</span></div><div class="card">${shoppingRows(w,a[w.id])}</div>`).join('')}
      <div class="btnrow"><button class="btn" data-mg="shopclear">장보기 체크 해제</button><button class="btn pri" data-mg="prep">3단계 식단만들기 ›</button></div>`;
  }

  function prepSummary(w,alloc){
    const rows=Object.values(alloc).filter(v=>v.unknown||(v.makeG||0)>0);
    const known=rows.filter(v=>!v.unknown),total=known.reduce((s,v)=>s+(v.makeG||0),0);
    return `<button class="manage-prep-card" data-mgprep="${w.id}" style="display:block;width:100%;text-align:left;background:#fff;border:1.5px solid var(--line);border-radius:18px;padding:16px;margin:10px 0;box-shadow:var(--sh)"><div style="display:flex;justify-content:space-between;gap:8px"><b>${w.title} · ${w.range}</b><span class="more">상세 만들기 ›</span></div><div class="hint" style="margin-top:5px">${rows.length?`새로 만들 후보 ${rows.length}종${total?` · 약 ${Math.ceil(total)}g`:''}`:'냉동재고로 필요한 재료가 충족돼요.'}</div></button>`;
  }
  function prepView(){
    const a=allocation();
    return `${nav()}<div class="sec"><h2>3단계 · 식단만들기</h2><span class="more">1차 / 2차 선택</span></div><p class="hint">들어가자마자 1차 또는 2차를 고르면 기존 <b>상세 만들기</b> 화면이 바로 열려요.</p>${windows().map(w=>prepSummary(w,a[w.id])).join('')}`;
  }

  vShop=function(){
    if(window.__mgStage==='stock')return stockView();
    if(window.__mgStage==='shop')return shopView();
    if(window.__mgStage==='prep')return prepView();
    return homeView();
  };

  document.addEventListener('click',async function(e){
    const tabBtn=e.target.closest&&e.target.closest('[data-a="tab:shop"]');
    if(tabBtn)window.__mgStage='home';

    const prepBtn=e.target.closest&&e.target.closest('[data-mgprep]');
    if(prepBtn){e.preventDefault();e.stopImmediatePropagation();const w=windows().find(x=>x.id===prepBtn.dataset.mgprep);if(w)sheetBatch(w.start,w.count);return}

    const check=e.target.closest&&e.target.closest('[data-mgcheck]');
    if(check){e.preventDefault();e.stopImmediatePropagation();const[id,enc]=check.dataset.mgcheck.split('|'),w=windows().find(x=>x.id===id),name=decodeURIComponent(enc);if(!w)return;const key=checkKey(w),list=shopChk[key]||(shopChk[key]=[]),i=list.indexOf(name);i<0?list.push(name):list.splice(i,1);await store.set('shop2',shopChk);render(true);return}

    const t=e.target.closest&&e.target.closest('[data-mg]');if(!t)return;
    const a=t.dataset.mg;e.preventDefault();e.stopImmediatePropagation();
    if(['home','stock','shop','prep'].includes(a)){window.__mgStage=a;render();return}
    if(a==='rawsave'){
      document.querySelectorAll('[data-rq]').forEach(x=>{const k=x.dataset.rq;if(inventory[k]){inventory[k].qty=Math.max(0,Number(x.value)||0);inventory[k].updatedAt=Date.now();try{pushInventoryItem(k)}catch(_){}}});persistInventoryLocal();toast('실재고를 갱신했어요 · 장보기 목록도 다시 계산됩니다');render(true);return;
    }
    if(a==='addraw'){
      const k=$('mgAddKey').value,q=Number($('mgAddQty').value),unit=$('mgAddUnit').value,gpu=Number($('mgAddGram').value)||null,loc=$('mgAddLoc').value;
      if(!Number.isFinite(q)||q<0)return toast('재고 수량을 확인해 주세요');
      if(unit!=='g'&&!gpu)return toast('개·팩은 1개·1팩당 g도 입력해 주세요');
      inventory[k]={...(inventory[k]||{}),qty:q,unit,gramsPerUnit:unit==='g'?null:gpu,location:loc,memo:inventory[k]?.memo||'',updatedAt:Date.now()};persistInventoryLocal();try{pushInventoryItem(k)}catch(_){}toast(`${invName(k)} 재고를 추가했어요`);render(true);return;
    }
    if(a==='cubesave'){
      const b=cubeBatches();document.querySelectorAll('[data-cq]').forEach(x=>{const i=Number(x.dataset.cq);if(b[i]){b[i].remainingCount=Math.max(0,Math.round(Number(x.value)||0));b[i].updatedAt=Date.now()}});localStorage.setItem('dj:cubeInventory2',JSON.stringify(b));localStorage.setItem('dj:cubeInventoryRefreshedAt',new Date().toISOString());toast('냉동큐브 재고를 갱신했어요 · 장보기 목록도 다시 계산됩니다');render(true);return;
    }
    if(a==='shopclear'){
      for(const w of windows())shopChk[checkKey(w)]=[];await store.set('shop2',shopChk);render(true);return;
    }
  },true);

  try{bar();render(true)}catch(e){}
})();