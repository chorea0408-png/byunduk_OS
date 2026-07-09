function saveChan(){try{localStorage.setItem('vd_channels',JSON.stringify(channelRecs));}catch(e){}}

function addSnapshot(){
  const date=document.getElementById('ch-date').value;
  if(!date){alert('날짜를 선택해 주세요.');return;}
  channelRecs.push({
    id:chanNid++,date,
    ig:parseInt(document.getElementById('ch-ig').value)||0,
    lt:parseInt(document.getElementById('ch-lt').value)||0,
    bl:parseInt(document.getElementById('ch-bl').value)||0,
    yt:parseInt(document.getElementById('ch-yt').value)||0,
    th:parseInt(document.getElementById('ch-th').value)||0,
  });
  channelRecs.sort(function(a,b){return a.date.localeCompare(b.date);});
  ['ch-ig','ch-lt','ch-bl','ch-yt','ch-th'].forEach(function(id){document.getElementById(id).value='';});
  saveChan();renderChannels();
}

function delSnapshot(id){
  if(!confirm('삭제할까요?'))return;
  channelRecs=channelRecs.filter(function(r){return r.id!==id;});
  saveChan();renderChannels();
}

function renderChannels(){
  const sorted=[...channelRecs].sort(function(a,b){return a.date.localeCompare(b.date);});
  const latest=sorted[sorted.length-1]||{ig:0,lt:0,bl:0,yt:0,th:0};
  const prev=sorted[sorted.length-2]||null;
  // KPI 카드
  document.getElementById('ch-kpi-grid').innerHTML=CHANNELS.map(function(ch){
    const cur=latest[ch.id]||0,pre=prev?prev[ch.id]:0;
    const delta=cur-pre;
    const pct=pre?Math.round(Math.abs(delta)/pre*100):0;
    const dCol=delta>0?'#1D9E75':delta<0?'#E24B4A':'var(--text3)';
    const dStr=delta>0?'+'+delta:delta<0?String(delta):'–';
    return '<div class="ch-kpi" style="border-left-color:'+ch.color+'">'+
      '<div class="ch-kpi-ch" style="color:'+ch.color+'"><i class="ti ti-circle-filled" style="font-size:8px" aria-hidden="true"></i>'+ch.label+'</div>'+
      '<div class="ch-kpi-v" style="color:'+ch.color+'">'+(cur||'–')+'</div>'+
      '<div class="ch-kpi-d" style="color:'+dCol+'">'+dStr+(pct&&delta!==0?' ('+pct+'%)':'')+(prev?' MoM':'')+'</div>'+
      '</div>';
  }).join('');
  // Chart.js 라인 차트
  const labels=sorted.map(function(r){
    const d=new Date(r.date);return d.toLocaleDateString('ko-KR',{month:'short',day:'numeric'});
  });
  const dark=isDark();
  const gridC=dark?'rgba(255,255,255,.07)':'rgba(0,0,0,.05)';
  const textC=dark?'#888780':'#73726c';
  const cdata={
    labels:labels,
    datasets:CHANNELS.map(function(ch){
      return{
        label:ch.label,
        data:sorted.map(function(r){return r[ch.id]||0;}),
        borderColor:ch.color,
        backgroundColor:ch.color+'22',
        pointBackgroundColor:ch.color,
        tension:.35,fill:false,borderWidth:2,pointRadius:4,pointHoverRadius:6
      };
    })
  };
  const copts={
    responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:true,position:'top',labels:{font:{size:11},boxWidth:10,padding:14,color:textC}},
      tooltip:{callbacks:{label:function(ctx){return ctx.dataset.label+': '+ctx.parsed.y.toLocaleString()+'명';}}}},
    scales:{
      x:{grid:{color:gridC},ticks:{color:textC,font:{size:11}}},
      y:{grid:{color:gridC},ticks:{color:textC,font:{size:11},callback:function(v){return v+'명';}},beginAtZero:true}
    },
    animation:{duration:300}
  };
  if(!chanChart){chanChart=new Chart(document.getElementById('ch-canvas'),{type:'line',data:cdata,options:copts});}
  else{chanChart.data=cdata;chanChart.update('none');}
  // 히스토리 테이블
  const wrap=document.getElementById('ch-hist-wrap');
  if(!sorted.length){wrap.innerHTML='<div class="lt-empty">스냅샷이 없어요. 위에서 추가해보세요.</div>';return;}
  const rev=[...sorted].reverse();
  wrap.innerHTML='<table class="ch-hist"><thead><tr><th>날짜</th>'+CHANNELS.map(function(ch){
    return '<th style="color:'+ch.color+'">'+ch.label+'</th>';
  }).join('')+'<th></th></tr></thead><tbody>'+
  rev.map(function(r,i){
    const prevR=rev[i+1];
    return '<tr><td>'+r.date.slice(0,7)+'</td>'+CHANNELS.map(function(ch){
      const cur=r[ch.id]||0;const pre=prevR?prevR[ch.id]:0;
      const delta=cur-pre;
      const ds=delta>0?'<span class="ch-delta" style="color:#1D9E75"> +'+delta+'</span>':delta<0?'<span class="ch-delta" style="color:#E24B4A"> '+delta+'</span>':'';
      return '<td>'+(cur||'–')+(prevR?ds:'')+'</td>';
    }).join('')+'<td><button class="lt-del" onclick="delSnapshot('+r.id+')">삭제</button></td></tr>';
  }).join('')+'</tbody></table>';
}

