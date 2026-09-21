const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const db=new Map(),docEvents={},winEvents={};let inputValue='140';
db.set('dj:preparedMealInventory1',JSON.stringify([{id:'base',name:'잡곡무른밥',unitG:50,remainingCount:10,madeDate:'2026-09-20',mealCode:'M-base'}]));
const ctx={
  console,Date,Math,JSON,Map,Set,Number,String,encodeURIComponent,decodeURIComponent,
  inventory:{chicken:{unit:'g',qty:100,location:'냉장'}},
  invName:k=>k==='chicken'?'닭고기':k,inventoryKeys:()=>['chicken'],
  persistInventoryLocal(){},pushInventoryItem(){},
  weekCur:'2026-09-21',shopChk:{},
  store:{set:()=>Promise.resolve()},
  vShop:()=>'<p>stock</p>',sheetBatch(){},sheetDay(){},sheetOpen:false,close(){},render(){},toast(){},confirm:()=>true,open(){},
  localStorage:{getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)},
  document:{
    addEventListener:(k,f)=>(docEvents[k]??=[]).push(f),
    querySelector:s=>s.includes('[data-v71-makeg=')?{value:inputValue}:null
  },
  addEventListener:(k,f)=>(winEvents[k]??=[]).push(f),
  addD:(on,n)=>new Date(new Date(on+'T00:00:00Z').getTime()+86400000*n).toISOString().slice(0,10),
  isDel:()=>false,
  mText:(on,slot)=>on==='2026-09-21'&&slot===0?'잡곡무른밥 · 닭고기':'',
  __mgStage:'prep',__mgWeekTarget:'current',
  __PPEUNI_SCHEDULE_V58:{entry:()=>({stage:'late',meals:[{base:'잡곡무른밥',t:'닭고기'},{base:'',t:''},{base:'',t:''}]})}
};
ctx.window=ctx;vm.createContext(ctx);
for(const f of ['meal-stock-v66.js','meal-workflow-v70.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);

let html=ctx.vShop();
assert(html.includes('3단계 · 만들기'));
assert(html.includes('장보기처럼 실제로 만들었는지만 체크'));
assert(html.includes('잡곡무른밥 · 닭고기'));
assert(html.includes('이번 준비 필요 120g'));
assert(html.includes('value="120"'),'default made amount must be exact current need');
assert(html.includes('data-v71-makecheck')&&html.includes('data-v71-makeg'));
assert(!html.includes('1 · 재료·분량'),'active make page must not require the old cooking editor');

const key=html.match(/data-v71-makecheck="([^"]+)"/)?.[1];assert(key,'make task key missing');
function clickMake(encoded){
  const item={getAttribute:k=>k==='data-v71-makecheck'?encoded:null,hasAttribute:k=>k==='data-v71-makecheck'};
  const event={target:{closest:sel=>sel.includes('data-v71-makecheck')?item:null},preventDefault(){},stopImmediatePropagation(){}};
  for(const fn of docEvents.click||[])fn(event);
}
clickMake(key);
let lots=JSON.parse(db.get('dj:preparedMealInventory1'));
const made=lots.find(x=>x.name==='잡곡무른밥 · 닭고기');assert(made,'checked make task must create prepared stock');
assert.equal(made.unitG,140,'edited actual amount must be stored instead of the default');
assert.equal(made.remainingCount,1);
assert(ctx.inventory.chicken.qty<100,'making must deduct raw ingredients');

html=ctx.vShop();
assert(html.includes('필요량 준비됨'));
assert(html.includes('완료 취소'),'checked make task must behave like a reversible checklist while untouched');
const undoKey=html.match(/data-v71-makecheck="([^"]+)"/)?.[1];assert(undoKey);
clickMake(undoKey);
lots=JSON.parse(db.get('dj:preparedMealInventory1'));
assert(!lots.some(x=>x.name==='잡곡무른밥 · 닭고기'),'uncheck must remove the just-made prepared stock');
assert(Math.abs(ctx.inventory.chicken.qty-100)<0.001,'uncheck must restore raw ingredients');
console.log('PASS: make step is a simple editable weekly checklist with safe stock-in and undo');
