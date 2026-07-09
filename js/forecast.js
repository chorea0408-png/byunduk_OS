function getPipelineAmts(extra){
  const ex=extra||{won:0,neg:0,prop:0,disc:0};
  const by={won:0,negotiation:0,proposal:0,discovery:0,lead:0};
  clients.forEach(c=>{if(by[c.stage]!==undefined)by[c.stage]+=c.amount;});
  return{won:(by.won||0)+(ex.won||0),neg:(by.negotiation||0)+(ex.neg||0),prop:(by.proposal||0)+(ex.prop||0),disc:(by.discovery||0)+(ex.disc||0)};
}

function project6(amts){
  const{won,neg,prop,disc}=amts,nW=neg*.85,pW=prop*.60,dW=disc*.30;
  var now=new Date();now.setHours(0,0,0,0);
  // MRR 클라이언트 고정 수익
  var mrrMonthly=0;
  clients.filter(function(c){return c.stage==='won'&&(c.wonStatus||'ongoing')==='ongoing';}).forEach(function(c){
    var t=TYPES[c.typeIdx]||TYPES[0];
    mrrMonthly+=t.type==='MRR'?(Number(c.amount)||0):(Number(c.amount)||0)*0.25;
  });
  // 3개월 내 계약 종료 이탈 반영
  var expiringAmt=0;
  clients.filter(function(c){return c.stage==='won';}).forEach(function(c){
    (c.contracts||[]).forEach(function(ct){
      if(!ct.endDate)return;
      var diff=Math.ceil((new Date(ct.endDate)-now)/(86400000));
      if(diff>=0&&diff<=90)expiringAmt+=(Number(ct.amount)||Number(c.amount)||0);
    });
  });
  var mrrDecay=Math.max(mrrMonthly-expiringAmt,0);
  return MONTHS.map(function(_,i){
    var mrrThis=i===0?mrrMonthly:i<=2?Math.max(mrrMonthly-expiringAmt*(i/3),0):mrrDecay;
    var pipeConvert=(i===0?nW*.6:0)+(i===1?nW*.25+pW*.4:0)+(i===2?pW*.35+dW*.2:0)+(i===3?dW*.3:0)+(i===4?dW*.2:0)+(i===5?dW*.1:0);
    var newBiz=i>=2?Math.round((nW+pW)*0.15):0;
    return{confirmed:Math.max(Math.round(mrrThis+pipeConvert*0.7),0),pipeline:Math.max(Math.round(pipeConvert*0.3+newBiz),0)};
  });
}

