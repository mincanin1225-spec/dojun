(function(root){
  'use strict';
  var V=root.PpeuniVerifiedV49;
  if(!V||typeof mText!=='function'||typeof sheetDay!=='function'||typeof weekList!=='function')return;

  var oldText=mText, oldObj=typeof mObj==='function'?mObj:null, oldSheetDay=sheetDay, oldWeek=weekList;
  var oldCapture=typeof captureMeal==='function'?captureMeal:null;
  var oldNut=typeof vNut==='function'?vNut:null;
  var oldSheetBatch=typeof sheetBatch==='function'?sheetBatch:null;
  var DAY=86400000;
  var STOCK_ALIAS={'비타민':'비타민채','달걀':'계란','치즈':'아기 치즈'};
  var PLAIN_BASE=new Set(['잡곡무른밥','잡곡진밥']);
  var RAW=new Set(['소고기','닭고기','돼지고기','흰살생선','생선','연어','새우','두부','달걀','게살','오징어','애호박','당근','양파','감자','고구마','단호박','브로콜리','양배추','배추','시금치','청경채','비타민','팽이버섯','느타리버섯','새송이버섯','양송이버섯','무','파프리카','가지','토마토','적채','비트','근대','케일','쑥갓','셀러리','콜라비','콩나물','숙주','오이','아스파라거스','연근','우엉','김','밤','치즈','그린빈']);
  var PHRASES=['달걀그린빈 스크램블에그','케일달걀오믈렛','달걀케일','단호박건포도범벅','새우애호박조림','부추달걀스크램블','달걀부추','연어양파감자볼','닭안심소시지','소고기라구소스','돼지고기수육','오징어볼','쑥갓두부무침','매생이달걀찜','밥새우주먹밥','소고기가지볶음'];

  function dplus(on){
    try{return Math.round((P(on).getTime()-P(V.birth).getTime())/DAY)+1}catch(e){return null}
  }
  function entry(on){
    var d=dplus(on); return d==null?null:(V.byD[d]||null);
  }
  function manual(on,i){
    try{
      var M=fixM(months[mk(on)]),o=M&&M.d&&M.d.ov&&M.d.ov[on];
      if(o&&o[i]!==undefined&&o[i]!==null&&String(o[i]).trim()!=='')return String(o[i]).trim();
      if(isDel(on))return '';
    }catch(e){}
    return null;
  }
  function mealText(m){
    if(!m)return '';
    var a=[]; if(m.base)a.push(m.base);
    if(m.t)a=a.concat(String(m.t).split(/\s+/).filter(Boolean));
    return a.join(' · ');
  }
  function stockName(n){n=String(n||'').trim();return STOCK_ALIAS[n]||n}
  function classified(text){
    var rest=String(text||'').trim(),out=[];
    PHRASES.forEach(function(name){
      if(rest.indexOf(name)>=0){out.push({name:name,recipe:true});rest=rest.replace(name,' ').replace(/\s+/g,' ').trim()}
    });
    rest.split(/\s+/).filter(Boolean).forEach(function(name){out.push({name:name,recipe:!RAW.has(name)})});
    return out;
  }
  function qtyLabels(e,m){
    if(e.stage==='complete')return ['세부 재료량 · 원본 레시피 확인'];
    var out=[];
    if(m.base)out.push(PLAIN_BASE.has(m.base)?m.base+' 100g':m.base+' · 원본 레시피 분량 확인');
    classified(m.t).forEach(function(x){
      if(x.recipe)out.push(x.name+' · 원본 레시피 분량 확인');
      else if(e.stage==='late3')out.push(x.name+' 20~25g');
      else out.push(x.name+' 20g');
    });
    return out;
  }
  function hasVerified(start,count){
    for(var i=0;i<count;i++)if(entry(addD(start,i)))return true;
    return false;
  }

  mText=function(on,i){
    var x=manual(on,i); if(x!==null)return x;
    var e=entry(on); if(e&&e.meals&&e.meals[i])return mealText(e.meals[i]);
    return '';
  };
  root.mText=mText;
  if(oldObj){
    mObj=function(){return null};
    root.mObj=mObj;
  }

  if(oldCapture){
    captureMeal=function(on,slot,log){
      var e=entry(on);
      if(e){
        var idx=['b','l','d'].indexOf(slot);
        if(idx>=0&&!log.mealKey)log.mealKey='ppeuni:'+dplus(on)+':'+idx;
        delete log.formKey;
        return;
      }
      return;
    };
    root.captureMeal=captureMeal;
  }

  sheetDay=function(on){
    var e=entry(on);
    if(!e){
      var d0=P(on);
      open('<h2>'+ (d0.getMonth()+1)+'월 '+d0.getDate()+'일 '+WD[d0.getDay()]+'요일</h2>'
        +'<div class="card"><b>뿐이 원본 식단이 없는 날짜예요.</b><p class="hint" style="margin:6px 0 0">앱에서 임의 식단을 자동 생성하지 않습니다.</p></div>'
        +'<div class="btnrow"><button class="btn" data-a="close">닫기</button></div>');
      return;
    }
    if(isDel(on))return oldSheetDay(on);
    var d=P(on),L=lg(on),A=stage(on),slots=['b','l','d'],labels=['아침','점심','저녁'];
    var meals=e.meals.map(function(m,i){
      var l=L[slots[i]]||{},custom=manual(on,i),title=custom!==null?custom:mealText(m);
      var chips=custom!==null
        ?'<span class="chip sm">직접 수정 메뉴</span>'
        :qtyLabels(e,m).map(function(x){return '<span class="chip sm">'+esc(x)+'</span>'}).join('');
      return '<div class="card" style="margin-bottom:12px">'
        +'<div class="lb" style="font-size:11.5px;font-weight:800;color:var(--mint)">'+labels[i]+'</div>'
        +'<h3 style="margin:5px 0 10px">'+esc(title||'메뉴 없음')+'</h3>'
        +'<div class="chips">'+chips+'</div>'
        +'<div class="rec" style="margin-top:12px">'+REACTIONS.map(function(r){return '<button class="'+r[0]+'" aria-pressed="'+(l.s===r[0])+'" data-a="rec:'+on+'|'+slots[i]+'|'+r[0]+'">'+r[1]+'</button>'}).join('')+'</div>'
        +'<div style="display:flex;gap:10px;margin-top:10px"><div class="fld" style="flex:1"><label>제공량(g)</label><input data-offered="'+slots[i]+'" type="number" min="0" step="0.1" value="'+esc(l.offered_g===undefined?'':l.offered_g)+'"></div>'
        +'<div class="fld" style="flex:1"><label>실제 섭취량(g)</label><input data-eaten="'+slots[i]+'" type="number" min="0" step="0.1" value="'+esc(l.eaten_g===undefined?'':l.eaten_g)+'"></div></div>'
        +'<div class="fld"><input data-memo="'+slots[i]+'" value="'+esc(l.memo||'')+'" placeholder="메모 — 반응, 컨디션, 남긴 이유"></div>'
        +'</div>';
    }).join('');
    open('<h2>'+ (d.getMonth()+1)+'월 '+d.getDate()+'일 '+WD[d.getDay()]+'요일</h2>'
      +'<div class="sub">'+esc(ageTxt(on))+' · '+A.label+' · 뿐이 원본 D+'+dplus(on)+'</div>'
      +'<div class="card" style="margin-bottom:12px"><div class="hint"><b style="color:var(--mint)">사용자 제공 『뿐이 토핑 이유식』 14장 원본 적용</b><br>원본에서 확인되지 않은 영양값·복합메뉴 세부 중량은 임의 계산하지 않아요.</div></div>'
      +meals
      +'<input type="hidden" data-menu="0" value="">'
      +'<div class="btnrow"><button class="btn pri" data-ppeuni-save="'+on+'">섭취 기록 저장</button><button class="btn" data-a="close">닫기</button></div>');
  };
  root.sheetDay=sheetDay;

  weekList=function(start,count){
    count=count||7;
    var t={};
    function add(name,c,g,n){
      name=String(name||'').trim(); if(!name)return;
      if(!t[name])t[name]={c:c,g:0,n:0};
      t[name].g+=Number(g)||0; t[name].n+=Number(n)||0;
    }
    for(var q=0;q<count;q++){
      var on=addD(start,q),e=entry(on);
      if(!e)continue
      e.meals.forEach(function(m){
        if(e.stage==='complete'){add(mealText(m)+' · 원본 레시피','e',0,1);return}
        if(PLAIN_BASE.has(m.base))add('밥 (조리 후)','e',100,0);
        else add(m.base+' · 원본 레시피','e',0,1);
        classified(m.t).forEach(function(x){
          if(x.recipe)add(x.name+' · 원본 레시피','e',0,1);
          else if(e.stage==='late3')add(stockName(x.name)+' · 20~25g','v',0,1);
          else add(stockName(x.name),'v',20,0);
        });
      });
    }
    return t;
  };
  root.weekList=weekList;

  if(oldNut){
    vNut=function(){
      var end=P(addD(weekCur,6)),rows='',verifiedDays=0;
      for(var i=0;i<7;i++){
        var on=addD(weekCur,i),e=entry(on); if(!e)continue; verifiedDays++;
        rows+='<div class="meal" style="display:block"><b>'+ (P(on).getMonth()+1)+'/'+P(on).getDate()+' ('+WD[P(on).getDay()]+')</b>'
          +'<div style="margin-top:6px">'+e.meals.map(function(m,j){return '<div style="display:grid;grid-template-columns:38px 1fr;gap:7px;padding:3px 0"><span class="hint" style="color:var(--mint);font-weight:800">'+['아침','점심','저녁'][j]+'</span><span>'+esc(mealText(m))+'</span></div>'}).join('')+'</div></div>';
      }
      return '<div class="sec"><div class="nav"><button class="rd" data-a="wk:-1">‹</button><b>'+(P(weekCur).getMonth()+1)+'/'+P(weekCur).getDate()+' – '+(end.getMonth()+1)+'/'+end.getDate()+'</b><button class="rd" data-a="wk:1">›</button></div></div>'
        +(verifiedDays
          ?'<div class="sec"><h2>뿐이 원본 식단</h2><span class="more">영양 자동계산 보류</span></div><div class="card">'+rows+'</div><p class="hint" style="margin:10px 2px 0">원본 14장에 없는 영양 수치는 생성하지 않습니다.</p>'
          :'<div class="card"><b>뿐이 원본 식단이 없는 기간이에요.</b><p class="hint" style="margin:6px 0 0">앱에서 임의 식단을 자동 생성하지 않습니다.</p></div>');
    };
    root.vNut=vNut;
  }

  if(oldSheetBatch){
    sheetBatch=function(start,count){
      count=count||7;
      if(!hasVerified(start,count)){open('<h2>뿐이 식단 만들기</h2><div class="card"><b>원본 식단이 없는 기간이에요.</b><p class="hint" style="margin:6px 0 0">자동 생성 식단은 사용하지 않습니다.</p></div><div class="btnrow"><button class="btn" data-a="close">닫기</button></div>');return}
      var html='<h2>뿐이 식단 만들기</h2><p class="hint">원본에서 확인된 분량만 표시합니다. 후기3의 20~25g 범위와 복합메뉴는 실제 사용량 확인 전 자동 재고차감하지 않습니다.</p>';
      for(var q=0;q<count;q++){
        var on=addD(start,q),e=entry(on); if(!e)continue;
        html+='<div class="card" style="margin-bottom:12px"><b>'+ (P(on).getMonth()+1)+'/'+P(on).getDate()+' · D+'+dplus(on)+'</b>';
        e.meals.forEach(function(m,i){
          html+='<div style="margin-top:10px"><div class="lb">'+['아침','점심','저녁'][i]+'</div><b>'+esc(mealText(m))+'</b><div class="chips" style="margin-top:6px">'
            +qtyLabels(e,m).map(function(x){return '<span class="chip sm">'+esc(x)+'</span>'}).join('')+'</div></div>';
        });
        html+='</div>';
      }
      html+='<div class="btnrow"><button class="btn" data-a="close">닫기</button></div>';
      open(html);
    };
    root.sheetBatch=sheetBatch;
  }

  document.addEventListener('click',function(ev){
    var b=ev.target.closest&&ev.target.closest('[data-ppeuni-save]'); if(!b)return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    var on=b.getAttribute('data-ppeuni-save');
    (async function(){
      if(typeof saveFeedbackFields==='function'&&!saveFeedbackFields(on))return;
      await saveM(on); close(); render(); toast('섭취 기록을 저장했어요');
    })().catch(function(){toast('저장 중 오류가 났어요')});
  },true);

  root.__PPEUNI_SCHEDULE_V58={entry:entry,dplus:dplus,source:V.source,minD:V.minD,maxD:V.maxD,policy:'ppeuni_only'};
  try{render(true)}catch(e){}
})(typeof globalThis!=='undefined'?globalThis:this);
