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
  function requirements(start,count){const t=weekList(start,count);let rice=0;for(let d=0;d<count;d++){const on=addD(start,d);for(let i=0;i<3;i++)if(mObj(on,i))rice+=stage(on).rice}if(rice)t['밥 (조리 후)']={c:'e',g:rice,n:0};return t}
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
        const name=norm(name0),needG=Math.max(0,Number(v.g)||0),needMaxG=Math.max(needG,Number(v.gMax)||0),needN=Math.max(0,Number(v.n)||0),p=pool[name]||(pool[name]={grams:[],counts:[]});
        if(needMaxG>0){const before=byLoc(p.grams,'g'),available=Object.values(before).reduce((a,b)=>a+(Number(b)||0),0),c=consumeVirtual(p.grams,needMaxG,'g');out[name]={name,needG,needMaxG,beforeG:before,buyMinG:Math.max(0,needG-available),buyG:Math.max(0,c.left),range:needMaxG>needG,unknown:false}}
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

  function nav(){const s=window.__mgStage,b=targetBase();return `<div class="card" style="padding:10px;margin-bottom:12px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px"><button class="chip ${window.__mgWeekTarget==='current'?'ok':''}" data-v33week="current">이번 주</button><button class="chip ${window.__mgWeekTarget==='next'?'ok':''}" data-v33week="next">다음 주 준비</button></div><div class="chips" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px"><button class="chip ${s==='stock'?'ok':''}" data-mg="stock">1 재고관리</button><button class="chip ${s==='shop'?'ok':''}" data-mg="shop">2 장보기</button><button class="chip ${s==='prep'?'ok':''}" data-mg="prep">3 식단만들기</button></div><div class="hint" style="margin:9px 2px 0">${window.__mgWeekTarget==='next'?`다음 주 ${weekTitle(b)} 준비 중`:`${weekTitle(b)} 운영 중`}</div></div>`}
  function flowCard(){const ws=windows(),first=isDone(ws[0]),second=isDone(ws[1]);if(second)return `<div class="banner b-shop"><h3>2차 제작 완료 · 재고 차감됨</h3><p>남은 재고가 다음 주 장보기의 기준이에요. 토요일에는 다음 주 준비로 넘어가면 됩니다.</p><div class="row"><button data-v35next="1">다음 주 장보기 보기 ›</button></div></div>`;if(first)return `<div class="banner b-shop"><h3>1차 제작 완료 · 재고 차감됨</h3><p><b>수요일 2차 장보기</b>를 남은 재고 기준으로 다시 계산했어요. 장을 본 뒤 목요일에 2차를 제작하면 됩니다.</p></div>`;return `<div class="banner b-shop"><h3>이번 준비 순서</h3><p>토요일 1차 장보기 → 일요일 1차 제작 완료 → 재고 자동 차감 → 수요일 2차 장보기 → 목요일 2차 제작</p></div>`}
  function shoppingRows(w,rows){if(isDone(w))return `<p class="hint"><b>${w.title} 제작 완료.</b> 사용 재고는 이미 차감됐어요.</p>`;const list=Object.values(rows).filter(x=>x.unknown||(x.buyG||0)>0||(x.buyN||0)>0);if(!list.length)return '<p class="hint"><b>추가 구매 없음.</b> 현재 남은 재고로 준비 가능해요.</p>';return list.map(x=>{const on=checked(w,x.name),isCount=x.buyN!==undefined,qty=x.unknown?'수량 확인':x.range?`${Math.ceil(x.buyMinG||0)}~${Math.ceil(x.buyG||0)}g`:`${Math.ceil(isCount?x.buyN:x.buyG)}${isCount?'개':'g'}`,need=x.unknown?`${x.needN||''}회`:x.range?`${Math.ceil(x.needG)}~${Math.ceil(x.needMaxG)}g`:`${Math.ceil(isCount?x.needN:x.needG)}${isCount?'개':'g'}`,stock=x.unknown?'재고 단위 확인 필요':locText(isCount?x.beforeN:x.beforeG,isCount?'개':'g');return `<div class="shop${on?' on':''}" data-v33check="${w.id}|${encodeURIComponent(x.name)}" style="align-items:flex-start"><div class="bx" style="margin-top:5px"></div><div class="nm"><b>${esc(x.name)}</b><div class="hint">필요 ${esc(need)}</div><div class="hint"><b>현재 남은 재고</b> · ${esc(stock)}</div></div><div style="min-width:96px;text-align:center;background:var(--peach-s);border-radius:14px;padding:8px 7px;color:var(--peach)"><div style="font-size:10.5px;font-weight:800">${on?'구매완료':'추가 구매'}</div><div style="font-size:20px;font-weight:900;line-height:1.15;margin-top:2px">${esc(qty)}</div></div></div>`}).join('')}
  function shopView(){const a=allocation(),b=targetBase();return `${nav()}${flowCard()}<div class="sec"><h2>2단계 · 장보기</h2><span class="more">남은 재고 기준 재계산</span></div><p class="hint">제작 완료된 차수는 다시 차감하지 않고, <b>실제로 남은 재고</b>부터 다음 차수 부족분을 계산해요.</p>${windows().map(w=>`<div class="sec"><h2>${w.id==='first'?'1차':'2차'} 장보기</h2><span class="more">${w.shop} · ${w.range}</span></div><div class="card">${shoppingRows(w,a[w.id])}</div>`).join('')}<div class="btnrow"><button class="btn pri" data-mg="prep">식단만들기 ›</button></div>`}
  function prepRows(w,rows){if(isDone(w)){const m=markers[w.start];return `<div class="card" style="margin:10px 0"><div style="display:flex;justify-content:space-between;gap:8px"><b>${w.title} · ${w.range}</b><span class="chip sm ok">제작완료</span></div><div class="hint" style="margin-top:7px">재고 차감 완료${m?.completedAt?` · ${new Date(m.completedAt).toLocaleString('ko-KR')}`:''}</div><button class="btn" style="width:100%;margin-top:10px" data-v33prep="${w.id}">완료 내역 보기 ›</button></div>`}const all=Object.values(rows),ready=all.filter(x=>!x.unknown&&((x.buyG||0)<=0&&(x.buyN||0)<=0)).length;return `<div class="card" style="margin:10px 0"><div style="display:flex;justify-content:space-between;gap:8px"><b>${w.title} · ${w.range}</b><span class="chip sm ${ready===all.length?'ok':''}">${ready}/${all.length} 준비</span></div><div class="hint" style="margin-top:5px">${w.shop} → ${w.prep}</div>${all.map(x=>{const miss=x.unknown?1:(x.buyG||x.buyN||0);return `<div class="inventory-row"><div style="flex:1"><b>${esc(x.name)}</b><div class="hint">${x.unknown?'수량 확인 필요':`보유 ${esc(locText(x.beforeG||x.beforeN,x.needG!==undefined?'g':'개'))}`}</div></div><span class="chip sm ${miss<=0?'ok':''}">${miss<=0?'준비완료':x.unknown?'확인 필요':'구매 필요'}</span></div>`}).join('')}<button class="btn pri" style="width:100%;margin-top:10px" data-v33prep="${w.id}">${w.title} 상세 만들기 ›</button></div>`}
  function prepView(){const a=allocation();return `${nav()}${flowCard()}<div class="sec"><h2>3단계 · 식단만들기</h2><span class="more">완료 시 재고 자동 차감</span></div><p class="hint">상세 만들기의 준비 체크가 모두 완료되면 해당 차수 사용량을 <b>한 번만</b> 재고에서 차감합니다.</p>${windows().map(w=>prepRows(w,a[w.id])).join('')}`}

  vShop=function(){if(window.__mgStage==='shop')return shopView();if(window.__mgStage==='prep')return prepView();const html=baseView();if(window.__mgStage==='home'&&typeof html==='string')return html.replace(/(<div class=\"card\" style=\"padding:10px;margin-bottom:12px\">)/,`${flowCard()}$1`);return html};

  function measurableShortages(start,count){const snap=stockSnapshot(),miss=[];for(const [name0,v] of Object.entries(requirements(start,count))){const name=norm(name0),needG=Math.max(0,Number(v.gMax)||Number(v.g)||0),needN=Math.max(0,Number(v.n)||0),r=snap[name]||{g:0,n:0};if(needG>0&&r.g+1e-9<needG)miss.push(`${name} ${Math.ceil(needG-r.g)}g`);else if(name==='계란'&&needN>0&&r.n+1e-9<needN)miss.push(`${name} ${Math.ceil(needN-r.n)}개`)}return miss}
  function deductBatch(start,count){
    if(markers[start])return {ok:true,already:true};
    const req=requirements(start,count),ranges=Object.entries(req).filter(([,v])=>(Number(v.gMax)||0)>(Number(v.g)||0));
    if(ranges.length)return{ok:false,range:true,missing:ranges.slice(0,3).map(([n,v])=>`${norm(n)} ${Math.ceil(Number(v.g)||0)}~${Math.ceil(Number(v.gMax)||0)}g · 실제 사용량 확인`)};
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

  function tryAutoComplete(start,count){const p=batchProgress(start,count);if(!p.all||markers[start]){decorateSheet(start,count);return}const r=deductBatch(start,count);if(r.ok){toast('제작 완료 · 사용 재고를 차감했어요');try{render(true)}catch(e){}}else toast(r.range?`사용량 확인 · ${r.missing.slice(0,2).join(', ')}`:`재고 부족 · ${r.missing.slice(0,2).join(', ')} 먼저 확인해 주세요`);decorateSheet(start,count)}

  document.addEventListener('click',function(e){
    const doneBtn=e.target.closest&&e.target.closest('[data-a^="bdone:"]');if(doneBtn){const start=curBatch?.sun,count=curBatch?.count||lastCounts[start]||7;if(start){lastCounts[start]=count;setTimeout(()=>tryAutoComplete(start,count),60)}}
    const retry=e.target.closest&&e.target.closest('[data-v35complete]');if(retry){e.preventDefault();e.stopImmediatePropagation();const [start,c]=retry.dataset.v35complete.split('|'),count=Number(c)||lastCounts[start]||7;tryAutoComplete(start,count);return}
    const next=e.target.closest&&e.target.closest('[data-v35next]');if(next){e.preventDefault();e.stopImmediatePropagation();window.__mgWeekTarget='next';window.__mgStage='shop';render(true);return}
  },true);

  try{if(typeof store!=='undefined'&&store?.get)Promise.resolve(store.get('batchStock2')).then(v=>{if(v&&typeof v==='object'){markers={...markers,...v};saveMarkers();render(true)}}).catch(()=>{})}catch(e){}
  try{if(typeof online!=='undefined'&&online&&typeof sync!=='undefined'&&sync?.url&&sync?.code&&typeof famURL==='function')fetch(famURL('batchStock2')).then(r=>r.ok?r.json():null).then(v=>{if(v&&typeof v==='object'){markers={...markers,...v};saveMarkers();render(true)}}).catch(()=>{})}catch(e){}
})();