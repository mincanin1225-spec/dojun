const assert=require('node:assert/strict'),E=require('../meal-stock-v66.js');
const initial=()=>({prepared:[],cubes:[],raw:{},ops:{},feeds:{}});
const menu=(key='2026-09-23|0')=>({key,name:'잡곡무른밥 · 양배추',g:120,ingredients:[{name:'잡곡무른밥',g:100},{name:'양배추',g:20}]});
const prep=()=>({key:'make:2026-09-21|양배추퓨레',name:'양배추퓨레',g:20,ingredients:[{name:'양배추',g:20}],plannedG:20});
let n=0;function test(name,f){f();console.log('PASS',name);n++}
test('50g x 10 base allocated once across six meals',()=>{
 const s=initial();s.prepared=[{name:'잡곡무른죽',unitG:50,remainingCount:10}];
 const p=E.plan(Array.from({length:6},(_,i)=>menu('day'+i)),s);
 assert.deepEqual(p.map(r=>r.needs[0].buyG),[0,0,0,0,0,100]);assert.equal(s.prepared[0].remainingCount,10);
});
test('legacy whole-meal lots never satisfy meal planning',()=>{
 const s=initial();s.prepared=[{id:'whole',name:menu().name,mealKey:'2026-09-21|2',source:'meal-prep-v63',unitG:120,remainingCount:2},{id:'base',name:'잡곡무른밥',unitG:50,remainingCount:4}];
 const p=E.plan([menu('one')],s);assert.equal(p[0].used.some(x=>x.name===menu().name),false);assert.equal(p[0].needs.find(x=>x.name==='양배추').buyG,20);
});
function stocked(){const s=initial();s.prepared=[{id:'base',name:'잡곡무른죽',unitG:50,remainingCount:10}];s.cubes=[{id:'veg',ingredient:'양배추',unitG:30,remainingCount:2}];return s}
const total=(s,name)=>E.pool(s).filter(x=>x.name===name).reduce((a,x)=>a+x.g,0);
const form={token:'op1',count:1,unitG:20,date:'2026-09-21'};
test('component cooking preserves a 10g source remainder and creates exact output',()=>{
 const s=stocked(),r=E.cook(s,prep(),form).state;assert.equal(total(r,'양배추'),40);assert.equal(total(r,'양배추퓨레'),20);assert.equal(total(s,'양배추'),60);
 assert(r.cubes.some(x=>x.unitG===10&&x.remainingCount===1));assert(r.cubes.every(x=>Number.isInteger(x.remainingCount)));
 assert.deepEqual(E.cook(r,prep(),form).state,r);
});
test('planning can consume a prepared component made in step 3',()=>{
 const s=E.cook(stocked(),prep(),form).state,m={key:'day|0',name:'테스트 메뉴',g:20,ingredients:[{name:'양배추퓨레',g:20}]};
 const row=E.plan([m],s)[0];assert(row.needs.length>0);assert(row.needs.every(x=>Math.abs(Number(x.buyG)||0)<1e-9));
});
test('cook undo removes component output and restores source stock',()=>{
 const before=stocked(),cooked=E.cook(before,prep(),form).state,restored=E.undoCook(cooked,'op1').state;
 assert.equal(total(restored,'양배추퓨레'),0);assert(Math.abs(total(restored,'양배추')-60)<0.001);assert(!restored.ops.op1);
});
test('cook undo refuses after the prepared output was used',()=>{
 let s=E.cook(stocked(),prep(),form).state;
 const m={key:'served|0',name:'테스트 메뉴',g:20,ingredients:[{name:'양배추퓨레',g:20}]};
 s=E.feed(s,m).state;assert.throws(()=>E.undoCook(s,'op1'),/사용·수정/);
});
test('feed engine is idempotent and undo restores grams, while planning ignores feed history',()=>{
 let s=stocked();s=E.feed(s,menu()).state;assert.equal(total(s,'잡곡무른밥'),400);assert.equal(total(s,'양배추'),40);
 assert.deepEqual(E.feed(s,menu()).state,s);
 const planned=E.plan([menu()],s)[0];assert(!planned.fed);assert(planned.needs.length||planned.used.length,'planning must still calculate the meal even when a feed receipt exists');
 s=E.undoFeed(s,menu().key).state;assert.equal(total(s,'잡곡무른밥'),500);assert.equal(total(s,'양배추'),60);assert(!s.feeds[menu().key]);
});
test('feeding uses the offered total grams and undo restores them',()=>{
 let s=stocked();s=E.feed(s,menu(),80).state;
 assert(Math.abs(total(s,'잡곡무른밥')-433.333333)<0.001);assert(Math.abs(total(s,'양배추')-46.666667)<0.001);assert.equal(s.feeds[menu().key].servedG,80);
 s=E.undoFeed(s,menu().key).state;assert(Math.abs(total(s,'잡곡무른밥')-500)<0.001);assert(Math.abs(total(s,'양배추')-60)<0.001);
});
test('feeding cubes preserves remainder and cancellation restores total',()=>{
 let s=stocked();s=E.feed(s,menu()).state;assert.equal(total(s,'양배추'),40);assert(s.cubes.every(x=>Number.isInteger(x.remainingCount)));s=E.undoFeed(s,menu().key).state;assert.equal(total(s,'양배추'),60);assert.equal(total(s,'잡곡무른밥'),500);
});
test('whole-meal cooking is rejected',()=>{
 const s=stocked();assert.throws(()=>E.cook(s,menu(),{...form,unitG:120}),/한 끼 전체 메뉴/);
});
test('shortage and unknown quantities never modify inventory',()=>{
 const s=initial(),before=JSON.stringify(s);assert.throws(()=>E.cook(s,prep(),form),/부족/);assert.equal(JSON.stringify(s),before);
 const m={...prep(),ingredients:[{name:'김',g:null}]};assert.throws(()=>E.cook(stocked(),m,form),/확인되지/);
});
// 원재료는 먹이기로 바로 빠지지 않는다. 만들기 단계를 건너뛰면 재고 흐름이 끊긴다.
test('feeding never falls back to raw stock',()=>{
 let s=initial();s.raw.a={displayName:'잡곡무른밥',unit:'g',qty:1000};s.raw.b={displayName:'양배추',unit:'g',qty:1000};
 assert.throws(()=>E.feed(s,menu()),/재고/);
 assert.equal(s.raw.a.qty,1000);assert.equal(s.raw.b.qty,1000);assert(!s.feeds[menu().key]);
});
test('deleted lot cannot silently undo into a different lot',()=>{
 let s=E.feed(stocked(),menu()).state;s.prepared.shift();assert.throws(()=>E.undoFeed(s,menu().key),/복구/);
});
test('duplicate ingredient requirements are checked cumulatively',()=>{
 const s=stocked(),m={...prep(),ingredients:[{name:'양배추',g:40},{name:'양배추',g:40}],g:80};assert.throws(()=>E.cook(s,m,{...form,unitG:80}),/부족/);
});
test('invalid quantities rejected',()=>{for(const count of [0,-1,1.5,Infinity])assert.throws(()=>E.cook(stocked(),prep(),{...form,count}));});
test('saved base recipe expands only missing cooked amount into raw shopping',()=>{
 const s=initial();s.prepared=[{name:'잡곡무른죽',unitG:50,remainingCount:1}];
 s.recipes={'잡곡무른밥':{yieldG:100,ingredients:[{name:'쌀',g:25}]}};s.raw.rice={displayName:'쌀',unit:'g',qty:10};
 const p=E.plan([menu()],s);assert.equal(p[0].needs.find(x=>x.name==='쌀').buyG,2.5);
});
console.log(n+' core scenarios passed');
