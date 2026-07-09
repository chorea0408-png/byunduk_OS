function updateFollowup(cid,field,val){
  const cl=clients.find(function(x){return x.id==cid;});
  if(!cl)return;
  cl[field]=val;
  save();
  // 카드 뱃지 즉시 업데이트
  const card=document.getElementById('card-'+cid);
  if(card) renderCRM();
}

function markFollowupDone(cid){
  const cl=clients.find(function(x){return x.id==cid;});
  if(!cl)return;
  const note='팔로업 완료 ('+cl.nextFollowup+')';
  activities[cid]=activities[cid]||[];
  activities[cid].unshift({date:new Date().toISOString().slice(0,10),text:note,type:'followup'});
  try{localStorage.setItem('vd_acts',JSON.stringify(activities));}catch(e){}
  cl.nextFollowup='';cl.followupNote='';
  save();renderDetail();renderCRM();renderHome();
}

function setPropStatus(cid,pid){
  const cl=clients.find(function(x){return x.id==cid;});
  if(!cl)return;
  cl.proposalStatus=pid;
  if(pid==='sent'&&!cl.proposalSentDate) cl.proposalSentDate=new Date().toISOString().slice(0,10);
  save();renderDetail();renderCRM();
}

function addContract(cid){
  const cl=clients.find(function(x){return x.id==cid;});
  if(!cl)return;
  const amt=parseInt(document.getElementById('con-add-amt').value)||0;
  if(!amt){alert('금액을 입력해주세요.');return;}
  cl.contracts=cl.contracts||[];
  cl.contracts.unshift({
    id:conNid++,
    date:document.getElementById('con-add-date').value||new Date().toISOString().slice(0,10),
    typeIdx:parseInt(document.getElementById('con-add-type').value)||0,
    amount:amt,
    note:document.getElementById('con-add-note').value.trim(),
    endDate:(document.getElementById('con-add-end')||{}).value||''
  });
  save();renderDetail();renderCRM();
  if(cl.stage==='won')showClosureModal(cl);
}

function delContract(cid,ctid){
  const cl=clients.find(function(x){return x.id==cid;});
  if(!cl)return;
  cl.contracts=(cl.contracts||[]).filter(function(ct){return ct.id!=ctid;});
  save();renderDetail();
}

const HS_LEVELS=[
  {min:80,label:'우수',color:'#1D9E75',bg:'#E1F5EE'},
  {min:60,label:'양호',color:'#185FA5',bg:'#E6F1FB'},
  {min:40,label:'보통',color:'#BA7517',bg:'#FAEEDA'},
  {min:20,label:'주의',color:'#854F0B',bg:'#FAEEDA'},
  {min:0, label:'위험',color:'#A32D2D',bg:'#FCEBEB'},
];

function getHSLevel(score){return HS_LEVELS.find(function(l){return score>=l.min;})||HS_LEVELS[4];}

