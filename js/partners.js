function openPartnerForm(id){
  partnerEditId=(id===undefined||id===null||isNaN(id))?null:id;
  var form=document.getElementById('pt-form');if(!form)return;
  var rs=document.getElementById('pt-f-role');
  if(rs&&!rs.children.length)rs.innerHTML=PARTNER_ROLES.map(function(r){return'<option value="'+r.id+'">'+r.label+'</option>';}).join('');
  var ss=document.getElementById('pt-f-status');
  if(ss&&!ss.children.length)ss.innerHTML=PARTNER_STATUS.map(function(s){return'<option value="'+s.id+'">'+s.label+'</option>';}).join('');
  var ttl=document.getElementById('pt-form-ttl');
  if(id!==null){
    var p=partners.find(function(x){return x.id===id;});if(!p)return;
    if(ttl)ttl.textContent='파트너 수정';
    document.getElementById('pt-f-name').value=p.name||'';
    if(rs)rs.value=p.role||'designer';
    document.getElementById('pt-f-contact').value=p.contact||'';
    document.getElementById('pt-f-rate').value=p.rate||'';
    if(ss)ss.value=p.status||'active';
    document.getElementById('pt-f-note').value=p.note||'';
  }else{
    if(ttl)ttl.textContent='파트너 추가';
    ['pt-f-name','pt-f-contact','pt-f-rate','pt-f-note'].forEach(function(eid){var el=document.getElementById(eid);if(el)el.value='';});
    if(rs)rs.value='designer';if(ss)ss.value='active';
  }
  form.style.display='block';
  var n=document.getElementById('pt-f-name');if(n)n.focus();
}

function closePartnerForm(){
  var f=document.getElementById('pt-form');if(f)f.style.display='none';
  partnerEditId=null;
}

function savePartner(){
  var name=(document.getElementById('pt-f-name').value||'').trim();
  if(!name){alert('이름을 입력해주세요.');return;}
  var role=(document.getElementById('pt-f-role')||{}).value||'designer';
  var contact=(document.getElementById('pt-f-contact').value||'').trim();
  var rate=(document.getElementById('pt-f-rate').value||'').trim();
  var status=(document.getElementById('pt-f-status')||{}).value||'active';
  var note=(document.getElementById('pt-f-note').value||'').trim();
  if(partnerEditId!==null){
    var p=partners.find(function(x){return x.id===partnerEditId;});
    if(p){p.name=name;p.role=role;p.contact=contact;p.rate=rate;p.status=status;p.note=note;}
  }else{
    partners.push({id:partnerNid++,name:name,role:role,contact:contact,rate:rate,status:status,note:note,clientIds:[]});
  }
  save();closePartnerForm();renderPartners();showToast('✅ 저장됨!');
}

function deletePartner(idStr){
  var id=parseInt(idStr);
  var p=partners.find(function(x){return x.id===id;});
  if(!p||!confirm(p.name+'을(를) 삭제할까요?'))return;
  partners=partners.filter(function(x){return x.id!==id;});
  save();renderPartners();
}

function linkPartnerClient(pidStr,cidStr){
  var pid=parseInt(pidStr);var cid=parseInt(cidStr);
  var p=partners.find(function(x){return x.id===pid;});if(!p)return;
  if(!p.clientIds)p.clientIds=[];
  if(!p.clientIds.includes(cid))p.clientIds.push(cid);
  save();renderPartners();
}

