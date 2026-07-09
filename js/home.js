function buildMonths(){
  var now=new Date(),result=[];
  for(var i=0;i<6;i++){
    var d=new Date(now.getFullYear(),now.getMonth()+i,1);
    result.push((d.getMonth()+1)+'월');
  }
  return result;
}

var MONTHS=buildMonths();

function loadTasks(){
  try{var r=localStorage.getItem('vd_home_tasks');if(r){var d=JSON.parse(r);_tasks=d.items||[];_taskNid=d.nid||(_tasks.length?Math.max(..._tasks.map(function(t){return t.id;}))+1:1);}}catch(e){}
}

function saveTasks(){try{localStorage.setItem('vd_home_tasks',JSON.stringify({items:_tasks,nid:_taskNid}));}catch(e){}}

function addHomeTask(){
  var inp=document.getElementById('ht-new-inp'),sel=document.getElementById('ht-new-tag');
  if(!inp||!inp.value.trim())return;
  var tag=sel?sel.value:'기타',tg=TASK_TAGS.find(function(t){return t.id===tag;})||TASK_TAGS[3];
  _tasks.push({id:_taskNid++,text:inp.value.trim(),tag:tag,bg:tg.bg,col:tg.col,done:false});
  inp.value='';saveTasks();renderHomeTasks();
}

function toggleHomeTask(id){
  var t=_tasks.find(function(x){return x.id===id;});if(t){t.done=!t.done;saveTasks();renderHomeTasks();}
}

function deleteHomeTask(id){_tasks=_tasks.filter(function(x){return x.id!==id;});saveTasks();renderHomeTasks();}

