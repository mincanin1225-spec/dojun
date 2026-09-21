const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const db=new Map(),events={};
db.set('dj:preparedMealInventory1',JSON.stringify([
  {id:'rice-500',name:'잡곡무른밥',unitG:50,remainingCount:10,madeDate:'2026-09-20',mealCode:'M-1',location:'냉동'}
]));
const ctx={
  console,Date,Math,JSON,Map,Set,Number,String,encodeURIComponent,decodeURIComponent,
  inventory:{chicken:{displayName:'닭고기',stockCode:'R-1',unit:'g',qty:1000,location:'냉동'}},
  invName:k=>k,weekCur:'2026-09-21',shopChk:{},
  store:{set:()=>Promise.resolve()},
  vShop:()=>'<p>stock</p>',sheetBatch(){},sheetDay(){},sheetOpen:false,close(){},render(){},toast(){},confirm:()=>true,open(){},
  localStorage:{getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)},
  document:{addEventListener:(k,f)=>(events[k]??=[]).push(f),querySelector:()=>null},
  addD:(on,n)=>new Date(new Date(on+'T00:00:00Z').getTime()+86400000*n).toISOString().slice(0,10),
  isDel:()=>false,
  mText:()=> '잡곡무른밥 · 닭고기',
  __mgStage:'prep',__mgWeekTarget:'current',
  __PPEUNI_SCHEDULE_V58:{entry:()=>({stage:'late',meals:Array.from({length:3},()=>({base:'잡곡무른밥',t:'닭고기'}))})}
};
ctx.window=ctx;vm.createContext(ctx);
for(const f of ['meal-stock-v66.js','meal-workflow-v68-portion2.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);

const html=ctx.vShop();
const first=html.split('2차 식단만들기')[0];
assert(first.includes('총 12끼 필요 · 1200g'),'first batch must show total demand, not shortage as total');
assert(first.includes('보유 재고 배정 · 500g · 5끼분'),'existing M-1 500g must be shown as already covered');
assert(first.includes('추가 만들기 700g · 50g × 14개'),'only remaining 700g should be shown as new prep');
assert(first.includes('추가 7끼분'),'remaining amount should be explained as seven meals');
assert(first.includes('M-1')&&first.includes('잡곡무른밥 500g'),'existing prepared stock must still be visible under stock to pull');
console.log('PASS: prep summary separates total need, existing stock and additional cooking');
