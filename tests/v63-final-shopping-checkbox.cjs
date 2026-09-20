const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const db=new Map(),events={},writes=[];
const ctx={
  console,Date,Math,JSON,Map,Set,Number,String,encodeURIComponent,decodeURIComponent,
  inventory:{},invName:k=>k,weekCur:'2026-09-21',shopChk:{},
  store:{set:(k,v)=>{writes.push([k,JSON.parse(JSON.stringify(v))]);return Promise.resolve()}},
  vShop:()=>'<p>stock</p>',sheetBatch(){},sheetDay(){},sheetOpen:false,close(){},
  render(){},toast(){},confirm:()=>true,open(){},
  localStorage:{getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)},
  document:{addEventListener:(k,f)=>(events[k]??=[]).push(f),querySelector:()=>null},
  addD:(on,n)=>new Date(new Date(on+'T00:00:00Z').getTime()+86400000*n).toISOString().slice(0,10),
  mText:()=> '잡곡무른밥 · 양배추',isDel:()=>false,
  __mgStage:'shop',__mgWeekTarget:'current',
  __PPEUNI_SCHEDULE_V58:{entry:()=>({stage:'late',meals:Array.from({length:3},()=>({base:'잡곡무른밥',t:'양배추'}))})}
};
ctx.window=ctx;vm.createContext(ctx);
for(const f of ['meal-stock-v66.js','meal-workflow-v66.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);

let html=ctx.vShop();
assert(html.includes('data-v63-shopcheck'),'final v63 shopping renderer must show item checkboxes');
assert(html.includes('data-v63-shopall'),'final v63 shopping renderer must show batch completion control');
assert(html.includes('장보기 미완료 0/'),'initial shopping state must be visible');

const m=html.match(/data-v63-shopcheck="([^"]+)"/);assert(m,'first shopping checkbox not found');
const itemValue=m[1];
const item={
  hasAttribute:k=>k==='data-v63-shopcheck',
  getAttribute:k=>k==='data-v63-shopcheck'?itemValue:null
};
for(const fn of events.click||[])fn({target:{closest:sel=>sel.includes('data-v63-shopcheck')?item:null},preventDefault(){},stopImmediatePropagation(){}});
html=ctx.vShop();
assert(html.includes('shop on'),'checked shopping item must render as checked');
assert(html.includes('구매완료'),'checked shopping item must show 구매완료');
assert(writes.some(([k])=>k==='shop2'),'shopping checkbox must persist through shop2');

const a=html.match(/data-v63-shopall="([^"]+)"/);assert(a,'batch completion button not found');
const allValue=a[1];
const all={
  hasAttribute:k=>k==='data-v63-shopall',
  getAttribute:k=>k==='data-v63-shopall'?allValue:null
};
for(const fn of events.click||[])fn({target:{closest:sel=>sel.includes('data-v63-shopall')?all:null},preventDefault(){},stopImmediatePropagation(){}});
html=ctx.vShop();
assert(html.includes('장보기 완료'),'whole-batch purchase completion must be visible');
assert(html.includes('완료 취소'),'completed batch must offer undo');
console.log('PASS: final v63 shopping UI shows and persists item/batch completion checks');
