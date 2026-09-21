const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const db=new Map(),events={};
let limit=5;
db.set('dj:preparedMealInventory1',JSON.stringify([
  {id:'old-rice',name:'잡곡무른밥',unitG:50,remainingCount:0,madeDate:'2026-09-01',mealCode:'M-old'}
]));
const ctx={
  console,Date,Math,JSON,Map,Set,Number,String,encodeURIComponent,decodeURIComponent,
  inventory:{},invName:k=>k,weekCur:'2026-09-21',shopChk:{},
  store:{set:(k,v)=>{db.set('dj:'+k,JSON.stringify(v));return Promise.resolve()}},
  vShop:()=>'<p>stock</p>',sheetBatch(){},sheetDay(){},sheetOpen:false,close(){},render(){},toast(){},confirm:()=>true,open(){},
  localStorage:{getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)},
  document:{addEventListener:(k,f)=>(events[k]??=[]).push(f),querySelector:()=>null},
  addD:(on,n)=>new Date(new Date(on+'T00:00:00Z').getTime()+86400000*n).toISOString().slice(0,10),
  isDel:()=>false,
  mText:(on,slot)=>{
    const d=Math.round((new Date(on+'T00:00:00Z')-new Date('2026-09-21T00:00:00Z'))/86400000),idx=d*3+slot;
    return idx<limit?'잡곡무른밥 · 닭고기':'';
  },
  __mgStage:'prep',__mgWeekTarget:'current',
  __PPEUNI_SCHEDULE_V58:{entry:()=>({stage:'late',meals:Array.from({length:3},()=>({base:'잡곡무른밥',t:'닭고기'}))})}
};
ctx.window=ctx;vm.createContext(ctx);
for(const f of ['meal-stock-v66.js','meal-workflow-v67-summary2.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);

let html=ctx.vShop();
assert(html.includes('1차 식단만들기'),'first batch must exist');
assert(html.includes('준비할 음식'),'prep summary must exist');
assert(html.includes('잡곡무른밥'),'missing prepared food must become a prep task');
assert(html.includes('50g × 10개'),'five 100g meals with saved 50g portion size must require ten portions');
assert(html.includes('총 5끼 필요 · 500g'),'prep task must show total meal count and grams');
assert(html.includes('data-v67-prepdone'),'prep task must have a completion checkbox');
assert(html.includes('만들기 0/1'),'batch status must show incomplete count');

const m=html.match(/data-v67-prepdone="([^"]+)"/);assert(m,'prep task key missing');
const item={
  hasAttribute:k=>k==='data-v67-prepdone',
  getAttribute:k=>k==='data-v67-prepdone'?m[1]:null
};
for(const fn of events.click||[])fn({target:{closest:sel=>sel.includes('data-v67-prepdone')?item:null},preventDefault(){},stopImmediatePropagation(){}});
html=ctx.vShop();
assert(html.includes('만들기 완료'),'completed task must show completion state');
assert(db.has('dj:prepChecklist2'),'completion checklist must persist');
const saved=JSON.parse(db.get('dj:prepChecklist2'));assert(Object.values(saved).some(x=>x.done),'completion value must be stored');

limit=4;
html=ctx.vShop();
assert(html.includes('총 4끼 필요 · 400g'),'changed plan must create a changed prep task');
const firstTask=html.match(/data-v67-prepdone="([^"]+)"/)?.[1];
assert(firstTask&&decodeURIComponent(firstTask)!==decodeURIComponent(m[1]),'changed required quantity must use a new task identity');
assert(html.includes('만들기 0/1'),'old completion must not silently complete changed plan');

const shell=fs.readFileSync('legacy-v67.html','utf8');
assert(shell.includes("k==='prepChecklist2'"),'prep checklist must be family-syncable');
assert(shell.includes("'prepChecklist2'"),'family sync push list must include prep checklist');
console.log('PASS: v67 prep tasks show portions/counts, persist completion, reset on plan changes, and sync');
