const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');

const shell=fs.readFileSync('legacy-v70.html','utf8');
const safe=fs.readFileSync('legacy-ppeuni-v58-safe.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');

assert(shell.includes('v70 ppeuni-only policy: never synthesize calendar meals'),'monthly auto generator must be disabled');
assert(shell.includes('function genMonth(y,mo,variant,prefs=null){'),'genMonth must still exist for stored-data compatibility');
assert(shell.includes('return {};\n}\nconst isSimple'),'genMonth must return an empty plan');
assert(safe.includes("return '';\n  };\n  root.mText=mText"),'unverified dates must not fall back to generated meal text');
assert(safe.includes('mObj=function(){return null}'),'structured generated meal objects must be suppressed');
assert(safe.includes('if(!e)continue'),'shopping/prep week list must skip non-Ppeuni days instead of using auto menus');
assert(!safe.includes('return oldWeek(start,count)'),'week planning must never fall back to synthetic meals');
assert(safe.includes('앱에서 임의 식단을 자동 생성하지 않습니다.'),'out-of-range dates must explain the blank state');
assert(safe.includes("policy:'ppeuni_only'"),'runtime schedule policy must be explicit');

const docEvents={};
const ctx={
  console,Date,Math,JSON,Object,Array,Set,Map,Number,String,
  PpeuniVerifiedV49:{
    birth:'2025-12-05',minD:282,maxD:373,source:'test',verified:true,
    byD:{282:{stage:'late',meals:[{base:'잡곡무른밥',t:'소고기 양배추'},{base:'',t:''},{base:'',t:''}]}}
  },
  months:{},mText:()=> 'AUTO-GENERATED',mObj:()=>({auto:true}),sheetDay(){},weekList:()=>({AUTO:{g:999}}),
  captureMeal(){},render(){},open(){},close(){},toast(){},saveM:async()=>{},saveFeedbackFields:()=>true,
  document:{addEventListener:(k,f)=>(docEvents[k]??=[]).push(f)},
  addD:(s,n)=>{const d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)},
  P:s=>new Date(s+'T00:00:00Z'),fixM:x=>x,mk:s=>s.slice(0,7),isDel:()=>false,
  esc:s=>String(s),WD:'일월화수목금토',lg:()=>({}),stage:()=>({label:'후기'}),ageTxt:()=>'',REACTIONS:[],
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(safe,ctx);

assert.equal(ctx.mText('2026-09-12',0),'잡곡무른밥 · 소고기 · 양배추','verified Ppeuni day must remain visible');
assert.equal(ctx.mText('2028-01-01',0),'','2028 must not show synthetic meals');
assert.equal(ctx.mObj('2028-01-01',0),null,'2028 must not expose cached synthetic meal objects');
assert.deepEqual(JSON.parse(JSON.stringify(ctx.weekList('2028-01-03',7))),{},'future shopping/prep must be empty outside Ppeuni source range');

assert(index.includes('legacy-ppeuni-v58-safe.js?v=20260919-v58&r=20260922-v70-coreflowfix2'),'Ppeuni-only patch must load with a fresh cache key');
assert(index.includes("const RELEASE='20260922-v70-coreflowfix2'"),'release marker must refresh');
assert(sw.includes("const CACHE='dojun-pwa-v70-coreflowfix2'"),'PWA cache must refresh');
assert(sw.includes("'/legacy-ppeuni-v58-safe.js'"),'Ppeuni policy script must be network-first');

console.log('PASS: only verified Ppeuni schedules survive; 2028 auto menus are suppressed');
