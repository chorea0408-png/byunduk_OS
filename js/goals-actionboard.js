const AB_DEFAULT=[
  /* ─── OS 잔여 기능 ─── */
  {id:'o1',cat:'OS 잔여 기능',title:'클라이언트 검색 & 필터',desc:'이름·단계·서비스유형으로 빠른 검색 — CRM 탭 상단 구현 완료',pri:'p3',time:'t3',prompt:'',done:true},
  {id:'o2',cat:'OS 잔여 기능',title:'지출 카테고리 트래커',desc:'툴비·광고비·교통비·외주비 + 세금 추정 탭 구현 완료',pri:'p3',time:'t3',prompt:'',done:true},
  {id:'o3',cat:'OS 잔여 기능',title:'세금 자동 추정',desc:'지출 트래커 탭 내 원천징수 3.3% + 누진세율 계산 포함 완료',pri:'p3',time:'t3',prompt:'',done:true},
  {id:'o4',cat:'OS 잔여 기능',title:'납기 캘린더 뷰',desc:'청구서·팔로업 마감일 월간 캘린더 — 구현 완료',pri:'p3',time:'t3',prompt:'',done:true},
  {id:'o5',cat:'OS 잔여 기능',title:'데이터 CSV 내보내기',desc:'클라이언트 전체 CSV 다운로드, UTF-8 BOM, 13개 컬럼 — v24 완료',pri:'p3',time:'t3',prompt:'',done:true},
  {id:'o6',cat:'OS 잔여 기능',title:'팬·독자 관계 티어 관리',desc:'T1~T4 티어 분류, 채널·상호작용·메모 기록 탭 구현 완료',pri:'p3',time:'t3',prompt:'',done:true},
  {id:'o7',cat:'OS 잔여 기능',title:'다크모드 토글 버튼',desc:'헤더 토글, force-dark/light, D 단축키 — v18 완료',pri:'p3',time:'t3',prompt:'',done:true},
  {id:'o8',cat:'OS 잔여 기능',title:'키보드 단축키',desc:'N/D/1~9/0/?/Esc — v18 완료',pri:'p3',time:'t3',prompt:'',done:true},

  /* ─── 비즈니스 실행 ─── */
  {id:'b1',cat:'비즈니스 실행',title:'사업자 등록',desc:'9월 이후 정식 런칭 시점에 맞춰 진행 예정. 남대문세무서 / 업종코드 743002',pri:'p2',time:'t2',prompt:'개인사업자 등록 절차 체크리스트를 단계별로 만들어줘. 업종코드 743002, 일반과세자, 남대문세무서 기준.',done:false},
  {id:'b2',cat:'비즈니스 실행',title:'크몽 서비스 페이지 업데이트',desc:'변덕쟁이들 브랜딩 통일, 가격 정책 재정비',pri:'p1',time:'t1',prompt:'변덕쟁이들 브랜딩으로 크몽 서비스 페이지 카피를 써줘. SNS 월정액, 광고기획, 브랜딩 패키지 3종 기준.',done:false},
  {id:'b3',cat:'비즈니스 실행',title:'포트폴리오 SNS 런칭',desc:'변덕쟁이들 자체 인스타 계정 — 작업물이 포트폴리오',pri:'p2',time:'t2',prompt:'변덕쟁이들 인스타 계정 런칭 전략을 세워줘. 첫 9개 피드 구성, 프로필 카피, 첫 달 콘텐츠 캘린더.',done:false},
  {id:'b4',cat:'비즈니스 실행',title:'표준 제안서 템플릿 완성',desc:'클라이언트 정보 자동 입력, 5섹션 제안서 텍스트 생성 및 복사 — v16 완료',pri:'p3',time:'t3',prompt:'',done:true},
  {id:'b5',cat:'비즈니스 실행',title:'클라이언트 온보딩 SOP',desc:'v13에서 8단계 트래커 구현, v19에서 Won 상태분리 — 코드 완료',pri:'p3',time:'t3',prompt:'',done:true},
  {id:'b6',cat:'비즈니스 실행',title:'예비창업패키지 / SBA 신청 검토',desc:'9월 이후 스케일업 시 정부지원사업 활용 여부 판단',pri:'p3',time:'t3',prompt:'예비창업패키지 신청 요건과 일정, 변덕쟁이들 적합성을 분석해줘.',done:false},

  /* ─── 맘대루 콘텐츠 ─── */
  {id:'m1',cat:'맘대루 콘텐츠',title:'변덕레터 주제 캘린더 확정',desc:'6~8월 3개월치 호수별 주제 미리 확정, OS 변덕레터 탭에 입력',pri:'p1',time:'t1',prompt:'변덕레터 6~8월 3개월 호수별 주제 캘린더를 잡아줘. 변덕쟁이들 브랜드 세계관 기반, 총 6호 분량.',done:false},
  {id:'m2',cat:'맘대루 콘텐츠',title:'인스타 콘텐츠 루틴 정착',desc:'화·목·토 주 3회 발행, 카드뉴스/릴스/텍스트 3종 루틴 설계 완료',pri:'p3',time:'t3',prompt:'',done:true},
  {id:'m3',cat:'맘대루 콘텐츠',title:'블로그 SEO 포스팅 시스템',desc:'롱테일 키워드 20개 + 6월 월간 포스팅 플랜 설계 완료',pri:'p3',time:'t3',prompt:'',done:true},
  {id:'m4',cat:'맘대루 콘텐츠',title:'통합 콘텐츠 캘린더',desc:'인스타·블로그·변덕레터·쓰레드 채널 통합 월간 캘린더',pri:'p2',time:'t2',prompt:'인스타/블로그/변덕레터/쓰레드 6월 통합 콘텐츠 캘린더를 만들어줘.',done:false},
  {id:'m5',cat:'맘대루 콘텐츠',title:'근본주의 IP 아카이브',desc:'근본이즘 프레임 기반 글·영상 아카이브, 핵심 자산화',pri:'p3',time:'t3',prompt:'근본이즘 IP 아카이브 구조를 설계해줘. 카테고리 분류, 태깅 체계, Notion 템플릿.',done:false},

  /* ─── Phase 2 준비 ─── */
  {id:'p1x',cat:'Phase 2 준비',title:'Notion CRM DB 실제 구축',desc:'클라이언트·프로젝트·활동 3DB 구조 실제 세팅',pri:'p2',time:'t2',prompt:'변덕쟁이들 Notion CRM DB 세팅 순서를 알려줘. 클라이언트/프로젝트/활동 3개 DB, 관계 설정 포함.',done:false},
  {id:'p2x',cat:'Phase 2 준비',title:'Make.com 자동화 설계',desc:'CRM 단계 이동→알림 / 청구서 납기→리마인더 자동화',pri:'p2',time:'t2',prompt:'변덕쟁이들 Make.com 자동화 플로우를 설계해줘. Notion CRM 트리거 기반 알림 및 리마인더.',done:false},
  {id:'p3x',cat:'Phase 2 준비',title:'Google Sheets 수식 대시보드',desc:'Notion 데이터 → Sheets 자동 집계 → 월별 손익 차트',pri:'p2',time:'t2',prompt:'변덕쟁이들 월별 손익 Google Sheets 대시보드 수식 구조를 설계해줘.',done:false},
  {id:'p4x',cat:'Phase 2 준비',title:'수익예측 AI 어시스트',desc:'파이프라인 3시나리오 예측, 추세 분석, Claude.ai 프롬프트 생성 — v17 완료',pri:'p3',time:'t3',prompt:'',done:true},
  {id:'p5x',cat:'Phase 2 준비',title:'Claude API 연동 인터페이스',desc:'v30에서 AI 프롬프트 생성기 구현 — 클라이언트 데이터 → Claude.ai 분석 요청 자동화',pri:'p2',time:'t4',prompt:'',done:true},

  /* ─── CRM 수업 연계 ─── */
  {id:'s1',cat:'CRM 수업 연계',title:'수업 내용 → OS 적용 주간 루틴',desc:'매주 배운 CRM 개념 1개 → OS에 반영하는 적용 노트 루틴',pri:'p1',time:'t1',prompt:'AI CRM 엔지니어 수업 내용을 변덕쟁이들 OS에 적용하는 주간 루틴을 설계해줘.',done:false},
  {id:'s2',cat:'CRM 수업 연계',title:'Salesforce 객체 모델 → OS 대응표',desc:'v23에서 contactName/contactRole/expectedClose 추가, 쿼 Lead→Opp→Account 매핑 완료 — v25 완료',pri:'p3',time:'t3',prompt:'',done:true},
  {id:'s3',cat:'CRM 수업 연계',title:'성장 프로파일 콘텐츠 제작',desc:'조형준의 CRM 엔지니어 과정 수강기 → 맘대루 콘텐츠 연결',pri:'p2',time:'t2',prompt:'조형준의 AI CRM 엔지니어 과정 수강기를 성장 프로파일 콘텐츠로 기획해줘. 인스타 릴스 + 블로그 연계.',done:false},
  {id:'s4',cat:'CRM 수업 연계',title:'7~8월 수련회 시즌 대응',desc:'우선순위 조정 — 나중에 처리',pri:'p3',time:'t3',prompt:'',done:false},
  {id:'o9',cat:'OS 잔여 기능',title:'클라이언트 태그 & 세그멘테이션',desc:'업종·규모·지역 멀티태그, CRM 필터바 연동, 카드 태그 칩 표시 — v9 완료',pri:'p3',time:'t3',prompt:'',done:true},
  {id:'o10',cat:'OS 잔여 기능',title:'프로젝트별 산출물 체크리스트',desc:'계약별 납품 항목 체크리스트, 완료율 프로그레스바 — v10 완료',pri:'p3',time:'t3',prompt:'',done:true},
  {id:'o11',cat:'OS 잔여 기능',title:'견적 자동화 모듈',desc:'서비스 선택→3티어→옵션→금액 계산→카카오/제안서 텍스트 복사, 16번째 탭 — v11 완료',pri:'p3',time:'t3',prompt:'',done:true},
  {id:'o12',cat:'OS 잔여 기능',title:'프로젝트 종료 체크리스트',desc:'Won 계약 추가 시 모달, 5단계 체크리스트, SOP 패널 배지 — v15 완료',pri:'p3',time:'t3',prompt:'',done:true},
  {id:'b7',cat:'비즈니스 실행',title:'서비스 3티어 가격표 정비',desc:'기본·스탠다드·프리미엄 3티어, 크몽·제안서·인스타 프로필 통일 가격표',pri:'p1',time:'t1',prompt:'변덕쟁이들 서비스 3티어 가격표를 구성해줘. SNS월정액/광고/브랜딩 각 기본·스탠다드·프리미엄.',done:false},
  {id:'b8',cat:'비즈니스 실행',title:'9월 런칭 월별 로드맵',desc:'AI CRM 수업 종료(9월) → 사업자 등록 → 변덕쟁이들 정식 오픈 월별 마일스톤 확정',pri:'p2',time:'t2',prompt:'변덕쟁이들 9월 정식 런칭을 위한 월별 준비 로드맵을 만들어줘. 5월 현재~9월 런칭 기준.',done:false},
  {id:'m6',cat:'맘대루 콘텐츠',title:'제이와 윤의 나들이·일상 블로그 첫 발행',desc:'네이버 블로그 + 인스타 공동 계정 첫 포스팅 — 유나와 함께 일상·데이트·리빙 콘텐츠',pri:'p2',time:'t2',prompt:'제이와 윤의 나들이·일상·리빙·데이트 블로그 첫 발행 계획을 세워줘. 첫 3개 포스팅 주제와 포맷 추천.',done:false},
  /* ─── CRM 흐름 고도화 ─── */
  {id:'c1',cat:'CRM 고도화',title:'파이프라인 전환 속도 & 병목 분석',desc:'stageEnteredAt 필드, 단계별 평균 체류일, 병목 감지, 평균 클로징일 — v12a 완료',pri:'p3',time:'t3',prompt:'',done:true},
  {id:'c2',cat:'CRM 고도화',title:'계약 종료일 재계약 알림',desc:'endDate 필드, D-30/D-7 홈 인사이트 연동 — v12b 완료',pri:'p3',time:'t3',prompt:'',done:true},
  {id:'c3',cat:'CRM 고도화',title:'업셀링 기회 감지',desc:'Won 단일 서비스 탐지, 홈 인사이트 카드 표시 — v12b 완료',pri:'p3',time:'t3',prompt:'',done:true},
  {id:'c4',cat:'CRM 고도화',title:'온보딩 SOP 8단계 트래커',desc:'8단계 체크, 상세 패널 토글 스텝 — v13 완료',pri:'p3',time:'t3',prompt:'',done:true},
  {id:'c5',cat:'CRM 고도화',title:'청구서↔CRM 연동',desc:'getBillBadge, 카드 배지, 상세 패널 연결 청구서 — v14 완료',pri:'p3',time:'t3',prompt:'',done:true},
  /* ─── OS 분석 고도화 ─── */
  {id:'a1',cat:'OS 분석 고도화',title:'유입경로별 LTV 비교 분석',desc:'getSrcStats avgLTV, src-card LTV 행, 채널별 LTV 바차트 — v14 완료',pri:'p3',time:'t3',prompt:'',done:true},
  {id:'a2',cat:'OS 분석 고도화',title:'시간 투입 로그 → 실질 시간당 수익',desc:'클라이언트별 작업시간 기록, 시간당 수익 계산, 예상 대비 효율 분석 — v16 완료',pri:'p3',time:'t3',prompt:'',done:true},
  {id:'a3',cat:'OS 분석 고도화',title:'파이프라인 속도 대시보드',desc:'stageEnteredAt 기반 단계별 평균 체류일, 병목 감지, CRM 접이식 대시보드 — v12a 완료',pri:'p3',time:'t3',prompt:'',done:true},
  /* ─── 실무 편의 ─── */
  {id:'w1',cat:'실무 편의',title:'파트너·레퍼러 관리',desc:'외주 파트너 전용 탭, 역할·단가·상태·클라이언트 연결 — v13 완료',pri:'p3',time:'t3',prompt:'',done:true},
  {id:'w2',cat:'실무 편의',title:'소통 채널 기록 고도화',desc:'COMM_CHANNELS, 채널 배지, 최근 연락 표시 — v18 완료',pri:'p3',time:'t3',prompt:'',done:true},
]

