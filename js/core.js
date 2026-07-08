const TYPES=[
  {name:'SNS 월정액',    hours:6,  color:'#185FA5',tagBg:'#E6F1FB',tag:'SNS',   type:'MRR',   defaultAmt:30},
  {name:'광고 기획·집행',hours:10, color:'#854F0B',tagBg:'#FAEEDA',tag:'광고',  type:'프로젝트',defaultAmt:100},
  {name:'브랜딩 패키지', hours:8,  color:'#993556',tagBg:'#FBEAF0',tag:'브랜딩',type:'프로젝트',defaultAmt:120},
  {name:'콘텐츠 기획',   hours:5,  color:'#3B6D11',tagBg:'#EAF3DE',tag:'콘텐츠',type:'혼합',  defaultAmt:50},
  {name:'단발 프로젝트', hours:3,  color:'#5F5E5A',tagBg:'#F1EFE8',tag:'기타',  type:'단발',  defaultAmt:30},
];
const SOURCES=[
  {id:'kmong',    label:'크몽',      color:'#185FA5', bg:'#E6F1FB'},
  {id:'referral', label:'지인 소개',  color:'#1D9E75', bg:'#E1F5EE'},
  {id:'sns',      label:'SNS',       color:'#993556', bg:'#FBEAF0'},
  {id:'direct',   label:'직접 연락',  color:'#854F0B', bg:'#FAEEDA'},
  {id:'newsletter',label:'뉴스레터', color:'#534AB7', bg:'#EEEDFE'},
  {id:'etc',      label:'기타',      color:'#5F5E5A', bg:'#F1EFE8'},
];
const PRESET_TAGS=[
  {id:'food',    label:'음식·카페',   color:'#854F0B',bg:'#FAEEDA'},
  {id:'beauty',  label:'뷰티·네일',   color:'#993556',bg:'#FBEAF0'},
  {id:'fitness', label:'헬스·스포츠', color:'#1D9E75',bg:'#E1F5EE'},
  {id:'retail',  label:'소매·쇼핑',   color:'#534AB7',bg:'#EEEDFE'},
  {id:'service', label:'서비스업',     color:'#185FA5',bg:'#E6F1FB'},
  {id:'small',   label:'소규모',       color:'#5F5E5A',bg:'#F1EFE8'},
  {id:'medium',  label:'중규모',       color:'#3B6D11',bg:'#EAF3DE'},
  {id:'seoul',   label:'서울',         color:'#185FA5',bg:'#E6F1FB'},
  {id:'gyeonggi',label:'경기·수도권',  color:'#854F0B',bg:'#FAEEDA'},
  {id:'local',   label:'지방',         color:'#5F5E5A',bg:'#F1EFE8'},
];
let srcChart=null;
let annualChart=null;
let monthlyActuals=new Array(12).fill(0);
const EXP_DEFAULT=[
  {id:'tools',  name:'툴·구독비',  color:'#185FA5', months:new Array(12).fill(0)},
  {id:'ads',    name:'광고비',     color:'#993556', months:new Array(12).fill(0)},
  {id:'travel', name:'교통비',     color:'#3B6D11', months:new Array(12).fill(0)},
  {id:'outsrc', name:'외주비',     color:'#854F0B', months:new Array(12).fill(0)},
];
let expCategories=[],expNid=10,expChart=null,expBudgets={};


