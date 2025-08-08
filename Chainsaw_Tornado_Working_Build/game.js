
function initGame() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  let x = 50, y = 300, vy = 0, jumping = false;
  const gravity = 1, ground = 300;
  const keys = {};

  document.addEventListener('keydown', e => keys[e.key] = true);
  document.addEventListener('keyup', e => keys[e.key] = false);

  function gameLoop() {
    if (keys[' '] && !jumping) {
      vy = -15;
      jumping = true;
    }

    vy += gravity;
    y += vy;

    if (y >= ground) {
      y = ground;
      vy = 0;
      jumping = false;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'green';
    ctx.fillRect(x, y, 40, 40);

    requestAnimationFrame(gameLoop);
  }

  gameLoop();
}