function calculateHealthScore(cl){
  let score=0;
  const breakdown=[];
  const MAX={activity:30,followup:25,stage:25,relation:20};
  // 1. 최근 활동 (30점)
  const acts=(activities[cl.id]||[]);
  const lastActDate=acts.length?new Date(acts[acts.length-1].date):null;
  let actPts=0,actNote='기록 없음';
  if(lastActDate){
    const days=Math.floor((Date.now()-lastActDate)/(1000*60*60*24));
    if(days<=7){actPts=30;actNote='최근 '+days+'일 이내';}
    else if(days<=14){actPts=22;actNote=days+'일 경과';}
    else if(days<=30){actPts=12;actNote=days+'일 경과';}
    else{actPts=0;actNote=days+'일 경과 — 연락 필요';}
  }else{actPts=15;actNote='신규 (기록 없음)';}
  score+=actPts;breakdown.push({label:'최근 활동',pts:actPts,max:MAX.activity,note:actNote,color:'#534AB7'});
  // 2. 팔로업 (25점)
  let fuPts=10,fuNote='예정일 없음';
  if(cl.nextFollowup){
    const fu=getFollowupInfo(cl);
    if(fu.days<0){fuPts=0;fuNote='D+'+Math.abs(fu.days)+' 지남 — 즉시 연락';}
    else if(fu.days<=3){fuPts=20;fuNote='D-'+fu.days+' 코앞';}
    else{fuPts=25;fuNote='D-'+fu.days+' 예정';}
  }
  score+=fuPts;breakdown.push({label:'팔로업',pts:fuPts,max:MAX.followup,note:fuNote,color:'#185FA5'});
  // 3. 단계 가치 (25점) — won은 wonStatus + NPS 반영
  const stagePtsMap={lost:0,lead:5,discovery:12,proposal:18,negotiation:22,won:25};
  let stagePts=stagePtsMap[cl.stage]||0;
  const stgObj=STAGES.find(function(s){return s.id===cl.stage;})||{label:cl.stage};
  let stgNote=stgObj.label;
  if(cl.stage==='won'){
    if(cl.wonStatus==='paused'){stagePts=15;stgNote='Won (일시중단)';}
    else if(cl.wonStatus==='completed'){stagePts=18;stgNote='Won (완료)';}
    if(cl.npsScore>=4){stagePts=Math.min(stagePts+3,25);stgNote+=' · NPS '+cl.npsScore;}
    else if(cl.npsScore&&cl.npsScore<=2){stagePts=Math.max(stagePts-5,0);stgNote+=' · NPS '+cl.npsScore+' (저조)';}
  }
  score+=stagePts;breakdown.push({label:'단계',pts:stagePts,max:MAX.stage,note:stgNote,color:'#3B6D11'});
  // 4. 관계 & LTV (20점) — 계약 수, 소개 이력 반영
  let relPts=0,relNote='';
  const ltv=getClientLTV(cl);
  const contractCnt=(cl.contracts||[]).length;
  if(contractCnt>=2){relPts+=5;relNote+='재계약 '+contractCnt+'회 ';}
  else if(contractCnt===1){relPts+=3;relNote+='계약 1회 ';}
  if(ltv>=300){relPts+=10;relNote+='LTV '+ltv+'만';}
  else if(ltv>=150){relPts+=6;relNote+='LTV '+ltv+'만';}
  else if(ltv>0){relPts+=3;relNote+='LTV '+ltv+'만';}
  var referralCount=0;
  if(typeof clients!=='undefined')referralCount=clients.filter(function(cx){return cx.referredBy===cl.id;}).length;
  if(referralCount>0){relPts=Math.min(relPts+referralCount*2,MAX.relation);relNote+=' · 소개 '+referralCount+'건';}
  if(!relNote)relNote='이력 없음';
  score+=relPts;breakdown.push({label:'관계 & LTV',pts:Math.min(relPts,MAX.relation),max:MAX.relation,note:relNote,color:'#993556'});
  return{score:Math.min(score,100),breakdown};
}

const PROP_STATUS=[
  {id:'none',     label:'미발송',  color:'#5F5E5A',bg:'#F1EFE8'},
  {id:'sent',     label:'발송완료',color:'#185FA5',bg:'#E6F1FB'},
  {id:'reviewing',label:'검토중',  color:'#854F0B',bg:'#FAEEDA'},
  {id:'accepted', label:'수락',    color:'#1D9E75',bg:'#E1F5EE'},
  {id:'rejected', label:'거절',    color:'#A32D2D',bg:'#FCEBEB'},
];

function getFollowupInfo(cl){
  if(!cl.nextFollowup)return null;
  const today=new Date();today.setHours(0,0,0,0);
  const due=new Date(cl.nextFollowup);
  const days=Math.round((due-today)/(1000*60*60*24));
  let cls,label;
  if(days<0){cls='fu-over';label='D+'+Math.abs(days)+' 지남';}
  else if(days===0){cls='fu-urg';label='오늘';}
  else if(days<=3){cls='fu-urg';label='D-'+days;}
  else if(days<=7){cls='fu-soon';label='D-'+days;}
  else{cls='fu-ok';label='D-'+days;}
  var acts2=(activities[cl.id]||[]);
  var lastAct=acts2.length?acts2[acts2.length-1]:null;
  return{days,cls,label,lastChannel:lastAct&&lastAct.channel?lastAct.channel:null,lastType:lastAct&&lastAct.type?lastAct.type:null,hint:cl.followupNote?cl.followupNote.slice(0,20):''};
}

