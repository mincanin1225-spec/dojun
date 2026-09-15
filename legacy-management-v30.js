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