function renderHome(){
  const now=new Date();const h=now.getHours();
  const gs=['새벽이네요, 형준','좋은 아침이에요, 형준','안녕하세요, 형준','수고하셨어요, 형준'];
  document.getElementById('hm-greeting').textContent=gs[h<5?0:h<12?1:h<18?2:3];
  document.getElementById('hm-date').textContent=now.toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
  renderDday();
  const dim=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
  const dom=now.getDate();const mpct=Math.round(dom/dim*100);
  document.getElementById('hm-month').textContent=now.toLocaleDateString('ko-KR',{month:'long'});
  document.getElementById('hm-mpct').textContent=`${dom}/${dim}일 · ${mpct}%`;
  document.getElementById('hm-mfill').style.width=mpct+'%';
  const urgMap={negotiation:{dot:'#E24B4A',bg:'#FCEBEB',col:'#791F1F',lbl:'오늘',act:'협상 다음 단계 확인'},proposal:{dot:'#BA7517',bg:'#FAEEDA',col:'#633806',lbl:'내일',act:'제안서 피드백 체크'},discovery:{dot:'#1D9E75',bg:'#E1F5EE',col:'#085041',lbl:'이번 주',act:'첫 미팅 일정 확인'}};
  const urgent=clients.filter(c=>urgMap[c.stage]);
  document.getElementById('hm-alerts').innerHTML=urgent.length
    ?urgent.map(c=>{const u=urgMap[c.stage];const st=STAGES.find(s=>s.id===c.stage);return`<div class="al-item al-item-link" data-cid="${c.id}" onclick="goToClient(parseInt(this.dataset.cid))" title="클릭하면 상세 패널이 열려요"><div class="al-dot" style="background:${u.dot}"></div><div style="flex:1"><div class="al-nm">${c.name}</div><div class="al-ac">${u.act} · ${st?st.label:''}</div></div><span class="al-bdg" style="background:${u.bg};color:${u.col}">${u.lbl}</span><i class="ti ti-chevron-right" style="font-size:11px;color:var(--text3);margin-left:4px;flex-shrink:0"></i></div>`;}).join('')
    :'<div style="font-size:12px;color:var(--text2);padding:6px 0">오늘 팔로업 항목이 없어요.</div>';
  var now14=new Date();now14.setHours(0,0,0,0);var xAlerts='';
  clients.filter(function(c){return c.stage==='won'&&(c.wonStatus||'ongoing')==='ongoing';}).forEach(function(c){
    var aa=(activities[c.id]||[]);var ref=aa.length?new Date(aa[aa.length-1].date):(c.stageEnteredAt&&c.stageEnteredAt.won?new Date(c.stageEnteredAt.won):null);
    if(ref){var df=Math.ceil((now14-ref)/(1000*60*60*24));if(df>=14)xAlerts+='<div class="al-item al-item-link" data-xid="'+c.id+'" onclick="goToClient(parseInt(this.dataset.xid))" title="클릭하면 상세 패널이 열려요"><span class="fu-bdg fu-urg">'+df+'일+</span><span class="al-nm" style="flex:1">'+c.name+'</span><span class="al-ac">연락 없음 — 파악 필요</span><i class="ti ti-chevron-right" style="font-size:11px;color:var(--text3);margin-left:6px"></i></div>';}
  });
  clients.filter(function(c){return c.stage==='lost'&&c.reactivateDate;}).forEach(function(c){
    var rd=new Date(c.reactivateDate);rd.setHours(0,0,0,0);var df2=Math.ceil((rd-now14)/(1000*60*60*24));
    if(df2<=7)xAlerts+='<div class="al-item"><span class="fu-bdg fu-soon">재활성</span><span class="al-nm">'+c.name+'</span><span class="al-ac">'+(df2<=0?'오늘':'D-'+df2)+' 재연락 예정</span></div>';
  });
  if(xAlerts){var ae=document.getElementById('hm-alerts');if(ae)ae.innerHTML+=xAlerts;}
  const amts=getPipelineAmts({won:0,neg:0,prop:0,disc:0});
  const nW=amts.neg*.85,pW=amts.prop*.60,dW=amts.disc*.30;
  const thisMonth=amts.won+nW,net=thisMonth-rvCost,weighted=nW+pW+dW;
  const tgtPct=Math.min(Math.round(thisMonth/rvTarget*100),100);
  document.getElementById('hm-k1').textContent=Math.round(thisMonth)+'만';
  // 전월 대비 트렌드
  (function(){
    var lastActual=monthlyActuals?monthlyActuals.filter(function(v){return v>0;}).slice(-1)[0]:0;
    var tEl=document.getElementById('hm-k1-trend');if(!tEl)return;
    if(!lastActual){tEl.className='kpi-trend flat';tEl.textContent='';return;}
    var diff=Math.round(thisMonth-lastActual);
    if(diff>0){tEl.className='kpi-trend up';tEl.innerHTML='&#9650; 전월 대비 +'+diff+'만';}
    else if(diff<0){tEl.className='kpi-trend down';tEl.innerHTML='&#9660; 전월 대비 '+diff+'만';}
    else{tEl.className='kpi-trend flat';tEl.innerHTML='&#8212; 전월과 동일';}
  })();
  document.getElementById('hm-k1').style.color=thisMonth>=rvTarget?'var(--teal)':'';
  document.getElementById('hm-k1s').textContent=`목표 ${rvTarget}만 · ${tgtPct}%`;
  document.getElementById('hm-k1bar').style.width=tgtPct+'%';
  document.getElementById('hm-k2').textContent=(net>=0?'+':'')+Math.round(net)+'만';
  document.getElementById('hm-k2').style.color=net<0?'var(--red)':'';
  document.getElementById('hm-k2s').textContent=`고정비 ${rvCost}만 차감`;
  document.getElementById('hm-k3').textContent=Math.round(weighted)+'만';
  const active=clients.filter(c=>c.stage==='won');
  const usedH=active.reduce((a,c)=>a+(TYPES[c.typeIdx]||TYPES[0]).hours,0);
  const capPct=Math.round(Math.min(usedH/capHours,1)*100);
  const capCol=capPct<70?'var(--teal)':capPct<90?'var(--amber)':'var(--red)';
  document.getElementById('hm-k4').textContent=capPct+'%';document.getElementById('hm-k4').style.color=capCol;
  document.getElementById('hm-k4s').textContent=`${usedH}h / ${capHours}h 사용`;
  document.getElementById('hm-k4bar').style.cssText=`height:3px;border-radius:2px;background:${capCol};width:${capPct}%`;
  const leadAmt=clients.filter(c=>c.stage==='lead').reduce((a,c)=>a+(Number(c.amount)||0),0);
  const pipeData=[
    {label:'✅ Won',amt:amts.won,color:'#1D9E75',prob:1.00},
    {label:'🤝 Negotiation',amt:amts.neg,color:'#993556',prob:.85},
    {label:'📄 Proposal',amt:amts.prop,color:'#854F0B',prob:.60},
    {label:'💬 Discovery',amt:amts.disc,color:'#185FA5',prob:.30},
    {label:'🌱 Lead',amt:leadAmt,color:'#3B6D11',prob:.10},
  ].filter(p=>p.amt>0);
  const maxAmt=Math.max(...pipeData.map(p=>p.amt),1);
  document.getElementById('hm-ptotal').textContent=`총 ${pipeData.reduce((a,p)=>a+p.amt,0)}만`;
  document.getElementById('hm-pipelist').innerHTML=pipeData.map(p=>`<div class="pp-item"><div class="pp-hd"><span class="pp-lbl">${p.label}</span><span class="pp-amt">${p.amt}만 <span style="font-size:10px;color:var(--text3)">×${Math.round(p.prob*100)}%</span></span></div><div class="pp-bg"><div class="pp-fill" style="width:${Math.round(p.amt/maxAmt*100)}%;background:${p.color}"></div></div></div>`).join('');
  try{const s=localStorage.getItem('vd2_tasks');if(s)homeTasks=new Set(JSON.parse(s));}catch(e){}
  loadTasks();renderHomeTasks();
  let msg='';
  const tPct=Math.min(Math.round(thisMonth/rvTarget*100),100);
  if(thisMonth>=rvTarget)msg='<strong>이번 달 목표를 달성했어요.</strong> 납기 완수와 품질 관리에 집중하세요.';
  else if(tPct>=85&&capPct<70)msg=`이번 달 예상이 목표의 <strong>${tPct}%</strong>예요. 협상 단계 건이 이번 주 성사되면 목표 달성이 가능해요.`;
  else if(capPct>=90)msg='Capacity가 거의 가득 찼어요. 신규 수주보다 <strong>현재 납기 완수</strong>에 집중할 시점이에요.';
  else if(clients.some(c=>c.stage==='negotiation'))msg='협상 단계 클라이언트가 있어요. <strong>이번 주 계약을 마무리</strong>하면 이달 매출에 바로 반영돼요.';
  else msg='파이프라인을 채울 타이밍이에요. <strong>탐색·제안 단계를 협상으로</strong> 올리는 것이 이번 주 핵심이에요.';
  // 오늘의 최우선 과제
  (function(){
    var pEl=document.getElementById('hm-priority');
    if(!pEl)return;
    var urgent=clients.filter(function(c){
      var fi=getFollowupInfo(c);
      return fi&&(fi.cls==='fu-over'||fi.cls==='fu-urg');
    });
    var overdueB=bills.filter(function(b){return b.status==='overdue';});
    var noContactWon=clients.filter(function(c){
      if(c.stage!=='won'||(c.wonStatus||'ongoing')!=='ongoing')return false;
      var aa=(activities[c.id]||[]);
      var ref=aa.length?new Date(aa[aa.length-1].date):(c.stageEnteredAt&&c.stageEnteredAt.won?new Date(c.stageEnteredAt.won):null);
      return ref&&Math.ceil((new Date()-ref)/(86400000))>=14;
    });
    var priority=null;
    if(overdueB.length)priority={lbl:'연체 청구서 처리',content:overdueB[0].clientName+' 청구서 '+overdueB[0].amount+'만원 연체중',sub:'빠른 연락이 필요합니다',tab:'billing',tabLbl:'청구서 확인'};
    else if(urgent.length)priority={lbl:'팔로업 지연',content:urgent[0].name+' 팔로업 기한 초과',sub:'지금 바로 연락하세요',tab:'crm',cid:urgent[0].id,tabLbl:'상세 보기'};
    else if(noContactWon.length)priority={lbl:'14일+ 미연락',content:noContactWon[0].name+' 클라이언트',sub:'진행중 클라이언트와 팔로업 없음',tab:'crm',cid:noContactWon[0].id,tabLbl:'상세 보기'};
    else if(clients.filter(function(c){return c.stage==='lead';}).length===0)priority={lbl:'오늘의 자기계발',content:'크몽 페이지나 인스타 DM 영업을 시작해보세요',sub:'파이프라인에 리드가 없어요',tab:'crm',tabLbl:'파이프라인 열기'};
    if(priority){
      var pBtn='';
      if(priority.tab){
        var pAct=priority.cid?'goToClient('+priority.cid+')':'switchTab(\''+priority.tab+'\')';
        pBtn='<button class="tp-go-btn" onclick="'+pAct+'">'+priority.tabLbl+' <i class="ti ti-arrow-right" style="font-size:10px"></i></button>';
      }
      pEl.style.display='block';
      pEl.innerHTML='<div class="tp-label">&#9650; 오늘의 최우선 과제</div>'+'<div class="tp-content">'+priority.content+'</div>'+'<div class="tp-sub">'+priority.sub+'</div>'+pBtn;
    }else{
      pEl.style.display='block';
      pEl.innerHTML='<div class="tp-label">&#127775; 오늘의 상태</div>'+'<div class="tp-content">긴급 파악 항목이 없어요</div>'+'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px"><span class="tp-sub">새 클라이언트 유입이나 콘텐츠 활동을 고려해보세요</span><button class="tp-go-btn" onclick="switchTab(\'ideas\')">콘텐츠 보관함 <i class="ti ti-arrow-right" style="font-size:10px"></i></button></div>';
    }
  })();
  document.getElementById('hm-status').innerHTML=msg;
  // 주의 필요 클라이언트 (건강도 50 이하)
  (function(){
    var hl=document.getElementById('hm-health-list');if(!hl)return;
    var atRisk=clients.filter(function(c){
      return c.stage!=='lost'&&c.stage!=='won'&&calculateHealthScore(c).score<=50;
    }).map(function(c){return{c:c,s:calculateHealthScore(c).score};}).sort(function(a,b){return a.s-b.s;}).map(function(x){return x.c;}).slice(0,4);
    if(!atRisk.length){hl.innerHTML='<div style="font-size:12px;color:var(--text2);padding:4px 0">주의 필요 클라이언트가 없어요 &#127881;</div>';return;}
    hl.innerHTML=atRisk.map(function(c){
      var hs=calculateHealthScore(c);
      var lv=getHSLevel(hs.score);
      if(!hs||!lv)return'';
      var st=STAGES.find(function(s){return s.id===c.stage;})||{label:c.stage};
      return'<div class="hh-item al-item-link" data-cid="'+c.id+'" onclick="goToClient(parseInt(this.dataset.cid))" title="클릭하면 상세 패널이 열려요">'+
        '<div class="hh-score-dot" style="background:'+lv.bg+';color:'+lv.color+'">'+hs.score+'</div>'+
        '<div style="flex:1;min-width:0">'+
          '<div class="al-nm">'+c.name+'</div>'+
          '<div class="al-ac">'+st.label+' · '+hs.breakdown.filter(function(b){return b.pts<b.max;}).map(function(b){return b.label;}).slice(0,2).join(', ')+'</div>'+
        '</div>'+
        '<i class="ti ti-chevron-right" style="font-size:11px;color:var(--text3);flex-shrink:0"></i>'+
      '</div>';
    }).join('');
  })();
  renderGoalBar();
  detectPatterns();
  renderDeadlines();
  renderMonthlyReport();
  renderWeeklySummary();
  var insHtml='';
  var todayIns=new Date();todayIns.setHours(0,0,0,0);
  var renewals=[];
  clients.forEach(function(cl){
    (cl.contracts||[]).forEach(function(ct){
      if(!ct.endDate)return;
      var end=new Date(ct.endDate);end.setHours(0,0,0,0);
      var diff=Math.ceil((end-todayIns)/(1000*60*60*24));
      if(diff<=30)renewals.push({cl:cl,ct:ct,diff:diff});
    });
  });
  renewals.sort(function(a,b){return a.diff-b.diff;});
  if(renewals.length){
    insHtml+='<div class="ins-sec-lbl"><i class="ti ti-refresh"></i>재계약 알림</div>';
    insHtml+='<div class="ins-wrap">';
    renewals.forEach(function(r){
      var t=TYPES[r.ct.typeIdx]||TYPES[0];
      var cls=r.diff<0?'overdue':'renewal';
      var bdgCls=r.diff<0?'d-over':r.diff<=7?'d-week':'d-month';
      var diffTxt=r.diff<0?'종료됨':'D-'+r.diff;
      var subMsg=r.diff<0?'재계약 제안 시점이에요':r.diff<=7?'이번 주 재계약 논의 필요':'이달 안에 재계약 제안 준비';
      insHtml+='<div class="ins-card '+cls+' ins-item-link" data-cid="'+r.cl.id+'" onclick="goToClient(parseInt(this.dataset.cid))" title="클릭하면 상세 패널이 열려요">';
      insHtml+='<span class="ins-icon">&#x1F504;</span>';
      insHtml+='<div class="ins-body" style="flex:1">';
      insHtml+='<div class="ins-ttl">'+r.cl.name+'</div>';
      insHtml+='<div class="ins-sub">'+t.name+' '+r.ct.amount+'만원 &mdash; '+subMsg+'</div>';
      insHtml+='</div>';
      insHtml+='<span class="ins-bdg '+bdgCls+'">'+diffTxt+'</span>';
      insHtml+='<i class="ti ti-chevron-right" style="font-size:10px;color:var(--text3);margin-left:6px;flex-shrink:0"></i>';
      insHtml+='</div>';
    });
    insHtml+='</div>';
  }
  var wonC=clients.filter(function(c){return c.stage==='won';});
  var upsells=wonC.filter(function(cl){
    var svcSet=new Set([cl.typeIdx]);
    (cl.contracts||[]).forEach(function(ct){svcSet.add(ct.typeIdx);});
    return svcSet.size===1;
  });
  var upsellHints=['광고 기획·집행을 추가하면 SNS 성과를 즉시 증폭할 수 있어요','SNS 월정액과 묶으면 광고→팔로워 전환 루프가 완성돼요','브랜딩 후 SNS 운영이 없다면 브랜드 자산이 휘발될 수 있어요','콘텐츠 기획에 SNS 운영을 더하면 실행까지 원스톱이에요','단발 이후 월정액 전환 제안이 가능한 타이밍이에요'];
  if(upsells.length){
    var mt=renewals.length?'12px':'0';
    insHtml+='<div class="ins-sec-lbl" style="margin-top:'+mt+'"><i class="ti ti-trending-up"></i>업셀링 기회</div>';
    insHtml+='<div class="ins-wrap">';
    upsells.slice(0,3).forEach(function(cl){
      var hint=upsellHints[cl.typeIdx]||'추가 서비스를 제안해보세요';
      var t=TYPES[cl.typeIdx]||TYPES[0];
      insHtml+='<div class="ins-card upsell">';
      insHtml+='<span class="ins-icon">&#x1F4A1;</span>';
      insHtml+='<div class="ins-body" style="flex:1">';
      insHtml+='<div class="ins-ttl">'+cl.name+' &mdash; '+t.tag+' 단독 계약 중</div>';
      insHtml+='<div class="ins-sub">'+hint+'</div>';
      insHtml+='</div>';
      insHtml+='<span class="ins-bdg" style="background:#E0F2FE;color:#0284C7">제안 가능</span>';
      insHtml+='</div>';
    });
    insHtml+='</div>';
  }
  var insEl=document.getElementById('hm-insights');
  if(insEl)insEl.innerHTML=insHtml;
}

