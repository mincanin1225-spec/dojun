(function(){
  'use strict';
  if(typeof vShop!=='function'||typeof render!=='function'||!window.__DOJUN_HEALTH_SCHEDULE_V43)return;

  const DISPLAY_VER=window.__DOJUN_RELEASE?.version||'v67';
  const PROFILE_KEY='dj:healthProfile1';
  const RECORD_KEY='dj:healthRecords1';
  const DATA=window.__DOJUN_HEALTH_SCHEDULE_V43;
  const baseShop=vShop;
  const baseRender=render;
  let healthTab='summary';

  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const readJSON=(k,f)=>{try{const x=JSON.parse(localStorage.getItem(k)||'');return x&&typeof x==='object'?x:f}catch(e){return f}};
  const saveJSON=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const profile=()=>Object.assign({dob:'',jeType:'unknown'},readJSON(PROFILE_KEY,{}));
  const records=()=>readJSON(RECORD_KEY,{});
  const toDate=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s||'')))return null;const [y,m,d]=s.split('-').map(Number);const x=new Date(y,m-1,d);return Number.isNaN(x.getTime())?null:x};
  const today=()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate())};
  const ymd=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const fmt=d=>`${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;

  function addAge(dob,age){
    const d=new Date(dob.getFullYear(),dob.getMonth(),dob.getDate());
    if(age?.months){const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+age.months);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last))}
    if(age?.days)d.setDate(d.getDate()+age.days);
    return d;
  }
  function windowFor(item,dob){
    if(item.absoluteStart){let start=toDate(item.absoluteStart),end=toDate(item.absoluteEnd);if(item.id.startsWith('flu-')){const six=addAge(dob,{months:6});if(six>start)start=six}return{start,end}}
    return{start:addAge(dob,item.start||{}),end:addAge(dob,item.end||item.start||{})};
  }
  function visibleVaccine(v,p){
    if(v.id.startsWith('je-ij-'))return p.jeType!=='live';
    if(v.id.startsWith('je-live-'))return p.jeType!=='inactivated';
    return true;
  }
  function allItems(p){
    const dob=toDate(p.dob);if(!dob)return[];
    const c=DATA.checkups.map(x=>Object.assign({},x,windowFor(x,dob)));
    const v=DATA.vaccines.filter(x=>visibleVaccine(x,p)).map(x=>Object.assign({kind:'예방접종'},x,windowFor(x,dob)));
    return c.concat(v);
  }
  function stateOf(id,rs){return rs[id]||{status:'planned',date:'',clinic:'',memo:''}}
  function closed(r){return r.status==='done'||r.status==='skip'}
  function days(a,b){return Math.round((b-a)/86400000)}
  function timing(item,r){
    if(r.status==='done')return'완료';if(r.status==='skip')return'해당없음';
    const now=today();if(now<item.start)return`D-${days(now,item.start)}`;if(now<=item.end)return'지금 기간';return'기록 확인';
  }
  function badgeClass(item,r){const t=timing(item,r);return t==='완료'?'done':t==='지금 기간'?'now':t==='기록 확인'?'late':''}
  function rangeText(item){return ymd(item.start)===ymd(item.end)?fmt(item.start):`${fmt(item.start)} ~ ${fmt(item.end)}`}
  function sortItems(list,rs){return[...list].sort((a,b)=>{const ac=closed(stateOf(a.id,rs))?1:0,bc=closed(stateOf(b.id,rs))?1:0;if(ac!==bc)return ac-bc;return a.start-b.start||a.end-b.end})}
  function nextItems(items,rs,n=5){const now=today();return sortItems(items.filter(x=>!closed(stateOf(x.id,rs))&&x.end>=now),rs).slice(0,n)}

  function injectCss(){
    if(document.getElementById('health-v43-css'))return;
    const s=document.createElement('style');s.id='health-v43-css';s.textContent=`
      .health-entry{width:100%;text-align:left;border:1.5px solid #dfeee7;background:linear-gradient(135deg,#f4fcf8,#fff);cursor:pointer}.health-entry-top{display:flex;align-items:center;justify-content:space-between;gap:12px}.health-entry-title{display:flex;align-items:center;gap:9px;font-weight:900}.health-entry-icon{width:34px;height:34px;border-radius:12px;background:var(--mint-s);display:grid;place-items:center;font-size:18px}
      .health-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:10px 0 12px}.health-tabs button{border:1px solid var(--line);border-radius:12px;padding:9px 5px;background:#fff;font-weight:800;font-size:11.5px;color:var(--ink2)}.health-tabs button.on{background:var(--mint);border-color:var(--mint);color:#fff}
      .health-next{background:linear-gradient(135deg,var(--peach-s),#fff);border:1px solid #f5ddcd}.health-next .big{font-size:16px;font-weight:900}.health-next .date{font-size:12px;color:var(--ink2);margin-top:4px}
      .health-card{background:#fff;border:1px solid var(--line);border-radius:17px;padding:13px;margin:8px 0}.health-card-top{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:start}.health-card h3{font-size:14px;margin:0;line-height:1.35}.health-kind{font-size:10.5px;color:var(--muted);font-weight:800;margin-bottom:3px}.health-range{font-size:11.5px;color:var(--muted);margin-top:4px}.health-badge{font-size:10.5px;font-weight:900;border-radius:99px;padding:5px 8px;background:var(--line2);white-space:nowrap}.health-badge.now{background:var(--peach-s);color:#9b541f}.health-badge.done{background:var(--mint-s);color:#34745b}.health-badge.late{background:#fff1f1;color:#a34646}
      .health-card details{margin-top:10px;border-top:1px dashed var(--line);padding-top:8px}.health-card summary{font-size:11.5px;font-weight:800;color:var(--ink2);cursor:pointer}.health-form{display:grid;gap:7px;margin-top:9px}.health-form .row,.health-profile .row{display:grid;grid-template-columns:1fr 1fr;gap:7px}.health-form input,.health-form select,.health-form textarea,.health-profile input,.health-profile select{width:100%;box-sizing:border-box;border:1px solid var(--line);border-radius:11px;padding:9px;font:inherit;background:#fff}.health-form textarea{min-height:58px;resize:vertical}.health-save{border:0;border-radius:11px;padding:9px;background:var(--mint);color:#fff;font-weight:900}.health-profile{display:grid;gap:8px}.health-source{font-size:10.5px;line-height:1.55;color:var(--muted)}
      @media(max-width:380px){.health-form .row,.health-profile .row{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  function entryHtml(){
    const p=profile(),rs=records();let line='생년월일을 입력하면 검진·접종 시기를 자동 계산해요.';
    if(toDate(p.dob)){const n=nextItems(allItems(p),rs,1)[0];line=n?`다음 일정 · ${n.name} · ${timing(n,stateOf(n.id,rs))}`:'현재 등록된 다음 일정이 없어요.'}
    return`<button class="card health-entry" data-health-open="1"><div class="health-entry-top"><div><div class="health-entry-title"><span class="health-entry-icon">🩺</span><span>건강관리</span></div><div class="hint" style="margin-top:7px">${esc(line)}</div></div><span class="more">검진·접종 ›</span></div></button>`;
  }
  function profileHtml(p){
    return`<div class="sec"><h2>기본 설정</h2><span class="more">이 기기에 저장</span></div><div class="card health-profile"><div class="row"><div class="fld"><label>생년월일</label><input id="healthDob" type="date" value="${esc(p.dob)}"></div><div class="fld"><label>일본뇌염 백신</label><select id="healthJe"><option value="unknown" ${p.jeType==='unknown'?'selected':''}>아직 미정</option><option value="inactivated" ${p.jeType==='inactivated'?'selected':''}>불활성화</option><option value="live" ${p.jeType==='live'?'selected':''}>생백신</option></select></div></div><button class="btn pri" data-health-profile-save="1">설정 저장</button><div class="health-source">완료 여부는 자동으로 추정하지 않아요. 이미 받은 검진·접종은 직접 완료 기록해 주세요.</div></div>`;
  }
  function itemHtml(item,rs){
    const r=stateOf(item.id,rs),st=r.status||'planned';
    return`<article class="health-card"><div class="health-card-top"><div><div class="health-kind">${esc(item.kind)}</div><h3>${esc(item.name)}</h3><div class="health-range">${esc(rangeText(item))}${item.note?` · ${esc(item.note)}`:''}</div>${r.date?`<div class="health-range"><b>기록일 ${esc(r.date)}</b>${r.clinic?` · ${esc(r.clinic)}`:''}</div>`:''}</div><span class="health-badge ${badgeClass(item,r)}">${esc(timing(item,r))}</span></div><details><summary>예약·완료 기록</summary><div class="health-form"><div class="row"><select data-health-status="${esc(item.id)}"><option value="planned" ${st==='planned'?'selected':''}>예정</option><option value="booked" ${st==='booked'?'selected':''}>예약</option><option value="done" ${st==='done'?'selected':''}>완료</option><option value="skip" ${st==='skip'?'selected':''}>해당없음</option></select><input type="date" data-health-date="${esc(item.id)}" value="${esc(r.date||'')}"></div><input data-health-clinic="${esc(item.id)}" placeholder="병원/기관 (선택)" value="${esc(r.clinic||'')}"><textarea data-health-memo="${esc(item.id)}" placeholder="메모 (선택)">${esc(r.memo||'')}</textarea><button class="health-save" data-health-save="${esc(item.id)}">기록 저장</button></div></details></article>`;
  }
  function summaryHtml(items,rs){
    if(!items.length)return'<div class="card"><b>생년월일을 먼저 저장해 주세요.</b><p class="hint">저장하면 검진·접종 날짜를 자동으로 계산해요.</p></div>';
    const up=nextItems(items,rs,5),n=up[0];
    return`${n?`<div class="card health-next"><div class="hint">다음 건강 일정</div><div class="big">${esc(n.name)}</div><div class="date">${esc(rangeText(n))} · <b>${esc(timing(n,stateOf(n.id,rs)))}</b></div></div>`:''}<div class="sec"><h2>다가오는 일정</h2><span class="more">최대 5개</span></div>${up.length?up.map(x=>itemHtml(x,rs)).join(''):'<div class="card"><p class="hint">예정된 일정이 없어요.</p></div>'}`;
  }
  function listHtml(type,items,rs){
    if(!items.length)return'<div class="card"><b>생년월일을 먼저 저장해 주세요.</b></div>';
    const list=type==='checkup'?items.filter(x=>x.kind!=='예방접종'):items.filter(x=>x.kind==='예방접종');
    return sortItems(list,rs).map(x=>itemHtml(x,rs)).join('');
  }
  function healthView(){
    injectCss();const p=profile(),rs=records(),items=allItems(p);
    return`<div class="card" style="padding:10px;margin-bottom:12px"><button class="more" data-health-back="1">‹ 관리로 돌아가기</button></div><div class="sec"><h2>건강검진 · 예방접종</h2><span class="more">공식 일정 기준</span></div><div class="health-tabs"><button class="${healthTab==='summary'?'on':''}" data-health-tab="summary">요약</button><button class="${healthTab==='checkup'?'on':''}" data-health-tab="checkup">건강검진</button><button class="${healthTab==='vaccine'?'on':''}" data-health-tab="vaccine">예방접종</button></div>${healthTab==='summary'?summaryHtml(items,rs):listHtml(healthTab,items,rs)}${profileHtml(p)}<div class="card"><b>공식 일정 확인</b><p class="health-source">국민건강보험공단 영유아 검진과 질병관리청 국가예방접종 일정 기준이에요. 백신 종류·접종력·혼합백신·의학적 상황에 따라 실제 일정은 달라질 수 있으니 의료기관과 공식 기록을 최종 기준으로 확인해 주세요. 인플루엔자는 2026.9.16 질병관리청 일정 조정을 반영했어요.</p><div class="btnrow"><button class="btn" data-health-url="${DATA.sources.nhis}">건강보험</button><button class="btn pri" data-health-url="${DATA.sources.nip}">예방접종도우미</button></div></div>`;
  }

  function patchVersion(){document.querySelectorAll('.card .hint').forEach(el=>{if(!/버전\s*v(?:24|39|40|41|42)\b/.test(el.textContent||''))return;el.innerHTML=el.innerHTML.replace(/버전\s*<b([^>]*)>v(?:24|39|40|41|42)<\/b>/,`버전 <b$1>${DISPLAY_VER}</b>`).replace(/버전\s*v(?:24|39|40|41|42)\b/,`버전 ${DISPLAY_VER}`)})}
  function patchHome(){
    if(typeof tab==='undefined'||tab!=='shop'||window.__mgStage!=='home'||document.getElementById('healthHomeEntry'))return;
    const main=document.querySelector('main');if(!main)return;const wrap=document.createElement('div');wrap.id='healthHomeEntry';wrap.innerHTML=`<div class="sec"><h2>건강관리</h2><span class="more">검진·접종 일정</span></div>${entryHtml()}`;
    const nav=[...main.querySelectorAll('.card')].find(x=>x.querySelector('[data-mg="stock"]'));if(nav)nav.insertAdjacentElement('afterend',wrap);else main.prepend(wrap);
  }
  function apply(){injectCss();patchVersion();patchHome()}

  vShop=function(){return window.__mgStage==='health'?healthView():baseShop()};
  render=function(keep){const r=baseRender(keep);apply();setTimeout(apply,0);setTimeout(apply,120);return r};
  function openExternal(url){try{const w=window.open(url,'_blank','noopener,noreferrer');if(w)return}catch(e){}try{window.top.location.href=url}catch(e){location.href=url}}

  window.addEventListener('click',e=>{const v=e.target.closest?.('[data-a="checkver"]');if(!v)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();patchVersion();if(typeof toast==='function')toast(`현재 앱 버전 ${DISPLAY_VER}`)},true);
  document.addEventListener('click',e=>{
    const op=e.target.closest?.('[data-health-open]');if(op){e.preventDefault();window.__mgStage='health';healthTab='summary';render();return}
    const bk=e.target.closest?.('[data-health-back]');if(bk){e.preventDefault();window.__mgStage='home';render();return}
    const tb=e.target.closest?.('[data-health-tab]');if(tb){e.preventDefault();healthTab=tb.dataset.healthTab||'summary';render(true);return}
    const ur=e.target.closest?.('[data-health-url]');if(ur){e.preventDefault();openExternal(ur.dataset.healthUrl);return}
    const ps=e.target.closest?.('[data-health-profile-save]');if(ps){e.preventDefault();const dob=document.getElementById('healthDob')?.value||'',je=document.getElementById('healthJe')?.value||'unknown';if(!toDate(dob)){if(typeof toast==='function')toast('생년월일을 입력해 주세요');return}saveJSON(PROFILE_KEY,{dob,jeType:['unknown','inactivated','live'].includes(je)?je:'unknown'});if(typeof toast==='function')toast('건강관리 설정을 저장했어요');render(true);return}
    const sv=e.target.closest?.('[data-health-save]');if(sv){e.preventDefault();const id=sv.dataset.healthSave,rs=records();const q=a=>document.querySelector(`[${a}="${id}"]`);const status=q('data-health-status')?.value||'planned',date=q('data-health-date')?.value||'',clinic=q('data-health-clinic')?.value||'',memo=q('data-health-memo')?.value||'';rs[id]={status:['planned','booked','done','skip'].includes(status)?status:'planned',date,clinic:String(clinic).slice(0,80),memo:String(memo).slice(0,500),updatedAt:Date.now()};saveJSON(RECORD_KEY,rs);if(typeof toast==='function')toast('기록을 저장했어요');render(true);return}
  },true);

  let scheduled=false;const obs=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply()})});obs.observe(document.body,{childList:true,subtree:true});
  try{apply()}catch(e){}
})();
