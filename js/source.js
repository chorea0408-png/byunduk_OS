function getSrcStats(){
  const result=[];
  SOURCES.forEach(function(s){
    const grp=clients.filter(function(cl){return cl.source===s.id;});
    if(!grp.length)return;
    const won=grp.filter(function(cl){return cl.stage==='won';});
    const active=grp.filter(function(cl){return cl.stage!=='lost';});
    const rate=grp.length?Math.round(won.length/grp.length*100):0;
    const avgAmt=won.length?Math.round(won.reduce(function(a,cl){return a+(Number(cl.amount)||0);},0)/won.length):0;
    const pipe=grp.reduce(function(a,cl){
      const sg=STAGES.find(function(x){return x.id===cl.stage;});
      return a+(sg?cl.amount*sg.prob:0);
    },0);
    var avgLTV2=won.length?Math.round(won.reduce(function(a,cl){return a+getClientLTV(cl);},0)/won.length):0;
    result.push({...s,total:grp.length,won:won.length,active:active.length,rate,avgAmt,pipe:Math.round(pipe),avgLTV:avgLTV2});
  });
  return result.sort(function(a,b){return b.rate-a.rate;});
}

function renderSource(){
  const stats=getSrcStats();
  const noSrc=clients.filter(function(cl){return !cl.source;});
  const analyzed=clients.length-noSrc.length;
  const best=stats[0];
  const avgRate=stats.length?Math.round(stats.reduce(function(a,s){return a+s.rate;},0)/stats.length):0;
  document.getElementById('src-k1').textContent=analyzed;
  document.getElementById('src-k2').textContent=best?best.label:'–';
  document.getElementById('src-k2s').textContent=best?'전환율 '+best.rate+'%':'데이터 없음';
  document.getElementById('src-k3').textContent=avgRate?avgRate+'%':'–';
  document.getElementById('src-k4').textContent=noSrc.length;

  if(!stats.length){
    document.getElementById('src-cards').innerHTML='<div class="src-empty">아직 유입경로가 입력된 클라이언트가 없어요.<br>CRM에서 새 클라이언트 추가 시 경로를 선택해 주세요.</div>';
    return;
  }

  const dark=isDark();
  const gridC=dark?'rgba(255,255,255,.07)':'rgba(0,0,0,.05)';
  const textC=dark?'#888780':'#73726c';
  const maxRate=Math.max(...stats.map(function(s){return s.rate;}),1);

  const cdata={
    labels:stats.map(function(s){return s.label;}),
    datasets:[{
      label:'전환율',
      data:stats.map(function(s){return s.rate;}),
      backgroundColor:stats.map(function(s){return s.color+'cc';}),
      borderColor:stats.map(function(s){return s.color;}),
      borderWidth:1,borderRadius:4,barThickness:22
    }]
  };
  const copts={
    indexAxis:'y',responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return '전환율 '+ctx.parsed.x+'% (Won '+stats[ctx.dataIndex].won+'/'+stats[ctx.dataIndex].total+'건)';} }}},
    scales:{
      x:{grid:{color:gridC},ticks:{color:textC,font:{size:11},callback:function(v){return v+'%';}},beginAtZero:true,max:100},
      y:{grid:{display:false},ticks:{color:textC,font:{size:11}}}
    },
    animation:{duration:300}
  };
  if(!srcChart){srcChart=new Chart(document.getElementById('src-canvas'),{type:'bar',data:cdata,options:copts});}
  else{srcChart.data=cdata;srcChart.update('none');}

  document.getElementById('src-cards').innerHTML=stats.map(function(s,rank){
    const eff=Math.round(s.rate/maxRate*100);
    return '<div class="src-card '+(rank===0?'best':'')+'">'+
      (rank===0?'<div class="src-best-bdg">최고 전환</div>':'')+
      '<div class="src-nm">'+s.label+'</div>'+
      '<div class="src-rate" style="color:'+s.color+'">'+s.rate+'<span style="font-size:14px;font-weight:400">%</span></div>'+
      '<div class="src-sub">전환율 · '+s.won+'/'+s.total+'건</div>'+
      '<div class="src-rows">'+
      '<div class="src-row"><span class="src-row-l">평균 계약금</span><span class="src-row-v">'+(s.avgAmt?s.avgAmt+'만':'–')+'</span></div>'+
      '<div class="src-row"><span class="src-row-l">가중 파이프</span><span class="src-row-v">'+s.pipe+'만</span></div>'+
      '<div class="src-row"><span class="src-row-l">진행 중</span><span class="src-row-v">'+s.active+'건</span></div>'+
      '<div class="src-row"><span class="src-row-l">평균 LTV</span><span class="src-row-v" style="color:var(--teal)">'+( s.avgLTV?s.avgLTV+'만':'–')+'</span></div>'+
      '</div>'+
      '<div class="src-rbar-bg"><div class="src-rbar-f" style="width:'+eff+'%;background:'+s.color+'"></div></div>'+
      '</div>';
  }).join('');
  var ltvStats=stats.filter(function(s){return s.avgLTV>0;}).sort(function(a,b){return b.avgLTV-a.avgLTV;});
  var ltvEl=document.getElementById('src-ltv-section');
  renderFunnelAndTagPerf();
  if(ltvEl){
    if(ltvStats.length){
      var maxLTV=Math.max.apply(null,ltvStats.map(function(s){return s.avgLTV;}));
      ltvEl.innerHTML='<div class="ltv-comp-ttl"><i class="ti ti-trending-up" style="font-size:12px"></i>채널별 평균 LTV 비교</div>'+
        ltvStats.map(function(s){
          var pct=maxLTV>0?Math.round(s.avgLTV/maxLTV*100):0;
          return'<div class="ltv-bar-row">'+'<span class="ltv-bar-lbl">'+s.label+'</span>'+'<div class="ltv-bar-bg"><div class="ltv-bar-f" style="width:'+pct+'%;background:'+s.color+'"></div></div>'+'<span class="ltv-bar-val" style="color:'+s.color+'">'+s.avgLTV+'만</span>'+'<span class="ltv-bar-cnt">('+s.won+'건)</span>'+'</div>';
        }).join('')+'<div style="font-size:10px;color:var(--text3);margin-top:6px">LTV = Won 클라이언트 계약 이력 누적 매출 평균</div>';
    }else{
      ltvEl.innerHTML='<div style="font-size:11px;color:var(--text3)">Won 클라이언트 계약 이력이 쌓이면 LTV 비교가 표시돼요.</div>';
    }
  }

  // ── 소개 네트워크 분석 ──
  var refEl=document.getElementById('ref-network-wrap');
  if(refEl){
    // referredBy가 있는 클라이언트 집계
    var refMap={};
    clients.forEach(function(cl){
      var rid=cl.referredBy||0;
      if(!rid)return;
      var referrer=clients.find(function(cx){return cx.id===rid;});
      if(!referrer)return;
      if(!refMap[rid])refMap[rid]={name:referrer.name,count:0,totalAmt:0,wonCount:0,ids:[]};
      refMap[rid].count++;
      refMap[rid].ids.push(cl.id);
      if(cl.stage==='won'){refMap[rid].wonCount++;refMap[rid].totalAmt+=(cl.amount||0);}
    });
    var refArr=Object.values(refMap).sort(function(a,b){return b.count-a.count;});
    if(refArr.length===0){
      refEl.innerHTML='<div style="font-size:11px;color:var(--text3)">클라이언트 상세 패널에서 소개자를 설정하면 여기에 기여도 분석이 표시돼요.</div>';
    }else{
      var maxCount=refArr[0].count||1;
      refEl.innerHTML=refArr.map(function(r){
        var barW=Math.round(r.count/maxCount*100);
        var convRate=r.count>0?Math.round(r.wonCount/r.count*100):0;
        return'<div style="margin-bottom:10px">'+
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">'+
            '<span style="font-size:12px;font-weight:600">'+r.name+'</span>'+
            '<span style="font-size:10px;color:var(--text3)">소개 '+r.count+'건 · Won '+r.wonCount+'건 · 전환율 '+convRate+'%'+(r.totalAmt?' · '+r.totalAmt+'만원':'')+'</span>'+
          '</div>'+
          '<div style="height:6px;background:var(--bg2);border-radius:3px">'+
            '<div style="height:100%;width:'+barW+'%;background:var(--acc);border-radius:3px;transition:width .3s"></div>'+
          '</div>'+
        '</div>';
      }).join('');
    }
  }

}

