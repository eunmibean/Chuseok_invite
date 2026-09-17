// ============================================================
// 산적 꼬치 만들기 미니게임
// - 화면 하단의 꼬치를 좌우로 움직여 위에서 떨어지는 재료를 받는다.
// - 좌상단 목표 꼬치 순서대로 재료를 받아야 한다.
// - 잘못된 재료를 받거나, 필요한 재료를 놓치면 하트(목숨)가 줄어든다.
// - 하트가 0이 되면 현재 스테이지부터 다시 시작한다.
// ============================================================

const Game = (() => {
  let canvas, ctx;
  let dpr = 1;
  let width = 0, height = 0;

  let skewerX = 0;
  let skewerTargetX = 0;
  const skewerWidth = 8;
  const skewerHeight = 152;
  let skewerY = 0;

  let items = []; // falling ingredients
  let sequence = []; // target order for current stage
  let progress = 0; // how many correct caught in order
  let hearts = CONFIG.game.startHearts;
  let stageIndex = 0;
  let running = false;
  let paused = false;
  let rafId = null;
  let lastSpawn = 0;
  let spawnInterval = 1100;
  let fallSpeed = 230; // px per second
  let caughtIcons = []; // visual: ingredient pieces stuck on skewer

  const ingredientColors = [
    "#d93b2c",
    "#f18d2e",
    "#f4d33a",
    "#39b765",
    "#2c78d8",
    "#111111",
    "#f5f5f5",
  ];

  const ingredientImages = {
    red: new Image(),
    orange: new Image(),
    yellow: new Image(),
    green: new Image(),
    dark_green: new Image(),
  };

  const ingredientImageList = [
    "asset/red.PNG",
    "asset/orange.PNG",
    "asset/yellow.PNG",
    "asset/green.PNG",
    "asset/dark_green.PNG",
  ];

  let onAllStagesComplete = null;

  function preloadIngredientImages() {
    Object.entries(ingredientImages).forEach(([key, img], index) => {
      img.src = ingredientImageList[index] || ingredientImageList[0];
      img.alt = key;
    });
  }

  function randomIngredientColor() {
    return ingredientColors[Math.floor(Math.random() * ingredientColors.length)];
  }

  function randomIngredientImage(id) {
    if (id && ingredientImages[id]) return ingredientImages[id];
    const keys = Object.keys(ingredientImages);
    const key = keys[Math.floor(Math.random() * keys.length)];
    return ingredientImages[key];
  }

  function drawIngredientPiece(x, y, width, height, color) {
    const shadow = color === "#f5f5f5" ? "#d9d9d9" : "rgba(0, 0, 0, 0.18)";
    const top = color === "#f5f5f5" ? "#ffffff" : "rgba(255, 255, 255, 0.28)";

    ctx.fillStyle = shadow;
    ctx.fillRect(x + 3, y + 4, width, height);

    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);

    ctx.fillStyle = top;
    ctx.fillRect(x + 2, y + 2, width - 5, Math.max(8, height * 0.22));

    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
  }

  function drawImageIngredient(img, x, y, width, height, rotation = -Math.PI / 2) {
    if (!img || !img.complete || img.naturalWidth <= 0) return false;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.drawImage(img, -width / 2, -height / 2, width, height);
    ctx.restore();
    return true;
  }

  function drawFallingIngredient(it) {
    const img = it.image || randomIngredientImage();
    if (drawImageIngredient(img, it.x, it.y, it.width, it.height, -Math.PI / 2)) {
      return;
    }

    drawIngredientPiece(
      it.x - it.width / 2,
      it.y - it.height / 2,
      it.width,
      it.height,
      it.color || randomIngredientColor()
    );
  }

  const heartsEl = () => document.getElementById("hearts");
  const targetBoxEl = () => document.getElementById("target-box");
  const stageNumEl = () => document.getElementById("stage-num");
  const overlayEl = () => document.getElementById("game-overlay");
  const overlayTextEl = () => document.getElementById("overlay-text");
  const overlayBtnEl = () => document.getElementById("overlay-btn");

  function ingredientsList() {
    return CONFIG.game.ingredients;
  }

  function randomIngredient(excludeId) {
    const list = ingredientsList();
    const pool = excludeId
      ? list.filter((item) => item.id !== excludeId)
      : list;

    if (!pool.length) return list[0] || { id: "red", color: "#d93b2c" };
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function buildSequence(need) {
    const list = ingredientsList();
    const seq = [];
    let prev = null;
    for (let i = 0; i < need; i++) {
      let choice;
      do {
        choice = list[Math.floor(Math.random() * list.length)];
      } while (choice.id === prev && list.length > 1);
      seq.push(choice);
      prev = choice.id;
    }
    return seq;
  }

  function resize() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    skewerY = height - 36;
    if (skewerX === 0) skewerX = width / 2;
  }

  function renderTargetBox() {
    const box = targetBoxEl();
    box.innerHTML = "";
    box.style.display = "flex";
    box.style.alignItems = "center";
    box.style.justifyContent = "center";
    box.style.width = "84px";
    box.style.height = "84px";
    box.style.padding = "4px";
    box.style.boxSizing = "border-box";
    box.style.background = "#ffffff";
    box.style.borderRadius = "6px";
    box.style.boxShadow = "inset 0 0 0 1px rgba(0,0,0,0.15)";

    const levelImage = new Image();
    levelImage.src = `asset/level/level${stageIndex + 1}.png`;
    levelImage.alt = `level ${stageIndex + 1}`;
    levelImage.style.width = "100%";
    levelImage.style.height = "100%";
    levelImage.style.objectFit = "contain";
    levelImage.style.display = "block";
    levelImage.style.borderRadius = "6px";
    levelImage.style.userSelect = "none";
    // force rotation across browsers (mobile UA may handle image orientation differently)
    levelImage.style.transform = "rotate(-90deg)";
    levelImage.style.webkitTransform = "rotate(-90deg)";
    levelImage.style.msTransform = "rotate(-90deg)";
    levelImage.style.transformOrigin = "center center";
    levelImage.style.willChange = "transform";
    // prevent UA from auto-rotating based on EXIF on some mobile browsers
    try {
      levelImage.style.imageOrientation = "none";
    } catch (e) {
      /* ignore */
    }

    box.appendChild(levelImage);
  }

  function renderHearts() {
    const el = heartsEl();
    el.innerHTML = "";
    for (let i = 0; i < CONFIG.game.startHearts; i++) {
      const span = document.createElement("span");
      span.textContent = "❤️";
      if (i >= hearts) span.classList.add("heart-lost");
      el.appendChild(span);
    }
  }

  function showOverlay(text, btnLabel, onClick) {
    paused = true;
    overlayTextEl().textContent = text;
    overlayBtnEl().textContent = btnLabel;
    overlayEl().classList.remove("hidden");
    overlayBtnEl().onclick = () => {
      overlayEl().classList.add("hidden");
      paused = false;
      onClick && onClick();
    };
  }

  function startStage(index) {
    stageIndex = index;
    const stageCfg = CONFIG.game.stages[stageIndex];
    sequence = (stageCfg.sequence || []).map((id) => {
      const found = ingredientsList().find((ing) => ing.id === id);
      return found || { id, color: randomIngredientColor() };
    });

    if (sequence.length === 0) {
      sequence = buildSequence(stageCfg.need);
    }

    progress = 0;
    items = [];
    caughtIcons = [];
    spawnInterval = Math.max(760, 1200 - stageIndex * 180);
    fallSpeed = fallSpeed + stageIndex * 22;
    lastSpawn = performance.now();
    stageNumEl().textContent = String(stageIndex + 1);
    renderTargetBox();
    renderHearts();
  }

  function loseHeart() {
    hearts -= 1;
    renderHearts();
    if (hearts <= 0) {
      showOverlay(
        "하트를 모두 잃었어요 😢\n" + "\n스테이지 " + (stageIndex + 1) + "부터 다시 도전해요!",
        "다시 도전하기",
        () => {
          hearts = CONFIG.game.startHearts;
          startStage(stageIndex);
        }
      );
    }
  }

  function spawnItem() {
    const needed = sequence[progress];
    // 다음에 필요한 재료가 나오도록 확률을 높여 주고,
    // 화면상의 이미지도 같은 ingredient id로 고정한다.
    const ing = Math.random() < 0.55 ? needed : randomIngredient(needed && needed.id);
    const margin = 42;
    const minGap = 74;
    let x = margin + Math.random() * (width - margin * 2);

    const existingNearby = items.filter((item) => !item.caught && Math.abs(item.y - -20) < 130);
    for (let i = 0; i < existingNearby.length; i++) {
      const item = existingNearby[i];
      if (Math.abs(item.x - x) < minGap) {
        x = Math.max(margin, Math.min(width - margin, x + (item.x < x ? -minGap : minGap)));
      }
    }

    const image = ing && ingredientImages[ing.id] ? ingredientImages[ing.id] : randomIngredientImage();

    items.push({
      ing,
      x,
      y: -20,
      r: 50,
      width: 28,
      height: 118,
      color: ing.color || randomIngredientColor(),
      image,
      caught: false,
    });
  }

  function update(dt, now) {
    if (paused) return;

    if (now - lastSpawn > spawnInterval) {
      spawnItem();
      lastSpawn = now;
    }

    // 꼬치 위치를 부드럽게 목표 지점으로 이동
    skewerX += (skewerTargetX - skewerX) * Math.min(1, dt * 10);
    skewerX = Math.max(skewerWidth / 2, Math.min(width - skewerWidth / 2, skewerX));

    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      if (it.caught) continue;
      it.y += fallSpeed * dt;

      const itemLeft = it.x - it.width / 2;
      const itemRight = it.x + it.width / 2;
      const itemTop = it.y - it.height / 2;
      const itemBottom = it.y + it.height / 2;
      const skewerLeft = skewerX - skewerWidth / 2;
      const skewerRight = skewerX + skewerWidth / 2;
      const skewerTop = skewerY - skewerHeight / 2;
      const skewerBottom = skewerY + skewerHeight / 2;

      // circle (it.x, it.y, it.r) vs rectangle (skewer) collision
      const closestX = Math.max(skewerLeft, Math.min(it.x, skewerRight));
      const closestY = Math.max(skewerTop, Math.min(it.y, skewerBottom));
      const dx = it.x - closestX;
      const dy = it.y - closestY;
      const radius = it.r || Math.max(it.width, it.height) / 2;
      
      const overlaps = dx * dx + dy * dy <= radius * radius;
      if(overlaps) {
        console.log("overlaps: ", overlaps);
        console.log("dx, dy, radius: ", dx, dy, radius);
      }
      

      // const overlaps = itemRight >= skewerLeft && itemLeft <= skewerRight && itemBottom >= skewerTop && itemTop <= skewerBottom;

      if (overlaps) {
        it.caught = true;
        const needed = sequence[progress];
        if (needed && it.ing.id === needed.id) {
          progress += 1;
          caughtIcons.push({
            id: it.ing.id,
            emoji: it.ing.emoji,
            color: it.color,
            image: it.image,
            width: it.width,
            height: it.height,
          });
          renderTargetBox();
          if (progress >= sequence.length) {
            items.splice(i, 1);
            handleStageClear();
            return;
          }
        } else {
          loseHeart();
        }
        items.splice(i, 1);
        continue;
      }

      if (it.y - it.r > height) {
        // Item fell off-screen — do NOT penalize the player here.
        // Only catching a wrong ingredient should reduce hearts.
        items.splice(i, 1);
        continue;
      }
    }
  }

  function handleStageClear() {
    if (stageIndex + 1 < CONFIG.game.stages.length) {
      showOverlay(
        (stageIndex + 1) + "단계 클리어! 🎉",
        "다음 단계로",
        () => startStage(stageIndex + 1)
      );
    } else {
      showOverlay("산적 꼬치 완성! 🎉🍢", "선물상자 열기", () => {
        running = false;
        onAllStagesComplete && onAllStagesComplete();
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // falling ingredients
    items.forEach((it) => {
      drawFallingIngredient(it);
    });

    // skewer stick
    const stickX = skewerX - skewerWidth / 1.5;
    const stickY = skewerY - skewerHeight / 1.5;
    const tipWidth = 8;

    ctx.beginPath();
    ctx.moveTo(stickX + skewerWidth / 2, stickY);
    ctx.lineTo(stickX + skewerWidth, stickY + skewerHeight * 0.2);
    ctx.lineTo(stickX + skewerWidth / 2 + tipWidth, stickY + skewerHeight * 0.45);
    ctx.lineTo(stickX + skewerWidth / 2 + tipWidth * 0.7, stickY + skewerHeight);
    ctx.lineTo(stickX + skewerWidth / 2 - tipWidth * 0.7, stickY + skewerHeight);
    ctx.lineTo(stickX + skewerWidth / 2 - tipWidth, stickY + skewerHeight * 0.45);
    ctx.lineTo(stickX, stickY + skewerHeight * 0.2);
    ctx.closePath();

    ctx.fillStyle = "#d9a56f";
    ctx.fill();
    ctx.strokeStyle = "#8a5d36";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(stickX + skewerWidth * 0.35, stickY + 14);
    ctx.lineTo(stickX + skewerWidth * 0.65, stickY + 14);
    ctx.moveTo(stickX + skewerWidth * 0.35, stickY + skewerHeight * 0.5);
    ctx.lineTo(stickX + skewerWidth * 0.65, stickY + skewerHeight * 0.5);
    ctx.moveTo(stickX + skewerWidth * 0.35, stickY + skewerHeight - 14);
    ctx.lineTo(stickX + skewerWidth * 0.65, stickY + skewerHeight - 14);
    ctx.strokeStyle = "rgba(117, 78, 40, 0.45)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // caught ingredients rendered along the stick (last N)
    const show = caughtIcons.slice(-5).reverse();
    const step = skewerHeight / (show.length + 1);
    show.forEach((piece, i) => {
      const pieceY = stickY + step * (i + 1) - 6;
      const itemWidth = piece.width || 58;
      const itemHeight = piece.height || 18;
      if (drawImageIngredient(piece.image || randomIngredientImage(), skewerX, pieceY, itemWidth, itemHeight, -Math.PI / 2)) {
        return;
      }
      drawIngredientPiece(skewerX - itemWidth / 2, pieceY - itemHeight / 2, itemWidth, itemHeight, piece.color || randomIngredientColor());
    });
  }

  let lastTime = 0;
  function loop(now) {
    if (!running) return;
    if (!lastTime) lastTime = now;
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    update(dt, now);
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function pointerX(evt) {
    const rect = canvas.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    return clientX - rect.left;
  }

  function onPointerMove(evt) {
    if (!running) return;
    skewerTargetX = pointerX(evt);
    evt.preventDefault();
  }

  function onKeyDown(evt) {
    if (!running) return;
    const step = 36;
    if (evt.key === "ArrowLeft") skewerTargetX = Math.max(0, skewerTargetX - step);
    if (evt.key === "ArrowRight") skewerTargetX = Math.min(width, skewerTargetX + step);
  }

  function bindInput() {
    canvas.addEventListener("mousemove", onPointerMove);
    canvas.addEventListener("touchmove", onPointerMove, { passive: false });
    canvas.addEventListener("touchstart", onPointerMove, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", resize);
  }

  return {
    init(canvasEl, opts) {
      canvas = canvasEl;
      ctx = canvas.getContext("2d");
      onAllStagesComplete = opts && opts.onAllStagesComplete;
      preloadIngredientImages();
      resize();
      bindInput();
    },
    start() {
      hearts = CONFIG.game.startHearts;
      skewerTargetX = width / 2;
      skewerX = width / 2;
      running = true;
      lastTime = 0;
      startStage(0);
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
    resize,
  };
})();