const CHANNELS=[
  {id:'ig', label:'인스타그램', color:'#993556', bg:'#FBEAF0'},
  {id:'lt', label:'변덕레터',  color:'#534AB7', bg:'#EEEDFE'},
  {id:'bl', label:'블로그',    color:'#3B6D11', bg:'#EAF3DE'},
  {id:'yt', label:'유튜브',    color:'#A32D2D', bg:'#FCEBEB'},
  {id:'th', label:'쓰레드',    color:'#185FA5', bg:'#E6F1FB'},
];
const CHAN_DEFAULT=[
  {id:1,date:'2026-03-01',ig:124,lt:0,  bl:210,yt:0, th:45},
  {id:2,date:'2026-04-01',ig:167,lt:23, bl:247,yt:0, th:63},
  {id:3,date:'2026-05-01',ig:203,lt:38, bl:289,yt:12,th:81},
];
let channelRecs=[],chanNid=10,chanChart=null;
const LETTER_ST=[
  {id:'draft',label:'초안 중',  color:'#5F5E5A',bg:'#F1EFE8'},
  {id:'ready',label:'발행 예정',color:'#BA7517',bg:'#FAEEDA'},
  {id:'pub',  label:'발행 완료',color:'#1D9E75',bg:'#E1F5EE'},
];
const LETTER_DEFAULT=[
  {id:1,title:'변덕쟁이들 창업기 — 기사디를 나온 이유',date:'2026-04-10',status:'pub',subscribers:23,openRate:68.2,note:'첫 호. 반응 좋았음.'},
  {id:2,title:'소상공인 SNS 운영에서 흔히 하는 실수 3가지',date:'2026-04-24',status:'pub',subscribers:31,openRate:61.5,note:'공유가 많았던 편.'},
  {id:3,title:'브랜딩이란 뭔가요? — 변덕쟁이 식 정의',date:'2026-05-08',status:'pub',subscribers:38,openRate:57.8,note:''},
  {id:4,title:'AI CRM 수업 첫 날 — 비개발자의 솔직 후기',date:'2026-05-22',status:'ready',subscribers:0,openRate:0,note:'발행 예정'},
  {id:5,title:'근본주의 마케팅 — 트렌드 피로감 시대에 살아남기',date:'',status:'draft',subscribers:0,openRate:0,note:'작성 중'},
];
let letters=[],letterNid=10;
const BILL_STATUSES=[
  {id:'draft',  label:'미발행',   color:'#5F5E5A',bg:'#F1EFE8'},
  {id:'issued', label:'발행 완료',color:'#BA7517',bg:'#FAEEDA'},
  {id:'paid',   label:'입금 완료',color:'#1D9E75',bg:'#E1F5EE'},
  {id:'overdue',label:'연체',     color:'#E24B4A',bg:'#FCEBEB'},
];
const WON_STATUS=[{id:'ongoing',label:'진행 중',color:'#1D9E75',bg:'#E1F5EE'},{id:'completed',label:'완료',color:'#534AB7',bg:'#EEEDFE'},{id:'paused',label:'일시정지',color:'#D97706',bg:'#FEF3C7'}];
const LOST_REASONS=['가격 문제','타이밍 안 맞음','경쟁사 선택','연락 두절','서비스 불일치','예산 없음','기타'];
const STAGES=[
  {id:'lead',        label:'🌱 Lead',       prob:.10,color:'#3B6D11',bg:'#EAF3DE'},
  {id:'discovery',   label:'💬 Discovery',  prob:.30,color:'#185FA5',bg:'#E6F1FB'},
  {id:'proposal',    label:'📄 Proposal',   prob:.60,color:'#854F0B',bg:'#FAEEDA'},
  {id:'negotiation', label:'🤝 Negotiation',prob:.85,color:'#993556',bg:'#FBEAF0'},
  {id:'won',         label:'✅ Won',         prob:1.0,color:'#0F6E56',bg:'#E1F5EE'},
  {id:'lost',        label:'❌ Lost',        prob:0,  color:'#5F5E5A',bg:'#F1EFE8'},
];
const STAGE_ORDER=['lead','discovery','proposal','negotiation','won','lost'];

const TASK_TAGS=[
  {id:'영업',  bg:'#FBEAF0',col:'#993556'},
  {id:'실행',  bg:'#E6F1FB',col:'#185FA5'},
  {id:'맘대루',bg:'#EEEDFE',col:'#534AB7'},
  {id:'기타',  bg:'#F0F0EE',col:'#5F5E5A'},
];
var _tasks=[],_taskNid=1;

const ID_STATUSES=[
  {id:'idea', label:'💡 아이디어',next:'draft',nextLbl:'초안 시작',color:'#534AB7',bg:'#EEEDFE',tc:'#3C3489'},
  {id:'draft',label:'✏️ 초안 중', next:'done', nextLbl:'발행 완료',color:'#BA7517',bg:'#FAEEDA',tc:'#633806'},
  {id:'done', label:'✅ 발행 완료',next:null,   nextLbl:null,      color:'#1D9E75',bg:'#E1F5EE',tc:'#085041'},
  {id:'hold', label:'⏸️ 보류',    next:'idea', nextLbl:'재활성화', color:'#5F5E5A',bg:'#F1EFE8',tc:'#444441'},
];
const ID_CHANNELS=[
  {id:'인스타',   color:'#993556',bg:'#FBEAF0',tc:'#72243E'},
  {id:'변덕레터', color:'#534AB7',bg:'#EEEDFE',tc:'#3C3489'},
  {id:'블로그',   color:'#3B6D11',bg:'#EAF3DE',tc:'#27500A'},
  {id:'유튜브',   color:'#A32D2D',bg:'#FCEBEB',tc:'#791F1F'},
  {id:'쓰레드',   color:'#185FA5',bg:'#E6F1FB',tc:'#0C447C'},
];
const ID_DEFAULT=[
  {id:1,title:'소상공인 브랜딩 실전 팁 5가지',   ch:'인스타',  tag:'마케팅', status:'idea', date:'2026-05-18'},
  {id:2,title:'변덕쟁이들 런칭 스토리 전말',      ch:'변덕레터',tag:'변덕랩', status:'idea', date:'2026-05-19'},
  {id:3,title:'AI CRM 수업 1주차 후기',          ch:'블로그',  tag:'AI',    status:'draft',date:'2026-05-20'},
  {id:4,title:'트렌드 피로감 시대의 브랜딩 전략', ch:'변덕레터',tag:'트렌드', status:'idea', date:'2026-05-20'},
  {id:5,title:'내가 기사디를 나온 진짜 이유',     ch:'유튜브',  tag:'변덕랩', status:'hold', date:'2026-05-15'},
  {id:6,title:'소상공인 SNS 운영 실수 TOP 5',    ch:'인스타',  tag:'소상공인',status:'draft',date:'2026-05-21'},
];

