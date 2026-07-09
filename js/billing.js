function getBillBadge(cid){
  var ub=bills.filter(function(b){return b.clientId===cid&&b.status!=='paid';});
  if(!ub.length)return'';
  var od=ub.filter(function(b){return b.status==='overdue';});
  if(od.length)return'<span class="bill-bdg overdue">&#9651; 연체 '+od.length+'건</span>';
  return'<span class="bill-bdg pending">대기 '+ub.length+'건</span>';
}

function loadBills(){
  try{const s=localStorage.getItem('vd_bills');if(s){bills=JSON.parse(s);billNid=Math.max(...bills.map(b=>b.id),0)+1;}}catch(e){}
}

function saveBills(){try{localStorage.setItem('vd_bills',JSON.stringify(bills));}catch(e){}}

function autoCreateBills(){
  const won=clients.filter(c=>c.stage==='won');let added=0;
  won.forEach(function(c){
    if(!bills.find(b=>b.clientId===c.id&&b.status!=='paid')){
      const due=new Date();due.setDate(due.getDate()+14);
      var t2=TYPES[c.typeIdx]||TYPES[0];
      var nowYM=new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long'});
      bills.push({id:billNid++,invoiceNo:getNextInvoiceNo(),clientId:c.id,clientName:c.name,amount:c.amount,desc:t2.name+' '+nowYM+'분',issueDate:new Date().toISOString().slice(0,10),dueDate:due.toISOString().slice(0,10),status:'draft',note:'',recurring:false,vatType:'0'});
      added++;
    }
  });
  saveBills();renderBilling();
  alert(added?added+'건 생성됐어요.':'이미 모든 Won 클라이언트에 청구서가 있어요.');
}

function openBillModal(prefillCid){
  // 날짜 기본값 설정
  var today=new Date().toISOString().slice(0,10);
  var due14=new Date();due14.setDate(due14.getDate()+14);
  document.getElementById('bf-issue').value=today;
  document.getElementById('bf-due').value=due14.toISOString().slice(0,10);
  document.getElementById('bf-amt').value='';
  document.getElementById('bf-desc').value='';
  document.getElementById('bf-note').value='';
  document.getElementById('bf-vat').value='0';
  // 클라이언트 셀렉트 populate
  var sel=document.getElementById('bf-client');
  sel.innerHTML='<option value="">직접 입력</option>';
  clients.filter(function(c){return c.stage!=='lost';}).forEach(function(c){
    var t=TYPES[c.typeIdx]||TYPES[0];
    var opt=document.createElement('option');
    opt.value=c.id;
    opt.textContent=c.name+' ('+t.tag+')';
    if(prefillCid&&c.id===prefillCid)opt.selected=true;
    sel.appendChild(opt);
  });
  // prefill 금액 (Won 클라이언트면 amount 자동 채움)
  if(prefillCid){
    var cl=clients.find(function(c){return c.id===prefillCid;});
    if(cl){document.getElementById('bf-amt').value=cl.amount||'';}
    document.getElementById('bf-name-wrap').style.display='none';
  }else{
    document.getElementById('bf-name-wrap').style.display='';
    document.getElementById('bf-name').value='';
  }
  // 셀렉트 변경 시 직접 입력 표시/숨김 + 금액 자동 채움
  sel.onchange=function(){
    var cid=parseInt(sel.value)||0;
    var nw=document.getElementById('bf-name-wrap');
    nw.style.display=cid?'none':'';
    if(cid){
      var cl2=clients.find(function(c){return c.id===cid;});
      if(cl2&&!document.getElementById('bf-amt').value)
        document.getElementById('bf-amt').value=cl2.amount||'';
    }
  };
  document.getElementById('bill-modal-overlay').style.display='block';
  document.getElementById('bill-modal').style.display='block';
  setTimeout(function(){document.getElementById('bf-desc').focus();},80);
}

