function save(){
  try{
    localStorage.setItem('vd2_clients',JSON.stringify(clients));
    localStorage.setItem('vd2_capHours',capHours);
    localStorage.setItem('vd2_rvTarget',rvTarget);
    localStorage.setItem('vd2_rvCost',rvCost);
    const t=new Date();
    document.getElementById('saved-tag').textContent=`${t.getHours()}:${String(t.getMinutes()).padStart(2,'0')} 저장됨`;
    localStorage.setItem('vd_bills',JSON.stringify(bills));
    localStorage.setItem('vd_acts',JSON.stringify(activities));
    localStorage.setItem('vd_partners',JSON.stringify(partners));
  }catch(e){}
}

function loadSaved(){
  try{
    const c=localStorage.getItem('vd2_clients');
    if(c){clients=JSON.parse(c);nid=Math.max(...clients.map(x=>x.id),0)+1;}
    const h=localStorage.getItem('vd2_capHours');
    if(h){capHours=parseInt(h);var capEl=document.getElementById('cap-sl');if(capEl)capEl.value=capHours;var capSv=document.getElementById('cap-sv');if(capSv)capSv.textContent=capHours+'h';}
    const t=localStorage.getItem('vd2_rvTarget');
    if(t){rvTarget=parseInt(t);var rvtEl=document.getElementById('rv-tsl');if(rvtEl)rvtEl.value=rvTarget;var rvtv=document.getElementById('rv-tv');if(rvtv)rvtv.textContent=rvTarget+'만';}
    const co=localStorage.getItem('vd2_rvCost');
    if(co){rvCost=parseInt(co);var rvcEl=document.getElementById('rv-csl');if(rvcEl)rvcEl.value=rvCost;var rvcv=document.getElementById('rv-cv');if(rvcv)rvcv.textContent=rvCost+'만';}
    document.getElementById('saved-tag').textContent='저장 데이터 불러옴';
    const yrg=localStorage.getItem('vd_annual_goals');
    if(yrg){const g=JSON.parse(yrg);
      const e1=document.getElementById('yr-rev-goal');if(e1&&g.rev)e1.value=g.rev;
      const e2=document.getElementById('yr-cli-goal');if(e2&&g.cli)e2.value=g.cli;
      const e3=document.getElementById('yr-con-goal');if(e3&&g.con)e3.value=g.con;
    }
    const tieri=localStorage.getItem('vd_tier');
    if(tieri){tierPeople=JSON.parse(tieri);tierNid=Math.max(...tierPeople.map(function(p){return p.id;}),9)+1;}
    const expb=localStorage.getItem('vd_exp_budget');
    if(expb)expBudgets=JSON.parse(expb);
    const expi=localStorage.getItem('vd_expenses');
    if(expi){expCategories=JSON.parse(expi);expNid=Math.max(...expCategories.map(function(e){return isNaN(e.id)?0:parseInt(e.id);}),9)+1;}
    else expCategories=EXP_DEFAULT.map(function(e){return{id:e.id,name:e.name,color:e.color,months:[...e.months]};});
    const yra=localStorage.getItem('vd_monthly_actuals');
    if(yra){monthlyActuals=JSON.parse(yra);
      monthlyActuals.forEach(function(v,i){const el=document.getElementById('yr-act-'+i);if(el&&v)el.value=v;});
    }
    const chi=localStorage.getItem('vd_channels');if(chi){channelRecs=JSON.parse(chi);chanNid=Math.max(...channelRecs.map(r=>r.id),0)+1;}else channelRecs=[...CHAN_DEFAULT];
    const li=localStorage.getItem('vd_letters');if(li){letters=JSON.parse(li);letterNid=Math.max(...letters.map(b=>b.id),0)+1;}else letters=[...LETTER_DEFAULT];
    const lg=localStorage.getItem('vd_ltGoal');if(lg){letterGoal=parseInt(lg);const el=document.getElementById('lt-goal');if(el)el.value=letterGoal;}
    const bi=localStorage.getItem('vd_bills');if(bi){bills=JSON.parse(bi);billNid=Math.max(...bills.map(b=>b.id),0)+1;}
    const ac=localStorage.getItem('vd_acts');if(ac)activities=JSON.parse(ac);
    const pti=localStorage.getItem('vd_partners');if(pti){partners=JSON.parse(pti);partnerNid=Math.max(...partners.map(function(p){return p.id;}),0)+1;}
    // 구 데이터 필드 정규화 (v32+ 호환)
    clients.forEach(function(cl){
      if(cl.referredBy===undefined)cl.referredBy=0;
      if(cl.contactName===undefined)cl.contactName='';
      if(cl.contactRole===undefined)cl.contactRole='';
      if(cl.expectedClose===undefined)cl.expectedClose='';
      if(!cl.tags)cl.tags=[];
      if(!cl.deliverables)cl.deliverables=[];
      if(!cl.timeLog)cl.timeLog=[];
      if(!cl.contracts)cl.contracts=[];
      if(!cl.stageEnteredAt)cl.stageEnteredAt={};
      if(typeof cl.amount!=='number')cl.amount=Number(cl.amount)||0;
      if(!cl.wonStatus)cl.wonStatus='ongoing';
      if(!cl.npsScore&&cl.npsScore!==0)cl.npsScore=null;
    });
    // 청구서 필드 정규화 (v31+ 호환)
    bills.forEach(function(b){
      if(b.recurring===undefined)b.recurring=false;
      if(!b.invoiceNo)b.invoiceNo='';
      if(typeof b.amount!=='number')b.amount=Number(b.amount)||0;
      if(b.desc===undefined)b.desc='';
      if(b.vatType===undefined)b.vatType='0';
      if(b.note===undefined)b.note='';
    });
  }catch(e){}
}