let actionItems=[];

let abNid=100;

let abFilter='all';

function abLoad(){
  try{
    const s=localStorage.getItem('vd_actions');
    if(s){actionItems=JSON.parse(s);abNid=Math.max(...actionItems.map(function(i){return typeof i.id==='number'?i.id:0;}),99)+1;}
    else{actionItems=AB_DEFAULT.map(function(i){return Object.assign({},i);});}
  }catch(e){actionItems=AB_DEFAULT.map(function(i){return Object.assign({},i);});}
}

function abSave(){try{localStorage.setItem('vd_actions',JSON.stringify(actionItems));}catch(e){}}

function abToggleForm(){
  const f=document.getElementById('ab-addform');
  f.classList.toggle('open');
}

function abSetF(f){
  abFilter=f;
  document.querySelectorAll('.ab-fb').forEach(function(b){b.classList.toggle('on',b.dataset.af===f);});
  renderActions();
}

function addAction(){
  const title=document.getElementById('ab-f-title').value.trim();
  if(!title)return;
  actionItems.push({
    id:abNid++,
    cat:document.getElementById('ab-f-cat').value,
    title,
    desc:document.getElementById('ab-f-desc').value.trim(),
    pri:document.getElementById('ab-f-pri').value,
    time:document.getElementById('ab-f-time').value,
    prompt:document.getElementById('ab-f-prompt').value.trim(),
    done:false
  });
  ['ab-f-title','ab-f-desc','ab-f-prompt'].forEach(function(id){document.getElementById(id).value='';});
  abSave();renderActions();
  document.getElementById('ab-addform').classList.remove('open');
}

