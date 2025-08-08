
function initGame(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;

  // Input
  const keys={}; document.addEventListener('keydown',e=>keys[e.code]=true); document.addEventListener('keyup',e=>keys[e.code]=false);

  // Load sprites
  function img(src){ const i=new Image(); i.src=src; return i; }
  const SPR = {
    jack: {
      idle: img('assets/lumberjack_idle.png'),
      jump: img('assets/lumberjack_jump.png'),
      attack: img('assets/lumberjack_attack.png'),
      throw: img('assets/lumberjack_throw.png')
    },
    zombie: [ img('assets/zombie_walk1.png'), img('assets/zombie_walk2.png') ],
    tornadoS: [ img('assets/tornado_small_1.png'), img('assets/tornado_small_2.png'), img('assets/tornado_small_3.png') ],
    tornadoB: [ img('assets/tornado_boss_1.png'), img('assets/tornado_boss_2.png'), img('assets/tornado_boss_3.png') ],
    axe: [ img('assets/axe_1.png'), img('assets/axe_2.png'), img('assets/axe_3.png'), img('assets/axe_4.png') ],
    log: img('assets/log.png'),
    heart: img('assets/heart.png'),
    super: img('assets/super.png')
  };

  // Audio (simple synth)
  const AC = new (window.AudioContext||window.webkitAudioContext)();
  let musicOn=false;
  function beep(f, dur=0.09, type='square', vol=0.06){
    const o=AC.createOscillator(), g=AC.createGain(); o.type=type; o.frequency.value=f; g.gain.value=vol; o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime+dur);
  }
  function music(){ if(musicOn) return; musicOn=true; const notes=[392,440,392,330,294,330,392,262,392,440,392,330,294,330,262,196]; let i=0;
    const g=AC.createGain(); g.gain.value=0.05; g.connect(AC.destination);
    (function loop(){ if(!musicOn) return; const o=AC.createOscillator(); o.type='square'; o.frequency.value=notes[i%notes.length]; o.connect(g); o.start(); o.stop(AC.currentTime+0.12); i++; setTimeout(loop,140); })();
  }
  window.addEventListener('keydown', ()=>music(), {once:true});

  // Game state
  const G = { t:0, level:1, score:0, lastLog: -1e9, logCD:5000, lastAxe:-1e9, axeCD:8000, lastSpawn:0, spawnEvery:1400, lastPickup:0, pickupEvery:9000, lastBoss:0, bossEvery:60000, running:true, super:false, superTill:0 };
  const player = { x:120, y:H-120, w:64, h:64, vy:0, onGround:false, hp:5, face:1, anim:'idle', swingTill:0, speed:4, invTill:0 };

  const ents = { zombies:[], tornadoes:[], axes:[], logs:[], pickups:[] };

  function rect(a,b){ return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y; }
  function clamp(v,lo,hi){ return Math.max(lo, Math.min(hi, v)); }
  function jump(){ if(player.onGround){ player.vy=-16; beep(330); } }

  function spawnZombie(){ ents.zombies.push({x:W+30,y:H-120,w:64,h:64,hp:1,vx:- (1.2+Math.random()*0.8) - G.level*0.04, f:0, t:0}); }
  function spawnTornado(mini=true){ const hp=mini?2:6+Math.floor(G.level*0.6); const vx= - (2.1+Math.random()*0.7) - G.level*0.06; ents.tornadoes.push({x:W+30,y:H-128,w:64,h:64,hp,vx,f:0}); }
  function spawnPickup(){ const kind=Math.random()<0.6?'heart':'super'; ents.pickups.push({x:W+30,y:H-128,w:24,h:24,kind,vx:-2}); }

  function melee(){ player.swingTill=performance.now()+160; player.anim='attack'; beep(220); }
  function fireLog(){ const now=performance.now(); if(now-G.lastLog<G.logCD) return; G.lastLog=now; ents.logs.push({x:player.x+48,y:player.y+28,w:32,h:16,vx:8+G.level*0.1,dmg:2}); beep(330,0.08,'triangle'); }
  function fireAxe(){ const now=performance.now(); if(now-G.lastAxe<G.axeCD) return; G.lastAxe=now; ents.axes.push({x:player.x+48,y:player.y+20,w:32,h:32,vx:9+G.level*0.15,dmg:3, f:0}); player.anim='throw'; beep(440); }

  function superOn(){ if(G.super) return; G.super=true; G.superTill=performance.now()+6000; player.speed=6.5; player.invTill=performance.now()+600; beep(523,0.2); setTimeout(()=>beep(659,0.2),160); }

  function update(dt){
    G.t += dt; G.level = 1 + Math.floor(G.t/15000);
    // Input
    if(keys['Space']) jump();
    if(keys['KeyJ']) melee();
    if(keys['KeyK']) fireLog();
    if(keys['KeyL']) fireAxe();
    if(keys['KeyE']) superOn();

    // Gravity
    player.vy += 0.9; player.y += player.vy;
    const ground=H-96; if(player.y>ground){ player.y=ground; player.vy=0; player.onGround=true; } else player.onGround=false;

    // Horizontal
    if(keys['ArrowRight']) player.x+=player.speed;
    if(keys['ArrowLeft']) player.x-=player.speed;
    player.x=clamp(player.x, 10, W-120);

    // Anim state
    if(performance.now()<player.swingTill) player.anim='attack';
    else if(!player.onGround) player.anim='jump';
    else player.anim='idle';

    // Spawns
    if(performance.now()-G.lastSpawn>G.spawnEvery){ if(Math.random()<0.6) spawnZombie(); else spawnTornado(true); G.lastSpawn=performance.now(); }
    if(performance.now()-G.lastPickup>G.pickupEvery){ spawnPickup(); G.lastPickup=performance.now(); }
    if(performance.now()-G.lastBoss>G.bossEvery){ spawnTornado(false); spawnTornado(false); G.lastBoss=performance.now(); beep(196,0.2); setTimeout(()=>beep(147,0.2),150); }

    // Move entities
    ents.zombies.forEach(e=>{ e.x += e.vx; e.t+=dt; if(e.t>180){ e.t=0; e.f=(e.f+1)%2; } });
    ents.tornadoes.forEach(e=>{ e.x += e.vx; e.f=(e.f+1)%3; });
    ents.axes.forEach(a=>{ a.x += a.vx; a.f=(a.f+1)%4; });
    ents.logs.forEach(l=> l.x += l.vx);
    ents.pickups.forEach(p=> p.x += p.vx);

    // Collision
    const meleeActive = performance.now()<player.swingTill;
    const meleeBox = meleeActive ? {x:player.x+52,y:player.y+12,w:24,h:40} : null;

    function dmgEnemy(e, dmg){ e.hp -= dmg; if(e.hp<=0){ e.dead=true; G.score += (e.vx<-2?3:1); beep(180,0.06,'triangle'); } else beep(260,0.05,'triangle'); }

    if(meleeBox){
      ents.zombies.forEach(e=>{ if(rect(meleeBox,e)) dmgEnemy(e,1); });
      ents.tornadoes.forEach(e=>{ if(rect(meleeBox,e)) dmgEnemy(e,1); });
    }
    ents.logs.forEach(p=>{
      ents.zombies.forEach(e=>{ if(rect(p,e)) { dmgEnemy(e,p.dmg); p.dead=true; } });
      ents.tornadoes.forEach(e=>{ if(rect(p,e)) { dmgEnemy(e,p.dmg); p.dead=true; } });
    });
    ents.axes.forEach(p=>{
      ents.zombies.forEach(e=>{ if(rect(p,e)) { dmgEnemy(e,p.dmg); } });
      ents.tornadoes.forEach(e=>{ if(rect(p,e)) { dmgEnemy(e,p.dmg); } });
    });

    function hurt(){ if(performance.now()<player.invTill) return; player.hp--; player.invTill=performance.now()+800; beep(120,0.12); if(player.hp<=0) gameOver(); }
    ents.zombies.forEach(e=>{ if(rect(player,e)) hurt(); });
    ents.tornadoes.forEach(e=>{ if(rect(player,e)) hurt(); });

    ents.pickups.forEach(p=>{
      if(rect(player,p)){ if(p.kind==='heart'){ player.hp=Math.min(player.hp+1,7); beep(784,0.08); } else { superOn(); } p.dead=true; }
    });

    // Cull
    ents.zombies = ents.zombies.filter(e=>!e.dead && e.x>-100);
    ents.tornadoes = ents.tornadoes.filter(e=>!e.dead && e.x>-120);
    ents.logs = ents.logs.filter(p=>!p.dead && p.x<W+40);
    ents.axes = ents.axes.filter(p=>p.x<W+40);
    ents.pickups = ents.pickups.filter(p=>!p.dead && p.x>-40);

    if(G.super && performance.now()>G.superTill){ G.super=false; player.speed=4; }
  }

  // Render
  function draw(){
    // bg
    ctx.fillStyle='#0b1020'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#0f172a'; ctx.fillRect(0,H-80,W,80);
    // trees parallax
    for(let i=0;i<10;i++){ const tx=(i*120-(G.t*0.09)%120); drawTree(tx,H-80); }

    // player
    const spr = SPR.jack[player.anim] || SPR.jack.idle;
    ctx.drawImage(spr, player.x, player.y, player.w, player.h);

    // enemies
    ents.zombies.forEach(e=> ctx.drawImage(SPR.zombie[e.f], e.x, e.y, e.w, e.h));
    ents.tornadoes.forEach(e=> ctx.drawImage(e.vx<-2.5?SPR.tornadoB[e.f]:SPR.tornadoS[e.f], e.x, e.y, e.w, e.h));
    // projectiles
    ents.logs.forEach(p=> ctx.drawImage(SPR.log, p.x, p.y, p.w, p.h));
    ents.axes.forEach(p=> ctx.drawImage(SPR.axe[p.f], p.x, p.y, p.w, p.h));
    // pickups
    ents.pickups.forEach(p=> ctx.drawImage(p.kind==='heart'?SPR.heart:SPR.super, p.x, p.y, p.w, p.h));

    // HUD
    ctx.fillStyle='#e5e7eb'; ctx.font='16px ui-monospace, monospace';
    const cdLog = Math.max(0,(G.logCD-(performance.now()-G.lastLog))/1000).toFixed(1);
    const cdAxe = Math.max(0,(G.axeCD-(performance.now()-G.lastAxe))/1000).toFixed(1);
    ctx.fillText(`HP: ${player.hp}`, 16, 24);
    ctx.fillText(`Score: ${G.score}`, 16, 46);
    ctx.fillText(`Log: ${cdLog}s  Axe: ${cdAxe}s  Lvl: ${G.level}${G.super?'  SUPER!':''}`, 16, 68);
  }

  function drawTree(x, baseY){
    ctx.fillStyle='#5b3711'; ctx.fillRect(x+20, baseY-48, 12, 40);
    ctx.fillStyle='#1bbf6d'; ctx.beginPath(); ctx.moveTo(x,baseY-40); ctx.lineTo(x+26,baseY-84); ctx.lineTo(x+52,baseY-40); ctx.fill();
    ctx.fillStyle='#15a45c'; ctx.beginPath(); ctx.moveTo(x+4,baseY-52); ctx.lineTo(x+26,baseY-88); ctx.lineTo(x+48,baseY-52); ctx.fill();
  }

  // Loop
  let last=performance.now();
  function frame(t){ const dt=Math.min(32, t-last); last=t; if(G.running){ update(dt); draw(); requestAnimationFrame(frame); } }
  requestAnimationFrame(frame);

  // Game over + leaderboard
  function gameOver(){
    G.running=false;
    const initials=(prompt(`Game Over! Score: ${G.score}\nEnter initials:`)||'???').slice(0,3).toUpperCase();
    const board = localStorage.ct_leaderboard?JSON.parse(localStorage.ct_leaderboard):[];
    board.push({initials, score:G.score, t:Date.now()}); board.sort((a,b)=>b.score-a.score); while(board.length>10) board.pop();
    localStorage.ct_leaderboard = JSON.stringify(board);
    setTimeout(()=>location.reload(), 400);
  }
}
