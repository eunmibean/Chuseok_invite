// ============================================================
// 화면 전환 및 초대장 흐름 제어
// ============================================================

(function () {
  const screens = {
    start: document.getElementById("screen-start"),
    game: document.getElementById("screen-game"),
    giftbox: document.getElementById("screen-giftbox"),
    invite: document.getElementById("screen-invite"),
  };

  function showScreen(name) {
    Object.values(screens).forEach((el) => el.classList.remove("active"));
    screens[name].classList.add("active");
  }

  // ---- 개인화 링크 처리 (?to=이름) ----
  const params = new URLSearchParams(window.location.search);
  const invitedName = params.get("to") ? decodeURIComponent(params.get("to")) : "";

  const TEST_SKIP_GAME = true;

  if (invitedName) {
    document.getElementById("greeting").innerHTML =
      invitedName + "님, 초대장을 확인하려면<br/>산적 꼬치를 완성해보세요!";
    document.getElementById("rsvp-name").value = invitedName;
  }

  // ---- 이벤트 정보 채우기 ----
  document.getElementById("detail-date").textContent = CONFIG.event.dateLabel;
  document.getElementById("detail-location").textContent = CONFIG.event.location;

  // ---- 게임 초기화 (최초 1회) ----
  let gameInitialized = false;
  document.getElementById("btn-start").addEventListener("click", () => {

    if (TEST_SKIP_GAME) {
      showScreen("giftbox");
    } else {
      showScreen("game");
    }
    if (!gameInitialized) {
      Game.init(document.getElementById("game-canvas"), {
        onAllStagesComplete: () => showScreen("giftbox"),
      });
      gameInitialized = true;
    }
    Game.resize();
    Game.start();
  });

  // ---- 선물상자 오픈 ----
  const giftbox = document.getElementById("giftbox");
  let giftboxOpened = false;
  giftbox.addEventListener("click", () => {
    if (giftboxOpened) return;
    giftbox.classList.add("shake");
    setTimeout(() => {
      giftbox.classList.remove("shake");
      giftbox.classList.add("opened");
      giftboxOpened = true;
      setTimeout(() => {
        document.getElementById("invite-to").textContent = invitedName
          ? invitedName + "님께"
          : "";
        showScreen("invite");
      }, 700);
    }, 500);
  });

  // ---- RSVP 폼 ----
  const form = document.getElementById("rsvp-form");
  const guestCountField = document.getElementById("guest-count-field");
  const errorText = document.getElementById("rsvp-error");

  form.querySelectorAll('input[name="attending"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      guestCountField.style.display = e.target.value === "yes" ? "flex" : "none";
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorText.classList.add("hidden");

    const name = document.getElementById("rsvp-name").value.trim();
    const attendingYes =
      form.querySelector('input[name="attending"]:checked').value === "yes";
    const count = attendingYes
      ? parseInt(document.getElementById("rsvp-count").value, 10) || 1
      : 0;

    const submitBtn = document.getElementById("rsvp-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "보내는 중...";

    try {
      await SupabaseRSVP.submit({
        guestName: name,
        attending: attendingYes,
        guestCount: count,
        invitedAs: invitedName,
      });

      form.classList.add("hidden");
      const doneText = document.getElementById("rsvp-done-text");
      doneText.textContent = attendingYes
        ? name + "님, 참석 의사가 전달됐어요! 그날 봐요 🎉"
        : name + "님, 답변 감사해요. 다음에 또 초대할게요!";
      document.getElementById("calendar-btn").href = buildGoogleCalendarUrl();
      document.getElementById("calendar-btn").style.display = attendingYes
        ? "inline-block"
        : "none";
      document.getElementById("rsvp-done").classList.remove("hidden");
    } catch (err) {
      console.error(err);
      errorText.textContent = "전송에 실패했어요. 잠시 후 다시 시도해주세요.";
      errorText.classList.remove("hidden");
      submitBtn.disabled = false;
      submitBtn.textContent = "참석 의사 보내기";
    }
  });
})();