function editBill(bid){
  var b=bills.find(function(x){return x.id===bid;});if(!b)return;
  // 모달 열기
  var today=new Date().toISOString().slice(0,10);
  var due14=new Date();due14.setDate(due14.getDate()+14);
  document.getElementById('bf-issue').value=b.issueDate||today;
  document.getElementById('bf-due').value=b.dueDate||due14.toISOString().slice(0,10);
  // VAT 이중 적용 방지: bf-amt에는 항상 VAT 제외 원금 표시
  var rawAmt=(b.vatType==='10'&&b.amount)?Math.round(b.amount/1.1):b.amount;
  document.getElementById('bf-amt').value=rawAmt||'';
  document.getElementById('bf-desc').value=b.desc||'';
  document.getElementById('bf-note').value=b.note||'';
  document.getElementById('bf-vat').value=b.vatType||'0';
  // 클라이언트 셀렉트
  var sel=document.getElementById('bf-client');
  sel.innerHTML='<option value="">직접 입력</option>';
  clients.filter(function(c){return c.stage!=='lost';}).forEach(function(c){
    var t=TYPES[c.typeIdx]||TYPES[0];
    var opt=document.createElement('option');
    opt.value=c.id;
    opt.textContent=c.name+' ('+t.tag+')';
    if(b.clientId&&c.id===b.clientId)opt.selected=true;
    sel.appendChild(opt);
  });
  var nw=document.getElementById('bf-name-wrap');
  if(b.clientId){nw.style.display='none';}
  else{nw.style.display='';document.getElementById('bf-name').value=b.clientName||'';}
  sel.onchange=function(){
    var cid=parseInt(sel.value)||0;
    nw.style.display=cid?'none':'';
  };
  document.getElementById('bill-modal-title').textContent='청구서 수정';
  document.getElementById('bill-modal-overlay').style.display='block';
  document.getElementById('bill-modal').style.display='block';
  // submitBillModal을 수정 모드로 덮어쓰기
  var editBtn=document.querySelector('#bill-modal .btn-primary');
  if(!editBtn)return;
  editBtn.onclick=function(){
    var cid2=parseInt(sel.value)||0;
    var cl2=cid2?clients.find(function(c){return c.id===cid2;}):null;
    var nm=cl2?cl2.name:(document.getElementById('bf-name').value||'').trim();
    if(!nm){showToast('클라이언트 이름을 입력해주세요.');return;}
    var amt2=parseFloat(document.getElementById('bf-amt').value);
    if(isNaN(amt2)||amt2<=0){showToast('올바른 금액을 입력해주세요.');return;}
    var vat2=document.getElementById('bf-vat').value;
    var total2=vat2==='10'?Math.round(amt2*1.1):amt2;
    var issue2=document.getElementById('bf-issue').value;
    var due2=document.getElementById('bf-due').value;
    if(!issue2||!due2){showToast('날짜를 입력해주세요.');return;}
    if(due2<issue2){showToast('납기일이 발행일보다 빠를 수 없어요.');return;}
    b.clientId=cid2||null;b.clientName=nm;b.amount=total2;
    b.desc=document.getElementById('bf-desc').value.trim();
    b.issueDate=issue2;b.dueDate=due2;
    b.note=document.getElementById('bf-note').value.trim();
    b.vatType=vat2;
    saveBills();renderBilling();closeBillModal();
    showToast('&#9999;&#65039; 청구서가 수정됐어요!');
  };
  setTimeout(function(){document.getElementById('bf-desc').focus();},80);
}

function closeBillModal(){
  document.getElementById('bill-modal-overlay').style.display='none';
  document.getElementById('bill-modal').style.display='none';
  document.getElementById('bill-modal-title').textContent='청구서 추가';
  var btn=document.querySelector('#bill-modal .btn-primary');
  if(btn&&typeof submitBillModal==='function')btn.onclick=submitBillModal;
}

