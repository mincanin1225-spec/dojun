const fs=require('fs'),assert=require('node:assert/strict');
const shell=fs.readFileSync('legacy-v70.html','utf8');
const outing=fs.readFileSync('legacy-outing-v36.js','utf8');
const outingCleanup=fs.readFileSync('legacy-outing-v41-no-embedded-map.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');

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

assert(index.includes('legacy-v70.html?r=20260922-v70-manualaudit2'));
assert(index.includes('legacy-outing-v36.js?v=20260916-v40&r=20260922-v70-manualaudit2'));
assert(index.includes('legacy-outing-v41-no-embedded-map.js?v=20260916-v41&r=20260922-v70-manualaudit2'));
assert(index.includes("const RELEASE='20260922-v70-manualaudit2'"));
assert(sw.includes("const CACHE='dojun-pwa-v70-manualaudit2'"));
assert(sw.includes("'/legacy-outing-v36.js'"),'outing heading fix must be network-first');
console.log('PASS: manual audit 2 keeps nutrition, ingredient state, and outing copy honest');
