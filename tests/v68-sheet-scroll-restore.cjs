const fs=require('fs'),assert=require('assert/strict');
const shell=fs.readFileSync('legacy-v70.html','utf8');
const index=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');

const a=shell.indexOf("const sheet=$('sheet')");
const b=shell.indexOf('function sheetDay',a);
assert(a>=0&&b>a,'sheet navigation block missing');
const block=shell.slice(a,b);

assert(block.includes('let sheetReturnY=0'),'sheet must remember return scroll position');
assert(block.includes('function captureSheetPosition()'),'sheet open must capture scroll position');
assert(block.includes('function restoreSheetPosition()'),'sheet close must restore scroll position');
assert(block.includes('function queueSheetRestore()'),'sheet close must survive keyboard/viewport settle');
assert(block.includes('if(!sheetOpen)captureSheetPosition()'),'scroll position must be captured before opening a sheet');
assert(block.includes('queueSheetRestore();'),'closeNow must schedule restoring the original page position');
assert(block.includes('restoreSheetPosition();sheetRestoreUntil=0'),'restore window must finish at the saved position');
assert(!block.includes('window.scrollTo(0,0)'),'sheet close/back must never force the underlying page to the top');
assert(block.includes("if(!sheetOpen&&sheetRestoreUntil&&Date.now()<sheetRestoreUntil)restoreSheetPosition()"),'keyboard viewport resize must preserve saved scroll');
assert(block.includes("e.data.type==='dojun-sheet-back'&&sheetOpen"),'hardware back must still close the current sheet');
assert(index.includes('./legacy-v70.html?r=20260921-v70'),'index must load the scroll-restoring physical shell');
assert(sw.includes("'./legacy-v70.html'"),'service worker must precache the scroll-restoring shell');
assert(sw.includes("const CACHE='dojun-pwa-v70-shoppingstock2'"),'scroll-restoring cache generation missing');
console.log('PASS: closing/back from edit sheets restores the exact underlying page position');
