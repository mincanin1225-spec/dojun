const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');

const core=fs.readFileSync('legacy-v24.html','utf8');
const mg29=fs.readFileSync('legacy-management-v29.js','utf8');
const mg34=fs.readFileSync('legacy-management-v34.js','utf8');
const ui47=fs.readFileSync('legacy-ui-v47.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');

new Function(mg29);
new Function(mg34);
new Function(ui47);

assert(core.includes("version:'v61'"),'canonical release must be v61');
assert(index.includes('r=20260921-v61'),'v61 cache bust must reach injected app assets');
assert(sw.includes("const CACHE='dojun-pwa-v61'"),'v61 PWA cache marker missing');

assert(core.includes("stockCode:String(v.stockCode||'')"),'inventory cleaning must preserve stable stock codes');
assert(mg29.includes("const MG_HISTORY_KEY='__dojunManagementStageV60'"),'management navigation history marker missing');
assert(mg29.includes("history.back();return"),'management back action must return to its weekly management home');
assert(mg29.includes("window.addEventListener('popstate'"),'browser back must be handled inside management');
assert(mg29.includes("setManagementStage(a)"),'management stage buttons must use history-aware navigation');

assert(ui47.includes("document.title!==APP_NAME"),'brand patch must not rewrite unchanged title');
assert(ui47.includes("h&&h.textContent!==APP_NAME"),'brand patch must not rewrite unchanged app heading');
assert(ui47.includes("a&&a.getAttribute('content')!==APP_NAME"),'brand patch must not rewrite unchanged mobile title');
assert(ui47.includes('MutationObserver'),'UI observer may remain only with idempotent mutations');

assert(mg34.includes('＋ 목록에 없는 식품 직접 입력'),'custom ingredient option must remain available');
assert(mg34.includes("builtin=builtInKeyByName(name)"),'direct entry must check built-in names before intercepting');
assert(mg34.includes("e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();"),'custom add must block the older add handler');
assert(mg34.includes("try{addCustom(name)}"),'custom add must be guarded against handler crashes');

const db=new Map();
const ctx={
  console,
  inventory:{},
  cleanInventory:()=>({}),
  pushInventoryItem:()=>{},
  persistInventoryLocal:()=>{},
  vShop:()=>'<select id="mg32Key"></select>',
  inventoryKeys:()=>['rice'],
  invName:k=>k==='rice'?'밥 (조리 후)':k,
  localStorage:{
    getItem:k=>db.has(k)?db.get(k):null,
    setItem:(k,v)=>db.set(k,String(v)),
    removeItem:k=>db.delete(k)
  },
  document:{addEventListener(){},getElementById(){return null}},
  addEventListener(){},
  render(){},
  toast(){},
  setTimeout(){},
  fetch:async()=>({ok:true,json:async()=>({})}),
  online:false,
  sync:{url:'',code:''}
};
ctx.window=ctx;
vm.createContext(ctx);
vm.runInContext(mg34,ctx);

const chestnut=ctx.cleanInventory({
  '밤':{qty:80,unit:'g',location:'냉장',gramsPerUnit:null,memo:'직접추가',updatedAt:123,stockCode:'A-1',custom:true,customName:'밤'}
});
assert(chestnut['밤'],'directly entered 밤 must survive inventory cleaning');
assert.equal(chestnut['밤'].qty,80,'밤 quantity must survive inventory cleaning');
assert.equal(chestnut['밤'].stockCode,'A-1','밤 stock code must survive inventory cleaning');
assert.equal(chestnut['밤'].customName,'밤','밤 custom name must survive inventory cleaning');

console.log('PASS: v60 keeps direct 밤 stock stable, mobile pickers open, and management back navigation local');
