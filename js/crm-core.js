function recordStageEntry(cl,stage){
  if(!cl.stageEnteredAt)cl.stageEnteredAt={};
  if(!cl.stageEnteredAt[stage])cl.stageEnteredAt[stage]=new Date().toISOString().slice(0,10);
}

function toggleVelocity(){
  var btn=document.getElementById('vel-toggle');
  var body=document.getElementById('vel-body');
  if(!btn||!body)return;
  var open=body.classList.toggle('open');
  btn.classList.toggle('open',open);
  if(open)renderVelocity();
}

function calcVelocity(){
  var today=new Date();today.setHours(0,0,0,0);
  var wonH=clients.filter(function(c){return c.stage==='won'&&c.stageEnteredAt&&c.stageEnteredAt.won;});
  var avgClose=null;
  if(wonH.length){
    var daysArr=wonH.map(function(c){
      var dates=Object.values(c.stageEnteredAt).filter(Boolean).sort();
      if(!dates.length)return null;
      var first=new Date(dates[0]);
      var won=new Date(c.stageEnteredAt.won);
      return Math.ceil((won-first)/(1000*60*60*24));
    }).filter(function(d){return d!==null&&d>=0;});
    if(daysArr.length)avgClose=Math.round(daysArr.reduce(function(a,b){return a+b;},0)/daysArr.length);
  }
  var activeStages=['lead','discovery','proposal','negotiation'];
  var stageData={};
  activeStages.forEach(function(sid){
    var inS=clients.filter(function(c){return c.stage===sid&&c.stageEnteredAt&&c.stageEnteredAt[sid];});
    if(inS.length){
      var avgD=Math.round(inS.reduce(function(sum,c){
        return sum+Math.max(0,Math.ceil((today-new Date(c.stageEnteredAt[sid]))/(1000*60*60*24)));
      },0)/inS.length);
      var st=STAGES.find(function(s){return s.id===sid;});
      stageData[sid]={avg:avgD,count:inS.length,label:st?st.label:sid,color:st?st.color:'#999'};
    }
  });
  var bottleneck=null;var maxD=0;
  Object.keys(stageData).forEach(function(k){
    if(stageData[k].avg>maxD){maxD=stageData[k].avg;bottleneck=Object.assign({id:k},stageData[k]);}
  });
  var now2=new Date();
  var wonMonth=clients.filter(function(c){
    if(c.stage!=='won'||!c.stageEnteredAt||!c.stageEnteredAt.won)return false;
    var d=new Date(c.stageEnteredAt.won);
    return d.getMonth()===now2.getMonth()&&d.getFullYear()===now2.getFullYear();
  }).length;
  return{avgClose:avgClose,stageData:stageData,bottleneck:bottleneck,wonMonth:wonMonth};
}