function renderHomeTasks(){
  var el=document.getElementById('hm-tasklist');if(!el)return;
  var done=_tasks.filter(function(t){return t.done;}).length;
  var tc=document.getElementById('hm-tcount');if(tc)tc.textContent=_tasks.length?done+'/'+_tasks.length:'';
  var tagOpts=TASK_TAGS.map(function(tg){return'<option value="'+tg.id+'">'+tg.id+'</option>';}).join('');
  var listHtml=_tasks.map(function(t){
    var tg=TASK_TAGS.find(function(x){return x.id===t.tag;})||TASK_TAGS[3];
    return'<div class="tk-row">'+
      '<div class="tk-cb '+(t.done?'chk':'')+'" onclick="toggleHomeTask('+t.id+')"></div>'+
      '<span class="tk-txt '+(t.done?'done':'')+'" onclick="toggleHomeTask('+t.id+')" style="flex:1">'+t.text+'</span>'+
      '<span class="tk-tag" style="background:'+tg.bg+';color:'+tg.col+'">'+t.tag+'</span>'+
      '<button class="tk-del" onclick="deleteHomeTask('+t.id+')" title="삭제">&#10005;</button>'+
    '</div>';
  }).join('');
  var addForm='<div class="tk-add-row">'+
    '<input id="ht-new-inp" class="tk-new-inp" placeholder="새 태스크 입력...">'+
    '<select id="ht-new-tag" class="tk-new-tag">'+tagOpts+'</select>'+
    '<button class="tk-add-btn" onclick="addHomeTask()">+</button>'+
  '</div>';
  el.innerHTML=(!_tasks.length?'<div style="font-size:12px;color:var(--text2);padding:4px 0">태스크를 추가해보세요</div>':listHtml)+addForm;
  // Enter 키 이벤트 (문자열 따옴표 충돌 방지)
  var inp=document.getElementById('ht-new-inp');
  if(inp)inp.addEventListener('keydown',function(e){if(e.key==='Enter')addHomeTask();});
}