function renderFunnelAndTagPerf(){renderFunnel22();renderTagPerf22();}

function renderFunnel22(){
  var el=document.getElementById('crm-funnel');if(!el)return;
  var stOrder=['lead','discovery','proposal','negotiation','won','lost'];
  var stLbl={lead:'Lead',discovery:'Discovery',proposal:'Proposal',negotiation:'협상',won:'Won',lost:'Lost'};
  var stCol={lead:'#5F5E5A',discovery:'#185FA5',proposal:'#854F0B',negotiation:'#993556',won:'#1D9E75',lost:'#E24B4A'};
  var cnt={};
  stOrder.forEach(function(s){cnt[s]=clients.filter(function(c){return c.stage===s;}).length;});
  var maxC=Math.max.apply(null,stOrder.map(function(s){return cnt[s];}));
  if(!maxC){el.innerHTML='<div style="font-size:11px;color:var(--text3)">클라이언트를 추가하면 퍼널이 생성돼요.</div>';return;}
  var h='';
  stOrder.forEach(function(s,i){
    var c=cnt[s];if(!c&&s!=='lead')return;
    var pct=maxC>0?Math.round(c/maxC*100):0;
    var prev=i>0?cnt[stOrder[i-1]]||1:1;
    var rate=i>0?Math.round(c/prev*100):100;
    h+='<div class="funnel-row">';
    h+='<span class="funnel-lbl">'+stLbl[s]+'</span>';
    h+='<div class="funnel-bar-bg"><div class="funnel-bar-fill" style="width:'+pct+'%;background:'+stCol[s]+'">';
    h+='<span class="funnel-bar-txt">'+c+'명</span></div></div>';
    h+='<span class="funnel-cnt">'+c+'</span>';
    h+='<span class="funnel-rate">'+(i>0?rate+'%':'100%')+'</span>';
    h+='</div>';
  });
  var wn=cnt.won||0,ls=cnt.lost||0,cl2=wn+ls;
  if(cl2>0){
    var topReason=(function(){
      var r={};
      clients.filter(function(c){return c.stage==='lost'&&c.lostReason;}).forEach(function(c){
        var k=c.lostReason.split(' — ')[0].trim();r[k]=(r[k]||0)+1;
      });
      return Object.keys(r).sort(function(a,b){return r[b]-r[a];}).slice(0,2).join(', ')||'없음';
    })();
    h+='<div style="font-size:11px;color:var(--text2);margin-top:8px;padding:6px 10px;background:var(--bg2);border-radius:var(--r)">';
    h+='최종 성야율 <strong style="color:var(--teal)">'+Math.round(wn/cl2*100)+'%</strong>';
    h+=' (Won '+wn+' / 전체 청야 '+cl2+')';
    if(ls)h+=' &nbsp; 이탈 주요: '+topReason;
    h+='</div>';
  }
  el.innerHTML=h;
}