function renderVelocity(){
  var v=calcVelocity();
  var kpiEl=document.getElementById('vel-kpi-row');
  if(kpiEl){
    var closeCol=v.avgClose===null?'var(--text2)':v.avgClose<=14?'var(--teal)':v.avgClose<=30?'var(--amber)':'var(--red)';
    var bottleLbl=v.bottleneck?v.bottleneck.label.replace(/^[^ ]+ /,''):'없음';
    var bottleCol=v.bottleneck?v.bottleneck.color:'var(--text2)';
    kpiEl.innerHTML=
      '<div class="vel-kpi">'+
        '<div class="vel-kpi-v" style="color:'+closeCol+'">'+(v.avgClose!==null?v.avgClose+'일':'–')+'</div>'+
        '<div class="vel-kpi-l">평균 클로징</div>'+
        '<div class="vel-kpi-s">Lead → Won</div>'+
      '</div>'+
      '<div class="vel-kpi">'+
        '<div class="vel-kpi-v" style="color:var(--teal)">'+v.wonMonth+'건</div>'+
        '<div class="vel-kpi-l">이번 달 Won</div>'+
        '<div class="vel-kpi-s">신규 성사</div>'+
      '</div>'+
      '<div class="vel-kpi">'+
        '<div class="vel-kpi-v" style="color:'+bottleCol+'">'+bottleLbl+'</div>'+
        '<div class="vel-kpi-l">병목 단계</div>'+
        '<div class="vel-kpi-s">'+(v.bottleneck?v.bottleneck.avg+'일 평균':'데이터 없음')+'</div>'+
      '</div>';
  }
  var stEl=document.getElementById('vel-stages');
  if(stEl){
    var keys=Object.keys(v.stageData);
    if(!keys.length){stEl.innerHTML='<div class="vel-empty">단계별 데이터가 아직 없어요. 클라이언트를 단계 이동시키면 기록돼요.</div>';}
    else{
      var maxD2=Math.max.apply(null,keys.map(function(k){return v.stageData[k].avg;}),1);
      stEl.innerHTML=keys.map(function(k){
        var d=v.stageData[k];
        var pct=maxD2>0?Math.round(d.avg/maxD2*100):0;
        var col=d.avg<=7?'var(--teal)':d.avg<=14?'var(--amber)':'var(--red)';
        return'<div class="vel-stage-row">'+
          '<span class="vel-stage-lbl">'+d.label.replace(/^[\S]+ /,'')+'</span>'+
          '<div class="vel-bar-bg"><div class="vel-bar-f" style="width:'+pct+'%;background:'+col+'"></div></div>'+
          '<span class="vel-stage-days" style="color:'+col+'">'+d.avg+'일</span>'+
          '<span class="vel-stage-cnt">'+d.count+'명</span>'+
        '</div>';
      }).join('');
    }
  }
  var bEl=document.getElementById('vel-bottleneck-msg');
  if(bEl){
    if(v.bottleneck&&v.bottleneck.avg>=7){
      bEl.innerHTML='<div class="vel-bottleneck">'+
        '<strong>'+v.bottleneck.label.replace(/^[\S]+ /,'')+'</strong> 단계에서 평균 <strong>'+v.bottleneck.avg+'일</strong> 체류 중이에요. '+
        (v.bottleneck.id==='proposal'?'제안서 발송 후 팔로업을 강화해보세요.':v.bottleneck.id==='negotiation'?'협상 조건을 명확히 하거나 마감 기한을 설정해보세요.':'다음 단계로 빠르게 이동시킬 액션이 필요해요.')+
      '</div>';
    } else {
      bEl.innerHTML='';
    }
  }
}

function renderCardTags(c){
  if(!c.tags||!c.tags.length)return'';
  return'<div class="card-tag-row">'+c.tags.slice(0,3).map(function(tid){var pt=PRESET_TAGS.find(function(x){return x.id===tid;});return pt?'<span class="clt-chip" style="background:'+pt.bg+';color:'+pt.color+'">'+pt.label+'</span>':'';}).join('')+'</div>';
}

