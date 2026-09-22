const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');

const db=new Map(),docEvents={},winEvents={},toasts=[];
const localStorage={
  getItem:k=>db.has(k)?db.get(k):null,
  setItem:(k,v)=>db.set(k,String(v)),
  removeItem:k=>db.delete(k)
};

db.set('dj:preparedMealInventory1',JSON.stringify([
  {id:'rice-stock',name:'잡곡무른밥',unitG:100,remainingCount:14,originalCount:14,madeDate:'2026-09-20',mealCode:'M-rice'}
]));
db.set('dj:cubeInventory2','[]');

let stockInput='60';
let makeInput='80';
const offered={b:'120',l:'120',d:'120'};

const ctx={
  console,Date,Math,JSON,Object,Array,Set,Map,Number,String,encodeURIComponent,decodeURIComponent,
  today:'2026-09-22',
  inventory:{beef:{unit:'g',qty:60,location:'냉장',stockCode:'A-1',updatedAt:1}},
  invName:k=>k==='beef'?'소고기':k,
  inventoryKeys:()=>['beef'],
  stage:()=>({rice:100,veg:20,fruit:20,tofu:20,fish:20,meat:20}),
  byK:{beef:{k:'beef',cat:'p'}},
  persistInventoryLocal(){db.set('dj:inventory2',JSON.stringify(ctx.inventory));},
  pushInventoryItem(){},
  weekCur:'2026-09-21',
  shopChk:{},
  store:{set:(k,v)=>{db.set('dj:'+k,JSON.stringify(v));return Promise.resolve();}},
  vShop:()=>'<p>base</p>',
  sheetBatch(){},sheetDay(){},sheetOpen:false,close(){},open(){},render(){},
  toast:m=>toasts.push(String(m)),confirm:()=>true,
  localStorage,
  document:{
    addEventListener:(k,f)=>(docEvents[k]??=[]).push(f),
    querySelectorAll(sel){
      if(sel==='[data-rq]')return [{dataset:{rq:'beef'},value:stockInput}];
      if(sel==='[data-cq]')return [];
      return [];
    },
    querySelector(sel){
      if(sel.startsWith('[data-v71-makeg='))return {value:makeInput};
      const m=sel.match(/\[data-offered="([bld])"\]/);if(m)return {value:offered[m[1]]};
      return null;
    }
  },
  addEventListener:(k,f)=>(winEvents[k]??=[]).push(f),
  addD:(on,n)=>new Date(new Date(on+'T00:00:00Z').getTime()+86400000*n).toISOString().slice(0,10),
  isDel:()=>false,
  mText:(on,slot)=>slot===0?'잡곡무른밥 · 소고기':'',
  __mgStage:'stock',__mgWeekTarget:'current',
  __PPEUNI_SCHEDULE_V58:{entry:()=>({stage:'late',meals:[{base:'잡곡무른밥',t:'소고기'},{base:'',t:''},{base:'',t:''}]})}
};
ctx.window=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync('legacy-management-v32.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('meal-stock-v66.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('meal-workflow-v70.js','utf8'),ctx);

const W=ctx.__MEAL_WORKFLOW_V63;
assert(W,'meal workflow export missing');

const totalBuy=(name)=>W.plan().flatMap(r=>r.needs||[]).filter(x=>ctx.MealStockV63.norm(x.name)===ctx.MealStockV63.norm(name)).reduce((s,x)=>s+(Number(x.buyG)||0),0);
const preparedG=(name)=>ctx.MealStockV63.pool(W.snapshot(),false).filter(x=>x.name===ctx.MealStockV63.norm(name)).reduce((s,x)=>s+x.g,0);

