const fs=require('fs'),assert=require('node:assert/strict');
const shell=fs.readFileSync('legacy-v70.html','utf8');
const health=fs.readFileSync('legacy-health-v43.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');

assert(shell.includes("['shop','관리','shop']"),'base bottom tab must say 관리 from first paint');
assert(shell.includes('관리 탭이 다음 주 기준으로 열립니다.'),'calendar weekend copy must point to 관리');
assert(shell.includes('const BACKUP_SCHEMA=2;'),'full backup must have an explicit schema');
for(const k of ['preparedMealInventory1','mealFeedsV63','mealOpsV63','mealRecipesV63','shoppingStockReceipts1','outingPlaces1','healthProfile1','healthRecords1']){
  assert(shell.includes("'"+k+"'"),k+' must be included in full backup');
}
assert(shell.includes("const dump={backupSchema:BACKUP_SCHEMA"),'export must use the full backup envelope');
assert(shell.includes("Number(o.backupSchema)>=2"),'import must support the full backup envelope');
assert(shell.includes("k.indexOf('m2:')===0"),'monthly meal records must be included in backup/restore');
assert(shell.includes("t.match(/version\\s*:\\s*['\\\"](v\\d+)['\\\"]/"),'version checker must parse __DOJUN_RELEASE.version');
assert(!shell.includes("t.match(/const APP_VER='(v\\d+)'/)"),'stale APP_VER literal matcher must be removed');
assert(shell.includes('식단·섭취기록·재고·장보기·만들기 상태·프로필'),'family-sharing description must match current synced domains');
assert(shell.includes('외출·건강기록은 현재 기기에 저장되며 백업으로 옮길 수 있어요'),'local-only domains must be stated clearly');

assert(health.includes("appDob=(typeof settings==='object'&&settings&&settings.birth)||''"),'health must reuse the child birth date from Settings');
assert(health.includes('생일 · 설정에서 연동'),'health UI must not ask for a duplicate DOB');
assert(health.includes('data-health-settings="1"'),'health must offer a direct route to edit child info');
assert(!health.includes("toast('생년월일을 입력해 주세요')"),'health must not require re-entering DOB');

assert(index.includes('legacy-v70.html?r=20260922-v70-coreflowfix2'),'active shell release must refresh');
assert(index.includes('legacy-health-v43.js?v=20260916-v43&r=20260922-v70-coreflowfix2'),'health module release must refresh');
assert(index.includes("const RELEASE='20260922-v70-coreflowfix2'"),'PWA release marker must refresh');
assert(sw.includes("const CACHE='dojun-pwa-v70-coreflowfix2'"),'PWA cache marker must refresh');
assert(sw.includes("'/legacy-health-v43.js'"),'health module must use network-first refresh');
console.log('PASS: manual audit fixes cover copy, backup, version check, and single-source DOB');