function exportJSON(){
  const d={clients,capHours,rvTarget,rvCost,exportedAt:new Date().toISOString()};
  const a=document.createElement('a');
  a.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(d,null,2));
  a.download='변덕쟁이들_OS_'+new Date().toLocaleDateString('ko').replace(/\./g,'-').replace(/ /g,'')+'.json';
  a.click();
  try{localStorage.setItem(BACKUP_KEY,String(Date.now()));}catch(e){}
  renderBackupStatus();
  renderBackupBanner();
}

function importJSON(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    let d;
    try{
      d=JSON.parse(e.target.result);
    }catch(err){
      showToast('❌ 파일을 읽을 수 없어요. JSON 형식이 올바른지 확인해주세요.','error');
      input.value='';
      return;
    }
    // 최상위 구조 검증: 변덕쟁이들 OS 내보내기 파일이 맞는지 확인 (clients 배열 필수)
    if(!d||typeof d!=='object'||Array.isArray(d)||!Array.isArray(d.clients)){
      showToast('❌ 변덕쟁이들 OS에서 내보낸 파일이 아닌 것 같아요. 가져오기를 취소했어요.','error');
      input.value='';
      return;
    }
    if(!confirm('현재 데이터를 가져온 파일로 덮어씁니다. 계속할까요?\n(가져오기 직전 상태는 자동으로 스냅샷에 저장되어, 문제가 생기면 상단의 데이터 복원에서 되돌릴 수 있어요.)')){
      input.value='';
      return;
    }
    try{
      saveSnapshot(true);// 가져오기 직전 현재 상태를 강제로 스냅샷 저장 (복구용 안전장치)
      if(d.clients){clients=d.clients;nid=Math.max(...clients.map(x=>x.id),0)+1;}
      if(d.capHours){capHours=d.capHours;document.getElementById('cap-sl').value=capHours;document.getElementById('cap-sv').textContent=capHours+'h';}
      if(d.rvTarget){rvTarget=d.rvTarget;document.getElementById('rv-tsl').value=rvTarget;document.getElementById('rv-tv').textContent=rvTarget+'만';}
      if(d.rvCost!==undefined){rvCost=d.rvCost;document.getElementById('rv-csl').value=rvCost;document.getElementById('rv-cv').textContent=rvCost+'만';}
      renderCRM();save();renderHome();
      showToast('✅ 불러오기 완료!','success');
    }catch(err){
      showToast('❌ 가져오기 중 오류가 발생했어요: '+err.message,'error');
    }
  };
  reader.readAsText(file);input.value='';
}

