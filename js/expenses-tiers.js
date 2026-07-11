function saveExp(){
  try{localStorage.setItem('vd_expenses',JSON.stringify(expCategories));}catch(e){}
}

function getMonthRev(i){
  // 연간목표 탭과 동일한 단일 기준(getActualMonthlyRevenue)을 사용 — 청구서 입금액 우선, 없으면 수동 입력값 폴백
  return getActualMonthlyRevenue(i);
}

function getMonthExp(i){return expCategories.reduce(function(a,cat){return a+(cat.months[i]||0);},0);}

function getTaxEst(annualNet){
  // 종합소득세 누진세율 (근사치, 기본공제 150만 적용)
  const net=Math.max(annualNet-150,0)*10000;
  let tax=0;
  if(net<=12000000)tax=net*.06;
  else if(net<=46000000)tax=720000+(net-12000000)*.15;
  else if(net<=88000000)tax=5820000+(net-46000000)*.24;
  else if(net<=150000000)tax=15900000+(net-88000000)*.35;
  else tax=37600000+(net-150000000)*.38;
  return Math.round(tax/10000);
}

function addExpCategory(){
  const inp=document.getElementById('exp-new-cat');
  if(!inp)return;
  const nm=inp.value.trim();if(!nm)return;
  const colors=['#534AB7','#3B6D11','#854F0B','#185FA5'];
  expCategories.push({id:expNid++,name:nm,color:colors[expNid%colors.length],months:new Array(12).fill(0)});
  inp.value='';
  saveExp();renderExpense();
}

function delExpCategory(id){
  if(expCategories.length<=1)return;
  if(!confirm('삭제할까요?'))return;
  expCategories=expCategories.filter(function(c){return c.id!=id;});
  saveExp();renderExpense();
}

function onExpInput(id,mi){
  const el=document.getElementById('expi-'+id+'-'+mi);
  const val=parseInt(el.value)||0;
  const cat=expCategories.find(function(c){return c.id==id;});
  if(cat){cat.months[mi]=val;saveExp();}
  updateExpTotals();
}