function renderWeeklySummary(){
  var el=document.getElementById('hm-weekly');if(!el)return;
  var today=new Date();today.setHours(0,0,0,0);
  var d7=new Date(today);d7.setDate(d7.getDate()-7);
  var fmt=function(d){return(d.getMonth()+1)+'/'+(d.getDate());};
  var rangeStr=fmt(d7)+'~'+fmt(today);
  // 신규 클라이언트 (stageEnteredAt 최초 날짜가 7일 이내)
  var newCl=clients.filter(function(c){
    if(!c.stageEnteredAt)return false;
    var dates=Object.values(c.stageEnteredAt).filter(Boolean).sort();
    if(!dates.length)return false;
    return new Date(dates[0])>=d7;
  });
  // 최근 활동 수집
  var recentActs=[];
  Object.keys(activities).forEach(function(cid){
    var cl=clients.find(function(x){return x.id===parseInt(cid);});
    var nm=cl?cl.name:'알 수 없음';
    (activities[cid]||[]).forEach(function(a){
      var d=new Date(a.date);if(d>=d7)recentActs.push({nm:nm,date:d,text:a.text,type:a.type,cid:parseInt(cid)});
    });
  });
  recentActs.sort(function(a,b){return b.date-a.date;});
  // 청구서
  var newBills=bills.filter(function(b){return b.issueDate&&new Date(b.issueDate)>=d7;});
  var paidBills=bills.filter(function(b){return b.status==='paid';});
  // 새 아이디어
  var newIdeas=ideas.filter(function(i){return i.date&&new Date(i.date)>=d7;});
  // 단계 변경 활동
  var stageMoves=recentActs.filter(function(a){return a.type==='stage'||a.type==='stage_change'||(a.text&&a.text.includes('\ub2e8\uacc4 \ubcc0\uacbd'));});
  var totalEvts=newCl.length+stageMoves.length+newBills.length+newIdeas.length;
  var open=el.querySelector('.wk-body')&&el.querySelector('.wk-body').classList.contains('open');
  var html='<div class="wk-hd'+(open?' open':'')+'" onclick="wkToggle()">';
  html+='<i class="ti ti-calendar-week"></i>지난 7일 요약';
  html+='<span style="font-size:10px;font-weight:400;color:var(--text3);margin-left:4px">('+rangeStr+')</span>';
  if(totalEvts>0)html+='<span style="font-size:10px;padding:1px 6px;border-radius:99px;background:var(--teal);color:#fff;margin-left:auto;">'+totalEvts+'건</span>';
  html+='<i class="ti ti-chevron-down arr" style="margin-left:'+(totalEvts>0?'4px':'auto')+'"></i>';
  html+='</div>';
  html+='<div class="wk-body'+(open?' open':'')+'">';
  html+='<div class="wk-grid">';
  html+='<div class="wk-stat"><div class="wk-stat-v" style="color:var(--teal)">'+newCl.length+'</div><div class="wk-stat-l">신규 클라이언트</div></div>';
  html+='<div class="wk-stat"><div class="wk-stat-v">'+stageMoves.length+'</div><div class="wk-stat-l">단계 이동</div></div>';
  html+='<div class="wk-stat"><div class="wk-stat-v">'+newBills.length+'</div><div class="wk-stat-l">청구서 발행</div></div>';
  html+='<div class="wk-stat"><div class="wk-stat-v" style="color:var(--amber)">'+newIdeas.length+'</div><div class="wk-stat-l">새 아이디어</div></div>';
  html+='<div class="wk-stat"><div class="wk-stat-v">'+recentActs.length+'</div><div class="wk-stat-l">전체 활동</div></div>';
  html+='</div>';
  if(recentActs.length){
    html+='<div style="font-size:11px;font-weight:600;color:var(--text2);margin-bottom:5px">최근 활동 로그</div>';
    html+='<div class="wk-events">';
    html+=recentActs.slice(0,8).map(function(a){
      var d=a.date;var ds=(d.getMonth()+1)+'/'+(d.getDate());
      return'<div class="wk-event al-item-link" data-cid="'+a.cid+'" onclick="goToClient(parseInt(this.dataset.cid))"><span class="wk-event-date">'+ds+'</span><span class="wk-event-nm" style="font-weight:500;margin-right:3px;flex-shrink:0">'+a.nm+'</span><span style="flex:1">'+a.text.slice(0,40)+'</span><i class="ti ti-chevron-right" style="font-size:9px;color:var(--text3);flex-shrink:0"></i></div>';
    }).join('');
    html+='</div>';
  }else{
    html+='<div class="wk-empty">이번 주 기록된 활동이 없어요.</div>';
  }
  if(newCl.length){
    html+='<div style="font-size:11px;font-weight:600;color:var(--text2);margin:8px 0 5px">신규 클라이언트</div>';
    html+='<div class="wk-events">'+newCl.map(function(c){
      var t=TYPES[c.typeIdx]||TYPES[0];
      return'<div class="wk-event al-item-link" data-cid="'+c.id+'" onclick="goToClient(parseInt(this.dataset.cid))"><span class="wk-event-nm" style="font-weight:500;flex:1">'+c.name+'</span><span style="margin-left:4px;color:var(--text3)">'+t.tag+'</span><i class="ti ti-chevron-right" style="font-size:9px;color:var(--text3);flex-shrink:0"></i></div>';
    }).join('')+'</div>';
  }
  html+='</div>';
  el.innerHTML=html;
}

