/* v70 핵심 흐름 교차검증 고정 테스트
   - 같은 이름 준비식 만들기는 원재료만 사용
   - 다른 준비식을 재료로 쓰는 합법 경로는 유지
   - 먹이기는 기록만 남기고 재고를 건드리지 않음
   - 구매완료 재체크는 중복 입고 금지
   - 사진시드/준비식 UI는 동기화·표시 안전성 유지 */
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');

function harness(opts={}){
  const db=new Map(),docEvents={},toasts=[];
  const localStorage={getItem:k=>db.has(k)?db.get(k):null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)};
  db.set('dj:preparedMealInventory1',JSON.stringify(opts.prepared||[]));
  db.set('dj:cubeInventory2',JSON.stringify(opts.cubes||[]));
  const state={makeInput:'0'};
  const ctx={
    console,Date,Math,JSON,Object,Array,Set,Map,Number,String,encodeURIComponent,decodeURIComponent,Promise,
    setTimeout:f=>f(),today:'2026-09-22',weekCur:'2026-09-21',
    inventory:opts.inventory||{},invName:k=>(opts.names&&opts.names[k])||k,
    inventoryKeys:()=>Object.keys(opts.names||opts.inventory||{}),
    stage:()=>({rice:100,veg:20,fruit:20,tofu:20,fish:20,meat:20}),byK:{},
    persistInventoryLocal(){},pushInventoryItem(){},
    shopChk:{},store:{set:()=>Promise.resolve()},vShop:()=>'<p>base</p>',
    sheetBatch(){},sheetDay(){},close(){},open(){},render(){},
    toast:m=>toasts.push(String(m)),confirm:()=>true,localStorage,
    document:{
      addEventListener:(k,f)=>(docEvents[k]??=[]).push(f),querySelectorAll:()=>[],
      querySelector:sel=>sel.startsWith('[data-v71-makeg=')?{value:state.makeInput}:null
    },
    addEventListener:()=>{},
    addD:(on,n)=>new Date(new Date(on+'T00:00:00Z').getTime()+86400000*n).toISOString().slice(0,10),
    isDel:()=>false,mText:(on,slot)=>slot===0?'잡곡무른밥 · 소고기':'',
    __mgStage:'stock',__mgWeekTarget:'current',
    __PPEUNI_SCHEDULE_V58:{entry:()=>({stage:'late',meals:[{base:'잡곡무른밥',t:'소고기'},{base:'',t:''},{base:'',t:''}]})}
  };
  ctx.window=ctx;vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('meal-stock-v66.js','utf8'),ctx);
  vm.runInContext(fs.readFileSync('meal-workflow-v70.js','utf8'),ctx);
  const E=ctx.MealStockV63,W=ctx.__MEAL_WORKFLOW_V63;
  const dispatch=attrs=>{
    const el={getAttribute:k=>attrs[k]??null,hasAttribute:k=>k in attrs,
      closest:s=>{for(const k of Object.keys(attrs))if(s.includes('['+k+']'))return el;return null}};
    for(const fn of docEvents.click||[])fn({target:el,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}});
  };
  return {ctx,E,W,db,toasts,state,dispatch,
    preparedG:n=>E.pool(W.snapshot(),false).filter(x=>x.name===E.norm(n)).reduce((s,x)=>s+x.g,0),
    buyG:n=>W.plan().flatMap(r=>r.needs||[]).filter(x=>E.norm(x.name)===E.norm(n)).reduce((s,x)=>s+(Number(x.buyG)||0),0)};
}

