function writeIdea(id){
  const idea=ideas.find(function(x){return x.id===id;});
  if(idea)aiPrompt(idea.title+' 주제로 '+idea.ch+' 콘텐츠 초안을 써줘 ↗');
}

function loadIdeas(){
  try{const s=localStorage.getItem('vd_ideas');if(s){ideas=JSON.parse(s);idNid=Math.max(...ideas.map(i=>i.id),0)+1;}else ideas=[...ID_DEFAULT];}catch(e){ideas=[...ID_DEFAULT];}
}

function saveIdeas(){try{localStorage.setItem('vd_ideas',JSON.stringify(ideas));}catch(e){}}

function fmtDateRel(d){
  const now=new Date(),dt=new Date(d),diff=Math.round((now-dt)/86400000);
  if(diff===0)return '오늘';if(diff===1)return '어제';if(diff<7)return diff+'일 전';
  return dt.toLocaleDateString('ko-KR',{month:'short',day:'numeric'});
}

function addIdea(){
  const title=document.getElementById('id-title').value.trim();if(!title)return;
  ideas.unshift({id:idNid++,title,ch:document.getElementById('id-ch').value,tag:document.getElementById('id-tag').value,status:'idea',date:new Date().toISOString().slice(0,10)});
  document.getElementById('id-title').value='';saveIdeas();renderIdeas();
}

function advIdea(id){const idea=ideas.find(i=>i.id===id);if(!idea)return;const st=ID_STATUSES.find(s=>s.id===idea.status);if(st&&st.next){idea.status=st.next;saveIdeas();renderIdeas();}}

function holdIdea(id){const idea=ideas.find(i=>i.id===id);if(idea){idea.status='hold';saveIdeas();renderIdeas();}}

function delIdea(id){ideas=ideas.filter(i=>i.id!==id);saveIdeas();renderIdeas();}

function setIdSt(s){idFilterSt=s;renderIdeas();}

function setIdCh(c){idFilterCh=c;renderIdeas();}