// ─── 마지막 백업일 표시 & 백업 권유 배너 ───
var BACKUP_KEY='vd_last_export';
var BACKUP_DISMISS_KEY='vd_backup_banner_dismiss';
var BACKUP_NAG_DAYS=7;// 이 기간(일)보다 오래되면 경고/배너 노출
var BACKUP_DISMISS_DAYS=5;// 배너를 닫으면 이 기간 동안은 다시 안 띄움

function daysSince(ts){
  if(!ts)return null;
  return Math.floor((Date.now()-ts)/86400000);
}

function renderBackupStatus(){
  var el=document.getElementById('backup-tag');
  if(!el)return;
  var ts=parseInt(localStorage.getItem(BACKUP_KEY))||0;
  if(!ts){
    el.textContent='백업 기록 없음';
    el.style.color='var(--red)';
    return;
  }
  var d=daysSince(ts);
  var label=d<=0?'오늘':d===1?'어제':d+'일 전';
  el.textContent='마지막 백업: '+label;
  el.style.color=d>BACKUP_NAG_DAYS?'var(--amber)':'var(--text3)';
}

function shouldShowBackupBanner(){
  var ts=parseInt(localStorage.getItem(BACKUP_KEY))||0;
  var isOld=!ts||daysSince(ts)>BACKUP_NAG_DAYS;
  if(!isOld)return false;
  var dismissedAt=parseInt(localStorage.getItem(BACKUP_DISMISS_KEY))||0;
  if(dismissedAt&&daysSince(dismissedAt)<BACKUP_DISMISS_DAYS)return false;
  return true;
}

function renderBackupBanner(){
  var el=document.getElementById('hm-backup-banner');
  if(!el)return;
  if(!shouldShowBackupBanner()){el.innerHTML='';return;}
  el.innerHTML='<div class="home-card" style="border-color:var(--amber);display:flex;align-items:center;gap:12px;margin-bottom:14px">'+
    '<i class="ti ti-cloud-off" style="font-size:20px;color:var(--amber);flex-shrink:0"></i>'+
    '<div style="flex:1;min-width:0">'+
      '<div style="font-size:13px;font-weight:600;margin-bottom:2px">데이터가 이 브라우저에만 저장되고 있어요</div>'+
      '<div style="font-size:12px;color:var(--text2)">최근 백업이 없어요. 지금 파일로 내보내서 안전하게 보관하세요.</div>'+
    '</div>'+
    '<button class="btn btn-primary" onclick="exportJSON()" style="flex-shrink:0;white-space:nowrap"><i class="ti ti-download" style="font-size:12px;margin-right:3px"></i>지금 백업</button>'+
    '<button onclick="dismissBackupBanner()" title="닫기" style="background:none;border:none;cursor:pointer;font-size:16px;color:var(--text3);flex-shrink:0">&#10005;</button>'+
    '</div>';
}

function dismissBackupBanner(){
  try{localStorage.setItem(BACKUP_DISMISS_KEY,String(Date.now()));}catch(e){}
  renderBackupBanner();
}

// ─── 월별 실제 매출 (청구서 기준 자동 계산) ───
// 앱 전체에서 "N월 실제 매출"을 계산하는 단일 기준. 입금 완료(status==='paid') 청구서를
// 발행일(issueDate) 기준으로 해당 연/월에 귀속시켜 합산한다. (단위: 만원, bills와 monthlyActuals 동일 단위)
function getBillsRevenueForMonth(monthIndex,year){
  var yr=(year!==undefined&&year!==null)?year:new Date().getFullYear();
  var monStart=new Date(yr,monthIndex,1);
  var monEnd=new Date(yr,monthIndex+1,1);
  return bills.filter(function(b){
    if(b.status!=='paid'||!b.issueDate)return false;
    var d=new Date(b.issueDate);
    return d>=monStart&&d<monEnd;
  }).reduce(function(s,b){return s+(Number(b.amount)||0);},0);
}

// 청구서 기반 자동 계산값이 있으면 그 값을, 없으면(0이면) 과거에 수동으로 입력해둔
// monthlyActuals[monthIndex] 값을 그대로 보존해서 사용한다. (자동 계산이 우선, 수동 입력은 폴백)
function getActualMonthlyRevenue(monthIndex,year){
  var billsVal=getBillsRevenueForMonth(monthIndex,year);
  if(billsVal>0)return billsVal;
  return (monthlyActuals&&monthlyActuals[monthIndex])||0;
}

