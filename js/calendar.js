// ============================================================
// 구글 캘린더 "일정 추가" 링크 생성 (OAuth 불필요, URL 템플릿 방식)
// ============================================================

function buildGoogleCalendarUrl() {
  const e = CONFIG.event;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: e.startUTC + "/" + e.endUTC,
    details: e.description,
    location: e.location,
  });
  return "https://calendar.google.com/calendar/render?" + params.toString();
}
