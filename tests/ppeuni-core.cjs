const assert=require('assert');
const c=require('../src/ppeuni-core.js');

assert.equal(c.ageMonths('2025-12-05','2026-09-15'),9);
assert.equal(c.ppeuniStageForAge(9),'late1');
assert.deepEqual(c.prepWindowsForWeek('2026-09-15'),[
  {id:'first',prepDate:'2026-09-13',start:'2026-09-14',end:'2026-09-17',count:4,label:'1차 준비 · 일요일 → 월~목'},
  {id:'second',prepDate:'2026-09-17',start:'2026-09-18',end:'2026-09-20',count:3,label:'2차 준비 · 목요일 → 금~일'}
]);

const onion={id:'a1',code:'A-1',ingredient:'양파',madeDate:'2026-09-01',unitG:20,initialCount:20,remainingCount:20,thresholdCount:4,location:'냉동'};
assert.equal(c.stockFor([onion],'양파'),400);
let r=c.consumeFIFO([onion],'양파',60,'2026-09-14|lunch');
assert.equal(r.shortageG,0);assert.equal(r.batches[0].remainingCount,17);
assert.equal(r.batches[0].history.length,1);
assert.equal(c.remakeSuggestion(r.batches,'양파',260).needsRemake,true);

const meal={source:'ppeuni_verified',sourceRef:'book:p-late1-table',title:'검증식단',ingredients:[{name:'양파',grams:20}]};
assert.throws(()=>c.assertVerifiedMeal({source:'generated',ingredients:[]}),/Only verified/);
let state={batches:[onion],done:{}};
state=c.completeMealOnce(state,'2026-09-14','breakfast',meal);
assert.equal(state.batches[0].remainingCount,19);
const again=c.completeMealOnce(state,'2026-09-14','breakfast',meal);
assert.equal(again.batches[0].remainingCount,19);assert.equal(again.alreadyDone,true);

const plan={'2026-09-14':{breakfast:meal},'2026-09-15':{lunch:{...meal,ingredients:[{name:'양파',grams:40}]}}};
const prep=c.buildPrepList(plan,'2026-09-14',4,[onion]);
assert.equal(prep[0].needG,60);assert.equal(prep[0].missingG,0);
console.log('ppeuni-core tests passed');