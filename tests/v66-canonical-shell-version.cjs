const fs=require('fs'),assert=require('assert/strict');
const index=fs.readFileSync('index.html','utf8');
const core=fs.readFileSync('legacy-v24.html','utf8');
const shell=fs.readFileSync('legacy-v67.html','utf8');
const ui=fs.readFileSync('legacy-ui-v47.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');

assert(core.includes("name:'도준이키우기',version:'v67'"),'legacy core canonical release must be v66');
assert(shell.includes("name:'도준이키우기',version:'v67'"),'active shell canonical release must be v66');
assert(index.includes('<iframe id="app" src="./legacy-v67.html?r=20260921-v67"'),'index must load the new physical v67 shell');
assert(!index.includes('<iframe id="app" src="./legacy-v24.html'),'index must not launch the old physical shell');
assert(ui.includes("const DISPLAY_VER=window.__DOJUN_RELEASE?.version||'v67'"),'settings UI must read canonical v66');
assert(sw.includes("'./legacy-v67.html'"),'service worker must cache the physical v67 shell');
assert(sw.includes("const CACHE='dojun-pwa-v67-prepcheck1'"),'v67 shell cache marker missing');
console.log('PASS: app shell, settings version and active feature generation all point to v67');