function aiPrompt(text){
  navigator.clipboard.writeText(text).then(()=>{
    const t=document.createElement('div');
    t.style.cssText='position:fixed;bottom:20px;right:20px;background:#1a1a18;color:#fff;padding:10px 16px;border-radius:8px;font-size:13px;z-index:999;box-shadow:0 4px 12px rgba(0,0,0,.3)';
    t.textContent='프롬프트 복사됨 — Claude에 붙여넣기 하세요';
    document.body.appendChild(t);setTimeout(()=>t.remove(),3000);
  }).catch(()=>{window.open('https://claude.ai','_blank');});
}

function goToClient(cid){
  switchTab('crm');
  setTimeout(function(){try{openDetail(cid);}catch(e){}},150);
}

function goDlItem(el){
  var tab=el.dataset.dltab;
  var cid=parseInt(el.dataset.dlcid)||0;
  if(!tab)return;
  switchTab(tab);
  if(cid>0&&tab==='crm')setTimeout(function(){try{openDetail(cid);}catch(e){}},150);
}

function switchTab(tab){
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.dataset.tab===tab));
  var activeBtn=document.querySelector('.tab[data-tab="'+tab+'"]');
  if(activeBtn){var navEl=document.getElementById('main-tabs');if(navEl){var bL=activeBtn.offsetLeft;var bW=activeBtn.offsetWidth;var nW=navEl.offsetWidth;if(bL<navEl.scrollLeft||bL+bW>navEl.scrollLeft+nW)navEl.scrollLeft=bL-nW/2+bW/2;}}
  if(tab==='home')renderHome();
  if(tab==='crm')renderCRM();
  if(tab==='cap')renderCapacity();
  if(tab==='rv'){renderRevenue();renderRevenueForecast();}
  if(tab==='prof')renderProf();
  if(tab==='ideas')renderIdeas();
  if(tab==='retro')rtLoad();
  if(tab==='billing')renderBilling();
  if(tab==='letter')renderLetter();
  if(tab==='channel')renderChannels();
  if(tab==='source'){renderSource();renderRecontract();}
  if(tab==='tier')renderTier();
  if(tab==='annual')renderAnnual();
  if(tab==='action'){if(!actionItems.length)abLoad();renderActions();}
  if(tab==='expense')renderExpense();
  if(tab==='quote')renderQuote();
  if(tab==='partner'){renderPartners();initPartnerCalc();}
  if(tab==='memo'){renderMemoList();}
}

function showToast(msg, type='info') {
  const wrap = document.getElementById('toast-container');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(function(){el.style.opacity='0';}, 2800);
  setTimeout(function(){el.remove();}, 3200);
}

function isDark(){var h=document.documentElement.classList;if(h.contains('force-dark'))return true;if(h.contains('force-light'))return false;return matchMedia('(prefers-color-scheme:dark)').matches;}

function applyTheme(mode){
  var h=document.documentElement.classList;h.remove('force-dark','force-light');
  if(mode==='dark')h.add('force-dark');else if(mode==='light')h.add('force-light');
  var b=document.getElementById('theme-btn');if(b)b.innerHTML=isDark()?'&#9790;':'&#9788;';
  try{localStorage.setItem('vd_theme',mode);}catch(e){}
}

function toggleTheme(){applyTheme(isDark()?'light':'dark');}

function initTheme(){
  var s=null;try{s=localStorage.getItem('vd_theme');}catch(e){}
  applyTheme(s||'auto');
  // 소통 채널 select 채우기
  setTimeout(function(){
    var cs=document.getElementById('det-act-ch');
    if(cs&&cs.children.length<=1)cs.innerHTML='<option value="">송수신</option>'+COMM_CHANNELS.map(function(c){return'<option value="'+c.id+'">'+c.icon+' '+c.label+'</option>';}).join('');
  },100);
}

var KB_TABS=['home','crm','cap','rv','prof','ideas','retro','billing','letter','quote'];

function openKbHelp(){var o=document.getElementById('kb-overlay');if(o)o.classList.add('open');}

function closeKbHelp(){var o=document.getElementById('kb-overlay');if(o)o.classList.remove('open');}

