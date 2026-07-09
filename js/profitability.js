function getProfStats(){
  const filtered=profMode==='won'?clients.filter(c=>c.stage==='won'):clients;
  return TYPES.map((t,idx)=>{
    const grp=filtered.filter(c=>c.typeIdx===idx);
    const count=grp.length,totalAmt=count>0?grp.reduce((a,c)=>a+(Number(c.amount)||0),0):0;
    const avgAmt=count>0?Math.round(totalAmt/count):t.defaultAmt;
    const rate=parseFloat((avgAmt/(t.hours*4)).toFixed(2));
    const wonCount=clients.filter(c=>c.typeIdx===idx&&c.stage==='won').length;
    const pipeCount=clients.filter(c=>c.typeIdx===idx&&c.stage!=='lost'&&c.stage!=='won').length;
    return{...t,idx,count,totalAmt,avgAmt,rate,monthlyHours:t.hours*4,wonCount,pipeCount,hasData:count>0};
  });
}

function setProfMode(m){profMode=m;document.querySelectorAll('.tg-b').forEach((b,i)=>b.classList.toggle('on',['all','won'][i]===m));renderProf();}

function renderProf(){
  renderServiceMix();renderAccuracy();renderClosingTime();
  const stats=getProfStats(),sorted=[...stats].sort((a,b)=>b.rate-a.rate);
  const maxRate=Math.max(...stats.map(s=>s.rate),.1),best=sorted[0];
  const active=stats.filter(s=>s.count>0).length,total=stats.reduce((a,s)=>a+s.totalAmt,0);
  document.getElementById('pr-k1').textContent=best.rate.toFixed(2)+'만/h';document.getElementById('pr-k1').style.color=best.color;
  document.getElementById('pr-k1s').textContent=best.name;document.getElementById('pr-k2').textContent=active+'개';
  document.getElementById('pr-k3').textContent=total+'만';document.getElementById('pr-k3s').textContent=profMode==='won'?'Won 기준':'전체 기준';
  document.getElementById('pr-k4').textContent=best.name;document.getElementById('pr-k4').style.color=best.color;
  const dark=isDark();
  const gridC=dark?'rgba(255,255,255,.07)':'rgba(0,0,0,.05)',textC=dark?'#888780':'#73726c';
  const cdata={labels:sorted.map(s=>s.name),datasets:[{label:'시간당 수익',data:sorted.map(s=>s.rate),backgroundColor:sorted.map(s=>s.color+'cc'),borderColor:sorted.map(s=>s.color),borderWidth:1,borderRadius:4,barThickness:24}]};
  const copts={indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`시간당 ${ctx.parsed.x.toFixed(2)}만원`}}},scales:{x:{grid:{color:gridC},ticks:{color:textC,font:{size:11},callback:v=>v+'만'},beginAtZero:true,max:Math.ceil(maxRate+.5)},y:{grid:{display:false},ticks:{color:textC,font:{size:11}}}},animation:{duration:300}};
  if(!profChart)profChart=new Chart(document.getElementById('prof-canvas'),{type:'bar',data:cdata,options:copts});
  else{profChart.data=cdata;profChart.update('none');}
  document.getElementById('prof-cards').innerHTML=sorted.map((s,rank)=>{
    const eff=Math.round(s.rate/maxRate*100);
    const card=`<div class="prof-card ${['best',''][rank>0?1:0]}">${rank===0?'<div class="best-bdg">최고 효율</div>':''}<div class="prof-nm"><span class="p-dot" style="background:${s.color}"></span>${s.name}</div><div class="prate" style="color:${s.color}">${s.rate.toFixed(2)}<span style="font-size:13px;font-weight:400">만/h</span></div><div class="prate-l">시간당 수익률</div><div class="prows"><div class="prow"><span class="prow-l">평균 단가</span><span class="prow-v">${s.hasData?s.avgAmt:s.defaultAmt+'(기본)'}만</span></div><div class="prow"><span class="prow-l">월 투입시간</span><span class="prow-v">${s.monthlyHours}h</span></div><div class="prow"><span class="prow-l">Won</span><span class="prow-v">${s.wonCount}명</span></div><div class="prow"><span class="prow-l">파이프라인</span><span class="prow-v">${s.pipeCount}명</span></div></div><div class="pbar-bg"><div class="pbar-f" style="width:${eff}%;background:${s.color}"></div></div><span class="ppill" style="background:${s.tagBg};color:${s.color}">${s.type}</span></div>`;
    return card;
  }).join('');
}

function profSim(typeIdx){
  const t=TYPES[typeIdx],stats=getProfStats(),s=stats[typeIdx];
  const newAvg=Math.round((s.totalAmt+t.defaultAmt)/(s.count+1));
  const newRate=(newAvg/(t.hours*4)).toFixed(2);
  document.getElementById('prof-sim').innerHTML='<strong>'+t.name+' 1개 추가</strong> → 월 +'+t.defaultAmt+'만 · 주 +'+t.hours+'h · 시간당 '+newRate+'만/h · 총 '+(clients.length+1)+'명';
}