function updateExpTotals(){
  const curMon=new Date().getMonth();
  const totRev=Array.from({length:12},function(_,i){return getMonthRev(i);});
  const totExp=Array.from({length:12},function(_,i){return getMonthExp(i);});
  const totProfit=totRev.map(function(r,i){return r-totExp[i];});

  // 행 합계 업데이트
  expCategories.forEach(function(cat){
    const annSum=cat.months.reduce(function(a,v){return a+v;},0);
    const annBud=expBudgets[cat.id]||0;
    const el=document.getElementById('exp-ann-'+cat.id);
    if(el){
      el.textContent=annSum||'–';
      if(annBud>0){
        const ratio=annSum/annBud;
        el.className='exp-cell-val'+(ratio>1?' exp-over':ratio>0.8?' exp-warn':annSum>0?' exp-ok':'');
        el.title='연예산 '+annBud+'만 대비 '+Math.round(ratio*100)+'%';
      }
    }
    cat.months.forEach(function(v,i){
      const cell=document.getElementById('expv-'+cat.id+'-'+i);
      if(cell)cell.textContent=v||'–';
    });
  });

  // 합계 행
  for(let i=0;i<12;i++){
    const el=document.getElementById('exp-totv-'+i);
    if(el){el.textContent=totExp[i]?totExp[i]+'만':'–';}
  }
  const annTotExp=totExp.reduce(function(a,v){return a+v;},0);
  const et=document.getElementById('exp-totann');if(et)et.textContent=annTotExp?annTotExp+'만':'–';

  // 매출 행
  for(let i=0;i<12;i++){
    const el=document.getElementById('exp-revv-'+i);
    if(el){el.textContent=totRev[i]?totRev[i]+'만':'–';}
  }
  const annRev=totRev.reduce(function(a,v){return a+v;},0);
  const er=document.getElementById('exp-revann');if(er)er.textContent=annRev?annRev+'만':'–';

  // 순수익 행
  for(let i=0;i<12;i++){
    const el=document.getElementById('exp-profv-'+i);
    if(el){
      const p=totProfit[i];
      const hasData=totRev[i]>0||totExp[i]>0;
      el.className='exp-cell-val'+(hasData?(p>=0?' pos':' neg'):'');
      el.textContent=hasData?(p>=0?'+'+p:String(p))+'만':'–';
    }
  }
  const annProfit=totProfit.reduce(function(a,v){return a+v;},0);
  const ep=document.getElementById('exp-profann');
  if(ep){
    const hasData=annRev>0||annTotExp>0;
    ep.className='exp-cell-val'+(hasData?(annProfit>=0?' pos':' neg'):'');
    ep.textContent=hasData?(annProfit>=0?'+'+annProfit:String(annProfit))+'만':'–';
  }

  // KPI
  const curExp=totExp[curMon];const prevExp=curMon>0?totExp[curMon-1]:0;
  const curRev=totRev[curMon];const curProfit=totProfit[curMon];
  const annExpFiltered=totExp.filter(function(v){return v>0;});
  const annRevFiltered=totRev.filter(function(v){return v>0;});
  const annExpSum=annExpFiltered.reduce(function(a,v){return a+v;},0);
  const annRevSum=annRevFiltered.reduce(function(a,v){return a+v;},0);
  const annProfitSum=annRevSum-annExpSum;

  const k1=document.getElementById('exp-k1');if(k1)k1.textContent=curExp?curExp+'만':'–';
  const k1s=document.getElementById('exp-k1s');
  if(k1s&&prevExp){const d=curExp-prevExp;k1s.textContent=(d>=0?'+':'')+d+'만 전월 대비';}
  else if(k1s)k1s.textContent='이번 달';
  const k2=document.getElementById('exp-k2');
  if(k2){
    k2.textContent=(curRev||curExp)?(curProfit>=0?'+'+curProfit:curProfit)+'만':'–';
    k2.style.color=curProfit>=0?'#1D9E75':'#E24B4A';
  }
  const k2s=document.getElementById('exp-k2s');if(k2s)k2s.textContent=curRev+'만 − '+curExp+'만';
  const k3=document.getElementById('exp-k3');if(k3)k3.textContent=annExpSum?annExpSum+'만':'–';
  const k4=document.getElementById('exp-k4');
  if(k4){
    k4.textContent=(annRevSum||annExpSum)?(annProfitSum>=0?'+'+annProfitSum:annProfitSum)+'만':'–';
    k4.style.color=annProfitSum>=0?'#1D9E75':'#E24B4A';
  }

  // 세금 추정
  const t33=Math.round(annRevSum*0.033);
  const taxEst=getTaxEst(annProfitSum);
  const afterTax=annProfitSum-taxEst;
  const tx33=document.getElementById('exp-tax33');if(tx33)tx33.textContent=annRevSum?t33+'만 (추정)':'–';
  const txe=document.getElementById('exp-taxest');if(txe)txe.textContent=annProfitSum>0?taxEst+'만 (추정)':'–';
  const txa=document.getElementById('exp-aftertax');
  if(txa){txa.textContent=annProfitSum>0?(afterTax>=0?'+'+afterTax:afterTax)+'만':'–';txa.style.color=afterTax>=0?'#1D9E75':'#E24B4A';}

  // 차트 업데이트
  updateExpChart(totRev,totExp,totProfit);
}

function updateExpChart(totRev,totExp,totProfit){
  const labels=['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  const dark=isDark();
  const gridC=dark?'rgba(255,255,255,.07)':'rgba(0,0,0,.05)';
  const textC=dark?'#888780':'#73726c';
  const profColors=totProfit.map(function(v,i){
    return(totRev[i]||totExp[i])?(v>=0?'#1D9E7599':'#E24B4A99'):'#eeecea';
  });
  const cdata={labels:labels,datasets:[
    {type:'bar',label:'매출',data:totRev,backgroundColor:'#1D9E7533',borderColor:'#1D9E75',borderWidth:1,borderRadius:3,order:2},
    {type:'bar',label:'지출',data:totExp,backgroundColor:'#E24B4A33',borderColor:'#E24B4A',borderWidth:1,borderRadius:3,order:3},
    {type:'line',label:'순수익',data:totProfit.map(function(v,i){return(totRev[i]||totExp[i])?v:null;}),borderColor:'#534AB7',backgroundColor:'#534AB722',pointBackgroundColor:profColors,tension:.3,fill:false,borderWidth:2,pointRadius:4,order:1},
  ]};
  const copts={responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:true,position:'top',labels:{font:{size:11},boxWidth:10,padding:12,color:textC}},
      tooltip:{callbacks:{label:function(ctx){return ctx.dataset.label+': '+ctx.parsed.y+'만원';}}}},
    scales:{
      x:{grid:{color:gridC},ticks:{color:textC,font:{size:10}}},
      y:{grid:{color:gridC},ticks:{color:textC,font:{size:10},callback:function(v){return v+'만';}},beginAtZero:true}
    },animation:{duration:200}};
  if(!expChart){expChart=new Chart(document.getElementById('exp-canvas'),{type:'bar',data:cdata,options:copts});}
  else{expChart.data=cdata;expChart.update('none');}
}

