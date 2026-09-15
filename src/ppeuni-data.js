(function(root){
  'use strict';
  const DATA={
    child:{name:'도준',birth:'2025-12-05'},
    sourcePolicy:{
      strict:false,
      mode:'provisional_until_ppeuni_schedule',
      message:'앱 개발을 먼저 진행하기 위해 임시 식단을 사용합니다. 『뿐이 토핑 이유식』 실제 스케줄표가 확보되면 같은 데이터 구조로 교체합니다.'
    },
    sources:{
      publisher:{title:'서사원 『뿐이 토핑 이유식』',url:'https://seosawonbooks.com/toppingbabyfood'},
      yes24:{title:'YES24 『뿐이 토핑 이유식』 목차/소개',url:'https://www.yes24.com/product/goods/125183742'},
      ypbooks:{title:'영풍문고 『뿐이 토핑 이유식』 소개',url:'https://www.ypbooks.co.kr/books/202402264746810298'}
    },
    stages:{
      late1:{ageMonths:9,label:'후기 토핑 이유식 1단계',verifiedCatalog:[
        '차조무른밥(7배죽)','6배 잡곡무른밥(중기용 가루)','3배 잡곡무른밥(불린 쌀+잡곡)',
        '소고기미역죽(무른밥)','검은콩','검은콩퓌레','구기자닭죽(무른밥)','밤','팽이버섯','근대','파프리카','김','가지'
      ]},
      late2:{ageMonths:10,label:'후기 토핑 이유식 2단계',verifiedCatalog:[
        '2배 잡곡진밥','아스파라거스','숙주나물','느타리버섯','케일','케일달걀오믈렛','건포도','단호박건포도범벅',
        '새우','새우애호박조림','부추','부추달걀스크램블','연어양파감자볼','삼색 닭안심소시지','소고기라구소스','우엉','게살수프','바나나','오이','샤인머스켓'
      ]},
      late3:{ageMonths:11,label:'후기 토핑 이유식 3단계',verifiedCatalog:[
        '1.5배 잡곡진밥','톳밥(전자레인지)','톳밥(밥솥)','돼지고기','셀러리','매생이달걀찜','쑥갓','오징어','오징어볼','강낭콩밥','콜라비','밥새우주먹밥','그린빈','그린빈스크램블드에그'
      ]}
    },
    planMode:'provisional',
    plan:{}
  };

  const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const meal=(date,slot,protein,v1,v2,fruit)=>({
    source:'provisional',
    sourceRef:`temporary:dev-plan:${date}:${slot}`,
    title:`진밥 + ${protein} + ${v1} + ${v2} + ${fruit}`,
    ingredients:[
      {name:'진밥',grams:80},{name:protein,grams:20},{name:v1,grams:15},{name:v2,grams:15},{name:fruit,grams:20}
    ]
  });
  const cycle=[
    [['소고기','단호박','시금치','사과'],['닭고기','양파','애호박','고구마'],['두부','당근','콜리플라워','복숭아']],
    [['닭고기','단호박','양파','사과'],['소고기','애호박','당근','고구마'],['연어','청경채','양파','복숭아']],
    [['두부','시금치','애호박','사과'],['닭고기','당근','양파','고구마'],['소고기','단호박','비타민채','복숭아']],
    [['소고기','시금치','양파','사과'],['연어','청경채','애호박','고구마'],['닭고기','단호박','당근','복숭아']],
    [['두부','콜리플라워','애호박','사과'],['소고기','당근','양파','고구마'],['닭고기','비타민채','단호박','복숭아']],
    [['연어','청경채','양파','사과'],['닭고기','애호박','당근','고구마'],['소고기','시금치','단호박','복숭아']],
    [['소고기','비타민채','양파','사과'],['두부','당근','애호박','고구마'],['닭고기','단호박','시금치','복숭아']]
  ];
  const start=new Date(2026,8,14);
  for(let i=0;i<42;i++){
    const d=new Date(start);d.setDate(start.getDate()+i);const date=iso(d),c=cycle[i%7];
    DATA.plan[date]={
      breakfast:meal(date,'breakfast',...c[0]),
      lunch:meal(date,'lunch',...c[1]),
      dinner:meal(date,'dinner',...c[2])
    };
  }

  if(typeof module==='object'&&module.exports)module.exports=DATA;
  else root.PpeuniData=DATA;
})(typeof globalThis!=='undefined'?globalThis:this);