function wkToggle(){
  var el=document.getElementById('hm-weekly');if(!el)return;
  var hd=el.querySelector('.wk-hd');
  var body=el.querySelector('.wk-body');
  if(!hd||!body)return;
  var open=body.classList.toggle('open');
  hd.classList.toggle('open',open);
}

function renderDeadlines(){
  var el=document.getElementById('hm-deadlines');if(!el)return;
  var today=new Date();today.setHours(0,0,0,0);
  var items=[];
  // 산출물 마감
  clients.filter(function(c){return c.stage!=='lost';}).forEach(function(c){
    (c.deliverables||[]).filter(function(d){return !d.done&&d.dueDate;}).forEach(function(d){
      var dt=new Date(d.dueDate);dt.setHours(0,0,0,0);
      var diff=Math.ceil((dt-today)/(86400000));
      if(diff<=14)items.push({diff:diff,date:dt,type:'dlv',client:c.name,desc:d.text,color:'#185FA5',bg:'#E6F1FB',lbl:'산출물',cid:c.id});
    });
  });
  // 계약 종료
  clients.filter(function(c){return c.stage==='won';}).forEach(function(c){
    (c.contracts||[]).filter(function(ct){return ct.endDate;}).forEach(function(ct){
      var dt=new Date(ct.endDate);dt.setHours(0,0,0,0);
      var diff=Math.ceil((dt-today)/(86400000));
      if(diff<=21&&diff>=-7)items.push({diff:diff,date:dt,type:'contract',client:c.name,desc:'계약 종료',color:'#534AB7',bg:'#EEEDFE',lbl:'계약',cid:c.id});
    });
  });
  // 청구서 납기
  bills.filter(function(b){return b.status!=='paid'&&b.dueDate;}).forEach(function(b){
    var dt=new Date(b.dueDate);dt.setHours(0,0,0,0);
    var diff=Math.ceil((dt-today)/(86400000));
    if(diff<=7)items.push({diff:diff,date:dt,type:'bill',client:b.clientName||'청구',desc:b.amount+'만원 미납',color:'#E24B4A',bg:'#FCEBEB',lbl:'청구서',bid:b.id,cid:b.clientId});
  });
  // 예상 클로징
  clients.filter(function(c){return c.expectedClose&&c.stage!=='won'&&c.stage!=='lost';}).forEach(function(c){
    var dt=new Date(c.expectedClose);dt.setHours(0,0,0,0);
    var diff=Math.ceil((dt-today)/(86400000));
    if(diff<=7)items.push({diff:diff,date:dt,type:'close',client:c.name,desc:'클로징 예정',color:'#1D9E75',bg:'#E1F5EE',lbl:'클로징',cid:c.id});
  });
  items.sort(function(a,b){return a.diff-b.diff;});
  if(!items.length){el.innerHTML='';return;}
  var h='<div class="dl-hd"><i class="ti ti-calendar-event" style="font-size:12px"></i>다가오는 마감 · '+items.length+'건</div>';
  h+='<div class="dl-list">';
  h+=items.slice(0,8).map(function(it){
    var dlbl=it.diff<0?'D+'+Math.abs(it.diff):it.diff===0?'오늘':'D-'+it.diff;
    var dlTab='';var dlCid=0;
    if(it.type==='bill')dlTab='billing';
    else if(it.cid){dlTab='crm';dlCid=it.cid;}
    return'<div class="'+(dlTab?'dl-item dl-item-link" data-dltab="'+dlTab+'" data-dlcid="'+dlCid+'" onclick="goDlItem(this)" title="클릭하면 이동해요':'dl-item')+'">'+'<span class="dl-date" style="background:'+it.bg+';color:'+it.color+'">'+dlbl+'</span>'+'<span class="dl-client">'+it.client+'</span>'+'<span class="dl-sep">—</span>'+'<span class="dl-desc">'+it.desc+'</span>'+'<span class="dl-type-badge" style="background:'+it.bg+';color:'+it.color+'">'+it.lbl+'</span>'+(dlTab?'<i class="ti ti-chevron-right" style="font-size:10px;color:var(--text3);margin-left:auto;flex-shrink:0"></i>':'')+'</div>';
  }).join('')+'</div>';
  el.innerHTML=h;
}