function abToggleDone(id){
  const item=actionItems.find(function(i){return i.id==id;});
  if(item){item.done=!item.done;abSave();renderActions();}
}

function abDel(id){
  if(!confirm('삭제할까요?'))return;
  actionItems=actionItems.filter(function(i){return i.id!=id;});
  abSave();renderActions();
}

function abChangePri(id,val){
  const item=actionItems.find(function(i){return i.id==id;});
  if(item){item.pri=val;abSave();renderActions();}
}

function abSavePrompt(id,val){
  const item=actionItems.find(function(i){return i.id==id;});
  if(item){item.prompt=val;abSave();}
}

function abTogglePrompt(id){
  const txt=document.getElementById('ab-pt-'+id);
  const btn=document.getElementById('ab-pb-'+id);
  const ic=document.getElementById('ab-pic-'+id);
  if(txt){txt.classList.toggle('open');btn.classList.toggle('open');ic.style.transform=txt.classList.contains('open')?'rotate(180deg)':'';}
}

function abExecPrompt(id){
  const item=actionItems.find(function(i){return i.id==id;});
  const el=document.getElementById('ab-pt-'+id);
  const txt=(item&&item.prompt&&item.prompt.trim())||(el&&el.value.trim())||'';
  if(txt)sendPrompt(txt);else alert('프롬프트를 먼저 입력해주세요.');
}

