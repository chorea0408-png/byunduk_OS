const QUOTE_SVCS=[
  {id:'sns',name:'SNS 월정액',icon:'ti-brand-instagram',unit:'월',color:'#185FA5',
   tiers:[{id:'basic',label:'기본',price:300000,desc:'카드뉴스 4회 제작·발행'},{id:'standard',label:'스탠다드',price:500000,desc:'카드뉴스 8회 + 스토리 관리'},{id:'premium',label:'프리미엄',price:800000,desc:'카드뉴스 12회 + 릴스 2회 + 스토리'}],
   options:[{id:'reels',label:'릴스 추가 제작',price:200000},{id:'adsm',label:'광고비 관리',price:100000},{id:'report',label:'월간 성과 리포트',price:50000}]},
  {id:'ad',name:'광고 기획·집행',icon:'ti-speakerphone',unit:'프로젝트',color:'#854F0B',
   tiers:[{id:'basic',label:'기본',price:1000000,desc:'기획 + 소재 3종 + 집행 1개월'},{id:'standard',label:'스탠다드',price:1500000,desc:'기획 + 소재 5종 + 집행 2개월'},{id:'premium',label:'프리미엄',price:2000000,desc:'기획 + 소재 8종 + 집행 3개월'}],
   options:[{id:'video',label:'영상 소재 제작',price:300000},{id:'ab',label:'A/B 테스트',price:200000},{id:'weekly',label:'주간 리포트',price:100000}]},
  {id:'brand',name:'브랜딩 패키지',icon:'ti-palette',unit:'프로젝트',color:'#993556',
   tiers:[{id:'basic',label:'기본',price:1200000,desc:'로고 + 컬러 시스템 + 가이드북'},{id:'standard',label:'스탠다드',price:1800000,desc:'기본 + 명함 + SNS 프로필 + 간판 시안'},{id:'premium',label:'프리미엄',price:2500000,desc:'스탠다드 + 영상 인트로 + 패키지 디자인'}],
   options:[{id:'print',label:'명함 인쇄(100장)',price:150000},{id:'sign',label:'간판 제작 컨설팅',price:200000},{id:'photo',label:'제품·공간 촬영',price:400000}]},
  {id:'content',name:'콘텐츠 기획',icon:'ti-writing',unit:'프로젝트',color:'#3B6D11',
   tiers:[{id:'basic',label:'기본',price:500000,desc:'월 콘텐츠 캘린더 + 주제 12개'},{id:'standard',label:'스탠다드',price:800000,desc:'기본 + 카피라이팅 + 시각 가이드'},{id:'premium',label:'프리미엄',price:1200000,desc:'스탠다드 + 영상 스크립트 + 릴스 기획'}],
   options:[{id:'blog',label:'블로그 SEO 포스팅(4건)',price:200000},{id:'thread',label:'쓰레드 운영 세팅',price:100000}]},
  {id:'spot',name:'단발 프로젝트',icon:'ti-bolt',unit:'건',color:'#5F5E5A',
   tiers:[{id:'basic',label:'소형',price:300000,desc:'단순 디자인·카피 1~2종'},{id:'standard',label:'중형',price:500000,desc:'기획+제작 패키지'},{id:'premium',label:'대형',price:1000000,desc:'멀티 채널 캠페인'}],
   options:[{id:'rush',label:'급행 처리(2일 이내)',price:200000}]},
];

let quoteItems=[],quoteNid=1,quoteFmt='kakao',quoteClientId='';

function qtW(n){return n.toLocaleString('ko-KR')+'원';}

function qtGetTotal(){
  return quoteItems.reduce(function(sum,item){
    var svc=QUOTE_SVCS.find(function(s){return s.id===item.svcId;});if(!svc)return sum;
    var tier=svc.tiers.find(function(t){return t.id===item.tierId;});
    var base=tier?tier.price:0;
    var opts=item.opts.reduce(function(os,oid){var o=svc.options.find(function(x){return x.id===oid;});return os+(o?o.price:0);},0);
    return sum+base+opts;
  },0);
}

function addQuoteSvc(svcId){
  if(quoteItems.find(function(i){return i.svcId===svcId;})){showToast('이미 추가된 서비스예요');return;}
  quoteItems.push({id:quoteNid++,svcId:svcId,tierId:'standard',opts:[]});
  renderQuote();
}