function renderCRM(){
  const total=clients.length,won=clients.filter(c=>c.stage==='won');
  const wonAmt=won.reduce((a,c)=>a+(Number(c.amount)||0),0);
  const pipe=clients.reduce((a,c)=>{const s=STAGES.find(x=>x.id===c.stage);return a+(s?c.amount*s.prob:0);},0);
  const rate=total?Math.round(won.length/total*100):0;
  document.getElementById('c-total').textContent=total;
  document.getElementById('c-pipe').textContent=Math.round(pipe)+'만';
  document.getElementById('c-won').textContent=wonAmt+'만';
  document.getElementById('c-rate').textContent=rate+'%';
  // 단계 필터 버튼 렌더
  initFilterV2();
  const sf=document.getElementById('crm-stage-filters');
  if(sf&&!sf.children.length){
    sf.innerHTML='<button class="crm-fb on" data-stage="all" onclick="setCrmStage(this.dataset.stage)">전체 단계</button>'+
    STAGES.map(st=>'<button class="crm-fb" data-stage="'+st.id+'" onclick="setCrmStage(this.dataset.stage)" style="color:'+st.color+'">'+st.label+'</button>').join('');
  }

  // 칸반 렌더
  document.getElementById('kanban').innerHTML=STAGES.map(st=>{
    const sc=clients.filter(c=>c.stage===st.id);
    return`<div class="col" ondragover="dragOver(event)" ondragleave="dragLeave(event)" ondrop="dropClient(event,'${st.id}')"><div class="col-hd"><span class="col-t">${st.label}</span><span class="col-n" style="background:${st.bg};color:${st.color}" id="col-cnt-${st.id}">${sc.length}</span></div><div class="cards" id="col-cards-${st.id}">${sc.map(c=>{const t=TYPES[c.typeIdx]||TYPES[0];return`<div class="card" id="card-${c.id}" draggable="true" ondragstart="dragStart(event,${c.id})" ondragend="dragEnd(event)" onclick="if(!_isDragging)openDetail(${c.id})"><div class="card-top"><div class="card-nm">${c.name}</div>${c.contactName?'<div style="font-size:10px;color:var(--text3);margin-top:1px">'+c.contactName+(c.contactRole?' · '+c.contactRole:'')+'</div>':''}<div class="card-badges">${(()=>{const fi=getFollowupInfo(c);const ps=PROP_STATUS.find(p=>p.id===(c.proposalStatus||'none'));const ltv=getClientLTV(c);let b='';if(fi)b+='<span class="fu-bdg '+fi.cls+'">'+fi.label+'</span>';if(c.proposalStatus&&c.proposalStatus!=='none')b+='<span class="prop-bdg" style="background:'+ps.bg+';color:'+ps.color+'">'+ps.label+'</span>';if(ltv>c.amount)b+='<span class="ltv-bdg">LTV '+ltv+'만</span>';b+=getBillBadge(c.id);b+=getWonBadge(c);b+=getLostBadge(c);b+=getNPSBadge(c);b+=getCloseDateBadge(c);return b;})()}</div></div><div class="card-tp">${t.name}</div><div class="card-ft"><span class="tag" style="background:${t.tagBg};color:${t.color}">${t.tag}</span><span class="card-am">${c.amount}만</span></div>${renderCardTags(c)}${c.note?`<div style="font-size:10px;color:var(--text3);margin-top:4px">${c.note}</div>`:''}<button class="card-clone-btn" data-cid="${c.id}" onclick="event.stopPropagation();cloneClient(this.dataset.cid)" title="클라이언트 복제">⧉</button><button class="card-ql-btn" data-cid="${c.id}" onclick="event.stopPropagation();openQuickLog(this.dataset.cid,this)" title="퀵 로그">&#9998;</button><button class="card-del" onclick="event.stopPropagation();deleteClient(${c.id})">삭제</button><div class="card-health" style="background:${(function(){const hs=calculateHealthScore(c);return getHSLevel(hs.score).color;})()}"></div></div>`;}).join('')}</div><div class="col-empty-msg">검색 결과 없음</div><div class="col-add" onclick="openModal('${st.id}')">+ 추가</div></div>`;
  }).join('');
  applyCrmFilter();
  var velBody=document.getElementById('vel-body');
  if(velBody&&velBody.classList.contains('open'))renderVelocity();
  // 모바일 터치 드래그 초기화
  if('ontouchstart' in window)setTimeout(initTouchDrag,50);
}

function setCrmStage(val){
  crmFilterStage=val;
  document.querySelectorAll('#crm-stage-filters .crm-fb').forEach(b=>b.classList.toggle('on',b.dataset.stage===val));
  applyCrmFilter();
}

function setCrmType(val){
  crmFilterType=val;
  document.querySelectorAll('#crm-type-filters .crm-fb').forEach(b=>b.classList.toggle('on',b.dataset.type===val));
  applyCrmFilter();
}

function setCrmTag(val){
  crmFilterTag=val;
  document.querySelectorAll('#crm-tag-filters .crm-fb').forEach(b=>b.classList.toggle('on',b.dataset.tag===val));
  applyCrmFilter();
}

function resetCrmFilter(){
  fpActive={svc:'all',tag:'all',src:'all'};
  // reset dropdown buttons
  var icons={svc:'ti-briefcase',tag:'ti-tag',src:'ti-git-branch'};
  var lbls={svc:'서비스',tag:'태그',src:'유입'};
  ['svc','tag','src'].forEach(function(fp){
    var btn=document.getElementById('fp-'+fp+'-btn');
    if(btn){btn.classList.remove('active');btn.innerHTML='<i class="ti '+icons[fp]+'" style="font-size:11px"></i>'+lbls[fp]+'<i class="ti ti-chevron-down" style="font-size:9px"></i>';}
    var drop=document.getElementById('fp-'+fp+'-drop');
    if(drop)drop.querySelectorAll('.crm-fp-opt').forEach(function(b){b.classList.toggle('sel',b.dataset.val==='all');});
  });
  crmFilterStage='all'; crmFilterType='all'; crmSearchQ=''; crmFilterTag='all';
  const si=document.getElementById('crm-search'); if(si) si.value='';
  document.querySelectorAll('#crm-stage-filters .crm-fb').forEach(b=>b.classList.toggle('on',b.dataset.stage==='all'));
  document.querySelectorAll('#crm-type-filters .crm-fb').forEach(b=>b.classList.toggle('on',b.dataset.type==='all'));
  document.querySelectorAll('#crm-tag-filters .crm-fb').forEach(b=>b.classList.toggle('on',b.dataset.tag==='all'));
  applyCrmFilter();
}

