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
    const s=window.__mgStage,b=targetBase(),weekend=isPrepWeekend();
    return `<div class="card" style="padding:10px;margin-bottom:12px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
        <button class="chip ${window.__mgWeekTarget==='current'?'ok':''}" data-v33week="current">이번 주</button>
        <button class="chip ${window.__mgWeekTarget==='next'?'ok':''}" data-v33week="next">다음 주 준비${weekend?' · 시작':''}</button>
      </div>
      <div class="hint" style="margin:0 2px 9px">${window.__mgWeekTarget==='next'?`다음 주 ${weekTitle(b)}를 미리 준비 중이에요.`:`${weekend?'토요일·일요일에는 다음 주 준비를 같이 확인할 수 있어요.':'이번 주 식단과 재고를 관리해요.'}`}</div>
      <div class="chips" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
        <button class="chip ${s==='stock'?'ok':''}" data-mg="stock">1 재고관리</button>
        <button class="chip ${s==='shop'?'ok':''}" data-mg="shop">2 장보기</button>
        <button class="chip ${s==='prep'?'ok':''}" data-mg="prep">3 식단만들기</button>
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
  function unitFor(k){try{const A=stage(today),x=byK[k];if(k==='rice')return A.rice;if(!x)return 20;if(x.cat==='v')return A.veg;if(x.cat==='f')return A.fruit;if(x.k==='tofu')return A.tofu;if(x.fish)return A.fish;if(x.cat==='p')return A.meat}catch(e){}return 20}

  function stockSnapshot(){
    ensureCodes();const out={};
    const row=n=>{n=norm(n);return out[n]||(out[n]={name:n,g:0,n:0,by:{'냉장':0,'냉동':0,'실온':0},countBy:{'냉장':0,'냉동':0,'실온':0},parts:[],codes:[],lots:[]})};
    for(const [k,v] of Object.entries(inventory||{})){
      const r=row(invName(k)),loc=['냉장','냉동','실온'].includes(v.location)?v.location:'냉동',q=Math.max(0,Number(v.qty)||0),g=grams(v);
      if(g){r.g+=g;r.by[loc]+=g;r.lots.push({loc,g,prepared:false});if(v.unit==='개'&&Number(v.gramsPerUnit)>0)r.parts.push(`${loc} 소분 ${Number(v.gramsPerUnit)}g × ${Math.ceil(q)}개`)}
      else if(v.unit==='개'){r.n+=q;r.countBy[loc]+=q}
      if(v.stockCode&&!r.codes.includes(v.stockCode))r.codes.push(v.stockCode);
    }
    for(const b of cubes()){
      const r=row(b.ingredient),cnt=Math.max(0,Number(b.remainingCount)||0),u=Math.max(0,Number(b.unitG)||0),g=u*cnt;
      if(g){r.g+=g;r.by['냉동']+=g;r.lots.push({loc:'냉동',g,prepared:true});r.parts.push(`냉동 소분 ${u}g × ${Math.ceil(cnt)}개`)}
      if(b.stockCode&&!r.codes.includes(b.stockCode))r.codes.push(b.stockCode);
    }
    return out;
  }

  function totalSummary(){
    const rows=Object.values(stockSnapshot()).filter(r=>r.g>0||r.n>0).sort((a,b)=>a.name.localeCompare(b.name,'ko'));
    if(!rows.length)return '<p class="hint">등록된 재고가 없어요.</p>';
    return rows.map(r=>`<div class="inventory-row"><div style="flex:1;min-width:0"><b>${esc(r.name)}</b><div class="hint">재고번호 ${esc(r.codes.join(', ')||'-')}</div>${r.parts.length?`<div class="hint" style="color:var(--ink2);font-weight:700">${r.parts.map(esc).join(' · ')}</div>`:''}</div><div style="text-align:right"><b>${r.g?`${Math.ceil(r.g)}g`:`${Math.ceil(r.n)}개`}</b>${r.g?'<div class="hint">총 보유량</div>':''}</div></div>`).join('');
  }
  function rawRow(k,v){
    const total=grams(v),portion=v.unit==='개'&&Number(v.gramsPerUnit)>0;
    return `<div class="inventory-row"><div style="flex:1"><div style="display:flex;gap:7px;align-items:center"><span class="chip sm">${esc(v.stockCode||'-')}</span><b>${esc(invName(k))}</b></div><div style="margin-top:6px;display:flex;align-items:center;gap:6px"><input data-rq="${esc(k)}" type="number" min="0" step="0.1" value="${Number(v.qty)||0}" style="width:82px;border:1px solid var(--line);border-radius:9px;padding:6px"><span>${esc(v.unit)}</span>${portion?`<span class="hint">× ${Number(v.gramsPerUnit)}g = ${Math.ceil(total)}g</span>`:''}</div><div class="hint">${esc(v.location||'')} ${portion?'· 소분':''}</div></div><button class="btn" data-a="invedit:${esc(k)}">수정</button></div>`;
  }
  function cubeRow(b,i){const total=Math.max(0,(Number(b.unitG)||0)*(Number(b.remainingCount)||0));return `<div class="inventory-row"><div style="flex:1"><div style="display:flex;gap:7px;align-items:center"><span class="chip sm">${esc(b.stockCode||'-')}</span><b>${esc(b.ingredient||'')}</b></div><div style="margin-top:6px"><input data-cq="${i}" type="number" min="0" step="1" value="${Number(b.remainingCount)||0}" style="width:68px;border:1px solid var(--line);border-radius:9px;padding:6px">개 <span class="hint">× ${Number(b.unitG)||0}g = ${Math.ceil(total)}g</span></div><div class="hint">냉동 · 소분${b.madeDate?` · ${esc(b.madeDate)}`:''}</div></div></div>`}
  function groupRows(loc){const cb=ensureCodes();let html=Object.entries(inventory||{}).filter(([,v])=>(v.location||'냉동')===loc).map(([k,v])=>rawRow(k,v)).join('');if(loc==='냉동')html+=cb.map(cubeRow).join('');return html||`<p class="hint">${loc} 재고가 없어요.</p>`}
  function stockView(){
    ensureCodes();const opts=inventoryKeys().map(k=>`<option value="${esc(k)}">${esc(invName(k))}</option>`).join('');
    return `${nav()}<div class="sec"><h2>1단계 · 재고관리</h2><span class="more">총량 + 소분내역</span></div>
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
    if(window.__mgStage==='home')return homeView();
    return prevShop();
  };

  document.addEventListener('click',async function(e){
    const tab=e.target.closest&&e.target.closest('[data-a="tab:shop"]');if(tab)window.__mgWeekTarget='current';
    const wk=e.target.closest&&e.target.closest('[data-v33week]');if(wk){e.preventDefault();e.stopImmediatePropagation();window.__mgWeekTarget=wk.dataset.v33week;render(true);return}
    const ck=e.target.closest&&e.target.closest('[data-v33check]');if(ck){e.preventDefault();e.stopImmediatePropagation();const[id,enc]=ck.dataset.v33check.split('|'),w=windows().find(x=>x.id===id),name=decodeURIComponent(enc);if(!w)return;const key=checkKey(w),list=shopChk[key]||(shopChk[key]=[]),i=list.indexOf(name);i<0?list.push(name):list.splice(i,1);try{await store.set('shop2',shopChk)}catch(_){}render(true);return}
    const prep=e.target.closest&&e.target.closest('[data-v33prep]');if(prep){e.preventDefault();e.stopImmediatePropagation();const w=windows().find(x=>x.id===prep.dataset.v33prep);if(w)sheetBatch(w.start,w.count);return}
  },true);

  try{render(true)}catch(e){}
})();