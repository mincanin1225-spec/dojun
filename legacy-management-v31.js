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