function renderIdeas(){
  const cnt={all:ideas.length};ID_STATUSES.forEach(s=>{cnt[s.id]=ideas.filter(i=>i.status===s.id).length;});
  document.getElementById('id-k1').textContent=cnt.all;
  document.getElementById('id-k2').textContent=cnt.draft||0;
  document.getElementById('id-k3').textContent=cnt.done||0;
  document.getElementById('id-k4').textContent=cnt.idea||0;
  const sBtns=[{id:'all',label:'전체',cnt:cnt.all},...ID_STATUSES.map(s=>({id:s.id,label:s.label,cnt:cnt[s.id]||0}))];
  document.getElementById('id-sf').innerHTML=sBtns.map(b=>'<button class="fil-p '+(idFilterSt===b.id?'on':'')+'" data-sid="'+b.id+'" onclick="setIdSt(this.dataset.sid)">'+b.label+' <span style="opacity:.6">'+b.cnt+'</span></button>').join('');
  document.getElementById('id-cf').innerHTML=[{id:'all',label:'전체 채널'},...ID_CHANNELS.map(c=>({id:c.id,label:c.id}))].map(c=>'<button class="fil-p '+(idFilterCh===c.id?'on':'')+'" data-cid="'+c.id+'" onclick="setIdCh(this.dataset.cid)">'+c.label+'</button>').join('');
  let filtered=ideas;
  if(idFilterSt!=='all')filtered=filtered.filter(i=>i.status===idFilterSt);
  if(idFilterCh!=='all')filtered=filtered.filter(i=>i.ch===idFilterCh);
  const grid=document.getElementById('idea-grid');
  if(!filtered.length){grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:2rem;font-size:12px;color:var(--text2);border:.5px dashed var(--border);border-radius:var(--rlg)">아이디어가 없어요. 위에서 추가해보세요.</div>';return;}
  grid.innerHTML=filtered.map(function(idea){
    const st=ID_STATUSES.find(s=>s.id===idea.status)||ID_STATUSES[0];
    const ch=ID_CHANNELS.find(c=>c.id===idea.ch)||ID_CHANNELS[0];
    const wp=idea.title+' 주제로 '+idea.ch+' 콘텐츠 초안을 써줘';
    let acts='';
    if(st.next)acts+='<button class="act-sm" onclick="advIdea('+idea.id+')">'+st.nextLbl+'</button> ';
    if(idea.status!=='hold'&&idea.status!=='done')acts+='<button class="act-sm" onclick="holdIdea('+idea.id+')">보류</button> ';
    acts+='<button class="act-sm act-write" onclick="writeIdea('+idea.id+')">글쓰기 ↗</button>';
    return '<div class="idea-c" style="border-left-color:'+st.color+'"><div class="idea-top"><span class="tag" style="background:'+ch.bg+';color:'+ch.tc+'">'+idea.ch+'</span><span class="tag" style="background:var(--bg2);color:var(--text2)">'+idea.tag+'</span><button class="idea-del" onclick="delIdea('+idea.id+')" aria-label="삭제"><i class="ti ti-x"></i></button></div><div class="idea-ttl">'+idea.title+'</div><div class="idea-dt">'+fmtDateRel(idea.date)+' · <span style="color:'+st.color+'">'+st.label+'</span></div><div class="idea-acts">'+acts+'</div></div>';
  }).join('');
}

function rtKey(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');}

function rtAll(){try{const s=localStorage.getItem('vd_retros');return s?JSON.parse(s):{};}catch(e){return{};}}

function rtSetAll(d){try{localStorage.setItem('vd_retros',JSON.stringify(d));}catch(e){}}

function rtNav(delta){rtCur=new Date(rtCur.getFullYear(),rtCur.getMonth()+delta,1);rtLoad();}

function rtLoad(){
  const key=rtKey(rtCur),all=rtAll(),d=all[key]||{};
  const mn=rtCur.toLocaleDateString('ko-KR',{year:'numeric',month:'long'});
  document.getElementById('rt-title').textContent=mn+' 회고';
  const now=new Date(),isThis=rtCur.getFullYear()===now.getFullYear()&&rtCur.getMonth()===now.getMonth();
  document.getElementById('rt-sub').textContent=isThis?'이번 달':'지난 달 기록';
  const flds=['rt-arev','rt-acli','rt-acon','rt-acap','rt-k','rt-p','rt-t','rt-nrev','rt-ncli','rt-nf','rt-ncon','rt-pledge'];
  const vals=[d.aRev,d.aCli,d.aCon,d.aCap,d.kptK,d.kptP,d.kptT,d.nRev,d.nCli,d.nFocus,d.nCon,d.pledge];
  flds.forEach(function(f,i){const el=document.getElementById(f);if(el)el.value=vals[i]||'';});
  const prevKey=rtKey(new Date(rtCur.getFullYear(),rtCur.getMonth()-1,1));
  const prev=rtAll()[prevKey];
  const tgtRev=prev&&prev.nRev?parseInt(prev.nRev):rvTarget;
  const tgtCli=prev&&prev.nCli?parseInt(prev.nCli):3;
  const tgtCon=prev&&prev.nCon?parseInt(prev.nCon):4;
  document.getElementById('rt-revtgt').textContent='목표 '+tgtRev+'만';
  document.getElementById('rt-clitgt').textContent='목표 '+tgtCli+'명';
  document.getElementById('rt-contgt').textContent='목표 '+tgtCon+'건';
  window._rtT={rev:tgtRev,cli:tgtCli,con:tgtCon};
  rtAch();rtHist();
  document.getElementById('rt-saved').textContent=d.savedAt?'마지막: '+new Date(d.savedAt).toLocaleString('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'';
}

function rtAch(){
  const t=window._rtT||{rev:200,cli:3,con:4};
  function upd(inId,barId,pctId,target,isLower){
    const val=parseFloat(document.getElementById(inId).value)||0;
    if(!val){document.getElementById(pctId).textContent='–';document.getElementById(pctId).style.color='var(--text3)';document.getElementById(barId).style.width='0%';return;}
    var pct,col,label;
    if(isLower){pct=Math.min(val,100);col=val<=70?'#1D9E75':'#E24B4A';label=val+'%';}
    else{pct=Math.min(Math.round(val/target*100),100);col=val>=target?'#1D9E75':val>=target*.8?'#BA7517':'#E24B4A';label=Math.round(val/target*100)+'%';}
    document.getElementById(barId).style.width=pct+'%';document.getElementById(barId).style.background=col;
    document.getElementById(pctId).textContent=label;document.getElementById(pctId).style.color=col;
  }
  upd('rt-arev','rt-revbar','rt-revpct',t.rev,false);upd('rt-acli','rt-clibar','rt-clipct',t.cli,false);
  upd('rt-acon','rt-conbar','rt-conpct',t.con,false);upd('rt-acap','rt-capbar','rt-cappct',70,true);
  rtPill();rtDeb();
}

function rtPill(){
  const flds=['rt-arev','rt-acli','rt-acon','rt-acap','rt-k','rt-p','rt-t','rt-nrev','rt-pledge'];
  const filled=flds.filter(function(id){return (document.getElementById(id).value||'').toString().trim();}).length;
  const pct=Math.round(filled/flds.length*100);
  const pill=document.getElementById('rt-pill');
  pill.textContent='작성 '+pct+'%';pill.style.color=pct>=80?'#1D9E75':pct>=40?'#BA7517':'var(--text2)';
}

function rtDeb(){clearTimeout(rtTimer);rtTimer=setTimeout(rtSave,1200);rtPill();}

function rtSave(){
  const key=rtKey(rtCur),all=rtAll();
  all[key]={
    aRev:document.getElementById('rt-arev').value,aCli:document.getElementById('rt-acli').value,
    aCon:document.getElementById('rt-acon').value,aCap:document.getElementById('rt-acap').value,
    kptK:document.getElementById('rt-k').value,kptP:document.getElementById('rt-p').value,kptT:document.getElementById('rt-t').value,
    nRev:document.getElementById('rt-nrev').value,nCli:document.getElementById('rt-ncli').value,
    nFocus:document.getElementById('rt-nf').value,nCon:document.getElementById('rt-ncon').value,
    pledge:document.getElementById('rt-pledge').value,savedAt:new Date().toISOString()
  };
  rtSetAll(all);const t=new Date();
  document.getElementById('rt-saved').textContent=t.getHours()+':'+String(t.getMinutes()).padStart(2,'0')+' 저장됨';
  rtHist();
}

function rtHist(){
  const all=rtAll(),curKey=rtKey(rtCur);
  const keys=Object.keys(all).sort().reverse().filter(function(k){return k!==curKey;}).slice(0,4);
  const el=document.getElementById('rt-hist');
  if(!keys.length){el.innerHTML='<p style="font-size:12px;color:var(--text2)">저장된 이전 회고가 없어요.</p>';return;}
  el.innerHTML=keys.map(function(k){
    const d=all[k],parts=k.split('-'),y=parts[0],m=parts[1];
    const mn=new Date(+y,+m-1,1).toLocaleDateString('ko-KR',{year:'numeric',month:'long'});
    const rev=d.aRev?parseInt(d.aRev):null;
    const pm=+m===1?12:+m-1,py=+m===1?+y-1:+y;
    const prevKey=py+'-'+String(pm).padStart(2,'0');
    const prev=all[prevKey],tgt=prev&&prev.nRev?parseInt(prev.nRev):rvTarget;
    const pct=rev?Math.round(rev/tgt*100):null;
    const keep=d.kptK?(d.kptK.split('\n')[0].slice(0,40)+(d.kptK.length>40?'...':'')):'\u2013';
    const pctCol=pct&&pct>=100?'#1D9E75':pct&&pct>=80?'#BA7517':'var(--text2)';
    return '<div class="hist-c"><div><div class="hist-mo">'+mn+'</div><div class="hist-mt">'+(d.nFocus||'\u2013')+'</div></div><div class="hist-keep">'+keep+'</div><div><div class="hist-pct-v" style="color:'+pctCol+'">'+(pct?pct+'%':'\u2013')+'</div><div class="hist-pl">\ub2ec성률</div></div></div>';
  }).join('');
}

function rtAI(){
  const rev=document.getElementById('rt-arev').value;
  const keep=document.getElementById('rt-k').value.slice(0,100);
  const prob=document.getElementById('rt-p').value.slice(0,100);
  const tgt=document.getElementById('rt-nrev').value;
  const pledge=document.getElementById('rt-pledge').value;
  const mn=document.getElementById('rt-title').textContent;
  aiPrompt(mn+' 회고 기반으로 다음 달 전략을 제안해줘.\n매옶: '+(rev||'미입력')+'만 / Keep: '+(keep||'없음')+' / Problem: '+(prob||'없음')+' / 다음달 목표: '+(tgt||'미설정')+'만 / 다짐: '+(pledge||'없음')+' ↗');
}
