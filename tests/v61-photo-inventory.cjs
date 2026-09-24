const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');

const patch=fs.readFileSync('legacy-inventory-v61-photo.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const core=fs.readFileSync('legacy-v24.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
new Function(patch);

assert(core.includes("version:'v69'"),'canonical release must be v61');
assert(index.includes("v61-photo-inventory-script"),'v61 photo inventory loader missing');
assert(index.indexOf('v35-management-script')<index.indexOf('v61-photo-inventory-script'),'photo inventory must load after management v35');
assert(index.includes('legacy-inventory-v61-photo.js?v=20260921-v61'),'v61 photo inventory cache key missing');
assert(index.includes('legacy-inventory-v61-photo.js?v=20260921-v61&r=20260924-v80-simpleprep1'),'v61 photo inventory release marker missing');
assert(sw.includes("const CACHE='dojun-pwa-v"),'v61 service worker cache missing');

for(const literal of [
  "{ingredient:'청경채',madeDate:'2026-09-09',unitG:10,count:3}",
  "{ingredient:'콜리플라워',madeDate:'2026-09-12',unitG:10,count:12}",
  "{ingredient:'당근',madeDate:'2026-09-12',unitG:10,count:8}",
  "{ingredient:'애호박',madeDate:'2026-09-12',unitG:20,count:7}",
  "{ingredient:'양파',madeDate:'2026-09-12',unitG:20,count:4}",
  "{ingredient:'고구마',madeDate:'2026-09-13',unitG:10,count:14}",
  "{ingredient:'무',madeDate:'2026-09-19',unitG:20,count:3}",
  "{ingredient:'밤',madeDate:'2026-09-19',unitG:20,count:4}",
  "{ingredient:'닭고기',madeDate:'2026-09-19',unitG:20,count:12}",
  "{ingredient:'밥 (조리 후)',madeDate:'2026-09-19',unitG:40,count:2}",
  "{ingredient:'파프리카',madeDate:'2026-09-20',unitG:10,count:5}",
  "{ingredient:'파프리카',madeDate:'2026-09-20',unitG:60,count:1}",
  "{ingredient:'브로콜리',madeDate:'2026-09-22',unitG:20,count:11}",
  "{ingredient:'적채',madeDate:'2026-09-22',unitG:20,count:9}",
  "{ingredient:'양배추',madeDate:'2026-09-22',unitG:30,count:10}",
  "{ingredient:'토마토',madeDate:'2026-09-22',unitG:10,count:11}"
])assert(patch.includes(literal),'confirmed frozen lot missing: '+literal);

assert(patch.includes("name:'잡곡무른죽',madeDate:'2026-09-22',unitG:50,originalCount:10,remainingCount:10"),'prepared meal stock must be separate');
assert(patch.includes("const PREP_KEY='dj:preparedMealInventory1'"),'prepared meal storage key missing');
assert(patch.includes('원재료와 분리'),'prepared meals must be visibly separated from ingredient stock');

function run(db,initialInventory){
  const listeners={};
  const ctx={
    console,Date,Math,JSON,Object,Array,Set,Map,Number,String,Promise,
    inventory:initialInventory,
    inventoryTombstones:{},
    saveInventoryTombstones(){db.set('tombs',JSON.stringify(ctx.inventoryTombstones))},
    pushInventoryDelete(){},
    removeCustomInventoryBackup(){},
    persistInventoryLocal(){db.set('inventory',JSON.stringify(ctx.inventory))},
    syncPush(k,v){const a=JSON.parse(db.get('syncCalls')||'[]');a.push([k,v]);db.set('syncCalls',JSON.stringify(a))},
    vShop:()=>'<div class="sec"><h2>재료 추가</h2></div>',
    localStorage:{
      getItem:k=>db.has(k)?db.get(k):null,
      setItem:(k,v)=>db.set(k,String(v)),
      removeItem:k=>db.delete(k)
    },
    document:{
      addEventListener:(t,fn)=>{listeners[t]=fn},
      querySelectorAll:()=>[]
    },
    render(){},
    toast(){},
    confirm:()=>true,
    setTimeout(fn){fn()},
  };
  ctx.window=ctx;
  vm.createContext(ctx);
  vm.runInContext(patch,ctx);
  return ctx;
}

const db=new Map();
const ctx=run(db,{
  '밤':{qty:4,unit:'개',gramsPerUnit:20,location:'냉동',custom:true,customName:'밤',updatedAt:1,stockCode:'A-1'}
});
const cubes=JSON.parse(db.get('dj:cubeInventory2'));
assert.equal(cubes.length,16,'must import exactly 16 frozen ingredient lots');
assert.equal(new Set(cubes.map(x=>x.stockCode)).size,16,'every imported lot must have its own stock number');
assert(!ctx.inventory['밤'],'old direct-entry 밤 must be retired to avoid double counting');
assert(Number(ctx.inventoryTombstones['밤'])>0,'retired direct-entry 밤 must get a delete tombstone');

const chestnut=cubes.find(x=>x.ingredient==='밤');
assert(chestnut&&chestnut.madeDate==='2026-09-19'&&chestnut.unitG===20&&chestnut.remainingCount===4,'밤 lot mismatch');
const paprika=cubes.filter(x=>x.ingredient==='파프리카');
assert.equal(paprika.length,2,'paprika must preserve two portion sizes');
assert.deepEqual(paprika.map(x=>[x.unitG,x.remainingCount]).sort((a,b)=>a[0]-b[0]),[[10,5],[60,1]],'paprika portions mismatch');
assert(paprika.every(x=>x.madeDate==='2026-09-20'),'paprika date must be 9/20');

const prepared=JSON.parse(db.get('dj:preparedMealInventory1'));
assert.equal(prepared.length,1,'must import one prepared meal stock line');
assert.equal(prepared[0].name,'잡곡무른죽');
assert.equal(prepared[0].unitG,50);
assert.equal(prepared[0].remainingCount,10);
assert.equal(prepared[0].mealCode,'M-1');
assert(!cubes.some(x=>x.ingredient==='잡곡무른죽'),'prepared meal must not be mixed into raw ingredient cubes');


const emptyRemote=new Map([
  ['dj:cubeInventory2','[]'],
  ['dj:preparedMealInventory1','[]']
]);
run(emptyRemote,{});
assert.deepEqual(JSON.parse(emptyRemote.get('dj:cubeInventory2')),[],'an existing empty synced cube array must not be replaced by the old photo seed');
assert.deepEqual(JSON.parse(emptyRemote.get('dj:preparedMealInventory1')),[],'an existing empty synced prepared array must not be replaced by the old photo seed');
assert.equal(emptyRemote.get('dj:photoInventoryImport20260920V61'),'1','existing synced stock keys must retire the old seed on this device');

assert(patch.includes("push('preparedMealInventory1',v)"),'prepared edits must sync to family sharing');
assert(patch.includes("push('cubeInventory2',v)"),'cube edits must sync to family sharing');
assert(patch.includes('!isWholeMeal(x)'),'whole-meal lots must be hidden from prepared stock UI');
assert(patch.includes("replace(/-잔량-\\d+-\\d+$/,'')"),'internal residual code suffix must be hidden');
assert(!patch.includes('Math.ceil((Number(x.unitG)'),'prepared stock grams must not be rounded up');

run(db,{});
assert.equal(JSON.parse(db.get('dj:cubeInventory2')).length,16,'one-time import must not duplicate frozen lots');
assert.equal(JSON.parse(db.get('dj:preparedMealInventory1')).length,1,'one-time import must not duplicate prepared meals');

console.log('PASS: v61 imports confirmed dated frozen stock, 9/20 paprika, and keeps 잡곡무른죽 as prepared meal stock');