function dispatchClick(target){
  const e={target,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}};
  for(const fn of docEvents.click||[])fn(e);
}
function saveRaw(qty){
  stockInput=String(qty);
  const btn={dataset:{mg32:'save'},closest:sel=>sel.includes('[data-mg32]')?btn:null};
  dispatchClick(btn);
}
function clickMake(encoded){
  const el={getAttribute:k=>k==='data-v71-makecheck'?encoded:null,hasAttribute:k=>k==='data-v71-makecheck',closest:sel=>sel.includes('[data-v71-makecheck]')?el:null};
  dispatchClick(el);
}
function clickFeed(key){
  const el={getAttribute:k=>k==='data-v63-feed'?key:null,hasAttribute:k=>k==='data-v63-feed',closest:sel=>sel.includes('[data-v63-feed]')?el:null};
  dispatchClick(el);
}

// 1) 재고 -> 장보기: 숫자를 바꾸는 즉시 부족분 계산이 반대로 움직여야 한다.
assert.equal(totalBuy('소고기'),80,'60g stock against 140g weekly need should leave 80g to buy');
saveRaw(100);
assert.equal(ctx.inventory.beef.qty,100,'stock save must change actual inventory');
assert.equal(totalBuy('소고기'),40,'raising stock by 40g must lower shopping shortage by 40g');
saveRaw(20);
assert.equal(totalBuy('소고기'),120,'lowering stock must increase shopping shortage immediately');
saveRaw(60);
assert.equal(totalBuy('소고기'),80,'restoring stock must restore shopping shortage');

// 2) 장보기 -> 재고: 1차/2차 부족분을 구매완료하면 원재료 재고가 실제로 늘어야 한다.
W.addPurchasedStock('2026-09-21','소고기',20);
W.addPurchasedStock('2026-09-25','소고기',60);
assert.equal(ctx.inventory.beef.qty,140,'shopping completion must stock in the purchased raw grams');
assert.equal(totalBuy('소고기'),0,'shopping-completed raw stock must remove the shortage');

// 3) 만들기 -> 준비식 재고: 1차 필요량 80g이 기본값이고 완료 후 준비식으로 정확히 이동해야 한다.
ctx.__mgStage='prep';ctx.__mgWeekTarget='current';
let html=ctx.vShop();
const makeKeys=[...html.matchAll(/data-v71-makecheck="([^"]+)"/g)].map(x=>x[1]);
const beefKey=makeKeys.find(x=>decodeURIComponent(x).endsWith('|소고기'));
assert(beefKey,'beef make task missing');
const firstRows=W.plan().filter(r=>r.meal.on>='2026-09-21'&&r.meal.on<'2026-09-25');
let beefTask=W.makeTasks(firstRows,'2026-09-21').find(x=>x.name==='소고기');
assert.equal(beefTask.missingG,80,'first batch should require 80g prepared beef');
makeInput='80';clickMake(beefKey);
assert.equal(preparedG('소고기'),80,'make completion must create exactly 80g prepared beef');
assert.equal(ctx.inventory.beef.qty,60,'make completion must consume exactly 80g raw beef');
beefTask=W.makeTasks(W.plan().filter(r=>r.meal.on>='2026-09-21'&&r.meal.on<'2026-09-25'),'2026-09-21').find(x=>x.name==='소고기');
assert.equal(beefTask.missingG,0,'made amount must immediately satisfy the first-batch prep number');

// 4) 이번 주 사용 -> 다음 주 준비: 먹이기 전/후 다음 주 부족분이 사용량만큼 즉시 변해야 한다.
ctx.__mgWeekTarget='next';
assert.equal(totalBuy('소고기'),0,'before current-week feeding, 140g combined stock should cover next week');
ctx.__mgWeekTarget='current';
clickFeed('2026-09-21|0');
assert.equal(preparedG('소고기'),60,'feeding one 120g meal must consume its 20g beef component');
ctx.__mgWeekTarget='next';
assert.equal(totalBuy('소고기'),20,'20g used this week must immediately become 20g next-week shortage');

// 5) 먹이기 취소도 역방향으로 연결되어야 한다.
ctx.__mgWeekTarget='current';
clickFeed('2026-09-21|0');
ctx.__mgWeekTarget='next';
assert.equal(totalBuy('소고기'),0,'undoing the feed must restore next-week preparation stock');

console.log('PASS: inventory -> shopping -> make -> feed -> next-week preparation stays numerically linked');