function renderActions(){
  const catSel=(document.getElementById('ab-catsel')||{}).value||'all';
  const priLbl={p1:'🔴 핵심',p2:'🟡 권장',p3:'🟢 나중에'};
  const timeLbl={t1:'즉시~9월',t2:'9월 이후',t3:'여유 있을 때'};
  const total=actionItems.length;
  const done=actionItems.filter(function(i){return i.done;}).length;
  const pct=total?Math.round(done/total*100):0;
  document.getElementById('ab-plbl').textContent=done+'/'+total+' 완료';
  document.getElementById('ab-ppct').textContent=pct+'%';
  document.getElementById('ab-pgf').style.width=pct+'%';
  function vis(item){
    if(catSel!=='all'&&item.cat!==catSel)return false;
    if(abFilter==='done')return item.done;
    if(abFilter==='all')return true;
    if(abFilter==='p1'||abFilter==='p2'||abFilter==='p3')return item.pri===abFilter&&!item.done;
    return true;
  }
  const cats=[...new Set(actionItems.map(function(i){return i.cat;}))];
  const wrap=document.getElementById('ab-list');
  let html='';let anyVis=false;
  cats.forEach(function(cat){
    const items=actionItems.filter(function(i){return i.cat===cat&&vis(i);});
    if(!items.length)return;
    anyVis=true;
    const catDone=actionItems.filter(function(i){return i.cat===cat&&i.done;}).length;
    const catTotal=actionItems.filter(function(i){return i.cat===cat;}).length;
    html+='<div class="ab-sect"><div class="ab-sect-hd"><i class="ti ti-folder" style="font-size:13px" aria-hidden="true"></i>'+cat+'<span class="ab-sect-pr">'+catDone+'/'+catTotal+' 완료</span></div>';
    const sorted_items=[...items].sort(function(a,b){return a.done-b.done;});
    sorted_items.forEach(function(item){
      const sid=item.id;
      const hasPrompt=item.prompt&&item.prompt.trim();
      const safePrompt=(item.prompt||'').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      html+='<div class="ab-item'+(item.done?' done':'')+'" id="abi-'+sid+'">';
      html+='<div class="ab-hd">';
      html+='<div class="ab-cb'+(item.done?' chk':'')+'" data-id="'+sid+'" onclick="abToggleDone(this.dataset.id)" role="checkbox" aria-checked="'+(item.done?'true':'false')+'"></div>';
      html+='<div class="ab-body">';
      html+='<div class="ab-title">'+item.title+(item.done?'<span class="ab-done-bdg">✓ 완료</span>':'')+'</div>';
      if(item.desc)html+='<div class="ab-desc">'+item.desc+'</div>';
      html+='<div class="ab-meta">';
      html+='<select class="ab-prisel" data-id="'+sid+'" onchange="abChangePri(this.dataset.id,this.value)">';
      ['p1','p2','p3'].forEach(function(p){html+='<option value="'+p+'"'+(item.pri===p?' selected':'')+'>'+priLbl[p]+'</option>';});
      html+='</select>';
      html+='<span class="ab-badge" style="background:var(--bg3);color:var(--text2)">'+timeLbl[item.time]+'</span>';
      html+='</div>';
      html+='<div class="ab-prompt-area">';
      html+='<div class="ab-prompt-hd" data-id="'+sid+'" onclick="abTogglePrompt(this.dataset.id)">';
      html+='<i class="ti ti-terminal" style="font-size:12px;color:var(--text3)" aria-hidden="true"></i>';
      html+='<span class="ab-prompt-lbl">실행 프롬프트'+(hasPrompt?' ✓':' (비어있음)')+'</span>';
      html+='<i class="ti ti-chevron-down ab-prompt-ic" id="ab-pic-'+sid+'" style="font-size:11px;margin-left:auto;color:var(--text3)"></i>';
      html+='</div>';
      html+='<textarea class="ab-ptxt" id="ab-pt-'+sid+'" placeholder="이 액션 진행 시 Claude에게 보낼 프롬프트..." data-id="'+sid+'" oninput="abSavePrompt(this.dataset.id,this.value)">'+safePrompt+'</textarea>';
      html+='<button class="ab-pbtn" id="ab-pb-'+sid+'" data-id="'+sid+'" onclick="abExecPrompt(this.dataset.id)"><i class="ti ti-send" style="font-size:11px" aria-hidden="true"></i>Claude에게 전송</button>';
      html+='</div>';
      html+='</div>';
      html+='<button class="ab-del" data-id="'+sid+'" onclick="abDel(this.dataset.id)" aria-label="삭제"><i class="ti ti-trash" style="font-size:13px" aria-hidden="true"></i></button>';
      html+='</div></div>';
    });
    html+='</div>';
  });
  if(!anyVis)html='<div class="ab-empty">해당 조건의 액션이 없어요.</div>';
  wrap.innerHTML=html;
}

