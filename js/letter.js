function saveLetters(){try{localStorage.setItem('vd_letters',JSON.stringify(letters));}catch(e){}}

function addLetter(){
  const title=document.getElementById('lt-title').value.trim();if(!title)return;
  const today=new Date().toISOString().slice(0,10);
  letters.unshift({
    id:letterNid++,title,
    date:document.getElementById('lt-date').value||today,
    status:document.getElementById('lt-status').value,
    subscribers:parseInt(document.getElementById('lt-subs').value)||0,
    openRate:parseFloat(document.getElementById('lt-open').value)||0,
    note:''
  });
  document.getElementById('lt-title').value='';
  document.getElementById('lt-subs').value='';
  document.getElementById('lt-open').value='';
  saveLetters();renderLetter();
}

function advLetter(id){
  const l=letters.find(x=>x.id===id);if(!l)return;
  const order=['draft','ready','pub'];
  const idx=order.indexOf(l.status);
  if(idx<order.length-1){l.status=order[idx+1];saveLetters();renderLetter();}
}

function delLetter(id){if(!confirm('삭제할까요?'))return;letters=letters.filter(x=>x.id!==id);saveLetters();renderLetter();}

function fmtDate(d){if(!d)return'–';const dt=new Date(d);return dt.toLocaleDateString('ko-KR',{month:'short',day:'numeric'});}

function renderLetter(){
  const goalEl=document.getElementById('lt-goal');
  if(goalEl){letterGoal=parseInt(goalEl.value)||100;try{localStorage.setItem('vd_ltGoal',letterGoal);}catch(e){}}
  const pub=letters.filter(l=>l.status==='pub');
  const latest=letters.find(l=>l.subscribers>0);
  const latestSubs=latest?latest.subscribers:0;
  const avgOpen=pub.length&&pub.some(l=>l.openRate>0)?parseFloat((pub.filter(l=>l.openRate>0).reduce((a,l)=>a+l.openRate,0)/pub.filter(l=>l.openRate>0).length).toFixed(1)):0;
  const gap=Math.max(letterGoal-latestSubs,0);
  document.getElementById('lt-k1').textContent=pub.length+'호';
  document.getElementById('lt-k1s').textContent='전체 '+letters.length+'호 중';
  document.getElementById('lt-k2').textContent=latestSubs?latestSubs+'명':'–';
  document.getElementById('lt-k2s').textContent=latest?'Vol.'+letters.indexOf(latest).toString().padStart(0)+' 기준':'기록 없음';
  document.getElementById('lt-k3').textContent=avgOpen?avgOpen+'%':'–';
  document.getElementById('lt-k3').style.color=avgOpen>=60?'#1D9E75':avgOpen>=40?'#BA7517':'var(--text2)';
  document.getElementById('lt-k4').textContent=gap?gap+'명 남음':'달성 ✓';
  document.getElementById('lt-k4').style.color=gap===0?'#1D9E75':'';
  document.getElementById('lt-k4s').textContent='목표 '+letterGoal+'명';
  const goalMsg=document.getElementById('lt-goal-msg');
  if(goalMsg)goalMsg.textContent=latestSubs&&letterGoal?Math.round(latestSubs/letterGoal*100)+'% 달성':'';
  document.getElementById('lt-total').textContent='총 '+letters.length+'호';
  const wrap=document.getElementById('lt-list');
  if(!letters.length){wrap.innerHTML='<div class="lt-empty">아직 기록이 없어요. 위에서 첫 호를 추가해보세요.</div>';return;}
  const maxSubs=Math.max(...letters.map(l=>l.subscribers),1);
  wrap.innerHTML='<table class="lt-table"><thead><tr><th>호</th><th>주제</th><th>상태</th><th>발행일</th><th>구독자</th><th>오픈율</th><th></th></tr></thead><tbody>'+
  letters.map(function(l,idx){
    const st=LETTER_ST.find(s=>s.id===l.status)||LETTER_ST[0];
    const issueNum=letters.length-idx;
    const barW=l.subscribers?Math.round(l.subscribers/maxSubs*100):0;
    const openCol=l.openRate>=60?'#1D9E75':l.openRate>=40?'#BA7517':l.openRate>0?'var(--text2)':'var(--text3)';
    const nextSt=l.status==='draft'?'발행 예정으로':l.status==='ready'?'발행 완료로':'';
    return '<tr>'+
      '<td><span class="lt-iss">Vol.'+issueNum+'</span></td>'+
      '<td><div class="lt-ttl">'+l.title+'</div>'+(l.note?'<div class="lt-note">'+l.note+'</div>':'')+'</td>'+
      '<td><span class="tag" style="background:'+st.bg+';color:'+st.color+'">'+st.label+'</span></td>'+
      '<td class="lt-stat">'+fmtDate(l.date)+'</td>'+
      '<td><div class="lt-bar-wrap"><div class="lt-bar-bg"><div class="lt-bar-f" style="width:'+barW+'%;background:#534AB7"></div></div><span class="lt-stat">'+(l.subscribers||'–')+'</span></div></td>'+
      '<td><span style="font-size:12px;font-weight:500;color:'+openCol+'">'+(l.openRate?l.openRate+'%':'–')+'</span></td>'+
      '<td style="white-space:nowrap;display:flex;gap:4px;align-items:center">'+
      (nextSt?'<button class="lt-adv" onclick="advLetter('+l.id+')">'+nextSt+'</button>':'')+
      '<button class="lt-del" onclick="delLetter('+l.id+')">삭제</button>'+
      '</td></tr>';
  }).join('')+'</tbody></table>';
}