// 1) 같은 이름의 준비식이 남아 있어도 추가 만들기는 원재료를 소비해야 한다.
{
  const h=harness({
    prepared:[{id:'bp',name:'소고기',unitG:40,remainingCount:1,madeDate:'2026-09-19',mealCode:'M-b'},
              {id:'rp',name:'잡곡무른밥',unitG:100,remainingCount:14,madeDate:'2026-09-20',mealCode:'M-r'}],
    inventory:{beef:{unit:'g',qty:500,location:'냉장',stockCode:'A-1',updatedAt:1}},names:{beef:'소고기'}});
  h.ctx.__mgStage='prep';
  const task=h.W.makeTasks(h.W.plan().filter(r=>r.meal.on>='2026-09-21'&&r.meal.on<'2026-09-25'),'2026-09-21').find(x=>x.name==='소고기');
  assert.equal(task.missingG,40);
  h.state.makeInput='40';
  h.dispatch({'data-v71-makecheck':encodeURIComponent('2026-09-21|소고기')});
  assert.equal(h.preparedG('소고기'),80,'new make must add to existing prepared stock');
  assert.equal(h.ctx.inventory.beef.qty,460,'new make must consume raw beef, not recycle prepared beef');
}

// 2) 단, 다른 조리식의 재료로 기존 준비식을 쓰는 합법 경로는 막지 않는다.
{
  const E=require('../meal-stock-v66.js');
  const state={
    prepared:[{id:'beef-prep',name:'소고기',unitG:20,remainingCount:1,mealCode:'M-b'}],
    cubes:[{id:'carrot',ingredient:'당근',unitG:10,remainingCount:1,stockCode:'A-c'}],
    raw:{},ops:{},feeds:{}
  };
  const meal={key:'make:test|소고기채소볼',name:'소고기채소볼',g:30,ingredients:[{name:'소고기',g:20},{name:'당근',g:10}]};
  const out=E.cook(state,meal,{token:'combo',count:1,unitG:30,date:'2026-09-22'}).state;
  assert.equal(E.pool(out,false).filter(x=>x.name==='소고기').reduce((s,x)=>s+x.g,0),0,'prepared beef should be usable inside a different prepared recipe');
  assert.equal(E.pool(out,false).filter(x=>x.name==='소고기채소볼').reduce((s,x)=>s+x.g,0),30);
}

// 3) 먹이기는 기록이다. 재고가 하나도 없어도 저장되고, 어떤 숫자도 움직이지 않는다.
{
  const h=harness({
    prepared:[{id:'b',name:'소고기',unitG:140,remainingCount:1,madeDate:'2026-09-20',mealCode:'M-b'},
              {id:'r',name:'잡곡무른밥',unitG:100,remainingCount:28,madeDate:'2026-09-20',mealCode:'M-r'}]
  });
  h.ctx.__mgWeekTarget='next';
  assert.equal(h.buyG('소고기'),0,'next week must plan against the stock that actually exists');
  h.ctx.__mgWeekTarget='current';
  const before=h.preparedG('소고기');
  h.dispatch({'data-v63-feed':'2026-09-22|0'});
  assert(h.W.snapshot().feeds['2026-09-22|0'],'feeding must be recorded');
  assert.equal(h.preparedG('소고기'),before,'feeding must not deduct prepared stock');
}

// 3-b) 준비식이 전혀 없어도 먹이기 기록은 저장되어야 한다.
{
  const h=harness({prepared:[]});
  h.dispatch({'data-v63-feed':'2026-09-22|0'});
  assert(h.W.snapshot().feeds['2026-09-22|0'],'feeding must be recordable with no prepared stock at all');
}

// 4) 구매완료 취소가 재고수정 때문에 롤백되지 못한 뒤 재체크해도 중복 입고하지 않는다.
{
  const h=harness({inventory:{beef:{unit:'g',qty:0,location:'냉장',stockCode:'A-1',updatedAt:1}},names:{beef:'소고기'}});
  h.ctx.__mgStage='shop';
  const check={'data-v63-shopcheck':'2026-09-21|'+encodeURIComponent('소고기'),'data-v63-shopg':'80'};
  h.dispatch(check);
  assert.equal(h.ctx.inventory.beef.qty,80);
  h.ctx.inventory.beef={...h.ctx.inventory.beef,qty:100,updatedAt:Date.now()+9000};
  h.dispatch(check);
  assert.equal(h.ctx.inventory.beef.qty,100,'failed rollback must preserve manually edited stock');
  h.dispatch(check);
  assert.equal(h.ctx.inventory.beef.qty,100,'re-check must not double-stock a receipt that still exists');
  assert.match(h.toasts.at(-1),/이미 반영된 구매/);
}