function saveAnnual(){
  try{
    const g={rev:parseInt(document.getElementById('yr-rev-goal').value)||2400,
             cli:parseInt(document.getElementById('yr-cli-goal').value)||20,
             con:parseInt(document.getElementById('yr-con-goal').value)||50};
    localStorage.setItem('vd_annual_goals',JSON.stringify(g));
    monthlyActuals=Array.from({length:12},function(_,i){return parseInt(document.getElementById('yr-act-'+i).value)||0;});
    localStorage.setItem('vd_monthly_actuals',JSON.stringify(monthlyActuals));
  }catch(e){}
}

function renderAnnual(){
  saveAnnual();
  const annRevGoal=parseInt(document.getElementById('yr-rev-goal').value)||2400;
  const annCliGoal=parseInt(document.getElementById('yr-cli-goal').value)||20;
  const annConGoal=parseInt(document.getElementById('yr-con-goal').value)||50;
  const curMon=new Date().getMonth();
  const actuals=Array.from({length:12},function(_,i){return parseInt(document.getElementById('yr-act-'+i).value)||0;});
  const cumActual=actuals.reduce(function(a,v){return a+v;},0);
  const monthlyTarget=Math.round(annRevGoal/12);
  // 남은 달 예측: rvTarget 활용
  const remaining=Math.max(11-curMon,0);
  const projected=cumActual+remaining*rvTarget;
  const projPct=Math.round(Math.min(projected/annRevGoal,2)*100);
  const gap=Math.max(annRevGoal-cumActual,0);
  // KPI
  document.getElementById('yr-k1').textContent=projected+'만';
  document.getElementById('yr-k1').style.color=projected>=annRevGoal?'#1D9E75':'';
  document.getElementById('yr-k1s').textContent='달성 예측 '+projPct+'%';
  document.getElementById('yr-k2').textContent=cumActual+'만';
  document.getElementById('yr-k2s').textContent='입력된 '+actuals.filter(function(v){return v>0;}).length+'개월 합계';
  document.getElementById('yr-k3').textContent=gap?gap+'만':'달성 ✓';
  document.getElementById('yr-k3').style.color=gap===0?'#1D9E75':'';
  document.getElementById('yr-k3s').textContent=gap?'목표까지 남은 금액':'연간 목표 초과';
  document.getElementById('yr-k4').textContent=monthlyTarget+'만';
  // 월별 셀 업데이트
  actuals.forEach(function(v,i){
    const cell=document.getElementById('yr-m-'+i);
    const lbl=document.getElementById('yr-ml-'+i);
    const bar=document.getElementById('yr-mb-'+i);
    if(!cell)return;
    cell.className='yr-month'+(i===curMon?' cur':v>0?' has':'');
    if(lbl)lbl.className='yr-mon-lbl'+(i===curMon?' cur':'');
    if(bar)bar.style.width=Math.min(Math.round(v/monthlyTarget*100),100)+'%';
  });
  // Chart.js
  const dark=isDark();
  const gridC=dark?'rgba(255,255,255,.07)':'rgba(0,0,0,.05)';
  const textC=dark?'#888780':'#73726c';
  const labels=['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  const barColors=actuals.map(function(v,i){
    if(v>0)return '#1D9E75';
    if(i===curMon)return '#EF9F2799';
    return dark?'#2e2e2a':'#eeecea';
  });
  const projData=actuals.map(function(v,i){return v>0||i<curMon?0:rvTarget;});
  const cdata={
    labels:labels,
    datasets:[
      {type:'bar',label:'실적',data:actuals,backgroundColor:barColors,borderRadius:3,stack:'s'},
      {type:'bar',label:'파이프라인 예측',data:projData,backgroundColor:'#EF9F2755',borderRadius:3,stack:'s'},
      {type:'line',label:'월 목표',data:labels.map(function(){return monthlyTarget;}),borderColor:'#7F77DD',borderWidth:1.5,borderDash:[4,4],pointRadius:0,fill:false,tension:0,order:0},
    ]
  };
  const copts={
    responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:true,position:'top',labels:{font:{size:11},boxWidth:10,padding:12,color:textC}},
      tooltip:{callbacks:{label:function(ctx){return ctx.dataset.label+': '+ctx.parsed.y+'만원';}}}},
    scales:{
      x:{grid:{color:gridC},ticks:{color:textC,font:{size:11}}},
      y:{grid:{color:gridC},ticks:{color:textC,font:{size:11},callback:function(v){return v+'만';}},beginAtZero:true}
    },
    animation:{duration:200}
  };
  if(!annualChart){annualChart=new Chart(document.getElementById('yr-canvas'),{type:'bar',data:cdata,options:copts});}
  else{annualChart.data=cdata;annualChart.update('none');}
  // 비교 카드
  const wonCount=clients.filter(function(cl){return cl.stage==='won';}).length;
  const pubContent=ideas.filter(function(i){return i.status==='done';}).length;
  const pubLetter=letters.filter(function(l){return l.status==='pub';}).length;
  const totalContent=pubContent+pubLetter;
  const revPct=Math.min(Math.round(cumActual/annRevGoal*100),100);
  const cliPct=Math.min(Math.round(wonCount/annCliGoal*100),100);
  const conPct=Math.min(Math.round(totalContent/annConGoal*100),100);
  function compareCard(icon,label,actual,goal,pct,color,unit){
    return '<div class="yr-compare"><div class="yr-compare-hd"><i class="ti '+icon+'" style="font-size:14px;color:'+color+'"></i>'+label+'</div>'+
      '<div class="yr-compare-bar-bg"><div class="yr-compare-bar-f" style="width:'+pct+'%;background:'+color+'"></div></div>'+
      '<div class="yr-compare-nums"><span style="font-size:12px;font-weight:500;color:'+color+'">'+actual+unit+'</span>'+
      '<span style="font-size:11px;color:var(--text2)">목표 '+goal+unit+' ('+pct+'%)</span></div></div>';
  }
  document.getElementById('yr-compare').innerHTML=
    compareCard('ti-cash','매출 실적',cumActual,annRevGoal,revPct,'#1D9E75','만')+
    compareCard('ti-users','Won 클라이언트',wonCount,annCliGoal,cliPct,'#185FA5','명')+
    compareCard('ti-writing','콘텐츠 발행',totalContent,annConGoal,conPct,'#993556','건');
}
