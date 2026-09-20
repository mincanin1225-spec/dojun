const vm=require('vm'),fs=require('fs'),assert=require('assert/strict');
const html=fs.readFileSync('legacy-v24.html','utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^boot\(\);/m,'');
const mg33=fs.readFileSync('legacy-management-v33.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');

assert(html.includes("version:'v66'"),'canonical release must be v61');
assert(html.includes('resetInventoryV59IfNeeded'),'one-time inventory reset helper missing');
assert(html.includes('inventoryTombstones1'),'inventory delete tombstones missing');
assert(html.includes('data-a="invdelete:'),'inventory edit sheet needs a delete button');
assert(mg33.includes('data-a="invdelete:'),'stock list needs a raw inventory delete button');
assert(mg33.includes('data-v59-cubedel'),'cube inventory needs a delete button');
assert(index.includes('r=20260921-v63'),'v61 cache bust missing');
assert(sw.includes("const CACHE='dojun-pwa-v"),'v61 PWA cache missing');

const db=new Map();
const elements={};
const el=()=>({innerHTML:'',style:{},classList:{add(){},remove(){},contains(){return false}},addEventListener(){},querySelector(){return null},querySelectorAll(){return []}});
const localStorage={
 getItem:k=>db.has(k)?db.get(k):null,
 setItem:(k,v)=>db.set(k,String(v)),
 removeItem:k=>db.delete(k),
 key:i=>[...db.keys()][i]||null,
 get length(){return db.size}
};
const ctx={
 console,Date,Math,JSON,Object,Array,Set,Map,Number,String,Uint8Array,Promise,
 localStorage,
 document:{getElementById:k=>elements[k]||(elements[k]=el()),addEventListener(){},querySelector(){return null},body:el()},
 window:{},
 addEventListener(){},setTimeout(){},clearTimeout(){},setInterval(){},
 history:{replaceState(){},pushState(){}},
 crypto:require('crypto').webcrypto,
 confirm:()=>true,
 fetch:async()=>({ok:true,json:async()=>({})}),
 EventSource:function(){this.addEventListener=()=>{};this.close=()=>{}},
 navigator:{},
 location:{pathname:'/index.html'}
};
vm.createContext(ctx);
vm.runInContext(source,ctx);

(async()=>{
  db.set('dj:inventory2',JSON.stringify({beef:{qty:180,unit:'g',location:'냉동',updatedAt:1}}));
  db.set('dj:cubeInventory2',JSON.stringify([{ingredient:'새우',unitG:25,remainingCount:6}]));
  db.set('dj:customInventory1',JSON.stringify({'테스트재료':{qty:1,unit:'개',custom:true}}));

  const raw={beef:{qty:180,unit:'g',location:'냉동',updatedAt:1}};
  const cleared=await vm.runInContext('(async r=>resetInventoryV59IfNeeded(r))',ctx)(raw);
  assert.deepEqual(Object.keys(cleared),[],'first v59 load must start with empty inventory');
  assert.equal(db.get('dj:inventory2'),'{}','raw inventory must be cleared');
  assert.equal(db.get('dj:cubeInventory2'),'[]','cube example inventory must be cleared');
  assert.equal(db.get('dj:customInventory1'),'{}','custom example inventory must be cleared');
  assert.equal(db.get('dj:inventoryResetV59'),'1','reset must be one-time');
  assert.equal(db.get('dj:inventoryResetRemotePendingV59'),'1','remote reset must stay pending until family sync is reachable');

  const second=await vm.runInContext('(async r=>resetInventoryV59IfNeeded(r))',ctx)({carrot:{qty:20,unit:'g',location:'냉장',updatedAt:2}});
  assert(second.carrot&&second.carrot.qty===20,'later real inventory must not be cleared again');

  vm.runInContext("inventory={beef:{qty:100,unit:'g',location:'냉동',updatedAt:5}}",ctx);
  vm.runInContext("mergeInventory({beef:{deleted:true,updatedAt:10}})",ctx);
  assert.equal(vm.runInContext("inventory.beef",ctx),undefined,'remote tombstone must remove deleted inventory');

  vm.runInContext("inventory={carrot:{qty:30,unit:'g',location:'냉장',updatedAt:11}}; close=()=>{}; render=()=>{};",ctx);
  vm.runInContext("deleteInventoryItem('carrot')",ctx);
  assert.equal(vm.runInContext("inventory.carrot",ctx),undefined,'local delete must remove inventory');
  assert(vm.runInContext("Number(inventoryTombstones.carrot)>0",ctx),'local delete must create a tombstone');

  console.log('PASS: v59 resets example stock once and supports persistent raw/cube deletion');
})().catch(e=>{console.error(e);process.exit(1)});
