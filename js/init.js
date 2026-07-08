/* ─── INIT ─── */
initTheme();loadSaved();loadBills();loadIdeas();loadMemos();
// v30 설정 초기 적용
(function(){var s2=loadSettings();if(s2.rvTarget)rvTarget=s2.rvTarget;})();
saveSnapshot();
checkRecurBills();

// pre-init partner calc selects
setTimeout(function(){initPartnerCalc();},200);renderHome();renderCRM();loadSheetsConfig();
renderQuote();renderPartners();
