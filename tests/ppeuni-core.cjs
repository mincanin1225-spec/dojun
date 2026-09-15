const assert=require('assert');
const c=require('../src/ppeuni-core.js');
const data=require('../src/ppeuni-data.js');

assert.equal(c.ageMonths('2025-12-05','2026-09-15'),9);
assert.equal(c.ppeuniStageForAge(9),'late1');
assert.deepEqual(c.prepWindowsForWeek('2026-09-15'),[
  {id:'first',prepDate:'2026-09-13',start:'2026-09-14',end:'2026-09-17',count:4,label:'1차 준비 · 일요일 → 월~목'},
  {id:'second',prepDate:'2026-09-17',start:'2026-09-18',end:'2026-09-20',count:3,label:'2차 준비 · 목요일 → 금~일'}
]);

const onion={id:'a1',code:'A-1',ingredient:'양파',madeDate:'2026-09-01',unitG:20,initialCount:20,remainingCount:20,thresholdCount:4,location:'냉동'};
assert.equal(c.stockFor([onion],'양파'),400);
let r=c.consumeFIFO([onion],'양파',60,'2026-09-14|lunch');
assert.equal(r.shortageG,0);assert.equal(r.batches[0].remainingCount,17);assert.equal(r.batches[0].history.length,1);
assert.equal(c.remakeSuggestion(r.batches,'양파',260).needsRemake,true);

const verified={source:'ppeuni_verified',sourceRef:'book:p-late1-table',title:'검증식단',ingredients:[{name:'양파',grams:20}]};
const provisional={source:'provisional',sourceRef:'temporary:test',title:'임시식단',ingredients:[{name:'양파',grams:20}]};
assert.throws(()=>c.assertVerifiedMeal(provisional),/Only verified/);
assert.throws(()=>c.assertOperationalMeal(provisional),/not allowed/);
assert.equal(c.assertOperationalMeal(provisional,{allowProvisional:true}).title,'임시식단');

let state={batches:[onion],done:{}};
state=c.completeMealOnce(state,'2026-09-14','breakfast',provisional,{allowProvisional:true});
assert.equal(state.batches[0].remainingCount,19);
const again=c.completeMealOnce(state,'2026-09-14','breakfast',provisional,{allowProvisional:true});
assert.equal(again.batches[0].remainingCount,19);assert.equal(again.alreadyDone,true);

const verifiedPlan={'2026-09-14':{breakfast:verified},'2026-09-15':{lunch:{...verified,ingredients:[{name:'양파',grams:40}]}}};
const prep=c.buildPrepList(verifiedPlan,'2026-09-14',4,[onion]);
assert.equal(prep[0].needG,60);assert.equal(prep[0].missingG,0);

assert.equal(data.planMode,'provisional');
const weekMeals=c.mealsInRange(data.plan,'2026-09-14',7,{allowProvisional:true});
assert.equal(weekMeals.length,21);
assert(weekMeals.every(x=>x.meal.source==='provisional'));
assert(weekMeals.every(x=>x.meal.ingredients.reduce((s,v)=>s+v.grams,0)===150));
const firstPrep=c.buildPrepList(data.plan,'2026-09-14',4,[],{allowProvisional:true});
const secondPrep=c.buildPrepList(data.plan,'2026-09-18',3,[],{allowProvisional:true});
assert(firstPrep.length>0&&secondPrep.length>0);
assert(firstPrep.every(x=>x.missingG===x.needG));
console.log('ppeuni-core tests passed: strict source, provisional mode, 1/2 batch, inventory FIFO, duplicate completion');