function renderTagPerf22(){
  var el=document.getElementById('tag-perf');if(!el)return;
  var td={};
  clients.forEach(function(cl){
    (cl.tags||[]).forEach(function(tid){
      if(!td[tid])td[tid]={total:0,won:0,ltv:0,nps:[]};
      td[tid].total++;
      if(cl.stage==='won'){
        td[tid].won++;
        td[tid].ltv+=getClientLTV(cl)||cl.amount;
        if(cl.npsScore)td[tid].nps.push(cl.npsScore);
      }
    });
  });
  var keys=Object.keys(td);
  if(!keys.length){el.innerHTML='<div style="font-size:11px;color:var(--text3)">클라이언트에 태그를 추가하면 업종별 성과가 표시돼요.</div>';return;}
  var maxLTV=Math.max.apply(null,keys.map(function(k){return td[k].ltv;}));
  var maxR=Math.max.apply(null,keys.map(function(k){return td[k].total?Math.round(td[k].won/td[k].total*100):0;}));
  keys.sort(function(a,b){return(td[b].won/td[b].total)-(td[a].won/td[a].total);});
  el.innerHTML=keys.slice(0,8).map(function(tid){
    var d=td[tid];
    var pt=PRESET_TAGS.find(function(t){return t.id===tid;});
    var lbl=pt?pt.label:tid;var col=pt?pt.color:'#5F5E5A';
    var rate=d.total?Math.round(d.won/d.total*100):0;
    var avgLTV=d.won?Math.round(d.ltv/d.won):0;
    var rPct=maxR>0?Math.round(rate/maxR*100):0;
    var lPct=maxLTV>0?Math.round(d.ltv/maxLTV*100):0;
    var avgNPS=d.nps.length?Math.round(d.nps.reduce(function(s,n){return s+n;},0)/d.nps.length*10)/10:null;
    return'<div class="tag-perf-row">'+'<span class="tag-perf-lbl" style="color:'+col+'">'+lbl+'</span>'+'<div class="tag-perf-bars">'+'<div class="tag-perf-br"><span class="tag-perf-bl">성야율</span>'+'<div class="tag-perf-bg"><div class="tag-perf-bf" style="width:'+rPct+'%;background:'+col+'"></div></div>'+'<span class="tag-perf-bv" style="color:'+col+'">'+rate+'%</span></div>'+'<div class="tag-perf-br"><span class="tag-perf-bl">평균LTV</span>'+'<div class="tag-perf-bg"><div class="tag-perf-bf" style="width:'+lPct+'%;background:'+col+'80"></div></div>'+'<span class="tag-perf-bv">'+(avgLTV?avgLTV+'만':'-')+'</span></div>'+'</div>'+'<span class="tag-perf-cnt">'+d.total+'명'+(avgNPS?' &#9733;'+avgNPS:'')+'</span>'+'</div>';
  }).join('');
}