function submitBillModal(){
  var sel=document.getElementById('bf-client');
  var cid=parseInt(sel.value)||0;
  var cl=cid?clients.find(function(c){return c.id===cid;}):null;
  var clientName=cl?cl.name:(document.getElementById('bf-name').value||'').trim();
  if(!clientName){showToast('클라이언트 이름을 입력해주세요.');return;}
  var amtRaw=parseFloat(document.getElementById('bf-amt').value);
  if(isNaN(amtRaw)||amtRaw<=0){showToast('올바른 금액을 입력해주세요.');return;}
  var vat=document.getElementById('bf-vat').value;
  var totalAmt=vat==='10'?Math.round(amtRaw*1.1):amtRaw;
  var desc=document.getElementById('bf-desc').value.trim();
  var issueDate=document.getElementById('bf-issue').value;
  var dueDate=document.getElementById('bf-due').value;
  if(!issueDate||!dueDate){showToast('발행일과 납기일을 입력해주세요.');return;}
  if(dueDate<issueDate){showToast('납기일이 발행일보다 빠를 수 없어요.');return;}
  var note=document.getElementById('bf-note').value.trim();
  var invNo=getNextInvoiceNo();
  bills.push({
    id:billNid++,invoiceNo:invNo,
    clientId:cid||null,clientName:clientName,
    amount:totalAmt,desc:desc,
    issueDate:issueDate,dueDate:dueDate,
    status:'draft',note:note,recurring:false,
    vatType:vat
  });
  saveBills();renderBilling();closeBillModal();
  showToast('&#128203; '+invNo+' 생성됐어요!');
}

function revertBillPaid(id){
  if(!confirm('입금 취소하고 발행 상태로 되돌릴까요?'))return;
  updateBillStatus(id,'issued');
}

function updateBillStatus(id,status){
  const b=bills.find(x=>x.id===id);if(b){b.status=status;saveBills();renderBilling();}
}

function deleteBill(id){
  if(!confirm('청구서를 삭제할까요?'))return;
  bills=bills.filter(b=>b.id!==id);saveBills();renderBilling();
}

