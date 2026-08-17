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
