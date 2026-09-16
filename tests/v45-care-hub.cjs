const fs=require('fs');
const assert=require('assert');
const patch=fs.readFileSync('legacy-care-v45.js','utf8');
const index=fs.readFileSync('index.html','utf8');

assert(patch.includes("#healthHomeEntry{display:none!important}"),'health entry should be removed from management UI');
assert(patch.includes("textContent='육아'"),'outing bottom tab should be renamed 육아');
assert(patch.includes('data-care="outing"'),'육아 hub should expose outing card');
assert(patch.includes('data-care="health"'),'육아 hub should expose health card');
assert(patch.includes("window.__mgStage='health'"),'health card should open existing health manager');
assert(patch.includes("data-health-back"),'health back should route to 육아 hub');
assert(patch.includes("data-care=\"home\""),'outing view should expose 육아 back navigation');
assert(index.includes('legacy-care-v45.js?v=20260916-v45'),'index should load v45 care hub');
assert(index.indexOf('legacy-care-v45.js?v=20260916-v45') < index.indexOf('legacy-health-v44-entry-fix.js?v=20260916-v44'),'v45 should load before v44 so latest version click handler wins');
console.log('v45 care hub checks passed');