function renderMonthlyReport(){
  var el=document.getElementById('hm-monthly-report');if(!el)return;
  var now=new Date();var yr=now.getFullYear();var mo=now.getMonth();
  var monStart=new Date(yr,mo,1);var monEnd=new Date(yr,mo+1,0);
  var monStr=yr+'년 '+(mo+1)+'월';
  // 이번 달 신규 클라이언트
  var newCl=clients.filter(function(c){
    var dates=Object.values(c.stageEnteredAt||{}).filter(Boolean).sort();
    if(!dates.length)return false;
    var d=new Date(dates[0]);return d>=monStart&&d<=monEnd;
  });
  // 이번 달 Won
  var wonCl=clients.filter(function(c){
    return c.stage==='won'&&c.stageEnteredAt&&c.stageEnteredAt.won&&
      new Date(c.stageEnteredAt.won)>=monStart&&new Date(c.stageEnteredAt.won)<=monEnd;
  });
  // 이번 달 청구서 발행
  var monBills=bills.filter(function(b){
    return b.issueDate&&new Date(b.issueDate)>=monStart&&new Date(b.issueDate)<=monEnd;
  });
  var monBillAmt=monBills.reduce(function(s,b){return s+b.amount;},0);
  var paidBills=monBills.filter(function(b){return b.status==='paid';});
  // 이번 달 활동
  var monActs=0;
  Object.values(activities).forEach(function(arr){
    monActs+=arr.filter(function(a){var d=new Date(a.date);return d>=monStart&&d<=monEnd;}).length;
  });
  // Won 매출
  var wonAmt=wonCl.reduce(function(s,c){return s+c.amount;},0);
  // 파이프라인 가중
  var pipe=0;clients.filter(function(c){return c.stage!=='won'&&c.stage!=='lost';}).forEach(function(c){
    var sg=STAGES.find(function(s){return s.id===c.stage;});
    if(sg)pipe+=(Number(c.amount)||0)*sg.prob;
  });
  var h='<div class="mr-wrap">';
  h+='<div class="mr-hd"><span><i class="ti ti-clipboard-data" style="font-size:12px;margin-right:5px"></i>'+monStr+' 성과 요약</span>';
  h+='<button class="mr-copy-btn" onclick="copyMonthlyReport()">&#128203; 복사</button></div>';
  h+='<div class="mr-grid">';
  h+='<div class="mr-stat"><div class="mr-stat-v" style="color:var(--teal)">'+wonCl.length+'</div><div class="mr-stat-l">신규 Won</div></div>';
  h+='<div class="mr-stat"><div class="mr-stat-v">'+newCl.length+'</div><div class="mr-stat-l">신규 리드</div></div>';
  h+='<div class="mr-stat"><div class="mr-stat-v" style="color:var(--teal)">'+wonAmt+'</div><div class="mr-stat-l">만 Won매출</div></div>';
  h+='<div class="mr-stat"><div class="mr-stat-v">'+monBills.length+'</div><div class="mr-stat-l">청구서</div></div>';
  h+='<div class="mr-stat"><div class="mr-stat-v">'+monActs+'</div><div class="mr-stat-l">활동기록</div></div>';
  h+='<div class="mr-stat"><div class="mr-stat-v">'+Math.round(pipe)+'</div><div class="mr-stat-l">가중파이프</div></div>';
  h+='</div>';
  h+='<div class="mr-out" id="mr-out"></div>';
  h+='</div>';
  el.innerHTML=h;
  // Generate report text
  var wonList=wonCl.map(function(c){return c.name+'('+c.amount+'만)';}).join(', ');
  var report=[
    '[ 변덕쟁이들 '+monStr+' 성과 리포트 ]',
    '',
    '— Won '+wonCl.length+'건 / '+wonAmt+'만원',
    '— 신규 리드 '+newCl.length+'건 유입',
    '— 청구서 '+monBills.length+'건 (총 '+monBillAmt+'만원 / 입금 '+paidBills.length+'건)',
    '— 활동 기록 '+monActs+'건',
    '— 파이프라인 가중 예상 '+Math.round(pipe)+'만원',
    '',
    wonCl.length?'Won: '+wonList:'(Won 클라이언트 없음)',
    '',
    '[변덕쟁이들 | 조형준]',
  ].join('\n');
  var out=document.getElementById('mr-out');
  if(out){out.textContent=report;}
}