let clients=[
  {id:1,name:'해피쿡 분식', typeIdx:0,amount:30, stage:'won',        note:'',tags:['food','small','seoul'],stageEnteredAt:{lead:'2026-05-01',discovery:'2026-05-05',proposal:'2026-05-10',negotiation:'2026-05-15',won:'2026-05-20'},sopDone:[true,true,true,true,true,true,true,true],timeLog:[],closureChecks:['portfolio','review'],wonStatus:'completed',npsScore:5,lostReason:'',reactivateDate:'',deliverables:[{id:1,text:'SNS 계정 분석 리포트',done:true,dueDate:''},{id:2,text:'5월 콘텐츠 발행 완료',done:true,dueDate:''},{id:3,text:'6월 운영 계획서 전달',done:false,dueDate:'2026-06-05'}]},
  {id:2,name:'강남 네일샵', typeIdx:1,amount:100,stage:'negotiation',note:'',tags:['beauty','medium','seoul'],stageEnteredAt:{lead:'2026-05-08',discovery:'2026-05-13',proposal:'2026-05-18',negotiation:'2026-05-23'},sopDone:[true,true,true,false,false,false,false,false],timeLog:[],closureChecks:[],wonStatus:'',npsScore:null,lostReason:'',reactivateDate:'',deliverables:[{id:1,text:'경쟁사 분석 자료',done:true,dueDate:''},{id:2,text:'광고 크리에이티브 시안 3종',done:false,dueDate:'2026-06-10'},{id:3,text:'캠페인 집행 보고서',done:false,dueDate:'2026-06-30'}]},
  {id:3,name:'미미 한복',   typeIdx:2,amount:120,stage:'proposal',   note:'',tags:['service','medium','seoul'],stageEnteredAt:{lead:'2026-05-14',discovery:'2026-05-19',proposal:'2026-05-22'},sopDone:[true,true,false,false,false,false,false,false],timeLog:[],closureChecks:[],wonStatus:'',npsScore:null,lostReason:'',reactivateDate:'',deliverables:[{id:1,text:'브랜드 아이덴티티 가이드',done:false,dueDate:'2026-07-01'},{id:2,text:'로고·컬러 시스템 확정',done:false,dueDate:'2026-06-20'}]},
  {id:4,name:'카페 온도',   typeIdx:3,amount:50, stage:'discovery',  note:'',tags:['food','small','gyeonggi'],stageEnteredAt:{lead:'2026-05-20',discovery:'2026-05-24'},sopDone:[true,false,false,false,false,false,false,false],timeLog:[],closureChecks:[],wonStatus:'',npsScore:null,lostReason:'',reactivateDate:'',contactName:'',contactRole:'',expectedClose:'',deliverables:[]},
  {id:5,name:'선릉 헬스장', typeIdx:0,amount:30, stage:'lead',       note:'',tags:['fitness','small','seoul'],stageEnteredAt:{lead:'2026-05-25'},sopDone:[],timeLog:[],closureChecks:[],wonStatus:'',npsScore:null,lostReason:'',reactivateDate:'',contactName:'',contactRole:'',expectedClose:'',deliverables:[]},
];
let nid=6,capHours=20,rvTarget=200,rvCost=30;
let rvExtra={won:0,neg:0,prop:0,disc:0};
let rvChart=null,profChart=null;
let profMode='all';
let ideas=[],idNid=10,idFilterSt='all',idFilterCh='all';
let bills=[],billNid=1,activities={},detClientId=null,letterGoal=100;
let homeTasks=new Set();
let rtCur=new Date(),rtTimer=null;

const PARTNER_ROLES=[
  {id:'designer',label:'디자이너',color:'#185FA5',bg:'#E6F1FB'},
  {id:'video',label:'영상편집',color:'#534AB7',bg:'#EEEDFE'},
  {id:'copy',label:'카피라이터',color:'#1D9E75',bg:'#E1F5EE'},
  {id:'photo',label:'포토그래퍼',color:'#854F0B',bg:'#FAEEDA'},
  {id:'dev',label:'개발자',color:'#3B6D11',bg:'#EAF3DE'},
  {id:'marketer',label:'마케터',color:'#993556',bg:'#FBEAF0'},
  {id:'etc',label:'기타',color:'#5F5E5A',bg:'#F1EFE8'},
];
const PARTNER_STATUS=[
  {id:'active',label:'협업 가능',dot:'#1D9E75'},
  {id:'standby',label:'간헐적',dot:'#D97706'},
  {id:'inactive',label:'비활성',dot:'#9CA3AF'},
];
let partners=[],partnerNid=1,partnerEditId=null;
