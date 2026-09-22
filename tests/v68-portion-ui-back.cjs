const fs=require('fs'),assert=require('assert/strict');
const flow=fs.readFileSync('meal-workflow-v70.js','utf8');
const shell=fs.readFileSync('legacy-v70.html','utf8');
const index=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
new Function(flow);

assert(flow.includes('data-v70-unified'),'recipe and portion controls must share one form');
assert(flow.includes('3 · 완성량·소분'),'unified screen must include portion registration');
assert(flow.includes('실제 총 완성량')&&flow.includes('4 · 재고 반영 예상'),'unified screen must show total and stock-use preview');
assert(flow.includes('data-v70-total')&&flow.includes('data-v70-use'),'unified preview targets missing');
assert(flow.includes('updateUnifiedPreview'),'unified amount preview must update live');
assert(flow.includes('조리 완료 · 재고 반영'),'single final cooking action missing');
assert(flow.includes("cooked={...m,ingredients:data.ingredients,g:data.yieldG,steps:data.steps}"),'cooking must use the just-confirmed recipe amounts');

assert(shell.includes("parent.postMessage({type:'dojun-sheet-open'}"),'child shell must notify top-level when a sheet opens');
assert(shell.includes("parent.postMessage({type:'dojun-sheet-close'}"),'child shell must release top-level guard when a sheet closes');
assert(shell.includes("e.data.type==='dojun-sheet-back'"),'child shell must close sheet on guarded back message');

assert(index.includes("./legacy-v70.html?r=20260922-v70-coreflowfix2"),'index must load navigation-safe shell');
assert(index.includes("./meal-workflow-v70.js?r=20260922-v70-feedfix2"),'index must load unified cooking workflow');
assert(index.includes("history.pushState({dojunSheetGuard:true}"),'top-level app must create a back guard for open sheets');
assert(index.includes("frame.contentWindow.postMessage({type:'dojun-sheet-back'}"),'top-level back must be routed to the open sheet');
assert(sw.includes("const CACHE='dojun-pwa-v70-feedfix2'"),'unified cooking cache marker missing');
assert(sw.includes("'./legacy-v70.html'")&&sw.includes("'./meal-workflow-v70.js'"),'active files must be precached');
console.log('PASS: portion registration and recipe editing share one cooking screen with safe back navigation');
