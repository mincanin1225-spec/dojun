(function(){
  'use strict';
  if(typeof vShop!=='function'||typeof inventory==='undefined'||typeof cleanInventory!=='function'||typeof pushInventoryItem!=='function')return;

  const BACKUP_KEY='dj:customInventory1';
  const DIRECT='__direct__';
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const baseView=vShop;
  const baseClean=cleanInventory;
  const basePush=pushInventoryItem;

  const readBackup=()=>{try{const v=JSON.parse(localStorage.getItem(BACKUP_KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch(e){return{}}};
  const isCustom=(k,v)=>!!(v?.custom===true||readBackup()[k]?.custom===true);
  const saveBackup=()=>{const out={};for(const [k,v] of Object.entries(inventory||{}))if(v?.custom===true)out[k]=v;localStorage.setItem(BACKUP_KEY,JSON.stringify(out))};
  const restoreBackup=()=>{const b=readBackup();for(const [k,v] of Object.entries(b)){if(!inventory[k]||(Number(v.updatedAt)||0)>=(Number(inventory[k]?.updatedAt)||0))inventory[k]=v}};
  const cleanCustomName=s=>String(s||'').trim().replace(/\s+/g,' ');
  const unsafeName=s=>/[.#$\[\]\/\u0000-\u001F\u007F]/.test(s);
  const customKeys=()=>Object.entries(inventory||{}).filter(([,v])=>v?.custom===true).map(([k])=>k).sort((a,b)=>a.localeCompare(b,'ko'));
  const builtInKeyByName=name=>{try{return inventoryKeys().find(k=>String(invName(k)).trim()===name)||null}catch(e){return null}};
  const cubes=()=>{try{const v=JSON.parse(localStorage.getItem('dj:cubeInventory2')||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}};
  const nextCode=()=>{const used=new Set();for(const v of Object.values(inventory||{}))if(/^A-\d+$/.test(String(v.stockCode||'')))used.add(v.stockCode);for(const b of cubes())if(/^A-\d+$/.test(String(b.stockCode||'')))used.add(b.stockCode);let n=1;while(used.has(`A-${n}`))n++;return `A-${n}`};

  cleanInventory=function(raw){
    const out=baseClean(raw);
    for(const [k,v] of Object.entries(raw||{})){
      if(!v||v.custom!==true||out[k])continue;
      if(!Number.isFinite(v.qty)||v.qty<0||!['g','개','팩'].includes(v.unit))continue;
      if(unsafeName(k))continue;
      out[k]={qty:v.qty,unit:v.unit,location:['냉장','냉동','실온'].includes(v.location)?v.location:'냉장',gramsPerUnit:Number.isFinite(v.gramsPerUnit)&&v.gramsPerUnit>0?v.gramsPerUnit:null,memo:String(v.memo||'').slice(0,200),updatedAt:Number.isFinite(v.updatedAt)?v.updatedAt:0,stockCode:String(v.stockCode||''),custom:true,customName:String(v.customName||k)};
    }
    return out;
  };
  pushInventoryItem=function(k){if(inventory?.[k]?.custom===true)saveBackup();return basePush(k)};
  restoreBackup();

  function enhanceStock(html){
    if(window.__mgStage!=='stock'||typeof html!=='string')return html;
    const customOpts=customKeys().map(k=>`<option value="${esc(k)}">${esc(k)} (직접추가)</option>`).join('');
    const option=`${customOpts}<option value="${DIRECT}">＋ 목록에 없는 식품 직접 입력</option>`;
    html=html.replace(/(<select id="mg32Key"[^>]*>)([\s\S]*?)(<\/select>)/,(_,a,b,c)=>`${a}${b}${option}${c}`);
    html=html.replace(/(<select id="mg32Key"[^>]*>[\s\S]*?<\/select>)/,`$1<div class="fld" id="mg34DirectWrap" style="display:none"><label>직접 입력 재료명</label><input id="mg34Name" type="text" maxlength="40" placeholder="예: 새우, 대구살, 김, 요거트"><div class="hint">입력한 이름이 식단 재료명과 같으면 장보기 계산에도 자동으로 연결돼요.</div></div>`);
    return html;
  }
  vShop=function(){return enhanceStock(baseView())};

  function syncDirect(){const s=document.getElementById('mg32Key'),w=document.getElementById('mg34DirectWrap');if(w)w.style.display=s?.value===DIRECT?'':''==='x'?'':'none';if(w&&s?.value===DIRECT)w.style.display=''}
  document.addEventListener('change',e=>{if(e.target?.id==='mg32Key')syncDirect()},true);

  function addCustom(name){
    name=cleanCustomName(name);
    if(!name)return toast('재료명을 입력해 주세요');
    if(name.length>40)return toast('재료명은 40자 이내로 입력해 주세요');
    if(unsafeName(name))return toast('재료명에는 . $ # [ ] / 문자를 사용할 수 없어요');
    const builtin=builtInKeyByName(name);if(builtin){const s=document.getElementById('mg32Key');if(s)s.value=builtin;return {builtin:true,key:builtin}}
    const mode=document.getElementById('mg32Mode')?.value||'total',loc=document.getElementById('mg32Loc')?.value||'냉장',old=inventory[name]||{},code=old.stockCode||nextCode(),now=Math.max(Date.now(),(Number(old.updatedAt)||0)+1);
    if(mode==='portion'){
      const unitG=Math.max(1,Math.round(Number(document.getElementById('mg32UnitG')?.value)||0)),count=Math.max(0,Math.round(Number(document.getElementById('mg32Count')?.value)||0));if(!count)return toast('소분 개수를 입력해 주세요');
      inventory[name]={...old,qty:count,unit:'개',gramsPerUnit:unitG,location:loc,memo:'소분 · 직접추가',updatedAt:now,stockCode:code,custom:true,customName:name,madeDate:document.getElementById('mg32Date')?.value||''};
      persistInventoryLocal();saveBackup();pushInventoryItem(name);toast(`${name} ${unitG}g × ${count}개를 ${loc} 재고에 추가했어요`);render(true);return {done:true};
    }
    const q=Math.max(0,Number(document.getElementById('mg32Qty')?.value)||0);if(!q)return toast(mode==='count'?'개수를 입력해 주세요':'총량을 입력해 주세요');
    inventory[name]={...old,qty:q,unit:mode==='count'?'개':'g',gramsPerUnit:null,location:loc,memo:'직접추가',updatedAt:now,stockCode:code,custom:true,customName:name};
    persistInventoryLocal();saveBackup();pushInventoryItem(name);toast(`${name} ${q}${mode==='count'?'개':'g'}를 ${loc} 재고에 추가했어요`);render(true);return {done:true};
  }

  window.addEventListener('click',function(e){
    const btn=e.target.closest&&e.target.closest('[data-mg32="add"]');if(!btn)return;
    const s=document.getElementById('mg32Key'),key=s?.value||'';
    if(key!==DIRECT&&!inventory?.[key]?.custom)return;
    if(key===DIRECT){
      const name=cleanCustomName(document.getElementById('mg34Name')?.value);const r=addCustom(name);
      if(r?.builtin){return}
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();return;
    }
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();addCustom(key);
  },true);

  setTimeout(()=>{try{if(typeof famURL==='function'&&typeof mergeInventory==='function'&&online&&sync?.url&&sync?.code){fetch(famURL('inventory2')).then(r=>r.ok?r.json():null).then(raw=>{if(!raw)return;const changed=mergeInventory(raw);saveBackup();if(changed)render(true)}).catch(()=>{})}}catch(e){}},0);
  try{render(true)}catch(e){}
})();