const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

const menu = document.getElementById("menu");
const gameOverUI = document.getElementById("gameOverUI");

const shootSound = document.getElementById("shootSound");
const boomSound = document.getElementById("boomSound");

let player, bullets, enemies, boss;
let score, level, gameRunning;
let shootTimeout;

// SKIN
const skins = [
  { level: 1, emoji: "😡", fireRate: 400 },
  { level: 3, emoji: "😨", fireRate: 250 },
  { level: 6, emoji: "🥶", fireRate: 150 }
];

let currentSkin = skins[0];

// ENEMY
const enemyTypes = [
  { emoji: "👾", speed: 2, hp: 1 },
  { emoji: "👽", speed: 3, hp: 1 },
  { emoji: "🤖", speed: 1.5, hp: 3 }
];

// STAR
let stars = Array.from({ length: 50 }, () => ({
  x: Math.random() * 400,
  y: Math.random() * 600
}));

// 🔊 UNLOCK SOUND
function unlockSound() {
  shootSound.volume = 0.5;
  boomSound.volume = 0.5;

  shootSound.play().then(() => {
    shootSound.pause();
    shootSound.currentTime = 0;
  }).catch(() => {});

  boomSound.play().then(() => {
    boomSound.pause();
    boomSound.currentTime = 0;
  }).catch(() => {});
}

function playShoot() {
  try {
    shootSound.currentTime = 0;
    shootSound.play().catch(() => {});
  } catch {}
}

function playBoom() {
  try {
    boomSound.currentTime = 0;
    boomSound.play().catch(() => {});
  } catch {}
}

// START GAME
function startGame() {
  menu.style.display = "none";
  canvas.style.display = "block";
  gameOverUI.classList.add("hidden");

  unlockSound();

  player = { x: 200, y: 520, hp: 3 };
  bullets = [];
  enemies = [];
  boss = null;

  score = 0;
  level = 1;
  gameRunning = true;

  updateSkin();
  shootLoop();
  gameLoop();
}

// RESTART
function restartGame() {
  clearTimeout(shootTimeout);
  startGame();
}

// SKIN UPDATE
function updateSkin() {
  currentSkin = skins[0];
  skins.forEach(s => {
    if (level >= s.level) currentSkin = s;
  });
}

// SHOOT LOOP
function shootLoop() {
  if (!gameRunning) return;

  bullets.push({ x: player.x, y: player.y });
  playShoot();

  shootTimeout = setTimeout(shootLoop, currentSkin.fireRate);
}

// CONTROL HP/PC
canvas.addEventListener("mousemove", e => {
  let rect = canvas.getBoundingClientRect();
  player.x = Math.max(20, Math.min(380, e.clientX - rect.left));
});

canvas.addEventListener("touchmove", e => {
  let rect = canvas.getBoundingClientRect();
  player.x = Math.max(20, Math.min(380, e.touches[0].clientX - rect.left));
});

// SPAWN ENEMY
setInterval(() => {
  if (gameRunning && !boss) {
    let t = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    enemies.push({ x: Math.random() * 360, y: -20, ...t });
  }
}, 900);

// GAME LOOP
function gameLoop() {
  if (!gameRunning || !player) return;

  ctx.clearRect(0, 0, 400, 600);

  // STAR
  ctx.fillStyle = "white";
  stars.forEach(s => {
    s.y += 1;
    if (s.y > 600) s.y = 0;
    ctx.fillRect(s.x, s.y, 2, 2);
  });

  // PLAYER
  ctx.font = "36px Arial";
  ctx.fillText(currentSkin.emoji, player.x, player.y);

  // BULLET 🏐 FINAL
  bullets.forEach((b, i) => {
    b.y -= 6;

    ctx.font = "26px Arial";
    ctx.fillText("🏐", b.x, b.y);

    if (b.y < 0) bullets.splice(i, 1);
  });

  // ENEMY
  enemies.forEach((e, ei) => {
    e.y += e.speed;
    ctx.font = "28px Arial";
    ctx.fillText(e.emoji, e.x, e.y);

    // HIT PLAYER
    if (Math.abs(e.x - player.x) < 25 && Math.abs(e.y - player.y) < 25) {
      enemies.splice(ei, 1);
      player.hp--;
      playBoom();
      if (player.hp <= 0) endGame();
    }

    // HIT BULLET
    bullets.forEach((b, bi) => {
      if (Math.abs(b.x - e.x) < 20 && Math.abs(b.y - e.y) < 20) {
        bullets.splice(bi, 1);
        e.hp--;

        if (e.hp <= 0) {
          enemies.splice(ei, 1);
          score++;
          playBoom();

          if (score % 5 === 0) {
            level++;
            updateSkin();
          }
        }
      }
    });
  });

  // BOSS
  if (level >= 5 && !boss) {
    boss = { x: 150, y: 60, hp: 40 };
  }

  if (boss) {
    ctx.font = "60px Arial";
    ctx.fillText("👹", boss.x, boss.y);

    bullets.forEach((b, bi) => {
      if (Math.abs(b.x - boss.x) < 40 && Math.abs(b.y - boss.y) < 40) {
        bullets.splice(bi, 1);
        boss.hp--;
        playBoom();
      }
    });

    if (boss.hp <= 0) {
      boss = null;
      score += 10;
      level++;
      updateSkin();
    }
  }

  // UI
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Score: " + score, 10, 20);
  ctx.fillText("Level: " + level, 10, 40);
  ctx.fillText("HP: " + player.hp, 10, 60);

  requestAnimationFrame(gameLoop);
}

// GAME OVER
function endGame() {
  gameRunning = false;
  clearTimeout(shootTimeout);
  gameOverUI.classList.remove("hidden");
}