function getClientLTV(cl){
  const contracts=cl.contracts||[];
  const histSum=contracts.reduce(function(a,ct){return a+(ct.amount||0);},0);
  return histSum+(cl.stage==='won'?(Number(cl.amount)||0):0);
}

function autoFillRetro(){
  const now=new Date();
  const prevMon=new Date(now.getFullYear(),now.getMonth()-1,1);
  const prevKey=prevMon.getFullYear()+'-'+(prevMon.getMonth()+1).toString().padStart(2,'0');
  const prevData=retros[prevKey];
  const curKey=now.getFullYear()+'-'+(now.getMonth()+1).toString().padStart(2,'0');
  if(!prevData){showToast('이전 달 회고 데이터가 없어요.','info');return;}
  // 전월 데이터 비교 인사이트 생성
  const curRev=monthlyActuals[now.getMonth()]||0;
  const prevRev=monthlyActuals[prevMon.getMonth()]||0;
  const diff=curRev-prevRev;
  const hint='[전월 자동 비교]\n전월 매출: '+prevRev+'만 → 이번 달: '+curRev+'만 ('+(diff>=0?'+':'')+diff+'만)\n\n전월 Keep: '+( prevData.keep||'기록 없음')+'\n전월 Problem: '+(prevData.problem||'기록 없음');
  const keepEl=document.getElementById('rt-keep');
  if(keepEl&&!keepEl.value){keepEl.value=hint;saveRetro();}
  showToast('전월 데이터를 불러왔어요!','success');
}

var propModalClientId=null;

function openPropModal(cid){
  propModalClientId=cid;
  var cl=clients.find(function(x){return x.id===cid;});
  var svcSel=document.getElementById('pm-svc');
  if(svcSel&&!svcSel.children.length)svcSel.innerHTML=TYPES.map(function(t,i){return'<option value="'+i+'">'+t.name+'</option>';}).join('');
  if(cl){
    var n=document.getElementById('pm-client');if(n)n.value=cl.name||'';
    if(svcSel)svcSel.value=cl.typeIdx||0;
    var a=document.getElementById('pm-amt');if(a)a.value=cl.amount||'';
  }
  var out=document.getElementById('pm-output');if(out){out.textContent='';out.style.display='none';}
  var fts=document.getElementById('pm-fts');if(fts)fts.style.display='none';
  var ov=document.getElementById('prop-modal-overlay');if(ov)ov.classList.add('open');
}

function closePropModal(){
  var ov=document.getElementById('prop-modal-overlay');if(ov)ov.classList.remove('open');
  propModalClientId=null;
}

function generateProposal(){
  var clientNm=(document.getElementById('pm-client')||{}).value||'글라이언트';
  var svcIdx=parseInt((document.getElementById('pm-svc')||{}).value||0);
  var svc=TYPES[svcIdx]||TYPES[0];
  var amt=(document.getElementById('pm-amt')||{}).value||svc.defaultAmt;
  var period=(document.getElementById('pm-period')||{}).value||'3개월';
  var bg=((document.getElementById('pm-bg')||{}).value||'').trim()||'현재 SNS 운영에 개선이 필요한 상황입니다.';
  var effect=((document.getElementById('pm-effect')||{}).value||'').trim()||'브랜드 인지도 향상 및 신규 고객 유입 증대를 기대합니다.';
  var today=new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric'});
  var lines=[
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '서  비  스   제  안  서',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '수  신 : '+clientNm+' 김응업 규중',
    '발  신 : 변덕쟁이들 | 조형준',
    '날  짜 : '+today,
    '',
    '1. 제안 배경',
    '────────────────────────',
    bg,
    '변덕쟁이들의 서비스를 통해 이 문제를 펴과적으로 해결하고자 합니다.',
    '',
    '2. 제안 서비스 구성',
    '────────────────────────',
    '[서비스] '+svc.name,
    '[기  간] '+period,
    '[금  액] '+amt+'만원 / 월 (VAT 별도)',
    '[포  함] '+svc.name+' 운영 전반 (문의 시 세부 조율 가능)',
    '',
    '3. 기대 효과',
    '────────────────────────',
    effect,
    '',
    '4. 계약 조건',
    '────────────────────────',
    '· 결제 : 착수금 50% 선입금 → 잔금 50%',
    '· 시작일 : 계약 코인 후 D+3 이내',
    '· 유효기간 : 제안일로부터 14일',
    '',
    '5. 변덕쟁이들 소개',
    '────────────────────────',
    '"트렌드보다 오래가는 마케팅 — 근본이즘"',
    '소상공인 전용 1인 마케팅 에이전시로, 첫 미팅부터 납품까지 직접 소통합니다.',
    '',
    '질문’ 커톨톨, 제안 도시락 안에 편하게 연락주세요!',
  ];
  var out=document.getElementById('pm-output');
  if(out){out.textContent=lines.join('\n');out.style.display='block';}
  var fts=document.getElementById('pm-fts');if(fts)fts.style.display='flex';
}