function removeQuoteSvc(idStr){
  quoteItems=quoteItems.filter(function(i){return i.id!==parseInt(idStr);});
  renderQuote();
}

function setQuoteTier(idStr,tid){
  var item=quoteItems.find(function(i){return i.id===parseInt(idStr);});
  if(item){item.tierId=tid;renderQuote();}
}

function toggleQuoteOpt(idStr,oid){
  var item=quoteItems.find(function(i){return i.id===parseInt(idStr);});
  if(!item)return;
  var idx=item.opts.indexOf(oid);
  if(idx>=0)item.opts.splice(idx,1);else item.opts.push(oid);
  renderQuote();
}

function qtSetClient(val){quoteClientId=val;renderQuoteOutput();renderQtCompare();}

function qtToManwon(won){return Math.round(won/10000);}

function renderQtCompare(){
  var box=document.getElementById('qt-crm-compare');if(!box)return;
  if(!quoteClientId){box.innerHTML='';return;}
  var cl=clients.find(function(c){return c.id===parseInt(quoteClientId);});
  if(!cl){box.innerHTML='';return;}
  var quoteManwon=qtToManwon(qtGetTotal());
  var match=cl.amount===quoteManwon;
  box.innerHTML='<div class="qt-compare-row">현재 CRM 금액: <b>'+cl.amount+'만원</b> → 이 견적 금액: <b>'+quoteManwon+'만원</b>'+
    (match?' <span class="qt-compare-ok">✓ 일치</span>':'')+'</div>'+
    '<button class="qt-copy-btn" style="margin-top:6px" onclick="applyQuoteToCrm()">'+(match?'CRM 금액에 반영하기 (이미 일치)':'CRM 금액에 반영하기')+'</button>';
}

function applyQuoteToCrm(){
  if(!quoteClientId){showToast('먼저 클라이언트를 연결해주세요');return;}
  var cl=clients.find(function(c){return c.id===parseInt(quoteClientId);});
  if(!cl){showToast('연결된 클라이언트를 찾을 수 없어요');return;}
  var manwon=qtToManwon(qtGetTotal());
  cl.amount=manwon;
  save();
  if(typeof renderCRM==='function')renderCRM();
  renderQtCompare();
  showToast('✅ '+cl.name+'님 CRM 금액이 '+manwon+'만원으로 반영됐어요!');
}

function qtSetFmt(fmt){
  quoteFmt=fmt;
  document.querySelectorAll('.qt-out-tab').forEach(function(b){b.classList.toggle('on',b.dataset.fmt===fmt);});
  renderQuoteOutput();
}

function applyPkgQuote(pkg){
  if(quoteItems.length&&!confirm('현재 견적을 초기화하고 패키지를 적용할까요?'))return;
  quoteItems=[];quoteNid=1;
  var pkgs={
    lite:[
      {svcId:'sns',tierId:'basic',opts:[]},
      {svcId:'content',tierId:'basic',opts:[]}
    ],
    standard:[
      {svcId:'sns',tierId:'standard',opts:['report']},
      {svcId:'ad',tierId:'basic',opts:['weekly']},
      {svcId:'content',tierId:'standard',opts:[]}
    ],
    premium:[
      {svcId:'sns',tierId:'premium',opts:['reels']},
      {svcId:'ad',tierId:'premium',opts:['ab','weekly']},
      {svcId:'brand',tierId:'standard',opts:['print']},
      {svcId:'content',tierId:'premium',opts:[]}
    ]
  };
  var items=pkgs[pkg];if(!items)return;
  items.forEach(function(cfg){
    quoteItems.push({id:quoteNid++,svcId:cfg.svcId,tierId:cfg.tierId,opts:cfg.opts});
  });
  var labels={lite:'라이트',standard:'스탠다드',premium:'프리미엄'};
  showToast('&#127881; '+labels[pkg]+' 패키지 적용됐어요!');
  renderQuote();
}

function resetQuote(){
  if(quoteItems.length&&!confirm('견적을 초기화할까요?'))return;
  quoteItems=[];quoteNid=1;quoteClientId='';quoteFmt='kakao';
  var mo=document.getElementById('qt-memo');if(mo)mo.value='';
  renderQuote();
}

