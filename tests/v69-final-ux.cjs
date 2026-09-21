const fs=require('fs'),assert=require('assert/strict');
const flow=fs.readFileSync('meal-workflow-v69.js','utf8');
const mg33=fs.readFileSync('legacy-management-v33.js','utf8');
const mg35=fs.readFileSync('legacy-management-v35.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const shell=fs.readFileSync('legacy-v69.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
new Function(flow);new Function(mg33);new Function(mg35);

for(const t of ['1 · 재고','2 · 장보기','3 · 만들기','4 · 먹이기·기록']){
  assert(flow.includes(t),t+' missing from active workflow navigation');
  assert(mg35.includes(t),t+' missing from shopping/prep navigation');
  assert(mg33.includes(t),t+' missing from stock/home navigation');
}
assert(!flow.includes('재고연결 v63'),'technical stock-engine version text must not be user-facing');
assert(flow.includes('2단계 · 장보기'),'shopping must be labeled as step 2');
assert(flow.includes('3단계 · 식단만들기'),'prep must be labeled as step 3');
assert(flow.includes('4단계 · 먹이기/섭취기록'),'day detail must expose step 4');
assert(flow.includes('먹인 재고 차감'),'step 4 must separate feeding stock deduction');
assert(!flow.includes('급여'),'legacy feeding terminology must not remain user-facing');
assert(!flow.includes("if(typeof sheetOpen!=='undefined'&&sheetOpen&&oldSheet)sheetDay(m.on)"),'feeding stock deduction must not rebuild the day sheet and discard draft inputs');
assert(flow.includes('el.isConnected'),'feeding stock button must refresh in place while preserving draft inputs');
assert(flow.includes('insertBefore(box,saveRow)'),'step 4 must appear before the day-detail save actions');
assert((flow.match(/if\(isPreparedOnlyShoppingName\(x\.name\)\)continue;/g)||[]).length>=2,'hidden prepared foods must also be excluded from bulk shopping completion');
assert(flow.includes('aggregateMissing(rows).filter(x=>!isPreparedOnlyShoppingName(x.name))'),'empty additional-prep section must be prevented');
assert(!flow.includes("급여 완료 · 조리식 차감"),'feeding action must not remain inside prep cards');
assert(!flow.includes("<p class=\"hint\">'+esc(m.source)"),'repeated recipe-source prose must be removed from meal cards');
assert(flow.includes("사용 재고"),'compact meal cards must still show allocated stock');
assert(flow.includes("분량·레시피")&&flow.includes("조리 완료·소분"),'core prep actions must remain visible');
assert(index.includes('./legacy-v69.html?r=20260921-v69'),'index must load v69 shell');
assert(index.includes('./meal-workflow-v69.js?r=20260921-v69'),'index must load v69 workflow');
assert(shell.includes("name:'도준이키우기',version:'v69'"),'canonical version must remain v69');
assert(sw.includes("const CACHE='dojun-pwa-v69-finalux2'"),'v69 final UX patch cache missing');
console.log('PASS: v69 final UX keeps the four-step flow consistent and preserves day-detail drafts during feeding stock updates');