function copyMonthlyReport(){
  var out=document.getElementById('mr-out');
  if(!out)return;
  var show=out.style.display!=='block';
  out.style.display=show?'block':'none';
  if(show&&navigator.clipboard){
    navigator.clipboard.writeText(out.textContent).then(function(){
      showToast('✅ 리포트 복사됨! SNS나 카카오에 붙여넣으세요.');
    });
  }
}

function detectPatterns(){
  var el=document.getElementById('hm-patterns');if(!el)return;
  var patterns=[];
  // 1. 재계약 주기 패턴 (2건 이상 계약 이력)
  clients.filter(function(c){return (c.contracts||[]).length>=2;}).forEach(function(c){
    var dates=(c.contracts||[]).map(function(ct){return new Date(ct.date);}).sort(function(a,b){return a-b;});
    var intervals=[];
    for(var i=1;i<dates.length;i++)intervals.push(Math.round((dates[i]-dates[i-1])/(86400000*30)));
    var avg=Math.round(intervals.reduce(function(s,v){return s+v;},0)/intervals.length);
    if(avg>=1&&avg<=12){
      var lastDate=dates[dates.length-1];
      var nextEst=new Date(lastDate);nextEst.setMonth(nextEst.getMonth()+avg);
      var daysLeft=Math.ceil((nextEst-new Date())/(86400000));
      if(daysLeft>=-7&&daysLeft<=60){
        patterns.push({
          icon:'&#128260;',
          ttl:c.name+' — 재계약 '+avg+'개월 주기',
          sub:'다음 재계약 예상: '+nextEst.toLocaleDateString('ko-KR',{month:'long',day:'numeric'})+(daysLeft<=14?' — 곧 다가와요!':'')
        ,cid:c.id
        });
      }
    }
  });
  // 2. 이번 달 계절 패턴 (작년 같은 달 Won)
  var now=new Date();var thisMonth=now.getMonth();
  var lastYearWons=clients.filter(function(c){
    if(!c.stageEnteredAt||!c.stageEnteredAt.won)return false;
    var d=new Date(c.stageEnteredAt.won);
    return d.getMonth()===thisMonth&&d.getFullYear()===now.getFullYear()-1;
  });
  if(lastYearWons.length>=2){
    patterns.push({
      icon:'&#128197;',
      ttl:'계절 패턴 감지',
      sub:'작년 '+(thisMonth+1)+'월에 '+lastYearWons.length+'건 성약 기록이 있어요. 이달 영업에 집중할 좋은 시기예요!'
    });
  }
  // 3. 장기 미연락 Won 클라이언트 재계약 시그널
  clients.filter(function(c){return c.stage==='won'&&(c.wonStatus||'ongoing')==='completed';}).forEach(function(c){
    if(!c.stageEnteredAt||!c.stageEnteredAt.won)return;
    var wonDate=new Date(c.stageEnteredAt.won);
    var monthsAgo=Math.round((now-wonDate)/(86400000*30));
    if(monthsAgo>=3&&monthsAgo<=5){
      patterns.push({
        icon:'&#128161;',
        ttl:c.name+' 재접촉 시기',
        sub:'완료 후 '+monthsAgo+'개월 경과. 재계약 제안 또는 후기 요청의 적기예요.'
      ,cid:c.id
      });
    }
  });
  if(!patterns.length){el.innerHTML='';return;}
  el.innerHTML='<div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:6px;display:flex;align-items:center;gap:5px">'+'<i class="ti ti-bulb" style="font-size:12px"></i>패턴 감지</div>'+
  patterns.slice(0,4).map(function(p){
    var ca=p.cid?'data-cid="'+p.cid+'" onclick="goToClient(parseInt(this.dataset.cid))" style="cursor:pointer"':'';
    return'<div class="pat-item al-item-link" '+ca+'>'+
      '<span class="pat-icon">'+p.icon+'</span>'+
      '<div class="pat-body" style="flex:1"><div class="pat-ttl">'+p.ttl+'</div><div class="pat-sub">'+p.sub+'</div></div>'+
      (p.cid?'<i class="ti ti-chevron-right" style="font-size:10px;color:var(--text3);flex-shrink:0"></i>':'')+
    '</div>';
  }).join('');
}

