const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const data=fs.readFileSync('src/ppeuni-verified-v49.js','utf8');
const patch=fs.readFileSync('legacy-ppeuni-v58-safe.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const mg35=fs.readFileSync('legacy-management-v35.js','utf8');
new Function(data); new Function(patch);

assert(index.includes("v58-ppeuni-data-script"),'verified data script must load');
assert(index.includes("v58-ppeuni-safe-script"),'safe layer must load');
assert(index.indexOf('v58-ppeuni-data-script')<index.indexOf('v58-ppeuni-safe-script'),'data must load before safe layer');
assert(index.includes('ak.onerror=loadHealth')&&index.includes('al.onerror=loadHealth'),'Ppeuni failure must not block the rest of the app');
assert(!patch.includes('MutationObserver'),'safe layer must not install DOM mutation observers');
assert(!patch.includes('mObj=function'),'safe layer must not replace the core structured meal object');
assert(mg35.includes('__PPEUNI_SCHEDULE_V58'),'management must suppress generated rice only on verified Ppeuni dates');
assert(mg35.includes('unitMismatch'),'count-only stock must not be treated as precise gram stock');

const ctx={
  console,
  globalThis:null,
  window:null,
  P:s=>new Date(s+'T00:00:00Z'),
  addD:(s,n)=>{const a=s.split('-').map(Number),d=new Date(Date.UTC(a[0],a[1]-1,a[2]+n));return d.toISOString().slice(0,10)},
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

assert.equal(ctx.__PPEUNI_SCHEDULE_V58.dplus('2026-09-21'),291,'2026-09-21 must be D+291');
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

const core=fs.readFileSync('legacy-v24.html','utf8');
const v36=fs.readFileSync('legacy-outing-v36.js','utf8');
const v41=fs.readFileSync('legacy-outing-v41-no-embedded-map.js','utf8');
const v47=fs.readFileSync('legacy-ui-v47.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
assert(core.includes("name:'도준이키우기',version:'v63'"),'core release metadata must be canonical');
assert(core.includes("const APP_VER=window.__DOJUN_RELEASE.version"),'settings must read canonical version');
assert(!v36.includes("APP_NAME='도준이육성게임'"),'outing must not rename the app to 육성게임');
assert(v36.includes("__DOJUN_RELEASE?.name"),'outing must use canonical app name');
assert(v41.includes("__DOJUN_RELEASE?.version")&&v47.includes("__DOJUN_RELEASE?.version"),'version patches must use one canonical release');
assert(sw.includes("const CACHE='dojun-pwa-v63"),'v58 PWA cache missing');
assert(sw.includes("req.mode==='navigate'"),'only navigation should force fresh network');
assert(!sw.includes("fetch(event.request,{cache:'no-store'})"),'all assets must not be no-store');
console.log('PASS: v61 canonical brand/version, Ppeuni D+291, stock safety and fast PWA cache');