function renderExpense(){
  const curMon=new Date().getMonth();
  const MONTHS=['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

  // 이번 달 헤더 강조
  MONTHS.forEach(function(_,i){
    const th=document.getElementById('exp-th-'+i);
    if(th)th.innerHTML=(i===curMon?'<strong style="color:var(--teal)">'+MONTHS[i]+'</strong><span class="exp-cur-badge">이번달</span>':MONTHS[i]);
  });

  // tbody 렌더
  const tbody=document.getElementById('exp-tbody');
  let rows='';
  // 예산 알림 박스 (과다 지출)
  const budgetAlertEl=document.getElementById('exp-budget-alert');
  const overCats=expCategories.filter(function(cat){
    const bud=expBudgets[cat.id];
    if(!bud||bud<=0)return false;
    const total=cat.months.reduce(function(a,v){return a+v;},0);
    return total>bud*12;
  });
  if(budgetAlertEl){
    if(overCats.length){
      budgetAlertEl.textContent='예산 초과: '+overCats.map(function(c){return c.name;}).join(', ')+' (연간 예산 기준)';
      budgetAlertEl.classList.add('show');
    }else{budgetAlertEl.classList.remove('show');}
  }
  // 예산 행
  rows+='<tr class="exp-budget-row"><td class="exp-td-cat"><div class="exp-cat-nm" style="color:#534AB7"><span class="exp-cat-dot" style="background:#534AB7"></span>월 예산 설정</div></td>';
  for(let i=0;i<12;i++){
    // 예산은 월 동일 (연간 ÷ 12로 계산)
  }
  rows+='<td><span class="exp-cell-val" style="color:#534AB7">월 기준</span></td></tr>';
  expCategories.forEach(function(cat){
    rows+='<tr>';
    rows+='<td class="exp-td-cat"><div class="exp-cat-nm"><span class="exp-cat-dot" style="background:'+cat.color+'"></span>'+cat.name+
          '<button class="exp-del" data-eid="'+cat.id+'" onclick="delExpCategory(this.dataset.eid)" aria-label="삭제">✕</button></div></td>';
    for(let i=0;i<12;i++){
      const isCur=i===curMon;
      rows+='<td class="'+(isCur?'exp-cur-col':'')+'">'+'<input class="exp-inp'+(isCur?' cur-mon':'')+'" id="expi-'+cat.id+'-'+i+
            '" type="number" min="0" value="'+(cat.months[i]||'')+'" placeholder="0" data-eid="'+cat.id+'" data-mon="'+i+
            '" oninput="onExpInput(this.dataset.eid,parseInt(this.dataset.mon))">'+'</td>';
    }
    const annSum=cat.months.reduce(function(a,v){return a+v;},0);
    rows+='<td><span class="exp-cell-val" id="exp-ann-'+cat.id+'">'+(annSum||'–')+'</span></td>';
    rows+='</tr>';
  });
  // 카테고리 추가 행
  rows+='<tr class="exp-add-row"><td class="exp-td-cat" colspan="14"><div class="exp-cat-add">'+
        '<input id="exp-new-cat" type="text" placeholder="카테고리 이름..." onkeydown="if(event.key===\'Enter\')addExpCategory()">'+
        '<button onclick="addExpCategory()"><i class="ti ti-plus" style="font-size:11px"></i> 카테고리 추가</button>'+
        '</div></td></tr>';
  // 지출 합계 행
  rows+='<tr class="exp-row-total"><td class="exp-td-cat"><div class="exp-cat-nm" style="color:var(--text2)">지출 합계</div></td>';
  for(let i=0;i<12;i++) rows+='<td class="'+(i===curMon?'exp-cur-col':'')+'" id="exp-totv-'+i+'"><span class="exp-cell-val">–</span></td>';
  rows+='<td id="exp-totann"><span class="exp-cell-val">–</span></td></tr>';
  // 매출 행 (연간 목표 연동)
  rows+='<tr class="exp-row-rev"><td class="exp-td-cat"><div class="exp-cat-nm" style="color:var(--teal)">매출 <span style="font-size:9px;font-weight:400;color:var(--text3)">(연간목표 탭 연동)</span></div></td>';
  for(let i=0;i<12;i++) rows+='<td class="'+(i===curMon?'exp-cur-col':'')+'" id="exp-revv-'+i+'"><span class="exp-cell-val" style="color:var(--teal)">–</span></td>';
  rows+='<td id="exp-revann"><span class="exp-cell-val" style="color:var(--teal)">–</span></td></tr>';
  // 순수익 행
  rows+='<tr class="exp-row-profit"><td class="exp-td-cat"><div class="exp-cat-nm" style="font-weight:600">순수익</div></td>';
  for(let i=0;i<12;i++) rows+='<td class="'+(i===curMon?'exp-cur-col':'')+'" id="exp-profv-'+i+'"><span class="exp-cell-val">–</span></td>';
  rows+='<td id="exp-profann"><span class="exp-cell-val">–</span></td></tr>';

  tbody.innerHTML=rows;
  updateExpTotals();
}

function toggleRecontract(){
  const cl=clients.find(function(x){return x.id===detClientId;});
  if(!cl)return;
  cl.recontract=!cl.recontract;
  saveClients();renderDetail();
  if(document.querySelector('.panel[data-tab="source"]').classList.contains('active')) renderSource();
}

function renderRecontract(){
  const won=clients.filter(function(c){return c.stage==='won';});
  const rc=won.filter(function(c){return c.recontract;});
  const rate=won.length?Math.round(rc.length/won.length*100):0;
  const strip=document.getElementById('rc-strip');
  const list=document.getElementById('rc-list');
  if(!strip||!list)return;
  strip.innerHTML=
    '<div class="rc-card"><div class="rc-card-t">Won 클라이언트</div><div class="rc-card-v">'+won.length+'명</div><div class="rc-card-s">전체 계약 완료</div></div>'+
    '<div class="rc-card"><div class="rc-card-t">재계약 클라이언트</div><div class="rc-card-v" style="color:#534AB7">'+rc.length+'명</div>'+
      '<div class="rc-card-s">Won 중 재계약</div><div class="rc-bar-bg"><div class="rc-bar-f" style="width:'+rate+'%"></div></div></div>'+
    '<div class="rc-card"><div class="rc-card-t">재계약률</div><div class="rc-card-v" style="color:'+(rate>=50?'#1D9E75':'#854F0B')+'">'+rate+'%</div>'+
      '<div class="rc-card-s">'+(rate>=50?'우수 👍':rate>=30?'양호':'개선 필요')+'</div></div>'+
    '<div class="rc-card"><div class="rc-card-t">일반 종결</div><div class="rc-card-v" style="color:var(--text2)">'+(won.length-rc.length)+'명</div><div class="rc-card-s">재계약 없이 종결</div></div>';
  list.innerHTML=won.length?won.map(function(cl){
    const t=TYPES[cl.typeIdx]||TYPES[0];
    return '<div class="rc-item">'+
      '<span class="rc-item-nm">'+cl.name+'</span>'+
      '<span class="tag" style="background:'+t.tagBg+';color:'+t.color+';font-size:10px">'+t.tag+'</span>'+
      '<span class="rc-bdg '+(cl.recontract?'rc-yes':'rc-no')+'">'+(cl.recontract?'♻️ 재계약':'1회성')+'</span>'+
    '</div>';
  }).join(''):'<div class="lt-empty">Won 클라이언트가 없어요. CRM에서 단계를 진행해보세요.</div>';
}

const TIERS=[
  {id:'T1',label:'T1 슈퍼팬',  color:'#534AB7',bg:'#EEEDFE'},
  {id:'T2',label:'T2 활성 팬', color:'#185FA5',bg:'#E6F1FB'},
  {id:'T3',label:'T3 잠재 팬', color:'#3B6D11',bg:'#EAF3DE'},
  {id:'T4',label:'T4 일반',    color:'#5F5E5A',bg:'#F1EFE8'},
];

let tierPeople=[],tierNid=10,tierFilter='all';

function saveTier(){try{localStorage.setItem('vd_tier',JSON.stringify(tierPeople));}catch(e){}}

function tierToggleForm(){document.getElementById('tier-add-form').classList.toggle('open');}

function setTierFilter(v){
  tierFilter=v;
  document.querySelectorAll('#tier-tier-filter .crm-fb').forEach(function(b){b.classList.toggle('on',b.dataset.tv===v);});
  renderTier();
}

function addTierPerson(){
  const nm=document.getElementById('tier-f-nm').value.trim();if(!nm)return;
  tierPeople.push({
    id:tierNid++,
    name:nm,
    channel:document.getElementById('tier-f-ch').value,
    tier:document.getElementById('tier-f-tier').value,
    date:document.getElementById('tier-f-date').value,
    note:document.getElementById('tier-f-note').value.trim(),
  });
  ['tier-f-nm','tier-f-note'].forEach(function(id){document.getElementById(id).value='';});
  document.getElementById('tier-f-date').value='';
  saveTier();renderTier();
  document.getElementById('tier-add-form').classList.remove('open');
}

function delTierPerson(id){
  if(!confirm('삭제할까요?'))return;
  tierPeople=tierPeople.filter(function(p){return p.id!=id;});
  saveTier();renderTier();
}

function changeTier(id,val){
  const p=tierPeople.find(function(x){return x.id==id;});
  if(p){p.tier=val;saveTier();renderTier();}
}

function renderTier(){
  const ti=localStorage.getItem('vd_tier');
  if(ti&&!tierPeople.length){tierPeople=JSON.parse(ti);tierNid=Math.max(...tierPeople.map(function(p){return p.id;}),9)+1;}
  // stat 카드
  TIERS.forEach(function(t){
    const el=document.getElementById('ts-'+t.id);
    if(el)el.textContent=tierPeople.filter(function(p){return p.tier===t.id;}).length;
  });
  // 검색·필터
  const q=((document.getElementById('tier-search')||{}).value||'').toLowerCase();
  const filtered=tierPeople.filter(function(p){
    const matchQ=!q||p.name.toLowerCase().includes(q)||(p.note&&p.note.toLowerCase().includes(q));
    const matchT=tierFilter==='all'||p.tier===tierFilter;
    return matchQ&&matchT;
  });
  const msg=document.getElementById('tier-msg');
  if(msg)msg.textContent=(q||tierFilter!=='all')?filtered.length+'명':'';
  const wrap=document.getElementById('tier-list');
  if(!filtered.length){wrap.innerHTML='<div class="tier-empty">'+(tierPeople.length?'검색 결과가 없어요.':'아직 등록된 팬·독자가 없어요. 위에서 추가해보세요.')+'</div>';return;}
  // 정렬: T1→T2→T3→T4, 같은 Tier 안에서는 최근 상호작용 순
  const order={T1:0,T2:1,T3:2,T4:3};
  const sorted=[...filtered].sort(function(a,b){
    if(order[a.tier]!==order[b.tier])return order[a.tier]-order[b.tier];
    return (b.date||'').localeCompare(a.date||'');
  });
  wrap.innerHTML=sorted.map(function(p){
    const t=TIERS.find(function(x){return x.id===p.tier;})||TIERS[3];
    const daysSince=p.date?Math.floor((new Date()-new Date(p.date))/(1000*60*60*24)):-1;
    const dStr=daysSince>=0?(daysSince===0?'오늘':daysSince+'일 전'):'기록 없음';
    return '<div class="tier-card" style="border-left-color:'+t.color+'">'+
      '<div class="tier-card-hd">'+
        '<span style="font-size:10px;font-weight:600;padding:2px 7px;border-radius:99px;background:'+t.bg+';color:'+t.color+'">'+t.id+'</span>'+
        '<span class="tier-card-nm">'+p.name+'</span>'+
        '<span class="tier-card-ch">'+p.channel+'</span>'+
        '<select class="tier-chgsel" data-pid="'+p.id+'" onchange="changeTier(this.dataset.pid,this.value)">'+
          TIERS.map(function(tt){return'<option value="'+tt.id+'"'+(p.tier===tt.id?' selected':'')+'>'+tt.label+'</option>';}).join('')+
        '</select>'+
        '<button class="tier-del" data-pid="'+p.id+'" onclick="delTierPerson(this.dataset.pid)">✕</button>'+
      '</div>'+
      (p.note?'<div class="tier-card-note">'+p.note+'</div>':'')+
      '<div class="tier-card-ft">'+
        '<span class="tier-last">최근 상호작용: '+dStr+'</span>'+
        (daysSince>30&&daysSince>=0?'<span class="tier-tag" style="color:#E24B4A;background:#FCEBEB">30일 이상 미접촉</span>':'')+(daysSince>90&&daysSince>=0?'<span class="tier-tag" style="color:#E24B4A">강등 검토</span>':'')+
      '</div>'+
    '</div>';
  }).join('');
}
