(function(){
  'use strict';
  const DISPLAY_VER=window.__DOJUN_RELEASE?.version||'v67';
  const PROFILE_KEY='dj:healthProfile1';
  const RECORD_KEY='dj:healthRecords1';
  const HASH_PREFIX='#healthImport=';

  const readJSON=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||'');return v&&typeof v==='object'?v:f}catch(e){return f}};
  const saveJSON=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||''));

  function syncBirthFromApp(){
    const p=Object.assign({dob:'',jeType:'unknown'},readJSON(PROFILE_KEY,{}));
    if(validDate(p.dob))return false;
    let birth='';
    try{if(typeof settings!=='undefined'&&settings&&validDate(settings.birth))birth=settings.birth}catch(e){}
    if(!birth){try{const s=readJSON('settings2',{});if(validDate(s.birth))birth=s.birth}catch(e){}}
    if(!birth)return false;
    p.dob=birth;
    if(!['unknown','inactivated','live'].includes(p.jeType))p.jeType='unknown';
    saveJSON(PROFILE_KEY,p);
    return true;
  }

  function knownHealthIds(){
    const d=window.__DOJUN_HEALTH_SCHEDULE_V43;
    if(!d)return null;
    return new Set([...(d.checkups||[]),...(d.vaccines||[])].map(x=>x.id));
  }

  function decodeBase64Url(s){
    const raw=String(s||'').replace(/-/g,'+').replace(/_/g,'/');
    const pad=raw+'='.repeat((4-raw.length%4)%4);
    return atob(pad);
  }

  function importFromHash(){
    let hash='';
    try{hash=window.parent&&window.parent!==window?window.parent.location.hash:location.hash}catch(e){hash=location.hash}
    if(!hash.startsWith(HASH_PREFIX))return false;
    try{
      const payload=JSON.parse(decodeBase64Url(hash.slice(HASH_PREFIX.length)));
      if(!payload||typeof payload!=='object'||!payload.records||typeof payload.records!=='object')throw new Error('invalid payload');
      const allowed=knownHealthIds();
      const current=readJSON(RECORD_KEY,{});
      let changed=0;
      Object.entries(payload.records).forEach(([id,input])=>{
        if(allowed&&!allowed.has(id))return;
        if(!input||typeof input!=='object')return;
        const prev=current[id]&&typeof current[id]==='object'?current[id]:{};
        const next=Object.assign({},prev);
        if(['planned','booked','done','skip'].includes(input.status))next.status=input.status;
        if(Object.prototype.hasOwnProperty.call(input,'date')&&(input.date===''||validDate(input.date)))next.date=input.date;
        if(Object.prototype.hasOwnProperty.call(input,'clinic'))next.clinic=String(input.clinic||'').slice(0,80);
        if(Object.prototype.hasOwnProperty.call(input,'memo'))next.memo=String(input.memo||'').slice(0,500);
        next.updatedAt=Date.now();
        current[id]=next;changed++;
      });
      if(!changed)throw new Error('no records');
      saveJSON(RECORD_KEY,current);
      try{
        const p=window.parent&&window.parent!==window?window.parent:window;
        p.history.replaceState(null,'',p.location.pathname+p.location.search);
      }catch(e){try{history.replaceState(null,'',location.pathname+location.search)}catch(_){} }
      if(typeof toast==='function')toast(`검진·접종 기록 ${changed}건을 업데이트했어요`);
      try{if(typeof render==='function')setTimeout(()=>render(true),30)}catch(e){}
      return true;
    }catch(e){
      if(typeof toast==='function')toast('건강기록 가져오기를 완료하지 못했어요');
      return false;
    }
  }

  function patchVersion(){
    document.querySelectorAll('.card .hint').forEach(el=>{
      if(!/버전\s*v(?:24|39|40|41|42|43|44|45)\b/.test(el.textContent||''))return;
      el.innerHTML=el.innerHTML
        .replace(/버전\s*<b([^>]*)>v(?:24|39|40|41|42|43|44|45)<\/b>/,`버전 <b$1>${DISPLAY_VER}</b>`)
        .replace(/버전\s*v(?:24|39|40|41|42|43|44|45)\b/,`버전 ${DISPLAY_VER}`);
    });
  }

  const birthSynced=syncBirthFromApp();
  const imported=importFromHash();
  patchVersion();
  if(birthSynced&&!imported){try{if(typeof render==='function')setTimeout(()=>render(true),30)}catch(e){}}

  window.addEventListener('click',e=>{
    const v=e.target.closest?.('[data-a="checkver"]');if(!v)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    patchVersion();if(typeof toast==='function')toast(`현재 앱 버전 ${DISPLAY_VER}`);
  },true);

  const obs=new MutationObserver(()=>patchVersion());
  obs.observe(document.body,{childList:true,subtree:true});
})();
