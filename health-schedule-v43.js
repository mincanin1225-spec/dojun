(function(){
  'use strict';
  window.__DOJUN_HEALTH_SCHEDULE_V43={
    version:'2026-09-16',
    sources:{
      nhis:'https://www.nhis.or.kr/',
      nip:'https://nip.kdca.go.kr/'
    },
    checkups:[
      {id:'check-01',kind:'건강검진',name:'1차 영유아 건강검진',start:{days:14},end:{days:35},note:'생후 14~35일'},
      {id:'check-02',kind:'건강검진',name:'2차 영유아 건강검진',start:{months:4},end:{months:6},note:'생후 4~6개월'},
      {id:'check-03',kind:'건강검진',name:'3차 영유아 건강검진',start:{months:9},end:{months:12},note:'생후 9~12개월 · 발달선별검사 포함'},
      {id:'check-04',kind:'건강검진',name:'4차 영유아 건강검진',start:{months:18},end:{months:24},note:'생후 18~24개월'},
      {id:'oral-01',kind:'구강검진',name:'1차 영유아 구강검진',start:{months:18},end:{months:29},note:'생후 18~29개월'},
      {id:'check-05',kind:'건강검진',name:'5차 영유아 건강검진',start:{months:30},end:{months:36},note:'생후 30~36개월'},
      {id:'oral-02',kind:'구강검진',name:'2차 영유아 구강검진',start:{months:30},end:{months:41},note:'생후 30~41개월'},
      {id:'check-06',kind:'건강검진',name:'6차 영유아 건강검진',start:{months:42},end:{months:48},note:'생후 42~48개월'},
      {id:'oral-03',kind:'구강검진',name:'3차 영유아 구강검진',start:{months:42},end:{months:53},note:'생후 42~53개월'},
      {id:'check-07',kind:'건강검진',name:'7차 영유아 건강검진',start:{months:54},end:{months:60},note:'생후 54~60개월'},
      {id:'oral-04',kind:'구강검진',name:'4차 영유아 구강검진',start:{months:54},end:{months:65},note:'생후 54~65개월'},
      {id:'check-08',kind:'건강검진',name:'8차 영유아 건강검진',start:{months:66},end:{months:71},note:'생후 66~71개월'}
    ],
    vaccines:[
      {id:'bcg-1',name:'BCG',start:{days:0},end:{days:28},note:'피내용 · 출생 후 4주 이내'},
      {id:'hepb-1',name:'B형간염 1차',start:{days:0},end:{days:0},note:'출생 시'},
      {id:'hepb-2',name:'B형간염 2차',start:{months:1},end:{months:1},note:'생후 1개월'},
      {id:'dtap-1',name:'DTaP 1차',start:{months:2},end:{months:2},note:'생후 2개월'},
      {id:'ipv-1',name:'폴리오(IPV) 1차',start:{months:2},end:{months:2},note:'생후 2개월'},
      {id:'hib-1',name:'Hib 1차',start:{months:2},end:{months:2},note:'생후 2개월'},
      {id:'pcv-1',name:'폐렴구균(PCV) 1차',start:{months:2},end:{months:2},note:'생후 2개월'},
      {id:'rv-1',name:'로타바이러스 1차',start:{months:2},end:{months:2},note:'생후 2개월'},
      {id:'dtap-2',name:'DTaP 2차',start:{months:4},end:{months:4},note:'생후 4개월'},
      {id:'ipv-2',name:'폴리오(IPV) 2차',start:{months:4},end:{months:4},note:'생후 4개월'},
      {id:'hib-2',name:'Hib 2차',start:{months:4},end:{months:4},note:'생후 4개월'},
      {id:'pcv-2',name:'폐렴구균(PCV) 2차',start:{months:4},end:{months:4},note:'생후 4개월'},
      {id:'rv-2',name:'로타바이러스 2차',start:{months:4},end:{months:4},note:'생후 4개월'},
      {id:'hepb-3',name:'B형간염 3차',start:{months:6},end:{months:6},note:'생후 6개월'},
      {id:'dtap-3',name:'DTaP 3차',start:{months:6},end:{months:6},note:'생후 6개월'},
      {id:'ipv-3',name:'폴리오(IPV) 3차',start:{months:6},end:{months:18},note:'생후 6~18개월'},
      {id:'hib-3',name:'Hib 3차',start:{months:6},end:{months:6},note:'생후 6개월'},
      {id:'pcv-3',name:'폐렴구균(PCV) 3차',start:{months:6},end:{months:6},note:'생후 6개월'},
      {id:'rv-3',name:'로타바이러스 3차 (5가 선택 시)',start:{months:6},end:{months:6},note:'5가 백신 선택 시만 · 아니면 해당없음'},
      {id:'mmr-1',name:'MMR 1차',start:{months:12},end:{months:15},note:'생후 12~15개월'},
      {id:'var-1',name:'수두 1회',start:{months:12},end:{months:15},note:'생후 12~15개월'},
      {id:'hib-4',name:'Hib 4차',start:{months:12},end:{months:15},note:'생후 12~15개월'},
      {id:'pcv-4',name:'폐렴구균(PCV) 4차',start:{months:12},end:{months:15},note:'생후 12~15개월'},
      {id:'hepa-1',name:'A형간염 1차',start:{months:12},end:{months:35},note:'생후 12~35개월 안에 시작'},
      {id:'hepa-2',name:'A형간염 2차',start:{months:18},end:{months:41},note:'1차 접종 6개월 이후 · 실제 1차 날짜 기준 확인'},
      {id:'je-ij-1',name:'일본뇌염(불활성화) 1차',start:{months:12},end:{months:23},note:'불활성화 백신 선택 시'},
      {id:'je-ij-2',name:'일본뇌염(불활성화) 2차',start:{months:13},end:{months:24},note:'1차 약 1개월 후 · 실제 1차 날짜 기준 확인'},
      {id:'je-ij-3',name:'일본뇌염(불활성화) 3차',start:{months:24},end:{months:35},note:'생후 24~35개월'},
      {id:'je-live-1',name:'일본뇌염(생백신) 1차',start:{months:12},end:{months:23},note:'생백신 선택 시'},
      {id:'je-live-2',name:'일본뇌염(생백신) 2차',start:{months:24},end:{months:35},note:'생후 24~35개월'},
      {id:'dtap-4',name:'DTaP 4차',start:{months:15},end:{months:18},note:'생후 15~18개월'},
      {id:'dtap-5',name:'DTaP 5차',start:{months:48},end:{months:72},note:'만 4~6세'},
      {id:'ipv-4',name:'폴리오(IPV) 4차',start:{months:48},end:{months:72},note:'만 4~6세'},
      {id:'mmr-2',name:'MMR 2차',start:{months:48},end:{months:72},note:'만 4~6세'},
      {id:'je-ij-4',name:'일본뇌염(불활성화) 4차',start:{months:72},end:{months:72},note:'만 6세 · 불활성화 백신 선택 시'},
      {id:'flu-2627-1',name:'2026-2027절기 인플루엔자 1차',absoluteStart:'2026-09-21',absoluteEnd:'2027-04-30',note:'2026.9.16 일정 조정 반영 · 어린이 무료접종'},
      {id:'flu-2627-2',name:'2026-2027절기 인플루엔자 2차',absoluteStart:'2026-10-19',absoluteEnd:'2027-04-30',note:'2회 접종 대상만 · 1차 후 최소 4주 · 1회 대상이면 해당없음'}
    ]
  };
})();