// 5) 사진시드/준비식 화면 안전장치.
{
  const src=fs.readFileSync('legacy-inventory-v61-photo.js','utf8');
  assert(src.includes("push('preparedMealInventory1',v)"));
  assert(src.includes("push('cubeInventory2',v)"));
  assert(src.includes("localStorage.getItem(CUBE_KEY)!==null||localStorage.getItem(PREP_KEY)!==null"),'seed guard must detect even deliberately empty synced arrays');
  assert(src.includes('!isWholeMeal(x)'),'whole-meal lots must be hidden from prepared UI');
  assert(src.includes("replace(/-잔량-\\d+-\\d+$/,'')"),'internal residual suffix must be hidden');
  assert(!src.includes('Math.ceil((Number(x.unitG)'),'prepared grams must not be rounded up');
  assert(src.includes('이미 만들어둔 준비식'),'prep summary must follow the same prepared-only rule');
}

// 6) 제거된 v67 핸들러가 정의 없는 함수를 다시 부르지 않는다.
{
  const flow=fs.readFileSync('meal-workflow-v70.js','utf8');
  for(const fn of ['prepDoneMap','savePrepDoneMap','prepTasks'])
    assert(!new RegExp('[^a-zA-Z]'+fn+'\\(').test(flow),fn+' must not be called');
  assert(flow.includes('data-v63-edit="component:'),'make rows must retain the recipe confirmation route');
}


// 7) 단호박 조각/큐브처럼 소분 표시가 붙은 준비식도 기본 재료명으로 인식한다.
{
  const E=require('../meal-stock-v66.js');
  const state={
    prepared:[{id:'rice',name:'잡곡무른밥',unitG:100,remainingCount:1,mealCode:'M-r'}],
    cubes:[{id:'pumpkin-piece',ingredient:'단호박 조각',unitG:10,remainingCount:2,stockCode:'A-p'}],
    raw:{pumpkin:{displayName:'단호박',unit:'g',qty:100,location:'냉장'}},ops:{},feeds:{}
  };
  assert.equal(E.norm('단호박 조각'),'단호박','ready-to-feed suffix variants must normalize to the ingredient name');
  assert.equal(E.norm('단호박 큐브'),'단호박','cube suffix must normalize too');
}

// 8) 제공량이 비어 있으면 검증된 식단 기준량을 기록용 기본값으로 넣는다.
{
  const flow=fs.readFileSync('meal-workflow-v70.js','utf8');
  assert(flow.includes("offeredEl.value=String(Math.round(Number(m.g)*10)/10)"),'feed action must apply the meal standard grams when offered amount is blank');
  assert(flow.includes("el.value=String(Math.round(g*10)/10)"),'day sheet must prefill the standard serving grams as the actual input value');
  assert(!flow.includes('E.feed(s,m,offered)'),'feeding must never deduct stock');
  assert(!flow.includes('E.undoFeed(s,m.key)'),'un-feeding must never restore stock');
  assert(!flow.includes('먼저 제공한 전체 양(g)을 입력해 주세요'),'a blank offered amount must not block the record');
  const shell=fs.readFileSync('legacy-v70.html','utf8');
  assert(shell.includes('data-extra="${slot}"'),'extra-food free text input must exist for each meal');
  assert(shell.includes('cur.extra_foods=extra.value.trim()'),'extra-food text must persist');
}

// 9) 준비식 목록은 오래된 것부터 보여 폐기 판단을 돕고, 재고번호가 그대로 보여야 한다.
{
  const v61=fs.readFileSync('legacy-inventory-v61-photo.js','utf8');
  assert(v61.includes("String(a.madeDate||'').localeCompare(String(b.madeDate||''))"),'prepared list must be sorted oldest first');
  assert(v61.includes('esc(showCode(x.mealCode))'),'prepared rows must show the stock code used on the container');
  assert(v61.includes('data-v61-prep-del'),'prepared rows must offer a discard action');
  assert(!v61.includes('완료 취소</b>는 더 이상'),'editing prepared quantity is the normal weekly routine, not a warned-against action');
}

console.log('PASS: cross-checked core flow fixes and non-regression paths');
