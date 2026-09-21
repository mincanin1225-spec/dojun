const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const db=new Map(),pushed=[];
const localStorage={
  getItem:k=>db.has(k)?db.get(k):null,
  setItem:(k,v)=>db.set(k,String(v)),
  removeItem:k=>db.delete(k)
};
const ctx={
  console,Date,Math,JSON,Object,Array,Set,Map,Number,String,encodeURIComponent,decodeURIComponent,
  inventory:{},invName:k=>k==='beef'?'소고기':k,inventoryKeys:()=>['beef'],shopChk:{'mg29|2026-09-21':['소고기']},
  persistInventoryLocal(){},pushInventoryItem:k=>pushed.push(k),
  weekCur:'2026-09-21',vShop:()=>'<p>stock</p>',mText:()=>'',render(){},toast(){},close(){},open(){},
  localStorage,
  document:{addEventListener(){},querySelector(){return null}},
  addD:(on,n)=>new Date(new Date(on+'T00:00:00Z').getTime()+86400000*n).toISOString().slice(0,10),
  __mgWeekTarget:'current',__mgStage:'shop'
};
ctx.window=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync('meal-stock-v66.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('meal-workflow-v70.js','utf8'),ctx);

const W=ctx.__MEAL_WORKFLOW_V63;
assert(W&&typeof W.addPurchasedStock==='function','shopping stock helper missing');
assert.equal(W.syncCheckedShoppingStock([{meal:{on:'2026-09-21'},needs:[{name:'소고기',buyG:20}]}]),true,'legacy checked shopping item should migrate into raw stock');
assert.equal(ctx.inventory.beef.qty,20);
assert.equal(ctx.inventory.beef.unit,'g');
assert.equal(ctx.inventory.beef.location,'냉장');
assert(pushed.includes('beef'),'purchased raw stock must sync through existing inventory path');
const receipts=JSON.parse(db.get('dj:shoppingStockReceipts1'));
assert.equal(receipts['2026-09-21|소고기'].g,20);

const snap=W.snapshot();
assert.equal(snap.raw.beef.displayName,'소고기');
const cooked=ctx.MealStockV63.cook(snap,{key:'meal',name:'소고기테스트',g:20,ingredients:[{name:'소고기',g:20}]},{token:'cook-test',count:1,unitG:20,date:'2026-09-21'});
assert.equal(cooked.state.raw.beef.qty,0,'step 3 must be able to consume shopping-completed raw stock');

let undo=W.rollbackPurchasedStock('2026-09-21','소고기');
assert.equal(undo.rolledBack,true);
assert.equal(ctx.inventory.beef.qty,0,'untouched auto-added stock should roll back with purchase completion');

W.addPurchasedStock('2026-09-21','소고기',20);
ctx.inventory.beef.qty=10;
ctx.inventory.beef.updatedAt+=1;
undo=W.rollbackPurchasedStock('2026-09-21','소고기');
assert.equal(undo.rolledBack,false,'used or manually changed stock must not be silently removed');
assert.equal(ctx.inventory.beef.qty,10);

const flow=fs.readFileSync('meal-workflow-v70.js','utf8');
assert(flow.includes('구매완료 체크 시 표시된 구매량이 원재료 재고에 자동 반영'),'shopping UI must explain automatic stock-in');
assert(flow.includes('data-v63-shopg'),'shopping rows must carry the purchase grams into the stock-in action');
assert(flow.includes('batchShoppingTotals'),'completed shopping rows must remain visible after stock-in recalculates shortages');
assert(flow.includes('if(syncCheckedShoppingStock(p))p=plan()'),'existing completed checks must migrate into raw stock automatically');
console.log('PASS: shopping completion becomes raw stock and step 3 can consume it safely');
