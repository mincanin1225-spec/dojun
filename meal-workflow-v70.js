(function(root){
 'use strict';
 const E=root.MealStockV63;
 if(!E||typeof vShop!=='function'||typeof mText!=='function')return;
 const K={prepared:'dj:preparedMealInventory1',cubes:'dj:cubeInventory2',feeds:'dj:mealFeedsV63',ops:'dj:mealOpsV63',recipes:'dj:mealRecipesV63',journal:'dj:mealJournalV63',prep:'dj:prepChecklist2',shoppingStock:'dj:shoppingStockReceipts1'};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const clone=x=>JSON.parse(JSON.stringify(x));
 const read=(key,fallback)=>{const s=localStorage.getItem(key);return s===null?fallback:JSON.parse(s)};
 const write=(key,v)=>localStorage.setItem(key,JSON.stringify(v));
 const oldView=vShop,oldSheet=typeof sheetDay==='function'?sheetDay:null,oldBatch=typeof sheetBatch==='function'?sheetBatch:null;
 let locked=false,failed=false;
 const date=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
 function snapshot(){
   const raw=clone(inventory);for(const k of Object.keys(raw))raw[k].displayName=invName(k);
   return {raw,prepared:read(K.prepared,[]),cubes:read(K.cubes,[]),feeds:read(K.feeds,{}),ops:read(K.ops,{}),recipes:read(K.recipes,{})};
 }
 function localRaw(raw){const out=clone(raw);for(const k of Object.keys(out))delete out[k].displayName;return out}
 function saveSnapshot(s){
   for(const k of ['prepared','cubes','feeds','ops'])write(K[k],s[k]);
   write('dj:inventory2',localRaw(s.raw));
 }
 // An unfinished journal is restored before any new stock operation, never silently reapplied.
 try{const j=read(K.journal,null);if(j){saveSnapshot(j.before);inventory=localRaw(j.before.raw);localStorage.removeItem(K.journal)}}catch(e){failed=true}
 function commit(before,after){
   if(failed)throw Error('저장 복구가 필요해요. 재고 변경을 중단했어요');
   const changed=Object.keys(after.raw).filter(k=>JSON.stringify(before.raw[k])!==JSON.stringify(after.raw[k]));
   changed.forEach(k=>after.raw[k].updatedAt=Math.max(Date.now(),Number(after.raw[k].updatedAt||0)+1));
   write(K.journal,{before});
   try{saveSnapshot(after);localStorage.removeItem(K.journal)}catch(e){
     try{saveSnapshot(before);localStorage.removeItem(K.journal)}catch(rollback){failed=true}
     throw Error('저장 실패 · 완료 처리하지 않았어요');
   }
   inventory=localRaw(after.raw);
   // Network sharing is deliberately after the local transaction, never during a partial write.
   if(changed.length){if(typeof persistInventoryLocal==='function')persistInventoryLocal();changed.forEach(k=>{if(typeof pushInventoryItem==='function')pushInventoryItem(k)})}
 }
 const verified=on=>root.__PPEUNI_SCHEDULE_V58&&root.__PPEUNI_SCHEDULE_V58.entry(on);
 const recipeMap=()=>read(K.recipes,{});
 function model(on,slot){
   if(typeof isDel==='function'&&isDel(on))return null;
   const text=String(mText(on,slot)||'').trim();if(!text)return null;
   const name=E.norm(text),saved=recipeMap()[name],v=verified(on),m=v&&v.meals[slot];
   if(saved)return {key:on+'|'+slot,on,slot,name,g:saved.yieldG,ingredients:saved.ingredients,steps:saved.steps,source:'사용자 확인 레시피'};
   const original=m?[m.base,...String(m.t||'').split(/\s+/)].filter(Boolean).join(' · '):'';
   let ingredients=[];
   if(m&&E.norm(original)===name&&v.stage==='late'){
     const plain=['잡곡무른밥','잡곡진밥'].includes(m.base);
     if(m.base)ingredients.push({name:E.norm(m.base),g:plain?100:null});
     const simple=new Set(['소고기','닭고기','두부','생선','흰살생선','연어','새우','계란','비타민채','밤','무','양파','양배추','적채','토마토','파프리카','당근','애호박','단호박','브로콜리','청경채','배추','감자','고구마','시금치','연근','팽이버섯','근대','비트','가지']);
     String(m.t||'').split(/\s+/).filter(Boolean).forEach(x=>ingredients.push({name:E.norm(x),g:simple.has(E.norm(x))?20:null}));
   }else ingredients=[{name,g:null}];
   return {key:on+'|'+slot,on,slot,name,ingredients,g:ingredients.every(x=>x.g>0)?ingredients.reduce((a,x)=>a+x.g,0):null,steps:'',source:'기존 식단 분량 · 실제 사용량 확인 필요'};
 }
 function meals(start,count){const result=[];for(let i=0;i<count;i++)for(let j=0;j<3;j++){const m=model(addD(start,i),j);if(m)result.push(m)}return result}
 function target(){return root.__mgWeekTarget==='next'?addD(weekCur,7):weekCur}
 function nav(){
   const next=root.__mgWeekTarget==='next',feedDay=typeof today==='string'?today:date(),stage=root.__mgStage;
   return '<div class="card" style="padding:12px;margin-bottom:14px">'+
     '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:9px"><button class="chip '+(!next?'ok':'')+'" data-v33week="current">이번 주</button><button class="chip '+(next?'ok':'')+'" data-v33week="next">다음 주</button></div>'+
     '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px"><button class="btn '+(stage==='stock'?'pri':'')+'" data-mg="stock">1 · 재고</button><button class="btn '+(stage==='shop'?'pri':'')+'" data-mg="shop">2 · 장보기</button><button class="btn '+(stage==='prep'?'pri':'')+'" data-mg="prep">3 · 만들기</button><button class="btn" data-a="day:'+feedDay+'" '+(next?'disabled':'')+'>4 · 먹이기·기록</button></div>'+
     '<p class="hint" style="margin:9px 2px 0">'+(next?'다음 주 준비는 1~3단계까지 진행해요.':'재고 확인부터 먹인 뒤 기록까지 한 흐름으로 관리해요.')+'</p></div>'
 }
 function polishLegacy(html){
   if(typeof html!=='string')return html;
   try{
     const wrap=document.createElement('div');wrap.innerHTML=html;
     const oldNav=[...wrap.querySelectorAll('.card')].find(x=>x.querySelector('[data-mg="stock"]')&&x.querySelector('[data-mg="shop"]')&&x.querySelector('[data-mg="prep"]')&&!x.querySelector('[data-a^="day:"]'));
     if(oldNav)oldNav.outerHTML=nav();else wrap.insertAdjacentHTML('afterbegin',nav());
     for(const banner of [...wrap.querySelectorAll('.banner.b-shop')]){
       const t=String(banner.textContent||'').replace(/\s+/g,' ');
       if(t.includes('이번 준비 순서')||t.includes('제작 완료 · 재고 차감됨')||t.includes('재고 자동 차감'))banner.remove();
     }
     return wrap.innerHTML;
   }catch(e){return nav()+html}
 }
 function plan(){return E.plan(meals(target(),7),snapshot())}
 const PREPARED_ONLY_SHOP_EXCLUDE=new Set(['잡곡무른밥','잡곡진밥','쌀구기자닭죽','당근톳밥','강낭콩밥','밥 (조리 후)']);
 function isPreparedOnlyShoppingName(name){return PREPARED_ONLY_SHOP_EXCLUDE.has(E.norm(name))}
 function shopKey(start){return 'mg29|'+start}
 function shopList(start){return shopChk?.[shopKey(start)]||[]}
 function shopChecked(start,name){return shopList(start).includes(name)}
 function saveShopChecks(){try{Promise.resolve(store.set('shop2',shopChk)).catch(()=>{})}catch(e){}}
 function shoppingReceipts(){return read(K.shoppingStock,{})}
 function shoppingReceiptKey(start,name){return String(start)+'|'+E.norm(name)}
 function shoppingInventoryKey(name){
   const n=E.norm(name);
   try{
     const keys=typeof inventoryKeys==='function'?inventoryKeys():Object.keys(inventory||{});
     const found=keys.find(k=>E.norm((inventory?.[k]?.customName)||invName(k))===n);
     if(found)return found;
   }catch(e){}
   for(const [k,v] of Object.entries(inventory||{}))if(E.norm(v?.customName||k)===n)return k;
   return n;
 }
 function shoppingStockTarget(name,g){
   g=Number(g);if(!Number.isFinite(g)||g<=0)throw Error(name+' 구매량을 확인해 주세요');
   const key=shoppingInventoryKey(name),old=inventory?.[key],builtIn=(()=>{try{return typeof inventoryKeys==='function'&&inventoryKeys().includes(key)}catch(e){return false}})();
   if(old&&old.unit!=='g'&&!(Number(old.gramsPerUnit)>0))throw Error(name+' 재고의 g 환산값을 먼저 확인해 주세요');
   return{key,old,builtIn,g};
 }
 function addPurchasedStock(start,name,g){
   const receipts=shoppingReceipts(),rk=shoppingReceiptKey(start,name);
   if(receipts[rk])return{added:false,already:true,receipt:receipts[rk]};
   const t=shoppingStockTarget(name,g),old=t.old||{},now=Math.max(Date.now(),Number(old.updatedAt||0)+1);
   const next={...old,location:old.location||'냉장',memo:old.memo||'장보기 구매 원재료',updatedAt:now};
   if(old.unit&&old.unit!=='g'){
     next.unit=old.unit;next.gramsPerUnit=Number(old.gramsPerUnit);next.qty=(Number(old.qty)||0)+t.g/next.gramsPerUnit;
   }else{
     next.unit='g';next.gramsPerUnit=old.gramsPerUnit||null;next.qty=(Number(old.qty)||0)+t.g;
   }
   if(!t.builtIn){next.custom=true;next.customName=E.norm(name)}
   inventory[t.key]=next;
   try{if(typeof persistInventoryLocal==='function')persistInventoryLocal()}catch(e){}
   try{if(typeof pushInventoryItem==='function')pushInventoryItem(t.key)}catch(e){}
   receipts[rk]={start:String(start),name:E.norm(name),g:t.g,inventoryKey:t.key,updatedAt:now};
   write(K.shoppingStock,receipts);
   return{added:true,receipt:receipts[rk]};
 }
 function rollbackPurchasedStock(start,name){
   const receipts=shoppingReceipts(),rk=shoppingReceiptKey(start,name),rec=receipts[rk];
   if(!rec)return{receipt:false,rolledBack:false};
   const v=inventory?.[rec.inventoryKey];
   if(!v){delete receipts[rk];write(K.shoppingStock,receipts);return{receipt:true,rolledBack:true}}
   if(Number(v.updatedAt)!==Number(rec.updatedAt))return{receipt:true,rolledBack:false};
   const next={...v},g=Number(rec.g)||0,now=Math.max(Date.now(),Number(v.updatedAt||0)+1);
   if(v.unit==='g')next.qty=Math.max(0,(Number(v.qty)||0)-g);
   else if(Number(v.gramsPerUnit)>0)next.qty=Math.max(0,(Number(v.qty)||0)-g/Number(v.gramsPerUnit));
   else return{receipt:true,rolledBack:false};
   next.updatedAt=now;inventory[rec.inventoryKey]=next;
   try{if(typeof persistInventoryLocal==='function')persistInventoryLocal()}catch(e){}
   try{if(typeof pushInventoryItem==='function')pushInventoryItem(rec.inventoryKey)}catch(e){}
   delete receipts[rk];write(K.shoppingStock,receipts);
   return{receipt:true,rolledBack:true};
 }
 function batchShoppingTotals(start,end,p=plan()){
   const totals={};
   for(const r of p.filter(r=>r.meal.on>=start&&r.meal.on<end))for(const x of r.needs){
     if(isPreparedOnlyShoppingName(x.name))continue;
     const t=totals[x.name]||(totals[x.name]={g:0,unknown:false});if(x.buyG===null)t.unknown=true;else t.g+=x.buyG;
   }
   const receipts=shoppingReceipts();
   for(const rec of Object.values(receipts)){
     if(String(rec.start)!==String(start)||!shopChecked(start,rec.name)||totals[rec.name])continue;
     totals[rec.name]={g:Number(rec.g)||0,unknown:false,purchased:true};
   }
   return totals;
 }
 function syncCheckedShoppingStock(p){
   let changed=false;
   for(const [a,b] of [[0,4],[4,7]]){
     const start=addD(target(),a),end=addD(target(),b),totals={};
     for(const r of p.filter(r=>r.meal.on>=start&&r.meal.on<end))for(const x of r.needs){
       if(isPreparedOnlyShoppingName(x.name))continue;
       const t=totals[x.name]||(totals[x.name]={g:0,unknown:false});if(x.buyG===null)t.unknown=true;else t.g+=x.buyG;
     }
     for(const [name,v] of Object.entries(totals)){
       if(!shopChecked(start,name)||v.unknown||!(Number(v.g)>0))continue;
       if(shoppingReceipts()[shoppingReceiptKey(start,name)])continue;
       try{addPurchasedStock(start,name,v.g);changed=true}catch(e){}
     }
   }
   return changed;
 }
 function shopping(){
   let p=plan();if(syncCheckedShoppingStock(p))p=plan();let html=nav()+'<div class="sec"><h2>2단계 · 장보기</h2><span class="more">부족한 원재료만</span></div><p class="hint">이미 있는 재고는 빼고 실제로 사야 할 재료만 보여줘요. <b>구매완료 체크 시 표시된 구매량이 원재료 재고에 자동 반영</b>되어 3단계에서 바로 사용할 수 있어요. 실제 산 양이 다르면 1단계에서 수량만 수정하세요.</p>';
   for(const [label,a,b]of [['1차 · 월~목',0,4],['2차 · 금~일',4,7]]){
     const start=addD(target(),a),totals=batchShoppingTotals(start,addD(target(),b),p);
     const rows=Object.entries(totals).filter(([,v])=>v.g>1e-6||v.unknown);
     const done=rows.filter(([n])=>shopChecked(start,n)).length,allDone=!rows.length||done===rows.length;
     html+='<div class="card" style="margin-top:12px">'
       +'<div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><h3 style="margin:0">'+label+' 부족분</h3><span class="chip sm '+(allDone?'ok':'')+'">'+(rows.length?(allDone?'장보기 완료':'장보기 미완료 '+done+'/'+rows.length):'장보기 완료 · 추가 구매 없음')+'</span></div>'
       +(rows.length?rows.map(([n,x])=>{const on=shopChecked(start,n),g=x.g>0?Math.round(x.g*10)/10:0;return '<div class="shop'+(on?' on':'')+'" data-v63-shopcheck="'+start+'|'+encodeURIComponent(n)+'" data-v63-shopg="'+(x.unknown?'':g)+'" style="cursor:pointer"><div class="bx"></div><div class="nm"><b>'+esc(n)+'</b><div class="hint">'+(g>0?g+'g':'')+(x.unknown?(g>0?' · ':'')+'레시피량 확인 필요':on?' · 원재료 재고 반영됨':'')+'</div></div><div class="qt">'+(on?'구매완료':'미구매')+'</div></div>'}).join(''):'<p>등록된 재고로 준비 가능</p>')
       +(rows.length?'<div class="btnrow" style="margin-top:10px"><button class="btn '+(allDone?'':'pri')+'" data-v63-shopall="'+start+'">'+(allDone?'완료 취소':'전체 구매완료')+'</button></div>':'')
       +'</div>';
   }return html;
 }
 function token(){return 'cook-'+(root.crypto&&root.crypto.randomUUID?root.crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2))}
 function stockCode(u){return String(u.code||u.id||'-')}
 function stockUseText(u){
   const g=Math.round((Number(u.g)||0)*10)/10,unit=Number(u.unitG)||0,c=unit>0?g/unit:0;
   const pieces=unit>1&&Math.abs(c-Math.round(c))<1e-6?' · '+unit+'g×'+Math.round(c):'';
   return '<span class="chip sm">'+esc(stockCode(u))+'</span> '+esc(u.name)+' '+g+'g'+pieces;
 }
 function preparedLots(name){const n=E.norm(name);return read(K.prepared,[]).filter(x=>E.norm(x.name||x.ingredient)===n&&E.amount(x)>0)}
 function preparedAmount(name){return preparedLots(name).reduce((sum,x)=>sum+E.amount(x),0)}
 function preparedSummary(name){
   const lots=preparedLots(name);if(!lots.length)return'';
   const groups={};for(const x of lots){const u=Number(x.unitG)||0,c=Number(x.remainingCount)||0;if(!(u>0&&c>0))continue;const k=String(u);groups[k]=(groups[k]||0)+c}
   const parts=Object.entries(groups).map(([u,c])=>Math.round(Number(u)*10)/10+'g × '+(Math.round(c*10)/10)+'개');
   const total=Math.round(lots.reduce((s,x)=>s+E.amount(x),0)*10)/10;
   return (parts.length?parts.join(' · ')+' · ':'')+'총 '+total+'g';
 }
 function cancelableCook(m,r){
   const ops=read(K.ops,{}),lots=read(K.prepared,[]),assigned=new Set((r?.used||[]).filter(u=>u.kind==='prepared'&&E.norm(u.name)===E.norm(m.name)).map(u=>String(u.id||''))),found=[];
   for(const [token,op] of Object.entries(ops)){
     if(op?.type!=='cook'||!op.lot)continue;
     const exact=op.lot.mealKey?op.lot.mealKey===m.key:(assigned.has(String(token))||(m.component&&E.norm(op.lot.name)===E.norm(m.name)));if(!exact)continue;
     const lot=lots.find(x=>String(x.id||x.stockCode||x.code||'')===String(token));if(!lot)continue;
     if(Math.abs(E.amount(lot)-E.amount(op.lot))>1e-6||Number(lot.unitG)!==Number(op.lot.unitG))continue;
     found.push({token,lot});
   }
   return found.length===1?found[0]:null;
 }
 function mealReady(m,r){
   if(r&&r.used&&r.used.some(u=>u.kind==='prepared'&&E.norm(u.name)===E.norm(m.name))&&(!r.needs||!r.needs.length))return true;
   if(m.component&&Number(m.g)>0&&preparedAmount(m.name)+1e-6>=Number(m.g))return true;
   return false;
 }
 function mealCard(m,r){
   const known=m.ingredients.every(x=>x.g>0),done=mealReady(m,r),undo=cancelableCook(m,r),stock=preparedSummary(m.name),slot=m.component?'따로 만들기':['아침','점심','저녁'][m.slot],
     ing=m.ingredients.map(x=>esc(x.name)+' '+(x.g>0?x.g+'g':'확인 필요')).join(' · ');
   return '<div class="card" style="margin:10px 0;padding:16px">'+
     '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px"><div style="min-width:0"><div class="hint">'+(m.component?'밥·반찬':esc(m.on))+' · '+slot+'</div><h3 style="margin:4px 0 0;line-height:1.42">'+esc(m.name)+'</h3></div>'+(done?'<span class="chip sm ok">조리 완료</span>':!known?'<span class="chip sm">분량 확인</span>':'')+'</div>'+
     '<div class="hint" style="margin-top:9px;line-height:1.65;color:var(--ink2)">'+ing+'</div>'+
     (stock?'<div style="margin-top:9px;padding:9px 10px;border-radius:12px;background:var(--line2)"><b style="font-size:12.5px">현재 조리식 재고</b><div class="hint" style="margin-top:4px">'+esc(stock)+'</div></div>':'')+
     (r?'<div style="margin-top:10px;padding-top:9px;border-top:1px solid var(--line2)"><b style="font-size:12.5px">사용 재고</b><div class="hint" style="margin-top:5px;line-height:1.7">'+(r.used.length?r.used.map(stockUseText).join('<br>'):'배정된 보유재고 없음')+'</div></div>':'')+
     '<div style="margin-top:12px;display:grid;grid-template-columns:'+(done&&undo?'1fr 1fr':'1fr')+';gap:8px"><button class="btn '+(done?'':'pri')+'" style="width:100%" '+(done?'disabled aria-disabled="true"':'data-v63-edit="'+esc(m.key)+'"')+'>'+(done?'✓ 조리 완료':'조리하기')+'</button>'+(done&&undo?'<button class="btn" data-v70-cookundo="'+esc(undo.token)+'">완료 취소</button>':'')+'</div>'+
     (!done&&!known?'<p class="hint" style="margin:7px 0 0">조리 화면에서 재료 분량을 확인한 뒤 소분까지 한 번에 등록해요.</p>':'')+
     '</div>';
 }
 function component(name){const saved=recipeMap()[name];return {key:'component:'+encodeURIComponent(name),name,component:true,g:saved?.yieldG||null,ingredients:saved?.ingredients||[{name,g:null}],steps:saved?.steps||'',source:saved?'사용자 확인 레시피':'원본 조리법·원물 사용량 확인 필요'};}
 function aggregateUsed(rows){
   const map={};
   for(const r of rows)for(const u of r.used||[]){
     const key=[u.kind,stockCode(u),u.name,u.unitG||0].join('|'),x=map[key]||(map[key]={...u,g:0});
     x.g+=Number(u.g)||0;
   }
   return Object.values(map);
 }
 function aggregateMissing(rows){
   const map={};
   for(const r of rows)for(const n of r.needs||[]){
     const key=E.norm(n.name),x=map[key]||(map[key]={name:key,g:0,unknown:false});
     if(n.buyG===null)x.unknown=true;else x.g+=Number(n.buyG)||0;
   }
   return Object.values(map).filter(x=>x.unknown||x.g>1e-6);
 }
 function makeTaskKey(start,name){return String(start)+'|'+E.norm(name)}
 function makeOps(){
   const out={};for(const [token,op] of Object.entries(read(K.ops,{}))){
     const key=String(op?.lot?.mealKey||'');if(op?.type!=='cook'||!key.startsWith('make:'))continue;
     const taskKey=key.slice(5);(out[taskKey]||(out[taskKey]=[])).push({token,op});
   }return out;
 }
 function makeTasks(rows,start){
   const map={},ops=makeOps();
   for(const r of rows){
     if(r.fed||!r.meal)continue;
     const m=r.meal,name=E.norm(m.name),key=makeTaskKey(start,name),x=map[key]||(map[key]={key,start,name,requiredG:0,coveredG:0,meals:0,template:m,unknown:false});
     x.meals++;if(Number(m.g)>0)x.requiredG+=Number(m.g);else x.unknown=true;
     for(const u of r.used||[])if(u.kind==='prepared'&&E.norm(u.name)===name)x.coveredG+=Number(u.g)||0;
   }
   const lots=read(K.prepared,[]);
   for(const [key,list] of Object.entries(ops)){
     if(!key.startsWith(String(start)+'|')||map[key])continue;
     const last=list[list.length-1],lot=lots.find(x=>String(x.id||x.stockCode||x.code||'')===String(last.token));if(!lot)continue;
     const name=E.norm(last.op.lot?.name||lot.name),g=E.amount(lot);map[key]={key,start,name,requiredG:Number(last.op.lot?.plannedG)||g,coveredG:g,meals:0,template:null,unknown:false,legacyDone:true};
   }
   return Object.values(map).map(x=>{
     x.requiredG=Math.round(x.requiredG*10)/10;x.coveredG=Math.round(x.coveredG*10)/10;
     x.missingG=x.unknown?null:Math.max(0,Math.round((x.requiredG-x.coveredG)*10)/10);
     const list=ops[x.key]||[],last=list[list.length-1],lot=last&&lots.find(v=>String(v.id||v.stockCode||v.code||'')===String(last.token));
     x.undo=last&&lot&&Math.abs(E.amount(lot)-E.amount(last.op.lot))<1e-6&&Number(lot.unitG)===Number(last.op.lot.unitG)?last.token:null;
     return x;
   });
 }
 function makeTaskRow(t){
   const ready=t.missingG===0&&!t.unknown,defaultG=t.missingG===null?'':t.missingG,
     qty=t.unknown?'분량 확인 필요':('이번 준비 필요 '+t.requiredG+'g'+(t.coveredG>0?' · 재고 '+t.coveredG+'g 반영':''));
   return '<div class="shop'+(ready?' on':'')+'" style="align-items:center">'+
     '<button type="button" class="bx" aria-label="'+esc(t.name)+' 만들기 상태" '+(ready&&!t.undo?'disabled':'data-v71-makecheck="'+encodeURIComponent(t.key)+'"')+'></button>'+
     '<div class="nm"><b>'+esc(t.name)+'</b><div class="hint">'+esc(qty)+'</div>'+
       (ready?'<div class="hint" style="margin-top:3px">필요량 준비됨</div>':'<div style="display:flex;align-items:center;gap:6px;margin-top:7px"><span class="hint">실제 만든 양</span><input data-v71-makeg="'+encodeURIComponent(t.key)+'" type="number" min="0.1" step="0.1" inputmode="decimal" value="'+defaultG+'" style="width:92px;padding:7px 8px;border:1px solid var(--line);border-radius:10px;text-align:right;font:inherit;font-weight:800"><span class="hint">g</span></div>')+
     '</div><div class="qt">'+(ready?(t.undo?'완료 취소':'준비 완료'):'만들었음')+'</div></div>';
 }
 function batchMake(label,start,end,rows){
   const tasks=makeTasks(rows,start),ready=tasks.filter(t=>t.missingG===0&&!t.unknown).length;
   return '<div class="sec"><h2>'+label+' 만들기</h2><span class="more">'+start+' ~ '+addD(end,-1)+'</span></div>'+
     '<div class="card"><div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><h3 style="margin:0">이번 준비량</h3><span class="chip sm '+(tasks.length&&ready===tasks.length?'ok':'')+'">'+(tasks.length?(ready===tasks.length?'만들기 완료':ready+'/'+tasks.length+' 준비'):'추가 만들기 없음')+'</span></div>'+
     '<p class="hint" style="margin:8px 0 4px">앱이 이번 기간에 필요한 양에서 현재 조리식 재고를 뺀 만큼을 기본값으로 넣어둬요. 더 만들었다면 숫자만 바꾼 뒤 체크하세요.</p>'+
     (tasks.length?tasks.map(makeTaskRow).join(''):'<p class="hint">현재 조리식 재고로 필요한 양을 모두 준비할 수 있어요.</p>')+
     '</div>';
 }
 function prep(){
   let p=plan();if(syncCheckedShoppingStock(p))p=plan();
   const base=target(),firstEnd=addD(base,4),secondEnd=addD(base,7),
     first=p.filter(r=>r.meal.on>=base&&r.meal.on<firstEnd),
     second=p.filter(r=>r.meal.on>=firstEnd&&r.meal.on<secondEnd);
   return nav()+'<div class="sec"><h2>3단계 · 만들기</h2><span class="more">체크만 하면 재고 반영</span></div>'+
     '<p class="hint">장보기처럼 실제로 만들었는지만 체크하세요. 기본 수량은 이번 식단에 필요한 정량이고, 더 만든 경우에만 실제 만든 양을 수정하면 됩니다.</p>'+
     batchMake('1차 · 월~목',base,firstEnd,first)+batchMake('2차 · 금~일',firstEnd,secondEnd,second);
 }
 function get(k){if(k.startsWith('component:'))return component(decodeURIComponent(k.slice(10)));const [on,s]=k.split('|');return model(on,Number(s))}
 function ingredientRow(x={name:'',g:''}){
   return '<div class="re-ing-row" data-v68-ing-row><div class="re-ing-name"><input name="ingredientName" type="text" value="'+esc(x.name||'')+'" placeholder="재료명" autocomplete="off" required></div><div class="re-ing-g"><input name="ingredientG" type="number" step="0.1" min="0.1" value="'+(x.g||'')+'" inputmode="decimal" required><span>g</span></div><button type="button" class="re-remove" data-v68-remove-ing aria-label="재료 삭제">×</button></div>';
 }
 function readRecipeForm(form){
   const fd=new FormData(form),names=fd.getAll('ingredientName'),grams=fd.getAll('ingredientG');
   if(names.length!==grams.length||!names.length)throw Error('재료를 확인해 주세요');
   const ingredients=names.map((raw,i)=>{const name=E.norm(String(raw)),g=Number(grams[i]);if(!name||!Number.isFinite(g)||g<=0)throw Error('재료명과 양을 확인해 주세요');return{name,g}});
   const yieldG=Number(fd.get('yieldG'));if(!Number.isFinite(yieldG)||yieldG<=0)throw Error('기준 완성량을 확인해 주세요');
   return{fd,ingredients,yieldG,steps:String(fd.get('steps')||'')};
 }
 function saveRecipeData(m,data){
   const map=recipeMap();map[m.name]={ingredients:data.ingredients,yieldG:data.yieldG,steps:data.steps};write(K.recipes,map);
 }
 function updateUnifiedPreview(form){
   updateRecipeTotal(form);
   if(!form)return;
   const unit=Number(form.querySelector('[name="unitG"]')?.value)||0,count=Number(form.querySelector('[name="count"]')?.value)||0,
     total=Math.round(unit*count*10)/10,yieldG=Number(form.querySelector('[name="yieldG"]')?.value)||0,
     totalEl=form.querySelector('[data-v70-total]'),useEl=form.querySelector('[data-v70-use]');
   if(totalEl)totalEl.textContent=(total||0)+'g';
   if(useEl){
     const ratio=yieldG>0?total/yieldG:0,names=[...form.querySelectorAll('[name="ingredientName"]')],grams=[...form.querySelectorAll('[name="ingredientG"]')];
     useEl.innerHTML=names.map((el,i)=>{const name=E.norm(String(el.value||'')),g=Number(grams[i]?.value)||0;return '<div class="pe-use-row"><span>'+esc(name||'재료')+'</span><b>'+(g>0&&ratio>0?Math.round(g*ratio*10)/10+'g':'분량 확인 필요')+'</b></div>'}).join('');
   }
 }
 function updateRecipeTotal(form){
   if(!form)return;
   const total=[...form.querySelectorAll('[name="ingredientG"]')].reduce((n,el)=>n+(Number(el.value)||0),0),
     yieldG=Number(form.querySelector('[name="yieldG"]')?.value)||0,
     totalEl=form.querySelector('[data-v68-total]'),diffEl=form.querySelector('[data-v68-diff]');
   if(totalEl)totalEl.textContent=(Math.round(total*10)/10)+'g';
   if(diffEl){
     const diff=Math.round((yieldG-total)*10)/10;
     diffEl.textContent=!yieldG?'기준 완성량을 입력해 주세요':Math.abs(diff)<0.05?'기준과 일치':(diff>0?'기준보다 '+diff+'g 적어요':'기준보다 '+Math.abs(diff)+'g 많아요');
     diffEl.className='re-diff '+(Math.abs(diff)<0.05?'ok':'warn');
   }
 }
 function editor(m){
   const rows=(m.ingredients&&m.ingredients.length?m.ingredients:[{name:'',g:''}]).map(ingredientRow).join('');
   open('<style>'+
     '.cook-editor-v70{padding:0 0 82px}.cook-editor-v70 *{box-sizing:border-box}.re-head{padding:2px 2px 14px}.re-kicker{font-size:12px;font-weight:900;color:var(--peach);margin-bottom:5px}.re-title{font-size:20px;font-weight:900;line-height:1.42;color:var(--ink);word-break:keep-all}.re-desc{font-size:12.5px;line-height:1.65;color:var(--muted);margin-top:7px}.re-card,.pe-card{background:#fff;border:1px solid var(--line2);border-radius:20px;padding:16px;margin:0 0 12px;box-shadow:0 7px 22px rgba(74,64,56,.045)}.re-section-title,.pe-title-sm{font-size:14px;font-weight:900;margin-bottom:12px}.re-field-label,.pe-field label{display:block;font-size:11.5px;color:var(--muted);font-weight:800;margin-bottom:6px}.re-yield,.pe-input-wrap{display:flex;align-items:center;gap:8px}.re-yield input,.pe-input-wrap input,.pe-field input[type="date"]{width:100%;border:1.5px solid var(--line);border-radius:13px;padding:11px 12px;font:inherit;font-size:16px;font-weight:800;background:#fff;color:var(--ink)}.re-yield input{max-width:150px;text-align:right}.pe-input-wrap input{text-align:right}.re-unit,.pe-unit{font-size:12px;font-weight:800;color:var(--muted)}.re-ing-list{display:flex;flex-direction:column;gap:8px}.re-ing-row{display:grid;grid-template-columns:minmax(0,1fr) 94px 34px;gap:7px;align-items:center}.re-ing-name input,.re-ing-g input{width:100%;border:1.5px solid var(--line);border-radius:12px;padding:10px 11px;font:inherit;font-size:13.5px;background:#fff;color:var(--ink)}.re-ing-g{display:flex;align-items:center;gap:5px}.re-ing-g input{text-align:right}.re-ing-g span{font-size:12px;font-weight:800;color:var(--muted)}.re-remove{width:32px;height:32px;border:0;border-radius:50%;background:var(--line2);color:var(--muted);font-size:19px;line-height:1}.re-add{margin-top:10px;width:100%;border:1.5px dashed var(--line);background:#fff;border-radius:12px;padding:10px;font-size:12.5px;font-weight:800;color:var(--ink2)}.re-totalbox,.pe-totalbox{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-top:13px;padding-top:12px;border-top:1px solid var(--line2)}.re-total{font-size:19px;font-weight:900}.re-diff{font-size:11.5px;font-weight:800;text-align:right}.re-diff.ok{color:var(--mint)}.re-diff.warn{color:var(--peach)}.re-steps{width:100%;min-height:96px;border:1.5px solid var(--line);border-radius:14px;padding:12px;font:inherit;font-size:13.5px;line-height:1.6;background:#fff;color:var(--ink);resize:vertical}.pe-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pe-total-label{font-size:11.5px;color:var(--muted);font-weight:800}.pe-total{font-size:22px;font-weight:900}.pe-use-row{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid var(--line2);font-size:13px}.pe-use-row:last-child{border-bottom:0}.pe-warning{font-size:12px;line-height:1.6;color:var(--peach);font-weight:800;margin-top:10px}.recipe-save{width:100%;margin-top:12px}.cook-actions{position:sticky;bottom:-24px;display:grid;grid-template-columns:.8fr 1.7fr;gap:9px;margin:16px -16px -24px;padding:12px 16px calc(12px + env(safe-area-inset-bottom));background:linear-gradient(to bottom,rgba(255,248,241,.86),var(--bg) 28%);backdrop-filter:blur(10px);z-index:3}.cook-actions .btn{width:100%;padding:12px 13px}@media(max-width:360px){.re-ing-row{grid-template-columns:minmax(0,1fr) 86px 32px}.re-card,.pe-card{padding:14px}.pe-grid{grid-template-columns:1fr}}'+
     '</style><div class="cook-editor-v70"><div class="re-head"><div class="re-kicker">조리하기</div><div class="re-title">'+esc(m.name)+'</div><div class="re-desc">재료와 분량을 확인하고, 실제로 만든 뒤 소분량까지 입력하면 재고 반영까지 한 번에 끝나요.</div></div>'+
     '<form data-v63-recipe="'+esc(m.key)+'" data-v70-unified>'+
     '<div class="re-card"><div class="re-section-title">1 · 재료·분량</div><div class="re-field-label">기준 완성량</div><div class="re-yield"><input name="yieldG" type="number" step="0.1" min="0.1" value="'+(m.g||'')+'" inputmode="decimal" required><span class="re-unit">g</span></div><div class="re-ing-list" data-v68-ingredients style="margin-top:14px">'+rows+'</div><button type="button" class="re-add" data-v68-add-ing>＋ 재료 추가</button><div class="re-totalbox"><div><div class="pe-total-label">재료 합계</div><div class="re-total" data-v68-total>0g</div></div><div class="re-diff" data-v68-diff></div></div><button type="button" class="btn recipe-save" data-v70-save-recipe>레시피만 저장</button></div>'+
     '<div class="re-card"><div class="re-section-title">2 · 만드는 법 <span class="hint" style="font-weight:600">· 선택</span></div><textarea class="re-steps" name="steps" rows="4" placeholder="예) 소고기를 익혀 잘게 다지고, 채소는 무르게 익힌 뒤 함께 섞어요.">'+esc(m.steps||'')+'</textarea></div>'+
     '<div class="pe-card"><div class="pe-title-sm">3 · 완성량·소분</div><div class="pe-grid"><div class="pe-field"><label>1개 중량</label><div class="pe-input-wrap"><input name="unitG" type="number" min="0.1" step="0.1" inputmode="decimal" required value="'+(m.g||'')+'"><span class="pe-unit">g</span></div></div><div class="pe-field"><label>개수</label><div class="pe-input-wrap"><input name="count" type="number" min="1" step="1" inputmode="numeric" required value="1"><span class="pe-unit">개</span></div></div></div><div class="pe-totalbox"><div><div class="pe-total-label">실제 총 완성량</div><div class="pe-total" data-v70-total>0g</div></div></div><div class="pe-field" style="margin-top:14px"><label>제조일</label><input name="date" type="date" required value="'+date()+'"></div></div>'+
     '<div class="pe-card"><div class="pe-title-sm">4 · 재고 반영 예상</div><div data-v70-use></div><div class="pe-warning">조리 완료를 누르면 실제 완성량 비율에 맞춰 위 재료를 차감하고, 소분한 조리식을 새 재고로 등록해요.</div></div>'+
     '<input name="token" type="hidden" value="'+token()+'"><div class="cook-actions"><button type="button" class="btn" data-v68-recipe-cancel>취소</button><button class="btn pri" type="submit">조리 완료 · 재고 반영</button></div></form></div>');
   setTimeout(()=>updateUnifiedPreview(document.querySelector('[data-v70-unified]')),0);
 }
 function updatePortionPreview(form){
   if(!form)return;
   const unit=Number(form.querySelector('[name="unitG"]')?.value)||0,count=Number(form.querySelector('[name="count"]')?.value)||0,
     total=Math.round(unit*count*10)/10,key=form.getAttribute('data-v63-form'),m=get(key),
     totalEl=form.querySelector('[data-v68-portion-total]'),useEl=form.querySelector('[data-v68-portion-use]');
   if(totalEl)totalEl.textContent=(total||0)+'g';
   if(useEl&&m){
     const ratio=m.g>0?total/m.g:0;
     useEl.innerHTML=m.ingredients.map(x=>'<div class="pe-use-row"><span>'+esc(x.name)+'</span><b>'+(x.g>0&&ratio>0?Math.round(x.g*ratio*10)/10+'g':'분량 확인 필요')+'</b></div>').join('');
   }
 }
 function portionEditor(m){
   const known=m.ingredients.every(x=>x.g>0);
   open('<style>'+
     '.portion-editor-v68{padding:0 0 72px}.portion-editor-v68 *{box-sizing:border-box}.pe-head{padding:2px 2px 14px}.pe-kicker{font-size:12px;font-weight:900;color:var(--peach);margin-bottom:5px}.pe-title{font-size:20px;font-weight:900;line-height:1.42;color:var(--ink);word-break:keep-all}.pe-desc{font-size:12.5px;line-height:1.65;color:var(--muted);margin-top:7px}.pe-card{background:#fff;border:1px solid var(--line2);border-radius:20px;padding:16px;margin:0 0 12px;box-shadow:0 7px 22px rgba(74,64,56,.045)}.pe-title-sm{font-size:14px;font-weight:900;margin-bottom:12px}.pe-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pe-field label{display:block;font-size:11.5px;color:var(--muted);font-weight:800;margin-bottom:6px}.pe-input-wrap{display:flex;align-items:center;gap:6px}.pe-input-wrap input,.pe-field input[type="date"]{width:100%;border:1.5px solid var(--line);border-radius:13px;padding:11px 12px;font:inherit;font-size:16px;font-weight:800;background:#fff;color:var(--ink)}.pe-input-wrap input{text-align:right}.pe-unit{font-size:12px;font-weight:800;color:var(--muted)}.pe-totalbox{display:flex;align-items:flex-end;justify-content:space-between;margin-top:14px;padding-top:12px;border-top:1px solid var(--line2)}.pe-total-label{font-size:11.5px;color:var(--muted);font-weight:800}.pe-total{font-size:22px;font-weight:900}.pe-use-row{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid var(--line2);font-size:13px}.pe-use-row:last-child{border-bottom:0}.pe-warning{font-size:12px;line-height:1.6;color:var(--peach);font-weight:800;margin-top:10px}.pe-actions{position:sticky;bottom:-24px;display:grid;grid-template-columns:1fr 1.45fr;gap:9px;margin:16px -16px -24px;padding:12px 16px calc(12px + env(safe-area-inset-bottom));background:linear-gradient(to bottom,rgba(255,248,241,.86),var(--bg) 28%);backdrop-filter:blur(10px);z-index:3}.pe-actions .btn{width:100%;padding:12px 14px}@media(max-width:360px){.pe-grid{grid-template-columns:1fr}.pe-card{padding:14px}}'+
     '</style><div class="portion-editor-v68"><div class="pe-head"><div class="pe-kicker">조리 완료 · 소분 등록</div><div class="pe-title">'+esc(m.name)+'</div><div class="pe-desc">실제로 만든 양만 입력해 주세요. 완료하면 사용한 재료가 차감되고 새 조리식 재고가 등록됩니다.</div></div>'+
     '<form data-v63-form="'+esc(m.key)+'"><div class="pe-card"><div class="pe-title-sm">소분 정보</div><div class="pe-grid"><div class="pe-field"><label>1개 중량</label><div class="pe-input-wrap"><input name="unitG" type="number" min="0.1" step="0.1" inputmode="decimal" required value="'+(m.g||'')+'"><span class="pe-unit">g</span></div></div><div class="pe-field"><label>개수</label><div class="pe-input-wrap"><input name="count" type="number" min="1" step="1" inputmode="numeric" required value="1"><span class="pe-unit">개</span></div></div></div><div class="pe-totalbox"><div><div class="pe-total-label">총 완성량</div><div class="pe-total" data-v68-portion-total>0g</div></div></div></div>'+
     '<div class="pe-card"><div class="pe-title-sm">제조일</div><div class="pe-field"><input name="date" type="date" required value="'+date()+'"></div></div>'+
     '<div class="pe-card"><div class="pe-title-sm">재고 반영 예상</div><div data-v68-portion-use></div><div class="pe-warning">'+(known?'완료를 누르면 위 사용량만큼 재고에서 차감됩니다.':'분량 확인/수정을 먼저 완료해야 재고를 안전하게 차감할 수 있어요.')+'</div></div>'+
     '<input name="token" type="hidden" value="'+token()+'"><div class="pe-actions"><button type="button" class="btn" data-v68-portion-cancel>취소</button><button type="submit" class="btn pri" '+(!known?'disabled':'')+'>조리 완료 · 재고 반영</button></div></form></div>');
   setTimeout(()=>updatePortionPreview(document.querySelector('[data-v63-form]')),0);
 }
 vShop=function(){try{if(root.__mgStage==='shop')return shopping();if(root.__mgStage==='prep')return prep();return polishLegacy(oldView())}catch(e){return '<div class="card">재고 데이터를 읽지 못했어요. 변경하지 않고 중단했습니다.</div>'}};
 root.vShop=vShop;
 if(root.addEventListener)root.addEventListener('click',function(e){const old=e.target.closest&&e.target.closest('[data-v62-complete],[data-v35complete],[data-a^="bdone:"]');if(old){e.preventDefault();e.stopImmediatePropagation();toast('새 식단만들기 화면에서 완료해 주세요')}},true);
 // Block legacy automatic deduction entry points. The old v62 loader is removed in index.html.
 document.addEventListener('click',function(e){
   const portionCtl=e.target.closest&&e.target.closest('[data-v68-portion],[data-v68-portion-cancel]');
   if(portionCtl&&(portionCtl.hasAttribute('data-v68-portion')||portionCtl.hasAttribute('data-v68-portion-cancel'))){
     e.preventDefault();e.stopImmediatePropagation();
     if(portionCtl.hasAttribute('data-v68-portion-cancel'))return close();
     const m=get(portionCtl.getAttribute('data-v68-portion'));if(!m)return toast('식단이 변경됐어요');
     return portionEditor(m);
   }
   const recipeCtl=e.target.closest&&e.target.closest('[data-v68-add-ing],[data-v68-remove-ing],[data-v68-recipe-cancel],[data-v70-save-recipe]');
   if(recipeCtl&&(recipeCtl.hasAttribute('data-v68-add-ing')||recipeCtl.hasAttribute('data-v68-remove-ing')||recipeCtl.hasAttribute('data-v68-recipe-cancel')||recipeCtl.hasAttribute('data-v70-save-recipe'))){
     e.preventDefault();e.stopImmediatePropagation();
     if(recipeCtl.hasAttribute('data-v68-recipe-cancel'))return close();
     const form=recipeCtl.closest('[data-v63-recipe]');if(!form)return;
     if(recipeCtl.hasAttribute('data-v70-save-recipe')){
       try{const m=get(form.getAttribute('data-v63-recipe'));if(!m)throw Error('식단이 변경됐어요');const data=readRecipeForm(form);saveRecipeData(m,data);render(true);toast('레시피를 저장했어요')}catch(err){toast(err.message)}
       return;
     }
     if(recipeCtl.hasAttribute('data-v68-add-ing')){
       const list=form.querySelector('[data-v68-ingredients]');if(list)list.insertAdjacentHTML('beforeend',ingredientRow());
     }else{
       const row=recipeCtl.closest('[data-v68-ing-row]'),rows=form.querySelectorAll('[data-v68-ing-row]');
       if(row&&rows.length>1)row.remove();else if(row){row.querySelector('[name="ingredientName"]').value='';row.querySelector('[name="ingredientG"]').value=''}
     }
     if(form.hasAttribute('data-v70-unified'))updateUnifiedPreview(form);else updateRecipeTotal(form);return;
   }
   const makeCheck=e.target.closest&&e.target.closest('[data-v71-makecheck]');
   if(makeCheck){
     e.preventDefault();e.stopImmediatePropagation();if(locked)return;
     const key=decodeURIComponent(makeCheck.getAttribute('data-v71-makecheck')),sep=key.indexOf('|'),start=key.slice(0,sep),name=key.slice(sep+1),
       end=addD(start,start===target()?4:3),rows=plan().filter(r=>r.meal.on>=start&&r.meal.on<end),task=makeTasks(rows,start).find(t=>t.key===key);
     try{
       if(task?.undo){
         if(!confirm(name+' 만들기 완료를 취소할까요? 재고와 사용 원재료를 되돌립니다.'))return;
         locked=true;const s=snapshot(),result=E.undoCook(s,task.undo);if(!result.already)commit(s,result.state);render(true);return toast('만들기 완료를 취소했어요');
       }
       if(!task||!task.template)throw Error('현재 식단의 만들기 항목을 찾지 못했어요');
       const input=document.querySelector('[data-v71-makeg="'+encodeURIComponent(key)+'"]'),actualG=Number(input?.value);
       if(!Number.isFinite(actualG)||actualG<=0)throw Error('실제 만든 양을 확인해 주세요');
       if(task.unknown||!(Number(task.template.g)>0)||task.template.ingredients.some(x=>!(Number(x.g)>0)))throw Error(name+' 분량을 먼저 확인해 주세요');
       const makeToken=token(),meal={...task.template,key:'make:'+key,plannedG:task.missingG||actualG};
       if(!confirm(name+' '+actualG+'g 만들기를 완료했나요?'))return;
       locked=true;const s=snapshot(),result=E.cook(s,meal,{token:makeToken,count:1,unitG:actualG,date:date()});if(!result.already)commit(s,result.state);render(true);toast(name+' '+actualG+'g을 조리식 재고에 반영했어요');
     }catch(err){toast(err.message)}finally{locked=false}
     return;
   }
   const prepDone=e.target.closest&&e.target.closest('[data-v67-prepdone],[data-v67-prepall]');
   if(prepDone&&(prepDone.hasAttribute('data-v67-prepdone')||prepDone.hasAttribute('data-v67-prepall'))){
     e.preventDefault();e.stopImmediatePropagation();
     const map=prepDoneMap();
     if(prepDone.hasAttribute('data-v67-prepdone')){
       const key=decodeURIComponent(prepDone.getAttribute('data-v67-prepdone'));
       if(map[key]?.done)delete map[key];else map[key]={done:true,completedAt:new Date().toISOString()};
     }else{
       const start=prepDone.getAttribute('data-v67-prepall'),end=addD(start,start===target()?4:3),rows=plan().filter(r=>r.meal.on>=start&&r.meal.on<end),tasks=prepTasks(rows,start),all=tasks.length>0&&tasks.every(t=>map[t.key]?.done);
       for(const t of tasks){if(all)delete map[t.key];else map[t.key]={done:true,completedAt:new Date().toISOString()}}
     }
     savePrepDoneMap(map);render(true);return;
   }
   const shop=e.target.closest&&e.target.closest('[data-v63-shopcheck],[data-v63-shopall]');
   if(shop&&(shop.hasAttribute('data-v63-shopcheck')||shop.hasAttribute('data-v63-shopall'))){
     e.preventDefault();e.stopImmediatePropagation();
     try{
       if(shop.hasAttribute('data-v63-shopcheck')){
         const [start,enc]=shop.getAttribute('data-v63-shopcheck').split('|'),name=decodeURIComponent(enc),key=shopKey(start),list=shopChk[key]||(shopChk[key]=[]),i=list.indexOf(name),g=Number(shop.getAttribute('data-v63-shopg'));
         if(i<0){
           if(!(g>0))throw Error(name+' 구매량을 먼저 확인해 주세요');
           addPurchasedStock(start,name,g);list.push(name);saveShopChecks();render(true);return toast(name+' '+g+'g을 구매재고에 반영했어요');
         }
         list.splice(i,1);const back=rollbackPurchasedStock(start,name);saveShopChecks();render(true);
         return toast(back.rolledBack?'구매완료를 취소하고 자동 반영 재고도 되돌렸어요':'구매 체크만 취소했어요 · 이미 사용·수정된 재고는 유지했어요');
       }
       const start=shop.getAttribute('data-v63-shopall'),key=shopKey(start),p=plan(),end=addD(start,start===target()?4:3),totals=batchShoppingTotals(start,end,p),
         entries=Object.entries(totals).filter(([,v])=>v.g>1e-6||v.unknown),names=entries.map(([n])=>n),cur=shopChk[key]||(shopChk[key]=[]),all=names.length>0&&names.every(n=>cur.includes(n));
       if(all){
         for(const n of names){const i=cur.indexOf(n);if(i>=0)cur.splice(i,1);rollbackPurchasedStock(start,n)}
         saveShopChecks();render(true);return toast('구매완료를 취소했어요');
       }
       if(entries.some(([,v])=>v.unknown||!(Number(v.g)>0)))throw Error('구매량 확인이 필요한 재료가 있어요');
       for(const [n,v] of entries)if(!cur.includes(n))shoppingStockTarget(n,v.g);
       for(const [n,v] of entries)if(!cur.includes(n)){addPurchasedStock(start,n,v.g);cur.push(n)}
       saveShopChecks();render(true);return toast('구매한 원재료를 재고에 반영했어요');
     }catch(err){return toast(err.message)}
   }
   const cookUndo=e.target.closest&&e.target.closest('[data-v70-cookundo]');
   if(cookUndo){
     e.preventDefault();e.stopImmediatePropagation();if(locked)return;
     const token=cookUndo.getAttribute('data-v70-cookundo');if(!confirm('조리 완료를 취소할까요? 만든 조리식 재고를 지우고 사용한 원재료를 복원합니다.'))return;
     try{locked=true;const s=snapshot(),result=E.undoCook(s,token);if(!result.already)commit(s,result.state);render(true);toast(result.already?'이미 취소된 조리입니다':'조리 완료를 취소하고 재고를 복원했어요')}catch(err){toast(err.message)}finally{locked=false}
     return;
   }
   const el=e.target.closest&&e.target.closest('[data-v63-edit],[data-v63-feed],[data-v62-complete],[data-v35complete],[data-a^="bdone:"]');if(!el)return;
   e.preventDefault();e.stopImmediatePropagation();
   if(locked)return;
   try{
     if(el.hasAttribute('data-v63-edit'))return editor(get(el.getAttribute('data-v63-edit')));
     if(!el.hasAttribute('data-v63-feed'))return toast('새 식단만들기 화면에서 완료해 주세요');
     const m=get(el.getAttribute('data-v63-feed'));if(!m)throw Error('식단이 변경됐어요');
     const s=snapshot(),undo=!!s.feeds[m.key],slot=['b','l','d'][m.slot],holder=typeof sheet!=='undefined'?sheet:document,
       offeredEl=holder.querySelector('[data-offered="'+slot+'"]'),offered=Number(offeredEl?.value);
     if(!undo){
       if(typeof saveFeedbackFields==='function'&&!saveFeedbackFields(m.on))return;
       if(!Number.isFinite(offered)||offered<=0)throw Error('먼저 제공한 전체 양(g)을 입력해 주세요');
       if(!confirm('제공한 '+offered+'g을 조리식 재고에서 차감할까요?'))return;
     }else if(!confirm('급여 차감을 취소하고 사용량을 복원할까요?'))return;
     locked=true;const next=undo?E.undoFeed(s,m.key):E.feed(s,m,offered);commit(s,next.state);render(true);
     const lb=['아침','점심','저녁'][m.slot]||'끼니';el.textContent=lb+' · '+(undo?'제공량으로 재고 차감':'재고 차감 취소');
     toast(undo?'급여 차감을 취소했어요':'제공한 전체 양 '+offered+'g을 재고에서 차감했어요');
   }catch(err){toast(err.message)}finally{locked=false}
 },true);
 document.addEventListener('submit',function(e){
   const f=e.target;if(!f.matches('[data-v63-form],[data-v63-recipe]'))return;e.preventDefault();e.stopImmediatePropagation();if(locked)return;
   try{
     const fd=new FormData(f),k=f.getAttribute('data-v63-form')||f.getAttribute('data-v63-recipe'),m=get(k);if(!m)throw Error('식단이 변경됐어요');
     if(f.hasAttribute('data-v63-recipe')){
       const data=readRecipeForm(f);
       if(!f.hasAttribute('data-v70-unified')){saveRecipeData(m,data);close();render(true);return toast('분량을 저장했어요')}
       const form={token:String(data.fd.get('token')),count:Number(data.fd.get('count')),unitG:Number(data.fd.get('unitG')),date:String(data.fd.get('date'))};
       if(!/^\d{4}-\d{2}-\d{2}$/.test(form.date)||form.date>date())throw Error('실제 제조일을 확인해 주세요');
       if(!Number.isFinite(form.count)||form.count<1||!Number.isFinite(form.unitG)||form.unitG<=0)throw Error('소분 정보를 확인해 주세요');
       if(!confirm(m.name+' '+form.unitG+'g × '+form.count+'개 조리를 완료했나요?'))return;
       saveRecipeData(m,data);locked=true;
       const s=snapshot(),cooked={...m,ingredients:data.ingredients,g:data.yieldG,steps:data.steps},result=E.cook(s,cooked,form);
       if(!result.already)commit(s,result.state);close();render(true);return toast(result.already?'이미 반영된 조리입니다':'조리식 재고를 등록했어요');
     }
     const form={token:String(fd.get('token')),count:Number(fd.get('count')),unitG:Number(fd.get('unitG')),date:String(fd.get('date'))};
     if(!/^\d{4}-\d{2}-\d{2}$/.test(form.date)||form.date>date())throw Error('실제 제조일을 확인해 주세요');
     if(!confirm(m.name+' '+form.unitG+'g × '+form.count+'개 조리를 완료했나요?'))return;
     locked=true;const s=snapshot(),result=E.cook(s,m,form);if(!result.already)commit(s,result.state);close();render(true);toast(result.already?'이미 반영된 조리입니다':'조리식 재고를 등록했어요');
   }catch(err){toast(err.message)}finally{locked=false}
 },true);
 document.addEventListener('input',function(e){
   const recipeForm=e.target.closest&&e.target.closest('[data-v63-recipe]');
   if(recipeForm&&(e.target.name==='ingredientG'||e.target.name==='ingredientName'||e.target.name==='yieldG'||e.target.name==='unitG'||e.target.name==='count')){
     if(recipeForm.hasAttribute('data-v70-unified'))updateUnifiedPreview(recipeForm);else updateRecipeTotal(recipeForm);
   }
   const portionForm=e.target.closest&&e.target.closest('[data-v63-form]');
   if(portionForm&&(e.target.name==='unitG'||e.target.name==='count'))updatePortionPreview(portionForm);
 },true);
 if(oldSheet){sheetDay=function(on){
   oldSheet(on);
   const holder=typeof sheet!=='undefined'?sheet:document.querySelector('.sheet');if(!holder)return;
   try{
     for(const card of [...holder.querySelectorAll('.card')]){
       const groups=[...card.children].filter(x=>x.classList&&x.classList.contains('rgroup'));if(!groups.length)continue;
       const details=document.createElement('details');details.style.marginTop='10px';
       const summary=document.createElement('summary');summary.textContent='조리법 보기';summary.style.fontWeight='800';details.appendChild(summary);
       groups[0].parentNode.insertBefore(details,groups[0]);groups.forEach(g=>details.appendChild(g));
     }
   }catch(e){}
   const saveBtn=holder.querySelector('[data-a="savday:'+on+'"]');if(saveBtn)saveBtn.textContent='기록 저장';
   const box=document.createElement('div');box.id='v63-feed';box.className='card';box.style.margin='12px 0 4px';
   box.innerHTML='<h3 style="margin-top:0">4단계 · 먹이기/섭취기록</h3><p class="hint"><b>제공량</b>에는 꺼내서 먹인 전체 양을, <b>실제 섭취량</b>에는 도준이가 실제로 먹은 양을 입력하세요. 조리식 재고는 제공량 기준으로 차감되고, 섭취기록은 마지막 <b>기록 저장</b>으로 저장됩니다.</p><div style="display:grid;gap:7px">'+[0,1,2].map(i=>{const m=model(on,i);return m?'<button class="btn" data-v63-feed="'+esc(m.key)+'">'+['아침','점심','저녁'][i]+' · '+(snapshot().feeds[m.key]?'재고 차감 취소':'제공량으로 재고 차감')+'</button>':''}).join('')+'</div>';
   holder.querySelector('#v63-feed')?.remove();
   const actionRow=saveBtn&&saveBtn.closest('.btnrow');if(actionRow)holder.insertBefore(box,actionRow);else holder.appendChild(box);
  };root.sheetDay=sheetDay;}
 if(oldBatch){sheetBatch=function(){root.__mgStage='prep';close();render(true)};root.sheetBatch=sheetBatch;}
 root.__MEAL_WORKFLOW_V63={model,meals,plan,snapshot,makeTasks,addPurchasedStock,rollbackPurchasedStock,syncCheckedShoppingStock};
 try{render(true)}catch(e){}
})(typeof globalThis!=='undefined'?globalThis:this);