function renderPartners(){
  var el=document.getElementById('pt-list');if(!el)return;
  var pfR=document.getElementById('pt-form');if(pfR)pfR.style.display='none';partnerEditId=null;
  if(!partners.length){el.innerHTML='<div class="pt-empty" style="padding:28px 16px"><div style="font-size:24px;margin-bottom:10px">&#128101;</div><div style="font-size:13px;font-weight:600;margin-bottom:6px">파트너가 없어요</div><div style="font-size:11px;margin-bottom:14px">디자이너, 영상편집자, 카피라이터 등 협업 파트너를 등록하세요.</div><button class="btn btn-primary" onclick="openPartnerForm(null)" style="font-size:12px">+ 첫 파트너 추가하기</button></div>';return;}
  el.innerHTML='<div class="pt-grid">'+partners.map(function(p){
    var role=PARTNER_ROLES.find(function(r){return r.id===p.role;})||PARTNER_ROLES[0];
    var st=PARTNER_STATUS.find(function(s){return s.id===p.status;})||PARTNER_STATUS[0];
    var linked=clients.filter(function(c){return(p.clientIds||[]).includes(c.id);});
    return'<div class="pt-card">'+'<div class="pt-card-hd">'+'<span class="pt-name">'+p.name+'</span>'+'<span class="pt-role-badge" style="background:'+role.bg+';color:'+role.color+'">'+role.label+'</span>'+'</div>'+'<div class="pt-status-row">'+'<span class="pt-status-dot" style="background:'+st.dot+'"></span>'+'<span class="pt-status-lbl">'+st.label+'</span>'+'</div>'+(p.rate?'<div class="pt-info-row"><span class="pt-info-lbl">단가</span>'+p.rate+'</div>':'')+
(p.contact?'<div class="pt-info-row"><span class="pt-info-lbl">연락</span>'+p.contact+'</div>':'')+
(linked.length?'<div class="pt-info-row"><span class="pt-info-lbl">협업</span>'+linked.map(function(c){return c.name;}).join(', ')+'</div>':'')+
(p.note?'<div class="pt-note">'+p.note+'</div>':'')+
'<div class="pt-actions">'+'<button class="pt-btn" data-id="'+p.id+'" onclick="openPartnerForm(parseInt(this.dataset.id))">수정</button>'+'<select class="pt-link-sel" data-pid="'+p.id+'" onchange="linkPartnerClient(this.dataset.pid,this.value);this.value=\"\"">'+'<option value="">클라이언트 연결+</option>'+clients.filter(function(c){return!(p.clientIds||[]).includes(c.id);}).map(function(c){return'<option value="'+c.id+'">'+c.name+'</option>';}).join('')+'</select>'+'<button class="pt-btn del" style="margin-left:auto" data-id="'+p.id+'" onclick="deletePartner(this.dataset.id)">삭제</button>'+'</div>'+'</div>';
  }).join('')+'</div>';
}

function initPartnerCalc(){
  var pc=document.getElementById('pc-client');
  if(pc)pc.innerHTML='<option value="">클라이언트 선택</option>'+clients.filter(function(c){return c.stage!=='lost';}).map(function(c){return'<option value="'+c.id+'">'+c.name+' ('+c.amount+'만)</option>';}).join('');
  var pp=document.getElementById('pc-partner');
  if(pp)pp.innerHTML='<option value="">파트너 선택</option>'+partners.map(function(p){return'<option value="'+p.id+'">'+p.name+(p.rate?' | '+p.rate:'')+'</option>';}).join('');
}

function calcPartnerMargin(){
  var cid=parseInt((document.getElementById('pc-client')||{}).value||0);
  var cost=parseFloat((document.getElementById('pc-cost')||{}).value||0);
  var hours=parseFloat((document.getElementById('pc-hours')||{}).value||0);
  var res=document.getElementById('pc-result');if(!res)return;
  if(!cid||!cost){res.style.display='none';return;}
  var cl=clients.find(function(x){return x.id===cid;});
  if(!cl){res.style.display='none';return;}
  var revenue=cl.amount;
  var profit=revenue-cost;
  var pct=revenue>0?Math.round(profit/revenue*100):0;
  var hourly=hours>0?Math.round(profit/hours*10)/10:null;
  var pctEl=document.getElementById('pc-margin-pct');
  var prEl=document.getElementById('pc-profit');
  var hrEl=document.getElementById('pc-hourly');
  if(pctEl){pctEl.textContent=pct+'%';pctEl.style.color=pct>=60?'var(--teal)':pct>=40?'#854F0B':'var(--red)';}
  if(prEl)prEl.textContent=profit+'만';
  if(hrEl)hrEl.textContent=hourly?hourly+'만':'-';
  res.style.display='grid';
}
