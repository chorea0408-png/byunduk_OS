let sheetsUrl = '';

function loadSheetsConfig() {
  sheetsUrl = localStorage.getItem('vd_sheets_url') || '';
  updateSheetsDot();
  const last = localStorage.getItem('vd_sheets_last');
  if (last) {
    const el = document.getElementById('sheets-last-lbl');
    if (el) el.textContent = '마지막: ' + last;
  }
}

function updateSheetsDot() {
  const dot = document.getElementById('sheets-dot');
  if (dot) dot.className = 'sheets-btn-dot' + (sheetsUrl ? ' ok' : '');
}

function openSheetsModal() {
  const overlay = document.getElementById('sheets-overlay');
  const inp = document.getElementById('sheets-url-inp');
  if (overlay) overlay.classList.add('open');
  if (inp && sheetsUrl) inp.value = sheetsUrl;
}

function closeSheetsModal() {
  const overlay = document.getElementById('sheets-overlay');
  if (overlay) overlay.classList.remove('open');
}

function saveSheetsConfig() {
  const inp = document.getElementById('sheets-url-inp');
  const url = inp ? inp.value.trim() : '';
  if (url && !url.startsWith('https://script.google.com')) {
    showToast('올바른 Apps Script URL을 입력해주세요', 'error'); return;
  }
  sheetsUrl = url;
  localStorage.setItem('vd_sheets_url', url);
  updateSheetsDot();
  closeSheetsModal();
  showToast(url ? 'URL 저장 완료! 동기화 버튼을 눌러보세요.' : '연결이 해제됐습니다.', 'info');
}

async function testSheetsConnection() {
  const inp = document.getElementById('sheets-url-inp');
  const url = inp ? inp.value.trim() : sheetsUrl;
  if (!url) { showToast('URL을 먼저 입력해주세요', 'error'); return; }
  const btn = document.getElementById('sheets-test-btn');
  const status = document.getElementById('sheets-modal-status');
  if (btn) { btn.textContent = '테스트 중...'; btn.disabled = true; }
  if (status) status.textContent = '';
  try {
    await fetch(url, { method: 'GET', mode: 'no-cors' });
    if (status) status.textContent = '✓ 연결 가능한 것 같아요. 저장 후 동기화해 보세요.';
    showToast('연결 확인! 저장 후 동기화해보세요.', 'success');
  } catch(e) {
    if (status) status.textContent = '✗ 연결 실패. URL을 다시 확인해주세요.';
    showToast('연결 실패', 'error');
  }
  if (btn) { btn.textContent = '연결 테스트'; btn.disabled = false; }
}

function buildSheetsPayload() {
  const ST_MAP = {lead:'Lead',discovery:'Discovery',proposal:'Proposal',negotiation:'Negotiation',won:'Won',lost:'Lost'};
  const SRC_MAP = {kmong:'크몽',referral:'지인소개',sns:'SNS',direct:'직접연락',newsletter:'뉴스레터',etc:'기타'};
  const STATUS_MAP = {draft:'초안중',ready:'발행예정',pub:'발행완료'};
  const PRI_MAP = {p1:'핵심',p2:'권장',p3:'나중에'};
  const TIME_MAP = {t1:'즉시~9월',t2:'9월이후',t3:'여유있을때'};
  const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

  // CRM
  const clientRows = clients.map(function(cl) {
    const t = TYPES[cl.typeIdx] || TYPES[0];
    return [cl.name, t.name, ST_MAP[cl.stage]||cl.stage, cl.amount,
            SRC_MAP[cl.source]||cl.source||'미분류', cl.recontract?'재계약':'일반', cl.note||''];
  });

  // 지출
  const expenseRows = expCategories.map(function(cat) {
    const annSum = cat.months.reduce(function(a,v){return a+v;},0);
    return [cat.name].concat(cat.months).concat([annSum]);
  });

  // 채널 성장
  const channelRows = [...channelRecs].sort(function(a,b){return a.date.localeCompare(b.date);}).map(function(r) {
    return [r.date, r.ig||0, r.lt||0, r.bl||0, r.yt||0, r.th||0];
  });

  // 변덕레터
  const letterRows = [...letters].reverse().map(function(l,i) {
    return [letters.length-i, l.title, l.date||'', STATUS_MAP[l.status]||l.status, l.subscribers||0, l.openRate||0, l.note||''];
  });

  // 월별 실적
  const monthlyRows = MONTH_NAMES.map(function(m,i) {
    const rev = monthlyActuals[i] || 0;
    const exp = expCategories.reduce(function(a,cat){return a+(cat.months[i]||0);},0);
    return [m, rev, exp, rev-exp];
  });

  // 액션 보드
  const actionRows = actionItems.filter(function(it){return it.done;}).concat(
    actionItems.filter(function(it){return !it.done;})
  ).map(function(it) {
    return [it.cat, it.title, PRI_MAP[it.pri]||it.pri, TIME_MAP[it.time]||it.time, it.done?'완료':'진행중'];
  });

  return { clients:clientRows, expenses:expenseRows, channels:channelRows,
           letters:letterRows, monthly:monthlyRows, actions:actionRows };
}

