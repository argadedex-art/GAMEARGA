const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

const menu = document.getElementById("menu");
const gameOverUI = document.getElementById("gameOverUI");

const shootSound = document.getElementById("shootSound");
const boomSound = document.getElementById("boomSound");

// SKIN (EMOJI ORANG)
const skins = [
  { level: 1, emoji: "😡", fireRate: 400 },
  { level: 3, emoji: "😨", fireRate: 250 },
  { level: 6, emoji: "🥶", fireRate: 150 }
];

let currentSkin = skins[0];

// DATA
let player, bullets, enemies, boss;
let score, level, gameRunning;
let shootTimeout;

// MUSUH
const enemyTypes = [
  { emoji: "👾", speed: 3, hp: 1 },
  { emoji: "👽", speed: 5, hp: 1 },
  { emoji: "🤖", speed: 2, hp: 3 }
];

// BINTANG
let stars = [];
for (let i = 0; i < 50; i++) {
  stars.push({
    x: Math.random() * 400,
    y: Math.random() * 600
  });
}

// START
function startGame() {
  menu.style.display = "none";
  canvas.style.display = "block";
  gameOverUI.classList.add("hidden");

  player = { x: 180, y: 520, size: 36, hp: 3 };
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

// UPDATE SKIN
function updateSkin() {
  currentSkin = skins[0];
  skins.forEach(s => {
    if (level >= s.level) currentSkin = s;
  });
}

// SOUND AMAN
function playShoot() {
  try {
    shootSound.currentTime = 0;
    shootSound.play();
  } catch {}
}

function playBoom() {
  try {
    boomSound.currentTime = 0;
    boomSound.play();
  } catch {}
}

// TEMBAK LOOP
function shootLoop() {
  if (!gameRunning) return;

  bullets.push({ x: player.x, y: player.y });
  playShoot();

  shootTimeout = setTimeout(shootLoop, currentSkin.fireRate);
}

// KONTROL
function movePlayer(clientX) {
  let rect = canvas.getBoundingClientRect();
  player.x = clientX - rect.left;
}

canvas.addEventListener("touchmove", e => {
  movePlayer(e.touches[0].clientX);
});

canvas.addEventListener("mousemove", e => {
  movePlayer(e.clientX);
});

// SPAWN MUSUH
setInterval(() => {
  if (gameRunning && !boss) {
    let t = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    enemies.push({
      x: Math.random() * 360,
      y: -30,
      ...t
    });
  }
}, 800);

// LOOP
function gameLoop() {
  ctx.clearRect(0, 0, 400, 600);

  // BINTANG
  ctx.fillStyle = "white";
  stars.forEach(s => {
    s.y += 1 + level * 0.2;
    if (s.y > 600) s.y = 0;
    ctx.fillRect(s.x, s.y, 2, 2);
  });

  // PLAYER
  ctx.font = "36px Arial";
  ctx.fillText(currentSkin.emoji, player.x, player.y);

  // BULLET
  bullets.forEach((b, i) => {
    b.y -= 6;
    ctx.fillText("*", b.x, b.y);
    if (b.y < 0) bullets.splice(i, 1);
  });

  // ENEMY
  enemies.forEach((e, ei) => {
    e.y += e.speed;
    ctx.font = "28px Arial";
    ctx.fillText(e.emoji, e.x, e.y);

    // TABRAKAN PLAYER
    if (
      Math.abs(e.x - player.x) < 25 &&
      Math.abs(e.y - player.y) < 25
    ) {
      enemies.splice(ei, 1);
      player.hp--;
      playBoom();

      if (player.hp <= 0) endGame();
    }

    // TABRAKAN BULLET
    bullets.forEach((b, bi) => {
      if (
        Math.abs(b.x - e.x) < 20 &&
        Math.abs(b.y - e.y) < 20
      ) {
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
      if (
        Math.abs(b.x - boss.x) < 40 &&
        Math.abs(b.y - boss.y) < 40
      ) {
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
  ctx.font = "16px Arial";
  ctx.fillText("Score: " + score, 10, 20);
  ctx.fillText("Level: " + level, 10, 40);
  ctx.fillText("HP: " + player.hp, 10, 60);

  if (gameRunning) {
    requestAnimationFrame(gameLoop);
  }
}

// END GAME
function endGame() {
  gameRunning = false;
  clearTimeout(shootTimeout);
  gameOverUI.classList.remove("hidden");
}