function renderGoalBar(){
  var el=document.getElementById('hm-goal-bar');if(!el)return;
  var s=loadSettings();
  var target=s.rvTarget||rvTarget||200;
  // 이번 달 청구서 입금 완료 금액
  var now=new Date();var ms=new Date(now.getFullYear(),now.getMonth(),1);
  var earned=bills.filter(function(b){
    return b.status==='paid'&&b.issueDate&&new Date(b.issueDate)>=ms;
  }).reduce(function(s,b){return s+b.amount;},0);
  var pipe=0;clients.filter(function(c){
    return c.stage!=='won'&&c.stage!=='lost';
  }).forEach(function(c){
    var sg=STAGES.find(function(s){return s.id===c.stage;});
    if(sg)pipe+=(Number(c.amount)||0)*sg.prob;
  });
  var pct=Math.min(Math.round(earned/target*100),100);
  var pipePct=Math.min(Math.round((earned+pipe)/target*100),100);
  var mo=(now.getMonth()+1)+'월';
  el.innerHTML=
    '<div class="goal-bar-hd">'+'<span>'+mo+' 매출 목표</span>'+'<span style="color:var(--teal)">'+earned+'만 / '+target+'만</span>'+'</div>'+'<div class="goal-bar-bg">'+'<div class="goal-bar-fill" style="width:'+pct+'%"></div>'+'</div>'+'<div class="goal-bar-stats">'+'<span>입금 '+pct+'%</span>'+'<span>가중파이프 포함 '+pipePct+'%</span>'+'<button onclick="openSettings()" style="background:none;border:none;cursor:pointer;font-size:10px;color:var(--text3);font-family:inherit">목표 수정 &#9881;</button>'+'</div>';
}

var DDAY_KEY='vd_dday_cfg';

function loadDdayCfg(){
  try{var r=localStorage.getItem(DDAY_KEY);return r?JSON.parse(r):{date:'2026-09-01',name:'변덕쟁이들 정식 런칭'};}
  catch(e){return{date:'2026-09-01',name:'변덕쟁이들 정식 런칭'};}
}

function saveDdayCfg(cfg){try{localStorage.setItem(DDAY_KEY,JSON.stringify(cfg));}catch(e){}}

function renderDday(){
  var cfg=loadDdayCfg();
  var nm=document.getElementById('hm-dday-name');
  var num=document.getElementById('hm-dday-num');
  var unit=document.getElementById('hm-dday-unit');
  var sub=document.getElementById('hm-dday-sub');
  if(!nm||!num)return;
  nm.textContent=cfg.name||'변덕쟁이들 정식 런칭';
  var today=new Date();today.setHours(0,0,0,0);
  var target=new Date(cfg.date);target.setHours(0,0,0,0);
  var diff=Math.ceil((target-today)/(1000*60*60*24));
  if(diff>0){
    num.textContent='D-'+diff;
    num.style.color='var(--teal)';
    unit.textContent='일 남음';
    sub.textContent=cfg.date.replace(/-/g,'.')+'  목표일';
  } else if(diff===0){
    num.textContent='D-DAY';
    num.style.color='var(--red)';
    unit.textContent='';
    sub.textContent='&#127881; 오늘이 런칭일!';
  } else {
    num.textContent='D+'+Math.abs(diff);
    num.style.color='var(--text3)';
    unit.textContent='일 경과';
    sub.textContent=cfg.date.replace(/-/g,'.')+'  이후 '+Math.abs(diff)+'일';
  }
}

function openDdayEdit(){
  var cfg=loadDdayCfg();
  var newDate=prompt('런칭 목표일 (YYYY-MM-DD)',cfg.date);
  if(!newDate)return;
  if(!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(newDate)){showToast('날짜 형식을 확인해주세요 (YYYY-MM-DD)');return;}
  var newName=prompt('이름 (예: 변덕쟁이들 정식 런칭)',cfg.name||'변덕쟁이들 정식 런칭');
  // 이름 취소해도 날짜는 저장
  saveDdayCfg({date:newDate,name:(newName!==null?(newName||cfg.name):cfg.name)});
  renderDday();
  showToast('D-day 설정 저장됐어요!');
}