function applyCrmFilter(){
  const q=(document.getElementById('crm-search')||{}).value||'';
  crmSearchQ=q.trim().toLowerCase();
  const hasFilter=crmFilterStage!=='all'||crmFilterType!=='all'||crmSearchQ;
  const rst=document.getElementById('crm-reset');
  if(rst) rst.style.display=hasFilter?'':'none';
  let visTotal=0;
  STAGES.forEach(function(st){
    const col=document.getElementById('col-cards-'+st.id);
    const cnt=document.getElementById('col-cnt-'+st.id);
    if(!col) return;
    let colVis=0;
    const stageClients=clients.filter(function(cl){return cl.stage===st.id;});
    stageClients.forEach(function(cl){
      const card=document.getElementById('card-'+cl.id);
      if(!card) return;
      const t=TYPES[cl.typeIdx]||TYPES[0];
      const matchQ=!crmSearchQ||cl.name.toLowerCase().includes(crmSearchQ);
      const matchSt=crmFilterStage==='all'||cl.stage===crmFilterStage;
      const matchTp=crmFilterType==='all'||String(cl.typeIdx)===String(crmFilterType);
      const matchTag=crmFilterTag==='all'||(cl.tags&&cl.tags.includes(crmFilterTag));
      const matchFpSvc=fpActive.svc==='all'||String(cl.typeIdx)===fpActive.svc;
      const matchFpTag=fpActive.tag==='all'||(cl.tags&&cl.tags.includes(fpActive.tag));
      const matchFpSrc=fpActive.src==='all'||cl.source===fpActive.src;
      const show=matchQ&&matchSt&&matchTp&&matchTag&&matchFpSvc&&matchFpTag&&matchFpSrc;
      card.classList.toggle('crm-hidden',!show);
      if(show){ colVis++; visTotal++; }
    });
    if(cnt) cnt.textContent=hasFilter?(colVis+'/'+stageClients.length):stageClients.length;
    // 빈 컬럼 메시지
    const emptyMsg=col.parentElement?col.parentElement.querySelector('.col-empty-msg'):null;
    if(emptyMsg){
      const hasAny=stageClients.length>0;
      emptyMsg.style.display=(hasFilter&&colVis===0&&hasAny)?'block':'none';
      col.parentElement.classList.toggle('has-filter',hasFilter&&colVis===0&&hasAny);
    }
  });
  const msg=document.getElementById('crm-result-msg');
  if(msg) msg.textContent=hasFilter?visTotal+'명 표시':'';
}

let _mStage='lead';

let crmFilterStage='all', crmFilterType='all', crmSearchQ='', crmFilterTag='all';

function openModal(stage='lead'){
  _mStage=stage;
  document.getElementById('f-stage').value=stage;
  // 소개자 셀렉트 동적 populate
  const refSel=document.getElementById('f-referrer');
  if(refSel){
    refSel.innerHTML='<option value="0">없음 / 직접 유입</option>';
    clients.filter(c=>c.stage==='won').forEach(c=>{
      refSel.innerHTML+='<option value="'+c.id+'">'+c.name+' (Win)</option>';
    });
    clients.filter(c=>c.stage!=='won'&&c.stage!=='lost').forEach(c=>{
      refSel.innerHTML+='<option value="'+c.id+'">'+c.name+' (진행중)</option>';
    });
  }
  document.getElementById('modal').classList.add('open');
  setTimeout(()=>document.getElementById('f-name').focus(),50);
}

function closeModal(){document.getElementById('modal').classList.remove('open');['f-name','f-amt','f-note'].forEach(id=>document.getElementById(id).value='');const fsel=document.getElementById('f-source');if(fsel)fsel.value='';const rsel=document.getElementById('f-referrer');if(rsel)rsel.value='0';}

