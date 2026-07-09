const GCX=105,GCY=100,GR=72,GSA=150,GSW=240;

function gPt(deg){const r=deg*Math.PI/180;return{x:GCX+GR*Math.cos(r),y:GCY+GR*Math.sin(r)};}

function gArc(sd,sw){if(sw<=.3)return'';const s=gPt(sd),e=gPt(sd+Math.min(sw,239.9));return`M${s.x.toFixed(1)} ${s.y.toFixed(1)} A${GR} ${GR} 0 ${sw>180?1:0} 1 ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;}

function gColor(p){return p<.7?'#1D9E75':p<.9?'#BA7517':'#E24B4A';}

function renderCapacity(){
  const active=clients.filter(c=>c.stage==='won');
  const used=active.reduce((a,c)=>a+(TYPES[c.typeIdx]||TYPES[0]).hours,0);
  const p=used/capHours,pct=Math.round(Math.min(p,1)*100),free=Math.max(capHours-used,0),col=gColor(p);
  const dark=isDark();
  document.getElementById('g-bg').setAttribute('d',gArc(GSA,GSW));
  document.getElementById('g-bg').setAttribute('stroke',dark?'#2e2e2a':'#eeecea');
  const fs=Math.min(p*GSW,GSW),gf=document.getElementById('g-fill');
  gf.setAttribute('d',fs>.3?gArc(GSA,fs):'');gf.setAttribute('stroke',col);
  document.getElementById('g-pct').textContent=pct+'%';document.getElementById('g-pct').setAttribute('fill',p>=.9?col:dark?'#e6e4de':'#1a1a18');
  document.getElementById('g-hrs').textContent=`${used} / ${capHours}h`;document.getElementById('g-hrs').setAttribute('fill',dark?'#9c9a92':'#6b6b65');
  const states=[{max:.5,label:'여유',bg:'#E1F5EE',color:'#085041',msg:'여유가 충분해요. 신규 수주 적극 추진이 가능해요.'},{max:.7,label:'적정',bg:'#EAF3DE',color:'#27500A',msg:'안정 구간이에요. 1-2개 추가 수주 여지가 있어요.'},{max:.9,label:'주의',bg:'#FAEEDA',color:'#633806',msg:'용량이 차오르고 있어요. 납기 확인 후 수주를 검토하세요.'},{max:1.0,label:'위험',bg:'#FAECE7',color:'#712B13',msg:'과부하 직전이에요. 기존 프로젝트 완료 후 수주하세요.'},{max:99,label:'과부하',bg:'#FCEBEB',color:'#791F1F',msg:'가용시간을 초과했어요. 일정 조율이 필요해요.'}];
  const st=states.find(s=>p<s.max)||states[4];
  const badge=document.getElementById('cap-badge');
  badge.style.cssText=`background:${st.bg};color:${st.color};display:inline-block;font-size:11px;font-weight:600;padding:3px 11px;border-radius:99px;margin-bottom:8px`;
  badge.textContent=st.label;document.getElementById('cap-msg').textContent=st.msg;
  document.getElementById('cap-k1').textContent=capHours+'h';
  document.getElementById('cap-k2').textContent=used+'h';document.getElementById('cap-k2').style.color=p>=.9?col:'';
  document.getElementById('cap-k3').textContent=free+'h';
  const pl=document.getElementById('cap-list');
  if(!active.length){pl.innerHTML='<div style="padding:16px;text-align:center;font-size:12px;color:var(--text2)">Closed Won 프로젝트 없음</div>';}
  else pl.innerHTML=active.map(c=>{const t=TYPES[c.typeIdx]||TYPES[0];const bw=Math.min(Math.round(t.hours/capHours*100),100);return`<div class="pi"><div><div class="pi-nm">${c.name}</div><div class="pi-tp">${t.name}</div><div class="bar-bg"><div style="height:3px;border-radius:2px;width:${bw}%;background:${t.color}"></div></div></div><div style="font-size:11px;color:var(--text2);text-align:right">${t.name}</div><div style="font-size:13px;font-weight:600;color:${t.color};text-align:right">${t.hours}h/주</div></div>`;}).join('');
  const warn=document.getElementById('cap-warn');
  if(p>=.9){const ov=Math.max(used-capHours,0);warn.style.cssText=`background:${p>=1?'#FCEBEB':'#FAEEDA'};color:${p>=1?'#791F1F':'#633806'};border-radius:8px;padding:10px 14px;font-size:12px;line-height:1.6;margin-top:8px`;warn.textContent=p>=1?`주간 ${ov}시간 초과예요. 가장 가벼운 프로젝트의 일정 분산을 고려하세요.`:`용량의 ${pct}%가 찼어요. 신규 수주 전 기존 마감을 확인하세요.`;}
  else{warn.style.cssText='';warn.textContent='';}
}

function onCapSl(v){capHours=parseInt(v);document.getElementById('cap-sv').textContent=v+'h';renderCapacity();save();}
