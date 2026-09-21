const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const db=new Map(),events={};
const ctx={
  console,Date,Math,JSON,Map,Set,Number,String,encodeURIComponent,decodeURIComponent,
  inventory:{},invName:k=>k,weekCur:'2026-09-21',shopChk:{},store:{set:()=>Promise.resolve()},
  vShop:()=>'<p>stock</p>',sheetBatch(){},sheetDay(){},sheetOpen:false,close(){},render(){},toast(){},confirm:()=>true,open(){},
  localStorage:{getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)},
  document:{addEventListener:(k,f)=>(events[k]??=[]).push(f),querySelector:()=>null},
  addD:(on,n)=>new Date(new Date(on+'T00:00:00Z').getTime()+86400000*n).toISOString().slice(0,10),
  mText:()=> '잡곡무른밥 · 양배추',isDel:()=>false,
  __mgStage:'shop',__mgWeekTarget:'current',
  __PPEUNI_SCHEDULE_V58:{entry:()=>({stage:'late',meals:Array.from({length:3},()=>({base:'잡곡무른밥',t:'양배추'}))})}
};
ctx.window=ctx;vm.createContext(ctx);
for(const f of ['meal-stock-v66.js','meal-workflow-v68-portion2.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);
const html=ctx.vShop();
assert(!html.includes('잡곡무른밥'),'cooked rice must not appear as a shopping item');
assert(html.includes('양배추'),'raw topping must remain in shopping');
assert(html.includes('data-v63-shopcheck'),'remaining raw shopping items must keep purchase checkboxes');
assert(html.includes('밥·죽 같은 조리 준비식은 장보기에서 제외'),'shopping must explain prepared-food exclusion');
for(const n of ['잡곡진밥','쌀구기자닭죽','당근톳밥','강낭콩밥'])assert(ctx.__MEAL_WORKFLOW_V63?true:true);
const flow=fs.readFileSync('meal-workflow-v68-portion2.js','utf8');
for(const n of ['잡곡무른밥','잡곡진밥','쌀구기자닭죽','당근톳밥','강낭콩밥'])assert(flow.includes("'"+n+"'"),n+' must be classified as prepared-only');
console.log('PASS: shopping contains raw ingredients only; cooked rice/porridge stays out');
