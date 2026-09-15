(function(){
  'use strict';
  if(typeof vShop!=='function'||typeof inventory==='undefined'||typeof inventoryKeys!=='function'||typeof sheetBatch!=='function')return;
  const prevShop=vShop, prevSheetBatch=sheetBatch;
  const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const cubes=()=>{try{const v=JSON.parse(localStorage.getItem('dj:cubeInventory2')||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}};
  const norm=n=>{n=String(n||'').trim();return ['진밥','밥','밥 (조리 후)'].includes(n)?'밥 (조리 후)':n};
  const unitFor=k=>{const A=stage(today),x=byK[k];if(k==='rice')return A.rice;if(!x)return 20;if(x.cat==='v')return A.veg;if(x.cat==='f')return A.fruit;if(x.k==='tofu')return A.tofu;if(x.fish)return A.fish;if(x.cat==='p')return A.meat;return 20};
  const nav=()=>`<div class="card" style="padding:10px;margin-bottom:12px"><div class="chips" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px"><button class="chip ${window.__mgStage==='stock'?'ok':''}" data-mg="stock">1 재고관리</button><button class="chip" data-mg="shop">2 장보기</button><button class="chip" data-mg="prep">3 식단만들기</button></div><div style="margin-top:9px"><button class="more" data-mg="home">‹ 이번 주 식단표로</button></div></div>`;

  function rawRow(k,v){
    return `<div class="inventory-row"><div style="flex:1"><b>${esc(invName(k))}</b><div style="display:flex;gap:6px;align-items:center;margin-top:4px"><input data-rq="${esc(k)}" type="number" min="0" step="0.1" value="${Number(v.qty)||0}" style="width:82px;border:1px solid var(--line);border-radius:9px;padding:6px"> <span>${esc(v.unit)}</span></div><div class="hint">${v.gramsPerUnit?`1${esc(v.unit)}=${v.gramsPerUnit}g · `:''}${esc(v.memo||'')}</div></div><button class="btn" data-a="invedit:${esc(k)}">수정</button></div>`;
  }
  function cubeRow(b,i){
    return `<div class="inventory-row"><div style="flex:1"><b>${esc(b.ingredient||'')}</b><div style="margin-top:4px">${Number(b.unitG)||0}g × <input data-cq="${i}" type="number" min="0" step="1" value="${Number(b.remainingCount)||0}" style="width:68px;border:1px solid var(--line);border-radius:9px;padding:6px">개</div><div class="hint">${esc(b.madeDate||'')} · 소분 냉동</div></div><span class="chip sm">${Math.round((Number(b.unitG)||0)*(Number(b.remainingCount)||0))}g</span></div>`;
  }
  function groupRows(loc){
    let html=Object.entries(inventory||{}).filter(([,v])=>(v.location||'냉동')===loc).map(([k,v])=>rawRow(k,v)).join('');
    if(loc==='냉동')html+=cubes().map(cubeRow).join('');
    return html||`<p class="hint">${loc} 보관 재고가 없어요.</p>`;
  }
  function stockView(){
    const opts=inventoryKeys().map(k=>`<option value="${esc(k)}">${esc(invName(k))}</option>`).join('');
    return `${nav()}<div class="sec"><h2>1단계 · 재고관리</h2><span class="more">보관 위치 기준</span></div>
      <p class="hint">재고 종류를 따로 나누지 않고 <b>냉장 / 냉동 / 실온</b>으로만 구분해요. 소분 냉동도 냉동 안에 같이 보여요.</p>
      <div class="sec"><h2>냉장</h2></div><div class="card">${groupRows('냉장')}</div>
      <div class="sec"><h2>냉동</h2></div><div class="card">${groupRows('냉동')}<div class="btnrow"><button class="btn pri" data-mg="cubesave">냉동 수량 갱신</button></div></div>
      <div class="sec"><h2>실온</h2></div><div class="card">${groupRows('실온')}</div>
      <div class="btnrow"><button class="btn pri" data-mg="rawsave">전체 실재고 갱신</button></div>
      <div class="sec"><h2>재고 추가</h2></div><div class="card"><div class="fld"><label>재료</label><select id="mgAddKey">${opts}</select></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="fld"><label>현재량</label><input id="mgAddQty" type="number" min="0" step="0.1" placeholder="예: 120"></div><div class="fld"><label>단위</label><select id="mgAddUnit"><option>g</option><option>개</option><option>팩</option></select></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="fld"><label>1개·1팩당 g</label><input id="mgAddGram" type="number" min="0.1" step="0.1" placeholder="g이면 비워도 됨"></div><div class="fld"><label>보관</label><select id="mgAddLoc"><option>냉장</option><option>냉동</option><option>실온</option></select></div></div><div class="btnrow"><button class="btn pri" data-mg="addraw">재고에 추가</button></div></div>
      <div class="sec"><h2>소분 냉동 추가</h2></div><div class="card"><p class="hint">20g × 6개처럼 소분해 둔 것만 여기서 입력해요. 재고 목록에서는 다른 냉동 재료와 함께 보여요.</p><div class="fld"><label>재료</label><select id="mg30CubeKey">${opts}</select></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="fld"><label>1개 기준량(g)</label><input id="mg30CubeUnit" type="number" min="1" step="1" value="${unitFor('rice')}"></div><div class="fld"><label>현재 개수</label><input id="mg30CubeCount" type="number" min="0" step="1" placeholder="예: 6"></div></div><div class="fld"><label>제조일</label><input id="mg30CubeDate" type="date" value="${today}"></div><div class="btnrow"><button class="btn pri" data-mg30="cubeadd">냉동에 추가</button></div></div>`;
  }
  vShop=function(){if(window.__mgStage==='stock')return stockView();return prevShop()};

  function frozenTotal(name){
    let g=0;
    for(const [k,v] of Object.entries(inventory||{})){if(norm(invName(k))!==name||v.location!=='냉동')continue;g+=v.unit==='g'?(Number(v.qty)||0):(Number(v.qty)||0)*(Number(v.gramsPerUnit)||0)}
    for(const b of cubes())if(norm(b.ingredient)===name)g+=(Number(b.unitG)||0)*(Number(b.remainingCount)||0);
    return g;
  }
  function freshTotal(name){
    let g=0;
    for(const [k,v] of Object.entries(inventory||{})){if(norm(invName(k))!==name||v.location==='냉동')continue;g+=v.unit==='g'?(Number(v.qty)||0):(Number(v.qty)||0)*(Number(v.gramsPerUnit)||0)}
    return g;
  }
  function prepCard(sun,count){
    const b=batchPlan(sun,count);if(!b?.common?.length)return'';
    const rows=b.common.map(r=>{const name=norm(r.name),need=Math.max(0,Number(r.g)||0),frozen=Math.min(need,frozenTotal(name)),toHandle=Math.max(0,need-frozen),fresh=Math.min(toHandle,freshTotal(name)),short=Math.max(0,toHandle-fresh);return `<div style="padding:10px 0;border-top:1px solid var(--line2)"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(r.name)}</b><b>${Math.ceil(need)}g 필요</b></div><div class="hint" style="margin-top:4px">기존 냉동 <b style="color:var(--mint)">${Math.ceil(frozen)}g</b> · 새로 손질 <b>${Math.ceil(toHandle)}g</b>${short?` · <b style="color:var(--berry)">${Math.ceil(short)}g 부족</b>`:''}</div></div>`}).join('');
    return `<div class="card" id="mg31-prep-split" style="margin:12px 0"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>공통재료 준비</b><span class="chip sm">자동 계산</span></div><p class="hint" style="margin:6px 0 0">냉동에 있는 양은 <b>기존 냉동</b>으로 고정 반영하고, 나머지만 <b>새로 손질</b>할 양으로 보여줘요.</p>${rows}</div>`;
  }
  sheetBatch=function(sun,count=7){prevSheetBatch(sun,count);try{sheet.querySelector('#mg30-prep-split')?.remove();const html=prepCard(sun,count);if(!html)return;const grab=sheet.querySelector('.grab');if(grab)grab.insertAdjacentHTML('afterend',html);else sheet.insertAdjacentHTML('afterbegin',html)}catch(e){}};
  try{render(true)}catch(e){}
})();