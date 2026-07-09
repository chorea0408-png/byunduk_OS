function openDetail(id){
  detClientId=id;renderDetail();
  document.getElementById('det-overlay').classList.add('open');
  document.getElementById('det-panel').classList.add('open');
}

function closeDetail(){
  document.getElementById('det-overlay').classList.remove('open');
  document.getElementById('det-panel').classList.remove('open');
  detClientId=null;
}

function renderDetail(){
  const cl=clients.find(x=>x.id===detClientId);if(!cl)return;
  const t=TYPES[cl.typeIdx]||TYPES[0];
  const st=STAGES.find(s=>s.id===cl.stage)||STAGES[0];
  document.getElementById('det-nm').textContent=cl.name;
  document.getElementById('det-tp').innerHTML='<span class="tag" style="background:'+t.tagBg+';color:'+t.color+'">'+t.name+'</span><span class="tag" style="background:'+st.bg+';color:'+st.color+'">'+st.label+'</span>';
  const stIdx=STAGE_ORDER.indexOf(cl.stage);
  document.getElementById('det-stages').innerHTML=STAGE_ORDER.slice(0,-1).map(function(sid,i){
    const s=STAGES.find(x=>x.id===sid)||{label:sid};
    const isDone=i<stIdx,isCur=i===stIdx;
    return(i>0?'<div class="det-st-line"></div>':'')+'<div class="det-st"><div class="det-st-dot '+(isDone?'done':isCur?'cur':'')+'"></div><span class="det-st-lbl '+(isCur?'cur':'')+'" style="font-size:10px">'+s.label.slice(2)+'</span></div>';
  }).join('');
  document.getElementById('det-amt').textContent=cl.amount+'만';
  document.getElementById('det-rate').textContent=(cl.amount/(t.hours*4)).toFixed(1)+'만/h';
  document.getElementById('det-hrs').textContent=t.hours+'h/주';
  document.getElementById('det-note').value=cl.note||'';
  const curIdx=STAGE_ORDER.indexOf(cl.stage),nextId=STAGE_ORDER[curIdx+1];
  const nextSt=STAGES.find(s=>s.id===nextId);
  const advBtn=document.getElementById('det-advance');
  if(nextSt&&cl.stage!=='won'&&cl.stage!=='lost'){advBtn.style.display='';advBtn.textContent=nextSt.label+' →';}
  else advBtn.style.display='none';
  // 재계약 토글
  const rcRow=document.getElementById('det-rc-row');
  const rcBtn=document.getElementById('det-rc-btn');
  if(rcRow&&rcBtn){
    rcRow.style.display=cl.stage==='won'?'':'none';
    rcBtn.className='det-rc-btn'+(cl.recontract?' on':'');
    rcBtn.textContent=cl.recontract?'♻️ 재계약 완료':'재계약으로 표시';
  }
  // 새 CRM 섹션 렌더
  renderCrmExtra(cl);
  renderActLog();
}

