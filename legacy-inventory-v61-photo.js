(function(){
  'use strict';
  if(typeof vShop!=='function'||typeof inventory==='undefined')return;

  const IMPORT_KEY='dj:photoInventoryImport20260920V61';
  const CUBE_KEY='dj:cubeInventory2';
  const PREP_KEY='dj:preparedMealInventory1';
  const SOURCE='photo-20260920-v61';
  const LOTS=[
    {ingredient:'청경채',madeDate:'2026-09-09',unitG:10,count:3},
    {ingredient:'콜리플라워',madeDate:'2026-09-12',unitG:10,count:12},
    {ingredient:'당근',madeDate:'2026-09-12',unitG:10,count:8},
    {ingredient:'애호박',madeDate:'2026-09-12',unitG:20,count:7},
    {ingredient:'양파',madeDate:'2026-09-12',unitG:20,count:4},
    {ingredient:'고구마',madeDate:'2026-09-13',unitG:10,count:14},
    {ingredient:'무',madeDate:'2026-09-19',unitG:20,count:3},
    {ingredient:'밤',madeDate:'2026-09-19',unitG:20,count:4},
    {ingredient:'닭고기',madeDate:'2026-09-19',unitG:20,count:12},
    {ingredient:'밥 (조리 후)',madeDate:'2026-09-19',unitG:40,count:2},
    {ingredient:'파프리카',madeDate:'2026-09-20',unitG:10,count:5},
    {ingredient:'파프리카',madeDate:'2026-09-20',unitG:60,count:1},
    {ingredient:'브로콜리',madeDate:'2026-09-22',unitG:20,count:11},
    {ingredient:'적채',madeDate:'2026-09-22',unitG:20,count:9},
    {ingredient:'양배추',madeDate:'2026-09-22',unitG:30,count:10},
    {ingredient:'토마토',madeDate:'2026-09-22',unitG:10,count:11}
  ];
  const PREPARED=[
    {id:'prepared-japgokmureunjuk-20260922',name:'잡곡무른죽',madeDate:'2026-09-22',unitG:50,originalCount:10,remainingCount:10,mealCode:'M-1',source:SOURCE,note:'이번 주 급여용으로 미리 만들어둔 식사'}
  ];

  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const cubes=()=>{try{const v=JSON.parse(localStorage.getItem(CUBE_KEY)||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}};
  const push=(k,v)=>{try{if(typeof syncPush==='function')syncPush(k,v)}catch(e){}};
  const saveCubes=v=>{localStorage.setItem(CUBE_KEY,JSON.stringify(v));push('cubeInventory2',v)};
  const prepared=()=>{try{const v=JSON.parse(localStorage.getItem(PREP_KEY)||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}};
  const savePrepared=v=>{localStorage.setItem(PREP_KEY,JSON.stringify(v));push('preparedMealInventory1',v)};

  function usedCodes(cb){
    const s=new Set();
    for(const v of Object.values(inventory||{}))if(/^A-\d+$/.test(String(v?.stockCode||'')))s.add(v.stockCode);
    for(const b of cb||[])if(/^A-\d+$/.test(String(b?.stockCode||'')))s.add(b.stockCode);
    return s;
  }
  function nextCode(used){let n=1;while(used.has(`A-${n}`))n++;const code=`A-${n}`;used.add(code);return code}
  const sameLot=(b,l)=>String(b?.ingredient||'').trim()===l.ingredient&&String(b?.madeDate||'')===l.madeDate&&Number(b?.unitG)===l.unitG;

  function retireMatchingCustomRaw(){
    if(typeof inventory==='undefined')return false;
    const names=new Set(LOTS.map(x=>x.ingredient)),now=Date.now();let changed=false;
    for(const [k,v] of Object.entries(inventory||{})){
      if(!v||v.custom!==true||v.unit!=='개'||!(Number(v.gramsPerUnit)>0))continue;
      const name=String(v.customName||k).trim();
      if(!names.has(name))continue;
      try{
        if(typeof inventoryTombstones!=='undefined'){
          const at=Math.max(now,(Number(v.updatedAt)||0)+1,(Number(inventoryTombstones[k])||0)+1);
          inventoryTombstones[k]=at;
          if(typeof saveInventoryTombstones==='function')saveInventoryTombstones();
          if(typeof pushInventoryDelete==='function')pushInventoryDelete(k,at);
        }
      }catch(e){}
      delete inventory[k];
      try{if(typeof removeCustomInventoryBackup==='function')removeCustomInventoryBackup(k)}catch(e){}
      changed=true;
    }
    if(changed)try{if(typeof persistInventoryLocal==='function')persistInventoryLocal()}catch(e){}
    return changed;
  }

  function importPhotoInventory(){
    try{if(localStorage.getItem(IMPORT_KEY)==='1')return false}catch(e){}
    // Existing stock keys mean this device already has deliberate local/family state, even when the arrays are empty.
    // Do not replay the old photo seed over consumed/deleted/synced inventory on a second device.
    try{if(localStorage.getItem(CUBE_KEY)!==null||localStorage.getItem(PREP_KEY)!==null){localStorage.setItem(IMPORT_KEY,'1');return false}}catch(e){}
    const cb=cubes(),used=usedCodes(cb),now=new Date().toISOString();
    retireMatchingCustomRaw();
    for(const lot of LOTS){
      let b=cb.find(x=>sameLot(x,lot));
      if(!b){
        const code=nextCode(used);
        b={ingredient:lot.ingredient,stockCode:code,code,unitG:lot.unitG,originalCount:lot.count,remainingCount:lot.count,madeDate:lot.madeDate,location:'냉동',source:SOURCE,history:[]};
        cb.push(b);
      }else{
        if(!b.stockCode){b.stockCode=nextCode(used);b.code=b.stockCode}
        b.ingredient=lot.ingredient;b.unitG=lot.unitG;b.madeDate=lot.madeDate;b.location='냉동';b.originalCount=lot.count;b.remainingCount=lot.count;b.source=SOURCE;
        if(!Array.isArray(b.history))b.history=[];
      }
      b.history.push({at:now,type:'photo_inventory_confirmed',count:lot.count,unitG:lot.unitG,madeDate:lot.madeDate});
    }
    cb.sort((a,b)=>String(a.madeDate||'').localeCompare(String(b.madeDate||''))||String(a.ingredient||'').localeCompare(String(b.ingredient||''),'ko')||(Number(a.unitG)||0)-(Number(b.unitG)||0));
    saveCubes(cb);
    localStorage.setItem('dj:cubeInventoryRefreshedAt',now);

    const p=prepared();
    for(const item of PREPARED){
      const i=p.findIndex(x=>x?.id===item.id);
      if(i>=0)p[i]={...p[i],...item};else p.push({...item});
    }
    savePrepared(p);
    try{localStorage.setItem(IMPORT_KEY,'1')}catch(e){}
    return true;
  }

  const isWholeMeal=x=>{
    try{if(window.MealStockV63&&window.MealStockV63.isWholeMealLot)return window.MealStockV63.isWholeMealLot(x)}catch(e){}
    return x&&(x.legacyWholeMeal===true||String(x.name||'').includes(' · '));
  };
  const showCode=v=>String(v||'M').replace(/-잔량-\d+-\d+$/,'');
  const g1=v=>{const n=Math.round((Number(v)||0)*10)/10;return Math.abs(n-Math.round(n))<1e-9?String(Math.round(n)):String(n)};

  function preparedCard(){
    // 오래된 것부터 보여야 "이건 언제 만든 거지? 오래됐네" 하고 버릴 것을 고르기 쉽다.
    const rows=prepared().filter(x=>(Number(x.remainingCount)||0)>0&&!isWholeMeal(x))
      .slice().sort((a,b)=>String(a.madeDate||'').localeCompare(String(b.madeDate||''))||String(a.name||'').localeCompare(String(b.name||''),'ko'));
    if(!rows.length)return '';
    const closing=window.__mgStage==='remain';
    return `<div class="sec"><h2>${closing?'남은 준비식':'미리 만들어둔 식사'}</h2><span class="more">${closing?'다음 주로 이월':'원재료와 분리'}</span></div>
      <div class="card"><p class="hint">${closing?'실제로 남아 있는 준비식 개수로 맞춰 주세요. 이 값이 다음 주 재고 계산에 그대로 이어집니다.':'만들어둔 식사는 원재료 재고와 따로 관리해요. 먹인 기록으로는 줄지 않으니, 장보기 전에 실제 남은 양을 보고 <b>수량을 고치거나</b> 오래된 것은 <b>삭제</b>해 주세요. 고친 값이 그대로 장보기·만들기 필요량에 반영돼요.'}</p>
      ${rows.map(x=>`<div class="inventory-row"><div style="flex:1"><div style="display:flex;gap:7px;align-items:center"><span class="chip sm">${esc(showCode(x.mealCode))}</span><b>${esc(x.name)}</b></div><div style="margin-top:6px;display:flex;align-items:center;gap:6px"><input data-v61-prep-q="${esc(x.id)}" type="number" min="0" step="1" value="${Math.max(0,Number(x.remainingCount)||0)}" style="width:68px;border:1px solid var(--line);border-radius:9px;padding:6px">개 <span class="hint">× ${g1(x.unitG)}g = ${g1((Number(x.unitG)||0)*(Number(x.remainingCount)||0))}g</span></div><div class="hint">만든 식사 · ${esc(x.madeDate||'날짜 미정')}</div></div><button class="btn" style="color:#B84A4A;border-color:#E7B6B6" data-v61-prep-del="${esc(x.id)}">삭제</button></div>`).join('')}
      <div class="btnrow"><button class="btn pri" data-v61-prep-save="1">${closing?'남은 준비식 확정':'준비식 수량 갱신'}</button></div></div>`;
  }

  const baseView=vShop;
  vShop=function(){
    const html=baseView();
    if(typeof html!=='string')return html;
    if(window.__mgStage==='stock'||window.__mgStage==='remain'){
      const card=preparedCard();if(!card)return html;
      const marker='<div class="sec"><h2>재료 추가</h2></div>';
      return html.includes(marker)?html.replace(marker,card+marker):html+card;
    }
    if(window.__mgStage==='prep'){
      const rows=prepared().filter(x=>(Number(x.remainingCount)||0)>0&&!isWholeMeal(x));
      if(rows.length){
        const summary=`<div class="card" style="margin:10px 0"><b>이미 만들어둔 준비식</b><div class="hint" style="margin-top:5px">${rows.map(x=>`${esc(x.name)} ${g1(x.unitG)}g × ${g1(x.remainingCount)}개`).join(' · ')}</div></div>`;
        return html.replace(/(<div class="sec"><h2>3단계 · 식단만들기<\/h2>)/,summary+'$1');
      }
    }
    return html;
  };

  document.addEventListener('click',function(e){
    const save=e.target.closest&&e.target.closest('[data-v61-prep-save]');
    if(save){
      e.preventDefault();e.stopImmediatePropagation();
      const p=prepared();
      document.querySelectorAll('[data-v61-prep-q]').forEach(el=>{const x=p.find(v=>v.id===el.dataset.v61PrepQ);if(x)x.remainingCount=Math.max(0,Math.round(Number(el.value)||0))});
      savePrepared(p);toast('준비식 수량을 갱신했어요');render(true);return;
    }
    const del=e.target.closest&&e.target.closest('[data-v61-prep-del]');
    if(del){
      e.preventDefault();e.stopImmediatePropagation();
      const p=prepared(),i=p.findIndex(x=>x.id===del.dataset.v61PrepDel);if(i<0)return;
      if(!confirm(`${p[i].name||'준비식'}을 삭제할까요?`))return;
      p.splice(i,1);savePrepared(p);toast('준비식을 삭제했어요');render(true);return;
    }
  },true);

  const imported=importPhotoInventory();
  try{render(true)}catch(e){}
  if(imported)setTimeout(()=>{try{toast('사진으로 확인한 냉동재고와 준비식을 반영했어요')}catch(e){}},0);
})();