function renderRevenue(){
  MONTHS=buildMonths(); // 현재 달 기준 갱신
  const amts=getPipelineAmts(rvExtra);
  const{won,neg,prop,disc}=amts,nW=neg*.85,pW=prop*.60,dW=disc*.30;
  const weighted=nW+pW+dW,thisMonth=won+nW;
  const scTarget=Math.round(rvTarget*(SC_MULTI[curSc]||1));
  const net=thisMonth-rvCost,gap=Math.max(scTarget-thisMonth,0);
  renderScCompare();
  document.getElementById('rv-k1').textContent=Math.round(thisMonth)+'만';document.getElementById('rv-k1').style.color=thisMonth>=rvTarget?'#1D9E75':'';
  document.getElementById('rv-k1s').textContent=`확정 ${Math.round(won)}만 + 협상기대 ${Math.round(nW)}만`;
  document.getElementById('rv-k2').textContent=(net>=0?'+':'')+Math.round(net)+'만';document.getElementById('rv-k2').style.color=net>=0?'':'#E24B4A';
  document.getElementById('rv-k2s').textContent=`고정비 ${rvCost}만 차감`;
  document.getElementById('rv-k3').textContent=Math.round(weighted)+'만';
  document.getElementById('rv-k4').textContent=gap>0?Math.round(gap)+'만':'달성 ✓';document.getElementById('rv-k4').style.color=gap<=0?'#1D9E75':'';
  document.getElementById('rv-k4s').textContent=gap>0?`이번 달 ${Math.round(gap)}만 부족`:'이번 달 목표 초과';
  const proj=project6(amts);
  const dark=isDark();
  const gridC=dark?'rgba(255,255,255,.07)':'rgba(0,0,0,.05)',textC=dark?'#888780':'#73726c';
  const cdata={labels:MONTHS,datasets:[{label:'확정',data:proj.map(m=>m.confirmed),backgroundColor:'#1D9E75',stack:'s'},{label:'파이프라인',data:proj.map(m=>m.pipeline),backgroundColor:'#EF9F27bb',stack:'s'},{type:'line',label:'목표',data:proj.map(()=>rvTarget),borderColor:'#7F77DD',borderWidth:1.5,pointRadius:0,fill:false,tension:0,order:0},{type:'line',label:'손익분기',data:proj.map(()=>rvCost),borderColor:'#E24B4A',borderWidth:1,borderDash:[4,4],pointRadius:0,fill:false,tension:0,order:0}]};
  const copts={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}만원`}}},scales:{x:{grid:{color:gridC},ticks:{color:textC,font:{size:11}}},y:{grid:{color:gridC},ticks:{color:textC,font:{size:11},callback:v=>v+'만'},beginAtZero:true}},animation:{duration:250}};
  if(!rvChart)rvChart=new Chart(document.getElementById('rv-canvas'),{type:'bar',data:cdata,options:copts});
  else{rvChart.data=cdata;rvChart.update('none');}
  renderAiAssist();
  document.getElementById('rv-fc').innerHTML=proj.map((m,i)=>{const tot=m.confirmed+m.pipeline,n=tot-rvCost;return`<div class="fc"><div class="fc-m">${MONTHS[i]}</div><div class="fc-v" style="color:${tot>=rvTarget?'#1D9E75':''}">${tot}만</div><div class="fc-s" style="color:${n>=0?'var(--text3)':'#E24B4A'}">${n>=0?'+':''}${n}만</div></div>`;}).join('');
}

function onRvSl(){rvTarget=parseInt(document.getElementById('rv-tsl').value);rvCost=parseInt(document.getElementById('rv-csl').value);document.getElementById('rv-tv').textContent=rvTarget+'만';document.getElementById('rv-cv').textContent=rvCost+'만';renderRevenue();save();}

function addScenario(amount,key){rvExtra[key]=(rvExtra[key]||0)+amount;renderRevenue();}

function resetScenario(){rvExtra={won:0,neg:0,prop:0,disc:0};renderRevenue();}

let curSc='neu';

const SC_MULTI={opt:1.3,neu:1.0,pes:0.7};

const SC_INFO={
  opt:{label:'낙관',color:'#1D9E75',bg:'#E1F5EE',cls:'opt'},
  neu:{label:'중립',color:'#185FA5',bg:'#E6F1FB',cls:'neu'},
  pes:{label:'비관',color:'#E24B4A',bg:'#FCEBEB',cls:'pes'},
};

function setSc(sc){
  curSc=sc;
  document.querySelectorAll('.sc-btn').forEach(function(b){b.classList.toggle('on',b.dataset.sc===sc);});
  const lbl=document.getElementById('sc-cur-lbl');
  if(lbl)lbl.textContent='현재 시나리오: '+SC_INFO[sc].label;
  renderRevenue();
}

function renderScCompare(){
  const wrap=document.getElementById('sc-compare');if(!wrap)return;
  wrap.innerHTML=['opt','neu','pes'].map(function(sc){
    const info=SC_INFO[sc];
    const tgt=Math.round(rvTarget*SC_MULTI[sc]);
    const isActive=sc===curSc;
    return'<div class="sc-card '+(isActive?'active-sc':'')+'" style="border-left-color:'+info.color+';background:'+(isActive?info.bg:'var(--bg)')+'">'+
      '<div class="sc-card-t" style="color:'+info.color+'">'+info.label+'</div>'+
      '<div class="sc-card-v" style="color:'+info.color+'">'+tgt+'만</div>'+
      '<div class="sc-card-s">목표 ×'+SC_MULTI[sc]+'</div>'+
    '</div>';
  }).join('');
}

function renderAiAssist(){
  var el=document.getElementById('rv-ai-section');if(!el)return;
  var today=new Date();
  var amts2=(function(){
    var won=0,neg=0,prop=0,disc=0;
    clients.forEach(function(c){
      if(c.stage==='won')won+=(Number(c.amount)||0);
      else if(c.stage==='negotiation')neg+=(Number(c.amount)||0);
      else if(c.stage==='proposal')prop+=(Number(c.amount)||0);
      else if(c.stage==='discovery')disc+=(Number(c.amount)||0);
    });
    return{won:won,neg:neg,prop:prop,disc:disc};
  })();
  var weighted2=Math.round(amts2.neg*.85+amts2.prop*.60+amts2.disc*.30);
  var base=Math.round(amts2.won+weighted2*.6);
  var opt=Math.round(amts2.won+weighted2*.9);
  var pes=Math.round(amts2.won+weighted2*.3);
  // 3개월 실적 추이
  var recent3=monthlyActuals?monthlyActuals.filter(function(v){return v>0;}).slice(-3):[];
  var trend3=recent3.length>=2?Math.round(((recent3[recent3.length-1]-recent3[0])/recent3[0])*100):null;
  var trendStr=trend3!==null?(trend3>0?'&#9650; 최근 3개월 +'+trend3+'% 성장 추세':'&#9660; 최근 3개월 '+trend3+'% 하락 추세'):'실적 데이터 축적 중';
  // 이유
  var reasons=[];
  if(amts2.won>0)reasons.push('확정 Won '+amts2.won+'만 포함');
  if(amts2.neg>0)reasons.push('협상 중 '+amts2.neg+'만 (85% 성사 가정)');
  if(amts2.prop>0)reasons.push('제안 단계 '+amts2.prop+'만 (60% 가정)');
  if(trend3&&trend3>0)reasons.push('3개월 성장 추세 반영');
  var html='<div class="ai-assist-hd"><i class="ti ti-robot"></i>다음 달 수익 예측 (AI 어시스트)</div>';
  html+='<div class="ai-trend">'+trendStr+'</div>';
  html+='<div class="ai-pred-grid">';
  html+='<div class="ai-pred-card opt"><div class="ai-pred-lbl" style="color:#1D9E75">낙관</div><div class="ai-pred-v" style="color:#1D9E75">'+opt+'만</div><div class="ai-pred-s">파이프라인 90%</div></div>';
  html+='<div class="ai-pred-card neu"><div class="ai-pred-lbl" style="color:var(--text2)">중립</div><div class="ai-pred-v">'+base+'만</div><div class="ai-pred-s">파이프라인 60%</div></div>';
  html+='<div class="ai-pred-card pes"><div class="ai-pred-lbl" style="color:#E24B4A">비관</div><div class="ai-pred-v" style="color:#E24B4A">'+pes+'만</div><div class="ai-pred-s">파이프라인 30%</div></div>';
  html+='</div>';
  if(reasons.length)html+='<div class="ai-reasoning">&#128204; 예측 근거: '+reasons.join(' / ')+'</div>';
  // Claude 프롬프트 생성
  var nextMon=new Date(today.getFullYear(),today.getMonth()+1,1).toLocaleString('ko-KR',{year:'numeric',month:'long'});
  var wonList=clients.filter(function(c){return c.stage==='won';}).slice(0,5).map(function(c){return c.name+'('+c.amount+'만)';}).join(', ');
  var actStr=recent3.length?recent3.map(function(v,i){return (today.getMonth()-recent3.length+i+1+1)+'월 '+v+'만';}).join(' / '):'없음';
  var prompt=[
    '# 변덕쟁이들 '+nextMon+' 수익 예측 분석 요청',
    '',
    '## 현재 상황 ('+today.getFullYear()+'년 '+(today.getMonth()+1)+'월 기준)',
    '',
    '### 파이프라인 현황',
    '- Won 확정: '+amts2.won+'만원',
    '- Negotiation: '+amts2.neg+'만원 (성사율 85%)',
    '- Proposal: '+amts2.prop+'만원 (성사율 60%)',
    '- Discovery: '+amts2.disc+'만원 (성사율 30%)',
    '- 가중 파이프라인: '+weighted2+'만원',
    '',
    '### 최근 3개월 실적',
    actStr,
    '',
    '### Won 클라이언트 현황',
    wonList||'아직 없음',
    '',
    '### 비용 / 목표',
    '- 월 고정비: '+rvCost+'만원',
    '- 월 목표: '+rvTarget+'만원',
    '- 내부 예측: 낙관 '+opt+'만 / 중립 '+base+'만 / 비관 '+pes+'만',
    '',
    '## 분석 요청',
    '1. 위 데이터 기반으로 '+nextMon+' 매출 예측을 낙관·중립·비관 시나리오로 분석해줘.',
    '2. 현재 파이프라인에서 주목해야 할 리스크와 기회는?',
    '3. 월 목표 '+rvTarget+'만 달성을 위한 구체적인 영업 액션 3가지를 제안해줘.',
    '4. 성장 추세를 유지하려면 어떤 서비스 믹스가 유리할까?',
  ].join('\n');
  html+='<div class="ai-prompt-toggle" onclick="toggleAiPrompt()">';
  html+='<i class="ti ti-chevron-right" id="ai-prompt-icon" style="font-size:11px"></i>';
  html+='Claude.ai에 붙여넣을 분석 프롬프트 보기</div>';
  html+='<div class="ai-prompt-box" id="ai-prompt-box"></div>';
  html+='<button class="ai-copy-btn" onclick="copyRvAiPrompt()">&#128203; Claude에게 분석 요청하기 (복사)</button>';
  el.innerHTML=html;
  var pb=document.getElementById('ai-prompt-box');
  if(pb)pb.textContent=prompt;
  el._prompt=prompt;
}

function toggleAiPrompt(){
  var box=document.getElementById('ai-prompt-box');
  var icon=document.getElementById('ai-prompt-icon');
  if(!box)return;
  var open=box.style.display!=='block';
  box.style.display=open?'block':'none';
  if(icon)icon.style.transform=open?'rotate(90deg)':'';
}

function copyRvAiPrompt(){
  var el=document.getElementById('rv-ai-section');
  var text=el&&el._prompt||'';
  if(!text)return;
  if(navigator.clipboard){navigator.clipboard.writeText(text).then(function(){showToast('\u2705 Claude \ud504\ub86c\ud504\ud2b8 \ubcf5\uc0ac\ub428! Claude.ai\uc5d0 \ubd99\uc5ec\ub123\uc73c\uc138\uc694.');});}
  else{var ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);showToast('\u2705 \ubcf5\uc0ac \uc644\ub8cc!');}
}

function buildForecast(){
  var months=[];
  var now=new Date();var yr=now.getFullYear();var mo=now.getMonth();
  for(var i=0;i<12;i++){
    var d=new Date(yr,mo+i,1);
    var key=d.getFullYear()+'/'+(d.getMonth()+1);
    var label=(d.getMonth()+1)+'월'+(i===0?'(this달)':'');
    months.push({yr:d.getFullYear(),mo:d.getMonth(),key:key,label:label,
      confirmed:0,pipeline:0,ending:[],isCurrent:i===0});
  }
  // 1. 확정 MRR (won + ongoing)
  clients.filter(function(c){return c.stage==='won'&&(c.wonStatus||'ongoing')==='ongoing';}).forEach(function(c){
    months.forEach(function(m){
      // 계약 종료 체크: 해당 월에 끝나는 계약이 있는지
      var ending=(c.contracts||[]).some(function(ct){
        if(!ct.endDate)return false;
        var ed=new Date(ct.endDate);
        return ed.getFullYear()===m.yr&&ed.getMonth()===m.mo;
      });
      if(ending)m.ending.push(c.name);
      // 계약 종료 월 이후는 제외
      var firstEnd=(c.contracts||[]).filter(function(ct){return ct.endDate;})
        .map(function(ct){return new Date(ct.endDate);})
        .sort(function(a,b){return a-b;})[0];
      var mDate=new Date(m.yr,m.mo,1);
      if(!firstEnd||mDate<=firstEnd)m.confirmed+=(Number(c.amount)||0);
    });
  });
  // 2. 파이프라인 가중 기대
  clients.filter(function(c){return c.stage!=='won'&&c.stage!=='lost';}).forEach(function(c){
    var sg=STAGES.find(function(s){return s.id===c.stage;});if(!sg)return;
    var prob=sg.prob;
    if(c.expectedClose){
      var ec=new Date(c.expectedClose);
      months.forEach(function(m){
        if(ec.getFullYear()===m.yr&&ec.getMonth()===m.mo)
          m.pipeline+=(Number(c.amount)||0)*prob;
      });
    }else{
      // expectedClose 없으면 향후 3개월에 균등 분배
      months.slice(0,3).forEach(function(m){m.pipeline+=(Number(c.amount)||0)*prob/3;});
    }
  });
  return months;
}

function renderRevenueForecast(){
  var svg=document.getElementById('fc-svg');if(!svg)return;
  var tip=document.getElementById('fc-tip');if(!tip)return;
  var data=buildForecast();
  var target=rvTarget||200;
  var W=760,H=200,PL=46,PR=12,PT=16,PB=42;
  var chartW=W-PL-PR,chartH=H-PT-PB;
  var maxV=Math.max(target*1.3,Math.max.apply(null,data.map(function(m){return m.confirmed+m.pipeline;})),1);
  var barW=Math.floor(chartW/12);var gap=4;
  var yScale=function(v){return PT+chartH-(v/maxV*chartH);};
  var xBar=function(i){return PL+i*barW+gap/2;};
  var paths=[];
  // Y-axis grid + labels
  var steps=[0,0.25,0.5,0.75,1];
  steps.forEach(function(t){
    var y=yScale(maxV*t);var v=Math.round(maxV*t);
    paths.push('<line x1="'+PL+'" x2="'+(W-PR)+'" y1="'+y+'" y2="'+y+'" stroke="var(--border)" stroke-width=".5"/>');
    paths.push('<text x="'+(PL-4)+'" y="'+(y+3)+'" text-anchor="end" font-size="9" fill="var(--text3)">'+v+'</text>');
  });
  // Bars + labels
  data.forEach(function(m,i){
    var x=xBar(i);var bw=barW-gap;
    var hC=m.confirmed/maxV*chartH;var hP=m.pipeline/maxV*chartH;
    var yC=PT+chartH-hC;var yP=yC-hP;
    // Pipeline bar (background)
    if(m.pipeline>0)paths.push('<rect x="'+x+'" y="'+yP+'" width="'+bw+'" height="'+(hC+hP)+'" rx="2" fill="var(--teal)" opacity=".25" class="fc-bar" data-idx="'+i+'"/>');
    // Confirmed bar
    paths.push('<rect x="'+x+'" y="'+yC+'" width="'+bw+'" height="'+hC+'" rx="2" fill="var(--teal)" class="fc-bar" data-idx="'+i+'"/>');
    // Contract ending marker
    if(m.ending.length)paths.push('<line x1="'+(x+bw/2)+'" x2="'+(x+bw/2)+'" y1="'+(yP-4)+'" y2="'+PT+'" stroke="var(--red)" stroke-width="1.5" stroke-dasharray="3,2" opacity=".6"/>');
    // Current month highlight
    if(m.isCurrent)paths.push('<rect x="'+x+'" y="'+PT+'" width="'+bw+'" height="'+chartH+'" rx="2" fill="var(--teal)" opacity=".05"/>');
    // X label
    paths.push('<text x="'+(x+bw/2)+'" y="'+(H-PB+14)+'" text-anchor="middle" font-size="9.5" fill="var(--text3)'+(m.isCurrent?'" font-weight="700':'')+'" class="'+(m.isCurrent?'fc-month-now':'')+'">'+m.label+'</text>');
  });
  // Target line
  var tY=yScale(target);
  paths.push('<line x1="'+PL+'" x2="'+(W-PR)+'" y1="'+tY+'" y2="'+tY+'" stroke="#F0C040" stroke-width="1.5" stroke-dasharray="5,3"/>');
  paths.push('<text x="'+(W-PR-2)+'" y="'+(tY-3)+'" text-anchor="end" font-size="9" fill="#C09020">목표 '+target+'</text>');
  // Hover capture bars (transparent)
  data.forEach(function(m,i){
    var x=xBar(i);var bw=barW-gap;
    paths.push('<rect x="'+x+'" y="'+PT+'" width="'+bw+'" height="'+chartH+'" fill="transparent" class="fc-hover" data-idx="'+i+'" onmouseenter="fcTip(event,'+i+')" onmouseleave="fcHide()"/>');
  });
  svg.innerHTML=paths.join('');
  // store for tooltip
  svg._data=data;svg._maxV=maxV;svg._target=target;
}

var _fcData=null;

function fcTip(e,i){
  var svg=document.getElementById('fc-svg');if(!svg||!svg._data)return;
  var m=svg._data[i];if(!m)return;
  var tip=document.getElementById('fc-tip');if(!tip)return;
  var total=Math.round(m.confirmed+m.pipeline);
  var html2='<div class="fc-tooltip-mo">'+m.key+'</div>';
  html2+='<div class="fc-tooltip-row">확정 MRR: <strong>'+Math.round(m.confirmed)+'만</strong></div>';
  if(m.pipeline>0)html2+='<div class="fc-tooltip-row">파이프라인 기대: +'+Math.round(m.pipeline)+'만</div>';
  html2+='<div class="fc-tooltip-row">합계: <strong style="color:var(--teal)">'+total+'만</strong></div>';
  if(m.ending.length)html2+='<div class="fc-tooltip-row" style="color:var(--red)">⚠ 계약 종료: '+m.ending.slice(0,2).join(', ')+'</div>';
  tip.innerHTML=html2;
  var wrap=document.querySelector('.fc-svg-wrap');
  var rect=wrap?wrap.getBoundingClientRect():{left:0,top:0};
  tip.style.left=Math.min(e.clientX-rect.left+8,rect.width-160)+'px';
  tip.style.top=(e.clientY-rect.top-60)+'px';
  tip.style.display='block';
}

function fcHide(){var tip=document.getElementById('fc-tip');if(tip)tip.style.display='none';}
