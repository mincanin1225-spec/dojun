const assert=require('node:assert/strict'),E=require('../meal-stock-v63.js');
const initial=()=>({prepared:[],cubes:[],raw:{},ops:{},feeds:{}});
const menu=(key='2026-09-23|0')=>({key,name:'잡곡무른밥 · 양배추',g:120,ingredients:[{name:'잡곡무른밥',g:100},{name:'양배추',g:20}]});
let n=0;function test(name,f){f();console.log('PASS',name);n++}
test('50g x 10 base allocated once across six meals',()=>{
 const s=initial();s.prepared=[{name:'잡곡무른죽',unitG:50,remainingCount:10}];
 const p=E.plan(Array.from({length:6},(_,i)=>menu('day'+i)),s);
 assert.deepEqual(p.map(r=>r.needs[0].buyG),[0,0,0,0,0,100]);assert.equal(s.prepared[0].remainingCount,10);
});
test('full meals available across dates; no double allocation',()=>{
 const s=initial();s.prepared=[{name:menu().name,menuKey:'old|0',unitG:60,remainingCount:4}];
 const p=E.plan([menu('one'),menu('two'),menu('three')],s);assert.equal(p[0].needs.length,0);assert.equal(p[1].needs.length,0);assert.equal(p[2].needs[0].buyG,100);
});
function stocked(){const s=initial();s.prepared=[{id:'base',name:'잡곡무른죽',unitG:50,remainingCount:10}];s.cubes=[{id:'veg',ingredient:'양배추',unitG:30,remainingCount:2}];return s}
const total=(s,name)=>E.pool(s).filter(x=>x.name===name).reduce((a,x)=>a+x.g,0);
const form={token:'op1',count:1,unitG:120,date:'2026-09-21'};
test('cook preserves 10g remainder and creates exact output',()=>{
 const s=stocked(),r=E.cook(s,menu(),form).state;assert.equal(total(r,'양배추'),40);assert.equal(total(r,'잡곡무른밥'),400);assert.equal(total(r,menu().name),120);assert.equal(total(s,'양배추'),60);
 assert(r.cubes.some(x=>x.unitG===10&&x.remainingCount===1));assert(r.cubes.every(x=>Number.isInteger(x.remainingCount)));
 assert.deepEqual(E.cook(r,menu(),form).state,r);
});
test('shopping does not request materials again after cooking',()=>{
 const s=E.cook(stocked(),menu(),form).state;assert.equal(E.plan([menu()],s)[0].needs.length,0);
});
test('feed is idempotent, uses only prepared food, undo restores grams',()=>{
 let s=E.cook(stocked(),menu(),form).state;const before=JSON.stringify(s);s=E.feed(s,menu()).state;assert.equal(total(s,menu().name),0);assert.equal(total(s,'잡곡무른밥'),400);
 assert.deepEqual(E.feed(s,menu()).state,s);assert(E.plan([menu()],s)[0].fed);s=E.undoFeed(s,menu().key).state;assert.equal(total(s,menu().name),120);assert(!s.feeds[menu().key]);
});
test('feeding cubes preserves remainder and cancellation restores total',()=>{
 let s=stocked();s=E.feed(s,menu()).state;assert.equal(total(s,'양배추'),40);assert(s.cubes.every(x=>Number.isInteger(x.remainingCount)));s=E.undoFeed(s,menu().key).state;assert.equal(total(s,'양배추'),60);assert.equal(total(s,'잡곡무른밥'),500);
});
test('shortage and unknown quantities never modify inventory',()=>{
 const s=initial(),before=JSON.stringify(s);assert.throws(()=>E.cook(s,menu(),form),/부족/);assert.equal(JSON.stringify(s),before);
 const m={...menu(),ingredients:[{name:'김',g:null}]};assert.throws(()=>E.cook(stocked(),m,form),/확인되지/);
});
test('raw stock cannot be fed without cooking',()=>{
 const s=initial();s.raw.a={displayName:'잡곡무른밥',unit:'g',qty:1000};s.raw.b={displayName:'양배추',unit:'g',qty:1000};assert.throws(()=>E.feed(s,menu()),/부족/);
});
test('deleted lot cannot silently undo into a different lot',()=>{
 let s=E.feed(stocked(),menu()).state;s.prepared.shift();assert.throws(()=>E.undoFeed(s,menu().key),/복구/);
});
test('duplicate ingredient requirements are checked cumulatively',()=>{
 const s=stocked(),m={...menu(),ingredients:[{name:'양배추',g:40},{name:'양배추',g:40}]};assert.throws(()=>E.cook(s,m,form),/부족/);
});
test('invalid quantities rejected',()=>{for(const count of [0,-1,1.5,Infinity])assert.throws(()=>E.cook(stocked(),menu(),{...form,count}));});
test('saved base recipe expands only missing cooked amount into raw shopping',()=>{
 const s=initial();s.prepared=[{name:'잡곡무른죽',unitG:50,remainingCount:1}];
 s.recipes={'잡곡무른밥':{yieldG:100,ingredients:[{name:'쌀',g:25}]}};s.raw.rice={displayName:'쌀',unit:'g',qty:10};
 const p=E.plan([menu()],s);assert.equal(p[0].needs.find(x=>x.name==='쌀').buyG,2.5);
});
console.log(n+' core scenarios passed');
