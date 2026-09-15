const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const legacy=fs.readFileSync(path.join(root,'legacy-v24.html'),'utf8');
assert(index.includes('v26'),'default entry must show v26');
assert(index.includes('./legacy-v24.html?v=20260915-v26'),'default entry must preserve full schedule app');
assert(index.includes('./ppeuni-v25-live.html?v=20260915-v26'),'default entry must link prep/inventory app');
assert(legacy.includes('도준이 밥상'),'legacy app must be preserved');
console.log('PASS: v26 default entry, legacy schedule preservation, prep/inventory wiring');