function copyQuote(){
  var box=document.getElementById('qt-out-box');
  if(!box||!box.textContent.trim()||box.textContent.includes('추가하면')){showToast('먼저 서비스를 추가해주세요');return;}
  var text=box.textContent;
  if(navigator.clipboard){navigator.clipboard.writeText(text).then(function(){showToast('✅ 클립보드에 복사됐어요!');});}
  else{var ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);showToast('✅ 복사 완료!');}
}

function renderQuoteOutput(){
  var box=document.getElementById('qt-out-box');if(!box)return;
  if(!quoteItems.length){box.textContent='서비스를 추가하면 여기에 텍스트가 생성돼요.';return;}
  var memo=(document.getElementById('qt-memo')||{}).value||'';
  var clientName='';
  if(quoteClientId){var cl=clients.find(function(c){return c.id===parseInt(quoteClientId);});if(cl)clientName=cl.name;}
  var total=qtGetTotal();
  var lines=[];
  if(quoteFmt==='kakao'){
    lines.push('안녕하세요'+(clientName?' '+clientName+' 대표님!':'!')+' 변덕쟁이들 형준입니다 😊');
    lines.push('말씀 나눈 내용 바탕으로 견적 정리해드렸어요.\n');
    lines.push('📋 서비스 구성');
    quoteItems.forEach(function(item){
      var svc=QUOTE_SVCS.find(function(s){return s.id===item.svcId;});if(!svc)return;
      var tier=svc.tiers.find(function(t){return t.id===item.tierId;});
      var base=tier?tier.price:0;
      var optT=item.opts.reduce(function(s,o){var opt=svc.options.find(function(x){return x.id===o;});return s+(opt?opt.price:0);},0);
      lines.push('• '+svc.name+' '+(tier?tier.label:'')+' ——— '+qtW(base+(optT?0:0))+ (optT?' (+옵션 '+qtW(optT)+')':''));
      if(tier)lines.push('  ㄴ '+tier.desc);
      item.opts.forEach(function(oid){var o=svc.options.find(function(x){return x.id===oid;});if(o)lines.push('  ㄴ [+] '+o.label+': '+qtW(o.price));});
    });
    lines.push('');
    lines.push('💰 합계: '+qtW(total)+' (VAT 별도)');
    lines.push('    VAT 포함: '+qtW(Math.round(total*1.1)));
    lines.push('\n📌 계약 조건: 착수금 50% → 납품 후 잔금 50%');
    if(memo)lines.push('📝 '+memo);
    lines.push('\n궁금한 점 편하게 말씀해 주세요!');
  } else {
    var today=new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric'});
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    lines.push('　　　견  적  서');
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    lines.push('발행: 변덕쟁이들 | 조형준');
    lines.push('날짜: '+today);
    if(clientName)lines.push('수신: '+clientName+' 귀중');
    lines.push('');
    quoteItems.forEach(function(item){
      var svc=QUOTE_SVCS.find(function(s){return s.id===item.svcId;});if(!svc)return;
      var tier=svc.tiers.find(function(t){return t.id===item.tierId;});
      var base=tier?tier.price:0;
      lines.push('['+svc.name+' - '+(tier?tier.label:'')+']');
      lines.push('  내용: '+(tier?tier.desc:''));
      lines.push('  금액: '+qtW(base));
      item.opts.forEach(function(oid){var o=svc.options.find(function(x){return x.id===oid;});if(o)lines.push('  + '+o.label+': '+qtW(o.price));});
      lines.push('');
    });
    lines.push('──────────────────────');
    lines.push('소계    : '+qtW(total));
    lines.push('VAT 10% : '+qtW(Math.round(total*0.1)));
    lines.push('합계    : '+qtW(Math.round(total*1.1)));
    lines.push('──────────────────────');
    lines.push('착수금 (50%): '+qtW(Math.round(total*0.5)));
    lines.push('잔  금 (50%): '+qtW(Math.round(total*0.5)));
    lines.push('유효기간: 발행일로부터 14일');
    if(memo)lines.push('\n비고: '+memo);
  }
  box.textContent=lines.join('\n');
}