function copyProposal(){
  var out=document.getElementById('pm-output');if(!out)return;
  var text=out.textContent;
  if(navigator.clipboard){navigator.clipboard.writeText(text).then(function(){showToast('✅ 제안서 복사됨!');});}
  else{var ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);showToast('✅ 복사 완료!');}
}

const CLOSURE_TASKS=[
  {id:'portfolio', label:'포트폴리오 등록',  sub:'계약 케이스를 포트폴리오에 추가'},
  {id:'review',    label:'클라이언트 후기 요청',sub:'구글 리뷰 or 카카오 후기 링크 발송'},
  {id:'recontract',label:'재계약 팔로업 등록',  sub:'CRM 다음 팔로업 날짜 설정'},
  {id:'sns_perm',  label:'SNS 공유 허가 확인', sub:'성과 콘텐츠 활용 동의 받기'},
  {id:'casestudy', label:'케이스 스터디 작성',  sub:'내부 아카이브 or 블로그 발행'},
];

var closureClientId=null;

function showClosureModal(cl){
  closureClientId=cl.id;
  var nm=document.getElementById('closure-client-nm');
  if(nm)nm.textContent='&#127881; '+cl.name+' 종료 체크리스트';
  renderClosureItems(cl);
  var ov=document.getElementById('closure-overlay');if(ov)ov.classList.add('open');
}

function closeClosureModal(){
  var ov=document.getElementById('closure-overlay');if(ov)ov.classList.remove('open');
  closureClientId=null;
}

function renderClosureItems(cl){
  var done=cl.closureChecks||[];
  var cnt=CLOSURE_TASKS.filter(function(t){return done.includes(t.id);}).length;
  var prog=document.getElementById('closure-prog');
  if(prog)prog.textContent=cnt+'/'+CLOSURE_TASKS.length+' 완료'+(cnt===CLOSURE_TASKS.length?' — 모두 완료! &#127881;':'');
  var el=document.getElementById('closure-items');if(!el)return;
  el.innerHTML=CLOSURE_TASKS.map(function(t){
    var isDone=done.includes(t.id);
    return'<div class="closure-item'+(isDone?' done':'')+'" data-tid="'+t.id+'" onclick="toggleClosureCheck(this.dataset.tid)">'+'<div class="closure-cb">'+(isDone?'<i class="ti ti-check" style="font-size:11px"></i>':'')+'</div>'+'<div class="closure-item-body">'+'<div class="closure-item-ttl">'+t.label+'</div>'+'<div class="closure-item-sub">'+t.sub+'</div>'+'</div></div>';
  }).join('');
}

function toggleClosureCheck(tid){
  var cl=clients.find(function(x){return x.id===closureClientId;});if(!cl)return;
  if(!cl.closureChecks)cl.closureChecks=[];
  var idx=cl.closureChecks.indexOf(tid);
  if(idx>=0)cl.closureChecks.splice(idx,1);else cl.closureChecks.push(tid);
  renderClosureItems(cl);
}

function saveClosureAndClose(){
  var cl=clients.find(function(x){return x.id===closureClientId;});
  if(cl){save();showToast('✅ 체크리스트 저장됨!');}
  closeClosureModal();
  if(cl)renderCrmExtra(cl);
}

var qlCid=null;