function addClient(){
  const name=document.getElementById('f-name').value.trim();if(!name)return;
  const typeIdx=parseInt(document.getElementById('f-type').value);
  const amt=parseInt(document.getElementById('f-amt').value)||TYPES[typeIdx].defaultAmt;
  const stage=document.getElementById('f-stage').value,note=document.getElementById('f-note').value.trim();
  const source=(document.getElementById('f-source')||{}).value||'';
  if(clients.find(function(x){return x.name.trim().toLowerCase()===name.trim().toLowerCase();})){if(!confirm('"'+name+'" 이름의 클라이언트가 이미 있어요. 그래도 추가할까요?'))return;}
const refId=parseInt((document.getElementById('f-referrer')||{}).value||'0')||0;
var newCl={id:nid++,name,typeIdx,amount:amt,stage,note,source,nextFollowup:'',followupNote:'',proposalStatus:'none',proposalSentDate:'',proposalDueDate:'',contracts:[],tags:[],deliverables:[],stageEnteredAt:{},sopDone:[],closureChecks:[],timeLog:[],wonStatus:'',npsScore:null,lostReason:'',reactivateDate:'',contactName:'',contactRole:'',expectedClose:'',referredBy:refId};
newCl.stageEnteredAt[stage]=new Date().toISOString().slice(0,10);
clients.push(newCl);
  closeModal();renderCRM();save();
}

function advanceClient(id){
  const c=clients.find(x=>x.id===id);if(!c)return;
  const idx=STAGE_ORDER.indexOf(c.stage);
  if(idx<STAGE_ORDER.length-1){c.stage=STAGE_ORDER[idx+1];recordStageEntry(c,c.stage);}
  renderCRM();save();
  if(c.stage==='lost')showLostModal(c.id);
}

function deleteClient(id){if(!confirm('삭제할까요?'))return;clients=clients.filter(c=>c.id!==id);renderCRM();save();}

function toggleClientTag(cidStr,tid){
  var cid=parseInt(cidStr);
  var cl=clients.find(function(x){return x.id===cid;});
  if(!cl)return;
  if(!cl.tags)cl.tags=[];
  var idx=cl.tags.indexOf(tid);
  if(idx>=0)cl.tags.splice(idx,1);else cl.tags.push(tid);
  save();
  renderCrmExtra(cl);
  renderCRM();
}

var _isDragging=false;

function dragStart(e,id){_isDragging=true;e.dataTransfer.setData('cid',id);setTimeout(()=>e.target.classList.add('dragging'),0);}

function dragEnd(e){e.target.classList.remove('dragging');setTimeout(function(){_isDragging=false;},50);}

function dragOver(e){
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
  // 칸반 가로 자동 스크롤
  var kb=document.querySelector('.kanban');
  if(kb){
    var rect=kb.getBoundingClientRect();
    var zone=60;
    if(e.clientX<rect.left+zone)kb.scrollLeft-=8;
    else if(e.clientX>rect.right-zone)kb.scrollLeft+=8;
  }
}

function dragLeave(e){
  // relatedTarget이 현재 컬럼 안에 있으면 leave 무시 (flickering 방지)
  if(e.relatedTarget&&e.currentTarget.contains(e.relatedTarget))return;
  e.currentTarget.classList.remove('drag-over');
}

var _touch={active:false,cid:null,ghost:null,timer:null,lastCol:null};

