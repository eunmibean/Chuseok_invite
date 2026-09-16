// ============================================================
// 설정 파일 — 이 파일만 고치면 초대장 내용이 전부 바뀝니다.
// ============================================================

const CONFIG = {
  // ---- Supabase ----
  // Supabase 프로젝트 > Settings > API 에서 값을 복사해 넣으세요.
  supabase: {
    // runtime-injected from Vercel env via /api/env
    url: null,
    anonKey: null,
    table: "chuseok",
  },

  // ---- 행사 정보 ----
  event: {
    title: "밴쿠버에서 추석 보내기",
    hostName: "은미&현동",
    dateLabel: "2026년 9월 26일 (토) 오후 1시",
    // Google Calendar 링크 계산용 (UTC 기준, YYYYMMDDTHHMMSSZ 포맷)
    // 아래 startUTC/endUTC 를 실제 일정에 맞게 바꿔주세요.
    startUTC: "20260926T200000Z", // 예: 밴쿠버 9/26 17:00 (UTC-7) -> UTC 9/27 00:00
    endUTC: "20260926T230000Z",   // 3시간짜리 행사 예시
    location: "950 Drake St, Vancouver, BC",
    description:
      "추석을 맞아 저희집에 초대합니다! 한가위 함께 보내요 🍚🥮",
  },

  // ---- 게임 설정 ----
  game: {
    startHearts: 3,
    stages: [
      {
        need: 4,
        sequence: ["red", "dark_green", "yellow", "orange"],
      },
      {
        need: 5,
        sequence: ["yellow", "orange", "red", "green", "orange"],
      },
      {
        need: 6,
        sequence: ["green", "orange", "yellow", "red", "dark_green", "orange"],
      },
    ],
    ingredients: [
      { id: "red", emoji: "🟥", label: "red", color: "#d93b2c" },
      { id: "orange", emoji: "🟧", label: "orange", color: "#f18d2e" },
      { id: "yellow", emoji: "🟨", label: "yellow", color: "#f4d33a" },
      { id: "green", emoji: "🟩", label: "green", color: "#39b765" },
      { id: "dark_green", emoji: "🟫", label: "dark_green", color: "#2c78d8" },
    ],
  },
};

// Fetch Supabase env from serverless endpoint at runtime (Vercel)
async function _loadSupabaseEnv() {
  try {
    const res = await fetch("/api/env");
    if (!res.ok) throw new Error("env fetch failed");
    const { url, anonKey } = await res.json();
    if (url) CONFIG.supabase.url = url;
    if (anonKey) CONFIG.supabase.anonKey = anonKey;
  } catch (e) {
    console.warn("Could not load Supabase env:", e);
  }
}

// Expose a promise so other modules can wait for env to be loaded
CONFIG.initPromise = _loadSupabaseEnv();
