const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const db=new Map(),events={},messages=[];let deleted=false,override=null;
const ctx={console,Date,Math,JSON,Map,Set,Number,String,encodeURIComponent,decodeURIComponent,inventory:{},invName:k=>k,weekCur:'2026-09-21',vShop:()=>'<p>stock</p>',weekList:()=>({}),sheetBatch(){},sheetDay(){},sheetOpen:false,close(){},render(){},toast:m=>messages.push(m),confirm:()=>true,open(){},FormData:class{constructor(f){this.f=f}get(k){return this.f.values[k]}getAll(k){const v=this.f.values[k];return Array.isArray(v)?v:(v==null?[]:[v])}},
 localStorage:{getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)},
 document:{addEventListener:(k,f)=>(events[k]??=[]).push(f),querySelector:s=>String(s).includes('[data-offered=')?{value:'120'}:null},
 addEventListener:(k,f)=>(events['window:'+k]??=[]).push(f),
 addD:(on,n)=>new Date(new Date(on+'T00:00:00Z').getTime()+86400000*n).toISOString().slice(0,10),
 mText:(on,i)=>override||'잡곡무른밥 · 양배추',isDel:()=>deleted,
 __mgStage:'prep',__mgWeekTarget:'current',__PPEUNI_SCHEDULE_V58:{entry:()=>({stage:'late',meals:Array.from({length:3},()=>({base:'잡곡무른밥',t:'양배추'}))})}};
ctx.window=ctx;vm.createContext(ctx);
for(const f of ['meal-stock-v66.js','meal-workflow-v70.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);
const K={prep:'dj:preparedMealInventory1',cube:'dj:cubeInventory2'};
db.set(K.prep,JSON.stringify([{id:'base',name:'잡곡무른죽',unitG:50,remainingCount:10}]));db.set(K.cube,JSON.stringify([{id:'veg',ingredient:'양배추',unitG:30,remainingCount:10}]));
const html=ctx.vShop();assert(html.includes('3단계 · 만들기'));assert(html.includes('data-v71-makecheck'));assert(!html.includes('분량·레시피'));
function submit(kind,key,values){const f={values,matches:()=>true,getAttribute:k=>k===kind?key:null,hasAttribute:k=>k===kind};events.submit.forEach(fn=>fn({target:f,preventDefault(){},stopImmediatePropagation(){}}))}
function feed(key){const el={hasAttribute:k=>k==='data-v63-feed',getAttribute:k=>k==='data-v63-feed'?key:null};const target={closest:sel=>String(sel).includes('data-v63-feed')?el:null};events.click.forEach(fn=>fn({target,preventDefault(){},stopImmediatePropagation(){}}))}
const values={token:'old-whole',unitG:'120',count:'1',date:'2026-09-21'};
submit('data-v63-form','2026-09-21|0',values);
assert.equal(JSON.parse(db.get(K.prep)).length,1,'legacy whole-meal submit must not create stock');
assert(messages.at(-1).includes('한 끼 전체 메뉴'),'legacy whole-meal path must explain why it is blocked');
feed('2026-09-21|0');assert(JSON.parse(db.get('dj:mealFeedsV63'))['2026-09-21|0']);feed('2026-09-21|0');assert(!JSON.parse(db.get('dj:mealFeedsV63'))['2026-09-21|0']);
override='내가 수정한 식단';assert.equal(ctx.__MEAL_WORKFLOW_V63.model('2026-09-21',0).name,override);assert.equal(ctx.__MEAL_WORKFLOW_V63.model('2026-09-21',0).g,null);
submit('data-v63-recipe','2026-09-21|0',{yieldG:'101',ingredientName:['잡곡무른밥','김'],ingredientG:['100','1'],steps:'사용자가 확인한 조리법'});
assert.equal(ctx.__MEAL_WORKFLOW_V63.model('2026-09-21',0).ingredients[1].g,1);
vm.runInContext(fs.readFileSync('meal-workflow-v70.js','utf8'),ctx);assert.equal(ctx.__MEAL_WORKFLOW_V63.model('2026-09-21',0).ingredients[1].g,1);
deleted=true;assert.equal(ctx.__MEAL_WORKFLOW_V63.meals('2026-09-21',7).length,0);
console.log('PASS UI integration: simple make, whole-meal block, feed/undo, edited/deleted menus, recipe persistence');