function renderQuote(){
  var grid=document.getElementById('qt-svc-grid');
  if(grid){
    grid.innerHTML=QUOTE_SVCS.map(function(svc){
      var sel=!!quoteItems.find(function(i){return i.svcId===svc.id;});
      return'<div class="qt-svc-card'+(sel?' selected':'')+ '" data-id="'+svc.id+'" onclick="addQuoteSvc(this.dataset.id)">'+
        '<div class="qt-svc-nm"><i class="ti '+svc.icon+'" style="font-size:12px;color:'+svc.color+';margin-right:4px"></i>'+svc.name+'</div>'+
        '<div class="qt-svc-sub">'+svc.unit+' 단위</div>'+
        '<div class="qt-svc-price">'+qtW(svc.tiers[1].price)+'~</div>'+
        (sel?'<div style="font-size:10px;color:var(--teal);margin-top:3px;font-weight:600">✓ 추가됨</div>':'')+
      '</div>';
    }).join('');
  }
  var items=document.getElementById('qt-items');
  if(items){
    if(!quoteItems.length){
      items.innerHTML='<div class="qt-empty-msg">위에서 서비스를 클릭해 추가하세요</div>';
    } else {
      items.innerHTML=quoteItems.map(function(item){
        var svc=QUOTE_SVCS.find(function(s){return s.id===item.svcId;});if(!svc)return'';
        var tier=svc.tiers.find(function(t){return t.id===item.tierId;});
        return'<div class="qt-item">'+
          '<div class="qt-item-hd">'+
            '<span class="qt-item-nm" style="color:'+svc.color+'">'+svc.name+'</span>'+
            '<button class="qt-item-del" data-id="'+item.id+'" onclick="removeQuoteSvc(this.dataset.id)">✕ 제거</button>'+
          '</div>'+
          '<div class="qt-tier-row">'+
          svc.tiers.map(function(t){
            return'<button class="qt-tier-btn'+(item.tierId===t.id?' on':'')+'" data-id="'+item.id+'" data-tid="'+t.id+'" onclick="setQuoteTier(this.dataset.id,this.dataset.tid)">'+t.label+' '+qtW(t.price)+'</button>';
          }).join('')+'</div>'+
          (tier?'<div class="qt-tier-desc">'+tier.desc+'</div>':'')+
          (svc.options.length?
            '<div style="font-size:10px;color:var(--text2);margin-bottom:4px">추가 옵션</div>'+
            '<div class="qt-opt-row">'+
            svc.options.map(function(o){
              return'<button class="qt-opt-btn'+(item.opts.includes(o.id)?' on':'')+'" data-id="'+item.id+'" data-oid="'+o.id+'" onclick="toggleQuoteOpt(this.dataset.id,this.dataset.oid)">'+o.label+' +'+qtW(o.price)+'</button>';
            }).join('')+'</div>':'')+
        '</div>';
      }).join('');
    }
  }
  var totalList=document.getElementById('qt-total-list');
  if(totalList){
    totalList.innerHTML=quoteItems.map(function(item){
      var svc=QUOTE_SVCS.find(function(s){return s.id===item.svcId;});if(!svc)return'';
      var tier=svc.tiers.find(function(t){return t.id===item.tierId;});
      var base=tier?tier.price:0;
      var optT=item.opts.reduce(function(s,oid){var o=svc.options.find(function(x){return x.id===oid;});return s+(o?o.price:0);},0);
      return'<div class="qt-total-row">'+
        '<span class="qt-total-lbl">'+svc.name+'<span style="font-size:10px;margin-left:4px;color:var(--text3)">'+(tier?tier.label:'')+(optT?'+옵션':'')+'</span></span>'+
        '<span class="qt-total-val">'+qtW(base+optT)+'</span></div>';
    }).join('');
  }
  var total=qtGetTotal();
  var sumEl=document.getElementById('qt-sum');if(sumEl)sumEl.textContent=qtW(total);
  var vatEl=document.getElementById('qt-vat');if(vatEl)vatEl.textContent=qtW(Math.round(total*1.1));
  var sel=document.getElementById('qt-client-sel');
  if(sel){
    sel.innerHTML='<option value="">클라이언트 연결 (선택)</option>'+
      clients.filter(function(c){return['won','negotiation','proposal','discovery'].includes(c.stage);})
      .map(function(c){return'<option value="'+c.id+'"'+(String(c.id)===String(quoteClientId)?' selected':'')+'>'+c.name+'</option>';}).join('');
  }
  renderQtCompare();
  renderQuoteOutput();
}
