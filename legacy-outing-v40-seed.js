(function(){
  'use strict';
  if(typeof render!=='function')return;

  const STORAGE_KEY='dj:outingPlaces1';
  const DISPLAY_VER='v40';
  const NOW=Date.now();
  const SEED=[
    ['영월강변저류지수변공원','강원특별자치도 영월군 영월읍 방절리 97'],
    ['수산공원','경기도 김포시 대곶면 대명리 482 수산공원'],
    ['한국마사회 원당목장','경기도 고양시 덕양구 원당동 201-79'],
    ['포레스트아웃팅스 송도점','인천광역시 연수구 옥련동 522-18 포레스트아웃팅스 송도점'],
    ['태안물결카라반캠핑장','충청남도 태안군 원북면 방갈리 515-210 물결카라반'],
    ['레이키푸이스토 풀빌라','경기도 가평군 상면 행현리 644 신축 레이키푸이스토 풀빌라'],
    ['남원예촌','전북특별자치도 남원시 금동 103-1 남원예촌'],
    ['롯데리조트 부여','충청남도 부여군 규암면 합정리 578'],
    ['캠프일칠구','경기도 김포시 대곶면 대명리 526-3'],
    ['온더비치 풀빌라&글램핑','인천광역시 옹진군 영흥면 선재리 545-6'],
    ['나드','경기도 여주시 하거동 405'],
    ['핸디로밸리','경기도 고양시 덕양구 관산동 847-129 1층'],
    ['운양캠프캠핑식당','경기도 김포시 운양동 720-1 2층'],
    ['운양캠프','경기도 김포시 운양동 720-1'],
    ['어반티지 글램핑 카라반 펜션','인천광역시 강화군 내가면 고천리 209-2 어반티지 글램핑 카라반'],
    ['원산도자연휴양림','충청남도 보령시 오천면 원산도리 산60'],
    ['포천아트밸리','경기도 포천시 신북면 기지리 282'],
    ['테라판타지아','경기도 포천시 영북면 대회산리 375 테라판타지아'],
    ['물노리베이비 일산벨라시타점','경기도 고양시 일산동구 백석동 1237 벨라시타 본동2층'],
    ['파라다이스시티 씨메르','인천광역시 영종구 운서동 2874'],
    ['아쿠아필드 고양','경기도 고양시 덕양구 동산동 370 스타필드 고양 4층'],
    ['부천자연생태공원','경기도 부천시 원미구 춘의동 381'],
    ['소설원 만수','인천광역시 남동구 만수동 987-9 1,2층'],
    ['야자수캠핑바베큐','경기도 김포시 운양동 837'],
    ['숙성21','강원특별자치도 춘천시 동산면 원창리 233-6 1층 숙성 21'],
    ['인천조탕','인천광역시 영종구 남북동 923'],
    ['가평크루즈','경기도 가평군 설악면 송산리 468 가평크루즈'],
    ['문경철로자전거진남역','경상북도 문경시 마성면 신현리 116-7']
  ];

  const norm=s=>String(s||'').replace(/\s+/g,'').toLowerCase();
  const makeId=(name,i)=>`naver-seed-${String(i+1).padStart(2,'0')}-${norm(name).replace(/[^0-9a-z가-힣]/g,'').slice(0,24)}`;

  function readRaw(){
    try{const x=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');return Array.isArray(x)?x:[]}catch(e){return []}
  }
  function seedPlaces(){
    const existing=readRaw();
    const keys=new Set(existing.map(x=>`${norm(x?.name)}|${norm(x?.address)}`));
    let added=0;
    SEED.forEach(([name,address],i)=>{
      const key=`${norm(name)}|${norm(address)}`;
      if(keys.has(key))return;
      existing.push({
        id:makeId(name,i),name,address,lat:null,lng:null,category:'',space:'혼합',parking:false,stroller:false,nursingRoom:false,diaper:false,
        fee:'',hours:'',closed:'',reservation:false,link:`https://map.naver.com/p/search/${encodeURIComponent(name+' '+address)}`,
        memo:'네이버 지도 공유목록 · 도준아 꼭 가보자',status:'가고싶음',visitDate:'',reaction:'',createdAt:NOW+i,updatedAt:NOW+i
      });
      keys.add(key);added++;
    });
    if(added){
      localStorage.setItem(STORAGE_KEY,JSON.stringify(existing));
      window.__outingPlaces=existing;
    }
    return added;
  }

  function patchVersion(){
    document.querySelectorAll('.card .hint').forEach(el=>{
      if(!/버전\s*v(?:24|39)\b/.test(el.textContent||''))return;
      el.innerHTML=el.innerHTML.replace(/버전\s*<b([^>]*)>v(?:24|39)<\/b>/,`버전 <b$1>${DISPLAY_VER}</b>`).replace(/버전\s*v(?:24|39)\b/,`버전 ${DISPLAY_VER}`);
    });
  }

  const baseRender=render;
  seedPlaces();
  render=function(keep){
    const r=baseRender(keep);
    setTimeout(()=>{patchVersion()},0);
    return r;
  };

  document.addEventListener('click',e=>{
    const ver=e.target.closest?.('[data-a="checkver"]');
    if(!ver)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    patchVersion();if(typeof toast==='function')toast(`현재 앱 버전 ${DISPLAY_VER}`);
  },true);

  try{patchVersion()}catch(e){}
})();