function initTouchDrag(){
  document.querySelectorAll('.card[draggable]').forEach(function(card){
    card.addEventListener('touchstart',function(e){
      var cid=parseInt(card.id.replace('card-',''));
      _touch.timer=setTimeout(function(){
        _touch.active=true;_touch.cid=cid;
        card.classList.add('dragging');
        // 고스트 엘리먼트
        var ghost=card.cloneNode(true);
        ghost.style.cssText='position:fixed;opacity:.7;pointer-events:none;z-index:9999;width:'+card.offsetWidth+'px;transform:scale(1.03);box-shadow:0 4px 20px rgba(0,0,0,.18);';
        document.body.appendChild(ghost);_touch.ghost=ghost;
        var t=e.touches[0];
        ghost.style.left=(t.clientX-card.offsetWidth/2)+'px';
        ghost.style.top=(t.clientY-30)+'px';
      },300);
    },{passive:true});
    card.addEventListener('touchmove',function(e){
      clearTimeout(_touch.timer);
      if(!_touch.active)return;
      e.preventDefault();
      var t=e.touches[0];
      if(_touch.ghost){
        _touch.ghost.style.left=(t.clientX-_touch.ghost.offsetWidth/2)+'px';
        _touch.ghost.style.top=(t.clientY-30)+'px';
      }
      // 아래 요소 찾기
      _touch.ghost&&(_touch.ghost.style.display='none');
      var el=document.elementFromPoint(t.clientX,t.clientY);
      _touch.ghost&&(_touch.ghost.style.display='');
      var col=el&&el.closest('.col');
      if(col!==_touch.lastCol){
        if(_touch.lastCol)_touch.lastCol.classList.remove('drag-over');
        if(col)col.classList.add('drag-over');
        _touch.lastCol=col;
      }
    },{passive:false});
    card.addEventListener('touchend',function(e){
      clearTimeout(_touch.timer);
      if(_touch.ghost){_touch.ghost.remove();_touch.ghost=null;}
      card.classList.remove('dragging');
      if(!_touch.active){_touch.active=false;return;}
      _touch.active=false;
      var t=e.changedTouches[0];
      var el=document.elementFromPoint(t.clientX,t.clientY);
      var col=el&&el.closest('.col');
      if(_touch.lastCol)_touch.lastCol.classList.remove('drag-over');
      if(col){
        // 단계 찾기
        var stageId=null;
        col.querySelectorAll('.col-hd .col-t').forEach(function(){});
        var cards=col.querySelector('.cards');
        if(cards){
          // col의 ondrop에서 stage 파라미터 추출
          var ondr=col.getAttribute('ondrop')||'';
          var m=ondr.match(/dropClient\(event,'([^']+)'\)/);
          if(m)stageId=m[1];
        }
        if(stageId){
          var fakeE={preventDefault:function(){},currentTarget:col,dataTransfer:{getData:function(){return _touch.cid;}}};
          dropClient(fakeE,stageId);
        }
      }
      _touch.lastCol=null;
    },{passive:true});
    card.addEventListener('touchcancel',function(){
      clearTimeout(_touch.timer);
      if(_touch.ghost){_touch.ghost.remove();_touch.ghost=null;}
      card.classList.remove('dragging');
      if(_touch.lastCol)_touch.lastCol.classList.remove('drag-over');
      _touch.active=false;_touch.lastCol=null;
    },{passive:true});
  });
}

function dropClient(e,stage){
  e.preventDefault();
  // drag-over 전체 제거
  document.querySelectorAll('.col.drag-over').forEach(function(el){el.classList.remove('drag-over');});
  const id=parseInt(e.dataTransfer.getData('cid'));
  const cl=clients.find(x=>x.id===id);
  if(!cl)return;
  if(cl.stage===stage){_isDragging=false;return;}
  const prev=cl.stage;
  cl.stage=stage;
  recordStageEntry(cl,stage);
  // won → 다른 단계로 이동 시 wonStatus 초기화
  if(prev==='won'&&stage!=='won')cl.wonStatus='';
  addActivity(id,'단계 변경: '+(STAGES.find(s=>s.id===prev)||{label:prev}).label+' → '+(STAGES.find(s=>s.id===stage)||{label:stage}).label,'stage');
  save();renderCRM();
  var stLabel=(STAGES.find(function(s){return s.id===stage;})||{label:stage}).label;
  showToast('&#8594; '+cl.name+' → '+stLabel);
  if(stage==='lost')setTimeout(function(){showLostModal(id);},200);
  _isDragging=false;
}

let crmView='kanban';

function setCrmView(v){
  crmView=v;
  document.getElementById('vt-kanban').classList.toggle('on',v==='kanban');
  document.getElementById('vt-list').classList.toggle('on',v==='list');
  document.getElementById('kanban').style.display=v==='kanban'?'':'none';
  const lv=document.getElementById('crm-list-view');
  if(lv)lv.classList.toggle('show',v==='list');
  if(v==='list')renderCrmList();
}

