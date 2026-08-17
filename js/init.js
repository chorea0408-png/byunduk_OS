/* ─── PWA: 서비스워커 등록 (설치 가능성 확보용, 오프라인 캐싱 없음) ─── */
/* file:// 등 미지원 환경에서도 앱 로드를 막지 않도록 안전하게 무시 */
try{
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(function(){});
  }
}catch(e){}

/* ─── INIT ─── */
initTheme();loadSaved();loadBills();loadIdeas();loadMemos();
// v30 설정 초기 적용
(function(){var s2=loadSettings();if(s2.rvTarget)rvTarget=s2.rvTarget;})();
saveSnapshot();
checkRecurBills();
renderBackupStatus();

// pre-init partner calc selects
setTimeout(function(){initPartnerCalc();},200);renderHome();renderCRM();loadSheetsConfig();
renderQuote();renderPartners();

// 저장된 데이터가 전혀 없는 "첫 방문"에만 온보딩 화면 노출 (loadSaved()와 동일한 vd2_clients 기준 판정)
if(isFirstRun())showWelcome();