document.addEventListener('keydown',function(e){
  if(['INPUT','TEXTAREA','SELECT'].includes((e.target.tagName||'').toUpperCase()))return;
  var k=e.key;
  if((e.ctrlKey||e.metaKey)&&k.toLowerCase()==='k'){e.preventDefault();openSearch();return;}
  if(k==='Escape'){
    closeSearch();
    closeKbHelp();
    try{closeClosureModal();}catch(er){}
    try{closePropModal();}catch(er){}
    var od=document.getElementById('det-overlay');
    if(od&&od.classList.contains('show'))closeDetail();
    return;
  }
  if(k==='?'){e.preventDefault();openKbHelp();return;}
  if(k.toLowerCase()==='d'&&!e.ctrlKey&&!e.metaKey){toggleTheme();return;}
  if(k.toLowerCase()==='n'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();openModal();return;}
  if(/^[0-9]$/.test(k)){var idx=parseInt(k);var tab=KB_TABS[idx===0?9:idx-1];if(tab){e.preventDefault();switchTab(tab);}return;}
});

function scrollTabs(dx){
  var nav=document.getElementById('main-tabs');
  if(nav)nav.scrollBy({left:dx,behavior:'smooth'});
}

function toggleNavDrop(){
  var d=document.getElementById('nav-drop');if(!d)return;
  var open=d.classList.toggle('open');
  // mark active
  var cur=document.querySelector('.tab.active');
  var curTab=cur?cur.dataset.tab:'';
  d.querySelectorAll('.nav-drop-item').forEach(function(b){
    b.classList.toggle('active-item',b.dataset.tab===curTab);
  });
}

function navJump(tab){
  switchTab(tab);
  var d=document.getElementById('nav-drop');if(d)d.classList.remove('open');
  // scroll tab into view
  var btn2=document.querySelector('.tab[data-tab="'+tab+'"]');
  if(btn2){var nav2=document.getElementById('main-tabs');if(nav2)nav2.scrollLeft=btn2.offsetLeft-nav2.offsetWidth/2+btn2.offsetWidth/2;}
}

document.addEventListener('click',function(e){
  var d=document.getElementById('nav-drop');
  if(d&&!d.contains(e.target)&&!e.target.closest('#nav-jump-btn'))d.classList.remove('open');
});

function sfSave(el){
  var cid=parseInt(el.dataset.cid);var field=el.dataset.field;
  var cl=clients.find(function(x){return x.id===cid;});if(!cl)return;
  cl[field]=el.value;save();
}

function sfSaveInt(el){
  var cid=parseInt(el.dataset.cid);var field=el.dataset.field;
  var cl=clients.find(function(x){return x.id===cid;});if(!cl)return;
  cl[field]=parseInt(el.value)||0;save();
}

var SETTINGS_KEY='vd_settings_v2';

function loadSettings(){
  try{
    var s=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}');
    return{bankName:s.bankName||'',bankAcct:s.bankAcct||'',bankHolder:s.bankHolder||'',
      gasUrl:s.gasUrl||getGasUrl()||'',rvTarget:s.rvTarget||rvTarget||200};
  }catch(e){return{bankName:'',bankAcct:'',bankHolder:'',gasUrl:'',rvTarget:200};}
}

function openSettings(){
  var s=loadSettings();
  document.getElementById('st-bank-name').value=s.bankName;
  document.getElementById('st-bank-acct').value=s.bankAcct;
  document.getElementById('st-bank-holder').value=s.bankHolder;
  document.getElementById('st-gas-url').value=s.gasUrl;
  document.getElementById('st-rv-target').value=s.rvTarget;
  document.getElementById('settings-modal').style.display='flex';
}

function closeSettings(){document.getElementById('settings-modal').style.display='none';}

function saveSettings(){
  var s={
    bankName:(document.getElementById('st-bank-name')||{}).value||'',
    bankAcct:(document.getElementById('st-bank-acct')||{}).value||'',
    bankHolder:(document.getElementById('st-bank-holder')||{}).value||'',
    gasUrl:(document.getElementById('st-gas-url')||{}).value||'',
    rvTarget:parseInt((document.getElementById('st-rv-target')||{}).value||200),
  };
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(s));
  if(s.gasUrl)saveGasUrl(s.gasUrl);
  if(s.rvTarget)rvTarget=s.rvTarget;
  closeSettings();
  showToast('✅ 설정 저장됨!');
  renderHome();
}

