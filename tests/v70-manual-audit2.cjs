const fs=require('fs'),assert=require('node:assert/strict');
const shell=fs.readFileSync('legacy-v70.html','utf8');
const outing=fs.readFileSync('legacy-outing-v36.js','utf8');
const outingCleanup=fs.readFileSync('legacy-outing-v41-no-embedded-map.js','utf8');
const outingSeed=fs.readFileSync('legacy-outing-v40-seed.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const health=fs.readFileSync('legacy-health-v43.js','utf8');
const healthData=fs.readFileSync('health-schedule-v43.js','utf8');

assert(shell.includes("let settings={name:'도준이',birth:''};"),'source defaults must not contain a private child birth date');
assert(shell.includes("if(needsChildSetup){tab='set'"),'fresh installs without a valid birth date must open Settings first');
assert(shell.includes('아이 정보를 먼저 설정해 주세요'),'first-use settings must explain why child info is required');
assert(shell.includes("if(!birth||Number.isNaN(dob.getTime())||dob>now)"),'Settings must reject missing, invalid, or future child birth dates');
assert(shell.includes('이 달 섭취기록 지우기'),'destructive log action must name what it actually deletes');
assert(shell.includes('재고 차감과 식단은 그대로 유지됩니다.'),'clear-log confirmation must state that stock and meal plan remain');
assert(shell.includes("if(!confirm('백업 내용을 이 기기에 불러올까요?"),'backup import must require confirmation before overwrite');

assert(health.includes("const prior=stateOf(item.afterId,rs)"),'health schedule must use actual recorded prior dose for dependent doses');
assert(healthData.includes("afterId:'flu-2627-1',minDaysAfter:28"),'flu second dose must be at least 28 days after actual first dose');
assert(healthData.includes("id:'hepa-1',name:'A형간염 1차',start:{months:12},end:{months:23}"),'HepA first-dose standard window must be 12-23 months');
assert(healthData.includes("afterId:'hepa-1',minMonthsAfter:6"),'HepA second dose must use actual first-dose date plus at least 6 months');
assert(health.includes('아이 정보의 생일을 기준으로 검진·접종 시기를 계산해요.'),'health entry must describe the shared child-info DOB source');

assert(shell.includes('let nutWeekCur=monOf(today);'),'nutrition must start on the actual current week');
assert(shell.includes("if(tab==='nut')nutWeekCur=addD(nutWeekCur,7*(+arg))"),'nutrition week arrows must be independent from management prep week');
assert(shell.includes('const dayHasCustom=on=>'),'custom meal days must be detectable');
assert(shell.includes('function dayNut(on){if(dayHasCustom(on))return null;'),'custom menu days must not produce silently incomplete nutrition totals');
assert(shell.includes('실제 섭취량이 아니라 계획 식단 기준 예상 영양'),'nutrition screen must state that it is planned-menu nutrition, not actual intake');
assert(shell.includes('임의 메뉴의 재료·분량을 추측해서 수치를 만들지 않습니다.'),'custom-menu exclusion must be explained');
assert(shell.includes("if(dayHasCustom(on))return '<div class=\"bcell\""),'weekly balance must visibly mark custom-menu days instead of partial calculation');

assert(shell.includes("eligible=ALL.filter(x=>stat(x.k)==='new'&&(x.minM||0)<=age)"),'bulk introduction must only affect age-eligible foods');
assert(shell.includes("if(!confirm('현재 월령에서 먹을 수 있는 미도입 재료"),'bulk introduction must require explicit confirmation');
assert(shell.includes('새 재료 안내에서 결과를 선택하거나 재료 상세에서 상태를 정하면 목록이 옮겨집니다.'),'ingredient help must describe the actual state-change flow');
assert(!shell.includes('반응을 기록하면 목록이 옮겨집니다.'),'generic reaction must not be described as automatic ingredient introduction');

assert(outing.includes('<h2>추천 장소</h2>'),'outing recommendation heading must be user-facing');
assert(!outing.includes('<h2>지이사 추천</h2>'),'old outing typo must be removed');
assert(outingCleanup.includes("#outingModal #outLat,#outingModal #outLng"),'obsolete coordinate inputs must be hidden');
assert(outingSeed.includes("if(localStorage.getItem(STORAGE_KEY)!==null){window.__outingPlaces=readRaw();return 0}"),'deleted seed places must stay deleted');
assert(!outingSeed.includes('nominatim.openstreetmap.org'),'outing must not perform unused background geocoding');

assert(index.includes('legacy-v70.html?r=20260923-v76-calmark1'));
assert(index.includes('legacy-outing-v36.js?v=20260916-v40&r=20260922-v73-recordonly5'));
assert(index.includes('health-schedule-v43.js?v=20260916-v43&r=20260922-v73-recordonly5'));
assert(index.includes('legacy-outing-v40-seed.js?v=20260916-v40&r=20260922-v73-recordonly5'));
assert(index.includes('legacy-outing-v41-no-embedded-map.js?v=20260916-v41&r=20260922-v73-recordonly5'));
assert(index.includes("const RELEASE='20260923-v76-calmark1'"));
assert(sw.includes("const CACHE='dojun-pwa-v76-calmark1'"));
assert(sw.includes("'/legacy-outing-v36.js'"),'outing heading fix must be network-first');
console.log('PASS: manual audit 2 keeps nutrition, ingredient state, and outing copy honest');
