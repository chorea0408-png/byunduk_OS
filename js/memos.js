let memos=[],memoNid=1,curMemoId=null,memoTimer=null;

const MEMO_TAGS=[{id:'work',label:'업무',color:'#185FA5'},{id:'idea',label:'아이디어',color:'#1D9E75'},{id:'ref',label:'레퍼런스',color:'#854F0B'},{id:'daily',label:'일상',color:'#534AB7'},{id:'etc',label:'기타',color:'#5F5E5A'}];

function loadMemos(){try{var s=localStorage.getItem('vd_memos');if(s){memos=JSON.parse(s);memoNid=Math.max(...memos.map(function(m){return m.id;}),0)+1;}}catch(e){}}

function saveMemos(){try{localStorage.setItem('vd_memos',JSON.stringify(memos));}catch(e){}}

function renderMemoList(){
  var el=document.getElementById('memo-list');if(!el)return;
  if(!memos.length){el.innerHTML='<div class="memo-empty">첫 메모를 작성해보세요</div>';return;}
  var sorted=[...memos].sort(function(a,b){return b.updatedAt-a.updatedAt;});
  el.innerHTML=sorted.map(function(m){
    var tag=MEMO_TAGS.find(function(t){return t.id===m.tag;})||MEMO_TAGS[4];
    var dt=new Date(m.updatedAt).toLocaleDateString('ko-KR',{month:'numeric',day:'numeric'});
    return'<div class="memo-item'+(m.id===curMemoId?' active':'')+'" data-id="'+m.id+'" onclick="openMemo(this.dataset.id)">'+'<div class="memo-item-ttl">'+(m.title||'제목 없음')+'</div>'+'<div class="memo-item-date"><span style="color:'+tag.color+';font-size:9px">●</span> '+tag.label+' · '+dt+'</div>'+'</div>';
  }).join('');
}

function renderMemoTags(activeTag){
  var el=document.getElementById('memo-tag-row');if(!el)return;
  el.innerHTML=MEMO_TAGS.map(function(t){
    return'<button class="memo-tag'+(activeTag===t.id?' on':'')+'" data-tid="'+t.id+'" onclick="setMemoTag(this.dataset.tid)" style="'+(activeTag===t.id?'background:'+t.color+';border-color:'+t.color:'')+'" >'+t.label+'</button>';
  }).join('');
}

function openMemo(idStr){
  curMemoId=parseInt(idStr);
  var m=memos.find(function(x){return x.id===curMemoId;});if(!m)return;
  document.getElementById('memo-empty').style.display='none';
  document.getElementById('memo-edit-area').style.display='block';
  document.getElementById('memo-title').value=m.title||'';
  document.getElementById('memo-body').value=m.body||'';
  renderMemoTags(m.tag||'etc');
  renderMemoList();
}

function newMemo(){
  var m={id:memoNid++,title:'',body:'',tag:'etc',createdAt:Date.now(),updatedAt:Date.now()};
  memos.unshift(m);saveMemos();
  curMemoId=m.id;
  renderMemoList();
  document.getElementById('memo-empty').style.display='none';
  document.getElementById('memo-edit-area').style.display='block';
  document.getElementById('memo-title').value='';
  document.getElementById('memo-body').value='';
  renderMemoTags('etc');
  document.getElementById('memo-title').focus();
}

function setMemoTag(tid){
  var m=memos.find(function(x){return x.id===curMemoId;});if(!m)return;
  m.tag=tid;m.updatedAt=Date.now();saveMemos();renderMemoTags(tid);renderMemoList();
}

function saveMemoDebounce(){
  clearTimeout(memoTimer);
  memoTimer=setTimeout(function(){
    var m=memos.find(function(x){return x.id===curMemoId;});if(!m)return;
    m.title=(document.getElementById('memo-title')||{}).value||'';
    m.body=(document.getElementById('memo-body')||{}).value||'';
    m.updatedAt=Date.now();saveMemos();renderMemoList();
    var s=document.getElementById('memo-saved');
    if(s){s.textContent='저장됨 ✓';setTimeout(function(){if(s)s.textContent='';},1500);}
  },600);
}

function deleteMemo(){
  if(!curMemoId||!confirm('이 메모를 삭제할까요?'))return;
  memos=memos.filter(function(x){return x.id!==curMemoId;});saveMemos();
  curMemoId=null;
  document.getElementById('memo-empty').style.display='block';
  document.getElementById('memo-edit-area').style.display='none';
  renderMemoList();
}
