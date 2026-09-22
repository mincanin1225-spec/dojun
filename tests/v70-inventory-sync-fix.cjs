const fs=require('fs'),assert=require('assert/strict');
const stock=fs.readFileSync('meal-stock-v66.js','utf8');
const mg=fs.readFileSync('legacy-management-v33.js','utf8');
const shell=fs.readFileSync('legacy-v70.html','utf8');
const flow=fs.readFileSync('meal-workflow-v70.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');

assert(mg.includes('function cleanG(v)'),'inventory UI must format grams consistently');
assert(mg.includes('function baseStockCode(v)')&&mg.includes('잔량-'), 'residual internal ids must be hidden from users');
assert(mg.includes("r.partMap[k]=(r.partMap[k]||0)+count"),'same portion sizes must be aggregated in the stock summary');
assert(mg.includes("${cleanG(r.g)}g"),'total stock grams must be rounded for display instead of ceil');
assert(mg.includes("${cleanG(b.unitG)}g = ${cleanG(total)}g"),'cube rows must hide floating-point artifacts');
assert(!mg.includes("${Math.ceil(r.g)}g"),'inventory totals must not round 300.00003g up to 301g');

assert(shell.includes('const SYNC_SCHEMA=2;'),'family sharing must have an explicit data schema version');
for(const k of ['cubeInventory2','preparedMealInventory1','mealFeedsV63','mealOpsV63','mealRecipesV63','shoppingStockReceipts1']){
  assert(shell.includes("'"+k+"'"),k+' must be included in family sharing');
}
assert(shell.includes('syncVersionMismatch=true'),'schema mismatch must stop applying incompatible family data');
assert(shell.includes('동기화 데이터 버전이 달라 중지했어요'),'settings must explain a sync schema mismatch');

assert(flow.includes('const MEAL_SYNC_KEYS=new Set'),'meal workflow must declare synced state keys');
assert(flow.includes("typeof root.syncPush==='function'"),'meal workflow writes must forward to family sync when connected');

assert(index.includes('legacy-management-v33.js?v=20260916-v40&r=20260922-v70-coreflowfix2'),'inventory renderer must use a fresh release URL');
assert(index.includes("const RELEASE='20260922-v70-feedfix2'"),'PWA release marker must refresh');
assert(sw.includes("const CACHE='dojun-pwa-v70-feedfix2'"),'PWA cache marker must refresh');
assert(sw.includes("'/legacy-management-v33.js'"),'active inventory renderer must be network-first');
console.log('PASS: inventory floating display and family sync schema guard are covered');