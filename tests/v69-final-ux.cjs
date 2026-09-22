const fs=require('fs'),assert=require('assert/strict');
const flow=fs.readFileSync('meal-workflow-v70.js','utf8');
const mg35=fs.readFileSync('legacy-management-v35.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const shell=fs.readFileSync('legacy-v70.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
new Function(flow);new Function(mg35);

for(const t of ['1 · 재고','2 · 장보기','3 · 만들기','4 · 먹이기·기록']){
  assert(flow.includes(t),t+' missing from active workflow navigation');
  assert(mg35.includes(t),t+' missing from stock navigation');
}
assert(!flow.includes('재고연결 v63'),'technical stock-engine version text must not be user-facing');
assert(flow.includes('2단계 · 장보기'),'shopping must be labeled as step 2');
assert(flow.includes('3단계 · 만들기'),'prep must be labeled as step 3');
assert(flow.includes('4단계 · 먹이기/섭취기록'),'day detail must expose step 4');
assert(flow.includes('제공량으로 재고 차감'),'step 4 must deduct the total offered amount');
assert(!flow.includes("급여 완료 · 조리식 차감"),'feeding action must not remain inside prep cards');
assert(!flow.includes("<p class=\"hint\">'+esc(m.source)"),'repeated recipe-source prose must be removed from meal cards');
assert(flow.includes('data-v71-makecheck'),'step 3 must use a shopping-like make checklist');
assert(flow.includes('data-v71-makeg'),'step 3 must allow changing only the actual made amount');
assert(!flow.includes('>분량·레시피</button>')&&!flow.includes('>조리 완료·소분</button>'),'prep cards must not expose the old split actions');
assert(index.includes('./legacy-v70.html?r=20260922-v70-prepprogress1'),'index must load v69 shell');
assert(index.includes('./meal-workflow-v70.js?r=20260922-v70-prepprogress1'),'index must load v69 workflow');
assert(shell.includes("name:'도준이키우기',version:'v70'"),'canonical version must be v69');
assert(sw.includes("const CACHE='dojun-pwa-v70-prepprogress1'"),'v69 cache missing');
console.log('PASS: final UX is a four-step flow with compact prep cards and separated feeding');