function renderBilling(){
  const today=new Date().toISOString().slice(0,10);
  bills.forEach(function(b){if(b.status==='issued'&&b.dueDate&&b.dueDate<today)b.status='overdue';});
  const cnt={};BILL_STATUSES.forEach(function(s){cnt[s.id]=bills.filter(b=>b.status===s.id);});
  const sum=function(arr){return arr.reduce(function(a,b){return a+(Number(b.amount)||0);},0);};
  document.getElementById('bl-k1').textContent=cnt.draft.length+'건';
  document.getElementById('bl-k1s').textContent=sum(cnt.draft)+'만 미발행';
  document.getElementById('bl-k2').textContent=cnt.issued.length+'건';
  document.getElementById('bl-k2s').textContent=sum(cnt.issued)+'만 입금 대기';
  document.getElementById('bl-k3').textContent=cnt.paid.length+'건';
  document.getElementById('bl-k3s').textContent=sum(cnt.paid)+'만 수금';
  document.getElementById('bl-k4').textContent=cnt.overdue.length+'건';
  document.getElementById('bl-k4s').textContent=cnt.overdue.length?sum(cnt.overdue)+'만 연체':'없음';
  const wrap=document.getElementById('bill-list-wrap');
  if(!bills.length){wrap.innerHTML='<div style="text-align:center;padding:2rem;font-size:12px;color:var(--text2);border:.5px dashed var(--border);border-radius:var(--rlg)">청구서가 없어요.<br><br><button class="btn" onclick="autoCreateBills()">Won 클라이언트에서 자동 생성</button></div>';return;}
  const sorted=[...bills].sort(function(a,b){const o={overdue:0,issued:1,draft:2,paid:3};return(o[a.status]||0)-(o[b.status]||0);});
  
  wrap.innerHTML='<div class="bill-list">'+sorted.map(function(b){
    const st=BILL_STATUSES.find(s=>s.id===b.status)||BILL_STATUSES[0];
    let acts='';
    if(b.status==='draft'){
      acts='<button class="act-sm" data-bid="'+b.id+'" onclick="editBill(parseInt(this.dataset.bid))">수정</button>';
      acts+='<button class="act-sm btn-primary-sm" data-bid="'+b.id+'" data-st="issued" onclick="updateBillStatus(parseInt(this.dataset.bid),this.dataset.st)">발행</button>';
    }else if(b.status==='issued'||b.status==='overdue'){
      acts='<button class="act-sm btn-primary-sm" data-bid="'+b.id+'" data-st="paid" onclick="updateBillStatus(parseInt(this.dataset.bid),this.dataset.st)">입금 확인</button>';
    }else if(b.status==='paid'){
      acts='<button class="act-sm" data-bid="'+b.id+'" onclick="revertBillPaid(parseInt(this.dataset.bid))" style="color:var(--text3)">입금 취소</button>';
    }
    acts+='<button class="act-sm" data-bid="'+b.id+'" onclick="showBillKakao(parseInt(this.dataset.bid))" style="color:var(--teal)">카톡</button>';
    acts+='<button class="act-sm" data-bid="'+b.id+'" onclick="deleteBill(parseInt(this.dataset.bid))" style="color:var(--red)">삭제</button>';
    var vatBadge=b.vatType==='10'?' <span style="font-size:9px;color:var(--text3)">(VAT포함)</span>':b.vatType==='separate'?' <span style="font-size:9px;color:var(--amber)">(VAT별도)</span>':'';
    return '<div class="bill-row">'+
      '<div style="flex:1;min-width:0">'+
        '<div class="bill-nm">'+b.clientName+(b.recurring?'<span class="recur-badge">&#128260; 반복</span>':'')+'</div>'+
        (b.desc?'<div style="font-size:10px;color:var(--text2);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px">'+b.desc+'</div>':'')+
        '<div class="bill-dt">'+(b.invoiceNo?b.invoiceNo+' &middot; ':'')+'발행 '+b.issueDate+'</div>'+
      '</div>'+
      '<div class="bill-amt">'+b.amount+'만원'+vatBadge+'</div>'+
      '<div class="bill-due">납기 '+b.dueDate.slice(5)+'</div>'+
      '<div><span class="bl-st" style="background:'+st.bg+';color:'+st.color+'">'+st.label+'</span></div>'+
      '<div class="bill-acts">'+acts+'</div>'+
    '</div>';
  }).join('')+'</div>';
}

let calYear=new Date().getFullYear(), calMonth=new Date().getMonth();

function calMove(d){
  calMonth+=d;
  if(calMonth>11){calMonth=0;calYear++;}
  if(calMonth<0){calMonth=11;calYear--;}
  renderCalendar();
}

function calGoToday(){
  calYear=new Date().getFullYear();calMonth=new Date().getMonth();
  renderCalendar();
}

function calShowDetail(dateStr){
  const panel=document.getElementById('cal-detail-panel');
  const dateEl=document.getElementById('cal-detail-date');
  const itemsEl=document.getElementById('cal-detail-items');
  if(!panel||!dateEl||!itemsEl)return;
  const d=new Date(dateStr);
  const lbl=d.toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'long'});
  dateEl.innerHTML='<i class="ti ti-calendar" style="font-size:14px;color:var(--text2)" aria-hidden="true"></i>'+lbl;
  // 해당 날짜 청구서
  const dayBills=bills.filter(function(b){return b.dueDate===dateStr;});
  // 해당 날짜 팔로업
  const dayFu=clients.filter(function(cl){return cl.nextFollowup===dateStr&&cl.stage!=='won'&&cl.stage!=='lost';});
  if(!dayBills.length&&!dayFu.length){
    panel.classList.remove('show');return;
  }
  let html='';
  dayBills.forEach(function(b){
    const st=BILL_STATUSES.find(function(s){return s.id===b.status;})||BILL_STATUSES[0];
    html+='<div class="cal-detail-item">'+
      '<span class="cal-dot '+b.status+'" style="padding:2px 8px;font-size:10px">'+st.label+'</span>'+
      '<span style="flex:1;font-weight:500">'+b.client+'</span>'+
      '<span style="color:var(--text2)">'+b.service+'</span>'+
      '<span style="font-weight:500;color:var(--text)">'+b.amount+'만</span>'+
    '</div>';
  });
  dayFu.forEach(function(cl){
    const fu=getFollowupInfo(cl);
    html+='<div class="cal-detail-item">'+
      '<span class="cal-dot fu" style="padding:2px 8px;font-size:10px">팔로업</span>'+
      '<span style="flex:1;font-weight:500">'+cl.name+'</span>'+
      '<span style="color:#534AB7">'+(fu?fu.label:'예정')+'</span>'+
    '</div>';
  });
  itemsEl.innerHTML=html;
  panel.classList.add('show');
}

