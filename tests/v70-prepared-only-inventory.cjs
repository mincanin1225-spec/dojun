const assert=require('node:assert/strict'),fs=require('fs'),E=require('../meal-stock-v66.js');
const flow=fs.readFileSync('meal-workflow-v70.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');

assert.equal(E.isWholeMealLot({mealKey:'2026-09-21|2',name:'잡곡무른밥 · 생선 · 토마토',source:'meal-prep-v63'}),true);
assert.equal(E.isWholeMealLot({mealKey:'make:2026-09-21|잡곡무른밥',name:'잡곡무른밥',source:'meal-prep-v63'}),false);

const base={prepared:[{id:'p1',name:'잡곡무른밥',unitG:100,remainingCount:2}],cubes:[],raw:{fish:{displayName:'생선',unit:'g',qty:40,location:'냉장'}},ops:{},feeds:{}};
assert.throws(()=>E.cook(base,{key:'2026-09-21|2',name:'잡곡무른밥 · 생선',g:120,ingredients:[{name:'잡곡무른밥',g:100},{name:'생선',g:20}]},{token:'bad',count:1,unitG:120,date:'2026-09-21'}),/한 끼 전체 메뉴/);

const ignored={prepared:[{id:'old',name:'잡곡무른밥 · 생선',mealKey:'2026-09-21|2',source:'meal-prep-v63',legacyWholeMeal:true,unitG:120,remainingCount:1},{id:'rice',name:'잡곡무른밥',unitG:50,remainingCount:4}],cubes:[],raw:{},ops:{},feeds:{}};
const rows=E.pool(ignored);
assert(!rows.some(x=>x.name.includes(' · ')),'legacy whole meal stock must not enter active inventory pool');
assert.equal(rows.find(x=>x.name==='잡곡무른밥').g,200);

assert(flow.includes('function cleanupLegacyWholeMeals()'),'legacy whole-meal migration missing');
assert(flow.includes('E.undoCook(next,token)'),'untouched legacy whole meals must restore their source stock');
assert(flow.includes('legacyWholeMeal=true'),'unrestorable historical whole meals must be quarantined from active stock');
assert(flow.includes('!E.isWholeMealLot(x)'),'prepared summaries must exclude whole-meal inventory');

assert(index.includes('meal-stock-v66.js?r=20260924-v80-makelabel1'));
assert(index.includes('meal-workflow-v70.js?r=20260924-v80-makelabel1'));
assert(index.includes("const RELEASE='20260924-v80-makelabel1'"));
assert(sw.includes("const CACHE='dojun-pwa-v80-makelabel1'"));
console.log('PASS: only individually prepared foods can be active inventory');