var gsResults=[],gsFocusIdx=-1;

function openSearch(){
  document.getElementById('gs-overlay').style.display='flex';
  var inp=document.getElementById('gs-input');if(inp){inp.value='';inp.focus();}
  runSearch();
}

function closeSearch(){
  document.getElementById('gs-overlay').style.display='none';
  gsFocusIdx=-1;
}

function runSearch(){
  var q=((document.getElementById('gs-input')||{}).value||'').toLowerCase().trim();
  var el=document.getElementById('gs-results');if(!el)return;
  gsResults=[];
  if(!q){el.innerHTML='<div class="gs-empty">이름, 메모, 청구서를 검색하세요</div>';return;}
  // 클라이언트
  clients.filter(function(c){return c.name.toLowerCase().includes(q)||(c.note||'').toLowerCase().includes(q);}).slice(0,5).forEach(function(c){
    var st=STAGES.find(function(s){return s.id===c.stage;})||{};
    gsResults.push({type:'client',icon:'👤',ttl:c.name,sub:(st.label||c.stage)+' · '+c.amount+'만',action:function(){closeSearch();switchTab('crm');setTimeout(function(){try{openDetail(c.id);}catch(e){}},150);}});
  });
  // 활동 로그
  var actHits=[];
  Object.entries(activities).forEach(function(entry){
    var cid=parseInt(entry[0]),acts=entry[1]||[];
    var cl=clients.find(function(x){return x.id===cid;});
    if(!cl)return;
    acts.filter(function(a){return (a.text||'').toLowerCase().includes(q);}).slice(0,2).forEach(function(a){
      actHits.push({type:'activity',icon:'📝',ttl:a.text.slice(0,40),sub:cl.name+' · '+a.date,action:function(){closeSearch();switchTab('crm');setTimeout(function(){try{openDetail(cid);}catch(e){}},150);}});
    });
  });
  gsResults=gsResults.concat(actHits.slice(0,4));
  // 메모
  memos.filter(function(m){return (m.title||'').toLowerCase().includes(q)||(m.body||'').toLowerCase().includes(q);}).slice(0,3).forEach(function(m){
    gsResults.push({type:'memo',icon:'📋',ttl:m.title||'(제목 없음)',sub:(m.body||'').slice(0,40),action:function(){closeSearch();switchTab('memo');setTimeout(function(){try{openMemo(m.id);}catch(e){}},150);}});
  });
  // 청구서
  bills.filter(function(b){return (b.clientName||'').toLowerCase().includes(q)||(b.invoiceNo||'').toLowerCase().includes(q);}).slice(0,3).forEach(function(b){
    gsResults.push({type:'bill',icon:'💰',ttl:(b.invoiceNo||'')+' '+b.clientName,sub:b.amount+'만 · '+b.status,action:function(){closeSearch();switchTab('billing');}});
  });
  gsFocusIdx=-1;
  if(!gsResults.length){el.innerHTML='<div class="gs-empty">"'+q+'" 검색 결과 없음</div>';return;}
  el.innerHTML=gsResults.map(function(r,i){
    return'<button class="gs-item" data-idx="'+i+'" onclick="selectSearchResult('+i+')">'+'<span class="gs-item-icon">'+r.icon+'</span>'+'<span class="gs-item-main">'+'<div class="gs-item-ttl">'+r.ttl+'</div>'+'<div class="gs-item-sub">'+r.sub+'</div>'+'</span>'+'</button>';
  }).join('');
}

function selectSearchResult(i){
  if(gsResults[i]&&gsResults[i].action)gsResults[i].action();
}

function searchKeyNav(e){
  var items=document.querySelectorAll('.gs-item');
  if(e.key==='ArrowDown'){gsFocusIdx=Math.min(gsFocusIdx+1,items.length-1);}
  else if(e.key==='ArrowUp'){gsFocusIdx=Math.max(gsFocusIdx-1,0);}
  else if(e.key==='Enter'){if(gsFocusIdx>=0)selectSearchResult(gsFocusIdx);return;}
  else if(e.key==='Escape'){closeSearch();return;}
  items.forEach(function(b,i){b.classList.toggle('focused',i===gsFocusIdx);});
  if(items[gsFocusIdx])items[gsFocusIdx].scrollIntoView({block:'nearest'});
}
