(function(root){
  'use strict';
  const DATA={
    child:{name:'도준',birth:'2025-12-05'},
    sourcePolicy:{
      strict:true,
      message:'식단은 확인된 『뿐이 토핑 이유식』 원문 행만 사용합니다. 확인되지 않은 메뉴는 자동 생성하지 않습니다.'
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
    /*
      날짜별 식단은 책/저자 공개 식단표에서 '그 날짜 행'을 실제로 확인한 뒤에만 넣습니다.
      과거 ChatGPT가 생성한 30일 캘린더, 영양 추정식단, 임의 조합은 여기로 가져오지 않습니다.
      meal schema:
      {
        source:'ppeuni_verified', sourceRef:'...', title:'...',
        ingredients:[{name:'양파',grams:20}, ...]
      }
    */
    plan:{}
  };
  if(typeof module==='object'&&module.exports)module.exports=DATA;
  else root.PpeuniData=DATA;
})(typeof globalThis!=='undefined'?globalThis:this);