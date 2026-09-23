/* Auto-bundled legacy management chain for v78 fast boot.
 * Source order is intentionally preserved: v29 -> v30 -> v31 -> v32 -> v32-1 -> v33 -> v34 -> v35.
 * Do not reorder without revalidating cumulative patches.
 */

/* ===== legacy-management-v29.js ===== */
(function(){
  'use strict';
  if(typeof TABS==='undefined'||typeof vShop!=='function'||typeof weekList!=='function'||typeof sheetBatch!=='function')return;

  TABS[1][1]='준비';
  window.__mgStage='home';

  const MG_HISTORY_KEY='__dojunManagementStageV60';
  function mgHistory(next,mode='push'){
    try{
      const state={...(history.state||{})};
      if(next==='home')delete state[MG_HISTORY_KEY];else state[MG_HISTORY_KEY]=next;
      history[mode==='replace'?'replaceState':'pushState'](state,'',location.href);
    }catch(e){}
  }
  function setManagementStage(next){
    const cur=window.__mgStage||'home';
    if(next===cur){render();return}
    if(next==='home'){
      try{if(history.state?.[MG_HISTORY_KEY]){history.back();return}}catch(e){}
      window.__mgStage='home';mgHistory('home','replace');render();return;
    }
    window.__mgStage=next;
    mgHistory(next,cur==='home'?'push':'replace');
    render();
  }
  window.addEventListener('popstate',function(){
    if(window.__mgStage!=='home'){
      window.__mgStage='home';
      try{render()}catch(e){}
    }
  });

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
    if(tabBtn){window.__mgStage='stock';mgHistory('stock','replace')}

    const prepBtn=e.target.closest&&e.target.closest('[data-mgprep]');
    if(prepBtn){e.preventDefault();e.stopImmediatePropagation();const w=windows().find(x=>x.id===prepBtn.dataset.mgprep);if(w)sheetBatch(w.start,w.count);return}

    const check=e.target.closest&&e.target.closest('[data-mgcheck]');
    if(check){e.preventDefault();e.stopImmediatePropagation();const[id,enc]=check.dataset.mgcheck.split('|'),w=windows().find(x=>x.id===id),name=decodeURIComponent(enc);if(!w)return;const key=checkKey(w),list=shopChk[key]||(shopChk[key]=[]),i=list.indexOf(name);i<0?list.push(name):list.splice(i,1);await store.set('shop2',shopChk);render(true);return}

    const t=e.target.closest&&e.target.closest('[data-mg]');if(!t)return;
    const a=t.dataset.mg;e.preventDefault();e.stopImmediatePropagation();
    if(['home','stock','shop','prep','remain'].includes(a)){setManagementStage(a);return}
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

/* ===== legacy-management-v30.js ===== */
(function(){
  'use strict';
  if(typeof vShop!=='function'||typeof inventory==='undefined'||typeof inventoryKeys!=='function'||typeof sheetBatch!=='function')return;

  const v29Shop=vShop;
  const v29SheetBatch=sheetBatch;
  const esc30=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const cubeBatches30=()=>{try{const v=JSON.parse(localStorage.getItem('dj:cubeInventory2')||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}};
  const norm30=n=>{n=String(n||'').trim();return ['진밥','밥','밥 (조리 후)'].includes(n)?'밥 (조리 후)':n};
  const ingredientName30=k=>norm30(invName(k));
  const cubeName30=b=>norm30(b.ingredient);
  const fixedUnit30=k=>{
    const A=stage(today),x=byK[k];
    if(k==='rice')return A.rice;
    if(!x)return 20;
    if(x.cat==='v')return A.veg;
    if(x.cat==='f')return A.fruit;
    if(x.k==='tofu')return A.tofu;
    if(x.fish)return A.fish;
    if(x.cat==='p')return A.meat;
    return 20;
  };
  const nav30=()=>`<div class="card" style="padding:10px;margin-bottom:12px"><div class="chips" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px"><button class="chip ${window.__mgStage==='stock'?'ok':''}" data-mg="stock">1 재고관리</button><button class="chip" data-mg="shop">2 장보기</button><button class="chip" data-mg="prep">3 식단만들기</button></div><div style="margin-top:9px"><button class="more" data-mg="home">‹ 이번 주 식단표로</button></div></div>`;

  function rawRow30(k,v){
    return `<div class="inventory-row"><div style="flex:1"><b>${esc30(invName(k))}</b><div style="display:flex;gap:6px;align-items:center;margin-top:4px"><input data-rq="${esc30(k)}" type="number" min="0" step="0.1" value="${Number(v.qty)||0}" style="width:82px;border:1px solid var(--line);border-radius:9px;padding:6px"> <span>${esc30(v.unit)} · ${esc30(v.location)}</span></div><div class="hint">${v.gramsPerUnit?`1${esc30(v.unit)}=${v.gramsPerUnit}g · `:''}${esc30(v.memo||'')}</div></div><button class="btn" data-a="invedit:${esc30(k)}">수정</button></div>`;
  }
  function freezerTotalRows30(){
    return Object.entries(inventory||{}).filter(([,v])=>v.location==='냉동').map(([k,v])=>`<div class="inventory-row"><div style="flex:1"><b>${esc30(invName(k))}</b><div>${Number(v.qty)||0}${esc30(v.unit)} · 총량형 냉동재고</div><div class="hint">아직 큐브 단위로 등록된 재고는 아니에요.</div></div><span class="chip sm">총량형</span></div>`).join('');
  }
  function cubeRows30(){
    return cubeBatches30().map((b,i)=>`<div class="inventory-row"><div style="flex:1"><b>${esc30(b.code||'-')} · ${esc30(b.ingredient||'')}</b><div style="margin-top:4px">${Number(b.unitG)||0}g × <input data-cq="${i}" type="number" min="0" step="1" value="${Number(b.remainingCount)||0}" style="width:68px;border:1px solid var(--line);border-radius:9px;padding:6px">개</div><div class="hint">${esc30(b.madeDate||'')} · 냉동</div></div><span class="chip sm">큐브형 · ${Math.round((Number(b.unitG)||0)*(Number(b.remainingCount)||0))}g</span></div>`).join('');
  }
  function stockView30(){
    const normal=Object.entries(inventory||{}).filter(([,v])=>v.location!=='냉동').map(([k,v])=>rawRow30(k,v)).join('');
    const opts=inventoryKeys().map(k=>`<option value="${esc30(k)}">${esc30(invName(k))}</option>`).join('');
    return `${nav30()}<div class="sec"><h2>1단계 · 재고관리</h2><span class="more">실재고 기준</span></div>
      <p class="hint">냉장·실온 식재료와 냉동 재고를 나눠 보여줘요. 냉동도 <b>총량형</b>과 <b>큐브형</b>을 따로 구분합니다.</p>
      <div class="card"><b>우리집 식재료</b>${normal||'<p class="hint">냉장·실온 재고가 없어요.</p>'}<div class="btnrow"><button class="btn pri" data-mg="rawsave">실재고 갱신</button></div></div>
      <div class="sec"><h2>냉동 재고</h2></div><div class="card"><div class="hint" style="margin-bottom:8px"><b style="color:var(--ink)">총량형 냉동재고</b>는 120g처럼 총량만 알고 있는 재고, <b style="color:var(--ink)">큐브형</b>은 20g × 6개처럼 1개 단위가 정해진 재고예요.</div>${freezerTotalRows30()||'<p class="hint">총량형 냉동재고가 없어요.</p>'}<div style="border-top:1px solid var(--line2);margin:12px 0"></div>${cubeRows30()||'<p class="hint">등록된 냉동 큐브가 없어요.</p>'}<div class="btnrow"><button class="btn pri" data-mg="cubesave">냉동큐브 재고 갱신</button></div></div>
      <div class="sec"><h2>식재료 추가</h2></div><div class="card"><div class="fld"><label>재료</label><select id="mgAddKey">${opts}</select></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="fld"><label>현재량</label><input id="mgAddQty" type="number" min="0" step="0.1" placeholder="예: 120"></div><div class="fld"><label>단위</label><select id="mgAddUnit"><option>g</option><option>개</option><option>팩</option></select></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="fld"><label>1개·1팩당 g</label><input id="mgAddGram" type="number" min="0.1" step="0.1" placeholder="g이면 비워도 됨"></div><div class="fld"><label>보관</label><select id="mgAddLoc"><option>냉동</option><option>냉장</option><option>실온</option></select></div></div><div class="btnrow"><button class="btn pri" data-mg="addraw">재고에 추가</button></div></div>
      <div class="sec"><h2>냉동 큐브 추가</h2></div><div class="card"><p class="hint">큐브는 1개 기준량을 고정해서 저장해요. 현재 월령 식단의 기본 준비량을 자동으로 넣어두고 필요하면 바꿀 수 있어요.</p><div class="fld"><label>재료</label><select id="mg30CubeKey">${opts}</select></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="fld"><label>1개 기준량(g)</label><input id="mg30CubeUnit" type="number" min="1" step="1" value="${fixedUnit30('rice')}"></div><div class="fld"><label>현재 개수</label><input id="mg30CubeCount" type="number" min="0" step="1" placeholder="예: 6"></div></div><div class="fld"><label>제조일</label><input id="mg30CubeDate" type="date" value="${today}"></div><div class="btnrow"><button class="btn pri" data-mg30="cubeadd">냉동큐브에 추가</button></div></div>`;
  }

  vShop=function(){
    if(window.__mgStage==='stock')return stockView30();
    return v29Shop();
  };

  function stockSplit30(name){
    let frozen=0,fresh=0;
    for(const [k,v] of Object.entries(inventory||{})){
      if(ingredientName30(k)!==name)continue;
      let g=0;if(v.unit==='g')g=Number(v.qty)||0;else if(Number(v.gramsPerUnit)>0)g=(Number(v.qty)||0)*Number(v.gramsPerUnit);
      if(v.location==='냉동')frozen+=g;else fresh+=g;
    }
    return{frozen,fresh};
  }
  function cubeG30(name){let g=0;for(const b of cubeBatches30())if(cubeName30(b)===name)g+=(Number(b.unitG)||0)*(Number(b.remainingCount)||0);return g}
  function commonPrepCard30(sun,count){
    const b=batchPlan(sun,count);if(!b||!b.common||!b.common.length)return'';
    const rows=b.common.map(r=>{
      const name=norm30(r.name),need=Math.max(0,Number(r.g)||0),cubeUse=Math.min(need,cubeG30(name)),left=Math.max(0,need-cubeUse),raw=stockSplit30(name),frozenUse=Math.min(left,raw.frozen),freshNeed=Math.max(0,left-frozenUse),freshUse=Math.min(freshNeed,raw.fresh),shortage=Math.max(0,freshNeed-freshUse);
      return `<div style="padding:10px 0;border-top:1px solid var(--line2)"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc30(r.name)}</b><b>${Math.ceil(need)}g 필요</b></div><div class="hint" style="margin-top:4px">기존 냉동 큐브 <b style="color:var(--mint)">${Math.ceil(cubeUse)}g</b> · 냉동 총량재고 ${Math.ceil(frozenUse)}g · 새로 손질 ${Math.ceil(freshNeed)}g${shortage?` · <b style="color:var(--berry)">${Math.ceil(shortage)}g 부족</b>`:''}</div></div>`;
    }).join('');
    return `<div class="card" id="mg30-prep-split" style="margin:12px 0"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>공통재료 준비 구분</b><span class="chip sm">수량 고정</span></div><p class="hint" style="margin:6px 0 0">기존 냉동은 현재 재고에서 자동으로 고정 계산하고, 나머지만 <b>새로 손질할 양</b>으로 보여줘요.</p>${rows}</div>`;
  }

  sheetBatch=function(sun,count=7){
    v29SheetBatch(sun,count);
    try{
      const html=commonPrepCard30(sun,count);if(!html)return;
      const grab=sheet.querySelector('.grab');
      if(grab)grab.insertAdjacentHTML('afterend',html);else sheet.insertAdjacentHTML('afterbegin',html);
    }catch(e){}
  };

  document.addEventListener('change',function(e){
    if(e.target&&e.target.id==='mg30CubeKey'){
      const k=e.target.value,u=document.getElementById('mg30CubeUnit');if(u)u.value=fixedUnit30(k);
    }
  },true);
  document.addEventListener('click',function(e){
    const t=e.target.closest&&e.target.closest('[data-mg30]');if(!t)return;
    if(t.dataset.mg30==='cubeadd'){
      e.preventDefault();e.stopImmediatePropagation();
      const k=document.getElementById('mg30CubeKey').value,name=invName(k),unitG=Math.max(1,Math.round(Number(document.getElementById('mg30CubeUnit').value)||0)),count=Math.max(0,Math.round(Number(document.getElementById('mg30CubeCount').value)||0)),madeDate=document.getElementById('mg30CubeDate').value||today;
      if(!count)return toast('냉동큐브 개수를 입력해 주세요');
      const b=cubeBatches30(),same=b.filter(x=>cubeName30(x)===norm30(name)&&Number(x.unitG)===unitG),code=same.length?(same[same.length-1].code||`${k}-${unitG}`):`${k}-${unitG}`;
      b.push({ingredient:name,code,unitG,originalCount:count,remainingCount:count,madeDate,location:'냉동',history:[{at:new Date().toISOString(),type:'manual_stock_in',count}]});
      localStorage.setItem('dj:cubeInventory2',JSON.stringify(b));localStorage.setItem('dj:cubeInventoryRefreshedAt',new Date().toISOString());toast(`${name} ${unitG}g × ${count}개를 냉동큐브에 추가했어요`);render(true);
    }
  },true);

  try{render(true)}catch(e){}
})();

/* ===== legacy-management-v31.js ===== */
(function(){
  'use strict';
  if(typeof vShop!=='function'||typeof inventory==='undefined'||typeof inventoryKeys!=='function'||typeof sheetBatch!=='function')return;
  const prevShop=vShop, prevSheetBatch=sheetBatch;
  const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const norm=n=>{n=String(n||'').trim();return ['진밥','밥','밥 (조리 후)'].includes(n)?'밥 (조리 후)':n};
  const cubes=()=>{try{const v=JSON.parse(localStorage.getItem('dj:cubeInventory2')||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}};
  const unitFor=k=>{const A=stage(today),x=byK[k];if(k==='rice')return A.rice;if(!x)return 20;if(x.cat==='v')return A.veg;if(x.cat==='f')return A.fruit;if(x.k==='tofu')return A.tofu;if(x.fish)return A.fish;if(x.cat==='p')return A.meat;return 20};
  const windows=()=>[
    {id:'first',start:weekCur,count:4,title:'1차',range:'월~목 4일치'},
    {id:'second',start:addD(weekCur,4),count:3,title:'2차',range:'금~일 3일치'}
  ];
  const checkKey=w=>`mg29|${w.start}`;
  const nav=()=>`<div class="card" style="padding:10px;margin-bottom:12px"><div class="chips" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px"><button class="chip ${window.__mgStage==='stock'?'ok':''}" data-mg="stock">1 재고관리</button><button class="chip ${window.__mgStage==='shop'?'ok':''}" data-mg="shop">2 장보기</button><button class="chip ${window.__mgStage==='prep'?'ok':''}" data-mg="prep">3 식단만들기</button></div><div style="margin-top:9px"><button class="more" data-mg="home">‹ 이번 주 식단표로</button></div></div>`;

  function nextCode(used){let n=1;while(used.has(`A-${n}`))n++;return`A-${n}`}
  function ensureStockCodes(){
    const used=new Set(),cb=cubes();let rawChanged=false,cubeChanged=false;
    for(const v of Object.values(inventory||{}))if(/^A-\d+$/.test(String(v.stockCode||'')))used.add(v.stockCode);
    for(const b of cb)if(/^A-\d+$/.test(String(b.stockCode||'')))used.add(b.stockCode);
    for(const k of Object.keys(inventory||{}).sort()){
      const v=inventory[k];if(!v.stockCode){v.stockCode=nextCode(used);used.add(v.stockCode);rawChanged=true}
    }
    for(const b of cb){if(!b.stockCode){b.stockCode=nextCode(used);used.add(b.stockCode);cubeChanged=true}}
    if(rawChanged){try{persistInventoryLocal()}catch(e){};if(typeof pushInventoryItem==='function')for(const k of Object.keys(inventory||{})){try{pushInventoryItem(k)}catch(e){}}}
    if(cubeChanged)localStorage.setItem('dj:cubeInventory2',JSON.stringify(cb));
    return cb;
  }
  function grams(v){if(!v)return 0;if(v.unit==='g')return Math.max(0,Number(v.qty)||0);if(Number(v.gramsPerUnit)>0)return Math.max(0,(Number(v.qty)||0)*Number(v.gramsPerUnit));return 0}
  function totals(){
    const cb=ensureStockCodes(),out={};
    const row=name=>{name=norm(name);return out[name]||(out[name]={name,totalG:0,fridgeG:0,freezerG:0,roomG:0,cubeG:0,count:0,codes:[]})};
    for(const [k,v] of Object.entries(inventory||{})){
      const r=row(invName(k)),g=grams(v),q=Math.max(0,Number(v.qty)||0),loc=v.location||'냉동';r.totalG+=g;
      if(loc==='냉장')r.fridgeG+=g;else if(loc==='실온')r.roomG+=g;else r.freezerG+=g;
      if(!g&&v.unit==='개')r.count+=q;if(v.stockCode&&!r.codes.includes(v.stockCode))r.codes.push(v.stockCode);
    }
    for(const b of cb){const r=row(b.ingredient),g=Math.max(0,(Number(b.unitG)||0)*(Number(b.remainingCount)||0));r.totalG+=g;r.freezerG+=g;r.cubeG+=g;if(b.stockCode&&!r.codes.includes(b.stockCode))r.codes.push(b.stockCode)}
    return out;
  }
  function totalSummary(){
    const rows=Object.values(totals()).filter(r=>r.totalG>0||r.count>0).sort((a,b)=>a.name.localeCompare(b.name,'ko'));
    if(!rows.length)return '<p class="hint">등록된 재고가 없어요.</p>';
    return rows.map(r=>`<div class="inventory-row"><div style="flex:1"><b>${esc(r.name)}</b><div class="hint">재고번호 ${esc(r.codes.join(', ')||'-')} · ${r.fridgeG?`냉장 ${Math.ceil(r.fridgeG)}g · `:''}${r.freezerG?`냉동 ${Math.ceil(r.freezerG)}g · `:''}${r.roomG?`실온 ${Math.ceil(r.roomG)}g`:''}${r.count?`${r.totalG?' · ':''}${Math.ceil(r.count)}개`:''}</div></div><b>${r.totalG?`${Math.ceil(r.totalG)}g`:`${Math.ceil(r.count)}개`}</b></div>`).join('');
  }
  function rawRow(k,v){return `<div class="inventory-row"><div style="flex:1"><div style="display:flex;gap:7px;align-items:center"><span class="chip sm">${esc(v.stockCode||'-')}</span><b>${esc(invName(k))}</b></div><div style="display:flex;gap:6px;align-items:center;margin-top:5px"><input data-rq="${esc(k)}" type="number" min="0" step="0.1" value="${Number(v.qty)||0}" style="width:82px;border:1px solid var(--line);border-radius:9px;padding:6px"> <span>${esc(v.unit)}</span></div><div class="hint">${v.gramsPerUnit?`1${esc(v.unit)}=${v.gramsPerUnit}g · `:''}${esc(v.memo||'')}</div></div><button class="btn" data-a="invedit:${esc(k)}">수정</button></div>`}
  function cubeRow(b,i){return `<div class="inventory-row"><div style="flex:1"><div style="display:flex;gap:7px;align-items:center"><span class="chip sm">${esc(b.stockCode||'-')}</span><b>${esc(b.ingredient||'')}</b></div><div style="margin-top:5px">${Number(b.unitG)||0}g × <input data-cq="${i}" type="number" min="0" step="1" value="${Number(b.remainingCount)||0}" style="width:68px;border:1px solid var(--line);border-radius:9px;padding:6px">개</div><div class="hint">${esc(b.madeDate||'')} · 소분 냉동</div></div><span class="chip sm">${Math.round((Number(b.unitG)||0)*(Number(b.remainingCount)||0))}g</span></div>`}
  function groupRows(loc){const cb=ensureStockCodes();let html=Object.entries(inventory||{}).filter(([,v])=>(v.location||'냉동')===loc).map(([k,v])=>rawRow(k,v)).join('');if(loc==='냉동')html+=cb.map(cubeRow).join('');return html||`<p class="hint">${loc} 보관 재고가 없어요.</p>`}
  function stockView(){
    ensureStockCodes();const opts=inventoryKeys().map(k=>`<option value="${esc(k)}">${esc(invName(k))}</option>`).join('');
    return `${nav()}<div class="sec"><h2>1단계 · 재고관리</h2><span class="more">총량 + 재고번호</span></div>
      <p class="hint">재고는 복잡하게 나누지 않고 <b>냉장 / 냉동 / 실온</b>으로만 봐요. 핵심은 재료별 <b>총 보유량</b>과 붙여둘 <b>재고번호</b>예요.</p>
      <div class="card"><b>재료별 총 보유량</b>${totalSummary()}</div>
      <div class="sec"><h2>냉장</h2></div><div class="card">${groupRows('냉장')}</div>
      <div class="sec"><h2>냉동</h2></div><div class="card">${groupRows('냉동')}<div class="btnrow"><button class="btn pri" data-mg="cubesave">냉동 수량 갱신</button></div></div>
      <div class="sec"><h2>실온</h2></div><div class="card">${groupRows('실온')}</div>
      <div class="btnrow"><button class="btn pri" data-mg="rawsave">전체 실재고 갱신</button></div>
      <div class="sec"><h2>재고 추가</h2></div><div class="card"><p class="hint">추가하면 앱이 A-1, A-2처럼 재고번호를 자동으로 붙여줘요. 그 번호를 실제 용기에도 붙이면 됩니다.</p><div class="fld"><label>재료</label><select id="mgAddKey">${opts}</select></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="fld"><label>현재량</label><input id="mgAddQty" type="number" min="0" step="0.1" placeholder="예: 120"></div><div class="fld"><label>단위</label><select id="mgAddUnit"><option>g</option><option>개</option><option>팩</option></select></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="fld"><label>1개·1팩당 g</label><input id="mgAddGram" type="number" min="0.1" step="0.1" placeholder="g이면 비워도 됨"></div><div class="fld"><label>보관</label><select id="mgAddLoc"><option>냉장</option><option>냉동</option><option>실온</option></select></div></div><div class="btnrow"><button class="btn pri" data-mg="addraw">재고에 추가</button></div></div>
      <div class="sec"><h2>소분 냉동 추가</h2></div><div class="card"><p class="hint">20g × 6개처럼 소분한 것만 입력해요. 별도 재고번호가 자동 부여되고 총 보유량에 바로 합산돼요.</p><div class="fld"><label>재료</label><select id="mg30CubeKey">${opts}</select></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="fld"><label>1개 기준량(g)</label><input id="mg30CubeUnit" type="number" min="1" step="1" value="${unitFor('rice')}"></div><div class="fld"><label>현재 개수</label><input id="mg30CubeCount" type="number" min="0" step="1" placeholder="예: 6"></div></div><div class="fld"><label>제조일</label><input id="mg30CubeDate" type="date" value="${today}"></div><div class="btnrow"><button class="btn pri" data-mg30="cubeadd">냉동에 추가</button></div></div>`;
  }

  function requirements(w){const t=weekList(w.start,w.count);let rice=0;for(let d=0;d<w.count;d++){const on=addD(w.start,d);for(let i=0;i<3;i++)if(mObj(on,i))rice+=stage(on).rice}if(rice)t['밥 (조리 후)']={c:'e',g:rice,n:0};return t}
  function allocation(){
    const t=totals(),poolG={},poolN={};for(const r of Object.values(t)){poolG[r.name]=r.totalG||0;poolN[r.name]=r.count||0}
    const result={};for(const w of windows()){
      const rows={};for(const [name0,v] of Object.entries(requirements(w))){const name=norm(name0),needG=Math.max(0,Number(v.g)||0),needN=Math.max(0,Number(v.n)||0);
        if(needG>0){const have=Math.min(needG,poolG[name]||0);poolG[name]=Math.max(0,(poolG[name]||0)-have);rows[name]={name,needG,haveG:have,buyG:Math.max(0,needG-have)}}
        else if(needN>0){const have=Math.min(needN,poolN[name]||0);poolN[name]=Math.max(0,(poolN[name]||0)-have);rows[name]={name,needN,haveN:have,buyN:Math.max(0,needN-have)}}
      }result[w.id]=rows;
    }return result;
  }
  function checked(w,name){const list=shopChk?.[checkKey(w)]||[];return list.includes(name)}
  function shoppingRows(w,rows){const a=Object.values(rows).filter(x=>(x.buyG||0)>0||(x.buyN||0)>0);if(!a.length)return '<p class="hint"><b>추가 구매 없음.</b> 현재 보유량으로 준비 가능해요.</p>';return a.map(x=>{const on=checked(w,x.name),qty=x.buyG!==undefined?`${Math.ceil(x.buyG)}g`:`${Math.ceil(x.buyN)}개`,have=x.haveG!==undefined?`${Math.ceil(x.haveG)}g`:`${Math.ceil(x.haveN)}개`;return `<div class="shop${on?' on':''}" data-mgcheck="${w.id}|${encodeURIComponent(x.name)}"><div class="bx"></div><div class="nm">${esc(x.name)}<div class="hint">필요 ${x.needG!==undefined?Math.ceil(x.needG)+'g':Math.ceil(x.needN)+'개'} · 현재 보유 ${have}</div></div><div class="qt"><b>${qty}</b><div class="hint">${on?'구매완료':'추가 구매'}</div></div></div>`}).join('')}
  function shopView(){const a=allocation();return `${nav()}<div class="sec"><h2>2단계 · 장보기</h2><span class="more">부족분만</span></div><p class="hint">식단에 필요한 총량과 현재 보유 총량을 비교해서 <b>추가로 얼마나 사야 하는지만</b> 보여줘요. 원물 재고는 여기서 보고 최종 구매 여부를 판단하면 됩니다.</p>${windows().map(w=>`<div class="sec"><h2>${w.title} 장보기</h2><span class="more">${w.range}</span></div><div class="card">${shoppingRows(w,a[w.id])}</div>`).join('')}<div class="btnrow"><button class="btn" data-mg="shopclear">장보기 체크 해제</button><button class="btn pri" data-mg="prep">3단계 식단만들기 ›</button></div>`}
  function prepRows(w,rows){const all=Object.values(rows);let ready=0;const html=all.map(x=>{const missing=x.buyG!==undefined?x.buyG:x.buyN||0,on=missing<=0||checked(w,x.name);if(on)ready++;const need=x.needG!==undefined?`${Math.ceil(x.needG)}g`:`${Math.ceil(x.needN)}개`,have=x.haveG!==undefined?`${Math.ceil(x.haveG)}g`:`${Math.ceil(x.haveN)}개`,buy=x.buyG!==undefined?`${Math.ceil(x.buyG)}g`:`${Math.ceil(x.buyN||0)}개`;return `<div class="inventory-row"><div style="flex:1"><b>${esc(x.name)}</b><div class="hint">필요 ${need} · 보유 ${have}${missing>0?` · 추가 구매 ${buy}`:''}</div></div><span class="chip sm ${on?'ok':''}">${on?'준비완료':'구매 필요'}</span></div>`}).join('');return{html,ready,total:all.length}}
  function prepView(){const a=allocation();return `${nav()}<div class="sec"><h2>3단계 · 식단만들기</h2><span class="more">최종 준비상태</span></div><p class="hint">여기서는 <b>최종 식단 재료가 전부 준비됐는지</b>만 확인하고 상세 만들기로 들어가면 돼요.</p>${windows().map(w=>{const s=prepRows(w,a[w.id]);return `<div class="card" style="margin:10px 0"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>${w.title} · ${w.range}</b><span class="chip sm ${s.ready===s.total?'ok':''}">${s.ready}/${s.total} 준비</span></div>${s.html}<button class="btn pri" style="width:100%;margin-top:10px" data-mgprep="${w.id}">상세 만들기 ›</button></div>`}).join('')}`}

  vShop=function(){ensureStockCodes();if(window.__mgStage==='stock')return stockView();if(window.__mgStage==='shop')return shopView();if(window.__mgStage==='prep')return prepView();return prevShop()};

  function frozenTotal(name){let g=0;for(const [k,v] of Object.entries(inventory||{})){if(norm(invName(k))!==name||v.location!=='냉동')continue;g+=grams(v)}for(const b of cubes())if(norm(b.ingredient)===name)g+=(Number(b.unitG)||0)*(Number(b.remainingCount)||0);return g}
  function prepCard(sun,count){const b=batchPlan(sun,count);if(!b?.common?.length)return'';const rows=b.common.map(r=>{const name=norm(r.name),need=Math.max(0,Number(r.g)||0),frozen=Math.min(need,frozenTotal(name)),toHandle=Math.max(0,need-frozen);return `<div style="padding:10px 0;border-top:1px solid var(--line2)"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(r.name)}</b><b>${Math.ceil(need)}g 필요</b></div><div class="hint" style="margin-top:4px">기존 냉동 <b style="color:var(--mint)">${Math.ceil(frozen)}g</b> · 새로 손질 <b>${Math.ceil(toHandle)}g</b></div></div>`}).join('');return `<div class="card" id="mg31-prep-split" style="margin:12px 0"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>공통재료 준비</b><span class="chip sm">자동 계산</span></div><p class="hint" style="margin:6px 0 0">기존 냉동은 고정 반영하고, 나머지만 새로 손질할 양으로 보여줘요.</p>${rows}</div>`}
  sheetBatch=function(sun,count=7){prevSheetBatch(sun,count);try{sheet.querySelector('#mg30-prep-split')?.remove();sheet.querySelector('#mg31-prep-split')?.remove();const html=prepCard(sun,count);if(!html)return;const grab=sheet.querySelector('.grab');if(grab)grab.insertAdjacentHTML('afterend',html);else sheet.insertAdjacentHTML('afterbegin',html)}catch(e){}};
  try{ensureStockCodes();render(true)}catch(e){}
})();

/* ===== legacy-management-v32.js ===== */
(function(){
  'use strict';
  if(typeof vShop!=='function'||typeof inventory==='undefined'||typeof inventoryKeys!=='function')return;

  const prevShop=vShop;
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const cubes=()=>{try{const v=JSON.parse(localStorage.getItem('dj:cubeInventory2')||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}};
  const saveCubes=v=>localStorage.setItem('dj:cubeInventory2',JSON.stringify(v));
  const nav=()=>`<div class="card" style="padding:10px;margin-bottom:12px"><div class="chips" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px"><button class="chip ${window.__mgStage==='stock'?'ok':''}" data-mg="stock">1 재고관리</button><button class="chip ${window.__mgStage==='shop'?'ok':''}" data-mg="shop">2 장보기</button><button class="chip ${window.__mgStage==='prep'?'ok':''}" data-mg="prep">3 식단만들기</button></div><div style="margin-top:9px"><button class="more" data-mg="home">‹ 이번 주 식단표로</button></div></div>`;

  function nextCode(used){let n=1;while(used.has(`A-${n}`))n++;return `A-${n}`}
  function ensureCodes(){
    const cb=cubes(),used=new Set(),rawKeys=Object.keys(inventory||{});let rawChanged=false,cubeChanged=false;
    for(const v of Object.values(inventory||{}))if(/^A-\d+$/.test(String(v.stockCode||'')))used.add(v.stockCode);
    for(const b of cb)if(/^A-\d+$/.test(String(b.stockCode||'')))used.add(b.stockCode);
    for(const k of rawKeys.sort())if(!inventory[k].stockCode){inventory[k].stockCode=nextCode(used);used.add(inventory[k].stockCode);rawChanged=true}
    for(const b of cb)if(!b.stockCode){b.stockCode=nextCode(used);used.add(b.stockCode);cubeChanged=true}
    if(rawChanged){try{persistInventoryLocal()}catch(e){};if(typeof pushInventoryItem==='function')for(const k of rawKeys){try{pushInventoryItem(k)}catch(e){}}}
    if(cubeChanged)saveCubes(cb);
    return cb;
  }
  function usedCodes(){ensureCodes();const s=new Set();for(const v of Object.values(inventory||{}))if(v.stockCode)s.add(v.stockCode);for(const b of cubes())if(b.stockCode)s.add(b.stockCode);return s}
  function grams(v){if(!v)return 0;if(v.unit==='g')return Math.max(0,Number(v.qty)||0);if(Number(v.gramsPerUnit)>0)return Math.max(0,(Number(v.qty)||0)*Number(v.gramsPerUnit));return 0}
  function unitFor(k){try{const A=stage(today),x=byK[k];if(k==='rice')return A.rice;if(!x)return 20;if(x.cat==='v')return A.veg;if(x.cat==='f')return A.fruit;if(x.k==='tofu')return A.tofu;if(x.fish)return A.fish;if(x.cat==='p')return A.meat}catch(e){}return 20}

  function rawRow(k,v){
    const total=grams(v),portion=v.unit==='개'&&Number(v.gramsPerUnit)>0;
    return `<div class="inventory-row"><div style="flex:1"><div style="display:flex;gap:7px;align-items:center"><span class="chip sm">${esc(v.stockCode||'-')}</span><b>${esc(invName(k))}</b></div><div style="margin-top:6px;display:flex;align-items:center;gap:6px"><input data-rq="${esc(k)}" type="number" min="0" step="0.1" value="${Number(v.qty)||0}" style="width:82px;border:1px solid var(--line);border-radius:9px;padding:6px"><span>${esc(v.unit)}</span>${portion?`<span class="hint">× ${Number(v.gramsPerUnit)}g = ${Math.ceil(total)}g</span>`:''}</div><div class="hint">${esc(v.location||'')} ${portion?'· 소분':''}</div></div><button class="btn" data-a="invedit:${esc(k)}">수정</button></div>`;
  }
  function cubeRow(b,i){
    const total=Math.max(0,(Number(b.unitG)||0)*(Number(b.remainingCount)||0));
    return `<div class="inventory-row"><div style="flex:1"><div style="display:flex;gap:7px;align-items:center"><span class="chip sm">${esc(b.stockCode||'-')}</span><b>${esc(b.ingredient||'')}</b></div><div style="margin-top:6px"><input data-cq="${i}" type="number" min="0" step="1" value="${Number(b.remainingCount)||0}" style="width:68px;border:1px solid var(--line);border-radius:9px;padding:6px">개 <span class="hint">× ${Number(b.unitG)||0}g = ${Math.ceil(total)}g</span></div><div class="hint">냉동 · 소분${b.madeDate?` · ${esc(b.madeDate)}`:''}</div></div></div>`;
  }
  function groupRows(loc){
    const cb=ensureCodes();let html=Object.entries(inventory||{}).filter(([,v])=>(v.location||'냉동')===loc).map(([k,v])=>rawRow(k,v)).join('');
    if(loc==='냉동')html+=cb.map(cubeRow).join('');
    return html||`<p class="hint">${loc} 재고가 없어요.</p>`;
  }
  function totalSummary(){
    const out={};const row=n=>out[n]||(out[n]={name:n,g:0,n:0,codes:[]});
    ensureCodes();
    for(const [k,v] of Object.entries(inventory||{})){const r=row(invName(k)),g=grams(v);if(g)r.g+=g;else if(v.unit==='개')r.n+=Math.max(0,Number(v.qty)||0);if(v.stockCode&&!r.codes.includes(v.stockCode))r.codes.push(v.stockCode)}
    for(const b of cubes()){const r=row(b.ingredient),g=Math.max(0,(Number(b.unitG)||0)*(Number(b.remainingCount)||0));r.g+=g;if(b.stockCode&&!r.codes.includes(b.stockCode))r.codes.push(b.stockCode)}
    const rows=Object.values(out).filter(x=>x.g>0||x.n>0).sort((a,b)=>a.name.localeCompare(b.name,'ko'));
    if(!rows.length)return '<p class="hint">등록된 재고가 없어요.</p>';
    return rows.map(r=>`<div class="inventory-row"><div style="flex:1"><b>${esc(r.name)}</b><div class="hint">재고번호 ${esc(r.codes.join(', ')||'-')}</div></div><b>${r.g?`${Math.ceil(r.g)}g`:`${Math.ceil(r.n)}개`}</b></div>`).join('');
  }

  function stockView(){
    ensureCodes();const opts=inventoryKeys().map(k=>`<option value="${esc(k)}">${esc(invName(k))}</option>`).join('');
    return `${nav()}<div class="sec"><h2>1단계 · 재고관리</h2><span class="more">한 곳에서 입력</span></div>
      <p class="hint">이제 <b>소분 냉동을 따로 등록하지 않아요.</b> 재료 추가에서 냉장/냉동과 입력 방식을 같이 고르면 됩니다.</p>
      <div class="card"><b>재료별 총 보유량</b>${totalSummary()}</div>
      <div class="sec"><h2>냉장</h2></div><div class="card">${groupRows('냉장')}</div>
      <div class="sec"><h2>냉동</h2></div><div class="card">${groupRows('냉동')}</div>
      ${Object.values(inventory||{}).some(v=>v.location==='실온')?`<div class="sec"><h2>실온</h2></div><div class="card">${groupRows('실온')}</div>`:''}
      <div class="btnrow"><button class="btn pri" data-mg32="save">재고 수량 갱신</button></div>
      <div class="sec"><h2>재료 추가</h2></div><div class="card"><p class="hint">추가하면 A-1, A-2처럼 재고번호가 자동으로 붙어요. 소분한 재료도 여기서 같이 입력합니다.</p>
        <div class="fld"><label>재료</label><select id="mg32Key">${opts}</select></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="fld"><label>보관</label><select id="mg32Loc"><option>냉장</option><option>냉동</option></select></div><div class="fld"><label>입력 방식</label><select id="mg32Mode"><option value="total">총량(g)</option><option value="count">개수(개)</option><option value="portion">소분(g × 개수)</option></select></div></div>
        <div id="mg32Total"><div class="fld"><label id="mg32QtyLabel">총량(g)</label><input id="mg32Qty" type="number" min="0" step="0.1" placeholder="예: 120"></div></div>
        <div id="mg32Portion" style="display:none"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="fld"><label>1개 기준량(g)</label><input id="mg32UnitG" type="number" min="1" step="1" value="${unitFor('rice')}"></div><div class="fld"><label>현재 개수</label><input id="mg32Count" type="number" min="0" step="1" placeholder="예: 6"></div></div><div class="fld"><label>제조일</label><input id="mg32Date" type="date" value="${today}"></div></div>
        <div class="btnrow"><button class="btn pri" data-mg32="add">재고에 추가</button></div></div>`;
  }

  vShop=function(){if(window.__mgStage==='stock')return stockView();return prevShop()};

  function syncMode(){
    const mode=document.getElementById('mg32Mode')?.value,total=document.getElementById('mg32Total'),portion=document.getElementById('mg32Portion'),label=document.getElementById('mg32QtyLabel');
    if(!mode)return;if(total)total.style.display=mode==='portion'?'none':'';if(portion)portion.style.display=mode==='portion'?'':'none';if(label)label.textContent=mode==='count'?'개수(개)':'총량(g)';
  }
  document.addEventListener('change',function(e){
    if(e.target?.id==='mg32Mode')syncMode();
    if(e.target?.id==='mg32Key'){const u=document.getElementById('mg32UnitG');if(u)u.value=unitFor(e.target.value)}
  },true);

  document.addEventListener('click',function(e){
    const t=e.target.closest&&e.target.closest('[data-mg32]');if(!t)return;e.preventDefault();e.stopImmediatePropagation();
    const a=t.dataset.mg32;
    if(a==='save'){
      document.querySelectorAll('[data-rq]').forEach(x=>{const k=x.dataset.rq;if(inventory[k]){inventory[k].qty=Math.max(0,Number(x.value)||0);inventory[k].updatedAt=Date.now();try{pushInventoryItem(k)}catch(_){}}});
      const cb=cubes();document.querySelectorAll('[data-cq]').forEach(x=>{const i=Number(x.dataset.cq);if(cb[i]){cb[i].remainingCount=Math.max(0,Math.round(Number(x.value)||0));cb[i].updatedAt=Date.now()}});saveCubes(cb);try{persistInventoryLocal()}catch(_){}localStorage.setItem('dj:cubeInventoryRefreshedAt',new Date().toISOString());toast('재고 수량을 갱신했어요 · 장보기에도 바로 반영됩니다');render(true);return;
    }
    if(a==='add'){
      const k=document.getElementById('mg32Key')?.value,loc=document.getElementById('mg32Loc')?.value||'냉장',mode=document.getElementById('mg32Mode')?.value||'total';if(!k)return;
      const code=nextCode(usedCodes());
      if(mode==='portion'){
        const unitG=Math.max(1,Math.round(Number(document.getElementById('mg32UnitG')?.value)||0)),count=Math.max(0,Math.round(Number(document.getElementById('mg32Count')?.value)||0)),madeDate=document.getElementById('mg32Date')?.value||today;if(!count)return toast('소분 개수를 입력해 주세요');
        if(loc==='냉동'){
          const cb=cubes();cb.push({ingredient:invName(k),stockCode:code,code,unitG,originalCount:count,remainingCount:count,madeDate,location:'냉동',history:[{at:new Date().toISOString(),type:'manual_stock_in',count}]});saveCubes(cb);
        }else{
          inventory[k]={...(inventory[k]||{}),stockCode:inventory[k]?.stockCode||code,qty:count,unit:'개',gramsPerUnit:unitG,location:loc,memo:'소분',updatedAt:Date.now()};try{persistInventoryLocal();pushInventoryItem(k)}catch(_){}
        }
        toast(`${invName(k)} ${unitG}g × ${count}개를 ${loc} 재고에 추가했어요`);render(true);return;
      }
      const q=Math.max(0,Number(document.getElementById('mg32Qty')?.value)||0);if(!q)return toast(mode==='count'?'개수를 입력해 주세요':'총량을 입력해 주세요');
      inventory[k]={...(inventory[k]||{}),stockCode:inventory[k]?.stockCode||code,qty:q,unit:mode==='count'?'개':'g',gramsPerUnit:null,location:loc,memo:'',updatedAt:Date.now()};try{persistInventoryLocal();pushInventoryItem(k)}catch(_){}toast(`${invName(k)} ${q}${mode==='count'?'개':'g'}를 ${loc} 재고에 추가했어요`);render(true);return;
    }
  },true);

  try{render(true)}catch(e){}
})();

/* ===== legacy-management-v32-1.js ===== */
(function(){
  'use strict';
  if(typeof vShop!=='function')return;
  const prevShop=vShop;
  vShop=function(){
    const html=prevShop();
    if(window.__mgStage!=='stock'||typeof html!=='string')return html;
    return html.replace(
      '<select id="mg32Loc"><option>냉장</option><option>냉동</option></select>',
      '<select id="mg32Loc"><option>냉장</option><option>냉동</option><option>실온</option></select>'
    ).replace(
      '재료 추가에서 냉장/냉동과 입력 방식을 같이 고르면 됩니다.',
      '재료 추가에서 냉장/냉동/실온과 입력 방식을 같이 고르면 됩니다.'
    );
  };
  try{render(true)}catch(e){}
})();

/* ===== legacy-management-v33.js ===== */
(function(){
  'use strict';
  if(typeof vShop!=='function'||typeof weekList!=='function'||typeof sheetBatch!=='function'||typeof inventory==='undefined')return;

  const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const prevShop=vShop;
  const mealLabels=['아침','점심','저녁'];
  if(!window.__mgWeekTarget)window.__mgWeekTarget='current';

  const norm=n=>{n=String(n||'').trim();return ['진밥','밥','밥 (조리 후)'].includes(n)?'밥 (조리 후)':n};
  const cubes=()=>{try{const v=JSON.parse(localStorage.getItem('dj:cubeInventory2')||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}};
  const saveCubes=v=>localStorage.setItem('dj:cubeInventory2',JSON.stringify(v));
  const targetBase=()=>window.__mgWeekTarget==='next'?addD(weekCur,7):weekCur;
  const windows=()=>{const b=targetBase();return[
    {id:'first',start:b,count:4,title:'1차 식단표',range:'월~목 4일치',prep:'일요일 준비'},
    {id:'second',start:addD(b,4),count:3,title:'2차 식단표',range:'금~일 3일치',prep:'목요일 준비'}
  ]};
  const weekTitle=base=>{const d=P(addD(base,3));return `${d.getMonth()+1}월 ${Math.ceil(d.getDate()/7)}주차`};
  const rangeText=base=>{const a=P(base),b=P(addD(base,6));return `${a.getMonth()+1}/${a.getDate()} – ${b.getMonth()+1}/${b.getDate()}`};
  const isPrepWeekend=()=>{try{const d=P(today).getDay();return d===6||d===0}catch(e){return false}};

  function nav(){
    const s=window.__mgStage,b=targetBase(),weekend=isPrepWeekend(),next=window.__mgWeekTarget==='next';
    return `<div class="card" style="padding:10px;margin-bottom:12px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
        <button class="chip ${!next?'ok':''}" data-v33week="current">이번 주</button>
        <button class="chip ${next?'ok':''}" data-v33week="next">다음 주 준비${weekend?' · 시작':''}</button>
      </div>
      <div class="hint" style="margin:0 2px 9px">${next?`다음 주 ${weekTitle(b)}를 미리 준비해요. 1 재고 → 2 장보기 → 3 만들기 순서예요.`:'이번 주 준비가 끝나면 4 남은 재고를 실제 수량으로 맞춰요. 그 값이 다음 주 1 재고가 됩니다.'}</div>
      <div class="chips" style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px">
        <button class="chip ${s==='stock'?'ok':''}" data-mg="stock">1 재고</button>
        <button class="chip ${s==='shop'?'ok':''}" data-mg="shop">2 장보기</button>
        <button class="chip ${s==='prep'?'ok':''}" data-mg="prep">3 만들기</button>
        <button class="chip ${s==='remain'?'ok':''}" data-mg="remain" ${next?'disabled':''}>4 남은 재고</button>
      </div>
      ${s!=='home'?'<div style="margin-top:9px"><button class="more" data-mg="home">‹ 선택한 주 식단표로</button></div>':''}
    </div>`;
  }

  function nextCode(used){let n=1;while(used.has(`A-${n}`))n++;return `A-${n}`}
  function ensureCodes(){
    const cb=cubes(),used=new Set(),rawKeys=Object.keys(inventory||{});let rawChanged=false,cubeChanged=false;
    for(const v of Object.values(inventory||{}))if(/^A-\d+$/.test(String(v.stockCode||'')))used.add(v.stockCode);
    for(const b of cb)if(/^A-\d+$/.test(String(b.stockCode||'')))used.add(b.stockCode);
    for(const k of rawKeys.sort())if(!inventory[k].stockCode){inventory[k].stockCode=nextCode(used);used.add(inventory[k].stockCode);rawChanged=true}
    for(const b of cb)if(!b.stockCode){b.stockCode=nextCode(used);used.add(b.stockCode);cubeChanged=true}
    if(rawChanged){try{persistInventoryLocal()}catch(e){};if(typeof pushInventoryItem==='function')for(const k of rawKeys){try{pushInventoryItem(k)}catch(e){}}}
    if(cubeChanged)saveCubes(cb);
    return cb;
  }
  function grams(v){if(!v)return 0;if(v.unit==='g')return Math.max(0,Number(v.qty)||0);if(Number(v.gramsPerUnit)>0)return Math.max(0,(Number(v.qty)||0)*Number(v.gramsPerUnit));return 0}
  function cleanG(v){const n=Math.round((Number(v)||0)*10)/10;return Math.abs(n-Math.round(n))<1e-9?String(Math.round(n)):String(n)}
  function baseStockCode(v){return String(v||'').replace(/-잔량-\d+-\d+$/,'')}
  function unitFor(k){try{const A=stage(today),x=byK[k];if(k==='rice')return A.rice;if(!x)return 20;if(x.cat==='v')return A.veg;if(x.cat==='f')return A.fruit;if(x.k==='tofu')return A.tofu;if(x.fish)return A.fish;if(x.cat==='p')return A.meat}catch(e){}return 20}

  function stockSnapshot(){
    ensureCodes();const out={};
    const row=n=>{n=norm(n);return out[n]||(out[n]={name:n,g:0,n:0,by:{'냉장':0,'냉동':0,'실온':0},countBy:{'냉장':0,'냉동':0,'실온':0},parts:[],partMap:{},codes:[],lots:[]})};
    const addPart=(r,loc,u,count)=>{u=Math.round((Number(u)||0)*10)/10;count=Math.round((Number(count)||0)*1000)/1000;if(!(u>0&&count>0))return;const k=loc+'|'+u;r.partMap[k]=(r.partMap[k]||0)+count};
    for(const [k,v] of Object.entries(inventory||{})){
      const r=row(invName(k)),loc=['냉장','냉동','실온'].includes(v.location)?v.location:'냉동',q=Math.max(0,Number(v.qty)||0),g=grams(v);
      if(g){r.g+=g;r.by[loc]+=g;r.lots.push({loc,g,prepared:false});if(v.unit==='개'&&Number(v.gramsPerUnit)>0)addPart(r,loc,v.gramsPerUnit,q)}
      else if(v.unit==='개'){r.n+=q;r.countBy[loc]+=q}
      const code=baseStockCode(v.stockCode);if(code&&!r.codes.includes(code))r.codes.push(code);
    }
    for(const b of cubes()){
      const r=row(b.ingredient),cnt=Math.max(0,Number(b.remainingCount)||0),u=Math.max(0,Number(b.unitG)||0),g=u*cnt;
      if(g){r.g+=g;r.by['냉동']+=g;r.lots.push({loc:'냉동',g,prepared:true});addPart(r,'냉동',u,cnt)}
      const code=baseStockCode(b.stockCode);if(code&&!r.codes.includes(code))r.codes.push(code);
    }
    for(const r of Object.values(out))r.parts=Object.entries(r.partMap).map(([k,count])=>{const [loc,u]=k.split('|');return `${loc} 소분 ${cleanG(u)}g × ${cleanG(count)}개`});
    return out;
  }
  function totalSummary(){
    const rows=Object.values(stockSnapshot()).filter(r=>r.g>0||r.n>0).sort((a,b)=>a.name.localeCompare(b.name,'ko'));
    if(!rows.length)return '<p class="hint">등록된 재고가 없어요.</p>';
    return rows.map(r=>`<div class="inventory-row"><div style="flex:1;min-width:0"><b>${esc(r.name)}</b><div class="hint">재고번호 ${esc(r.codes.join(', ')||'-')}</div>${r.parts.length?`<div class="hint" style="color:var(--ink2);font-weight:700">${r.parts.map(esc).join(' · ')}</div>`:''}</div><div style="text-align:right"><b>${r.g?`${cleanG(r.g)}g`:`${cleanG(r.n)}개`}</b>${r.g?'<div class="hint">총 보유량</div>':''}</div></div>`).join('');
  }
  function rawRow(k,v){
    const total=grams(v),portion=v.unit==='개'&&Number(v.gramsPerUnit)>0;
    return `<div class="inventory-row"><div style="flex:1"><div style="display:flex;gap:7px;align-items:center"><span class="chip sm">${esc(baseStockCode(v.stockCode)||'-')}</span><b>${esc(invName(k))}</b></div><div style="margin-top:6px;display:flex;align-items:center;gap:6px"><input data-rq="${esc(k)}" type="number" min="0" step="0.1" value="${Number(v.qty)||0}" style="width:82px;border:1px solid var(--line);border-radius:9px;padding:6px"><span>${esc(v.unit)}</span>${portion?`<span class="hint">× ${cleanG(v.gramsPerUnit)}g = ${cleanG(total)}g</span>`:''}</div><div class="hint">${esc(v.location||'')} ${portion?'· 소분':''}</div></div><div style="display:flex;gap:6px;flex-direction:column"><button class="btn" data-a="invedit:${esc(k)}">수정</button><button class="btn" style="color:#B84A4A;border-color:#E7B6B6" data-a="invdelete:${esc(k)}">삭제</button></div></div>`;
  }
  function cubeRow(b,i){const total=Math.max(0,(Number(b.unitG)||0)*(Number(b.remainingCount)||0));return `<div class="inventory-row"><div style="flex:1"><div style="display:flex;gap:7px;align-items:center"><span class="chip sm">${esc(baseStockCode(b.stockCode)||'-')}</span><b>${esc(b.ingredient||'')}</b></div><div style="margin-top:6px"><input data-cq="${i}" type="number" min="0" step="1" value="${cleanG(b.remainingCount)}" style="width:68px;border:1px solid var(--line);border-radius:9px;padding:6px">개 <span class="hint">× ${cleanG(b.unitG)}g = ${cleanG(total)}g</span></div><div class="hint">냉동 · 소분${b.madeDate?` · ${esc(b.madeDate)}`:''}</div></div><button class="btn" style="color:#B84A4A;border-color:#E7B6B6" data-v59-cubedel="${i}">삭제</button></div>`}
  function groupRows(loc){const cb=ensureCodes();let html=Object.entries(inventory||{}).filter(([,v])=>(v.location||'냉동')===loc).map(([k,v])=>rawRow(k,v)).join('');if(loc==='냉동')html+=cb.map(cubeRow).join('');return html||`<p class="hint">${loc} 재고가 없어요.</p>`}
  function stockView(){
    ensureCodes();const opts=inventoryKeys().map(k=>`<option value="${esc(k)}">${esc(invName(k))}</option>`).join('');
    return `${nav()}<div class="sec"><h2>1단계 · 재고 확인</h2><span class="more">실제 보유량 기준</span></div>
      <p class="hint">냉장·냉동·실온 재고를 한 곳에서 관리하고, 소분했다면 <b>25g × 6개</b>처럼 총 보유량과 함께 보여줘요.</p>
      <div class="card"><b>재료별 총 보유량</b>${totalSummary()}</div>
      <div class="sec"><h2>냉장</h2></div><div class="card">${groupRows('냉장')}</div>
      <div class="sec"><h2>냉동</h2></div><div class="card">${groupRows('냉동')}</div>
      <div class="sec"><h2>실온</h2></div><div class="card">${groupRows('실온')}</div>
      <div class="btnrow"><button class="btn pri" data-mg32="save">재고 수량 갱신</button></div>
      <div class="sec"><h2>재료 추가</h2></div><div class="card"><p class="hint">냉장/냉동/실온과 입력 방식을 한 번에 선택해요. A-번호는 자동으로 붙습니다.</p>
        <div class="fld"><label>재료</label><select id="mg32Key">${opts}</select></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="fld"><label>보관</label><select id="mg32Loc"><option>냉장</option><option>냉동</option><option>실온</option></select></div><div class="fld"><label>입력 방식</label><select id="mg32Mode"><option value="total">총량(g)</option><option value="count">개수(개)</option><option value="portion">소분(g × 개수)</option></select></div></div>
        <div id="mg32Total"><div class="fld"><label id="mg32QtyLabel">총량(g)</label><input id="mg32Qty" type="number" min="0" step="0.1" placeholder="예: 120"></div></div>
        <div id="mg32Portion" style="display:none"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="fld"><label>1개 기준량(g)</label><input id="mg32UnitG" type="number" min="1" step="1" value="${unitFor('rice')}"></div><div class="fld"><label>현재 개수</label><input id="mg32Count" type="number" min="0" step="1" placeholder="예: 6"></div></div><div class="fld"><label>제조일</label><input id="mg32Date" type="date" value="${today}"></div></div>
        <div class="btnrow"><button class="btn pri" data-mg32="add">재고에 추가</button></div></div>`;
  }
  function remainView(){
    let html=stockView()
      .replace('1단계 · 재고 확인','4단계 · 이번 주 남은 재고')
      .replace('실제 보유량 기준','다음 주로 이월')
      .replace('냉장·냉동·실온 재고를 한 곳에서 관리하고, 소분했다면 <b>25g × 6개</b>처럼 총 보유량과 함께 보여줘요.','이번 주 준비와 사용이 끝난 뒤 <b>실제로 남아 있는 양</b>으로 맞춰 주세요. 먹임 기록으로 자동 차감하지 않기 때문에 이 확인값이 재고의 기준입니다.')
      .replace('재고 수량 갱신','남은 재고 확정');
    html+=`<div class="card" style="margin-top:12px"><b>다음 준비로 이어져요</b><p class="hint" style="margin:6px 0 10px">여기서 확정한 수량이 별도 복사 없이 그대로 다음 주 1단계 재고가 됩니다.</p><button class="btn pri" style="width:100%" data-v33-nextstock="1">다음 주 1단계 재고 확인 ›</button></div>`;
    return html;
  }


  function dayMeals(on){return `<div class="meal" style="display:block"><div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:6px"><b>${P(on).getMonth()+1}/${P(on).getDate()} (${WD[P(on).getDay()]})</b></div>${mealLabels.map((lb,i)=>`<div style="display:grid;grid-template-columns:38px 1fr;gap:7px;padding:3px 0"><span class="hint" style="color:var(--mint);font-weight:800">${lb}</span><span style="font-size:13px">${esc(mText(on,i)||'메뉴 없음')}</span></div>`).join('')}</div>`}
  function planBlock(w){let days='';for(let i=0;i<w.count;i++)days+=dayMeals(addD(w.start,i));return `<div class="sec"><h2>${w.title}</h2><span class="more">${w.prep} · ${w.range}</span></div><div class="card">${days}</div>`}
  function homeView(){const b=targetBase();return `<div class="sec"><div><h2 style="font-size:17px">${window.__mgWeekTarget==='next'?'다음 주 준비':'이번 주'} · ${weekTitle(b)}</h2><div class="hint">${rangeText(b)}</div></div></div>${nav()}${windows().map(planBlock).join('')}`}

  function requirements(w){const t=weekList(w.start,w.count);let rice=0;for(let d=0;d<w.count;d++){const on=addD(w.start,d);for(let i=0;i<3;i++)if(mObj(on,i))rice+=stage(on).rice}if(rice)t['밥 (조리 후)']={c:'e',g:rice,n:0};return t}
  function cloneLots(snapshot){const out={};for(const [name,r] of Object.entries(snapshot)){out[name]={grams:(r.lots||[]).map(x=>({...x})),counts:Object.entries(r.countBy||{}).flatMap(([loc,n])=>n>0?[{loc,n}]:[])}}return out}
  function byLoc(lots,key){const out={'냉장':0,'냉동':0,'실온':0};for(const x of lots||[])out[x.loc]=(out[x.loc]||0)+(Number(x[key])||0);return out}
  function consumeLots(lots,amount,key){
    let left=Math.max(0,amount),used={'냉장':0,'냉동':0,'실온':0};
    const priority=x=>x.prepared?0:x.loc==='냉장'?1:x.loc==='냉동'?2:3;
    lots.sort((a,b)=>priority(a)-priority(b));
    for(const x of lots){if(left<=0)break;const have=Math.max(0,Number(x[key])||0),u=Math.min(have,left);x[key]=have-u;used[x.loc]=(used[x.loc]||0)+u;left-=u}
    return {used,left};
  }
  function allocation(){
    const pool=cloneLots(stockSnapshot()),result={};
    for(const w of windows()){
      const out={};
      for(const [name0,v] of Object.entries(requirements(w))){
        const name=norm(name0),needG=Math.max(0,Number(v.g)||0),needN=Math.max(0,Number(v.n)||0),p=pool[name]||(pool[name]={grams:[],counts:[]});
        if(needG>0){const before=byLoc(p.grams,'g'),c=consumeLots(p.grams,needG,'g');out[name]={name,needG,beforeG:before,usedG:c.used,buyG:Math.max(0,c.left),unknown:false}}
        else if(name==='계란'&&needN>0){const before=byLoc(p.counts,'n'),c=consumeLots(p.counts,needN,'n');out[name]={name,needN,beforeN:before,usedN:c.used,buyN:Math.max(0,c.left),unknown:false,countUnit:'개'}}
        else out[name]={name,needN,unknown:true};
      }
      result[w.id]=out;
    }
    return result;
  }
  const locText=(m,unit)=>['냉장','냉동','실온'].filter(k=>(m?.[k]||0)>0).map(k=>`${k} ${Math.ceil(m[k])}${unit}`).join(' · ')||'등록 재고 없음';
  const checkKey=w=>`mg29|${w.start}`;
  function checked(w,name){return (shopChk?.[checkKey(w)]||[]).includes(name)}
  function shoppingRows(w,rows){
    const list=Object.values(rows).filter(x=>x.unknown||(x.buyG||0)>0||(x.buyN||0)>0);
    if(!list.length)return '<p class="hint"><b>추가 구매 없음.</b> 현재 보유량으로 준비 가능해요.</p>';
    return list.map(x=>{
      const on=checked(w,x.name),isCount=x.buyN!==undefined,qty=x.unknown?'수량 확인':`${Math.ceil(isCount?x.buyN:x.buyG)}${isCount?'개':'g'}`,need=x.unknown?`${x.needN||''}회`: `${Math.ceil(isCount?x.needN:x.needG)}${isCount?'개':'g'}`,stock=x.unknown?'재고 단위 확인 필요':locText(isCount?x.beforeN:x.beforeG,isCount?'개':'g');
      return `<div class="shop${on?' on':''}" data-v33check="${w.id}|${encodeURIComponent(x.name)}" style="align-items:flex-start"><div class="bx" style="margin-top:5px"></div><div class="nm"><b>${esc(x.name)}</b><div class="hint" style="margin-top:3px">필요 ${need}</div><div class="hint" style="margin-top:2px"><b>보유</b> · ${esc(stock)}</div></div><div style="min-width:96px;text-align:center;background:var(--peach-s);border-radius:14px;padding:8px 7px;color:var(--peach)"><div style="font-size:10.5px;font-weight:800">${on?'구매완료':'추가 구매'}</div><div style="font-size:20px;font-weight:900;line-height:1.15;margin-top:2px">${esc(qty)}</div></div></div>`;
    }).join('');
  }
  function shopView(){const a=allocation(),b=targetBase();return `${nav()}<div class="sec"><h2>2단계 · 장보기</h2><span class="more">${weekTitle(b)} 부족분만</span></div><p class="hint">필요량에서 등록 재고를 빼고 <b>추가 구매량</b>을 크게 보여줘요. 보유량은 냉장·냉동·실온으로 나눠 확인할 수 있어요. 1차에 반영한 재고는 2차 계산에서 먼저 빠집니다.</p>${windows().map(w=>`<div class="sec"><h2>${w.title} 장보기</h2><span class="more">${w.range}</span></div><div class="card">${shoppingRows(w,a[w.id])}</div>`).join('')}<div class="btnrow"><button class="btn pri" data-mg="prep">3단계 식단만들기 ›</button></div>`}

  function prepRows(w,rows){const all=Object.values(rows),ready=all.filter(x=>x.unknown?false:((x.buyG||0)<=0&&(x.buyN||0)<=0)).length;return `<div class="card" style="margin:10px 0"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>${w.title} · ${w.range}</b><span class="chip sm ${ready===all.length?'ok':''}">${ready}/${all.length} 준비</span></div>${all.map(x=>{const miss=x.unknown?1:(x.buyG||x.buyN||0),need=x.needG!==undefined?`${Math.ceil(x.needG)}g`:`${Math.ceil(x.needN||0)}개`;return `<div class="inventory-row"><div style="flex:1"><b>${esc(x.name)}</b><div class="hint">필요 ${need}${!x.unknown?` · 보유 ${locText(x.beforeG||x.beforeN,x.needG!==undefined?'g':'개')}`:''}</div></div><span class="chip sm ${miss<=0?'ok':''}">${miss<=0?'준비완료':x.unknown?'확인 필요':'구매 필요'}</span></div>`}).join('')}<button class="btn pri" style="width:100%;margin-top:10px" data-v33prep="${w.id}">${w.title} 상세 만들기 ›</button></div>`}
  function prepView(){const a=allocation(),b=targetBase();return `${nav()}<div class="sec"><h2>3단계 · 식단만들기</h2><span class="more">${weekTitle(b)}</span></div><p class="hint">최종 재료 준비상태를 확인한 뒤 1차/2차 상세 만들기로 바로 들어가요.</p>${windows().map(w=>prepRows(w,a[w.id])).join('')}`}

  vShop=function(){
    if(window.__mgStage==='stock')return stockView();
    if(window.__mgStage==='shop')return shopView();
    if(window.__mgStage==='prep')return prepView();
    if(window.__mgStage==='remain')return remainView();
    if(window.__mgStage==='home')return homeView();
    return prevShop();
  };

  document.addEventListener('click',async function(e){
    const tab=e.target.closest&&e.target.closest('[data-a="tab:shop"]');if(tab)window.__mgWeekTarget='current';
    const wk=e.target.closest&&e.target.closest('[data-v33week]');if(wk){e.preventDefault();e.stopImmediatePropagation();window.__mgWeekTarget=wk.dataset.v33week;if(window.__mgWeekTarget==='next'&&window.__mgStage==='remain')window.__mgStage='stock';render(true);return}
    const nextStock=e.target.closest&&e.target.closest('[data-v33-nextstock]');if(nextStock){e.preventDefault();e.stopImmediatePropagation();window.__mgWeekTarget='next';window.__mgStage='stock';render(true);return}
    const ck=e.target.closest&&e.target.closest('[data-v33check]');if(ck){e.preventDefault();e.stopImmediatePropagation();const[id,enc]=ck.dataset.v33check.split('|'),w=windows().find(x=>x.id===id),name=decodeURIComponent(enc);if(!w)return;const key=checkKey(w),list=shopChk[key]||(shopChk[key]=[]),i=list.indexOf(name);i<0?list.push(name):list.splice(i,1);try{await store.set('shop2',shopChk)}catch(_){}render(true);return}
    const prep=e.target.closest&&e.target.closest('[data-v33prep]');if(prep){e.preventDefault();e.stopImmediatePropagation();const w=windows().find(x=>x.id===prep.dataset.v33prep);if(w)sheetBatch(w.start,w.count);return}
    const cubeDel=e.target.closest&&e.target.closest('[data-v59-cubedel]');if(cubeDel){e.preventDefault();e.stopImmediatePropagation();const i=Number(cubeDel.dataset.v59Cubedel),list=cubes(),item=list[i];if(!item)return;if(!confirm(`${item.ingredient||'소분 재고'}를 삭제할까요?`))return;list.splice(i,1);saveCubes(list);render(true);toast('소분 재고를 삭제했어요');return}
  },true);

  try{render(true)}catch(e){}
})();

/* ===== legacy-management-v34.js ===== */
(function(){
  'use strict';
  if(typeof vShop!=='function'||typeof inventory==='undefined'||typeof cleanInventory!=='function'||typeof pushInventoryItem!=='function')return;

  const BACKUP_KEY='dj:customInventory1';
  const DIRECT='__direct__';
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const baseView=vShop;
  const baseClean=cleanInventory;
  const basePush=pushInventoryItem;

  const readBackup=()=>{try{const v=JSON.parse(localStorage.getItem(BACKUP_KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch(e){return{}}};
  const saveBackup=()=>{const out={};for(const [k,v] of Object.entries(inventory||{}))if(v?.custom===true)out[k]=v;localStorage.setItem(BACKUP_KEY,JSON.stringify(out))};
  const restoreBackup=()=>{const b=readBackup();for(const [k,v] of Object.entries(b)){if(!inventory[k]||(Number(v.updatedAt)||0)>=(Number(inventory[k]?.updatedAt)||0))inventory[k]=v}};
  const cleanCustomName=s=>String(s||'').trim().replace(/\s+/g,' ');
  const unsafeName=s=>/[.#$\[\]\/\u0000-\u001F\u007F]/.test(s);
  const customKeys=()=>Object.entries(inventory||{}).filter(([,v])=>v?.custom===true).map(([k])=>k).sort((a,b)=>a.localeCompare(b,'ko'));
  const builtInKeyByName=name=>{try{return inventoryKeys().find(k=>String(invName(k)).trim()===name)||null}catch(e){return null}};
  const cubes=()=>{try{const v=JSON.parse(localStorage.getItem('dj:cubeInventory2')||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}};
  const nextCode=()=>{const used=new Set();for(const v of Object.values(inventory||{}))if(/^A-\d+$/.test(String(v.stockCode||'')))used.add(v.stockCode);for(const b of cubes())if(/^A-\d+$/.test(String(b.stockCode||'')))used.add(b.stockCode);let n=1;while(used.has(`A-${n}`))n++;return `A-${n}`};

  cleanInventory=function(raw){
    const out=baseClean(raw);
    for(const [k,v] of Object.entries(raw||{})){
      if(!v||v.custom!==true||out[k])continue;
      if(!Number.isFinite(v.qty)||v.qty<0||!['g','개','팩'].includes(v.unit))continue;
      if(unsafeName(k))continue;
      out[k]={qty:v.qty,unit:v.unit,location:['냉장','냉동','실온'].includes(v.location)?v.location:'냉장',gramsPerUnit:Number.isFinite(v.gramsPerUnit)&&v.gramsPerUnit>0?v.gramsPerUnit:null,memo:String(v.memo||'').slice(0,200),updatedAt:Number.isFinite(v.updatedAt)?v.updatedAt:0,stockCode:String(v.stockCode||''),custom:true,customName:String(v.customName||k)};
    }
    return out;
  };
  pushInventoryItem=function(k){if(inventory?.[k]?.custom===true)saveBackup();return basePush(k)};
  restoreBackup();

  function enhanceStock(html){
    if(window.__mgStage!=='stock'||typeof html!=='string')return html;
    const customOpts=customKeys().map(k=>`<option value="${esc(k)}">${esc(k)} (직접추가)</option>`).join('');
    const option=`${customOpts}<option value="${DIRECT}">＋ 목록에 없는 식품 직접 입력</option>`;
    html=html.replace(/(<select id="mg32Key"[^>]*>)([\s\S]*?)(<\/select>)/,(_,a,b,c)=>`${a}${b}${option}${c}`);
    html=html.replace(/(<select id="mg32Key"[^>]*>[\s\S]*?<\/select>)/,`$1<div class="fld" id="mg34DirectWrap" style="display:none"><label>직접 입력 재료명</label><input id="mg34Name" type="text" maxlength="40" placeholder="예: 새우, 대구살, 김, 요거트"><div class="hint">입력한 이름이 식단 재료명과 같으면 장보기 계산에도 자동으로 연결돼요.</div></div>`);
    return html;
  }
  vShop=function(){return enhanceStock(baseView())};

  function syncDirect(){const s=document.getElementById('mg32Key'),w=document.getElementById('mg34DirectWrap');if(w)w.style.display=s?.value===DIRECT?'':'none'}
  document.addEventListener('change',e=>{if(e.target?.id==='mg32Key')syncDirect()},true);

  function addCustom(name){
    name=cleanCustomName(name);
    if(!name)return toast('재료명을 입력해 주세요');
    if(name.length>40)return toast('재료명은 40자 이내로 입력해 주세요');
    if(unsafeName(name))return toast('재료명에는 . $ # [ ] / 문자를 사용할 수 없어요');
    const builtin=builtInKeyByName(name);if(builtin){const s=document.getElementById('mg32Key');if(s)s.value=builtin;return {builtin:true,key:builtin}}
    const mode=document.getElementById('mg32Mode')?.value||'total',loc=document.getElementById('mg32Loc')?.value||'냉장',old=inventory[name]||{},code=old.stockCode||nextCode(),now=Math.max(Date.now(),(Number(old.updatedAt)||0)+1);
    if(mode==='portion'){
      const unitG=Math.max(1,Math.round(Number(document.getElementById('mg32UnitG')?.value)||0)),count=Math.max(0,Math.round(Number(document.getElementById('mg32Count')?.value)||0));if(!count)return toast('소분 개수를 입력해 주세요');
      inventory[name]={...old,qty:count,unit:'개',gramsPerUnit:unitG,location:loc,memo:'소분 · 직접추가',updatedAt:now,stockCode:code,custom:true,customName:name,madeDate:document.getElementById('mg32Date')?.value||''};
      persistInventoryLocal();saveBackup();pushInventoryItem(name);toast(`${name} ${unitG}g × ${count}개를 ${loc} 재고에 추가했어요`);render(true);return {done:true};
    }
    const q=Math.max(0,Number(document.getElementById('mg32Qty')?.value)||0);if(!q)return toast(mode==='count'?'개수를 입력해 주세요':'총량을 입력해 주세요');
    inventory[name]={...old,qty:q,unit:mode==='count'?'개':'g',gramsPerUnit:null,location:loc,memo:'직접추가',updatedAt:now,stockCode:code,custom:true,customName:name};
    persistInventoryLocal();saveBackup();pushInventoryItem(name);toast(`${name} ${q}${mode==='count'?'개':'g'}를 ${loc} 재고에 추가했어요`);render(true);return {done:true};
  }

  window.addEventListener('click',function(e){
    const btn=e.target.closest&&e.target.closest('[data-mg32="add"]');if(!btn)return;
    const s=document.getElementById('mg32Key'),key=s?.value||'';
    if(key!==DIRECT&&!inventory?.[key]?.custom)return;
    if(key===DIRECT){
      const name=cleanCustomName(document.getElementById('mg34Name')?.value),builtin=builtInKeyByName(name);
      if(builtin){if(s)s.value=builtin;return}
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      try{addCustom(name)}catch(err){toast('재료를 추가하지 못했어요 · 다시 시도해 주세요')}
      return;
    }
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    try{addCustom(key)}catch(err){toast('재료를 저장하지 못했어요 · 다시 시도해 주세요')}
  },true);

  setTimeout(()=>{try{if(typeof famURL==='function'&&typeof mergeInventory==='function'&&online&&sync?.url&&sync?.code){fetch(famURL('inventory2')).then(r=>r.ok?r.json():null).then(raw=>{if(!raw)return;const changed=mergeInventory(raw);saveBackup();if(changed)render(true)}).catch(()=>{})}}catch(e){}},0);
  try{render(true)}catch(e){}
})();

/* ===== legacy-management-v35.js ===== */
(function(){
  'use strict';
  if(typeof vShop!=='function'||typeof sheetBatch!=='function'||typeof weekList!=='function'||typeof inventory==='undefined')return;

  const MARK_KEY='dj:batchStockDeduct2';
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const norm=n=>{n=String(n||'').trim();return ['진밥','밥','밥 (조리 후)'].includes(n)?'밥 (조리 후)':n};
  const baseView=vShop,baseSheet=sheetBatch;
  const lastCounts={};
  let markers=readMarkers();
  window.__mgStockCompleted=markers;

  function readMarkers(){try{const v=JSON.parse(localStorage.getItem(MARK_KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch(e){return{}}}
  function saveMarkers(){localStorage.setItem(MARK_KEY,JSON.stringify(markers));window.__mgStockCompleted=markers;try{if(window.storage)Promise.resolve(window.storage.set('batchStock2',JSON.stringify(markers))).catch(()=>{})}catch(e){};try{if(typeof store!=='undefined'&&store?.set)Promise.resolve(store.set('batchStock2',markers)).catch(()=>{})}catch(e){} }
  function cubes(){try{const v=JSON.parse(localStorage.getItem('dj:cubeInventory2')||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}}
  function saveCubes(v){localStorage.setItem('dj:cubeInventory2',JSON.stringify(v))}
  function grams(v){if(!v)return 0;if(v.unit==='g')return Math.max(0,Number(v.qty)||0);if(Number(v.gramsPerUnit)>0)return Math.max(0,(Number(v.qty)||0)*Number(v.gramsPerUnit));return 0}
  function targetBase(){return window.__mgWeekTarget==='next'?addD(weekCur,7):weekCur}
  function windows(){const b=targetBase();return[
    {id:'first',start:b,count:4,title:'1차 식단표',range:'월~목 4일치',prep:'일요일 제작',shop:'토요일 장보기'},
    {id:'second',start:addD(b,4),count:3,title:'2차 식단표',range:'금~일 3일치',prep:'목요일 제작',shop:'수요일 장보기'}
  ]}
  function weekTitle(base){const d=P(addD(base,3));return `${d.getMonth()+1}월 ${Math.ceil(d.getDate()/7)}주차`}
  function requirements(start,count){const t=weekList(start,count);let rice=0;for(let d=0;d<count;d++){const on=addD(start,d),pv=window.__PPEUNI_SCHEDULE_V58&&window.__PPEUNI_SCHEDULE_V58.entry(on);for(let i=0;i<3;i++)if(!pv&&mObj(on,i))rice+=stage(on).rice}if(rice)t['밥 (조리 후)']={c:'e',g:rice,n:0};return t}
  function isDone(w){return !!markers[w.start]}

  function stockSnapshot(){
    const out={};const row=n=>{n=norm(n);return out[n]||(out[n]={name:n,g:0,n:0,by:{'냉장':0,'냉동':0,'실온':0},countBy:{'냉장':0,'냉동':0,'실온':0},lots:[]})};
    for(const [k,v] of Object.entries(inventory||{})){
      const r=row(invName(k)),loc=['냉장','냉동','실온'].includes(v.location)?v.location:'냉장',g=grams(v),q=Math.max(0,Number(v.qty)||0);
      if(g){r.g+=g;r.by[loc]+=g;r.lots.push({kind:'raw',key:k,loc,g,prepared:false})}
      else if(v.unit==='개'){r.n+=q;r.countBy[loc]+=q;r.lots.push({kind:'count',key:k,loc,n:q,prepared:false})}
    }
    for(const [i,b] of cubes().entries()){
      const r=row(b.ingredient),cnt=Math.max(0,Number(b.remainingCount)||0),u=Math.max(0,Number(b.unitG)||0),g=cnt*u;
      if(g){r.g+=g;r.by['냉동']+=g;r.lots.push({kind:'cube',index:i,loc:'냉동',g,unitG:u,count:cnt,prepared:true,madeDate:b.madeDate||''})}
    }
    return out;
  }
  function clonePool(snap){const out={};for(const [n,r] of Object.entries(snap))out[n]={grams:(r.lots||[]).filter(x=>x.g>0).map(x=>({...x})),counts:(r.lots||[]).filter(x=>x.n>0).map(x=>({...x}))};return out}
  function byLoc(lots,key){const out={'냉장':0,'냉동':0,'실온':0};for(const x of lots)out[x.loc]=(out[x.loc]||0)+(Number(x[key])||0);return out}
  function consumeVirtual(lots,need,key){let left=need,used={'냉장':0,'냉동':0,'실온':0};const pri=x=>x.prepared?0:x.loc==='냉장'?1:x.loc==='냉동'?2:3;lots.sort((a,b)=>pri(a)-pri(b));for(const x of lots){if(left<=0)break;const have=Math.max(0,Number(x[key])||0),u=Math.min(have,left);x[key]=have-u;used[x.loc]=(used[x.loc]||0)+u;left-=u}return{used,left}}
  function allocation(){
    const pool=clonePool(stockSnapshot()),result={};
    for(const w of windows()){
      const out={};
      if(isDone(w)){result[w.id]=out;continue}
      for(const [name0,v] of Object.entries(requirements(w.start,w.count))){
        const name=norm(name0),needG=Math.max(0,Number(v.g)||0),needN=Math.max(0,Number(v.n)||0),p=pool[name]||(pool[name]={grams:[],counts:[]});
        if(needG>0){const before=byLoc(p.grams,'g'),countBefore=byLoc(p.counts,'n'),countTotal=Object.values(countBefore).reduce((a,b)=>a+(Number(b)||0),0);if(!p.grams.length&&countTotal>0)out[name]={name,needG,beforeN:countBefore,unknown:true,unitMismatch:true};else{const c=consumeVirtual(p.grams,needG,'g');out[name]={name,needG,beforeG:before,buyG:Math.max(0,c.left),unknown:false}}}
        else if(name==='계란'&&needN>0){const before=byLoc(p.counts,'n'),c=consumeVirtual(p.counts,needN,'n');out[name]={name,needN,beforeN:before,buyN:Math.max(0,c.left),unknown:false,countUnit:'개'}}
        else out[name]={name,needN,unknown:true};
      }
      result[w.id]=out;
    }
    return result;
  }
  function locText(m,unit){return ['냉장','냉동','실온'].filter(k=>(m?.[k]||0)>0).map(k=>`${k} ${Math.ceil(m[k])}${unit}`).join(' · ')||'등록 재고 없음'}
  const checkKey=w=>`mg29|${w.start}`;
  function checked(w,name){return (shopChk?.[checkKey(w)]||[]).includes(name)}

  function nav(){const s=window.__mgStage,b=targetBase(),next=window.__mgWeekTarget==='next',feedDay=typeof today==='string'?today:b;return `<div class="card" style="padding:12px;margin-bottom:14px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:9px"><button class="chip ${!next?'ok':''}" data-v33week="current">이번 주</button><button class="chip ${next?'ok':''}" data-v33week="next">다음 주</button></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:7px"><button class="btn ${s==='stock'?'pri':''}" data-mg="stock">1 · 재고</button><button class="btn ${s==='shop'?'pri':''}" data-mg="shop">2 · 장보기</button><button class="btn ${s==='prep'?'pri':''}" data-mg="prep">3 · 만들기</button><button class="btn" data-a="day:${feedDay}" ${next?'disabled':''}>4 · 먹이기·기록</button></div><div class="hint" style="margin:9px 2px 0">${next?'다음 주 준비는 1~3단계까지 진행해요.':'재고 확인부터 먹인 뒤 기록까지 한 흐름으로 관리해요.'}</div></div>`}
  function flowCard(){const ws=windows(),first=isDone(ws[0]),second=isDone(ws[1]);if(second)return `<div class="banner b-shop"><h3>2차 제작 완료 · 재고 차감됨</h3><p>남은 재고가 다음 주 장보기의 기준이에요. 토요일에는 다음 주 준비로 넘어가면 됩니다.</p><div class="row"><button data-v35next="1">다음 주 장보기 보기 ›</button></div></div>`;if(first)return `<div class="banner b-shop"><h3>1차 제작 완료 · 재고 차감됨</h3><p><b>수요일 2차 장보기</b>를 남은 재고 기준으로 다시 계산했어요. 장을 본 뒤 목요일에 2차를 제작하면 됩니다.</p></div>`;return `<div class="banner b-shop"><h3>이번 준비 순서</h3><p>토요일 1차 장보기 → 일요일 1차 제작 완료 → 재고 자동 차감 → 수요일 2차 장보기 → 목요일 2차 제작</p></div>`}
  function shoppingList(rows){return Object.values(rows).filter(x=>x.unknown||(x.buyG||0)>0||(x.buyN||0)>0)}
  function shoppingState(w,rows){
    if(isDone(w))return{done:true,checked:0,total:0,label:'장보기 완료 · 제작완료',list:[]};
    const list=shoppingList(rows);
    if(!list.length)return{done:true,checked:0,total:0,label:'장보기 완료 · 추가 구매 없음',list};
    const checkedCount=list.filter(x=>checked(w,x.name)).length,done=checkedCount===list.length;
    return{done,checked:checkedCount,total:list.length,label:done?`장보기 완료 ${checkedCount}/${list.length}`:`장보기 미완료 ${checkedCount}/${list.length}`,list};
  }
  function shoppingRows(w,rows){
    if(isDone(w))return `<p class="hint"><b>${w.title} 제작 완료.</b> 사용 재고는 이미 차감됐어요.</p>`;
    const list=shoppingList(rows);
    if(!list.length)return '<p class="hint"><b>추가 구매 없음.</b> 현재 남은 재고로 준비 가능해요.</p>';
    return list.map(x=>{const on=checked(w,x.name),isCount=x.buyN!==undefined,qty=x.unknown?(x.unitMismatch?'g 환산 필요':'수량 확인'):`${Math.ceil(isCount?x.buyN:x.buyG)}${isCount?'개':'g'}`,need=x.unknown?(x.unitMismatch?`${Math.ceil(x.needG||0)}g`:`${x.needN||''}회`):`${Math.ceil(isCount?x.needN:x.needG)}${isCount?'개':'g'}`,stock=x.unknown?(x.unitMismatch?`개수 재고 ${locText(x.beforeN,'개')} · 1개당 g 입력 필요`:'재고 단위 확인 필요'):locText(isCount?x.beforeN:x.beforeG,isCount?'개':'g');return `<div class="shop${on?' on':''}" data-v33check="${w.id}|${encodeURIComponent(x.name)}" style="align-items:flex-start"><div class="bx" style="margin-top:5px"></div><div class="nm"><b>${esc(x.name)}</b><div class="hint">필요 ${esc(need)}</div><div class="hint"><b>현재 남은 재고</b> · ${esc(stock)}</div></div><div style="min-width:96px;text-align:center;background:var(--peach-s);border-radius:14px;padding:8px 7px;color:var(--peach)"><div style="font-size:10.5px;font-weight:800">${on?'구매완료':'추가 구매'}</div><div style="font-size:20px;font-weight:900;line-height:1.15;margin-top:2px">${esc(qty)}</div></div></div>`}).join('')
  }
  function shoppingCard(w,rows){
    const st=shoppingState(w,rows),canToggle=!isDone(w)&&st.total>0;
    return `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:${st.total?'10px':'4px'}"><b>장보기 상태</b><span class="chip sm ${st.done?'ok':''}">${esc(st.label)}</span></div>${shoppingRows(w,rows)}${canToggle?`<div class="btnrow" style="margin-top:10px"><button class="btn ${st.done?'':'pri'}" data-v60-shopcomplete="${w.id}">${st.done?'완료 취소':'전체 구매완료'}</button></div>`:''}</div>`;
  }
  function shopView(){const a=allocation(),b=targetBase();return `${nav()}${flowCard()}<div class="sec"><h2>2단계 · 장보기</h2><span class="more">남은 재고 기준 재계산</span></div><p class="hint">제작 완료된 차수는 다시 차감하지 않고, <b>실제로 남은 재고</b>부터 다음 차수 부족분을 계산해요. 각 차수의 <b>장보기 완료 여부</b>도 따로 표시합니다.</p>${windows().map(w=>`<div class="sec"><h2>${w.id==='first'?'1차':'2차'} 장보기</h2><span class="more">${w.shop} · ${w.range}</span></div>${shoppingCard(w,a[w.id])}`).join('')}<div class="btnrow"><button class="btn pri" data-mg="prep">식단만들기 ›</button></div>`}
  function prepRows(w,rows){if(isDone(w)){const m=markers[w.start];return `<div class="card" style="margin:10px 0"><div style="display:flex;justify-content:space-between;gap:8px"><b>${w.title} · ${w.range}</b><span class="chip sm ok">제작완료</span></div><div class="hint" style="margin-top:7px">재고 차감 완료${m?.completedAt?` · ${new Date(m.completedAt).toLocaleString('ko-KR')}`:''}</div><button class="btn" style="width:100%;margin-top:10px" data-v33prep="${w.id}">완료 내역 보기 ›</button></div>`}const all=Object.values(rows),ready=all.filter(x=>!x.unknown&&((x.buyG||0)<=0&&(x.buyN||0)<=0)).length;return `<div class="card" style="margin:10px 0"><div style="display:flex;justify-content:space-between;gap:8px"><b>${w.title} · ${w.range}</b><span class="chip sm ${ready===all.length?'ok':''}">${ready}/${all.length} 준비</span></div><div class="hint" style="margin-top:5px">${w.shop} → ${w.prep}</div>${all.map(x=>{const miss=x.unknown?1:(x.buyG||x.buyN||0);return `<div class="inventory-row"><div style="flex:1"><b>${esc(x.name)}</b><div class="hint">${x.unknown?(x.unitMismatch?'개수 재고는 있으나 1개당 g 환산 필요':'수량 확인 필요'):`보유 ${esc(locText(x.beforeG||x.beforeN,x.needG!==undefined?'g':'개'))}`}</div></div><span class="chip sm ${miss<=0?'ok':''}">${miss<=0?'준비완료':x.unknown?'확인 필요':'구매 필요'}</span></div>`}).join('')}<button class="btn pri" style="width:100%;margin-top:10px" data-v33prep="${w.id}">${w.title} 상세 만들기 ›</button></div>`}
  function prepView(){const a=allocation();return `${nav()}${flowCard()}<div class="sec"><h2>3단계 · 식단만들기</h2><span class="more">완료 시 재고 자동 차감</span></div><p class="hint">상세 만들기의 준비 체크가 모두 완료되면 해당 차수 사용량을 <b>한 번만</b> 재고에서 차감합니다.</p>${windows().map(w=>prepRows(w,a[w.id])).join('')}`}

  vShop=function(){if(window.__mgStage==='shop')return shopView();if(window.__mgStage==='prep')return prepView();const html=baseView();if(window.__mgStage==='home'&&typeof html==='string')return html.replace(/(<div class=\"card\" style=\"padding:10px;margin-bottom:12px\">)/,`${flowCard()}$1`);return html};

  function measurableShortages(start,count){const snap=stockSnapshot(),miss=[];for(const [name0,v] of Object.entries(requirements(start,count))){const name=norm(name0),needG=Math.max(0,Number(v.g)||0),needN=Math.max(0,Number(v.n)||0),r=snap[name]||{g:0,n:0};if(needG>0&&r.g+1e-9<needG)miss.push(`${name} ${Math.ceil(needG-r.g)}g`);else if(name==='계란'&&needN>0&&r.n+1e-9<needN)miss.push(`${name} ${Math.ceil(needN-r.n)}개`)}return miss}
  function deductBatch(start,count){
    if(markers[start])return {ok:true,already:true};
    const miss=measurableShortages(start,count);if(miss.length)return{ok:false,missing:miss};
    const cb=cubes(),changed=new Set(),receipt=[];
    for(const [name0,v] of Object.entries(requirements(start,count))){
      const name=norm(name0),needG=Math.max(0,Number(v.g)||0),needN=Math.max(0,Number(v.n)||0);let left=needG;
      if(left>0){
        const matches=cb.map((b,i)=>({b,i})).filter(x=>norm(x.b.ingredient)===name&&(Number(x.b.remainingCount)||0)>0&&(Number(x.b.unitG)||0)>0).sort((a,b)=>String(a.b.madeDate||'').localeCompare(String(b.b.madeDate||''))||a.i-b.i);
        for(const x of matches){if(left<=0)break;const u=Number(x.b.unitG)||0,have=Math.max(0,Number(x.b.remainingCount)||0),take=Math.min(have,Math.ceil(left/u));if(take<=0)continue;x.b.remainingCount=have-take;const used=take*u;receipt.push({name,from:'냉동 소분',amountG:used,count:take,unitG:u});left=Math.max(0,left-used)}
        const raws=Object.entries(inventory||{}).filter(([k,val])=>norm(invName(k))===name&&grams(val)>0).sort((a,b)=>{const p=x=>x?.location==='냉장'?0:x?.location==='냉동'?1:2;return p(a[1])-p(b[1])});
        for(const [k,val] of raws){if(left<=0)break;if(val.unit==='g'){const have=Math.max(0,Number(val.qty)||0),take=Math.min(have,left);val.qty=Math.max(0,have-take);left-=take;if(take>0){receipt.push({name,from:val.location||'재고',amountG:take});changed.add(k)}}else if(Number(val.gramsPerUnit)>0){const u=Number(val.gramsPerUnit),have=Math.max(0,Number(val.qty)||0),take=Math.min(have,Math.ceil(left/u));val.qty=Math.max(0,have-take);const used=take*u;left=Math.max(0,left-used);if(take>0){receipt.push({name,from:val.location||'재고',amountG:used,count:take,unitG:u});changed.add(k)}}}
      }else if(name==='계란'&&needN>0){let leftN=needN;for(const [k,val] of Object.entries(inventory||{})){if(leftN<=0)break;if(norm(invName(k))!==name||val.unit!=='개'||Number(val.gramsPerUnit)>0)continue;const have=Math.max(0,Number(val.qty)||0),take=Math.min(have,leftN);val.qty=Math.max(0,have-take);leftN-=take;if(take>0){receipt.push({name,from:val.location||'재고',count:take});changed.add(k)}}}
    }
    const now=Date.now();for(const k of changed){inventory[k].updatedAt=Math.max(now,(Number(inventory[k].updatedAt)||0)+1)}
    try{persistInventoryLocal()}catch(e){};for(const k of changed){try{pushInventoryItem(k)}catch(e){}}
    saveCubes(cb);
    markers[start]={start,count,completedAt:now,receipt};saveMarkers();
    try{if(typeof online!=='undefined'&&online&&typeof sync!=='undefined'&&sync?.url&&sync?.code&&typeof famURL==='function')fetch(famURL(`batchStock2/${start}`),{method:'PUT',body:JSON.stringify(markers[start])}).catch(()=>{})}catch(e){}
    return {ok:true,receipt};
  }
  function batchProgress(start,count){try{const b=batchPlan(start,count),total=(b.common?.length||0)+(b.mains?.length||0)+(b.sides?.length||0),done=new Set(batchDone?.[start]||[]).size;return{total,done,all:total>0&&done>=total}}catch(e){return{total:0,done:0,all:false}}}
  function decorateSheet(start,count){const el=(typeof sheet!=='undefined'&&sheet)||document.querySelector('.sheet');if(!el)return;el.querySelector('#v35BatchStatus')?.remove();const p=batchProgress(start,count),done=!!markers[start],box=document.createElement('div');box.id='v35BatchStatus';box.className='card';box.style.margin='14px 0';if(done)box.innerHTML=`<b>제작 완료 · 재고 차감 완료</b><p class="hint" style="margin:6px 0 0">이 차수는 이미 재고에 반영됐어요. 다시 열어도 중복 차감되지 않습니다.</p>`;else if(p.all)box.innerHTML=`<b>준비 체크 완료</b><p class="hint" style="margin:6px 0">재고가 충분하면 자동 차감됩니다. 부족으로 보류됐다면 재고/장보기 반영 후 다시 눌러주세요.</p><button class="btn pri" data-v35complete="${esc(start)}|${count}">제작 완료 · 재고 반영</button>`;else box.innerHTML=`<b>제작 진행 ${p.done}/${p.total}</b><p class="hint" style="margin:6px 0 0">모든 준비 체크가 끝나면 사용한 재료가 재고에서 한 번만 자동 차감돼요.</p>`;el.appendChild(box)}

  sheetBatch=function(start,count){const c=arguments.length>=2?count:(lastCounts[start]||7);lastCounts[start]=c;baseSheet(start,c);setTimeout(()=>decorateSheet(start,c),0)};

  function tryAutoComplete(start,count){const p=batchProgress(start,count);if(!p.all||markers[start]){decorateSheet(start,count);return}const r=deductBatch(start,count);if(r.ok){toast('제작 완료 · 사용 재고를 차감했어요');try{render(true)}catch(e){}}else toast(`재고 부족 · ${r.missing.slice(0,2).join(', ')} 먼저 확인해 주세요`);decorateSheet(start,count)}

  document.addEventListener('click',async function(e){
    const doneBtn=e.target.closest&&e.target.closest('[data-a^="bdone:"]');if(doneBtn){const start=curBatch?.sun,count=curBatch?.count||lastCounts[start]||7;if(start){lastCounts[start]=count;setTimeout(()=>tryAutoComplete(start,count),60)}}
    const retry=e.target.closest&&e.target.closest('[data-v35complete]');if(retry){e.preventDefault();e.stopImmediatePropagation();const [start,c]=retry.dataset.v35complete.split('|'),count=Number(c)||lastCounts[start]||7;tryAutoComplete(start,count);return}
    const next=e.target.closest&&e.target.closest('[data-v35next]');if(next){e.preventDefault();e.stopImmediatePropagation();window.__mgWeekTarget='next';window.__mgStage='shop';render(true);return}
    const shopDone=e.target.closest&&e.target.closest('[data-v60-shopcomplete]');if(shopDone){e.preventDefault();e.stopImmediatePropagation();const w=windows().find(x=>x.id===shopDone.dataset.v60Shopcomplete);if(!w)return;const rows=allocation()[w.id],st=shoppingState(w,rows),key=checkKey(w);if(st.done)shopChk[key]=[];else shopChk[key]=st.list.map(x=>x.name);try{await Promise.resolve(store.set('shop2',shopChk))}catch(_){}render(true);return}
  },true);

  try{if(typeof store!=='undefined'&&store?.get)Promise.resolve(store.get('batchStock2')).then(v=>{if(v&&typeof v==='object'){markers={...markers,...v};saveMarkers();render(true)}}).catch(()=>{})}catch(e){}
  try{if(typeof online!=='undefined'&&online&&typeof sync!=='undefined'&&sync?.url&&sync?.code&&typeof famURL==='function')fetch(famURL('batchStock2')).then(r=>r.ok?r.json():null).then(v=>{if(v&&typeof v==='object'){markers={...markers,...v};saveMarkers();render(true)}}).catch(()=>{})}catch(e){}
})();
