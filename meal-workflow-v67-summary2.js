(function(root){
 'use strict';
 const E=root.MealStockV63;
 if(!E||typeof vShop!=='function'||typeof mText!=='function')return;
 const K={prepared:'dj:preparedMealInventory1',cubes:'dj:cubeInventory2',feeds:'dj:mealFeedsV63',ops:'dj:mealOpsV63',recipes:'dj:mealRecipesV63',journal:'dj:mealJournalV63',prep:'dj:prepChecklist2'};
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
 function nav(){return '<div class="card"><div class="btnrow"><button class="btn" data-v33week="current">이번 주</button><button class="btn" data-v33week="next">다음 주</button></div><div class="btnrow"><button class="btn" data-mg="stock">재고관리</button><button class="btn" data-mg="shop">장보기</button><button class="btn" data-mg="prep">식단만들기</button></div><p class="hint">'+esc(target())+'부터 7일 · 재고연결 v63 · 조리식은 현재 기기에 저장</p></div>'}
 function plan(){return E.plan(meals(target(),7),snapshot())}
 const PREPARED_ONLY_SHOP_EXCLUDE=new Set(['잡곡무른밥','잡곡진밥','쌀구기자닭죽','당근톳밥','강낭콩밥','밥 (조리 후)']);
 function isPreparedOnlyShoppingName(name){return PREPARED_ONLY_SHOP_EXCLUDE.has(E.norm(name))}
 function shopKey(start){return 'mg29|'+start}
 function shopList(start){return shopChk?.[shopKey(start)]||[]}
 function shopChecked(start,name){return shopList(start).includes(name)}
 function saveShopChecks(){try{Promise.resolve(store.set('shop2',shopChk)).catch(()=>{})}catch(e){}}
 function shopping(){
   const p=plan();let html=nav()+'<h2>장보기 · 만들어둔 음식 먼저 반영</h2><p class="hint">1차와 2차에 같은 재고를 두 번 배정하지 않아요. <b>산 재료는 왼쪽 체크박스를 눌러 구매완료로 표시</b>할 수 있어요. 밥·죽 같은 조리 준비식은 장보기에서 제외하고 식단만들기에서 관리합니다.</p>';
   for(const [label,a,b]of [['1차',0,4],['2차',4,7]]){
     const start=addD(target(),a),totals={};for(const r of p.filter(r=>r.meal.on>=start&&r.meal.on<addD(target(),b)))for(const x of r.needs){
       if(isPreparedOnlyShoppingName(x.name))continue;
       const t=totals[x.name]||(totals[x.name]={g:0,unknown:false});if(x.buyG===null)t.unknown=true;else t.g+=x.buyG;
     }
     const rows=Object.entries(totals).filter(([,v])=>v.g>1e-6||v.unknown);
     const done=rows.filter(([n])=>shopChecked(start,n)).length,allDone=!rows.length||done===rows.length;
     html+='<div class="card" style="margin-top:12px">'
       +'<div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><h3 style="margin:0">'+label+' 부족분</h3><span class="chip sm '+(allDone?'ok':'')+'">'+(rows.length?(allDone?'장보기 완료':'장보기 미완료 '+done+'/'+rows.length):'장보기 완료 · 추가 구매 없음')+'</span></div>'
       +(rows.length?rows.map(([n,x])=>{const on=shopChecked(start,n);return '<div class="shop'+(on?' on':'')+'" data-v63-shopcheck="'+start+'|'+encodeURIComponent(n)+'" style="cursor:pointer"><div class="bx"></div><div class="nm"><b>'+esc(n)+'</b><div class="hint">'+(x.g>0?Math.round(x.g*10)/10+'g':'')+(x.unknown?(x.g>0?' · ':'')+'레시피량 확인 필요':'')+'</div></div><div class="qt">'+(on?'구매완료':'미구매')+'</div></div>'}).join(''):'<p>등록된 재고로 준비 가능</p>')
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
 function mealCard(m,r){
   const fed=!!snapshot().feeds[m.key],known=m.ingredients.every(x=>x.g>0);
   return '<div class="card" style="margin:12px 0"><div class="hint">'+(m.component?'밥·반찬 따로 만들기':esc(m.on)+' '+['아침','점심','저녁'][m.slot])+'</div><h3>'+esc(m.name)+'</h3>'+
     '<p class="hint">'+esc(m.source)+'</p><p>'+m.ingredients.map(x=>esc(x.name)+' '+(x.g>0?x.g+'g':'분량 확인 필요')).join(' · ')+'</p>'+
     (r?'<div style="margin-top:10px"><b>이 끼니에 사용할 재고</b><div class="hint" style="margin-top:5px">'+(r.used.length?r.used.map(stockUseText).join('<br>'):'배정된 보유재고 없음')+'</div></div>':'')+
     '<details style="margin-top:10px"><summary>분량·레시피 확인/수정</summary><p class="hint">'+(m.steps?esc(m.steps).replace(/\n/g,'<br>'):'원본 조리법 미등록 — 확인된 내용만 저장해 주세요.')+'</p><button class="btn" data-v63-edit="'+esc(m.key)+'">분량 확인/수정</button></details>'+
     (m.component?'':'<div class="btnrow" style="margin-top:10px"><button class="btn" data-v63-feed="'+esc(m.key)+'">'+(fed?'급여 차감 취소':'급여 완료 · 조리식 차감')+'</button></div>')+
     '<details style="margin-top:12px"><summary>조리 완료 후 소분 등록</summary><p class="hint">입력한 총량에 비례해 위 재료를 사용합니다. 실제 소분량을 입력한 뒤 완료할 때만 재고가 차감됩니다.</p>'+
     '<form data-v63-form="'+esc(m.key)+'"><label>1개 중량(g) <input name="unitG" type="number" min="0.1" step="0.1" required value="'+(m.g||'')+'"></label><label>개수 <input name="count" type="number" min="1" step="1" required value="1"></label><label>제조일 <input name="date" type="date" required value="'+date()+'"></label><input name="token" type="hidden" value="'+token()+'"><button type="submit" class="btn pri" '+(!known?'disabled':'')+'>조리 완료 확인 · 재고 반영</button></form></details></div>';
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
 function prepDoneMap(){return read(K.prep,{})}
 function savePrepDoneMap(map){
   write(K.prep,map);
   try{if(typeof store!=='undefined'&&store?.set)Promise.resolve(store.set('prepChecklist2',map)).catch(()=>{})}catch(e){}
 }
 function prepUnit(name){
   const lots=snapshot().prepared.filter(x=>E.norm(x.name||x.ingredient)===E.norm(name)&&Number(x.unitG)>0)
     .sort((a,b)=>String(b.madeDate||'').localeCompare(String(a.madeDate||'')));
   if(lots.length)return Number(lots[0].unitG);
   return ['잡곡무른밥','잡곡진밥'].includes(E.norm(name))?50:null;
 }
 function prepTasks(rows,start){
   const map={};
   for(const r of rows){
     for(const n of r.needs||[]){
       const name=E.norm(n.name);
       if(!isPreparedOnlyShoppingName(name))continue;
       const x=map[name]||(map[name]={name,requiredG:0,missingG:0,unknown:false,mealKeys:new Set(),missingMealKeys:new Set()});
       x.mealKeys.add(r.meal.key);
       if(Number(n.g)>0)x.requiredG+=Number(n.g);
       if(n.buyG===null)x.unknown=true;
       else if(Number(n.buyG)>0){x.missingG+=Number(n.buyG);x.missingMealKeys.add(r.meal.key)}
     }
   }
   return Object.values(map).filter(x=>x.unknown||x.missingG>1e-6).map(x=>{
     const unitG=prepUnit(x.name),missingG=Math.round(x.missingG*10)/10,requiredG=Math.round(x.requiredG*10)/10,
       coveredG=Math.max(0,Math.round((requiredG-missingG)*10)/10),count=unitG&&missingG>0?Math.ceil(missingG/unitG):null,
       meals=x.mealKeys.size,missingMeals=x.missingMealKeys.size,coveredMeals=Math.max(0,meals-missingMeals);
     const key=[start,x.name,missingG,unitG||0,count||0,meals].join('|');
     return{name:x.name,missingG,requiredG,coveredG,unitG,count,meals,missingMeals,coveredMeals,unknown:x.unknown,key};
   });
 }
 function prepTaskRow(t,done){
   const makeQty=t.unitG&&t.count?('<b>추가 만들기 '+t.missingG+'g · '+t.unitG+'g × '+t.count+'개</b>'):(t.missingG>0?'<b>추가 만들기 '+t.missingG+'g</b>':'<b>분량 확인 필요</b>');
   const total=t.requiredG>0?'총 '+t.meals+'끼 필요 · '+t.requiredG+'g':'총 필요량 확인 필요';
   const have=t.coveredG>0?'보유 재고 배정 · '+t.coveredG+'g'+(t.coveredMeals?' · '+t.coveredMeals+'끼분':''):'보유 준비식 없음';
   const missing=t.missingG>0?'추가 '+(t.missingMeals||'')+'끼분':'';
   return '<div class="shop'+(done?' on':'')+'" data-v67-prepdone="'+encodeURIComponent(t.key)+'" style="cursor:pointer"><div class="bx"></div><div class="nm"><b>'+esc(t.name)+'</b><div class="hint" style="margin-top:4px">'+esc(total)+'</div><div class="hint">'+esc(have)+'</div><div style="margin-top:4px">'+makeQty+(missing?' <span class="hint">· '+esc(missing)+'</span>':'')+'</div></div><div class="qt">'+(done?'만들기 완료':'미완료')+'</div></div>';
 }
 function prepStatus(tasks,doneMap){
   const done=tasks.filter(t=>doneMap[t.key]?.done).length;
   return{done,total:tasks.length,all:tasks.length>0&&done===tasks.length};
 }
 function batchPrep(label,start,end,rows){
   const used=aggregateUsed(rows),missing=aggregateMissing(rows),tasks=prepTasks(rows,start),doneMap=prepDoneMap(),st=prepStatus(tasks,doneMap);
   const range=start+' ~ '+addD(end,-1);
   return '<div class="sec"><h2>'+label+' 식단만들기</h2><span class="more">'+range+'</span></div>'+
     '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h3 style="margin:0">준비할 음식</h3><span class="chip sm '+(st.all?'ok':'')+'">'+(tasks.length?(st.all?'만들기 완료':'만들기 '+st.done+'/'+st.total):'추가 조리 없음')+'</span></div>'+
     (tasks.length?tasks.map(t=>prepTaskRow(t,!!doneMap[t.key]?.done)).join(''):'<p class="hint">현재 보유한 준비식으로 필요한 양을 충당할 수 있어요.</p>')+
     (tasks.length?'<div class="btnrow" style="margin-top:10px"><button class="btn '+(st.all?'':'pri')+'" data-v67-prepall="'+start+'">'+(st.all?'완료 취소':'전체 만들기 완료')+'</button></div>':'')+
     '<p class="hint" style="margin-top:8px">완료 체크는 작업 상태만 기록합니다. 실제 재고 차감은 아래 조리 완료에서 확정해요.</p></div>'+
     '<div class="card"><h3 style="margin-top:0">꺼낼 재고</h3>'+
     (used.length?used.map(u=>'<div class="inventory-row"><div style="flex:1">'+stockUseText(u)+(u.location?'<div class="hint">'+esc(u.location)+(u.date?' · '+esc(u.date):'')+'</div>':'')+'</div></div>').join(''):'<p class="hint">배정 가능한 보유재고가 없어요.</p>')+
     (missing.length?'<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--line2)"><b>추가 준비 필요</b>'+missing.filter(x=>!isPreparedOnlyShoppingName(x.name)).map(x=>'<div class="hint" style="margin-top:5px">'+esc(x.name)+' · '+(x.unknown?'분량 확인 필요':Math.round(x.g*10)/10+'g 부족')+'</div>').join('')+'</div>':'')+
     '</div>'+rows.map(r=>mealCard(r.meal,r)).join('');
 }
 function prep(){
   const p=plan(),base=target(),firstEnd=addD(base,4),secondEnd=addD(base,7),
     first=p.filter(r=>r.meal.on>=base&&r.meal.on<firstEnd),
     second=p.filter(r=>r.meal.on>=firstEnd&&r.meal.on<secondEnd),
     names=[...new Set(p.flatMap(r=>r.meal.ingredients.map(x=>x.name)))];
   return nav()+'<h2>식단만들기</h2><p class="hint"><b>1차(월~목)와 2차(금~일)를 따로 준비</b>하고, 각 차수에서 실제로 꺼낼 재고번호와 사용량을 먼저 보여줘요. 이 화면의 배정은 예정이며 <b>조리 완료</b>를 누를 때만 실제 재고가 차감됩니다.</p>'+
     batchPrep('1차',base,firstEnd,first)+batchPrep('2차',firstEnd,secondEnd,second)+
     '<details style="margin-top:14px"><summary>밥·반찬을 따로 만들어 냉동하기</summary>'+names.map(n=>mealCard(component(n))).join('')+'</details>';
 }
 function get(k){if(k.startsWith('component:'))return component(decodeURIComponent(k.slice(10)));const [on,s]=k.split('|');return model(on,Number(s))}
 function editor(m){
   open('<h2>레시피·실제 사용량</h2><h3>'+esc(m.name)+'</h3><p class="hint">아래 양은 한 번 조리할 기준량입니다. 원본 또는 실제 계량값만 저장하세요. 원물과 조리된 재료를 구분해서 적어 주세요.</p><form data-v63-recipe="'+esc(m.key)+'"><label>기준 완성량(g)<input name="yieldG" type="number" step="0.1" min="0.1" value="'+(m.g||'')+'" required></label><label>재료: 한 줄에 이름 = g<textarea name="ingredients" rows="7" required>'+esc(m.ingredients.map(x=>x.name+' = '+(x.g||'')).join('\n'))+'</textarea></label><label>확인된 만드는 법<textarea name="steps" rows="6">'+esc(m.steps||'')+'</textarea></label><button class="btn pri" type="submit">저장</button></form>');
 }
 vShop=function(){try{if(root.__mgStage==='shop')return shopping();if(root.__mgStage==='prep')return prep();return oldView()}catch(e){return '<div class="card">재고 데이터를 읽지 못했어요. 변경하지 않고 중단했습니다.</div>'}};
 root.vShop=vShop;
 if(root.addEventListener)root.addEventListener('click',function(e){const old=e.target.closest&&e.target.closest('[data-v62-complete],[data-v35complete],[data-a^="bdone:"]');if(old){e.preventDefault();e.stopImmediatePropagation();toast('새 식단만들기 화면에서 완료해 주세요')}},true);
 // Block legacy automatic deduction entry points. The old v62 loader is removed in index.html.
 document.addEventListener('click',function(e){
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
     if(shop.hasAttribute('data-v63-shopcheck')){
       const [start,enc]=shop.getAttribute('data-v63-shopcheck').split('|'),name=decodeURIComponent(enc),key=shopKey(start),list=shopChk[key]||(shopChk[key]=[]),i=list.indexOf(name);
       i<0?list.push(name):list.splice(i,1);
     }else{
       const start=shop.getAttribute('data-v63-shopall'),key=shopKey(start),p=plan(),end=addD(start,start===target()?4:3),names=[];
       const totals={};for(const r of p.filter(r=>r.meal.on>=start&&r.meal.on<end))for(const x of r.needs){const t=totals[x.name]||(totals[x.name]={g:0,unknown:false});if(x.buyG===null)t.unknown=true;else t.g+=x.buyG}
       for(const [n,v] of Object.entries(totals))if(v.g>1e-6||v.unknown)names.push(n);
       const cur=shopChk[key]||[],all=names.length>0&&names.every(n=>cur.includes(n));shopChk[key]=all?[]:names;
     }
     saveShopChecks();render(true);return;
   }
   const el=e.target.closest&&e.target.closest('[data-v63-edit],[data-v63-feed],[data-v62-complete],[data-v35complete],[data-a^="bdone:"]');if(!el)return;
   e.preventDefault();e.stopImmediatePropagation();
   if(locked)return;
   try{
     if(el.hasAttribute('data-v63-edit'))return editor(get(el.getAttribute('data-v63-edit')));
     if(!el.hasAttribute('data-v63-feed'))return toast('새 식단만들기 화면에서 완료해 주세요');
     const m=get(el.getAttribute('data-v63-feed'));if(!m)throw Error('식단이 변경됐어요');
     const s=snapshot(),undo=!!s.feeds[m.key];if(!confirm(undo?'급여 차감을 취소하고 사용량을 복원할까요?':'실제로 급여한 식사인가요? 조리식 재고를 차감합니다.'))return;
     locked=true;const next=undo?E.undoFeed(s,m.key):E.feed(s,m);commit(s,next.state);toast(undo?'급여 차감을 취소했어요':'급여한 조리식을 차감했어요');render(true);if(typeof sheetOpen!=='undefined'&&sheetOpen&&oldSheet)sheetDay(m.on);
   }catch(err){toast(err.message)}finally{locked=false}
 },true);
 document.addEventListener('submit',function(e){
   const f=e.target;if(!f.matches('[data-v63-form],[data-v63-recipe]'))return;e.preventDefault();e.stopImmediatePropagation();if(locked)return;
   try{
     const fd=new FormData(f),k=f.getAttribute('data-v63-form')||f.getAttribute('data-v63-recipe'),m=get(k);if(!m)throw Error('식단이 변경됐어요');
     if(f.hasAttribute('data-v63-recipe')){
       const ingredients=String(fd.get('ingredients')).split('\n').filter(x=>x.trim()).map(line=>{const i=line.lastIndexOf('=');if(i<1)throw Error('재료 = g 형식으로 입력해 주세요');const name=E.norm(line.slice(0,i)),g=Number(line.slice(i+1));if(!name||!Number.isFinite(g)||g<=0)throw Error('재료량을 확인해 주세요');return {name,g}});
       const yieldG=Number(fd.get('yieldG'));if(!ingredients.length||!Number.isFinite(yieldG)||yieldG<=0)throw Error('완성량을 확인해 주세요');
       const map=recipeMap();map[m.name]={ingredients,yieldG,steps:String(fd.get('steps')||'')};write(K.recipes,map);close();render(true);return toast('레시피와 분량을 저장했어요');
     }
     const form={token:String(fd.get('token')),count:Number(fd.get('count')),unitG:Number(fd.get('unitG')),date:String(fd.get('date'))};
     if(!/^\d{4}-\d{2}-\d{2}$/.test(form.date)||form.date>date())throw Error('실제 제조일을 확인해 주세요');
     if(!confirm(m.name+' '+form.unitG+'g × '+form.count+'개 조리를 완료했나요?'))return;
     locked=true;const s=snapshot(),result=E.cook(s,m,form);if(!result.already)commit(s,result.state);toast(result.already?'이미 반영된 조리입니다':'조리식 재고를 등록했어요');render(true);
   }catch(err){toast(err.message)}finally{locked=false}
 },true);
 if(oldSheet){sheetDay=function(on){oldSheet(on);const holder=typeof sheet!=='undefined'?sheet:document.querySelector('.sheet');if(!holder)return;const box=document.createElement('div');box.id='v63-feed';box.innerHTML='<h3>냉동 조리식 급여</h3><p class="hint">먹은 반응과 재고 차감은 별도입니다. 실제 꺼내 먹인 끼니만 완료해 주세요.</p>'+[0,1,2].map(i=>{const m=model(on,i);return m?'<button class="btn" data-v63-feed="'+esc(m.key)+'">'+['아침','점심','저녁'][i]+(snapshot().feeds[m.key]?' 차감 취소':' 급여 완료')+'</button>':''}).join('');holder.querySelector('#v63-feed')?.remove();holder.appendChild(box)};root.sheetDay=sheetDay;}
 if(oldBatch){sheetBatch=function(){root.__mgStage='prep';close();render(true)};root.sheetBatch=sheetBatch;}
 root.__MEAL_WORKFLOW_V63={model,meals,plan,snapshot};
 try{render(true)}catch(e){}
})(typeof globalThis!=='undefined'?globalThis:this);