var SNAP_PFX='vd_snap_',MAX_SNAPS=7;

function saveSnapshot(){
  var today=new Date().toISOString().slice(0,10);
  var key=SNAP_PFX+today;
  try{
    if(localStorage.getItem(key))return;// 오늘 이미 저장됨
    var snap={
      clients:clients,nid:nid,
      bills:bills,billNid:billNid,
      activities:activities,
      actionItems:actionItems,
      expenses:(typeof expenses!=='undefined'?expenses:[]),
      retros:(typeof retros!=='undefined'?retros:[]),
      ideas:ideas||[],
      partners:partners||[],
      memos:memos||[]
    };
    localStorage.setItem(key,JSON.stringify(snap));
    cleanOldSnaps();
    saveHealthHistory(); // 스냅샷과 함께 건강도 히스토리 저장
  }catch(e){console.warn('snapshot failed:',e);}
}

function cleanOldSnaps(){
  try{
    var keys=Object.keys(localStorage).filter(function(k){return k.startsWith(SNAP_PFX);}).sort();
    keys.slice(0,Math.max(0,keys.length-MAX_SNAPS)).forEach(function(k){localStorage.removeItem(k);});
  }catch(e){}
}

function openSnapModal(){
  var el=document.getElementById('snap-list');if(!el)return;
  try{
    var keys=Object.keys(localStorage).filter(function(k){return k.startsWith(SNAP_PFX);}).sort().reverse();
    if(!keys.length){el.innerHTML='<div style="padding:20px;text-align:center;color:var(--text3);font-size:12px">스냅샷이 없어요.<br>다음 실행 시 자동저장됨</div>';}
    else el.innerHTML=keys.map(function(k){
      var date=k.replace(SNAP_PFX,'');
      var data=JSON.parse(localStorage.getItem(k)||'{}');
      var cnt=(data.clients||[]).length;
      return'<div class="snap-item">'+'<div><div class="snap-date">'+date+'</div>'+'<div class="snap-meta">클라이언트 '+cnt+'명 · 청구서 '+(data.bills||[]).length+'건</div></div>'+'<button class="btn btn-primary" onclick="restoreSnap(\''+date+'\')" style="font-size:11px">복원</button>'+'</div>';
    }).join('');
  }catch(e){el.innerHTML='<div style="padding:16px;color:var(--red)">오류: '+e.message+'</div>';}
  document.getElementById('snap-modal').style.display='flex';
}

function closeSnapModal(){document.getElementById('snap-modal').style.display='none';}

function restoreSnap(date){
  if(!confirm(date+' 스냅샷으로 복원할까요?\n주의: 현재 데이터가 덮어씌워집니다.'))return;
  try{
    var data=JSON.parse(localStorage.getItem(SNAP_PFX+date)||'{}');
    if(data.clients)clients=data.clients;
    if(data.nid)nid=data.nid;
    if(data.bills)bills=data.bills;
    if(data.billNid)billNid=data.billNid;
    if(data.activities)activities=data.activities;
    if(data.actionItems)actionItems=data.actionItems;
    if(data.expenses&&typeof expenses!=='undefined')expenses=data.expenses;
    if(data.retros&&typeof retros!=='undefined')retros=data.retros;
    if(data.ideas)ideas=data.ideas;
    if(data.partners)partners=data.partners;
    if(data.memos)memos=data.memos;
    save();saveBills();
    // 복원 후 데이터 정규화
    clients.forEach(function(cl){
      if(cl.referredBy===undefined)cl.referredBy=0;
      if(!cl.tags)cl.tags=[];
      if(!cl.deliverables)cl.deliverables=[];
      if(!cl.timeLog)cl.timeLog=[];
      if(!cl.contracts)cl.contracts=[];
      if(!cl.stageEnteredAt)cl.stageEnteredAt={};
      if(typeof cl.amount!=='number')cl.amount=Number(cl.amount)||0;
      if(!cl.wonStatus)cl.wonStatus='ongoing';
      if(!cl.npsScore&&cl.npsScore!==0)cl.npsScore=null;
    });
    bills.forEach(function(b){
      if(b.recurring===undefined)b.recurring=false;
      if(!b.invoiceNo)b.invoiceNo='';
      if(typeof b.amount!=='number')b.amount=Number(b.amount)||0;
      if(b.desc===undefined)b.desc='';
      if(b.vatType===undefined)b.vatType='0';
    });
    closeSnapModal();
    renderHome();renderCRM();renderBilling();renderDday();
    showToast('✅ '+date+' 스냅샷 복원 완료!');
  }catch(e){showToast('❌ 복원 실패: '+e.message);}
}
