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
  let html='<div class="det-crm-sec collapsed">';
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

function toggleCrmSec(el){var sec=el.closest('.det-crm-sec');if(sec)sec.classList.toggle('collapsed');}

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
