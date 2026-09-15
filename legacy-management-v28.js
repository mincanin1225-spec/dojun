(function(){
  'use strict';
  if(typeof TABS==='undefined'||typeof vShop!=='function'||typeof shoppingNeeds!=='function')return;
  TABS[1][1]='관리';
  window.__mgStage=window.__mgStage||'stock';

  const cubeBatches=()=>{try{const v=JSON.parse(localStorage.getItem('dj:cubeInventory2')||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}};
  const cubeByIngredient=()=>{const out={};for(const b of cubeBatches()){const n=String(b.ingredient||'').trim();if(!n)continue;out[n]=(out[n]||0)+(Number(b.unitG)||0)*(Number(b.remainingCount)||0)}return out};
  const mgNeed=()=>{const b=shopBatch(),base=shoppingNeeds(b),cube=cubeByIngredient(),out={};for(const [name,v] of Object.entries(base)){if(v.unknown){out[name]={...v,buy:v.missing||0,cubeG:cube[name]||0};continue}const miss=Math.max(0,(Number(v.missing)||0)-(cube[name]||0));out[name]={...v,buy:miss,cubeG:cube[name]||0}}return{b,out}};
  const prepNeed=()=>{const b=shopBatch(),base=shoppingNeeds(b),cube=cubeByIngredient(),out={};for(const [name,v] of Object.entries(base)){if(v.unknown){out[name]={...v,make:null,cubeG:cube[name]||0};continue}const total=Math.max(0,Number(v.g)||0),make=Math.max(0,total-(cube[name]||0));out[name]={...v,make,cubeG:cube[name]||0}}return{b,out}};
  const cubeRows=()=>cubeBatches().map((b,i)=>`<div class="inventory-row"><div style="flex:1"><b>${esc(b.code||'-')} · ${esc(b.ingredient||'')}</b><div>${Number(b.unitG)||0}g × <input data-cq="${i}" type="number" min="0" step="1" value="${Number(b.remainingCount)||0}" style="width:64px;border:1px solid var(--line);border-radius:9px;padding:5px">개</div><div class="hint">${esc(b.madeDate||'')} · ${esc(b.location||'냉동')}</div></div><div><b>${Math.round((Number(b.unitG)||0)*(Number(b.remainingCount)||0))}g</b></div></div>`).join('');
  const rawRows=()=>Object.entries(inventory).map(([k,v])=>`<div class="inventory-row"><div style="flex:1"><b>${esc(invName(k))}</b><div><input data-rq="${esc(k)}" type="number" min="0" step="0.1" value="${Number(v.qty)||0}" style="width:76px;border:1px solid var(--line);border-radius:9px;padding:5px"> ${esc(v.unit)} · ${esc(v.location)}</div><div class="hint">${esc(v.memo||'')}</div></div><button class="btn" data-a="invedit:${esc(k)}">수정</button></div>`).join('');

  function nav(){return `<div class="card" style="padding:10px"><div class="chips" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px"><button class="chip ${window.__mgStage==='stock'?'ok':''}" data-mg="stock">1 재고관리</button><button class="chip ${window.__mgStage==='shop'?'ok':''}" data-mg="shop">2 장보기</button><button class="chip ${window.__mgStage==='prep'?'ok':''}" data-mg="prep">3 식단만들기</button></div><div class="hint" style="margin-top:8px">재고관리 → 부족분만 장보기 → 필요한 것만 만들기 → <b>식단 탭에서 전체 스케줄 확인</b></div></div>`}
  function stockView(){const cubes=cubeRows();return `${nav()}<div class="sec"><h2>1단계 · 재고관리</h2><button class="btn pri" data-a="invedit">재료 추가</button></div><p class="hint">토요일에 실제 집 재고를 보고 숫자만 맞춘 뒤 한 번에 갱신해요.</p><div class="card"><b>우리집 식재료</b>${rawRows()||'<p class="hint">등록된 식재료가 없어요.</p>'}<div class="btnrow"><button class="btn pri" data-mg="rawsave">실재고 갱신</button></div></div><div class="sec"><h2>만들어둔 냉동 큐브</h2></div><div class="card">${cubes||'<p class="hint">등록된 냉동 큐브가 없어요.</p>'}<div class="btnrow"><button class="btn pri" data-mg="cubesave">냉동큐브 재고 갱신</button></div></div>`}
  function shopView(){const {b,out}=mgNeed(),rows=Object.entries(out).filter(([,v])=>v.unknown||v.buy>0).map(([n,v])=>`<div class="shop"><div class="nm"><b>${esc(n)}</b><div class="hint">${v.unknown?'수량 확인 필요':`식단 필요 ${Math.round(v.g)}g · 집재고 반영 · 냉동큐브 ${Math.round(v.cubeG)}g`}</div></div><div class="qt">${v.unknown?'확인':`<b>${Math.ceil(v.buy)}g 사기</b>`}</div></div>`).join('');return `${nav()}<div class="sec"><h2>2단계 · 장보기</h2></div><p class="hint">1단계 재고를 반영해서 <b>실제로 사야 하는 것만</b> 보여줘요.</p><div class="card">${rows||'<p class="hint"><b>추가로 살 재료가 없어요.</b> 현재 재고로 준비할 수 있어요.</p>'}</div><div class="btnrow"><button class="btn" data-mg="shopcopy">장보기 목록 복사</button><button class="btn pri" data-mg="prep">3단계 식단만들기 ›</button></div>`}
  function prepView(){const {b,out}=prepNeed(),rows=Object.entries(out).filter(([,v])=>v.unknown||v.make>0).map(([n,v])=>`<div class="inventory-row"><div><b>${esc(n)}</b><div class="hint">${v.unknown?'수량 확인 필요':`이번 구간 필요 ${Math.round(v.g)}g · 냉동큐브 ${Math.round(v.cubeG)}g`}</div></div><div>${v.unknown?'확인':`<b>${Math.ceil(v.make)}g 만들기</b>`}</div></div>`).join('');return `${nav()}<div class="sec"><h2>3단계 · 식단만들기</h2><button class="more" data-a="batch">상세 만들기 ›</button></div><p class="hint">이미 만들어둔 냉동큐브는 빼고, 이번 준비일에 새로 만들 재료만 보여줘요.</p><div class="card">${rows||'<p class="hint"><b>새로 만들 재료가 없어요.</b> 냉동재고로 준비할 수 있어요.</p>'}</div><div class="btnrow"><button class="btn" data-a="batch">조리 순서 자세히</button><button class="btn pri" data-a="tab:cal">4단계 · 전체 스케줄 보기</button></div>`}

  vShop=function(){return window.__mgStage==='shop'?shopView():window.__mgStage==='prep'?prepView():stockView()};

  document.addEventListener('click',function(e){const t=e.target.closest&&e.target.closest('[data-mg]');if(!t)return;const a=t.dataset.mg;e.preventDefault();e.stopImmediatePropagation();
    if(['stock','shop','prep'].includes(a)){window.__mgStage=a;render();return}
    if(a==='rawsave'){
      document.querySelectorAll('[data-rq]').forEach(x=>{const k=x.dataset.rq;if(inventory[k]){inventory[k].qty=Math.max(0,Number(x.value)||0);inventory[k].updatedAt=Date.now();try{pushInventoryItem(k)}catch(_){}}});persistInventoryLocal();toast('실재고를 갱신했어요');render(true);return;
    }
    if(a==='cubesave'){
      const b=cubeBatches();document.querySelectorAll('[data-cq]').forEach(x=>{const i=Number(x.dataset.cq);if(b[i]){b[i].remainingCount=Math.max(0,Math.round(Number(x.value)||0));b[i].updatedAt=Date.now()}});localStorage.setItem('dj:cubeInventory2',JSON.stringify(b));localStorage.setItem('dj:cubeInventoryRefreshedAt',new Date().toISOString());toast('냉동큐브 재고를 갱신했어요');render(true);return;
    }
    if(a==='shopcopy'){const {out}=mgNeed();const lines=Object.entries(out).filter(([,v])=>v.unknown||v.buy>0).map(([n,v])=>`${n}: ${v.unknown?'수량 확인':Math.ceil(v.buy)+'g'}`);const txt='도준이 장보기\n'+(lines.join('\n')||'추가 구매 없음');if(navigator.clipboard)navigator.clipboard.writeText(txt).then(()=>toast('장보기 목록을 복사했어요')).catch(()=>{});return}
  },true);

  try{bar();render(true)}catch(e){}
})();