function openQuickLog(cidStr,btn){
  qlCid=parseInt(cidStr);
  var cl=clients.find(function(x){return x.id===qlCid;});
  var panel=document.getElementById('ql-panel');if(!panel)return;
  var rect=btn.getBoundingClientRect();
  panel.style.top=(rect.bottom+window.scrollY+4)+'px';
  panel.style.left=Math.min(rect.left+window.scrollX,window.innerWidth-250)+'px';
  var nm=document.getElementById('ql-nm');if(nm)nm.textContent=cl?cl.name+' 퀘 로그':'';
  var ch=document.getElementById('ql-ch');
  if(ch&&ch.children.length<=1)ch.innerHTML='<option value="">송수신 선택</option>'+COMM_CHANNELS.map(function(c){return'<option value="'+c.id+'">'+c.icon+' '+c.label+'</option>';}).join('');
  var txt=document.getElementById('ql-txt');if(txt)txt.value='';
  panel.style.display='block';
  if(txt)txt.focus();
}

function closeQuickLog(){var p=document.getElementById('ql-panel');if(p)p.style.display='none';qlCid=null;}

function submitQuickLog(){
  var txt=((document.getElementById('ql-txt')||{}).value||'').trim();
  if(!txt||!qlCid){showToast('내용을 입력해주세요.');return;}
  var ch=(document.getElementById('ql-ch')||{}).value||'';
  addActivity(qlCid,txt,'note',ch);
  closeQuickLog();
  showToast('✅ 기록됨!');
}

document.addEventListener('click',function(e){
  var p=document.getElementById('ql-panel');
  if(p&&p.style.display!=='none'&&!p.contains(e.target)&&!e.target.classList.contains('card-ql-btn'))closeQuickLog();
});

function getCloseDateBadge(c){
  if(!c.expectedClose||c.stage==='won'||c.stage==='lost')return'';
  var cd=new Date(c.expectedClose);var dn=new Date();dn.setHours(0,0,0,0);
  var diff=Math.ceil((cd-dn)/(1000*60*60*24));
  if(diff>14)return'';
  var lbl=diff<0?'D+'+Math.abs(diff):diff===0?'오늘':'D-'+diff;
  return'<span class="cd-badge" style="background:'+(diff<0?'#FCEBEB':'#FAEEDA')+';color:'+(diff<0?'#A32D2D':'#854F0B')+'">'+lbl+'</span>';
}

var lostTargetCid=null;

function showLostModal(cid){lostTargetCid=cid;var s=document.getElementById('lost-reason-sel');if(s)s.innerHTML='<option value="">사유 선택</option>'+LOST_REASONS.map(function(r){return'<option>'+r+'</option>';}).join('');var n=document.getElementById('lost-reason-note');if(n)n.value='';var o=document.getElementById('lost-modal-ov');if(o)o.classList.add('open');}

function closeLostModal(){var o=document.getElementById('lost-modal-ov');if(o)o.classList.remove('open');lostTargetCid=null;}

function saveLostReason(){var cl=clients.find(function(x){return x.id===lostTargetCid;});if(cl){var r=(document.getElementById('lost-reason-sel')||{}).value||'';var n=((document.getElementById('lost-reason-note')||{}).value||'').trim();cl.lostReason=r+(n?(r?' — ':'')+n:'');save();renderCRM();}closeLostModal();}

function setWonStatus(cidStr,status){var cl=clients.find(function(x){return x.id===parseInt(cidStr);});if(!cl)return;cl.wonStatus=status;save();renderCRM();renderCrmExtra(cl);}

function setNPS(cidStr,score){var cl=clients.find(function(x){return x.id===parseInt(cidStr);});if(!cl)return;cl.npsScore=cl.npsScore===score?null:score;save();renderCrmExtra(cl);}

function saveReactivateDate(cidStr){var cl=clients.find(function(x){return x.id===parseInt(cidStr);});if(!cl)return;var el=document.getElementById('reactivate-date-'+cidStr);if(el)cl.reactivateDate=el.value||'';save();showToast('✅ 저장됨!');}

function getWonBadge(c){if(c.stage!=='won')return'';var ws=WON_STATUS.find(function(s){return s.id===(c.wonStatus||'ongoing');});if(!ws)ws=WON_STATUS[0];return'<span class="won-status-badge" style="background:'+ws.bg+';color:'+ws.color+'">'+ws.label+'</span>';}

function getLostBadge(c){if(c.stage!=='lost'||!c.lostReason)return'';return'<span class="lost-reason-badge">⚠️ '+c.lostReason.slice(0,10)+'</span>';}