function renderCrmExtra(cl){
  const el=document.getElementById('det-crm-extra');if(!el)return;
  const fu=getFollowupInfo(cl)||{days:null,cls:'',label:'',hint:''};
  const ltv=getClientLTV(cl);
  const contracts=cl.contracts||[];
  const tags=cl.tags||[];
  let html='';
  // AI 분석 버튼
  html+='<div style="margin-bottom:10px">';
  html+='<button class="ai-analyze-btn" data-cid="'+cl.id+'" onclick="openAiModal(this.dataset.cid)">&#129302; AI 전략 생성</button>';
  html+='<span style="font-size:10px;color:var(--text3);margin-left:8px">Claude.ai에 쓸 프롬프트를 자동 생성합니다</span>';
  html+='</div>';
  // ── Salesforce gap: Contact + Close Date ──
  html+='<div class="det-crm-sec">';
  html+='<div class="det-crm-ttl" onclick="toggleCrmSec(this)"><i class="ti ti-id-badge" style="font-size:13px"></i>컨택 & 예상 클로징 (Salesforce)</div>';
  html+='<div class="sf-field-row">';
  html+='<div class="sf-field"><span class="sf-field-lbl">Contact 이름</span>';
  html+='<input value="'+(cl.contactName||'')+'" placeholder="담당자 이름" data-cid="'+cl.id+'" data-field="contactName" oninput="sfSave(this)"></div>';
  html+='<div class="sf-field"><span class="sf-field-lbl">Contact 직책</span>';
  html+='<input value="'+(cl.contactRole||'')+'" placeholder="대표, 마케터 등" data-cid="'+cl.id+'" data-field="contactRole" oninput="sfSave(this)"></div>';
  html+='</div>';
  html+='<div class="sf-field"><span class="sf-field-lbl">예상 클로징 일자 (Opportunity.CloseDate)</span>';
  html+='<input type="date" value="'+(cl.expectedClose||'')+'" data-cid="'+cl.id+'" data-field="expectedClose" oninput="sfSave(this)"></div>';
  if(cl.expectedClose&&cl.stage!=='won'&&cl.stage!=='lost'){
    var cdV=new Date(cl.expectedClose);var cdN=new Date();cdN.setHours(0,0,0,0);
    var cdD=Math.ceil((cdV-cdN)/(1000*60*60*24));
    var cdTxt=cdD<0?'D+'+Math.abs(cdD)+' 기한 초과':cdD===0?'오늘 마감':'D-'+cdD;
    var cdC=cdD<0?'#A32D2D':cdD<=7?'#854F0B':'#1D9E75';
    var cdBg=cdD<0?'#FCEBEB':cdD<=7?'#FAEEDA':'#E1F5EE';
    html+='<div style="margin-top:5px"><span class="cd-badge" style="background:'+cdBg+';color:'+cdC+'">'+cdTxt+'</span></div>';
  }
  html+='</div>';
  // 소개자 섹션
  html+='<div class="det-crm-sec collapsed">';
  html+='<div class="det-crm-ttl" onclick="toggleCrmSec(this)"><i class="ti ti-users" style="font-size:13px"></i>소개 네트워크</div>';
  html+='<div class="sf-field-row">';
  html+='<div class="sf-field" style="flex:1"><span class="sf-field-lbl">소개자 (이 클라이언트를 누가 연결했나요?)</span>';
  var refOpts='<option value="0">없음 / 직접 유입</option>';
  clients.filter(function(cx){return cx.id!==cl.id;}).forEach(function(cx){
    refOpts+='<option value="'+cx.id+'"'+(cl.referredBy===cx.id?' selected':'')+'>'+cx.name+'</option>';
  });
  html+='<select data-cid="'+cl.id+'" data-field="referredBy" onchange="sfSaveInt(this)">'+refOpts+'</select>';
  html+='</div></div>';
  // 소개한 클라이언트 목록
  var referred=clients.filter(function(cx){return cx.referredBy===cl.id;});
  if(referred.length>0){
    html+='<div style="margin-top:8px;font-size:11px;color:var(--text3)">&#128101; 이 클라이언트가 소개한 사람: ';
    html+=referred.map(function(cx){return'<span style="display:inline-block;background:var(--bg2);border-radius:4px;padding:1px 6px;margin:1px 2px;cursor:pointer" onclick="openDetail('+cx.id+')">'+cx.name+'</span>';}).join('');
    html+='</div>';
  }
  html+='</div>';
  if(cl.stage==='won'){
    var rb=cl.recurBill||{enabled:false,day:1,amount:cl.amount,desc:''};
    html+='<div class="det-crm-sec collapsed">';
    html+='<div class="det-crm-ttl" onclick="toggleCrmSec(this)"><i class="ti ti-repeat" style="font-size:13px"></i>반복 청구 설정</div>';
    html+='<div class="recur-form">';
    html+='<div class="recur-row"><span class="recur-lbl">자동 청구</span><label style="display:flex;align-items:center;gap:6px;font-size:11px">';
    html+='<input type="checkbox" id="rb-enabled-'+cl.id+'" '+(rb.enabled?'checked':'');
    html+=' onchange="saveRecurBill('+cl.id+')"> 활성화</label></div>';
    html+='<div class="recur-row"><span class="recur-lbl">청구일</span><input class="recur-in" id="rb-day-'+cl.id+'" type="number" min="1" max="28" value="'+rb.day+'" oninput="saveRecurBill('+cl.id+')"> 일</div>';
    html+='<div class="recur-row"><span class="recur-lbl">금액(만)</span><input class="recur-in" id="rb-amt-'+cl.id+'" type="number" value="'+rb.amount+'" oninput="saveRecurBill('+cl.id+')"></div>';
    html+='<div class="recur-row"><span class="recur-lbl">서비스명</span><input class="recur-in" id="rb-desc-'+cl.id+'" value="'+rb.desc.replace(/"/g,'&quot;')+'" oninput="saveRecurBill('+cl.id+')"></div>';
    html+='<div style="font-size:10px;color:var(--text3);margin-top:4px">매월 '+rb.day+'일에 자동으로 청구서가 생성됩니다.</div>';
    html+='</div></div>';
  }
  if(cl.stage==='won'){
    html+='<div class="det-crm-sec"><div class="det-crm-ttl" onclick="toggleCrmSec(this)"><i class="ti ti-circle-check" style="    font-size:13px"></i>Won 상태 & 만족도</div>';
    html+='<div class="won-st-btns">'+WON_STATUS.map(function(s){var on=(cl.wonStatus||'ongoing')===s.id;return'<button class="won-st-btn'+(on?' on':'')+'" style="'+(on?'background:'+s.bg+';color:'+s.color+';border-color:'+s.color:'')+'" data-cid="'+cl.id+'" data-st="'+s.id+'" onclick="setWonStatus(this.dataset.cid,this.dataset.st)">'+s.label+'</button>';}).join('')+'</div>';
    html+='<div style="font-size:11px;color:var(--text2);margin-top:8px">클라이언트 만족도 (Won 후 평가)</div>';
    html+='<div class="nps-stars">';
    for(var si=1;si<=5;si++){var fl=cl.npsScore&&si<=cl.npsScore;html+='<span class="nps-star" style="color:'+(fl?'#D97706':'var(--border)')+'" data-cid="'+cl.id+'" data-sc="'+si+'" onclick="setNPS(this.dataset.cid,parseInt(this.dataset.sc))">'+(fl?'&#9733;':'&#9734;')+'</span>';}
    html+='</div></div>';
  }
  if(cl.stage==='lost'){
    html+='<div class="det-crm-sec"><div class="det-crm-ttl" onclick="toggleCrmSec(this)"><i class="ti ti-x" style="font-size:13px"></i>이탈 & 재활성화</div>';
    html+='<div class="lost-info-box"><div class="lost-info-lbl">이탈 사유</div><div style="font-size:12px;color:#5F5E5A">'+(cl.lostReason||'기록 없음')+'</div>';
    html+='<div style="font-size:10px;color:var(--text3);margin-top:3px;cursor:pointer" onclick="showLostModal('+cl.id+')">&#9998; 수정</div></div>';
    html+='<div style="font-size:11px;color:var(--text2);margin-top:8px;margin-bottom:4px">재활성화 예정일</div>';
    html+='<div class="reactivate-row"><input type="date" id="reactivate-date-'+cl.id+'" value="'+(cl.reactivateDate||'')+'">';
    html+='<button class="btn btn-primary" data-cid="'+cl.id+'" onclick="saveReactivateDate(this.dataset.cid)" style="font-size:11px;padding:4px 10px">저장</button></div></div>';
  }
  // 태그 섹션
  html+='<div class="det-crm-sec collapsed">';
  html+='<div class="det-crm-ttl" onclick="toggleCrmSec(this)"><i class="ti ti-tag" style="font-size:13px" aria-hidden="true"></i>클라이언트 태그</div>';
  html+='<div class="tag-edit-wrap">';
  html+=PRESET_TAGS.map(function(pt){
    var on=tags.includes(pt.id);
    var style=on?'background:'+pt.bg+';color:'+pt.color+';border-color:'+pt.color:'';
    return'<button class="tag-toggle-btn'+(on?' on':'')+'" style="'+style+'" data-cid="'+cl.id+'" data-tid="'+pt.id+'" onclick="toggleClientTag(this.dataset.cid,this.dataset.tid)">'+pt.label+'</button>';
  }).join('');
  html+='</div></div>';
  // 건강도 섹션
  const hs=calculateHealthScore(cl);
  const hsLv=getHSLevel(hs.score);
  html+='<div class="det-crm-sec">';
  html+='<div class="det-crm-ttl" onclick="toggleCrmSec(this)"><i class="ti ti-heartbeat" style="font-size:13px" aria-hidden="true"></i>클라이언트 건강도</div>';
  html+='<div class="hs-wrap">';
  html+='<div class="hs-top"><span class="hs-score" style="color:'+hsLv.color+'">'+hs.score+'</span><div><div class="hs-label" style="color:'+hsLv.color+'">'+hsLv.label+'</div><div style="font-size:10px;color:var(--text3)">/ 100점</div></div></div>';
  html+='<div class="hs-bar-bg"><div class="hs-bar-f" style="width:'+hs.score+'%;background:'+hsLv.color+'"></div></div>';
  html+='<div class="hs-items">'+hs.breakdown.map(function(it){
    const pct=Math.round(it.pts/it.max*100);
    return'<div class="hs-item">'+
      '<span class="hs-item-lbl">'+it.label+'</span>'+
      '<div class="hs-item-bar-bg"><div class="hs-item-bar-f" style="width:'+pct+'%;background:'+it.color+'"></div></div>'+
      '<span class="hs-item-pts">'+it.pts+'/'+it.max+'</span>'+
      '<span class="hs-item-note">'+it.note+'</span>'+
    '</div>';
  }).join('')+'</div>';
  // 월별 트렌드 차트
  html+='<div style="margin-top:10px;border-top:1px solid var(--bdr);padding-top:8px">';
  html+='<div style="font-size:10px;color:var(--text3);margin-bottom:4px">&#128200; 월별 건강도 추이</div>';
  html+='<div id="hs-trend-chart-'+cl.id+'">'+renderHealthTrend(cl.id)+'</div>';
  html+='<button class="hs-save-btn" data-cid="'+cl.id+'" onclick="manualSaveHealth(this.dataset.cid,this)"><i class="ti ti-device-floppy" style="font-size:11px"></i>이달 건강도 저장</button>';
  html+='</div>';
  html+='</div></div>';
  // 팔로업 섹션
  html+='<div class="det-crm-sec">';
  html+='<div class="det-crm-ttl" onclick="toggleCrmSec(this)"><i class="ti ti-bell" style="font-size:13px" aria-hidden="true"></i>팔로업 예정</div>';
  html+='<div class="det-frow"><span class="det-flbl">예정일</span>';
  html+='<input class="det-fi" type="date" id="det-fu-date" value="'+(cl.nextFollowup||'')+'" data-cid="'+cl.id+'" data-field="nextFollowup" oninput="updateFollowup(this.dataset.cid,this.dataset.field,this.value)">';
  if(fu) html+='<span class="fu-bdg '+fu.cls+'" style="margin-left:4px">'+fu.label+'</span>';
  if(cl.nextFollowup) html+='<button class="fu-done-btn" data-cid="'+cl.id+'" onclick="markFollowupDone(this.dataset.cid)">완료 처리</button>';
  html+='</div>';
  html+='<div class="det-frow"><span class="det-flbl">메모</span>';
  html+='<input class="det-fi" type="text" id="det-fu-note" value="'+(cl.followupNote||'')+'" placeholder="팔로업 내용..." style="flex:1" data-cid="'+cl.id+'" data-field="followupNote" oninput="updateFollowup(this.dataset.cid,this.dataset.field,this.value)"></div>';
  html+='</div>';
  var lastChA=(activities[cl.id]||[]).slice().reverse().find(function(a){return a.channel&&a.channel!=='';});
  if(lastChA){var lchX=COMM_CHANNELS.find(function(c){return c.id===lastChA.channel;});
    if(lchX)html+='<div class="last-ch-row"><span style="color:var(--text3)">엵근 연락:</span>'+'<span class="act-ch-badge" style="background:'+lchX.bg+';color:'+lchX.color+'">'+lchX.icon+' '+lchX.label+'</span>'+'<span style="color:var(--text3);font-size:10px">'+new Date(lastChA.date).toLocaleDateString('ko-KR',{month:'numeric',day:'numeric'})+'</span></div>';}
  // ── 제안서 상태 섹션 ──
  html+='<div class="det-crm-sec">';
  html+='<div class="det-crm-ttl" onclick="toggleCrmSec(this)"><i class="ti ti-file-text" style="font-size:13px" aria-hidden="true"></i>제안서 상태</div>';
  html+='<div class="det-frow"><span class="det-flbl">발송일</span>';
  html+='<input class="det-fi" type="date" value="'+(cl.proposalSentDate||'')+'" data-cid="'+cl.id+'" data-field="proposalSentDate" oninput="updateFollowup(this.dataset.cid,this.dataset.field,this.value)"></div>';
  html+='<div class="det-frow"><span class="det-flbl">응답 예정</span>';
  html+='<input class="det-fi" type="date" value="'+(cl.proposalDueDate||'')+'" data-cid="'+cl.id+'" data-field="proposalDueDate" oninput="updateFollowup(this.dataset.cid,this.dataset.field,this.value)"></div>';
  html+='<button class="btn" data-cid="'+cl.id+'" onclick="openPropModal(parseInt(this.dataset.cid))" style="font-size:11px;margin-bottom:8px;width:100%"><i class="ti ti-file-invoice" style="font-size:11px"></i> 제안서 초안 생성</button>';
  html+='<div class="prop-btns">';
  html+=PROP_STATUS.map(function(ps){
    const isOn=(cl.proposalStatus||'none')===ps.id;
    return'<button class="prop-btn'+(isOn?' on':'')+'" style="'+(isOn?'background:'+ps.bg+';color:'+ps.color+';border-color:'+ps.color:'')+'" data-cid="'+cl.id+'" data-pid="'+ps.id+'" onclick="setPropStatus(this.dataset.cid,this.dataset.pid)">'+ps.label+'</button>';
  }).join('');
  html+='</div></div>';
  // ── LTV & 계약 이력 섹션 ──
  html+='<div class="det-crm-sec">';
  html+='<div class="det-crm-ttl" onclick="toggleCrmSec(this)"><i class="ti ti-trending-up" style="font-size:13px" aria-hidden="true"></i>계약 이력 & LTV</div>';
  html+='<div class="ltv-hd"><span class="ltv-big">'+ltv+'만원</span><span class="ltv-sub">누적 LTV ('+contracts.length+'건 이력)</span></div>';
  if(contracts.length){
    html+=contracts.map(function(ct){
      const t=TYPES[ct.typeIdx]||TYPES[0];
      var endDiff3=ct.endDate?Math.ceil((new Date(ct.endDate)-new Date())/(1000*60*60*24)):null;
      var endBdg3='';
      if(endDiff3!==null){
        if(endDiff3<0)endBdg3='<span class="con-end-badge" style="background:#FCEBEB;color:#E24B4A">종료</span>';
        else if(endDiff3<=7)endBdg3='<span class="con-end-badge" style="background:#FAEEDA;color:#BA7517">D-'+endDiff3+'</span>';
        else if(endDiff3<=30)endBdg3='<span class="con-end-badge" style="background:#E1F5EE;color:#1D9E75">D-'+endDiff3+'</span>';
      }
      return'<div class="con-item">'+
        '<span class="con-date">'+(ct.date||'날짜 없음')+(ct.endDate?' ~ '+ct.endDate:'')+'</span>'+endBdg3+
        '<span class="con-tag">'+t.tag+'</span>'+
        '<span style="flex:1;font-size:11px;color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(ct.note||'')+'</span>'+
        '<span class="con-amt">'+ct.amount+'만</span>'+
        '<button class="con-del" data-cid="'+cl.id+'" data-ctid="'+ct.id+'" onclick="delContract(this.dataset.cid,this.dataset.ctid)" aria-label="삭제">✕</button>'+
      '</div>';
    }).join('');
  } else {
    html+='<div style="font-size:11px;color:var(--text3);padding:4px 0">아직 이력이 없어요. 계약 완료 시 아래에서 추가하세요.</div>';
  }
  html+='<div class="con-add">';
  html+='<input type="date" id="con-add-date" placeholder="시작일" style="width:103px">';
  html+='<input type="date" id="con-add-end" placeholder="종료일" style="width:103px">';
  html+='<select id="con-add-type" style="width:90px">';
  html+=TYPES.map(function(t,i){return'<option value="'+i+'">'+t.tag+'</option>';}).join('');
  html+='</select>';
  html+='<input type="number" id="con-add-amt" placeholder="금액(만)" style="width:80px" min="0">';
  html+='<input type="text" id="con-add-note" placeholder="메모" style="flex:1;min-width:80px">';
  html+='<button class="btn btn-primary" data-cid="'+cl.id+'" onclick="addContract(this.dataset.cid)" style="font-size:11px;padding:4px 10px">추가</button>';
  html+='</div>';
  html+='</div>';
  // SOP 8단계 트래커
  var sopDone2=cl.sopDone||[];
  while(sopDone2.length<8)sopDone2.push(false);
  var sopSteps2=['계약 체결','착수금 입금','킥오프 미팅','자료·소스 수집','1차 결과물 공유','피드백 반영','최종 납품','잔금 입금'];
  var sopCnt=sopDone2.filter(Boolean).length;
  var sopPct2=Math.round(sopCnt/8*100);
  html+='<div class="det-crm-sec collapsed">';
  html+='<div class="det-crm-ttl" onclick="toggleCrmSec(this)"><i class="ti ti-route" style="font-size:13px"></i>온보딩 SOP</div>';
  html+='<div class="sop-prog-row">';
  html+='<div class="sop-prog-bar"><div class="sop-prog-fill" style="width:'+sopPct2+'%"></div></div>';
  html+='<span class="sop-prog-txt">'+sopCnt+'/8 완료 ('+sopPct2+'%)</span>';
  if(cl.stage==='won'){var ccCnt=(cl.closureChecks||[]).length;html+='<span style="font-size:10px;margin-left:8px;padding:1px 6px;border-radius:99px;background:'+(ccCnt===5?'#E1F5EE':'#FAEEDA')+';color:'+(ccCnt===5?'#1D9E75':'#854F0B')+';font-weight:600;cursor:pointer" onclick="showClosureModal(clients.find(function(x){return x.id==='+cl.id+';}))">종료 '+ccCnt+'/5 ▸</span>';}
  html+='</div>';
  html+='<div class="sop-steps">';
  sopSteps2.forEach(function(step,i){
    var isDone=sopDone2[i];
    html+='<div class="sop-step'+(isDone?' done':'')+'" data-cid="'+cl.id+'" data-idx="'+i+'" onclick="toggleSop(this.dataset.cid,this.dataset.idx)">';
    html+='<span class="sop-num">'+(isDone?'&#x2713;':(i+1))+'</span>';
    html+='<span class="sop-lbl">'+step+'</span>';
    html+='</div>';
  });
  html+='</div></div>';
  // 시간 투입 로그
  var timeLog=cl.timeLog||[];
  var totalHrs=Math.round(timeLog.reduce(function(s,t){return s+t.hours;},0)*10)/10;
  var ltvAmt=getClientLTV(cl)||cl.amount;
  var hrRate=totalHrs>0?Math.round(ltvAmt*10000/totalHrs):null;
  html+='<div class="det-crm-sec collapsed">';
  html+='<div class="det-crm-ttl" onclick="toggleCrmSec(this)"><i class="ti ti-clock" style="font-size:13px"></i>시간 투입 로그</div>';
  html+='<div class="tl-stats">';
  html+='<div class="tl-stat"><div class="tl-stat-v">'+totalHrs+'h</div><div class="tl-stat-l">총 투입 시간</div></div>';
  html+='<div class="tl-stat"><div class="tl-stat-v" style="color:var(--teal)">'+(hrRate?Math.round(hrRate/10000)+'만':'–')+'</div><div class="tl-stat-l">시간당 수익</div></div>';
  html+='<div class="tl-stat"><div class="tl-stat-v">'+ltvAmt+'만</div><div class="tl-stat-l">계약금액</div></div>';
  html+='</div>';
  if(totalHrs>0&&hrRate){
    var est=TYPES[cl.typeIdx]?TYPES[cl.typeIdx].hours:0;
    var estRate=est>0?Math.round(cl.amount*10000/(est*4)):null;
    var diff=estRate?hrRate-estRate:null;
    html+='<div class="tl-efficiency">';
    if(diff!==null)html+=(diff>=0?'&#9650; 예상보다 '+Math.round(diff/10000)+'만/h 높아요':'&#9660; 예상보다 '+Math.round(Math.abs(diff)/10000)+'만/h 낮아요 — 시간 관리 확인');
    html+='</div>';
  }
  if(timeLog.length){
    html+='<div class="tl-list">';
    html+=timeLog.map(function(t){
      return'<div class="tl-row">'+'<span class="tl-date">'+t.date.slice(5)+'</span>'+'<span class="tl-hrs">'+t.hours+'h</span>'+'<span class="tl-desc">'+t.desc+'</span>'+'<button class="tl-del" data-cid="'+cl.id+'" data-tid="'+t.id+'" onclick="deleteTimeLog(this.dataset.cid,this.dataset.tid)">×</button>'+'</div>';
    }).join('');
    html+='</div>';
  }
  html+='<div class="tl-add">';
  html+='<input type="date" id="tl-date" style="width:106px" value="'+new Date().toISOString().slice(0,10)+'">';
  html+='<input type="number" id="tl-hrs" placeholder="시간" step="0.5" min="0.5" style="width:64px">';
  html+='<input type="text" id="tl-desc" placeholder="작업 내용 (선택)" style="flex:1;min-width:80px">';
  html+='<button class="btn btn-primary" data-cid="'+cl.id+'" onclick="addTimeLog(this.dataset.cid)" style="font-size:11px;padding:4px 10px">기록</button>';
  html+='</div></div>';
  // 산출물 체크리스트 섹션
  const deliverables=cl.deliverables||[];
  const dlvDone=deliverables.filter(function(d){return d.done;}).length;
  const dlvTotal=deliverables.length;
  const dlvPct=dlvTotal?Math.round(dlvDone/dlvTotal*100):0;
  html+='<div class="det-crm-sec collapsed">';
  html+='<div class="det-crm-ttl" onclick="toggleCrmSec(this)"><i class="ti ti-checklist" style="font-size:13px" aria-hidden="true"></i>산출물 체크리스트</div>';
  if(dlvTotal){
    html+='<div class="dlv-prog"><div class="dlv-prog-bar"><div class="dlv-prog-fill" style="width:'+dlvPct+'%"></div></div><span class="dlv-prog-txt">'+dlvDone+'/'+dlvTotal+' 완료 ('+dlvPct+'%)</span></div>';
    html+='<div class="dlv-list">'+deliverables.map(function(d){
      return'<div class="dlv-item">'+
        '<input type="checkbox" class="dlv-cb"'+(d.done?' checked':'')+' data-cid="'+cl.id+'" data-did="'+d.id+'" onchange="toggleDeliverable(this.dataset.cid,this.dataset.did)">'+
        '<span class="dlv-text'+(d.done?' done':'')+'">'+d.text+'</span>'+
        (d.dueDate?'<span class="dlv-due">'+d.dueDate+'</span>':'')+
        '<button class="dlv-del" data-cid="'+cl.id+'" data-did="'+d.id+'" onclick="delDeliverable(this.dataset.cid,this.dataset.did)">✕</button>'+
      '</div>';
    }).join('')+'</div>';
  }else{
    html+='<div class="dlv-empty">아직 항목이 없어요. 아래에서 추가하세요.</div>';
  }
  html+='<div class="dlv-add">';
  html+='<input type="text" id="dlv-add-text" placeholder="산출물 항목..." style="flex:1;min-width:120px">';
  html+='<input type="date" id="dlv-add-due" style="width:120px">';
  html+='<button class="btn btn-primary" data-cid="'+cl.id+'" onclick="addDeliverable(this.dataset.cid)" style="font-size:11px;padding:4px 10px">추가</button>';
  html+='</div></div>';
  var linkedBills=bills.filter(function(b){return b.clientId===cl.id;});
  if(linkedBills.length){
    html+='<div class="det-crm-sec">';
    html+='<div class="det-crm-ttl" onclick="toggleCrmSec(this)"><i class="ti ti-receipt" style="font-size:13px"></i>연결 청구서</div>';
    var bSort=[...linkedBills].sort(function(a,b){return(a.status==='paid'?1:0)-(b.status==='paid'?1:0);});
    html+=bSort.map(function(b){
      var bSt=BILL_STATUSES.find(function(s){return s.id===b.status;})||BILL_STATUSES[0];
      return'<div class="det-bill-row">'+'<div class="det-bill-info">'+(b.issueDate||'')+' — 납기 '+(b.dueDate?b.dueDate.slice(5):'')+'</div>'+'<span class="det-bill-amt">'+b.amount+'만원</span>'+'<span class="det-bill-st" style="background:'+bSt.bg+';color:'+bSt.color+'">'+bSt.label+'</span>'+'</div>';
    }).join('')+
    '</div>';
  }
  html+='<div class="det-crm-sec collapsed">';
  html+='<div class="det-crm-ttl" onclick="toggleCrmSec(this)"><i class="ti ti-message-dots" style="font-size:13px" aria-hidden="true"></i>메시지 템플릿</div>';
  html+='<div class="msg-cat-row"><button class="msg-cat-btn on" data-cat="초기연락" onclick="setMsgCat(this.dataset.cat)">초기연락</button><button class="msg-cat-btn" data-cat="제안발송" onclick="setMsgCat(this.dataset.cat)">제안발송</button><button class="msg-cat-btn" data-cat="진행중" onclick="setMsgCat(this.dataset.cat)">진행중</button><button class="msg-cat-btn" data-cat="마무리" onclick="setMsgCat(this.dataset.cat)">마무리</button></div>';
  html+='<div id="msg-tpl-list"></div></div>';
  el.innerHTML=html;
  setTimeout(function(){renderMsgTemplates();},0);
}

function saveDetailNote(){
  const cl=clients.find(x=>x.id===detClientId);
  if(cl){cl.note=document.getElementById('det-note').value;save();}
}

const COMM_CHANNELS=[{id:'kakao',label:'카카오톡',icon:'&#128172;',color:'#854F0B',bg:'#FAEEDA'},{id:'call',label:'전화',icon:'&#128222;',color:'#185FA5',bg:'#E6F1FB'},{id:'email',label:'이메일',icon:'&#9993;',color:'#3B6D11',bg:'#EAF3DE'},{id:'inperson',label:'대면',icon:'&#128101;',color:'#534AB7',bg:'#EEEDFE'},{id:'sns',label:'SNS DM',icon:'&#128241;',color:'#993556',bg:'#FBEAF0'},{id:'other',label:'기타',icon:'&#128203;',color:'#5F5E5A',bg:'#F1EFE8'}];

function addActivity(cid,text,type,channel){
  if(!activities[cid])activities[cid]=[];
  activities[cid].push({id:Date.now(),date:new Date().toISOString(),text,type:type||'note',channel:channel||''});
  try{localStorage.setItem('vd_acts',JSON.stringify(activities));}catch(e){}
}

function detAdvance(){
  const cl=clients.find(x=>x.id===detClientId);if(!cl)return;
  const idx=STAGE_ORDER.indexOf(cl.stage);
  if(idx<STAGE_ORDER.length-1){
    const prev=cl.stage;cl.stage=STAGE_ORDER[idx+1];recordStageEntry(cl,cl.stage);
    addActivity(detClientId,'단계 변경: '+(STAGES.find(s=>s.id===prev)||{label:prev}).label+' → '+(STAGES.find(s=>s.id===cl.stage)||{label:cl.stage}).label,'stage');
    renderCRM();save();renderDetail();
    if(cl.stage==='lost')showLostModal(cl.id);
  }
}

function detDelete(){
  const cl=clients.find(x=>x.id===detClientId);
  if(!cl||!confirm(cl.name+'을(를) 삭제할까요?'))return;
  clients=clients.filter(x=>x.id!==detClientId);
  closeDetail();renderCRM();save();
}

function addTimeLog(cidStr){
  var cid=parseInt(cidStr);
  var cl=clients.find(function(x){return x.id===cid;});if(!cl)return;
  var hrs=parseFloat((document.getElementById('tl-hrs')||{}).value||0);
  if(!hrs||hrs<=0){showToast('시간을 입력해주세요.');return;}
  var date=(document.getElementById('tl-date')||{}).value||new Date().toISOString().slice(0,10);
  var desc=((document.getElementById('tl-desc')||{}).value||'').trim();
  if(!cl.timeLog)cl.timeLog=[];
  cl.timeLog.push({id:Date.now(),date:date,hours:hrs,desc:desc});
  cl.timeLog.sort(function(a,b){return b.date.localeCompare(a.date);});
  save();renderCrmExtra(cl);showToast('✅ 기록됨!');
}

function deleteTimeLog(cidStr,tidStr){
  var cid=parseInt(cidStr);var tid=parseInt(tidStr);
  var cl=clients.find(function(x){return x.id===cid;});if(!cl||!cl.timeLog)return;
  cl.timeLog=cl.timeLog.filter(function(t){return t.id!==tid;});
  save();renderCrmExtra(cl);
}

function toggleSop(cidStr,idxStr){
  var cid=parseInt(cidStr);var i=parseInt(idxStr);
  var cl=clients.find(function(x){return x.id===cid;});if(!cl)return;
  if(!cl.sopDone)cl.sopDone=[];
  while(cl.sopDone.length<8)cl.sopDone.push(false);
  cl.sopDone[i]=!cl.sopDone[i];
  save();renderCrmExtra(cl);
}

function addDeliverable(cidStr){
  var cid=parseInt(cidStr);
  var cl=clients.find(function(x){return x.id===cid;});
  if(!cl)return;
  var textEl=document.getElementById('dlv-add-text');
  var text=(textEl&&textEl.value||'').trim();
  if(!text)return;
  var dueEl=document.getElementById('dlv-add-due');
  var dueDate=dueEl?dueEl.value:'';
  if(!cl.deliverables)cl.deliverables=[];
  cl.deliverables.push({id:Date.now(),text:text,done:false,dueDate:dueDate});
  save();renderCrmExtra(cl);
}

function toggleDeliverable(cidStr,didStr){
  var cid=parseInt(cidStr);var did=parseInt(didStr);
  var cl=clients.find(function(x){return x.id===cid;});
  if(!cl||!cl.deliverables)return;
  var d=cl.deliverables.find(function(x){return x.id===did;});
  if(d){d.done=!d.done;save();renderCrmExtra(cl);}
}

function delDeliverable(cidStr,didStr){
  var cid=parseInt(cidStr);var did=parseInt(didStr);
  var cl=clients.find(function(x){return x.id===cid;});
  if(!cl||!cl.deliverables)return;
  if(!confirm('삭제할까요?'))return;
  cl.deliverables=cl.deliverables.filter(function(x){return x.id!==did;});
  save();renderCrmExtra(cl);
}

let conNid=100;

const MSG_TEMPLATES=[
  {cat:'초기연락',name:'첫 미팅 요청',body:'안녕하세요! 변덕쟁이들 조형준입니다 :)\n문의 주셔서 감사해요. 구체적인 이야기를 위해 짧게 미팅을 제안드릴게요.\n\n편하신 날짜와 시간 알려주시면 맞춰볼게요. (화상/대면 모두 가능합니다)\n\n{name} 대표님의 브랜드, 잘 키워드리고 싶습니다 :)'},
  {cat:'초기연락',name:'포트폴리오 공유',body:'안녕하세요 {name} 대표님! 변덕쟁이들 조형준입니다.\n\n포트폴리오 공유 드립니다.\n[ 포트폴리오 링크 ]\n\n궁금하신 점 있으시면 편하게 문의 주세요. 감사합니다 :)'},
  {cat:'제안발송',name:'제안서 발송',body:'안녕하세요 {name} 대표님 :)\n\n말씀 나눈 내용 기반으로 제안서 준비했습니다.\n[ 제안서 파일 ]\n\n금액이나 범위 조정이 필요하시면 편하게 말씀해 주세요.'},
  {cat:'제안발송',name:'제안서 팔로업',body:'안녕하세요 {name} 대표님!\n\n어제 보내드린 제안서 확인하셨나요? :)\n궁금하신 점이나 수정사항 있으시면 편하게 말씀해 주세요.'},
  {cat:'진행중',name:'착수금 청구',body:'안녕하세요 {name} 대표님!\n\n계약서 서명 감사합니다 :) 아래 계좌로 착수금 입금 부탁드립니다.\n\n계좌: [ 계좌번호 ]\n금액: [ 착수금 금액 ]원\n예금주: 조형준\n\n입금 확인 후 바로 시작하겠습니다!'},
  {cat:'진행중',name:'중간 업데이트',body:'안녕하세요 {name} 대표님!\n\n이번 주 진행 상황 공유 드립니다.\n\n완료: [ 완료 항목 ]\n진행 중: [ 진행 중 항목 ]\n다음 일정: [ 예정 ]\n\n확인하시고 수정사항 있으시면 말씀해 주세요 :)'},
  {cat:'마무리',name:'납품 안내',body:'안녕하세요 {name} 대표님!\n\n작업물 모두 준비됐습니다 :)\n[ Google Drive 링크 ]\n\n확인 후 3일 내로 이상 없으면 말씀 주세요. 수정사항 있으시면 편하게 알려주시고요!'},
  {cat:'마무리',name:'잔금 청구',body:'안녕하세요 {name} 대표님!\n\n최종 납품 확인 감사합니다 :)\n아래 계좌로 잔금 입금 부탁드립니다.\n\n계좌: [ 계좌번호 ]\n금액: [ 잔금 금액 ]원\n\n이번에도 함께해서 즐거웠습니다!'},
  {cat:'마무리',name:'감사 & 재계약',body:'안녕하세요 {name} 대표님!\n\n이번 프로젝트 함께해서 정말 즐거웠습니다 :)\n좋은 결과 있으시길 바랍니다!\n\n추가로 필요하신 게 생기시면 언제든 연락 주세요.'},
];

const ACT_TYPE_LABEL={note:'메모',call:'통화',meeting:'미팅',dm:'DM',email:'이메일',proposal:'제안',stage:'단계변경',followup:'팔로업완료'};

const ACT_TYPE_COL={note:'#5F5E5A',call:'#185FA5',meeting:'#534AB7',dm:'#993556',email:'#3B6D11',proposal:'#854F0B',stage:'#534AB7',followup:'#1D9E75'};

let curActType='note';

let curMsgCat='초기연락';

function setActType(btn){
  curActType=btn.dataset.at;
  document.querySelectorAll('.act-type-btn').forEach(function(b){b.classList.toggle('on',b===btn);});
  const mf=document.getElementById('act-meeting-form');
  const sr=document.getElementById('act-simple-row');
  if(mf)mf.classList.toggle('open',curActType==='meeting');
  if(sr)sr.style.display=curActType==='meeting'?'none':'flex';
}

function addAct(){
  const cid=detClientId;if(!cid)return;
  let text='';
  if(curActType==='meeting'){
    const att=(document.getElementById('mf-attendees')||{}).value||'';
    const agd=(document.getElementById('mf-agenda')||{}).value||'';
    const dis=(document.getElementById('mf-discussion')||{}).value||'';
    const nxt=(document.getElementById('mf-nextaction')||{}).value||'';
    if(!agd&&!dis){alert('안건 또는 논의 내용을 입력해주세요.');return;}
    text='[미팅노트]'+(att?'\n참석: '+att:'')+(agd?'\n안건: '+agd:'')+(dis?'\n---\n'+dis:'')+(nxt?'\n→ 다음 액션: '+nxt:'');
    ['mf-attendees','mf-agenda','mf-discussion','mf-nextaction'].forEach(function(id){const el=document.getElementById(id);if(el)el.value='';});
  } else {
    const inp=document.getElementById('det-act-in');
    text=inp?inp.value.trim():'';if(!text)return;if(inp)inp.value='';
  }
  var ch2=(document.getElementById('det-act-ch')||{}).value||'';
  addActivity(cid,text,curActType,ch2);
  renderActLog();
}

function renderActLog(){
  const acts=(activities[detClientId]||[]).slice().reverse();
  const el=document.getElementById('det-actlog');if(!el)return;
  if(!acts.length){el.innerHTML='<div style="font-size:12px;color:var(--text2);padding:8px 0">아직 활동 기록이 없어요.</div>';return;}
  el.innerHTML=acts.map(function(a){
    const lbl=ACT_TYPE_LABEL[a.type]||a.type;
    const col=ACT_TYPE_COL[a.type]||'#888780';
    const bg=col+'22';
    const dt=new Date(a.date).toLocaleDateString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
    const isMtg=a.type==='meeting';
    const textHtml=isMtg?'<div class="act-meeting-content">'+a.text.replace('[미팅노트]\n','').replace('[미팅노트]','')+'</div>':'<div class="act-text">'+a.text+'</div>';
    var chInf=a.channel?COMM_CHANNELS.find(function(c){return c.id===a.channel;}):null;
    var chBdg=chInf?'<span class="act-ch-badge" style="background:'+chInf.bg+';color:'+chInf.color+'">'+chInf.icon+' '+chInf.label+'</span>':'';
    return'<div class="act-item"><div class="act-dot" style="background:'+col+'"></div><div style="flex:1"><div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;flex-wrap:wrap"><span class="act-item-type" style="background:'+bg+';color:'+col+'">'+lbl+'</span>'+chBdg+'<span class="act-meta">'+dt+'</span></div>'+textHtml+'</div></div>';
  }).join('');
}

function setMsgCat(cat){
  curMsgCat=cat;
  document.querySelectorAll('.msg-cat-btn').forEach(function(b){b.classList.toggle('on',b.dataset.cat===cat);});
  renderMsgTemplates();
}

function renderMsgTemplates(){
  const cl=clients.find(function(x){return x.id===detClientId;});
  const name=cl?cl.name:'클라이언트';
  const wrap=document.getElementById('msg-tpl-list');if(!wrap)return;
  const filtered=MSG_TEMPLATES.filter(function(t){return t.cat===curMsgCat;});
  wrap.innerHTML=filtered.map(function(t){
    const gi=MSG_TEMPLATES.indexOf(t);
    const filled=t.body.replace(/\{name\}/g,name);
    return'<div class="msg-tpl-card">'+
      '<div class="msg-tpl-nm">'+t.name+'</div>'+
      '<div class="msg-tpl-body" id="mtb-'+gi+'" onclick="toggleMsgExpand(this)">'+filled+'</div>'+
      '<button class="msg-copy-btn" id="mcb-'+gi+'" data-gi="'+gi+'" onclick="copyMsgTpl(this.dataset.gi)">복사</button>'+
    '</div>';
  }).join('');
}

function toggleMsgExpand(el){el.classList.toggle('expand');}

function copyMsgTpl(gi){
  const cl=clients.find(function(x){return x.id===detClientId;});
  const name=cl?cl.name:'클라이언트';
  const tpl=MSG_TEMPLATES[parseInt(gi)];if(!tpl)return;
  const filled=tpl.body.replace(/\{name\}/g,name);
  const doCopy=function(){
    const ta=document.createElement('textarea');ta.value=filled;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);
    const btn=document.getElementById('mcb-'+gi);
    if(btn){btn.textContent='복사됨 ✓';btn.classList.add('copied');setTimeout(function(){btn.textContent='복사';btn.classList.remove('copied');},2000);}
  };
  if(navigator.clipboard){navigator.clipboard.writeText(filled).then(doCopy).catch(doCopy);}else doCopy();
}