async function syncAllToSheets() {
  if (!sheetsUrl) { openSheetsModal(); return; }

  const btn = document.getElementById('sheets-sync-btn');
  const txt = document.getElementById('sheets-btn-txt');
  if (btn) btn.classList.add('syncing');
  if (txt) txt.textContent = '동기화 중...';

  try {
    const payload = buildSheetsPayload();
    await fetch(sheetsUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
    const now = new Date().toLocaleString('ko-KR', {month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
    localStorage.setItem('vd_sheets_last', now);
    const lastEl = document.getElementById('sheets-last-lbl');
    if (lastEl) lastEl.textContent = '마지막: ' + now;
    showToast('Sheets 동기화 전송 완료! Sheets에서 확인해보세요 ✓', 'success');
  } catch(e) {
    showToast('전송 실패 — URL 설정을 확인해주세요', 'error');
  }

  if (btn) btn.classList.remove('syncing');
  if (txt) txt.textContent = 'Sheets 동기화';
}

var GAS_URL_KEY='vd_gas_url';

function toggleGasSettings(){
  var el=document.getElementById('gas-settings-panel');if(!el)return;
  var show=el.style.display==='none';
  el.style.display=show?'block':'none';
  if(show)renderGasSettings();
}

function getGasUrl(){try{return localStorage.getItem(GAS_URL_KEY)||'';}catch(e){return '';}}

function saveGasUrl(url){try{localStorage.setItem(GAS_URL_KEY,url);}catch(e){}}

function gcalLink(title,dateStr,desc){
  if(!dateStr)return;
  var d=new Date(dateStr+'T09:00:00');
  var e=new Date(dateStr+'T10:00:00');
  var fmt=function(dt){return dt.toISOString().replace(/[-:]/g,'').replace('.000','');};
  var url='https://calendar.google.com/calendar/r/eventedit'
    +'?text='+encodeURIComponent(title)
    +'&dates='+fmt(d)+'/'+fmt(e)
    +'&details='+encodeURIComponent(desc||'변덕쟁이들 OS');
  var a=document.createElement('a');
  a.href=url;a.target='_blank';a.rel='noopener noreferrer';
  document.body.appendChild(a);a.click();
  setTimeout(function(){document.body.removeChild(a);},100);
}

async function gcalAdd(title,dateStr,desc){
  var gasUrl=getGasUrl();
  if(gasUrl){
    // Google Apps Script 웹앱 방식
    try{
      await fetch(gasUrl,{method:'POST',mode:'no-cors',body:JSON.stringify({
        title:title,
        start:new Date(dateStr+'T09:00:00').toISOString(),
        end:new Date(dateStr+'T10:00:00').toISOString(),
        description:desc||'변덕쟁이들 OS'
      })});
      showToast('✅ 구글 캘린더에 자동 등록됨!');
    }catch(e){
      gcalLink(title,dateStr,desc); // fallback
    }
  }else{
    gcalLink(title,dateStr,desc); // 링크 방식
  }
}

function renderGasSettings(){
  var el=document.getElementById('gas-settings-panel');if(!el)return;
  var url=getGasUrl();
  el.innerHTML='<div class="gas-lbl">Google Calendar 연동 (선택)</div>'+'<div style="font-size:11px;color:var(--text2);margin-bottom:6px">Google Apps Script 배포 URL을 입력하면 자동 등록, 비우면 링크 방식으로 동작합니다.</div>'+'<input class="gas-in" id="gas-url-in" placeholder="https://script.google.com/macros/s/..." value="'+url+'">'+'<div style="display:flex;gap:6px;margin-top:6px">'+'<button class="btn btn-primary" onclick="saveGasUrl(document.getElementById(\'gas-url-in\').value);showToast(\'\u2705 저장됨!\')" style="font-size:11px">저장</button>'+'<button class="btn" onclick="saveGasUrl(\'\');document.getElementById(\'gas-url-in\').value=\'\';showToast(\'\u274C 연동 해제\')" style="font-size:11px">해제</button>'+'<a href="https://developers.google.com/apps-script" target="_blank" style="font-size:10px;color:var(--text3);line-height:2.5;margin-left:4px">GAS 가이드 &#8599;</a>'+'</div>';
}

function renderServiceMix(){
  var el=document.getElementById('pr-service-mix');if(!el)return;
  var typeStats=TYPES.map(function(t,ti){
    var clGroup=clients.filter(function(c){return c.typeIdx===ti&&c.stage==='won';});
    var totalAmt=clGroup.reduce(function(s,c){return s+(getClientLTV(c)||c.amount);},0);
    var totalHours=clGroup.reduce(function(s,c){
      return s+(c.timeLog||[]).reduce(function(h,l){return h+l.hours;},0);
    },0);
    var stdHours=t.hours*4*clGroup.length;
    var effRate=totalHours>0?Math.round(totalAmt/totalHours*10)/10:null;
    var stdRate=Math.round(t.defaultAmt/(t.hours*4)*10)/10;
    return{name:t.name,color:t.color,count:clGroup.length,totalAmt:totalAmt,
      totalHours:totalHours,stdHours:stdHours,effRate:effRate,stdRate:stdRate};
  }).filter(function(s){return s.count>0;});
  if(!typeStats.length){
    el.innerHTML='<div style="font-size:11px;color:var(--text3)">Won 클라이언트 데이터가 쌓이면 표시됩니다.</div>';return;
  }
  var maxAmt=Math.max.apply(null,typeStats.map(function(s){return s.totalAmt;}));
  var maxRate=Math.max.apply(null,typeStats.filter(function(s){return s.effRate;}).map(function(s){return s.effRate;}),1);
  var maxStdRate=Math.max.apply(null,typeStats.map(function(s){return s.stdRate;}),1);
  el.innerHTML=typeStats.map(function(s){
    var amtPct=maxAmt>0?Math.round(s.totalAmt/maxAmt*100):0;
    var rPct=maxRate>0&&s.effRate?Math.round(s.effRate/maxRate*100):0;
    var sRPct=maxStdRate>0?Math.round(s.stdRate/maxStdRate*100):0;
    var effLabel=s.effRate?s.effRate+'만/h':'로그 없음';
        return'<div class="mix-row">'+'<span class="mix-lbl" style="color:'+s.color+'">'+s.name+'</span>'+'<div class="mix-bars">'+'<div class="mix-br"><span class="mix-bl">총매출</span>'+'<div class="mix-bg"><div class="mix-bf" style="width:'+amtPct+'%;background:'+s.color+'"></div></div>'+'<span class="mix-bv">'+s.totalAmt+'만</span></div>'+(s.effRate?'<div class="mix-br"><span class="mix-bl">실시간당</span>'+'<div class="mix-bg"><div class="mix-bf" style="width:'+rPct+'%;background:'+s.color+'90"></div></div>'+'<span class="mix-bv" style="color:'+s.color+'">'+effLabel+'</span></div>':'')+'<div class="mix-br"><span class="mix-bl">기준시간당</span>'+'<div class="mix-bg"><div class="mix-bf" style="width:'+sRPct+'%;background:var(--bg3)"></div></div>'+'<span class="mix-bv">'+s.stdRate+'만/h</span></div>'+'</div>'+'<span class="mix-cnt">'+s.count+'건'+(s.totalHours?'·'+s.totalHours+'h':'')+'</span>'+'</div>';
  }).join('');
}

function renderAccuracy(){
  var el=document.getElementById('pr-accuracy');if(!el)return;
  // 서비스별 실제 성약률 vs 단계 확률 기반 예측
  var typeAcc=TYPES.map(function(t,ti){
    var all=clients.filter(function(c){return c.typeIdx===ti&&(c.stage==='won'||c.stage==='lost');});
    var won=all.filter(function(c){return c.stage==='won';}).length;
    var actual=all.length>0?Math.round(won/all.length*100):null;
    // 현재 파이프라인 예측 (가중 합)
    var pipe=clients.filter(function(c){return c.typeIdx===ti&&c.stage!=='won'&&c.stage!=='lost';});
    var weightedWon=pipe.reduce(function(s,c){
      var sg=STAGES.find(function(st){return st.id===c.stage;});
      return s+(sg?sg.prob:0);
    },0);
    return{name:t.name,color:t.color,closed:all.length,won:won,actual:actual,
      pipeCount:pipe.length,weightedWon:Math.round(weightedWon*10)/10};
  }).filter(function(s){return s.closed>0||s.pipeCount>0;});
  if(!typeAcc.length){
    el.innerHTML='<div style="font-size:11px;color:var(--text3)">청약/이탈 데이터가 쌓이면 표시됩니다.</div>';return;
  }
  el.innerHTML=typeAcc.map(function(s){
    var pct=s.actual||0;
    var barCol=pct>=60?'#1D9E75':pct>=40?'#854F0B':'#E24B4A';
    return'<div class="acc-row">'+'<span class="acc-svc" style="color:'+s.color+'">'+s.name+'</span>'+'<div class="acc-bar-bg">'+(s.actual!==null?'<div class="acc-bar-fill" style="width:'+pct+'%;background:'+barCol+'">'+pct+'%</div>':'<div style="font-size:9px;color:var(--text3);padding-left:5px;line-height:14px">데이터 부족</div>')+'</div>'+'<span class="acc-meta">'+(s.closed>0?s.won+'/'+s.closed:'파이프'+s.pipeCount+'건')+'</span>'+'</div>';
  }).join('')+'<div style="font-size:10px;color:var(--text3);margin-top:8px">예측 Won (가중) = 파이프라인 내 '+typeAcc.filter(function(s){return s.pipeCount>0;}).map(function(s){return s.name+' '+s.weightedWon+'건';}).join(', ')+'</div>';
  var closeAccEl=document.getElementById('pr-close-acc');
  if(closeAccEl){
    var now2=new Date();now2.setHours(0,0,0,0);
    var wonWithClose=clients.filter(function(c){return c.stage==='won'&&c.expectedClose&&c.stageEnteredAt&&c.stageEnteredAt.won;});
    if(wonWithClose.length>=2){
      var diffs=wonWithClose.map(function(c){return Math.ceil((new Date(c.stageEnteredAt.won)-new Date(c.expectedClose))/(86400000));});
      var avgDiff=Math.round(diffs.reduce(function(s,d){return s+d;},0)/diffs.length);
      var onTime=diffs.filter(function(d){return Math.abs(d)<=7;}).length;
      var earlyC=diffs.filter(function(d){return d<0;}).length;
      var lateC=diffs.filter(function(d){return d>0;}).length;
      closeAccEl.innerHTML='<div style="font-size:11px;color:var(--text2);margin-top:12px;padding-top:10px;border-top:.5px solid var(--border2)"><span style="font-weight:600">클로징 날짜 예측 정확도</span> <span style="color:var(--text3);font-size:10px">('+wonWithClose.length+'건 기준)</span></div>'+
        '<div style="display:flex;gap:12px;margin-top:6px;flex-wrap:wrap">'+
          '<div style="font-size:11px"><span style="color:var(--text3)">평균 오차</span> <b>'+(avgDiff>0?'+':'')+avgDiff+'일</b></div>'+
          '<div style="font-size:11px"><span style="color:var(--text3)">±7일 이내</span> <b style="color:#1D9E75">'+onTime+'건</b></div>'+
          '<div style="font-size:11px"><span style="color:var(--text3)">조기 클로징</span> <b style="color:#185FA5">'+earlyC+'건</b></div>'+
          '<div style="font-size:11px"><span style="color:var(--text3)">지연</span> <b style="color:#E24B4A">'+lateC+'건</b></div>'+
        '</div>'+
        '<div style="font-size:10px;color:var(--text3);margin-top:4px">'+(avgDiff<-7?'예상보다 빨리 클로징되는 경향. expectedClose를 앞당겨 설정하세요.':avgDiff>7?'예상보다 늦게 클로징되는 경향. 파이프라인 예측에 여유를 두세요.':'예측 정확도가 양호해요.')+'</div>';
    }else{
      closeAccEl.innerHTML='<div style="font-size:11px;color:var(--text3);margin-top:10px">Won 클라이언트에 expectedClose가 2건 이상 쌓이면 표시돼요.</div>';
    }
  }
}

function renderClosingTime(){
  var el=document.getElementById('pr-closing-time');if(!el)return;
  var typeTimes=TYPES.map(function(t,ti){
    var wonCls=clients.filter(function(c){
      return c.typeIdx===ti&&c.stage==='won'&&
        c.stageEnteredAt&&c.stageEnteredAt.lead&&c.stageEnteredAt.won;
    });
    var days=wonCls.map(function(c){
      return Math.ceil((new Date(c.stageEnteredAt.won)-new Date(c.stageEnteredAt.lead))/(86400000));
    }).filter(function(d){return d>0&&d<365;});
    var avg=days.length>0?Math.round(days.reduce(function(s,d){return s+d;},0)/days.length):null;
    var min=days.length>0?Math.min.apply(null,days):null;
    var max=days.length>0?Math.max.apply(null,days):null;
    return{name:t.name,color:t.color,count:days.length,avg:avg,min:min,max:max};
  }).filter(function(s){return s.count>0;});
  if(!typeTimes.length){
    el.innerHTML='<div style="font-size:11px;color:var(--text3)">Lead→Won 전환 데이터가 쌓이면 표시됩니다.</div>';return;
  }
  var maxAvg=Math.max.apply(null,typeTimes.map(function(s){return s.avg||0;}),1);
  el.innerHTML=typeTimes.map(function(s){
    var pct=maxAvg>0?Math.round(s.avg/maxAvg*100):0;
    var col=s.avg<=14?'#1D9E75':s.avg<=30?'#854F0B':'#E24B4A';
    return'<div class="clt-row">'+'<span style="font-size:11px;font-weight:500;color:'+s.color+';width:90px;flex-shrink:0">'+s.name+'</span>'+'<div class="clt-bar-wrap"><div class="clt-bar-fill" style="width:'+pct+'%;background:'+col+'"></div></div>'+'<span class="clt-days" style="color:'+col+'">'+s.avg+'일</span>'+'<span style="font-size:10px;color:var(--text3);flex-shrink:0;padding-left:6px">'+s.count+'건 ('+s.min+'~'+s.max+')</span>'+'</div>';
  }).join('')+'<div style="font-size:10px;color:var(--text3);margin-top:8px">'+'&#9650; 14일 이내&nbsp;&nbsp;&#9679; 15~30일&nbsp;&nbsp;&#9660; 31일+</div>';
}