function getNPSBadge(c){if(c.stage!=='won'||!c.npsScore)return'';return'<span class="won-status-badge" style="background:#FEF3C7;color:#854F0B">'+'&#9733;'.repeat(c.npsScore)+'</span>';}

const HEALTH_HIST_KEY='vd_health_hist';

function manualSaveHealth(cidStr,btn){
  saveHealthHistory();
  if(btn){btn.classList.add('saved');btn.innerHTML='<i class="ti ti-check" style="font-size:11px"></i>저장 완료';}
  showToast('&#128200; 건강도 히스토리가 저장됐어요!');
  // 차트 갱신
  var cid=parseInt(cidStr);
  var chartWrap=document.getElementById('hs-trend-chart-'+cid);
  if(chartWrap){chartWrap.innerHTML=renderHealthTrend(cid);}
  setTimeout(function(){
    if(btn){btn.classList.remove('saved');btn.innerHTML='<i class="ti ti-device-floppy" style="font-size:11px"></i>이달 건강도 저장';}
  },2500);
}

function saveHealthHistory(){
  var ym=new Date().toISOString().slice(0,7); // 'YYYY-MM'
  var hist={};
  try{var raw=localStorage.getItem(HEALTH_HIST_KEY);if(raw)hist=JSON.parse(raw);}catch(e){}
  if(!hist[ym])hist[ym]={};
  clients.forEach(function(cl){
    var hs=calculateHealthScore(cl);
    hist[ym][cl.id]={score:hs.score,name:cl.name,stage:cl.stage};
  });
  // 최대 12개월 보관
  var months=Object.keys(hist).sort();
  if(months.length>12)months.slice(0,months.length-12).forEach(function(m){delete hist[m];});
  try{localStorage.setItem(HEALTH_HIST_KEY,JSON.stringify(hist));}catch(e){}
}

function getHealthHistory(cid){
  // cid에 대한 최근 6개월 점수 반환 [{ym, score}]
  var hist={};
  try{var raw=localStorage.getItem(HEALTH_HIST_KEY);if(raw)hist=JSON.parse(raw);}catch(e){}
  var months=Object.keys(hist).sort().slice(-6);
  return months.map(function(ym){
    var entry=hist[ym]&&hist[ym][cid];
    return{ym:ym,score:entry?entry.score:null};
  });
}

function renderHealthTrend(cid){
  var data=getHealthHistory(cid);
  var hasData=data.some(function(d){return d.score!==null;});
  if(!hasData)return '<div style="font-size:11px;color:var(--text3);padding:4px 0">아직 히스토리가 없어요. 이달부터 쌓이기 시작해요.</div>';
  var W=180,H=44,PAD=4;
  var scores=data.map(function(d){return d.score===null?0:d.score;});
  var maxS=Math.max.apply(null,scores)||100;
  var pts=scores.map(function(s,i){
    var x=PAD+i*(W-PAD*2)/Math.max(scores.length-1,1);
    var y=H-PAD-(s/100)*(H-PAD*2);
    return x.toFixed(1)+','+y.toFixed(1);
  }).join(' ');
  var dotHtml=scores.map(function(s,i){
    if(data[i].score===null)return'';
    var x=PAD+i*(W-PAD*2)/Math.max(scores.length-1,1);
    var y=H-PAD-(s/100)*(H-PAD*2);
    var lv=getHSLevel(s);
    return'<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="3" fill="'+lv.color+'" title="'+data[i].ym+': '+s+'점"/>';
  }).join('');
  var lblHtml=data.map(function(d,i){
    var x=PAD+i*(W-PAD*2)/Math.max(data.length-1,1);
    return'<text x="'+x.toFixed(1)+'" y="'+(H+10)+'" text-anchor="middle" font-size="8" fill="var(--text3)">'+d.ym.slice(5)+'</text>';
  }).join('');
  return '<svg viewBox="0 0 '+W+' '+(H+14)+'" style="width:100%;max-width:'+W+'px;overflow:visible">'+
    '<polyline points="'+pts+'" fill="none" stroke="var(--acc)" stroke-width="1.5" stroke-linejoin="round"/>'+
    dotHtml+lblHtml+'</svg>';
}