function toggleCrmSec(el){var sec=el.closest('.det-crm-sec');if(sec)sec.classList.toggle('collapsed');}

function openAiModal(cidStr){
  var cid=parseInt(cidStr);
  var cl=clients.find(function(x){return x.id===cid;});if(!cl)return;
  document.getElementById('ai-modal').style.display='flex';
  var prompt=generateAiPrompt(cl);
  document.getElementById('ai-prompt-content').textContent=prompt;
}

function closeAiModal(){document.getElementById('ai-modal').style.display='none';}

function copyAiPrompt(){
  var txt=(document.getElementById('ai-prompt-content')||{}).textContent||'';
  if(navigator.clipboard)navigator.clipboard.writeText(txt).then(function(){
    showToast('✅ 프롬프트 복사! Claude.ai에 붙여넣기 하세요.');
  });
}

function generateAiPrompt(cl){
  var t=TYPES[cl.typeIdx]||TYPES[0];
  var st=STAGES.find(function(s){return s.id===cl.stage;})||{};
  var src=SOURCES.find(function(s){return s.id===cl.source;})||{};
  var tags=(cl.tags||[]).map(function(tid){var pt=PRESET_TAGS.find(function(t2){return t2.id===tid;});return pt?pt.label:tid;}).join(', ');
  var health=calculateHealthScore(cl);
  var acts=(activities[cl.id]||[]).slice(-5);
  var actLog=acts.map(function(a){return '- '+a.date+' ['+a.type+'] '+a.text;}).join('\n');
  var contracts=(cl.contracts||[]).map(function(ct){return '- '+ct.date+'~'+ct.endDate+' '+ct.amount+'만';}).join('\n');
  var ltv=getClientLTV(cl)||cl.amount;
  var followupInfo=getFollowupInfo(cl);
  var lines=[
    '# 변덕쟁이들 CRM — AI 클라이언트 분석 요청',
    '',
    '## 클라이언트 프로파일',
    '클라이언트명: '+cl.name,
    '서비스 유형: '+t.name,
    '파이프라인 단계: '+(st.label||cl.stage),
    '계약 금액: '+cl.amount+'만원 (LTV '+ltv+'만원)',
    '유입 경로: '+(src.label||cl.source||'미입력'),
    '태그: '+(tags||'없음'),
    '컨택: '+(cl.contactName||'미입력')+(cl.contactRole?' ('+cl.contactRole+')':''),
    '낙관점수(NPS): '+(cl.npsScore||'미입력'),
    '클라이언트 건강도: '+health.total+'/100',
    '',
    '## 최근 활동 (5건)',
    actLog||'(없음)',
    '',
    '## 계약 이력',
    contracts||'(없음)',
    '',
    '## 현재 상태',
    '파이프라인: '+(st.label||cl.stage)+(cl.stage==='won'?' — Won 상태: '+(cl.wonStatus||'ongoing'):''),
    (cl.nextFollowup?'다음 팔로업: '+cl.nextFollowup+(followupInfo&&followupInfo.diff<0?' (지연)':''):'팔로업 미설정'),
    (cl.note?'메모: '+cl.note:''),
    '',
    '## 요청사항',
    '위 정보를 바탕으로 아래를 분석해주세요:',
    '1. 이 클라이언트의 건강 상태 평가 및 주요 리스크 요인',
    '2. 다음 팔로업에서 할 말 한 마디 (구체적 스크립트)',
    '3. 업셀링 or 재계약 가능성 빈언보',
    '4. 이 클라이언트와의 관계를 개선하기 위한 1가지 실질적 제안',
    '',
    '[변덕쟁이들 OS — 조형준 AI CRM 엔지니어링 코스]',
  ];
  return lines.filter(function(l){return l!==undefined;}).join('\n');
}