function renderCrmList(){
  const SRC={kmong:'크몽',referral:'지인소개',sns:'SNS',direct:'직접연락',newsletter:'뉴스레터',etc:'기타'};
  const body=document.getElementById('crm-list-body');if(!body)return;
  const sorted=[...clients].sort(function(a,b){
    const order=['lead','discovery','proposal','negotiation','won','lost'];
    return order.indexOf(a.stage)-order.indexOf(b.stage);
  });
  body.innerHTML=sorted.map(function(cl){
    const t=TYPES[cl.typeIdx]||TYPES[0];
    const st=STAGES.find(function(s){return s.id===cl.stage;})||{label:cl.stage,bg:'#eee',color:'#666'};
    const hs=calculateHealthScore(cl);
    const hsLv=getHSLevel(hs.score);
    const fu=getFollowupInfo(cl);
    const ltv=getClientLTV(cl);
    return'<tr onclick="openDetail('+cl.id+')">'+
      '<td><div class="crm-lv-hs" style="background:'+hsLv.bg+';color:'+hsLv.color+'">'+hs.score+'</div></td>'+
      '<td style="font-weight:500">'+cl.name+'</td>'+
      '<td><span class="tag" style="background:'+t.tagBg+';color:'+t.color+';font-size:10px">'+t.tag+'</span></td>'+
      '<td onclick="event.stopPropagation()"><select class="lv-stage-sel" data-cid="'+cl.id+'" onchange="lvChangeStage(this)" style="font-size:10px;border:none;background:'+st.bg+';color:'+st.color+';border-radius:4px;padding:2px 4px;cursor:pointer;font-family:inherit">'+STAGES.map(function(s){return'<option value="'+s.id+'"'+(s.id===cl.stage?' selected':'')+'>'+s.label+'</option>';}).join('')+'</select></td>'+
      '<td style="font-weight:500">'+cl.amount+'만</td>'+
      '<td style="color:#534AB7">'+( ltv>0?ltv+'만':'–')+'</td>'+
      '<td>'+(fu?'<span class="fu-bdg '+fu.cls+'">'+fu.label+'</span>':'–')+'</td>'+
      '<td style="color:var(--text2);font-size:11px">'+(SRC[cl.source]||cl.source||'–')+'</td>'+
    '</tr>';
  }).join('');
}

function lvChangeStage(sel){
  var cid=parseInt(sel.dataset.cid);
  var stage=sel.value;
  var cl=clients.find(function(x){return x.id===cid;});
  if(!cl||cl.stage===stage)return;
  var prev=cl.stage;
  cl.stage=stage;
  recordStageEntry(cl,stage);
  if(prev==='won'&&stage!=='won')cl.wonStatus='';
  addActivity(cid,'단계 변경: '+(STAGES.find(function(s){return s.id===prev;})||{label:prev}).label+' → '+(STAGES.find(function(s){return s.id===stage;})||{label:stage}).label,'stage');
  save();renderCRM();
  var stLabel=(STAGES.find(function(s){return s.id===stage;})||{label:stage}).label;
  showToast('&#8594; '+cl.name+' → '+stLabel);
  if(stage==='lost')setTimeout(function(){showLostModal(cid);},200);
}

var fpActive={svc:'all',tag:'all',src:'all'};

function initFilterV2(){
  // Service dropdown
  var sd=document.getElementById('fp-svc-drop');if(sd)sd.innerHTML=
    '<button class="crm-fp-opt sel" data-fp="svc" data-val="all" onclick="setFp(this)">전체 서비스</button>'+
    TYPES.map(function(t,i){return'<button class="crm-fp-opt" data-fp="svc" data-val="'+i+'" onclick="setFp(this)">'+t.name+'</button>';}).join('');
  // Tag dropdown
  var td=document.getElementById('fp-tag-drop');if(td)td.innerHTML=
    '<button class="crm-fp-opt sel" data-fp="tag" data-val="all" onclick="setFp(this)">전체 태그</button>'+
    PRESET_TAGS.map(function(t){return'<button class="crm-fp-opt" data-fp="tag" data-val="'+t.id+'" onclick="setFp(this)">'+t.label+'</button>';}).join('');
  // Source dropdown
  var srd=document.getElementById('fp-src-drop');if(srd)srd.innerHTML=
    '<button class="crm-fp-opt sel" data-fp="src" data-val="all" onclick="setFp(this)">전체 유입</button>'+
    SOURCES.map(function(s){return'<button class="crm-fp-opt" data-fp="src" data-val="'+s.id+'" onclick="setFp(this)">'+s.label+'</button>';}).join('');
}

