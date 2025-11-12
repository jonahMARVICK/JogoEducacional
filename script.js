const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const shipImg = new Image();
shipImg.src = 'navemathinvaders.png';

let ship, bullets, meteors, score, lives, question, answer, level;
let meteorSpeed = 1.5;
let spawnInterval = 1500;
let gameRunning = false;
let explosionParticles = [];
let highscore = localStorage.getItem('highscore') || 0;

let sounds = {};
let keys = {};

function initSounds() {
  sounds.shoot = new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_c74c875b54.mp3');
  sounds.explosion = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_6a57b618b4.mp3');
  sounds.gameover = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_7a99f5e87a.mp3');
  sounds.shoot.volume = 0.5;
  sounds.explosion.volume = 0.6;
  sounds.gameover.volume = 0.7;
}

function startGame(dif) {
  document.getElementById('menu').style.display = 'none';
  initSounds();
  gameRunning = true;

  ship = { x: canvas.width / 2, y: canvas.height - 60, w: 40, h: 40 };
  bullets = [];
  meteors = [];
  explosionParticles = [];
  score = 0;
  lives = 3;
  level = 1;
  nextQuestion();

  if (dif === 'facil') { meteorSpeed = 1.5; spawnInterval = 1800; }
  if (dif === 'medio') { meteorSpeed = 2.5; spawnInterval = 1300; }
  if (dif === 'dificil') { meteorSpeed = 3.5; spawnInterval = 900; }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);

  setInterval(spawnMeteors, spawnInterval);
  requestAnimationFrame(gameLoop);
}

function keyDown(e) { keys[e.code] = true; }
function keyUp(e) { keys[e.code] = false; }

function nextQuestion() {
  if (score >= 80) level = 3;
  else if (score >= 30) level = 2;
  else level = 1;

  let a = Math.floor(Math.random() * 10) + 1;
  let b = Math.floor(Math.random() * 10) + 1;
  if (level === 1) {
    question = `${a} ${Math.random() > 0.5 ? '+' : '-'} ${b}`;
    answer = eval(question);
  } else if (level === 2) {
    question = `${a} x ${b}`;
    answer = a * b;
  } else {
    question = `x = ${a}+${b}`;
    answer = a + b;
  }
}

function spawnMeteors() {
  if (!gameRunning) return;
  const n = 4;
  meteors = [];
  let correctIndex = Math.floor(Math.random() * n);

  for (let i = 0; i < n; i++) {
    let value = (i === correctIndex) ? answer : Math.floor(Math.random() * 20) + 1;
    let newX, overlaps;
    do {
      newX = 60 + i * 100 + Math.random() * 30;
      overlaps = meteors.some(m => Math.abs(m.x - newX) < 60);
    } while (overlaps);

    meteors.push({
      x: newX,
      y: -Math.random() * 150,
      value,
      speed: meteorSpeed + Math.random(),
      missed: false
    });
  }
}

function drawShip(s) {
  if (shipImg.complete)
    ctx.drawImage(shipImg, s.x - 24, s.y - 24, 48, 48);
  else {
    ctx.fillStyle = 'white';
    ctx.fillRect(s.x - 10, s.y - 10, 20, 20);
  }
}

function shoot() {
  if (!keys['Space']) return;
  bullets.push({ x: ship.x, y: ship.y - 20 });
  sounds.shoot.currentTime = 0;
  sounds.shoot.play();
  keys['Space'] = false; // evita spam
}

function drawBullets() {
  ctx.fillStyle = 'yellow';
  bullets.forEach(b => ctx.fillRect(b.x - 2, b.y - 10, 4, 10));
}

function drawMeteors() {
  ctx.fillStyle = 'lightgray';
  ctx.font = '16px "Press Start 2P"';
  meteors.forEach(m => {
    ctx.beginPath();
    ctx.arc(m.x, m.y, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.fillText(m.value, m.x - ctx.measureText(m.value).width / 2, m.y + 4);
    ctx.fillStyle = 'lightgray';
  });
}

function explode(x, y) {
  sounds.explosion.currentTime = 0;
  sounds.explosion.play();
  for (let i = 0; i < 10; i++) {
    explosionParticles.push({
      x, y,
      r: Math.random() * 4 + 2,
      g: Math.floor(Math.random() * 150 + 50),
      vy: (Math.random() - 0.5) * 3,
      a: 1
    });
  }
}

function drawExplosions() {
  explosionParticles.forEach(p => {
    ctx.fillStyle = `rgba(255,${p.g},0,${p.a})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    p.y += p.vy;
    p.a -= 0.02;
  });
  explosionParticles = explosionParticles.filter(p => p.a > 0);
}

function gameLoop() {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawShip(ship);
  drawBullets();
  drawMeteors();
  drawExplosions();

  ctx.fillStyle = 'white';
  ctx.fillText(`Questão: ${question}`, 10, 20);
  ctx.fillText(`Score: ${score}`, 10, 40);
  ctx.fillText(`Vidas: ${'❤️'.repeat(lives)}`, 10, 60);
  ctx.fillText(`Highscore: ${highscore}`, 10, 80);

  if (keys['ArrowLeft']) ship.x -= 5;
  if (keys['ArrowRight']) ship.x += 5;
  if (keys['Space']) shoot();

  ship.x = Math.max(20, Math.min(canvas.width - 20, ship.x));

  // movimento das balas
  bullets.forEach(b => b.y -= 6);
  bullets = bullets.filter(b => b.y > -10);

  // movimento dos meteoros
  meteors.forEach(m => {
    m.y += m.speed;

    // colisão com nave
    if (Math.abs(m.x - ship.x) < 30 && Math.abs(m.y - ship.y) < 30) {
      lives--;
      explode(ship.x, ship.y);
      m.y = canvas.height + 100;
      if (lives <= 0) endGame();
    }

    // chegou ao fim da tela — só conta se ultrapassar totalmente
    if (m.y > canvas.height + 25 && !m.missed) {
      if (m.value === answer) {
        score = Math.max(0, score - 10);
      }
      m.missed = true;
    }
  });

  // colisão bala / meteoro
  bullets.forEach(b => {
    meteors.forEach(m => {
      if (Math.abs(b.x - m.x) < 25 && Math.abs(b.y - m.y) < 25) {
        explode(m.x, m.y);
        if (m.value === answer) {
          score += 10;
          nextQuestion();
        } else {
          score = Math.max(0, score - 5);
        }
        m.y = canvas.height + 100;
      }
    });
  });

  // remove meteoros completamente fora da tela
  meteors = meteors.filter(m => m.y < canvas.height + 60);

  // dificuldade dinâmica
  if (score > 30) meteorSpeed = 2.8;
  if (score > 60) meteorSpeed = 3.5;

  if (score > highscore) {
    highscore = score;
    localStorage.setItem('highscore', highscore);
  }

  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameRunning = false;
  sounds.gameover.play();
  alert(`💀 Game Over!\nScore: ${score}\nHighscore: ${highscore}`);
  location.reload();
}