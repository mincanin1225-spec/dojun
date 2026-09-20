const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const db=new Map(),events={};
db.set('dj:cubeInventory2',JSON.stringify([
  {ingredient:'닭고기',stockCode:'A-9',code:'A-9',unitG:20,remainingCount:12,madeDate:'2026-09-19',location:'냉동'},
  {ingredient:'브로콜리',stockCode:'A-13',code:'A-13',unitG:20,remainingCount:12,madeDate:'2026-09-20',location:'냉동'}
]));
db.set('dj:preparedMealInventory1',JSON.stringify([
  {name:'잡곡무른죽',mealCode:'M-1',unitG:100,remainingCount:12,madeDate:'2026-09-20'}
]));
const ctx={
  console,Date,Math,JSON,Map,Set,Number,String,encodeURIComponent,decodeURIComponent,
  inventory:{},invName:k=>k,weekCur:'2026-09-21',shopChk:{},store:{set:()=>Promise.resolve()},
  vShop:()=>'<p>stock</p>',sheetBatch(){},sheetDay(){},sheetOpen:false,close(){},render(){},toast(){},confirm:()=>true,open(){},
  localStorage:{getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)},
  document:{addEventListener:(k,f)=>(events[k]??=[]).push(f),querySelector:()=>null},
  addD:(on,n)=>new Date(new Date(on+'T00:00:00Z').getTime()+86400000*n).toISOString().slice(0,10),
  mText:()=> '잡곡무른밥 · 닭고기 · 브로콜리',isDel:()=>false,
  __mgStage:'prep',__mgWeekTarget:'current',
  __PPEUNI_SCHEDULE_V58:{entry:()=>({stage:'late',meals:Array.from({length:3},()=>({base:'잡곡무른밥',t:'닭고기 브로콜리'}))})}
};
ctx.window=ctx;vm.createContext(ctx);
for(const f of ['meal-stock-v66.js','meal-workflow-v66.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);

const pool=ctx.MealStockV63.pool({
  prepared:JSON.parse(db.get('dj:preparedMealInventory1')),
  cubes:JSON.parse(db.get('dj:cubeInventory2')),
  raw:{fresh:{displayName:'양파',stockCode:'R-7',unit:'g',qty:40,location:'냉장'}}
});
assert(pool.some(x=>x.code==='A-9'&&x.name==='닭고기'),'cube stock code must survive allocation pool');
assert(pool.some(x=>x.code==='M-1'&&x.name==='잡곡무른밥'),'prepared meal code must survive allocation pool');
assert(pool.some(x=>x.code==='R-7'&&x.name==='양파'),'raw stock code must survive allocation pool');

const html=ctx.vShop();
assert(html.includes('1차 식단만들기'),'prep must have a first batch');
assert(html.includes('2차 식단만들기'),'prep must have a second batch');
const parts=html.split('2차 식단만들기');
assert(parts[0].includes('A-9')&&parts[0].includes('A-13')&&parts[0].includes('M-1'),'first batch must show stock numbers to pull');
assert(parts[0].includes('20g×12'),'first batch must show portion count for 20g cubes');
assert(parts[0].includes('100g×12'),'first batch must show prepared-rice portions');
assert(!parts[1].split('밥·반찬을 따로 만들어 냉동하기')[0].includes('A-9'),'second batch must not reuse first-batch stock after it is fully allocated');
assert(parts[1].includes('추가 준비 필요'),'second batch must show shortage after first batch consumes stock');
assert(html.includes('이 끼니에 사용할 재고'),'each meal card must show assigned stock');
assert(html.includes('조리 완료')&&html.includes('실제 재고가 차감'),'prep must explain that allocation is only a plan until completion');
console.log('PASS: v66 splits 1st/2nd prep and shows exact stock numbers without double allocation');
