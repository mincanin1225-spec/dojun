const fs=require('fs'),assert=require('assert/strict');
const flow=fs.readFileSync('meal-workflow-v69.js','utf8');
const shell=fs.readFileSync('legacy-v69.html','utf8');
const index=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
new Function(flow);

assert(!flow.includes('<summary>조리 완료 후 소분 등록</summary>'),'legacy inline portion form must be removed');
assert(flow.includes('data-v68-portion'),'meal card must open portion sheet');
assert(flow.includes('class="portion-editor-v68"'),'portion registration must use redesigned bottom sheet');
assert(flow.includes('총 완성량')&&flow.includes('재고 반영 예상'),'portion sheet must show total and stock-use preview');
assert(flow.includes('data-v68-portion-cancel'),'portion sheet must provide cancel action');
assert(flow.includes('updatePortionPreview'),'portion total preview must update from unit weight/count');
assert(flow.includes("close();render(true);toast"),'successful cooking must close the portion sheet');

assert(shell.includes("parent.postMessage({type:'dojun-sheet-open'}"),'child shell must notify top-level when a sheet opens');
assert(shell.includes("parent.postMessage({type:'dojun-sheet-close'}"),'child shell must release top-level guard when a sheet closes');
assert(shell.includes("e.data.type==='dojun-sheet-back'"),'child shell must close sheet on guarded back message');

assert(index.includes("./legacy-v69.html?r=20260921-v69"),'index must load navigation-safe shell');
assert(index.includes("./meal-workflow-v69.js?r=20260921-v69"),'index must load redesigned portion workflow');
assert(index.includes("history.pushState({dojunSheetGuard:true}"),'top-level app must create a back guard for open sheets');
assert(index.includes("frame.contentWindow.postMessage({type:'dojun-sheet-back'}"),'top-level back must be routed to the open sheet');
assert(sw.includes("const CACHE='dojun-pwa-v69-finalux1'"),'portion/back hotfix cache marker missing');
assert(sw.includes("'./legacy-v69.html'")&&sw.includes("'./meal-workflow-v69.js'"),'new physical files must be precached');
console.log('PASS: portion registration UI is redesigned and hardware back closes the sheet');