function renderCalendar(){
  const lbl=document.getElementById('cal-month-lbl');
  if(lbl)lbl.textContent=calYear+'년 '+(calMonth+1)+'월';
  const grid=document.getElementById('cal-grid');
  if(!grid)return;
  const today=new Date();today.setHours(0,0,0,0);
  const todayStr=today.toISOString().slice(0,10);
  const DOWS=['일','월','화','수','목','금','토'];
  let html=DOWS.map(function(d){return'<div class="cal-dow">'+d+'</div>';}).join('');
  const firstDay=new Date(calYear,calMonth,1).getDay();
  const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
  const prevDays=new Date(calYear,calMonth,0).getDate();
  // 이전 달 빈 칸
  for(let i=firstDay-1;i>=0;i--){
    html+='<div class="cal-day other-month"><div class="cal-day-n">'+(prevDays-i)+'</div></div>';
  }
  // 이번 달 날짜
  for(let d=1;d<=daysInMonth;d++){
    const dateStr=calYear+'-'+String(calMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    const dayBills=bills.filter(function(b){return b.dueDate===dateStr;});
    const dayFu=clients.filter(function(cl){return cl.nextFollowup===dateStr&&cl.stage!=='won'&&cl.stage!=='lost';});
    const isToday=dateStr===todayStr;
    const isSun=new Date(calYear,calMonth,d).getDay()===0;
    const hasBill=dayBills.length>0||dayFu.length>0;
    let cls='cal-day'+(isToday?' today':'')+(isSun?' sun':'')+(hasBill?' has-bill':'');
    let dots='<div class="cal-dot-wrap">';
    dayBills.slice(0,2).forEach(function(b){
      dots+='<div class="cal-dot '+b.status+'">'+b.client+'</div>';
    });
    if(dayBills.length>2) dots+='<div class="cal-dot issued">+' +(dayBills.length-2)+'건</div>';
    dayFu.slice(0,1).forEach(function(cl){
      dots+='<div class="cal-dot fu">↗'+cl.name+'</div>';
    });
    dots+='</div>';
    html+='<div class="'+cls+'"'+(hasBill?' data-date="'+dateStr+'" onclick="calShowDetail(this.dataset.date)"':'')+'>'+
      '<div class="cal-day-n">'+d+'</div>'+dots+
    '</div>';
  }
  // 다음 달 빈 칸
  const totalCells=firstDay+daysInMonth;
  const remaining=(7-totalCells%7)%7;
  for(let i=1;i<=remaining;i++){
    html+='<div class="cal-day other-month"><div class="cal-day-n">'+i+'</div></div>';
  }
  grid.innerHTML=html;
  // 상세 패널 초기화
  const panel=document.getElementById('cal-detail-panel');
  if(panel)panel.classList.remove('show');
}

function showBillKakao(bid){
  var b=bills.find(function(x){return x.id===bid;});if(!b)return;
  var nm=b.clientName||'대표님';
  var svc=b.desc||(b.clientName+'서비스')||'서비스';
  var dueStr=b.dueDate?b.dueDate.replace(/-/g,'.')+'까지':''
  var st2=loadSettings();
  var acct=st2.bankName&&st2.bankAcct?st2.bankName+' '+st2.bankAcct+(st2.bankHolder?' '+st2.bankHolder:''):'우리은행 000-0000-0000 조형준 (설정에서 수정)';
  var msg=[
    '안녕하세요, '+nm+' 대표님.',
    '변덕쟁이들 조형준입니다 &#128591;',
    '',
    svc+' 비용을 청구 드립니다.',
    '',
    '· 청구 금액: '+b.amount+'만원 (VAT 포함)',
    (dueStr?'· 납기일: '+dueStr:''),
    '· 입금 계좌: '+acct,
    '',
    '입금 확인 후 연락 주시면 바로 확인하겠습니다.',
    '감사합니다 &#128591;',
  ].filter(function(l){return l!==undefined;}).join('\n');
  var rowId='kakao-row-'+bid;
  var existing=document.getElementById(rowId);
  if(existing){existing.remove();return;}
  var billEl=document.querySelector('[data-bid="'+bid+'"]');
  if(!billEl)return;
  var div=document.createElement('div');
  div.id=rowId;
  div.innerHTML='<div class="bill-kakao-box" style="display:block">'+msg.replace(/\n/g,'<br>')+'</div>'+'<div class="bill-kakao-row">'+'<button class="btn btn-primary" onclick="copyBillKakao(\''+rowId+'\')" style="font-size:11px">&#128203; 복사</button>'+'<button class="btn" onclick="document.getElementById(\''+rowId+'\').remove()" style="font-size:11px">닫기</button>'+'</div>';
  div.dataset.msg=msg;
  billEl.after(div);
}

function copyBillKakao(rowId){
  var div=document.getElementById(rowId);if(!div)return;
  var msg=div.dataset.msg;
  if(navigator.clipboard)navigator.clipboard.writeText(msg).then(function(){showToast('✅ 쿤스티어스 쿤스리고 카카오에 붙여넣으세요!');});
}

var INV_COUNTER_KEY='vd_inv_c';

function getNextInvoiceNo(){
  var yr=new Date().getFullYear();
  try{
    var n=parseInt(localStorage.getItem(INV_COUNTER_KEY)||'0')+1;
    localStorage.setItem(INV_COUNTER_KEY,n.toString());
    return 'INV-'+yr+'-'+String(n).padStart(3,'0');
  }catch(e){return 'INV-'+yr+'-'+Date.now().toString().slice(-3);}
}

function saveRecurBill(cid){
  var cl=clients.find(function(x){return x.id===cid;});if(!cl)return;
  cl.recurBill={
    enabled:!!(document.getElementById('rb-enabled-'+cid)||{}).checked,
    day:parseInt((document.getElementById('rb-day-'+cid)||{}).value||'1'),
    amount:parseInt((document.getElementById('rb-amt-'+cid)||{}).value||cl.amount),
    desc:(document.getElementById('rb-desc-'+cid)||{}).value||''
  };
  save();
}

function checkRecurBills(){
  var today=new Date();var dd=today.getDate();
  var todayStr=today.toISOString().slice(0,10);
  var thisMonth=todayStr.slice(0,7);
  var created=0;
  clients.filter(function(c){
    return c.stage==='won'&&c.recurBill&&c.recurBill.enabled;
  }).forEach(function(c){
    if(c.recurBill.day!==dd)return;
    var exists=bills.some(function(b){
      return b.clientId===c.id&&b.recurring&&(b.issueDate||'').startsWith(thisMonth);
    });
    if(exists)return;
    var due=new Date(today);due.setDate(due.getDate()+14);
    bills.push({
      id:billNid++,
      invoiceNo:getNextInvoiceNo(),
      clientId:c.id,clientName:c.name,
      amount:c.recurBill.amount||c.amount,
      issueDate:todayStr,
      dueDate:due.toISOString().slice(0,10),
      status:'draft',
      note:c.recurBill.desc||'',
      recurring:true
    });
    created++;
  });
  if(created>0){
    saveBills();
    showToast('&#128260; '+created+'건 반복 청구서가 생성되었어요!');
  }
}