function toggleFpDrop(fpId){
  var d=document.getElementById(fpId+'-drop');if(!d)return;
  var wasOpen=d.classList.contains('open');
  // close all
  ['fp-svc-drop','fp-tag-drop','fp-src-drop'].forEach(function(id){var el=document.getElementById(id);if(el)el.classList.remove('open');});
  if(!wasOpen)d.classList.add('open');
}

function setFp(btn){
  var fp=btn.dataset.fp;var val=btn.dataset.val;
  fpActive[fp]=val;
  // update button label
  var lbl={svc:'서비스',tag:'태그',src:'유입'}[fp];
  var displayLbl=val==='all'?lbl:btn.textContent.trim();
  var btnEl=document.getElementById('fp-'+fp+'-btn');
  if(btnEl){btnEl.classList.toggle('active',val!=='all');
    var icons={svc:'ti-briefcase',tag:'ti-tag',src:'ti-git-branch'};
    btnEl.innerHTML='<i class="ti '+icons[fp]+'" style="font-size:11px"></i>'+displayLbl+'<i class="ti ti-chevron-down" style="font-size:9px"></i>';}
  // update opts
  document.querySelectorAll('[data-fp="'+fp+'"]').forEach(function(b){b.classList.toggle('sel',b.dataset.val===val);});
  toggleFpDrop(fp);// close dropdown
  applyCrmFilter();
}

document.addEventListener('click',function(e){
  if(!e.target.closest('.crm-fp'))['fp-svc-drop','fp-tag-drop','fp-src-drop'].forEach(function(id){var el=document.getElementById(id);if(el)el.classList.remove('open');});
});

function exportCSV(){
  var headers=['아이디','이름','서비스','단계','금액(만)','유입경로','소개자','컨택이름','컨택직책','예상클로징','태그','만족도','Won상태','LTV(만)'];
  var rows=clients.map(function(c){
    var t=TYPES[c.typeIdx]||TYPES[0];
    var st=STAGES.find(function(s){return s.id===c.stage;})||{};
    var src=SOURCES.find(function(s){return s.id===c.source;})||{};
    var tags=(c.tags||[]).map(function(tid){
      var pt=PRESET_TAGS.find(function(t2){return t2.id===tid;});
      return pt?pt.label:tid;
    }).join('/');
    return[c.id,c.name,t.name,st.label||c.stage,c.amount,
      src.label||c.source,(function(){var r=clients.find(function(x){return x.id===c.referredBy;});return r?r.name:'';})(),c.contactName||'',c.contactRole||'',
      c.expectedClose||'',tags,c.npsScore||'',c.wonStatus||'',
      (getClientLTV(c)||c.amount)];
  });
  var csv=[headers].concat(rows).map(function(row){
    return row.map(function(v){
      return'"'+String(v||'').replace(/"/g,'""')+'"';
    }).join(',');
  }).join('\n');
  var uri='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv);
  var a=document.createElement('a');
  a.href=uri;
  a.download='변덕쟁이들_클라이언트_'
    +new Date().toISOString().slice(0,10)+'.csv';
  document.body.appendChild(a);a.click();
  setTimeout(function(){document.body.removeChild(a);},100);
  showToast('✅ CSV 완료!');
}

function cloneClient(cidStr){
  var cid=parseInt(cidStr);
  var src=clients.find(function(x){return x.id===cid;});if(!src)return;
  if(!confirm(src.name+'을(를) 복제할까요?'))return;
  var newCl={id:nid++,
    name:src.name+' (복제)',
    typeIdx:src.typeIdx, amount:src.amount, stage:'lead',
    note:src.note||'', source:src.source||'',
    nextFollowup:'', followupNote:'',
    proposalStatus:'none', proposalSentDate:'', proposalDueDate:'',
    contracts:[], tags:[...(src.tags||[])],
    deliverables:[], stageEnteredAt:{lead:new Date().toISOString().slice(0,10)},
    sopDone:[], closureChecks:[], timeLog:[],
    wonStatus:'', npsScore:null, lostReason:'', reactivateDate:'',
    contactName:src.contactName||'', contactRole:src.contactRole||'', expectedClose:'',
    referredBy:0
  };
  clients.push(newCl);
  save(); renderCRM();
  showToast('✅ '+src.name+' 복제 완료! 이름을 수정해주세요.');
}
