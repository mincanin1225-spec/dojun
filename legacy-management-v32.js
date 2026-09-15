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