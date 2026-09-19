const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const data=fs.readFileSync('src/ppeuni-verified-v49.js','utf8');
const patch=fs.readFileSync('legacy-ppeuni-v57-safe.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const mg35=fs.readFileSync('legacy-management-v35.js','utf8');
new Function(data); new Function(patch);

assert(index.includes("v57-ppeuni-data-script"),'verified data script must load');
assert(index.includes("v57-ppeuni-safe-script"),'safe layer must load');
assert(index.indexOf('v57-ppeuni-data-script')<index.indexOf('v57-ppeuni-safe-script'),'data must load before safe layer');
assert(index.includes('ak.onerror=loadHealth')&&index.includes('al.onerror=loadHealth'),'Ppeuni failure must not block the rest of the app');
assert(!patch.includes('MutationObserver'),'safe layer must not install DOM mutation observers');
assert(!patch.includes('mObj=function'),'safe layer must not replace the core structured meal object');
assert(mg35.includes('__ppeuniSafeV57'),'management must suppress generated rice only on verified Ppeuni dates');
assert(mg35.includes('unitMismatch'),'count-only stock must not be treated as precise gram stock');

const ctx={
  console,
  globalThis:null,
  window:null,
  P:s=>new Date(s+'T00:00:00+09:00'),
  addD:(s,n)=>{const d=new Date(s+'T00:00:00+09:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)},
  mText:()=> 'OLD',
  sheetDay:()=>{},
  weekList:()=>({OLD:{c:'v',g:1,n:1}}),
  captureMeal:()=>{},
  vNut:()=> 'OLDNUT',
  sheetBatch:()=>{},
  fixM:()=>({d:{ov:{}}}),
  months:{},
  mk:()=> '2026-09',
  isDel:()=>false,
  stage:()=>({label:'후기',meals:3,milk:'500~600ml'}),
  lg:()=>({}),
  REACTIONS:[],
  WD:['일','월','화','수','목','금','토'],
  esc:s=>String(s),
  ageTxt:()=> '9개월',
  open:()=>{},
  render:()=>{},
  document:{addEventListener:()=>{}},
  saveFeedbackFields:()=>true,
  saveM:async()=>{},
  close:()=>{},
  toast:()=>{},
  weekCur:'2026-09-21'
};
ctx.globalThis=ctx;ctx.window=ctx;
vm.createContext(ctx);
vm.runInContext(data,ctx);
vm.runInContext(patch,ctx);

assert.equal(ctx.__ppeuniSafeV57.dplus('2026-09-21'),291,'2026-09-21 must be D+291');
assert.equal(ctx.mText('2026-09-21',0),'잡곡무른밥 · 소고기 · 파프리카 · 비타민 · 양배추');
assert.equal(ctx.mText('2026-09-21',1),'잡곡무른밥 · 닭고기 · 밤 · 양파 · 브로콜리');
assert.equal(ctx.mText('2026-09-21',2),'잡곡무른밥 · 생선 · 토마토 · 적채 · 단호박');

const w=ctx.weekList('2026-09-21',1);
assert.equal(w['밥 (조리 후)'].g,300,'three meals need 300g cooked rice');
for(const k of ['소고기','파프리카','비타민채','양배추','닭고기','밤','양파','브로콜리','생선','토마토','적채','단호박']){
  assert.equal(w[k].g,20,k+' must be 20g for D+291');
}
assert(!w.OLD,'verified day must not use generated old meal requirements');

console.log('PASS: v57 shows D+291 verified meals and exact late-stage stock without touching mObj');
