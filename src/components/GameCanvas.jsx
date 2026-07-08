import React, { useEffect, useRef, useState } from 'react';
import { GameAudio } from '../game/audio';
import { getWordForEnemy } from '../game/words';
import GameHUD from './GameHUD';
import { SKILLS_DB } from './SkillsData';

const getDeterministicIndex = (str, length) => {
  if (!str || length <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % length;
};

export default function GameCanvas({
  username,
  shipColor,
  isMultiplayer,
  maxPlayers = 3,
  roomCode,
  players,
  socket,
  onGameOver,
  onScoreUpdate,
  muted,
  onToggleMute,
  onQuitToMenu,
  equippedSkills,
  initialWave,
  initialScore,
  onDockStart,
  onSaveCheckpoint
}) {
  const getColorHex = (colorName) => {
    if (colorName === 'red') return '#cf4042'; // Muted Crimson
    if (colorName === 'blue') return '#4a90e2'; // Sleek Slate Blue
    if (colorName === 'green') return '#2ebd59'; // Sage Emerald
    if (colorName === 'purple') return '#8b5cf6'; // Indigo/Lavender
    
    if (colorName === 'orange') return '#d97706'; // Muted Bronze Orange
    if (colorName === 'magenta') return '#be185d'; // Deep Wine Rose
    if (colorName === 'gold') return '#d9a752'; // Matte Gold
    
    return '#ffffff';
  };
  const canvasRef = useRef(null);
  
  const isPrime = (num) => {
    if (num <= 1) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return true;
  };

  const stateRef = useRef({
    score: 0,
    multiplier: 1,
    wave: 1,
    health: 100,
    streak: 0,
    enemies: [],
    bullets: [],
    particles: [],
    lasers: [],
    scenery: [],
    nebulaColor: { h: 260, s: 50, l: 10 },
    targetNebulaColor: { h: 260, s: 50, l: 10 },
    activeWordId: null,
    screenShake: 0,
    flashFrame: 0,
    waveTransitionTimer: 120, // Countdown frames for wave intro
    waveState: 'intro', // 'intro', 'playing', 'boss_warning', 'boss_fight', 'victory'
    bossObj: null,
    lastSpawnTime: 0,
    waveSpawnedCount: 0,
    waveTotalToSpawn: 10,
    isLocalGameOver: false,
    teammates: [],
    playerPositions: {},
    leavingShips: [],
    isPaused: false,
    charge: 0,
    cooldowns: [0, 0, 0],
    empFreezeTime: 0,
    nebulaSlowTime: 0,
    overclockTime: 0,
    decoyTime: 0,
    shieldActive: false,
    stabilizerTime: 0,
    overdriveTime: 0,
    usedWords: new Set(),
    bossShieldActive: false,
    bossShieldTime: 0,
    bossShieldHealth: 0,
    bossShieldsCount: 0,
    shieldClaims: [],
    players: players || [],
    isReviving: false,
    reviveTimeRemaining: 0
  });

  const [hudState, setHudState] = useState({
    score: 0,
    multiplier: 1,
    wave: 1,
    health: 100,
    defPercent: 0,
    teammates: []
  });

  const initializedRef = useRef(false);

  // Load initial wave and score on mount (for persistent wave progression)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const waveVal = initialWave || 1;
    const scoreVal = initialScore || 0;
    
    stateRef.current.wave = waveVal;
    stateRef.current.score = scoreVal;
    stateRef.current.waveTotalToSpawn = 10 + waveVal * 4;
    
    if (waveVal === 1) {
      stateRef.current.usedWords.clear();
    }
    
    stateRef.current.targetNebulaColor = {
      h: (260 + waveVal * 30) % 360,
      s: 60,
      l: 8 + (waveVal % 4)
    };

    setHudState(prev => ({
      ...prev,
      wave: waveVal,
      score: scoreVal
    }));
  }, [initialWave, initialScore]);

  // Track keydown handler to remove on unmount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions
    // Set canvas dimensions
    const resizeCanvas = () => {
      const oldWidth = canvas.width;
      const oldHeight = canvas.height;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const newWidth = canvas.width;
      const newHeight = canvas.height;

      // Adjust scenery, enemies, and bullets coordinates dynamically so they stretch/align to the new screen boundaries
      if (oldWidth > 0 && oldHeight > 0) {
        if (stateRef.current.scenery && stateRef.current.scenery.length > 0) {
          stateRef.current.scenery.forEach(item => {
            item.y = (item.y / oldHeight) * newHeight;
            const wasLeft = item.x < oldWidth / 2;
            if (wasLeft) {
              item.x = (item.x / oldWidth) * newWidth;
            } else {
              const distFromRight = oldWidth - item.x;
              item.x = newWidth - (distFromRight / oldWidth) * newWidth;
            }
          });
        }
        if (stateRef.current.enemies && stateRef.current.enemies.length > 0) {
          stateRef.current.enemies.forEach(item => {
            item.x = (item.x / oldWidth) * newWidth;
            item.y = (item.y / oldHeight) * newHeight;
            if (item.serverX !== undefined) item.serverX = (item.serverX / oldWidth) * newWidth;
            if (item.serverY !== undefined) item.serverY = (item.serverY / oldHeight) * newHeight;
            item.speed = (item.speed / oldHeight) * newHeight;
          });
        }
        if (stateRef.current.bullets && stateRef.current.bullets.length > 0) {
          stateRef.current.bullets.forEach(item => {
            item.x = (item.x / oldWidth) * newWidth;
            item.y = (item.y / oldHeight) * newHeight;
            if (item.serverX !== undefined) item.serverX = (item.serverX / oldWidth) * newWidth;
            if (item.serverY !== undefined) item.serverY = (item.serverY / oldHeight) * newHeight;
            item.speed = (item.speed / oldHeight) * newHeight;
            if (item.vx !== undefined) item.vx = (item.vx / oldWidth) * newWidth;
            if (item.vy !== undefined) item.vy = (item.vy / oldHeight) * newHeight;
          });
        }
      }
      
      // Initialize scenery if empty
      if (stateRef.current.scenery.length === 0) {
        initScenery(canvas.width, canvas.height, stateRef.current.wave);
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('fullscreenchange', resizeCanvas);
    document.addEventListener('webkitfullscreenchange', resizeCanvas);

    // Global window keydown listener to ensure keyboard input is captured reliably
    const handleGlobalKeyDown = (e) => {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        return;
      }
      keyHandlerRef.current(e);
    };
    window.addEventListener('keydown', handleGlobalKeyDown);

    // Focus canvas
    canvas.focus();

    // Start Game loop
    let animationFrameId;
    const render = () => {
      if (!stateRef.current.isPaused) {
        updateGame();
      }
      drawGame();
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    // Start background music
    GameAudio.playMusic('ingame_synth');

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('fullscreenchange', resizeCanvas);
      document.removeEventListener('webkitfullscreenchange', resizeCanvas);
      window.removeEventListener('keydown', handleGlobalKeyDown);
      cancelAnimationFrame(animationFrameId);
      GameAudio.stopMusic();
      GameAudio.stopIngameSynthTheme();
    };
  }, []);

  // Sync teammates from props
  useEffect(() => {
    if (isMultiplayer && players) {
      const state = stateRef.current;
      state.players = players; // Keep ref updated for loop closures

      // Animate leaving ships for players who are no longer in the list
      const currentSocketIds = players.map(p => p.socketId);
      let playerLeft = false;
      if (state.teammates && state.teammates.length > 0) {
        state.teammates.forEach(mate => {
          if (!currentSocketIds.includes(mate.socketId)) {
            const currentX = state.playerPositions[mate.socketId] || getShipX(mate.position, canvasRef.current?.width || window.innerWidth);
            state.leavingShips.push({
              socketId: mate.socketId,
              x: currentX,
              y: canvasRef.current ? canvasRef.current.height - 80 : window.innerHeight - 80,
              vy: 1.5,
              color: mate.color,
              username: mate.username,
              opacity: 1.0
            });
            delete state.playerPositions[mate.socketId];
            playerLeft = true;
          }
        });
      }

      if (playerLeft) {
        GameAudio.play('warning');
        state.colorSpawnBag = [];
        
        const remainingColors = players.map(p => p.color).filter(Boolean);
        if (remainingColors.length > 0) {
          state.enemies.forEach(enemy => {
            if (enemy.type !== 'boss_shield' && enemy.type !== 'meteor' && enemy.color && !remainingColors.includes(enemy.color)) {
              // Deterministic selection based on enemy id so all clients align
              const cIndex = getDeterministicIndex(enemy.id, remainingColors.length);
              const newColor = remainingColors[cIndex];
              enemy.color = newColor;
              if (enemy.wordQueue && enemy.wordQueue.length > 0) {
                enemy.wordQueue.forEach((qItem, qIdx) => {
                  if (qItem && typeof qItem === 'object') {
                    const qIndex = getDeterministicIndex(enemy.id + '-' + qIdx, remainingColors.length);
                    qItem.color = remainingColors[qIndex];
                  }
                });
              }
            }
          });

          if (state.bossObj && state.bossObj.words) {
            let bossColorChanged = false;
            state.bossObj.words.forEach(w => {
              if (w.color && !remainingColors.includes(w.color)) {
                const wIndex = getDeterministicIndex(w.id, remainingColors.length);
                w.color = remainingColors[wIndex];
                bossColorChanged = true;
              }
            });
            if (bossColorChanged) {
              state.enemies.forEach(enemy => {
                if (enemy.type === 'boss_shield') {
                  const matchingWord = state.bossObj.words.find(w => w.id === enemy.id);
                  if (matchingWord) {
                    enemy.color = matchingWord.color;
                  }
                }
              });
            }
          }
        }
      }

      // Filter out local player and store others as teammates
      const mates = players.map(p => {
        const isSelf = p.socketId === socket?.id;
        const existingMate = state.teammates.find(m => m.socketId === p.socketId);
        return {
          socketId: p.socketId,
          username: p.username,
          color: p.color,
          position: p.position,
          isHost: p.isHost,
          score: p.score || 0,
          level: p.level || 1,
          health: isSelf ? state.health : (existingMate ? existingMate.health : (p.health !== undefined ? p.health : 100)),
          isReviving: isSelf ? state.isReviving : (existingMate ? existingMate.isReviving : false),
          reviveTimeRemaining: isSelf ? state.reviveTimeRemaining : (existingMate ? existingMate.reviveTimeRemaining : 0)
        };
      });
      state.teammates = mates;
      
      // If we are playing, keep our current health synced
      const meInState = mates.find(m => m.socketId === socket?.id);
      if (meInState) {
        state.health = meInState.health;
      }

      // Check if all players are dead or reviving (game over)
      if (state.waveState !== 'victory' && !state.isLocalGameOver) {
        const alivePlayersCount = mates.filter(m => m.health > 0 && !m.isReviving).length;
        if (alivePlayersCount === 0) {
          if (isMultiplayer && socket) {
            socket.send(JSON.stringify({
              type: 'GAME_OVER',
              finalScore: state.score,
              waveReached: state.wave
            }));
          }
          triggerGameOver(state.score, state.wave);
        }
      }

      setHudState(prev => ({
        ...prev,
        teammates: mates
      }));
    }
  }, [players, isMultiplayer, socket]);

  // Handle incoming Socket messages during gameplay
  useEffect(() => {
    if (!isMultiplayer || !socket) return;

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const state = stateRef.current;
        const players = state.players || [];
        const canvas = canvasRef.current;
        if (!canvas) return;

        switch (data.type) {
          case 'ROOM_PLAYERS_UPDATE': {
            // Handled via players prop sync, but keeping fallback
            break;
          }

          case 'SPAWN_ENEMIES': {
            // Add enemies generated by host
            if (socket.id !== data.hostId) {
              data.enemies.forEach(e => {
                const absoluteX = e.x * canvas.width;
                const absoluteY = e.y * canvas.height;
                state.enemies.push({
                  ...e,
                  x: absoluteX,
                  y: absoluteY,
                  physicsX: absoluteX,
                  physicsY: absoluteY,
                  offsetX: 0,
                  offsetY: 0,
                  speed: e.speed * canvas.height
                });
                // Sync Quantum Anomaly Warning banner on guests
                if (e.type === 'anomaly') {
                  state.anomalyWarningTimer = 180;
                }
              });
            }
            break;
          }

          case 'TYPING_STRIKE': {
            // Render teammate shot
            const mate = state.teammates.find(m => m.socketId === data.playerId);
            const targetEnemy = state.enemies.find(e => e.id === data.wordId);
            
            if (mate) {
              const targetX = targetEnemy ? targetEnemy.x : (data.x * canvas.width);
              const targetY = targetEnemy ? targetEnemy.y : (data.y * canvas.height);
              
              const shipX = state.playerPositions[mate.socketId] || getShipTargetX(mate.socketId, canvas.width);
              const shipY = canvas.height - 80;
              
              // Add laser beam
              state.lasers.push({
                fromX: shipX,
                fromY: shipY - 20,
                toX: targetX,
                toY: targetY,
                color: getColorHex(mate.color),
                alpha: 1.0
              });

              // Particle burst at impact
              createExplosion(targetX, targetY, getColorHex(mate.color), 8);

              // Play strike audio
              GameAudio.play('hit', getPan(targetX));

              if (targetEnemy) {
                // Subtract character on target enemy
                targetEnemy.targetIndex = data.charIndex + 1;
              }

              if (data.wordFinished) {
                if (targetEnemy && targetEnemy.wordQueue && targetEnemy.wordQueue.length > 0) {
                  const nextWord = targetEnemy.wordQueue.shift();
                  targetEnemy.word = typeof nextWord === 'string' ? nextWord : nextWord.word;
                  if (nextWord && typeof nextWord === 'object' && nextWord.color) {
                    targetEnemy.color = nextWord.color;
                  }
                  targetEnemy.targetIndex = 0;
                  createExplosion(targetX, targetY, getColorHex(mate.color), 10);
                  GameAudio.play('explosionSmall', getPan(targetX));
                } else {
                  // Enemy dies
                  if (targetEnemy) {
                    state.enemies = state.enemies.filter(e => e.id !== data.wordId);
                    handleEnemyCompletion(data.wordId);
                  }
                  createExplosion(targetX, targetY, getColorHex(mate.color), 25, true);
                  if (data.wordId && data.wordId.startsWith('meteor')) {
                    GameAudio.play('meteor_explosion', getPan(targetX));
                  } else {
                    const enemyType = targetEnemy ? targetEnemy.type : 'drone';
                    const panVal = getPan(targetX);
                    if (enemyType === 'drone') GameAudio.play('explosion_drone', panVal);
                    else if (enemyType === 'interceptor') GameAudio.play('explosion_interceptor', panVal);
                    else if (enemyType === 'kamikaze') GameAudio.play('explosion_kamikaze', panVal);
                    else if (enemyType === 'cruiser') GameAudio.play('explosion_cruiser', panVal);
                    else if (enemyType === 'shield_linker') {
                      GameAudio.play('explosion_linker', panVal);
                      GameAudio.play('enemy_shield_shatter', panVal);
                    } else if (enemyType === 'boss') GameAudio.play('boss_explosion', panVal);
                    else GameAudio.play('explosion', panVal);
                  }
                }
                
                // Update teammate's score locally for drawing
                mate.score += data.damage;
              }
            }
            break;
          }

          case 'CANCEL_BULLET': {
            // Find and destroy bullet
            const bullet = state.bullets.find(b => b.id === data.bulletId);
            if (bullet) {
              createExplosion(bullet.x, bullet.y, '#fff', 12);
              state.bullets = state.bullets.filter(b => b.id !== data.bulletId);
              GameAudio.play('hit', getPan(bullet.x));
            }
            break;
          }

          case 'SPAWN_BULLET': {
            if (socket.id !== data.hostId) {
              const b = data.bullet;
              const absoluteX = b.x * canvas.width;
              const absoluteY = b.y * canvas.height;
              state.bullets.push({
                ...b,
                x: absoluteX,
                y: absoluteY,
                physicsX: absoluteX,
                physicsY: absoluteY,
                offsetX: 0,
                offsetY: 0,
                speed: b.speed * canvas.height,
                vx: b.vx !== undefined ? b.vx * canvas.width : undefined,
                vy: b.vy !== undefined ? b.vy * canvas.height : undefined
              });
            }
            break;
          }

          case 'REPLICATOR_SPLIT': {
            // Remove parent
            state.enemies = state.enemies.filter(e => e.id !== data.parentId);
            if (state.activeWordId === data.parentId) state.activeWordId = null;
            
            // Add children
            if (data.child1 && data.child2) {
              const absoluteX1 = data.child1.x * canvas.width;
              const absoluteY1 = data.child1.y * canvas.height;
              const absoluteX2 = data.child2.x * canvas.width;
              const absoluteY2 = data.child2.y * canvas.height;
              
              const c1 = {
                ...data.child1,
                x: absoluteX1,
                y: absoluteY1,
                physicsX: absoluteX1,
                physicsY: absoluteY1,
                offsetX: 0,
                offsetY: 0,
                speed: data.child1.speed * canvas.height
              };
              const c2 = {
                ...data.child2,
                x: absoluteX2,
                y: absoluteY2,
                physicsX: absoluteX2,
                physicsY: absoluteY2,
                offsetX: 0,
                offsetY: 0,
                speed: data.child2.speed * canvas.height
              };
              state.enemies.push(c1, c2);
              createExplosion((c1.x + c2.x) / 2, c1.y - 10, getColorHex(c1.color), 18, true);
              GameAudio.play('explosionSmall', getPan((c1.x + c2.x) / 2));
            }
            break;
          }

          case 'SYNC_BOSS_PHASE': {
            if (socket.id !== data.hostId) {
              // Start boss fight phase on clients
              state.waveState = 'boss_fight';
              if (!state.bossObj) {
                state.bossObj = {
                  id: data.bossId || 'boss',
                  type: data.bossType || 'boss',
                  name: data.bossName || 'BOSS',
                  color: data.bossColor || 'purple',
                  x: canvas.width / 2,
                  y: 120,
                  width: data.bossWidth || 180,
                  height: data.bossHeight || 100,
                  health: data.bossHealth || 100,
                  maxHealth: 100,
                  words: data.bossWords || [],
                  phase: data.phase,
                  shootTimer: 120
                };
              } else {
                state.bossObj.id = data.bossId !== undefined ? data.bossId : state.bossObj.id;
                state.bossObj.type = data.bossType !== undefined ? data.bossType : state.bossObj.type;
                state.bossObj.name = data.bossName !== undefined ? data.bossName : state.bossObj.name;
                state.bossObj.color = data.bossColor !== undefined ? data.bossColor : state.bossObj.color;
                state.bossObj.width = data.bossWidth !== undefined ? data.bossWidth : state.bossObj.width;
                state.bossObj.height = data.bossHeight !== undefined ? data.bossHeight : state.bossObj.height;
                state.bossObj.health = data.bossHealth !== undefined ? data.bossHealth : state.bossObj.health;
                state.bossObj.words = data.bossWords !== undefined ? data.bossWords : state.bossObj.words;
                state.bossObj.phase = data.phase !== undefined ? data.phase : state.bossObj.phase;
              }
              // Clear any active boss shields to prevent duplicates
              state.enemies = state.enemies.filter(e => e.type !== 'boss_shield');
              loadBossWordsAsEnemies(data.bossWords || state.bossObj.words);
            }
            break;
          }

          case 'BOSS_DESTROYED': {
            if (socket.id !== data.hostId) {
              const boss = state.bossObj;
              const bossX = (data.x !== undefined ? data.x * canvas.width : (boss ? boss.x : canvas.width / 2));
              const bossY = (data.y !== undefined ? data.y * canvas.height : (boss ? boss.y : 120));
              const bossColor = data.color || (boss ? boss.color : '#ffffff');

              // Play boss_explosion sound
              GameAudio.play('boss_explosion');
              
              // Create the massive white explosion at the boss's location
              createExplosion(bossX, bossY, '#ffffff', 80, true);

              // Spawn spinning metal chunks
              for (let c = 0; c < 7; c++) {
                const angle = Math.random() * Math.PI * 2;
                const force = 1.5 + Math.random() * 2.5;
                state.particles.push({
                  x: bossX + (Math.random() - 0.5) * 40,
                  y: bossY + (Math.random() - 0.5) * 20,
                  vx: Math.cos(angle) * force,
                  vy: Math.sin(angle) * force - 0.5,
                  size: 4 + Math.random() * 8,
                  color: 'rgba(168, 85, 247, 0.4)', // soft purple chunk
                  alpha: 0.95,
                  life: 60 + Math.random() * 40,
                  type: 'chunk',
                  angle: Math.random() * Math.PI * 2,
                  rotSpeed: (Math.random() - 0.5) * 0.15
                });
              }

              state.bossObj = null;

              // Clear all remaining minions/bullets
              state.enemies = [];
              state.bullets = [];

              // Spawn shield claim orb animation
              if (!state.shieldClaims) state.shieldClaims = [];
              state.shieldClaims.push({
                x: bossX,
                y: bossY,
                progress: 0
              });
            }
            break;
          }

          case 'ANOMALY_WARNING': {
            state.anomalyWarningTimer = 180; // 3 seconds banner alert
            GameAudio.play('emp');
            break;
          }

          case 'METEOR_WARNING': {
            state.meteorShowerTriggered = true;
            state.meteorShowerWarningTimer = 180;
            GameAudio.play('meteor_warning');
            break;
          }

          case 'BOSS_WARNING': {
            state.waveState = 'boss_warning';
            state.waveTransitionTimer = 180;
            state.targetNebulaColor = { h: 0, s: 70, l: 8 };
            GameAudio.play('emp');
            break;
          }

          case 'PLAYER_HIT': {
            const mate = state.teammates.find(m => m.socketId === data.playerId);
            if (mate) {
              mate.health = data.health;
              if (mate.socketId === socket?.id) {
                state.health = data.health;
              }
              setHudState(prev => ({ 
                ...prev, 
                health: state.health,
                teammates: [...state.teammates]
              }));
            }
            break;
          }

          case 'PLAYER_DOWN': {
            const mate = state.teammates.find(m => m.socketId === data.playerId);
            if (mate) {
              mate.health = 0;
              mate.isReviving = true;
              mate.reviveTimeRemaining = data.reviveTime * 60; // 15 * 60 = 900 frames
              setHudState(prev => ({ 
                ...prev, 
                health: state.health,
                teammates: [...state.teammates]
              }));
            }
            break;
          }

          case 'PLAYER_REVIVED': {
            const mate = state.teammates.find(m => m.socketId === data.playerId);
            if (mate) {
              mate.health = 100;
              mate.isReviving = false;
              mate.reviveTimeRemaining = 0;
              // Minimal recovery ring & green explosion at teammate's ship position
              const mx = state.playerPositions[mate.socketId] || getShipTargetX(mate.socketId, window.innerWidth);
              createExplosion(mx, window.innerHeight - 80, '#22c55e', 14);
              GameAudio.play('shield_activate');
              setHudState(prev => ({ 
                ...prev, 
                health: state.health,
                teammates: [...state.teammates]
              }));
            }
            break;
          }

          case 'CAST_SKILL': {
            if (data.socketId !== socket.id) {
              const mate = players.find(p => p.socketId === data.socketId);
              if (mate) {
                const mx = state.playerPositions[mate.socketId] || getShipTargetX(mate.socketId, window.innerWidth);
                const my = window.innerHeight - 80;
                const skill = SKILLS_DB.find(s => s.id === data.skillId);
                const resolvedColor = skill ? skill.color : '#ffffff';
                createExplosion(mx, my, resolvedColor, 20);
                GameAudio.play('laserPlayer', getPan(mx));

                // Apply passive/global utility skill effects on the client's screen locally!
                if (data.skillId === 'emp_discharge') {
                  state.enemies.forEach(e => {
                    let duration = 4000;
                    if (e.type === 'interceptor') duration = 3000;
                    else if (e.type === 'cruiser') duration = 2000;
                    else if (e.type === 'boss') duration = 1000;
                    e.freezeTime = duration;
                  });
                  createExplosion(window.innerWidth / 2, window.innerHeight / 2, resolvedColor, 45, true);
                } else if (data.skillId === 'nebula_veil') {
                  state.enemies.forEach(e => {
                    let multiplier = 0.5;
                    if (e.type === 'interceptor') multiplier = 0.625;
                    else if (e.type === 'cruiser') multiplier = 0.75;
                    else if (e.type === 'boss') multiplier = 0.875;
                    e.slowMultiplier = multiplier;
                    e.slowTime = 6000;
                  });
                } else if (data.skillId === 'quantum_warp') {
                  state.bullets = [];
                  createExplosion(window.innerWidth / 2, window.innerHeight - 80, resolvedColor, 35, true);
                } else if (data.skillId === 'gravity_rewind') {
                  state.enemies.forEach(e => {
                    if (e.type !== 'boss_shield' && e.type !== 'anomaly' && e.speed > 0) {
                      e.y = Math.max(50, e.y - 150);
                    }
                  });
                  createExplosion(window.innerWidth / 2, window.innerHeight * 0.3, resolvedColor, 30);
                } else if (data.skillId === 'laser_sweep') {
                  const toKill = [];
                  state.enemies.forEach(e => {
                    if (e.word && e.word.length > 0) {
                      e.word = e.word.substring(1);
                      if (state.activeWordId === e.id) {
                        e.targetIndex = Math.max(0, e.targetIndex - 1);
                      }
                      if (e.word.length === 0) {
                        toKill.push(e);
                      }
                    }
                  });
                  toKill.forEach(e => handleEnemyKill(e));
                  createExplosion(window.innerWidth / 2, window.innerHeight * 0.4, resolvedColor, 25);
                } else if (data.skillId === 'decoy_probe') {
                  state.decoyTime = 6000;
                } else if (data.skillId === 'chronos_drive') {
                  state.chronosDriveTime = 8000;
                } else if (data.skillId === 'reflector_shield') {
                  state.reflectorTime = 5000;
                } else if (data.skillId === 'hologram_decoy') {
                  state.hologramTime = 6000;
                } else if (data.skillId === 'auto_scribe') {
                  if (data.targetEnemyId) {
                    const target = state.enemies.find(e => e.id === data.targetEnemyId);
                    if (target && target.word) {
                      let lettersCount = 8;
                      if (target.type === 'interceptor') lettersCount = 6;
                      else if (target.type === 'cruiser') lettersCount = 4;
                      else if (target.type === 'boss') lettersCount = 2;

                      const toType = Math.min(lettersCount, target.word.length);
                      target.word = target.word.substring(toType);
                      target.targetIndex = 0;
                      
                      if (target.word.length === 0) {
                        handleEnemyKill(target);
                      } else {
                        createExplosion(target.x, target.y, resolvedColor, 8);
                      }
                    }
                  }
                } else if (data.skillId === 'data_purge') {
                  if (data.targetEnemyIds && data.targetEnemyIds[0]) {
                    const target = state.enemies.find(e => e.id === data.targetEnemyIds[0]);
                    if (target) {
                      target.word = '';
                      handleEnemyKill(target);
                    }
                  }
                } else if (data.skillId === 'chain_strike') {
                  if (data.targetEnemyIds && Array.isArray(data.targetEnemyIds)) {
                    data.targetEnemyIds.forEach(id => {
                      const e = state.enemies.find(enemy => enemy.id === id);
                      if (e && e.word && e.word.length > 0) {
                        const toType = Math.min(2, e.word.length);
                        e.word = e.word.substring(toType);
                        e.targetIndex = 0;
                        if (e.word.length === 0) {
                          handleEnemyKill(e);
                        } else {
                          createExplosion(e.x, e.y, resolvedColor, 6);
                        }
                      }
                    });
                  }
                } else if (data.skillId === 'shatter_code') {
                  if (state.waveState === 'boss_fight' && state.bossObj && data.targetEnemyId) {
                    const boss = state.bossObj;
                    const activeShield = boss.words.find(w => w.id === data.targetEnemyId);
                    if (activeShield && activeShield.word) {
                      const count = Math.ceil(activeShield.word.length * 0.25);
                      activeShield.word = activeShield.word.substring(count);
                      
                      const shieldEnemy = state.enemies.find(e => e.id === activeShield.id);
                      if (shieldEnemy) {
                        shieldEnemy.word = activeShield.word;
                        shieldEnemy.targetIndex = 0;
                      }

                      if (activeShield.word.length === 0) {
                        activeShield.completed = true;
                        const players = state.players || [];
                        const isHost = !isMultiplayer || (players.find(p => p.socketId === socket?.id)?.isHost);
                        if (isHost) {
                          checkBossShieldsCompleted(activeShield.id);
                        } else {
                          state.enemies = state.enemies.filter(e => e.id !== activeShield.id);
                        }
                      } else {
                        createExplosion(boss.x, boss.y, resolvedColor, 12);
                      }
                    }
                  }
                }
              }
            }
            break;
          }

          case 'SYNC_POSITIONS': {
            if (socket.id !== data.hostId) {
              // Sync boss position and custom timers if present
              if (data.boss && state.bossObj) {
                const targetX = data.boss.x * canvas.width;
                const targetY = data.boss.y * canvas.height;
                
                // Detect Warp Spectre teleportation
                if (Math.abs(state.bossObj.x - targetX) > 50) {
                  createExplosion(state.bossObj.x, state.bossObj.y, '#38bdf8', 25, true);
                  createExplosion(targetX, targetY, '#38bdf8', 25, true);
                  GameAudio.play('laser', getPan(targetX));
                  
                  if (state.bossObj.words) {
                    state.bossObj.words.forEach(w => {
                      const matchingEnemy = state.enemies.find(e => e.id === w.id);
                      if (matchingEnemy) matchingEnemy.x = targetX;
                    });
                  }
                }
                
                state.bossObj.x = targetX;
                state.bossObj.y = targetY;
                state.bossObj.targetFireLane = data.boss.targetFireLane;
                state.bossObj.fireWarningTime = data.boss.fireWarningTime;
                state.bossObj.fireActiveTime = data.boss.fireActiveTime;
                
                if (data.boss.empTimer !== undefined) {
                  // Trigger local EMP skill lockout if host reset it
                  if (data.boss.empTimer === 0 && state.bossObj.empTimer > 300) {
                    state.empDrainedTimer = 360;
                    GameAudio.play('emp');
                    createExplosion(canvas.width / 2, canvas.height / 2, '#fbbf24', 40, true);
                  }
                  state.bossObj.empTimer = data.boss.empTimer;
                }
              } else if (!data.boss && state.bossObj) {
                state.bossObj = null;
                state.enemies = state.enemies.filter(e => e.type !== 'boss_shield');
              }

              data.enemies.forEach(syncE => {
                const localE = state.enemies.find(e => e.id === syncE.id);
                if (localE) {
                  const absoluteX = syncE.x * canvas.width;
                  const absoluteY = syncE.y * canvas.height;
                  
                  if (localE.physicsX === undefined) {
                    localE.physicsX = localE.x;
                    localE.physicsY = localE.y;
                    localE.offsetX = 0;
                    localE.offsetY = 0;
                  }
                  
                  // Mismatch between visual position and host authoritative target
                  const errorX = localE.x - absoluteX;
                  const errorY = localE.y - absoluteY;
                  
                  if (Math.hypot(errorX, errorY) < 180) {
                    localE.offsetX = errorX;
                    localE.offsetY = errorY;
                  } else {
                    localE.offsetX = 0;
                    localE.offsetY = 0;
                  }
                  
                  // Snap simulated coordinates immediately to server authority
                  localE.physicsX = absoluteX;
                  localE.physicsY = absoluteY;
                  localE.serverX = absoluteX; // maintain compatibility fallback
                  localE.serverY = absoluteY;

                  // Sync additional properties from Host
                  if (syncE.word !== undefined && localE.word !== syncE.word) {
                    localE.word = syncE.word;
                  }
                  if (syncE.shieldLinkedEnemyId !== undefined) {
                    localE.shieldLinkedEnemyId = syncE.shieldLinkedEnemyId;
                  }
                }
              });
              data.bullets.forEach(syncB => {
                const localB = state.bullets.find(b => b.id === syncB.id);
                if (localB) {
                  const absoluteX = syncB.x * canvas.width;
                  const absoluteY = syncB.y * canvas.height;
                  
                  if (localB.physicsX === undefined) {
                    localB.physicsX = localB.x;
                    localB.physicsY = localB.y;
                    localB.offsetX = 0;
                    localB.offsetY = 0;
                  }
                  
                  const errorX = localB.x - absoluteX;
                  const errorY = localB.y - absoluteY;
                  
                  if (Math.hypot(errorX, errorY) < 180) {
                    localB.offsetX = errorX;
                    localB.offsetY = errorY;
                  } else {
                    localB.offsetX = 0;
                    localB.offsetY = 0;
                  }
                  
                  localB.physicsX = absoluteX;
                  localB.physicsY = absoluteY;
                  localB.serverX = absoluteX;
                  localB.serverY = absoluteY;
                }
              });
            }
            break;
          }

          case 'GAME_OVER': {
            triggerGameOver(data.finalScore, data.waveReached);
            break;
          }

          case 'GAME_PAUSED': {
            setPaused(true);
            setPausingPlayers(data.pausingPlayers || []);
            setPausingSocketIds(data.pausingSocketIds || []);
            break;
          }

          case 'GAME_RESUMED': {
            setPaused(false);
            setPausingPlayers([]);
            setPausingSocketIds([]);
            setTimeout(() => {
              canvasRef.current?.focus();
            }, 50);
            break;
          }

          case 'NEXT_WAVE': {
            state.wave = data.wave;
            state.waveState = 'intro';
            state.waveTransitionTimer = 120;
            state.enemies = [];
            state.bullets = [];
            state.waveSpawnedCount = 0;
            state.waveTotalToSpawn = 10 + data.wave * 4;
            // Partially heal client player and teammates between waves (refill by 50)
            state.health = Math.min(100, state.health + 50);
            if (state.teammates) {
              state.teammates.forEach(m => {
                m.health = Math.min(100, (m.health || 0) + 50);
              });
            }
            setHudState(prev => ({ 
              ...prev, 
              wave: data.wave,
              health: state.health,
              teammates: state.teammates ? [...state.teammates] : []
            }));
            // Shift target nebula colors
            state.targetNebulaColor = {
              h: (260 + data.wave * 30) % 360,
              s: 60,
              l: 8 + (data.wave % 4)
            };
            break;
          }
        }
      } catch (e) {
        console.error('Multiplayer message parse error:', e);
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [isMultiplayer, socket]);

  // Initial scenery population
  const initScenery = (width, height, waveNumber = 1) => {
    const scenery = [];
    const count = 22 + Math.min(waveNumber, 10);
    
    const isBossWave = isPrime(waveNumber);
    const isOdd = waveNumber % 2 !== 0;

    for (let i = 0; i < count; i++) {
      const isLeft = Math.random() < 0.5;
      const x = isLeft 
        ? Math.random() * (width * 0.18) 
        : width - Math.random() * (width * 0.18);
      const y = Math.random() * height;
      const size = 20 + Math.random() * 40;
      const speedMultiplier = 0.15 + Math.random() * 0.3;
      const rotation = Math.random() * Math.PI * 2;
      const rotationSpeed = (Math.random() - 0.5) * 0.008;

      let type;
      let color;
      
      if (isBossWave) {
        // Battle remnants: wreckage and platforms
        type = Math.random() < 0.55 ? 'wreckage' : 'platform';
        color = `hsla(0, 50%, 50%, ${0.05 + Math.random() * 0.06})`; // faint glowing red/rust
      } else if (isOdd) {
        // Asteroid belt: bumpy rocks
        type = Math.random() < 0.7 ? 'asteroid' : 'rock';
        color = `hsla(210, 10%, 60%, ${0.07 + Math.random() * 0.08})`; // grayish rock
      } else {
        // Star systems & distant planets
        type = Math.random() < 0.5 ? 'planet' : 'solarsystem';
        color = `hsla(${180 + Math.random() * 60}, 50%, 60%, ${0.02 + Math.random() * 0.035})`; // extremely low transparency
      }

      // Pre-calculated points for rocks/asteroids to prevent drawing jitter
      const offsets = [];
      const ptsCount = type === 'asteroid' ? 10 : 6;
      for (let j = 0; j < ptsCount; j++) {
        offsets.push(0.8 + Math.random() * 0.4);
      }

      const hasRing = Math.random() < 0.5;

      scenery.push({
        x,
        y,
        size,
        type,
        speedMultiplier,
        rotation,
        rotationSpeed,
        color,
        offsets,
        hasRing
      });
    }
    stateRef.current.scenery = scenery;
  };

  const handleEnemyKill = (enemy) => {
    const state = stateRef.current;
    
    if (enemy.type === 'mirage_decoy') {
      state.activeWordId = null;
      createExplosion(enemy.x, enemy.y, '#db2777', 22, true);
      GameAudio.play('explosion');
      state.enemies = state.enemies.filter(e => e.id !== enemy.id);
      return;
    }

    let scoreGained = 10 * state.multiplier + (enemy.word ? enemy.word.length * 5 * state.multiplier : 0);
    
    if (enemy.type === 'anomaly') {
      state.charge = Math.min(100, state.charge + 25);
      setCharge(state.charge);
      scoreGained += 1000;
      state.anomalyWarningTimer = 0;
    }

    state.activeWordId = null;
    createExplosion(enemy.x, enemy.y, getColorHex(enemy.color), 22, true);
    const panVal = getPan(enemy.x);
    if (enemy.type === 'meteor') {
      GameAudio.play('meteor_explosion', panVal);
    } else if (enemy.type === 'drone') {
      GameAudio.play('explosion_drone', panVal);
    } else if (enemy.type === 'interceptor') {
      GameAudio.play('explosion_interceptor', panVal);
    } else if (enemy.type === 'kamikaze') {
      GameAudio.play('explosion_kamikaze', panVal);
    } else if (enemy.type === 'cruiser') {
      GameAudio.play('explosion_cruiser', panVal);
    } else if (enemy.type === 'shield_linker') {
      GameAudio.play('explosion_linker', panVal);
      GameAudio.play('enemy_shield_shatter', panVal);
    } else if (enemy.type === 'boss') {
      GameAudio.play('boss_explosion', panVal);
    } else {
      GameAudio.play('explosion', panVal);
    }
    
    // Remove enemy from list
    state.enemies = state.enemies.filter(e => e.id !== enemy.id);
    handleEnemyCompletion(enemy.id);

    state.score += scoreGained;
    stateRef.current.score = state.score;
    setHudState(prev => ({ ...prev, score: state.score }));
    onScoreUpdate(state.score, state.wave);

    if (isMultiplayer && socket) {
      const canvas = canvasRef.current;
      const widthVal = canvas ? canvas.width : window.innerWidth;
      const heightVal = canvas ? canvas.height : window.innerHeight;
      socket.send(JSON.stringify({
        type: 'TYPING_STRIKE',
        wordId: enemy.id,
        charIndex: enemy.word ? enemy.word.length : 1,
        damage: scoreGained,
        x: enemy.x / widthVal,
        y: enemy.y / heightVal,
        wordFinished: true
      }));
    }
  };

  const triggerSkill = (slotIdx) => {
    const state = stateRef.current;
    if (state.isLocalGameOver || state.isPaused) return;
    if (!equippedSkills || !equippedSkills[slotIdx]) return;

    const skillId = equippedSkills[slotIdx];
    const skill = SKILLS_DB.find(s => s.id === skillId);
    if (!skill) return;

    // Check if we have enough charge and if it is off cooldown
    if (state.charge < skill.cost) return;
    if (state.cooldowns[slotIdx] > 0) return;

    // Cast skill
    state.charge -= skill.cost;
    state.cooldowns[slotIdx] = skill.cooldown;
    setCharge(state.charge);
    setCooldowns([...state.cooldowns]);
    const canvasVal = canvasRef.current;
    const pxVal = canvasVal ? getLocalShipX(canvasVal.width) : window.innerWidth / 2;
    GameAudio.play('laserPlayer', getPan(pxVal));

    // Trigger specific skill powers
    switch (skillId) {
      case 'emp_discharge':
        // Freeze active enemies based on rank
        state.enemies.forEach(e => {
          let duration = 4000;
          if (e.type === 'interceptor') duration = 3000;
          else if (e.type === 'cruiser') duration = 2000;
          else if (e.type === 'boss') duration = 1000;
          e.freezeTime = duration;
        });
        // Create full screen EMP shockwave burst
        createExplosion(canvasRef.current.width / 2, canvasRef.current.height / 2, skill.color, 45, true);
        break;

      case 'overclock':
        state.overclockTime = 5000;
        break;

      case 'decoy_probe':
        state.decoyTime = 6000;
        break;

      case 'nebula_veil':
        state.enemies.forEach(e => {
          let multiplier = 0.5; // Drone: 50% slow
          if (e.type === 'interceptor') multiplier = 0.625; // 37.5% slow
          else if (e.type === 'cruiser') multiplier = 0.75; // 25% slow
          else if (e.type === 'boss') multiplier = 0.875; // 12.5% slow
          e.slowMultiplier = multiplier;
          e.slowTime = 6000;
        });
        break;

      case 'tactical_shield':
        state.shieldActive = true;
        break;

      case 'laser_sweep': {
        // Strip first letter of all active words
        const toKill = [];
        state.enemies.forEach(e => {
          if (e.word && e.word.length > 0) {
            e.word = e.word.substring(1);
            if (state.activeWordId === e.id) {
              e.targetIndex = Math.max(0, e.targetIndex - 1);
            }
            if (e.word.length === 0) {
              toKill.push(e);
            }
          }
        });
        toKill.forEach(e => handleEnemyKill(e));
        // Spark a glowing swipe laser line across screen center
        createExplosion(canvasRef.current.width / 2, canvasRef.current.height * 0.4, skill.color, 25);
        break;
      }

      case 'quantum_warp':
        // Wipe all bullets on screen
        state.bullets = [];
        createExplosion(canvasRef.current.width / 2, canvasRef.current.height - 80, skill.color, 35, true);
        break;

      case 'chronos_drive':
        state.chronosDriveTime = 8000;
        break;

      case 'auto_scribe': {
        // Find targeted enemy
        const target = state.enemies.find(e => e.id === state.activeWordId);
        if (target && target.word) {
          state.lastAutoScribeTarget = target.id;
          let lettersCount = 8;
          if (target.type === 'interceptor') lettersCount = 6;
          else if (target.type === 'cruiser') lettersCount = 4;
          else if (target.type === 'boss') lettersCount = 2;

          const toType = Math.min(lettersCount, target.word.length);
          target.word = target.word.substring(toType);
          target.targetIndex = 0; // Reset typing progress to 0 to prevent target locking
          
          if (target.word.length === 0) {
            handleEnemyKill(target);
          } else {
            createExplosion(target.x, target.y, skill.color, 8);
          }
        }
        break;
      }

      case 'multiplier_surge':
        state.multiplier = Math.min(10, state.multiplier * 2);
        setHudState(prev => ({ ...prev, multiplier: state.multiplier }));
        break;

      case 'nano_repair':
        state.health = Math.min(100, state.health + 15);
        setHudState(prev => ({ ...prev, health: state.health }));
        if (isMultiplayer && socket) {
          socket.send(JSON.stringify({
            type: 'PLAYER_HIT',
            playerId: socket.id,
            health: state.health
          }));
        }
        break;

      case 'singularity_pin': {
        // Find highest enemy
        let highest = null;
        state.enemies.forEach(e => {
          if (!highest || e.y > highest.y) {
            highest = e;
          }
        });
        if (highest) {
          highest.anchoredTime = 8000;
          createExplosion(highest.x, highest.y, skill.color, 15);
        }
        break;
      }

      case 'data_purge': {
        // Destroy lowest health non-boss enemy
        let target = null;
        state.enemies.forEach(e => {
          if (e.type !== 'boss' && e.type !== 'boss_shield' && e.type !== 'boss_shield_linker' && e.type !== 'anomaly') {
            if (!target || e.word.length < target.word.length) {
              target = e;
            }
          }
        });
        if (target) {
          state.lastDataPurgeTarget = target.id;
          target.word = '';
          handleEnemyKill(target);
        }
        break;
      }

      case 'reflector_shield':
        state.reflectorTime = 5000;
        break;

      case 'chain_strike': {
        // Pick 3 random enemies
        const shuffed = [...state.enemies].sort(() => 0.5 - Math.random()).slice(0, 3);
        state.lastChainStrikeTargets = shuffed.map(e => e.id);
        shuffed.forEach(e => {
          if (e.word && e.word.length > 0) {
            const toType = Math.min(2, e.word.length);
            e.word = e.word.substring(toType);
            e.targetIndex = 0; // Reset typing progress to 0 to prevent target locking
            if (e.word.length === 0) {
              handleEnemyKill(e);
            } else {
              createExplosion(e.x, e.y, skill.color, 6);
            }
          }
        });
        break;
      }

      case 'shatter_code': {
        // If boss exists, type 25% of its shield word
        if (state.waveState === 'boss_fight' && state.bossObj) {
          const boss = state.bossObj;
          const activeShield = boss.words.find(w => w.active && !w.completed);
          if (activeShield && activeShield.word) {
            const count = Math.ceil(activeShield.word.length * 0.25);
            activeShield.word = activeShield.word.substring(count);
            
            // Also update the active shield enemy in state.enemies
            const shieldEnemy = state.enemies.find(e => e.id === activeShield.id);
            if (shieldEnemy) {
              shieldEnemy.word = activeShield.word;
              shieldEnemy.targetIndex = 0;
            }

            if (activeShield.word.length === 0) {
              activeShield.completed = true;
              checkBossShieldsCompleted(activeShield.id);
            } else {
              createExplosion(boss.x, boss.y, skill.color, 12);
            }
          }
        }
        break;
      }

      case 'combo_stabilizer':
        state.stabilizerTime = 8000;
        break;

      case 'overdrive_thruster':
        state.overdriveTime = 6000;
        break;

      case 'hologram_decoy':
        state.hologramTime = 6000;
        break;

      case 'gravity_rewind':
        state.enemies.forEach(e => {
          // Do not push boss shields or anomaly mini-bosses (which have speed = 0 and should remain centered)
          if (e.type !== 'boss_shield' && e.type !== 'anomaly' && e.speed > 0) {
            e.y = Math.max(50, e.y - 150);
          }
        });
        createExplosion(canvasRef.current.width / 2, canvasRef.current.height * 0.3, skill.color, 30);
        break;
    }

    // Broadcast skill use in co-op
    if (isMultiplayer && socket) {
      let targetEnemyId = null;
      let targetEnemyIds = null;
      
      if (skillId === 'auto_scribe') {
        targetEnemyId = state.lastAutoScribeTarget || null;
      } else if (skillId === 'shatter_code' && state.bossObj) {
        const activeShield = state.bossObj.words.find(w => w.active && !w.completed);
        if (activeShield) targetEnemyId = activeShield.id;
      } else if (skillId === 'data_purge') {
        targetEnemyIds = state.lastDataPurgeTarget ? [state.lastDataPurgeTarget] : null;
      } else if (skillId === 'chain_strike') {
        targetEnemyIds = state.lastChainStrikeTargets || null;
      }

      socket.send(JSON.stringify({
        type: 'CAST_SKILL',
        skillId: skillId,
        slot: slotIdx,
        targetEnemyId: targetEnemyId,
        targetEnemyIds: targetEnemyIds
      }));
    }
  };

  const handleWaveEndDetection = () => {
    const state = stateRef.current;
    if (state.wave % 5 === 0) {
      state.waveState = 'docking';
      state.dockingTimer = 180;
      state.dockingShipYOffset = 0;
      state.hasPuffedSteam = false;
      GameAudio.play('emp');
      
      if (isMultiplayer && socket) {
        socket.send(JSON.stringify({
          type: 'INIT_DOCK',
          wave: state.wave
        }));
      }
    } else {
      advanceNextWave();
    }
  };

  // Helper to determine Ship center X coordinate based on lobby index
  const getShipX = (position, screenWidth) => {
    if (position === 'left') return screenWidth * 0.25;
    if (position === 'right') return screenWidth * 0.75;
    return screenWidth / 2; // host/center
  };

  const getShipTargetX = (socketId, screenWidth) => {
    const state = stateRef.current;
    const players = state.players || [];
    if (!isMultiplayer || !players || players.length === 0) {
      return screenWidth / 2;
    }
    const p = players.find(player => player.socketId === socketId);
    if (!p) return screenWidth / 2;
    return getShipX(p.position, screenWidth);
  };

  const getActivePlayerColors = () => {
    const state = stateRef.current;
    const players = state.players || [];
    if (!isMultiplayer || !players || players.length === 0) {
      return [shipColor];
    }
    const activeColors = [];
    players.forEach(p => {
      const isSelf = p.socketId === socket?.id;
      if (isSelf) {
        if (state.health > 0 && !state.isReviving) {
          activeColors.push(p.color || shipColor);
        }
      } else {
        const mate = state.teammates.find(m => m.socketId === p.socketId);
        const health = mate ? mate.health : 100;
        const isReviving = mate ? mate.isReviving : false;
        if (health > 0 && !isReviving) {
          activeColors.push(p.color);
        }
      }
    });
    if (activeColors.length === 0) {
      return players.map(p => p.color).filter(Boolean);
    }
    return activeColors;
  };

  const getLocalShipX = (screenWidth) => {
    if (isMultiplayer && socket?.id && stateRef.current.playerPositions[socket.id] !== undefined) {
      return stateRef.current.playerPositions[socket.id];
    }
    return getShipTargetX(socket?.id, screenWidth);
  };

  const getPan = (x) => {
    const canvasVal = canvasRef.current;
    const screenWidth = canvasVal ? canvasVal.width : window.innerWidth;
    const shipX = getLocalShipX(screenWidth);
    if (Math.abs(x - shipX) < 1) return 0;
    if (x < shipX) {
      return Math.max(-1.0, (x - shipX) / Math.max(1, shipX));
    } else {
      return Math.min(1.0, (x - shipX) / Math.max(1, screenWidth - shipX));
    }
  };

  const triggerTypoEffect = () => {
    const state = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const px = getLocalShipX(canvas.width);
    const py = canvas.height - 80 - 22;
    
    const count = Math.random() < 0.5 ? 1 : 2;
    for (let i = 0; i < count; i++) {
      state.particles.push({
        x: px,
        y: py,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.3,
        size: 1.0 + Math.random() * 1.0,
        color: 'rgba(0, 0, 0, 0.45)',
        alpha: 0.5,
        life: 25 + Math.random() * 15
      });
    }
  };

  const createExplosion = (x, y, color, particleCount = 15, isBig = false) => {
    const state = stateRef.current;
    const count = isBig ? particleCount * 2 : particleCount;
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (isBig ? 2 : 1) + Math.random() * (isBig ? 6 : 4);
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: (isBig ? 2 : 1) + Math.random() * 3,
        color,
        alpha: 1.0,
        life: 30 + Math.random() * 30
      });
    }
  };

  // Keyboard Event Handlers
  const handleKeyDown = (e) => {
    const state = stateRef.current;

    // Toggle pause on Escape key
    if (e.key === 'Escape') {
      e.preventDefault();
      if (isMultiplayer) {
        if (pausingSocketIds.includes(socket?.id)) {
          handleResumeRequest();
        } else {
          handlePauseRequest();
        }
      } else {
        togglePause();
      }
      return;
    }

    if (state.isLocalGameOver || state.isPaused || state.health <= 0) return;
    if (state.jammedTimer && state.jammedTimer > 0) return; // Controls jammed by anomaly pulsar

    const key = e.key.toLowerCase();
    if (key === '1' || key === '2' || key === '3') {
      if (state.empDrainedTimer && state.empDrainedTimer > 0) return; // Skills locked by EMP
      const slotIdx = key === '1' ? 0 : key === '2' ? 1 : 2;
      triggerSkill(slotIdx);
      return;
    }

    if (key === '5' || key === '7') {
      if (state.bossShieldsCount > 0 && state.bossShieldTime <= 0) {
        state.bossShieldsCount -= 1;
        setBossShields(state.bossShieldsCount);
        state.bossShieldActive = true;
        state.bossShieldTime = 8000;
        state.bossShieldHealth = 3;
        GameAudio.play('shield_activate');
        // Spark a glowing blue burst at ship position
        const shipX = window.innerWidth / 2;
        const shipY = window.innerHeight - 80;
        createExplosion(shipX, shipY, '#38bdf8', 25, true);
      }
      return;
    }

    if (key.length !== 1) return; // Ignore modifier keys (Shift, Ctrl, etc.)

    const char = key.toLowerCase();
    
    // Check if we are typing letters on single-character bullets (white)
    // Anyone can type/cancel bullets in co-op!
    const bulletToHitIndex = state.bullets.findIndex(b => b.letter.toLowerCase() === char);
    if (bulletToHitIndex !== -1) {
      const bullet = state.bullets[bulletToHitIndex];
      // Cancel it locally
      state.bullets.splice(bulletToHitIndex, 1);
      createExplosion(bullet.x, bullet.y, '#ffffff', 10);
      GameAudio.play('hit', getPan(bullet.x));
      
      // Update score locally
      state.score += 10;
      stateRef.current.score = state.score;
      setHudState(prev => ({ ...prev, score: state.score }));
      onScoreUpdate(state.score, state.wave);
      
      if (isMultiplayer && socket) {
        socket.send(JSON.stringify({
          type: 'CANCEL_BULLET',
          bulletId: bullet.id
        }));
        
        socket.send(JSON.stringify({
          type: 'UPDATE_SCORE',
          score: state.score,
          level: state.wave
        }));
      }
      return;
    }

    // Standard word typing
    if (state.activeWordId !== null) {
      // We have an active target
      const enemy = state.enemies.find(e => e.id === state.activeWordId);
      if (enemy) {
        // Double check color matching to prevent color hijacking
        if (isMultiplayer && enemy.color && enemy.color !== shipColor && enemy.type !== 'meteor') {
          state.activeWordId = null;
          tryAcquireNewTarget(char);
          return;
        }
        if (enemy.isInvulnerable) {
          GameAudio.play('shield_hit', getPan(enemy.x));
          return; // Linked target is invulnerable!
        }
        const nextChar = enemy.word && enemy.word[enemy.targetIndex] ? enemy.word[enemy.targetIndex].toLowerCase() : '';
        if (char === nextChar) {
          // If Overclock is active, hit 2 letters!
          hitTarget(enemy);
          if (state.overclockTime > 0 && enemy.word && enemy.targetIndex < enemy.word.length) {
            // Hit second letter
            hitTarget(enemy);
          }
        } else {
          enemy.typos = (enemy.typos || 0) + 1;
          triggerTypoEffect();
          if (state.shieldActive) {
            state.shieldActive = false; // absorb mistake
            createExplosion(enemy.x, enemy.y, '#a3e635', 10);
          } else {
            // Miss resets streak & multiplier if stabilizer is not running
            if (state.stabilizerTime <= 0) {
              state.streak = 0;
              updateStreakShield(0);
              state.multiplier = 1;
              setHudState(prev => ({ ...prev, multiplier: 1 }));
            }
          }
        }
      } else {
        // Targeted enemy was destroyed by teammate or went offscreen
        state.activeWordId = null;
        tryAcquireNewTarget(char);
      }
    } else {
      // Try to acquire a new target starting with the typed letter
      tryAcquireNewTarget(char);
    }
  };

  const tryAcquireNewTarget = (char) => {
    const state = stateRef.current;
    
    // Find enemies whose current letter matches the typed character
    // In co-op, we can ONLY target enemies that match our ship color (meteors are shared!)
    const eligibleEnemies = state.enemies.filter(e => {
      const matchesColor = !isMultiplayer || e.color === shipColor || e.type === 'meteor';
      const startsWithChar = e.word && e.word[0] && e.word[0].toLowerCase() === char;
      return matchesColor && startsWithChar && e.targetIndex === 0 && !e.isInvulnerable;
    });

    if (eligibleEnemies.length === 0) {
      // Check if they tried to target a linked invulnerable enemy
      const invulnerableMatch = state.enemies.find(e => {
        const matchesColor = !isMultiplayer || e.color === shipColor || e.type === 'meteor';
        const startsWithChar = e.word && e.word[0] && e.word[0].toLowerCase() === char;
        return matchesColor && startsWithChar && e.isInvulnerable;
      });
      if (invulnerableMatch) {
        GameAudio.play('shield_hit', getPan(invulnerableMatch.x));
      }

      // General typo outside active target
      triggerTypoEffect();
      if (state.shieldActive) {
        state.shieldActive = false;
      } else {
        if (state.stabilizerTime <= 0) {
          state.streak = 0;
          updateStreakShield(0);
          state.multiplier = 1;
          setHudState(prev => ({ ...prev, multiplier: 1 }));
        }
      }
      return;
    }

    // Pick the enemy closest to the bottom
    eligibleEnemies.sort((a, b) => b.y - a.y);
    const target = eligibleEnemies[0];
    state.activeWordId = target.id;
    GameAudio.play('target', getPan(target.x));
    
    // Hit first character
    hitTarget(target);
    if (state.overclockTime > 0 && target.targetIndex < target.word.length) {
      hitTarget(target);
    }
  };

  const hitTarget = (enemy) => {
    const state = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Reveal Stealth Cloaker on typing strike
    if (enemy.type === 'stealth_cloaker') {
      enemy.revealTimer = 90; // Reveal for 1.5 seconds
    }

    // Aegis Vindicator shield arc block check
    if (state.bossObj && state.bossObj.name === 'AEGIS VINDICATOR' && enemy.id.startsWith('boss-w-')) {
      const angle = (Date.now() * 0.0018) % (Math.PI * 2);
      const diff = (Math.PI * 0.5 - angle + Math.PI * 4) % (Math.PI * 2);
      if (diff < Math.PI * 0.75) {
        // Laser blocked by rotating Aegis shield plate!
        createExplosion(state.bossObj.x, state.bossObj.y + 40, '#ffffff', 8, true);
        GameAudio.play('hit');
        return;
      }
    }

    const charIndex = enemy.targetIndex;
    enemy.targetIndex += 1;
    
    // Increment streak/multiplier
    state.streak += 1;
    updateStreakShield(state.streak);
    if (state.streak % 10 === 0 && state.multiplier < 5) {
      state.multiplier += 1;
      setHudState(prev => ({ ...prev, multiplier: state.multiplier }));
      
      // Play multiplier audio
      if (state.multiplier === 2) GameAudio.play('multi2');
      if (state.multiplier >= 3) GameAudio.play('multi3');
    }

    // Add laser beam from local player ship
    const shipX = getLocalShipX(canvas.width);
    const shipY = canvas.height - 80;

    const charOffset = charIndex * 14; // Font spacing approximation
    const wordWidth = enemy.word.length * 14;
    
    let gravOffset = 0;
    if (state.bossObj && state.wave === 50) {
      gravOffset = Math.sin(Date.now() / 220 + enemy.y * 0.015) * 22;
    }
    
    const startX = enemy.x + gravOffset - wordWidth / 2;
    const letterX = startX + charOffset + 7;
    const letterY = enemy.y;

    state.lasers.push({
      fromX: shipX,
      fromY: shipY - 20,
      toX: letterX,
      toY: letterY,
      color: getColorHex(shipColor),
      alpha: 1.0
    });

    // Spark particles at impact point
    createExplosion(letterX, letterY, getColorHex(shipColor), 8);
    GameAudio.play('plasma', getPan(letterX));

    // Check if word completed
    const wordFinished = enemy.targetIndex >= enemy.word.length;
    let scoreGained = 10 * state.multiplier;

    if (wordFinished) {
      // Calculate completion score bonus
      scoreGained += enemy.word.length * 5 * state.multiplier;
      
      if (enemy.wordQueue && enemy.wordQueue.length > 0) {
        const nextWord = enemy.wordQueue.shift();
        enemy.word = typeof nextWord === 'string' ? nextWord : nextWord.word;
        if (nextWord && typeof nextWord === 'object' && nextWord.color) {
          enemy.color = nextWord.color;
        }
        enemy.targetIndex = 0;
        state.activeWordId = null;
        createExplosion(enemy.x, enemy.y, getColorHex(enemy.color), 10);
        GameAudio.play('explosionSmall', getPan(enemy.x));
      } else {
        state.activeWordId = null;
        createExplosion(enemy.x, enemy.y, getColorHex(enemy.color), 22, true);
        GameAudio.play('explosion', getPan(enemy.x));
        
        // Build charge slowly if no typos were made
        if (!enemy.typos || enemy.typos === 0) {
          let chargeGain = 5;
          if (enemy.type === 'interceptor') chargeGain = 10;
          else if (enemy.type === 'cruiser') chargeGain = 15;
          else if (enemy.type === 'boss') chargeGain = 25;

          state.charge = Math.min(100, state.charge + chargeGain);
          setCharge(state.charge);
        }

        if (enemy.type === 'anomaly') {
          state.charge = Math.min(100, state.charge + 25);
          setCharge(state.charge);
          scoreGained += 1000;
          state.anomalyWarningTimer = 0;
        }

        // Remove enemy from list
        state.enemies = state.enemies.filter(e => e.id !== enemy.id);
        handleEnemyCompletion(enemy.id);
      }
    }

    state.score += scoreGained;
    stateRef.current.score = state.score;
    setHudState(prev => ({ ...prev, score: state.score }));
    onScoreUpdate(state.score, state.wave);

    // Sync typing action to other players
    if (isMultiplayer && socket) {
      const canvas = canvasRef.current;
      const widthVal = canvas ? canvas.width : window.innerWidth;
      const heightVal = canvas ? canvas.height : window.innerHeight;
      socket.send(JSON.stringify({
        type: 'TYPING_STRIKE',
        wordId: enemy.id,
        charIndex: charIndex,
        damage: scoreGained,
        x: letterX / widthVal,
        y: letterY / heightVal,
        wordFinished: wordFinished
      }));

      socket.send(JSON.stringify({
        type: 'UPDATE_SCORE',
        score: state.score,
        level: state.wave
      }));
    }
  };

  // Game Logic Tick
  const updateGame = () => {
    const state = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas || state.isLocalGameOver) return;

    if (state.isPaused) return;

    // Calculate delta time (dt) normalized to 60 FPS target (1 frame = 16.667ms)
    const now = performance.now();
    const elapsed = now - (state.lastFrameTime || now);
    state.lastFrameTime = now;
    const dt = Math.max(0.1, Math.min(3.0, elapsed / 16.667));

    const players = state.players || [];
    const isHost = !isMultiplayer || (players.find(p => p.socketId === socket?.id)?.isHost);

    // Shift colors of enemies targeted at dead/reviving players to active players
    if (isMultiplayer) {
      const activeColors = getActivePlayerColors();
      if (activeColors.length > 0) {
        state.enemies.forEach(enemy => {
          if (enemy.type !== 'boss_shield' && enemy.type !== 'meteor' && enemy.color && !activeColors.includes(enemy.color)) {
            const cIndex = getDeterministicIndex(enemy.id, activeColors.length);
            const newColor = activeColors[cIndex];
            enemy.color = newColor;
            
            if (enemy.wordQueue && enemy.wordQueue.length > 0) {
              enemy.wordQueue.forEach((qItem, qIdx) => {
                if (qItem && typeof qItem === 'object') {
                  const qIndex = getDeterministicIndex(enemy.id + '-' + qIdx, activeColors.length);
                  qItem.color = activeColors[qIndex];
                }
              });
            }
          }
        });
        
        // Also shift active boss words if active boss word color doesn't match active players
        if (state.bossObj && state.bossObj.words) {
          let bossColorChanged = false;
          state.bossObj.words.forEach(w => {
            if (w.color && !activeColors.includes(w.color)) {
              const wIndex = getDeterministicIndex(w.id, activeColors.length);
              w.color = activeColors[wIndex];
              bossColorChanged = true;
            }
          });
          if (bossColorChanged) {
            state.enemies.forEach(enemy => {
              if (enemy.type === 'boss_shield') {
                const matchingWord = state.bossObj.words.find(w => w.id === enemy.id);
                if (matchingWord) {
                  enemy.color = matchingWord.color;
                }
              }
            });
          }
        }
      }
    }

    // Update local revive timer
    if (state.isReviving && state.reviveTimeRemaining > 0) {
      state.reviveTimeRemaining -= 1;
      if (state.reviveTimeRemaining <= 0) {
        state.isReviving = false;
        state.health = 100;
        
        // Notify others of full recovery
        if (isMultiplayer && socket) {
          socket.send(JSON.stringify({
            type: 'PLAYER_REVIVED',
            playerId: socket.id
          }));
          socket.send(JSON.stringify({
            type: 'PLAYER_HIT',
            playerId: socket.id,
            health: 100
          }));
        }
        
        // Trigger a minimal green revival pulse ring
        state.reviveRingRadius = 1;
        state.reviveRingActive = true;
        const myX = getLocalShipX(canvas.width);
        createExplosion(myX, canvas.height - 80, '#22c55e', 14);
        GameAudio.play('shield_activate');
        
        setHudState(prev => ({ ...prev, health: 100 }));
      }
    }

    // Update teammate revive timers
    if (state.teammates) {
      state.teammates.forEach(m => {
        if (m.isReviving && m.reviveTimeRemaining > 0) {
          m.reviveTimeRemaining -= 1;
          if (m.reviveTimeRemaining <= 0) {
            m.isReviving = false;
            m.health = 100;
          }
        }
      });
    }

    // Update local revive ring
    if (state.reviveRingActive) {
      state.reviveRingRadius += 2.5; // expand speed
      if (state.reviveRingRadius > 60) {
        state.reviveRingActive = false;
      }
    }

    // Gradual health regeneration over time (2.0 HP per second)
    if (state.health < 100 && state.health > 0) {
      state.health = Math.min(100, state.health + (2.0 / 60)); // 2.0 HP/s at 60fps
      state.regenHudTimer = (state.regenHudTimer || 0) + 1;
      if (state.regenHudTimer >= 15) {
        state.regenHudTimer = 0;
        setHudState(prev => ({ ...prev, health: Math.round(state.health) }));
        if (isMultiplayer && socket) {
          socket.send(JSON.stringify({
            type: 'PLAYER_HIT',
            playerId: socket.id,
            health: state.health
          }));
        }
      }
    }

    // Decrement skill status clocks
    state.empFreezeTime = Math.max(0, state.empFreezeTime - 16.7);
    state.nebulaSlowTime = Math.max(0, state.nebulaSlowTime - 16.7);
    state.overclockTime = Math.max(0, state.overclockTime - 16.7);
    state.decoyTime = Math.max(0, state.decoyTime - 16.7);
    state.stabilizerTime = Math.max(0, state.stabilizerTime - 16.7);
    state.overdriveTime = Math.max(0, state.overdriveTime - 16.7);
    state.reflectorTime = Math.max(0, state.reflectorTime - 16.7);
    state.hologramTime = Math.max(0, state.hologramTime - 16.7);
    state.bossShieldTime = Math.max(0, state.bossShieldTime - 16.7);
    
    // Decrement frame-based combat timers
    if (state.jammedTimer && state.jammedTimer > 0) state.jammedTimer -= 1;
    if (state.empDrainedTimer && state.empDrainedTimer > 0) state.empDrainedTimer -= 1;

    // Update shield claim animations
    if (state.shieldClaims && state.shieldClaims.length > 0) {
      const targetX = window.innerWidth / 2;
      const targetY = window.innerHeight - 80;
      for (let i = state.shieldClaims.length - 1; i >= 0; i--) {
        const orb = state.shieldClaims[i];
        orb.progress += 0.015; // smooth travel LERP rate (approx 1.1 seconds)
        if (orb.progress >= 1.0) {
          state.shieldClaims.splice(i, 1);
          // Play plasma chime confirmation sound
          GameAudio.play('plasma'); 
          // Spark glowing blue impact ring at ship
          createExplosion(targetX, targetY, '#38bdf8', 12, false);
          // Cap maximum stored shields to 3, ignore additional claims
          state.bossShieldsCount = Math.min(3, (state.bossShieldsCount || 0) + 1);
          setBossShields(state.bossShieldsCount);
        }
      }
    }

    // Cooldown ticks (approx 1s accumulation)
    state.cooldownAccumulator = (state.cooldownAccumulator || 0) + 16.7;
    if (state.cooldownAccumulator >= 1000) {
      state.cooldownAccumulator -= 1000;
      let changed = false;
      state.cooldowns = state.cooldowns.map(c => {
        if (c > 0) {
          changed = true;
          return c - 1;
        }
        return 0;
      });
      if (changed) {
        setCooldowns([...state.cooldowns]);
      }

      // Sync status clocks to React state once a second
      setStatusClocks({
        overclock: Math.ceil(state.overclockTime / 1000),
        decoy: Math.ceil(state.decoyTime / 1000),
        nebula: Math.ceil(state.nebulaSlowTime / 1000),
        stabilizer: Math.ceil(state.stabilizerTime / 1000),
        overdrive: Math.ceil(state.overdriveTime / 1000),
        reflector: Math.ceil(state.reflectorTime / 1000),
        hologram: Math.ceil(state.hologramTime / 1000)
      });
      setBossShieldActiveTime(Math.ceil(state.bossShieldTime / 1000));
    }

    // Docking sequence animation ticker
    if (state.waveState === 'docking') {
      state.dockingTimer -= 1;
      state.dockingShipYOffset = Math.min(220, (state.dockingShipYOffset || 0) + 1.25);
      
      // Gradually decelerate parallax scrolling background stars
      state.scenery.forEach(item => {
        const factor = Math.max(0, state.dockingTimer / 180);
        item.y += item.speedMultiplier * (1 + state.wave * 0.08) * factor;
        item.rotation += item.rotationSpeed * factor;
      });

      if (state.dockingTimer <= 0) {
        // Reset timers and launch parent docked UI selection
        state.waveState = 'intro';
        state.dockingShipYOffset = 0;
        state.hasPuffedSteam = false;
        onDockStart(state.wave);
      }
      return;
    }

    // Shift background nebula colors smoothly
    state.nebulaColor.h += (state.targetNebulaColor.h - state.nebulaColor.h) * 0.01;
    state.nebulaColor.s += (state.targetNebulaColor.s - state.nebulaColor.s) * 0.01;
    state.nebulaColor.l += (state.targetNebulaColor.l - state.nebulaColor.l) * 0.01;

    // Tick down visual effects
    if (state.screenShake > 0) state.screenShake *= 0.9;
    if (state.flashFrame > 0) state.flashFrame -= 1;

    // Scroll scenery
    state.scenery.forEach(item => {
      item.y += item.speedMultiplier * (1 + state.wave * 0.08);
      item.rotation += item.rotationSpeed;
      if (item.y > canvas.height + item.size) {
        // Wrap to top and randomize horizontal position
        item.y = -item.size;
        const isLeft = Math.random() < 0.5;
        item.x = isLeft 
          ? Math.random() * (canvas.width * 0.18) 
          : canvas.width - Math.random() * (canvas.width * 0.18);
        item.rotation = Math.random() * Math.PI * 2;
      }
    });

    // Laser fading
    state.lasers.forEach(laser => {
      laser.alpha -= 0.1;
    });
    state.lasers = state.lasers.filter(laser => laser.alpha > 0);

    // Particles physics
    state.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha = Math.max(0, p.life / 60);
      p.life -= 1;
      if (p.type === 'chunk') {
        p.angle = (p.angle || 0) + (p.rotSpeed || 0.05);
      }
    });
    state.particles = state.particles.filter(p => p.life > 0);

    // If Wave Intro
    if (state.waveState === 'intro') {
      state.waveTransitionTimer -= 1;
      if (state.waveTransitionTimer <= 0) {
        state.waveState = 'playing';
        state.meteorShowerTriggered = false; // Reset meteor shower status
        state.lastSpawnTime = Date.now(); // Reset spawn timing on intro end to give clients sync headroom
        if (isHost && isPrime(state.wave) && state.wave % 10 !== 0) {
          if (Math.random() < 0.45) {
            spawnAnomalyMiniBoss();
          }
        }
      }
      return; // Skip spawning and enemy progression during intro banner
    }

    // Spawning Enemies (Authoritative Host generates spawns in co-op)
    
    if (isHost && state.waveState === 'playing') {
      // Random Meteor Shower trigger logic
      if (!state.bossObj && state.wave > 7 && state.wave % 10 !== 0 && !isPrime(state.wave)) {
        if (!state.meteorShowerTriggered && Math.random() < 0.00035) {
          state.meteorShowerTriggered = true;
          state.meteorShowerWarningTimer = 180; // 3 seconds warning alert
          GameAudio.play('meteor_warning');
          if (isMultiplayer && socket) {
            socket.send(JSON.stringify({
              type: 'METEOR_WARNING'
            }));
          }
        }
      }

      // Handle Meteor warning timer countdown
      if (state.meteorShowerWarningTimer && state.meteorShowerWarningTimer > 0) {
        state.meteorShowerWarningTimer -= 1;
        if (state.meteorShowerWarningTimer <= 0) {
          spawnMeteors();
        }
      }

      const now = Date.now();
      const spawnInterval = state.wave >= 100 ? 400 : Math.max(1500, 2950 - state.wave * 50); // Spawning speed scales up (caps at Wave 29)
      const totalToSpawn = state.wave >= 100 ? 999999 : state.waveTotalToSpawn;
      
      if (now - state.lastSpawnTime > spawnInterval && state.waveSpawnedCount < totalToSpawn) {
        spawnNewEnemyWave();
        state.lastSpawnTime = now;
      }

      // Check if all wave enemies spawned and cleared
      if (state.waveSpawnedCount >= state.waveTotalToSpawn && state.enemies.length === 0 && state.bullets.length === 0) {
        // Trigger Dreadnought Boss Fight on every 10th wave, or wave 100
        if (state.wave % 10 === 0 || state.wave === 100) {
          triggerBossWarning();
        } else if (state.wave % 5 === 0) {
          spawnMiniBossFight();
        } else {
          // Go to next wave or docking station
          handleWaveEndDetection();
        }
      }
    }

    // Boss Phase Spawner
    if (isHost && state.waveState === 'boss_fight' && state.bossObj) {
      const boss = state.bossObj;
      boss.shootTimer -= 1;
      
      if (boss.shootTimer <= 0) {
        // Shoot single letter bullets or colored minions
        const isMinion = Math.random() < 0.4;
        if (isMinion) {
          spawnBossMinions();
        } else {
          fireBossBullet();
        }
        boss.shootTimer = Math.max(60, 160 - state.wave * 10);
      }
    }

    // Mini-boss custom behaviors
    if (state.waveState === 'boss_fight' && state.bossObj && state.bossObj.type === 'mini_boss') {
      const boss = state.bossObj;
      
      if (isHost) {
        // Authoritative mini-boss logic for Host only
        // 1. Warp Spectre Teleportation
        if (boss.name === 'WARP SPECTRE') {
          boss.teleportTimer = (boss.teleportTimer || 0) + 1;
          if (boss.teleportTimer >= 200) { // ~3.3 seconds
            boss.teleportTimer = 0;
            const oldX = boss.x;
            boss.x = 100 + Math.random() * (canvas.width - 200);
            
            createExplosion(oldX, boss.y, '#38bdf8', 25, true);
            createExplosion(boss.x, boss.y, '#38bdf8', 25, true);
            GameAudio.play('laser', getPan(boss.x)); // warp teleport sound
            
            // Update words target positions
            boss.words.forEach(w => {
              const matchingEnemy = state.enemies.find(e => e.id === w.id);
              if (matchingEnemy) matchingEnemy.x = boss.x;
            });
          }
        }

        // 2. Thermobaric Devastator fire lanes random trigger
        if (boss.name === 'THERMOBARIC DEVASTATOR') {
          boss.fireTimer = (boss.fireTimer || 0) + 1;
          if (boss.fireTimer >= 240) { // ~4 seconds
            boss.fireTimer = 0;
            const lanes = ['left', 'center', 'right'];
            boss.targetFireLane = lanes[Math.floor(Math.random() * lanes.length)];
            boss.fireWarningTime = 90; // 1.5 seconds warning
            const laneXVal = getShipX(boss.targetFireLane, canvas.width);
            GameAudio.play('warning', getPan(laneXVal));
          }
        }

        // 3. EMP Void-Weaver lock active skill hotkeys timer
        if (boss.name === 'EMP VOID-WEAVER') {
          boss.empTimer = (boss.empTimer || 0) + 1;
          if (boss.empTimer >= 360) { // ~6 seconds
            boss.empTimer = 0;
            state.empDrainedTimer = 360; // 6 seconds EMP lockout
            GameAudio.play('emp');
            createExplosion(canvas.width / 2, canvas.height / 2, '#fbbf24', 40, true);
          }
        }

        // 4. Mirage Phantom Decoy Mirror clones
        if (boss.name === 'MIRAGE PHANTOM') {
          boss.decoyTimer = (boss.decoyTimer || 0) + 1;
          if (boss.decoyTimer >= 400) { // ~6.6 seconds
            boss.decoyTimer = 0;
            
            // Clear old decoy clones
            state.enemies = state.enemies.filter(e => e.type !== 'mirage_decoy');
            
            // Spawn 2 decoy clones
            const offsets = [-180, 180];
            const newDecoys = [];
            offsets.forEach((ox, i) => {
              const cloneX = Math.max(80, Math.min(canvas.width - 80, boss.x + ox));
              const decoy = {
                id: `mirage-decoy-${i}-${Math.random().toString(36).substring(2, 9)}`,
                word: getWordForEnemy('boss', state.wave, state.usedWords),
                color: 'purple',
                x: cloneX,
                y: boss.y,
                speed: 0,
                targetIndex: 0,
                type: 'mirage_decoy'
              };
              state.enemies.push(decoy);
              newDecoys.push(decoy);
            });
            GameAudio.play('laser');

            if (isMultiplayer && socket) {
              const normalizedDecoys = newDecoys.map(d => ({
                ...d,
                x: d.x / canvas.width,
                y: d.y / canvas.height,
                speed: d.speed / canvas.height
              }));
              socket.send(JSON.stringify({
                type: 'SPAWN_ENEMIES',
                enemies: normalizedDecoys,
                hostId: socket.id
              }));
            }
          }
        }
      }

      // Shared countdowns and local action triggers for both Host and Guest
      if (boss.name === 'THERMOBARIC DEVASTATOR' && boss.targetFireLane) {
        if (boss.fireWarningTime > 0) {
          boss.fireWarningTime -= 1;
          if (boss.fireWarningTime <= 0) {
            boss.fireActiveTime = 180; // 3 seconds active
            const laneXVal = getShipX(boss.targetFireLane, canvas.width);
            GameAudio.play('explosionLarge', getPan(laneXVal));
          }
        } else if (boss.fireActiveTime > 0) {
          boss.fireActiveTime -= 1;
          
          // Damage local player ship if in fire lane
          const localPosition = isMultiplayer 
            ? players.find(p => p.socketId === socket?.id)?.position || 'center' 
            : 'center';
          if (localPosition === boss.targetFireLane) {
            if (boss.fireActiveTime % 10 === 0) {
              takeDamage(1.5);
            }
          }
          if (boss.fireActiveTime <= 0) {
            boss.targetFireLane = null;
          }
        }
      }
    }

    // Shield Linker behavior: link to another enemy ship
    state.enemies.forEach(e => { e.isInvulnerable = false; });
    state.enemies.forEach(e => {
      if (e.type === 'shield_linker') {
        if (!isMultiplayer || isHost) {
          if (!e.shieldLinkedEnemyId || !state.enemies.some(target => target.id === e.shieldLinkedEnemyId)) {
            // Find a target that is NOT a linker, boss, or anomaly
            const candidates = state.enemies.filter(cand => cand.id !== e.id && cand.type !== 'shield_linker' && cand.type !== 'boss' && cand.type !== 'anomaly');
            if (candidates.length > 0) {
              e.shieldLinkedEnemyId = candidates[Math.floor(Math.random() * candidates.length)].id;
              GameAudio.play('shield_activate');
            } else {
              e.shieldLinkedEnemyId = null;
            }
          }
        }
        if (e.shieldLinkedEnemyId) {
          const target = state.enemies.find(cand => cand.id === e.shieldLinkedEnemyId);
          if (target) {
            target.isInvulnerable = true;
          }
        }
      }
    });

    // Enemies movement
    const baseSpeedMultiplier = state.wave >= 100 ? 5.5 : (1.172 + (state.wave * 0.028)); // Speed scales up with waves (75% adjustment for wave 80 limit)
    
    let multiplayerDifficulty = 1.0;
    if (isMultiplayer && players) {
      if (players.length === 2) {
        multiplayerDifficulty = 1.20; // 20% harder
      } else if (players.length >= 3) {
        multiplayerDifficulty = 1.40; // 40% harder
      }
    }
    
    state.enemies.forEach(enemy => {
      // Kamikaze timer ticking
      if (enemy.type === 'kamikaze') {
        if (!enemy.isCharged) {
          enemy.kamikazeTimer = (enemy.kamikazeTimer !== undefined ? enemy.kamikazeTimer : 240) - 1; // 4 seconds
          if (enemy.kamikazeTimer <= 0) {
            enemy.isCharged = true;
            enemy.speed = 3.6; // Fast charge downwards!
            if (!isMultiplayer) {
              enemy.color = 'red';
            }
          }
        }
      }

      // Anomaly active combat threats
      if (enemy.type === 'anomaly') {
        // 1. Distortion Pulsar
        if (!enemy.pulseRings) enemy.pulseRings = [];
        enemy.pulseTimer = (enemy.pulseTimer || 0) + 1;
        if (enemy.pulseTimer >= 260) {
          enemy.pulseTimer = 0;
          enemy.pulseRings.push({ radius: 10, collided: false });
          GameAudio.play('anomaly_pulse'); // Shockwave sound
        }

        // Get player ship coordinates
        const shipX = getLocalShipX(canvas.width);
        const shipY = canvas.height - 80;

        // Update rings
        enemy.pulseRings.forEach(ring => {
          ring.radius += 2.4;
          const distToPlayer = Math.hypot(shipX - enemy.x, shipY - enemy.y);
          if (Math.abs(ring.radius - distToPlayer) < 8 && !ring.collided) {
            ring.collided = true;
            state.jammedTimer = 72; // Jam controls for 1.2 seconds
            createExplosion(shipX, shipY, '#8b5cf6', 15, true);
            GameAudio.play('anomaly_pulse');
          }
        });
        enemy.pulseRings = enemy.pulseRings.filter(r => r.radius < 400);

        // 2. Word Scrambler
        enemy.scrambleTimer = (enemy.scrambleTimer || 0) + 1;
        if (enemy.scrambleTimer >= 240) {
          enemy.scrambleTimer = 0;
          if (!isMultiplayer || isHost) {
            const candidates = state.enemies.filter(cand => cand.id !== enemy.id && cand.type !== 'shield_linker' && cand.type !== 'boss' && cand.word && cand.word.length > 3);
            if (candidates.length > 0) {
              const target = candidates[Math.floor(Math.random() * candidates.length)];
              const chars = target.word.split('');
              const i1 = Math.floor(Math.random() * chars.length);
              let i2 = Math.floor(Math.random() * chars.length);
              if (i1 === i2) i2 = (i1 + 1) % chars.length;
              
              // Swap
              const tmp = chars[i1];
              chars[i1] = chars[i2];
              chars[i2] = tmp;
              target.word = chars.join('');
              
              createExplosion(target.x, target.y, '#8b5cf6', 10, true);
              GameAudio.play('laser'); // Scramble glitch sound
            }
          }
        }
      }

      // Cloaker Active Camouflage Cycle
      if (enemy.type === 'stealth_cloaker') {
        const cycle = (Date.now() % 6000); // 6s cycle
        let cloakDuration = 2000;
        if (state.wave >= 35) {
          cloakDuration = 3200;
        } else if (state.wave >= 21) {
          cloakDuration = 2600;
        }
        
        const isCloakingPhase = cycle < cloakDuration;
        let targetOpacity = isCloakingPhase ? 0.05 : 1.0;
        
        if (enemy.revealTimer && enemy.revealTimer > 0) {
          enemy.revealTimer -= 1;
          targetOpacity = 1.0;
        }
        
        enemy.opacity = enemy.opacity !== undefined ? enemy.opacity : 1.0;
        enemy.opacity += (targetOpacity - enemy.opacity) * 0.1;
      }

      // Replicator Split Clock
      if (enemy.type === 'replicator') {
        let maxFrames = 390; // 6.5s
        if (state.wave >= 46) maxFrames = 240; // 4.0s
        else if (state.wave >= 26) maxFrames = 300; // 5.0s
        
        enemy.splitMaxTimer = maxFrames;
        enemy.splitTimer = (enemy.splitTimer !== undefined ? enemy.splitTimer : maxFrames) - 1;
        
        if (enemy.splitTimer <= 0 && isHost) {
          // Trigger split!
          const id1 = Math.random().toString(36).substring(2, 9);
          const id2 = Math.random().toString(36).substring(2, 9);
          
          const childType = state.wave >= 46 ? 'interceptor' : 'drone';
          const childLen = state.wave >= 26 ? 4 : 3;
          
          const rawWord1 = getWordForEnemy(childType, state.wave, state.usedWords) || 'default';
          const word1 = rawWord1.substring(0, childLen);
          const rawWord2 = getWordForEnemy(childType, state.wave, state.usedWords) || 'default';
          const word2 = rawWord2.substring(0, childLen);
          
          const childSpeed = enemy.speed * 1.35;
          const leftX = Math.max(canvas.width * 0.22, enemy.x - 38);
          const rightX = Math.min(canvas.width * 0.78, enemy.x + 38);
          
          const child1 = {
            id: id1,
            word: word1,
            wordQueue: [],
            color: enemy.color,
            x: leftX,
            y: enemy.y + 10,
            speed: childSpeed,
            targetIndex: 0,
            type: childType,
            shootCooldown: 150,
            movementPattern: 'straight',
            patternAge: 0,
            dirMultiplier: Math.random() < 0.5 ? 1 : -1
          };
          
          const child2 = {
            id: id2,
            word: word2,
            wordQueue: [],
            color: enemy.color,
            x: rightX,
            y: enemy.y + 10,
            speed: childSpeed,
            targetIndex: 0,
            type: childType,
            shootCooldown: 150,
            movementPattern: 'straight',
            patternAge: 0,
            dirMultiplier: Math.random() < 0.5 ? 1 : -1
          };
          
          if (isMultiplayer && socket) {
            socket.send(JSON.stringify({
              type: 'REPLICATOR_SPLIT',
              parentId: enemy.id,
              child1: {
                ...child1,
                x: child1.x / canvas.width,
                y: child1.y / canvas.height,
                speed: child1.speed / canvas.height
              },
              child2: {
                ...child2,
                x: child2.x / canvas.width,
                y: child2.y / canvas.height,
                speed: child2.speed / canvas.height
              }
            }));
          }
          
          createExplosion(enemy.x, enemy.y, getColorHex(enemy.color), 18, true);
          GameAudio.play('explosionSmall', getPan(enemy.x));
          
          enemy.splitTriggered = true;
          enemy.child1 = child1;
          enemy.child2 = child2;
        }
      }

      // Decrement status timers
      if (enemy.freezeTime > 0) enemy.freezeTime -= 16.7 * dt;
      if (enemy.slowTime > 0) enemy.slowTime -= 16.7 * dt;
      if (enemy.anchoredTime > 0) enemy.anchoredTime -= 16.7 * dt;

      let speedFactor = 1.0;
      if (enemy.freezeTime > 0 || enemy.anchoredTime > 0) {
        speedFactor = 0;
      } else if (enemy.slowTime > 0) {
        speedFactor = enemy.slowMultiplier || 0.5;
      }

      const pat = enemy.movementPattern || 'straight';
      if (!isHost) {
        if (enemy.physicsY === undefined) {
          enemy.physicsX = enemy.x;
          enemy.physicsY = enemy.y;
          enemy.offsetX = 0;
          enemy.offsetY = 0;
        }

        // Progress the physical coordinate forward using the local physics equations
        enemy.physicsY += enemy.speed * baseSpeedMultiplier * multiplayerDifficulty * speedFactor * dt;
        if (speedFactor > 0) {
          enemy.patternAge = (enemy.patternAge || 0) + 1 * dt;
          
          if (enemy.type === 'drone' && pat !== 'straight') {
            enemy.physicsX += Math.sin(enemy.patternAge * 0.04) * 0.65 * speedFactor * dt;
          } else if (pat === 'sine') {
            enemy.physicsX += (enemy.dirMultiplier || 1) * Math.sin(enemy.physicsY * 0.02) * 1.8 * speedFactor * dt;
          } else if (pat === 'cosine') {
            enemy.physicsX += (enemy.dirMultiplier || 1) * Math.cos(enemy.physicsY * 0.02) * 1.8 * speedFactor * dt;
          } else if (pat === 'zigzag') {
            const zigDir = Math.floor(enemy.patternAge / 55) % 2 === 0 ? 1 : -1;
            enemy.physicsX += (enemy.dirMultiplier || 1) * zigDir * 1.6 * speedFactor * dt;
          } else if (pat === 'drift') {
            enemy.physicsX += (enemy.dirMultiplier || 1) * Math.sin(enemy.patternAge * 0.007) * 2.2 * speedFactor * dt;
          }
          
          enemy.physicsX = Math.max(50, Math.min(canvas.width - 50, enemy.physicsX));
        }

        // Decay visual offsets smoothly to zero
        if (enemy.offsetX !== undefined) enemy.offsetX *= Math.max(0, 1 - 0.18 * dt);
        if (enemy.offsetY !== undefined) enemy.offsetY *= Math.max(0, 1 - 0.18 * dt);

        // Visual coordinates = physics coordinates + visually blended error offset
        enemy.x = enemy.physicsX + (enemy.offsetX || 0);
        enemy.y = enemy.physicsY + (enemy.offsetY || 0);
      } else {
        // Host (or single player) authoritative physics
        enemy.y += enemy.speed * baseSpeedMultiplier * multiplayerDifficulty * speedFactor * dt;
        if (speedFactor > 0) {
          enemy.patternAge = (enemy.patternAge || 0) + 1 * dt;
          if (enemy.type === 'drone' && pat !== 'straight') {
            enemy.x += Math.sin(enemy.patternAge * 0.04) * 0.65 * speedFactor * dt;
          } else if (pat === 'sine') {
            enemy.x += (enemy.dirMultiplier || 1) * Math.sin(enemy.y * 0.02) * 1.8 * speedFactor * dt;
          } else if (pat === 'cosine') {
            enemy.x += (enemy.dirMultiplier || 1) * Math.cos(enemy.y * 0.02) * 1.8 * speedFactor * dt;
          } else if (pat === 'zigzag') {
            const zigDir = Math.floor(enemy.patternAge / 55) % 2 === 0 ? 1 : -1;
            enemy.x += (enemy.dirMultiplier || 1) * zigDir * 1.6 * speedFactor * dt;
          } else if (pat === 'drift') {
            enemy.x += (enemy.dirMultiplier || 1) * Math.sin(enemy.patternAge * 0.007) * 2.2 * speedFactor * dt;
          }
          enemy.x = Math.max(50, Math.min(canvas.width - 50, enemy.x));
        }
      }

      // Drone subtle green trailing particles
      if (enemy.type === 'drone' && speedFactor > 0 && Math.random() < 0.08) {
        state.particles.push({
          x: enemy.x,
          y: enemy.y - 8,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.2 - Math.random() * 0.3,
          size: 1.0 + Math.random() * 1.2,
          color: 'rgba(34, 197, 94, 0.28)', // soft green
          alpha: 0.65,
          life: 12 + Math.random() * 12
        });
      }

      // Kamikaze fuel exhaust sparks
      if (enemy.type === 'kamikaze' && speedFactor > 0 && Math.random() < 0.22) {
        const isCharged = enemy.isCharged;
        state.particles.push({
          x: enemy.x + (Math.random() - 0.5) * 4,
          y: enemy.y - 8,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -0.6 - Math.random() * 0.8,
          size: isCharged ? (1.5 + Math.random() * 1.5) : (1.0 + Math.random() * 1.0),
          color: isCharged ? 'rgba(239, 68, 68, 0.38)' : 'rgba(249, 115, 22, 0.28)', // soft red/orange
          alpha: 0.75,
          life: 8 + Math.random() * 12
        });
      }

      // Cruiser heavy dark-purple plasma smoke
      if (enemy.type === 'cruiser' && speedFactor > 0 && Math.random() < 0.18) {
        state.particles.push({
          x: enemy.x + (Math.random() - 0.5) * 8,
          y: enemy.y - 10,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -0.3 - Math.random() * 0.3,
          size: 1.8 + Math.random() * 2.2,
          color: 'rgba(168, 85, 247, 0.18)', // soft dark purple
          alpha: 0.55,
          life: 20 + Math.random() * 15
        });
      }

      // Meteor fiery trailing particle emission
      if (enemy.type === 'meteor' && speedFactor > 0 && Math.random() < 0.35) {
        state.particles.push({
          x: enemy.x + (Math.random() - 0.5) * 6,
          y: enemy.y - 4,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -enemy.speed * 0.4 - Math.random() * 1.0,
          size: 1 + Math.random() * 3.5,
          color: Math.random() < 0.55 ? 'rgba(249, 115, 22, 0.4)' : Math.random() < 0.45 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(251, 191, 36, 0.35)',
          alpha: 0.75,
          life: 15 + Math.random() * 20
        });
      }
      
      if (speedFactor > 0) {
        enemy.patternAge = (enemy.patternAge || 0) + 1;
        
        if (pat === 'sine') {
          enemy.x += (enemy.dirMultiplier || 1) * Math.sin(enemy.y * 0.02) * 1.8 * speedFactor;
        } else if (pat === 'cosine') {
          enemy.x += (enemy.dirMultiplier || 1) * Math.cos(enemy.y * 0.02) * 1.8 * speedFactor;
        } else if (pat === 'zigzag') {
          const zigDir = Math.floor(enemy.patternAge / 55) % 2 === 0 ? 1 : -1;
          enemy.x += (enemy.dirMultiplier || 1) * zigDir * 1.6 * speedFactor;
        } else if (pat === 'drift') {
          enemy.x += (enemy.dirMultiplier || 1) * Math.sin(enemy.patternAge * 0.007) * 2.2 * speedFactor;
        }
        
        // Keep ships inside canvas bounds
        enemy.x = Math.max(50, Math.min(canvas.width - 50, enemy.x));
      }

      // Cruiser shooting bullets logic
      if (enemy.type === 'cruiser' && isHost) {
        const isFrozen = (enemy.freezeTime && enemy.freezeTime > 0) || (enemy.anchoredTime && enemy.anchoredTime > 0);
        if (!isFrozen) {
          enemy.shootCooldown = (enemy.shootCooldown || 180) - 1;
          if (enemy.shootCooldown <= 0) {
            fireGeneralBullet(enemy);
            enemy.shootCooldown = state.wave >= 100 ? 15 : (180 + Math.random() * 120); // Unbeatable bullet storm
          }
        }
      }

      // Collision check with bottom border
      const thresholdY = canvas.height - 120;
      if (enemy.y >= thresholdY) {
        // Damage player: Kamikazes deal 35, normal enemies deal 20
        const dmg = enemy.type === 'kamikaze' ? 35 : 20;
        const explColor = enemy.type === 'kamikaze' ? '#ef4444' : '#ff3366';
        
        if (isMultiplayer && players && players.length > 0) {
          const myPlayer = players.find(p => p.socketId === socket?.id);
          const myColor = myPlayer ? myPlayer.color : shipColor;
          
          if (enemy.color === myColor) {
            takeDamage(dmg); // Direct hit!
          } else {
            takeDamage(dmg * 0.5); // 50% splash damage to teammate!
          }
        } else {
          takeDamage(dmg);
        }
        // Destroy enemy
        state.enemies = state.enemies.filter(e => e.id !== enemy.id);
        handleEnemyCompletion(enemy.id);
        if (state.activeWordId === enemy.id) state.activeWordId = null;
        createExplosion(enemy.x, enemy.y, explColor, dmg, true);
        GameAudio.play('explosionLarge');
      }
    });

    // Handle Replicator splits after physics iteration to avoid collection mutation crash
    const replicatedChildren = [];
    state.enemies.forEach(enemy => {
      if (enemy.splitTriggered && enemy.child1 && enemy.child2) {
        replicatedChildren.push(enemy.child1, enemy.child2);
      }
    });
    if (replicatedChildren.length > 0) {
      state.enemies = state.enemies.filter(e => !e.splitTriggered);
      state.enemies.push(...replicatedChildren);
    }

    state.bullets.forEach(bullet => {
      let bulletFactor = 1.0;
      if (state.chronosDriveTime > 0) {
        bulletFactor = 0.3;
      }
      
      let speedFactor = 1.0;
      if (bullet.type === 'temporal') {
        speedFactor = 0.35 + Math.sin(Date.now() / 140 + bullet.y * 0.04) * 0.65;
      }

      // If decoy is active, override velocity to steer towards the decoy position on the left
      if (state.decoyTime > 0) {
        const destX = window.innerWidth * 0.1;
        const destY = window.innerHeight - 80;
        const angle = Math.atan2(destY - bullet.y, destX - bullet.x);
        bullet.vx = Math.cos(angle) * bullet.speed;
        bullet.vy = Math.sin(angle) * bullet.speed;
      }

      if (!isHost) {
        if (bullet.physicsY === undefined) {
          bullet.physicsX = bullet.x;
          bullet.physicsY = bullet.y;
          bullet.offsetX = 0;
          bullet.offsetY = 0;
        }

        // Progress the physical coordinate forward using velocity equations
        if (bullet.vx !== undefined && bullet.vy !== undefined) {
          bullet.physicsX += bullet.vx * baseSpeedMultiplier * multiplayerDifficulty * bulletFactor * speedFactor * dt;
          bullet.physicsY += bullet.vy * baseSpeedMultiplier * multiplayerDifficulty * bulletFactor * speedFactor * dt;
        } else {
          bullet.physicsY += bullet.speed * baseSpeedMultiplier * multiplayerDifficulty * bulletFactor * speedFactor * dt;
        }

        // Decay visual offsets smoothly to zero
        if (bullet.offsetX !== undefined) bullet.offsetX *= Math.max(0, 1 - 0.18 * dt);
        if (bullet.offsetY !== undefined) bullet.offsetY *= Math.max(0, 1 - 0.18 * dt);

        // Visual coordinates = physics coordinates + visually blended error offset
        bullet.x = bullet.physicsX + (bullet.offsetX || 0);
        bullet.y = bullet.physicsY + (bullet.offsetY || 0);
      } else {
        // Host authoritative physics
        if (bullet.vx !== undefined && bullet.vy !== undefined) {
          bullet.x += bullet.vx * baseSpeedMultiplier * multiplayerDifficulty * bulletFactor * speedFactor * dt;
          bullet.y += bullet.vy * baseSpeedMultiplier * multiplayerDifficulty * bulletFactor * speedFactor * dt;
        } else {
          bullet.y += bullet.speed * baseSpeedMultiplier * multiplayerDifficulty * bulletFactor * speedFactor * dt;
        }
      }

      // Hit bottom check
      const thresholdY = canvas.height - 100;
      if (bullet.y >= thresholdY) {
        if (state.reflectorTime > 0) {
          // Reflect back to destroy the closest enemy
          if (state.enemies.length > 0) {
            const closest = [...state.enemies].sort((a, b) => b.y - a.y)[0];
            closest.word = '';
            handleEnemyKill(closest);
          }
          state.bullets = state.bullets.filter(b => b.id !== bullet.id);
        } else if (state.shieldActive) {
          // Tactical shield absorbs the hit
          state.shieldActive = false;
          createExplosion(bullet.x, bullet.y, '#a3e635', 15, true);
          state.bullets = state.bullets.filter(b => b.id !== bullet.id);
        } else {
          // Bullet hit a ship -> 50 damage (2-hit survival limit)
          if (isMultiplayer && players && players.length > 0) {
            let closestPlayer = null;
            let minDistance = Infinity;
            players.forEach(p => {
              const shipTargetX = getShipX(p.position, canvas.width);
              const dist = Math.abs(bullet.x - shipTargetX);
              if (dist < minDistance) {
                minDistance = dist;
                closestPlayer = p;
              }
            });
            
            const myPlayer = players.find(p => p.socketId === socket?.id);
            const baseDmg = bullet.damage || 50;
            if (closestPlayer && myPlayer && closestPlayer.socketId === myPlayer.socketId) {
              takeDamage(baseDmg); // Direct hit!
            } else {
              takeDamage(baseDmg * 0.5); // Teammate splash damage!
            }
          } else {
            takeDamage(bullet.damage || 50);
          }
          state.bullets = state.bullets.filter(b => b.id !== bullet.id);
        }
      }
    });

    // Periodic synchronization from Host to Guest to prevent drift (8 frames = ~130ms)
    if (isMultiplayer && isHost) {
      state.syncTimer = (state.syncTimer || 0) + 1;
      if (state.syncTimer >= 8) {
        state.syncTimer = 0;
        const enemyPositions = state.enemies.map(e => ({
          id: e.id,
          x: e.x / canvas.width,
          y: e.y / canvas.height,
          word: e.word,
          shieldLinkedEnemyId: e.shieldLinkedEnemyId
        }));
        const bulletPositions = state.bullets.map(b => ({ id: b.id, x: b.x / canvas.width, y: b.y / canvas.height }));
        const bossData = state.bossObj ? {
          x: state.bossObj.x / canvas.width,
          y: state.bossObj.y / canvas.height,
          targetFireLane: state.bossObj.targetFireLane,
          fireWarningTime: state.bossObj.fireWarningTime,
          fireActiveTime: state.bossObj.fireActiveTime,
          empTimer: state.bossObj.empTimer
        } : null;
        socket.send(JSON.stringify({
          type: 'SYNC_POSITIONS',
          enemies: enemyPositions,
          bullets: bulletPositions,
          boss: bossData
        }));
      }
    }
    // Update procedural music theme and tempo targets based on combat intensity
    if (state.waveState === 'boss_fight' && state.bossObj) {
      const bName = state.bossObj.name;
      if (bName === 'VOID EMPEROR') {
        GameAudio.setMusicTheme('boss_void_emperor');
      } else if (bName === 'SINGULARITY VOID') {
        GameAudio.setMusicTheme('boss_singularity');
      } else {
        GameAudio.setMusicTheme('boss_dreadnought');
      }
      GameAudio.setMusicTempoTarget(1.22);
      GameAudio.setMusicVolumeTarget(0.85); // slight volume swell for boss intensity
    } else if (state.enemies.some(e => e.type === 'anomaly')) {
      GameAudio.setMusicTheme('miniboss');
      GameAudio.setMusicTempoTarget(1.15);
      GameAudio.setMusicVolumeTarget(0.8);
    } else {
      GameAudio.setMusicTheme('ingame');
      
      // Calculate typing intensity based on streak & warnings
      let tempo = 1.0;
      let volume = 0.7;
      
      if (state.waveState === 'boss_warning') {
        tempo = 1.15;
        volume = 0.85;
      } else if (state.meteorShowerTimer > 0) {
        tempo = 1.12;
        volume = 0.78;
      } else if (state.streak >= 40) {
        tempo = 1.075; // 7.5% speedup
        volume = 0.77;
      } else if (state.streak >= 30) {
        tempo = 1.05; // 5% speedup
        volume = 0.74;
      } else if (state.streak >= 20) {
        tempo = 1.025; // 2.5% speedup
        volume = 0.72;
      }
      
      GameAudio.setMusicTempoTarget(tempo);
      GameAudio.setMusicVolumeTarget(volume);
    }
  };

  const spawnAnomalyMiniBoss = () => {
    const state = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const players = state.players || [];
    // Only spawn once per prime level!
    if (state.enemies.some(e => e.type === 'anomaly')) return;
    
    const word = getWordForEnemy('anomaly', state.wave, state.usedWords);
    const enemyId = 'anomaly';
    
    let anomalyColor = 'purple';
    if (isMultiplayer) {
      const activeColors = getActivePlayerColors();
      if (activeColors.length > 0) {
        anomalyColor = activeColors[Math.floor(Math.random() * activeColors.length)];
      } else {
        anomalyColor = shipColor;
      }
    }

    const anomalyEnemy = {
      id: enemyId,
      word,
      wordQueue: [],
      color: anomalyColor,
      x: canvas.width / 2,
      y: 120, // hover at upper height
      speed: 0.05,
      targetIndex: 0,
      type: 'anomaly',
      shootCooldown: 140
    };

    state.enemies.push(anomalyEnemy);
    
    state.anomalyWarningTimer = 180; // 3 seconds banner alert
    GameAudio.play('emp'); // alert sound

    if (isMultiplayer && socket) {
      const normalizedEnemy = {
        ...anomalyEnemy,
        x: anomalyEnemy.x / canvas.width,
        y: anomalyEnemy.y / canvas.height,
        speed: anomalyEnemy.speed / canvas.height
      };
      socket.send(JSON.stringify({
        type: 'SPAWN_ENEMIES',
        enemies: [normalizedEnemy],
        hostId: socket.id
      }));
      socket.send(JSON.stringify({
        type: 'ANOMALY_WARNING'
      }));
    }
  };

  const spawnMeteors = () => {
    const state = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const count = 4 + Math.floor(Math.random() * 3); // 4 to 6 meteors
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const newMeteors = [];
    
    for (let i = 0; i < count; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const x = canvas.width * 0.15 + Math.random() * (canvas.width * 0.7);
      const speed = 2.0 + Math.random() * 1.5;
      
      const meteor = {
        id: `meteor-${Math.random().toString(36).substring(2, 9)}`,
        word: char,
        wordQueue: [],
        color: '#ff781e',
        x,
        y: -50 - (i * 45),
        speed,
        targetIndex: 0,
        type: 'meteor',
        seed: Math.random() * Math.PI * 2
      };
      state.enemies.push(meteor);
      newMeteors.push(meteor);
    }

    if (isMultiplayer && socket) {
      const normalizedMeteors = newMeteors.map(m => ({
        ...m,
        x: m.x / canvas.width,
        y: m.y / canvas.height,
        speed: m.speed / canvas.height
      }));
      socket.send(JSON.stringify({
        type: 'SPAWN_ENEMIES',
        enemies: normalizedMeteors,
        hostId: socket.id
      }));
    }
  };

  // Host spawns standard wave enemies
  const spawnNewEnemyWave = () => {
    const state = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const players = state.players || [];
    const spawnCount = Math.min(
      Math.random() < 0.6 ? 1 : 2, 
      state.waveTotalToSpawn - state.waveSpawnedCount
    );

    const newEnemies = [];

    for (let i = 0; i < spawnCount; i++) {
      // Determine enemy class
      let type = 'drone';
      let speed = 0.5 + Math.random() * 0.3;
      let hp = 1;
      
      const rng = Math.random();
      const isKamikazeWave = state.wave >= 5;
      const kamikazeChance = isKamikazeWave ? (state.wave < 40 ? 0.06 : 0.11) : 0.0; // Reduced spawn chance by 2% (0.08->0.06, 0.13->0.11)

      if (state.wave >= 16 && rng > 0.96) {
        type = 'replicator';
        speed = 0.45 + Math.random() * 0.15;
      } else if (state.wave >= 12 && rng > 0.91 && rng <= 0.96) {
        type = 'stealth_cloaker';
        speed = 0.5 + Math.random() * 0.2;
      } else if (state.wave >= 11 && rng > 0.84 && rng <= 0.91) {
        type = 'shield_linker';
        speed = 0.4 + Math.random() * 0.15;
      } else if (state.wave >= 7 && rng > 0.76 && rng <= 0.84) {
        type = 'cruiser'; // General
        speed = 0.27 + Math.random() * 0.18; // Speed reduced by 10% (0.3 -> 0.27, 0.2 -> 0.18)
        hp = 2;
      } else if (isKamikazeWave && rng > 0.70 - kamikazeChance && rng <= 0.70) {
        type = 'kamikaze';
        const waveScale = Math.min(1.0, (state.wave - 5) / 20); // 0.0 at wave 5, scaling to 1.0 at wave 25+
        speed = ((0.7 + waveScale * 0.6) + Math.random() * (0.2 + waveScale * 0.1)) * 0.8; // Speed reduced by 20%
      } else if (state.wave >= 3 && rng > 0.70 - kamikazeChance - 0.22 && rng <= 0.70 - kamikazeChance) {
        type = 'interceptor'; // Elite
        speed = 0.9 + Math.random() * 0.4;
      }

      if (state.wave >= 100) {
        hp = 999; // Mathematical impossibility
        speed = 2.5 + Math.random() * 1.5;
      }

      // In co-op, assign player color targets using a non-predictive Shuffled Bag approach.
      // This guarantees an equal balance of spawns across active teammates over a small window.
      let color;
      if (isMultiplayer) {
        color = shipColor;
        const activeColors = getActivePlayerColors();
        if (activeColors.length > 0) {
          const hasInactiveColor = state.colorSpawnBag && state.colorSpawnBag.some(c => !activeColors.includes(c));
          if (hasInactiveColor || !state.colorSpawnBag || state.colorSpawnBag.length === 0) {
            const tempBag = [];
            const repetitions = activeColors.length === 2 ? 3 : 2;
            for (let r = 0; r < repetitions; r++) {
              tempBag.push(...activeColors);
            }
            // Fisher-Yates Shuffle
            for (let j = tempBag.length - 1; j > 0; j--) {
              const k = Math.floor(Math.random() * (j + 1));
              [tempBag[j], tempBag[k]] = [tempBag[k], tempBag[j]];
            }
            state.colorSpawnBag = tempBag;
          }
          color = state.colorSpawnBag.pop() || shipColor;
        }
      } else {
        if (type === 'drone') color = 'orange';
        else if (type === 'interceptor') color = 'magenta';
        else if (type === 'cruiser') color = 'gold';
        else if (type === 'kamikaze') color = 'red';
        else if (type === 'shield_linker') color = 'blue';
        else color = 'purple';
      }

      const word = getWordForEnemy(type, state.wave, state.usedWords);
      const enemyId = Math.random().toString(36).substring(2, 9);
      
      let wordQueue = [];
      if (type === 'cruiser') {
        // Generals have 2 to 3 words total (so 1 to 2 extra in queue)
        const totalWords = Math.random() < 0.5 ? 2 : 3;
        for (let w = 0; w < totalWords - 1; w++) {
          let wColor = color;
          if (isMultiplayer) {
            const activeColors = getActivePlayerColors();
            if (activeColors.length > 0) {
              wColor = activeColors[Math.floor(Math.random() * activeColors.length)];
            }
          } else {
            wColor = 'gold';
          }
          wordQueue.push({
            word: getWordForEnemy('cruiser', state.wave, state.usedWords),
            color: wColor
          });
        }
      }

      // Determine spawn column (keep within central 60% of screen)
      const x = canvas.width * 0.25 + Math.random() * (canvas.width * 0.5);

      // Choose movement pattern based on chances: 40% straight for common, 20% straight for elite
      const isElite = type === 'interceptor' || type === 'shield_linker' || type === 'anomaly';
      const rPat = Math.random();
      let pattern = 'straight';
      if (isElite) {
        if (rPat < 0.20) pattern = 'straight';
        else if (rPat < 0.45) pattern = 'sine';
        else if (rPat < 0.65) pattern = 'cosine';
        else if (rPat < 0.85) pattern = 'zigzag';
        else pattern = 'drift';
      } else {
        if (rPat < 0.40) pattern = 'straight';
        else if (rPat < 0.60) pattern = 'sine';
        else if (rPat < 0.75) pattern = 'cosine';
        else if (rPat < 0.90) pattern = 'zigzag';
        else pattern = 'drift';
      }

      const enemy = {
        id: enemyId,
        word,
        wordQueue,
        color,
        x,
        y: -30,
        speed,
        targetIndex: 0,
        type,
        shootCooldown: 150,
        movementPattern: pattern,
        patternAge: 0,
        dirMultiplier: Math.random() < 0.5 ? 1 : -1
      };

      // Apply Nebula Veil slow if active at spawn time
      if (state.nebulaSlowTime > 0) {
        let multiplier = 0.5; // Drone: 50% slow
        if (type === 'interceptor') multiplier = 0.625; // 37.5% slow
        else if (type === 'cruiser') multiplier = 0.75; // 25% slow
        else if (type === 'boss') multiplier = 0.875; // 12.5% slow
        enemy.slowMultiplier = multiplier;
        enemy.slowTime = state.nebulaSlowTime;
      }

      state.enemies.push(enemy);
      newEnemies.push(enemy);
      state.waveSpawnedCount += 1;
    }

    if (isMultiplayer && socket) {
      const normalizedEnemies = newEnemies.map(e => ({
          ...e,
          x: e.x / canvas.width,
          y: e.y / canvas.height,
          speed: e.speed / canvas.height
      }));
      socket.send(JSON.stringify({
        type: 'SPAWN_ENEMIES',
        enemies: normalizedEnemies,
        hostId: socket.id
      }));
    }
  };

  // Host fires bullets from general cruiser
  const fireGeneralBullet = (cruiser) => {
    const state = stateRef.current;
    const bulletId = Math.random().toString(36).substring(2, 9);
    // Random single letter
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const letter = alphabet[Math.floor(Math.random() * alphabet.length)];

    const bullet = {
      id: bulletId,
      letter,
      x: cruiser.x,
      y: cruiser.y + 15,
      speed: 1.5,
      damage: 15 // Cruiser bullet damage: 15
    };

    state.bullets.push(bullet);

    if (isMultiplayer && socket) {
      const normalizedBullet = {
        ...bullet,
        x: bullet.x / canvas.width,
        y: bullet.y / canvas.height,
        speed: bullet.speed / canvas.height
      };
      socket.send(JSON.stringify({
        type: 'SPAWN_BULLET',
        bullet: normalizedBullet,
        hostId: socket.id
      }));
    }
  };

  // Boss Warning Cutscene triggers
  const triggerBossWarning = () => {
    const state = stateRef.current;
    state.waveState = 'boss_warning';
    state.waveTransitionTimer = 180; // Warning screen countdown
    state.targetNebulaColor = { h: 0, s: 70, l: 8 }; // Dark red glow background
    
    // Spawn warnings siren loop or flash triggers
    GameAudio.play('emp');

    if (isMultiplayer && socket) {
      socket.send(JSON.stringify({
        type: 'BOSS_WARNING'
      }));
    }

    setTimeout(() => {
      if (state.isLocalGameOver) return;
      spawnBossFight();
    }, 3000);
  };

  // Spawn Boss logic
  const spawnBossFight = () => {
    const state = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const players = state.players || [];
    // Generate boss sequence words
    // Co-op boss contains cycling colored words
    const wordCount = 3 + Math.floor(state.wave / 2);
    let bossWords = [];
    if (isMultiplayer) {
      const activeColors = getActivePlayerColors();
      for (let i = 0; i < wordCount; i++) {
        const c = activeColors[i % activeColors.length] || shipColor;
        bossWords.push({
          id: `boss-w-${i}`,
          word: getWordForEnemy('boss', state.wave, state.usedWords),
          color: c,
          active: i === 0, // Only 1st word active initially
          targetIndex: 0
        });
      }
    } else {
      for (let i = 0; i < wordCount; i++) {
        bossWords.push({
          id: `boss-w-${i}`,
          word: getWordForEnemy('boss', state.wave, state.usedWords),
          color: shipColor,
          active: i === 0,
          targetIndex: 0
        });
      }
    }

    const bossName = state.wave >= 100 ? 'VOID EMPEROR' : state.wave === 50 ? 'SINGULARITY VOID' : 'BOSS DREADNOUGHT';

    state.waveState = 'boss_fight';
    state.bossObj = {
      id: 'boss',
      type: 'boss',
      name: bossName,
      color: 'purple',
      x: canvas.width / 2,
      y: 120,
      width: 180,
      height: 100,
      health: 100,
      maxHealth: 100,
      words: bossWords,
      phase: 0,
      shootTimer: 100
    };

    // Load boss words into the active gameplay targets
    // For clients, we push these words to the active enemies list
    loadBossWordsAsEnemies(bossWords);

    if (isMultiplayer && socket) {
      socket.send(JSON.stringify({
        type: 'SYNC_BOSS_PHASE',
        phase: 0,
        bossId: 'boss',
        bossType: 'boss',
        bossName: bossName,
        bossColor: 'purple',
        bossWidth: 180,
        bossHeight: 100,
        bossHealth: 100,
        bossWords: bossWords,
        hostId: socket.id
      }));
    }
  };

  // Spawn multiples-of-5 mini-bosses
  const spawnMiniBossFight = () => {
    const state = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const players = state.players || [];
    let miniBossName = 'AEGIS VINDICATOR';
    let miniBossColor = isMultiplayer ? shipColor : 'white';

    if (state.wave === 5) {
      miniBossName = 'AEGIS VINDICATOR';
      miniBossColor = isMultiplayer ? shipColor : 'white';
    } else if (state.wave === 15) {
      miniBossName = 'WARP SPECTRE';
      miniBossColor = 'blue';
    } else if (state.wave === 25) {
      miniBossName = 'THERMOBARIC DEVASTATOR';
      miniBossColor = 'red';
    } else if (state.wave === 35) {
      miniBossName = 'EMP VOID-WEAVER';
      miniBossColor = 'green';
    } else if (state.wave === 45) {
      miniBossName = 'MIRAGE PHANTOM';
      miniBossColor = 'purple';
    } else {
      miniBossName = 'ELITE OVERSEER';
      miniBossColor = 'purple';
    }

    if (isMultiplayer) {
      const activeColors = getActivePlayerColors();
      if (activeColors.length > 0) {
        miniBossColor = activeColors[Math.floor(Math.random() * activeColors.length)];
      } else {
        miniBossColor = shipColor;
      }
    }

    // Mini-boss contains a single large target word representing its specific design
    const bossWords = [{
      id: 'boss-w-0',
      word: getWordForEnemy('boss', state.wave, state.usedWords),
      color: miniBossColor,
      active: true,
      completed: false,
      targetIndex: 0
    }];

    state.waveState = 'boss_fight';
    state.bossObj = {
      id: 'mini-boss',
      type: 'mini_boss',
      name: miniBossName,
      color: miniBossColor,
      x: canvas.width / 2,
      y: 120,
      width: 145,
      height: 85,
      health: 100,
      maxHealth: 100,
      words: bossWords,
      phase: 0,
      shootTimer: 90
    };

    loadBossWordsAsEnemies(bossWords);
    GameAudio.play('emp'); // spawn alert sound cue

    if (isMultiplayer && socket) {
      socket.send(JSON.stringify({
        type: 'SYNC_BOSS_PHASE',
        phase: 0,
        bossId: 'mini-boss',
        bossType: 'mini_boss',
        bossName: miniBossName,
        bossColor: miniBossColor,
        bossWidth: 145,
        bossHeight: 85,
        bossHealth: 100,
        bossWords: bossWords,
        hostId: socket.id
      }));
    }
  };

  const loadBossWordsAsEnemies = (bossWords) => {
    const state = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !bossWords || !Array.isArray(bossWords)) return;

    // Add active boss word into standard enemy typing loop
    const activeWord = bossWords.find(w => w.active);
    if (activeWord) {
      const bossEnemy = {
        id: activeWord.id,
        word: activeWord.word,
        color: activeWord.color,
        x: canvas.width / 2,
        y: 180,
        speed: 0,
        targetIndex: 0,
        type: 'boss_shield'
      };
      // Insert to head of list
      state.enemies = [bossEnemy, ...state.enemies];
    }
  };

  // Boss fires single-letter bullet
  const fireBossBullet = () => {
    const state = stateRef.current;
    if (!state.bossObj) return;

    const players = state.players || [];
    const bulletId = Math.random().toString(36).substring(2, 9);
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const letter = alphabet[Math.floor(Math.random() * alphabet.length)];

    // Target a player position randomly
    const targetPos = isMultiplayer && players.length > 0
      ? players[Math.floor(Math.random() * players.length)].position
      : 'center';
    
    let destX = getShipX(targetPos, window.innerWidth);
    if (state.decoyTime > 0) {
      // Divert bullets to the left edge of screen
      destX = window.innerWidth * 0.1;
    }

    // Calculate bullet velocities to shoot towards ship
    const startX = state.bossObj.x;
    const startY = state.bossObj.y + 40;
    const baseAngle = Math.atan2(window.innerHeight - 80 - startY, destX - startX);
    const isMiniBoss = state.bossObj.type === 'mini_boss';
    const bossDamage = isMiniBoss ? 35 : 50; // Mini-boss: 35, Major boss: 50

    // Void Emperor (Wave 100) fires a triple spread of letter bullets
    if (state.wave >= 100) {
      const angles = [baseAngle - 0.22, baseAngle, baseAngle + 0.22];
      const spawnedBullets = [];
      angles.forEach((angle, idx) => {
        const bId = bulletId + '-' + idx;
        const bLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
        const bSpeed = 2.2;
        
        const bulletObj = {
          id: bId,
          letter: bLetter,
          x: startX,
          y: startY,
          speed: bSpeed,
          vx: Math.cos(angle) * bSpeed,
          vy: Math.sin(angle) * bSpeed,
          type: 'boss_spiral',
          damage: bossDamage
        };
        state.bullets.push(bulletObj);
        spawnedBullets.push(bulletObj);
      });

      GameAudio.play('boss_laser');

      if (isMultiplayer && socket) {
        spawnedBullets.forEach(b => {
          socket.send(JSON.stringify({
            type: 'SPAWN_BULLET',
            bullet: {
              ...b,
              x: b.x / canvas.width,
              y: b.y / canvas.height,
              speed: b.speed / canvas.height,
              vx: b.vx !== undefined ? b.vx / canvas.width : undefined,
              vy: b.vy !== undefined ? b.vy / canvas.height : undefined
            },
            hostId: socket.id
          }));
        });
      }
    } else {
      // Standard or Chronos Temporal Bullet
      const isTemporal = state.wave === 20;
      const bSpeed = isTemporal ? 1.4 : 1.8;
      
      const bullet = {
        id: bulletId,
        letter,
        x: startX,
        y: startY,
        speed: bSpeed,
        vx: Math.cos(baseAngle) * bSpeed,
        vy: Math.sin(baseAngle) * bSpeed,
        type: isTemporal ? 'temporal' : 'boss_standard',
        damage: bossDamage
      };
      
      state.bullets.push(bullet);

      GameAudio.play('boss_laser');

      if (isMultiplayer && socket) {
        socket.send(JSON.stringify({
          type: 'SPAWN_BULLET',
          bullet: {
            ...bullet,
            x: bullet.x / canvas.width,
            y: bullet.y / canvas.height,
            speed: bullet.speed / canvas.height,
            vx: bullet.vx !== undefined ? bullet.vx / canvas.width : undefined,
            vy: bullet.vy !== undefined ? bullet.vy / canvas.height : undefined
          },
          hostId: socket.id
        }));
      }
    }
  };

  // Boss spawns normal colored minions
  const spawnBossMinions = () => {
    const state = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !state.bossObj) return;

    const players = state.players || [];
    const spawnLeft = Math.random() < 0.5;
    const x = spawnLeft ? state.bossObj.x - 80 : state.bossObj.x + 80;

    let type = 'drone';
    let speed = 0.7;
    
    if (state.wave === 40) {
      type = Math.random() < 0.6 ? 'kamikaze' : 'shield_linker';
      speed = type === 'kamikaze' ? 1.4 : 0.45;
    }

    const word = getWordForEnemy(type, state.wave, state.usedWords);
    const id = Math.random().toString(36).substring(2, 9);

    let color = shipColor;
    if (isMultiplayer && players) {
      const colors = players.map(p => p.color).filter(Boolean);
      if (colors.length > 0) {
        if (!state.colorSpawnBag || state.colorSpawnBag.length === 0) {
          const tempBag = [];
          const repetitions = colors.length === 2 ? 3 : 2; // For 2P: 3 each (6 total). For 3P: 2 each (6 total).
          for (let r = 0; r < repetitions; r++) {
            tempBag.push(...colors);
          }
          // Fisher-Yates Shuffle
          for (let j = tempBag.length - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1));
            [tempBag[j], tempBag[k]] = [tempBag[k], tempBag[j]];
          }
          state.colorSpawnBag = tempBag;
        }
        color = state.colorSpawnBag.pop() || shipColor;
      }
    } else {
      if (type === 'kamikaze') color = 'red';
      else if (type === 'shield_linker') color = 'blue';
    }

    const minion = {
      id,
      word,
      color,
      x,
      y: state.bossObj.y + 40,
      speed,
      targetIndex: 0,
      type,
      dirMultiplier: Math.random() < 0.5 ? 1 : -1
    };

    // Apply Nebula Veil slow if active at spawn time
    if (state.nebulaSlowTime > 0) {
      let multiplier = 0.5; // Drone: 50% slow
      if (type === 'interceptor') multiplier = 0.625; // 37.5% slow
      else if (type === 'cruiser') multiplier = 0.75; // 25% slow
      else if (type === 'boss') multiplier = 0.875; // 12.5% slow
      minion.slowMultiplier = multiplier;
      minion.slowTime = state.nebulaSlowTime;
    }

    state.enemies.push(minion);

    if (isMultiplayer && socket) {
      const normalizedMinion = {
        ...minion,
        x: minion.x / canvas.width,
        y: minion.y / canvas.height,
        speed: minion.speed / canvas.height
      };
      socket.send(JSON.stringify({
        type: 'SPAWN_ENEMIES',
        enemies: [normalizedMinion],
        hostId: socket.id
      }));
    }
  };

  // Co-op gameplay: take damage
  const takeDamage = (amount) => {
    const state = stateRef.current;
    if (state.health <= 0) return; // Ignore damage if already dead/reviving!
    
    // Check if active boss shield absorbs the hit
    if (state.bossShieldActive && state.bossShieldHealth > 0) {
      state.bossShieldHealth -= 1;
      GameAudio.play('shield_hit');
      // Spark a defensive shield blast at ship position
      const shipX = window.innerWidth / 2;
      const shipY = window.innerHeight - 80;
      createExplosion(shipX, shipY, '#38bdf8', 12, false);
      
      if (state.bossShieldHealth <= 0) {
        state.bossShieldActive = false;
      }
      return; // Prevent damage from reducing player health!
    }

    // Calculate streak damage reduction
    let dmgReduction = 0;
    if (state.streak >= 50) dmgReduction = 0.50;
    else if (state.streak >= 40) dmgReduction = 0.40;
    else if (state.streak >= 30) dmgReduction = 0.30;
    else if (state.streak >= 20) dmgReduction = 0.20;
    else if (state.streak >= 10) dmgReduction = 0.10;

    const finalAmount = amount * (1 - dmgReduction);
    state.health = Math.max(0, state.health - finalAmount);
    
    // Reset streak upon taking damage
    state.streak = 0;
    updateStreakShield(0);

    state.screenShake = 12;
    state.flashFrame = 4;
    GameAudio.play('explosionPlayer');

    setHudState(prev => ({ ...prev, health: Math.round(state.health) }));

    if (isMultiplayer && socket) {
      socket.send(JSON.stringify({
        type: 'PLAYER_HIT',
        playerId: socket.id,
        health: state.health
      }));
    }

    // Check game over
    if (state.health <= 0) {
      if (isMultiplayer && socket) {
        // Find if there's at least one teammate with health > 0 and NOT reviving
        const aliveTeammates = state.teammates.filter(m => m.socketId !== socket.id && m.health > 0 && !m.isReviving);
        if (aliveTeammates.length > 0) {
          // Enter revive mode!
          state.health = 0;
          state.isReviving = true;
          state.reviveTimeRemaining = 900; // 15 seconds (15 * 60)
          
          // Minimal death sparks (gray and orange, not too flashy)
          const myX = getLocalShipX(window.innerWidth);
          createExplosion(myX, window.innerHeight - 80, '#9ca3af', 8); // gray
          createExplosion(myX, window.innerHeight - 80, '#f97316', 6);  // orange
          
          socket.send(JSON.stringify({
            type: 'PLAYER_DOWN',
            playerId: socket.id,
            reviveTime: 15
          }));
        } else {
          // No alive teammates left -> Game Over!
          socket.send(JSON.stringify({
            type: 'GAME_OVER',
            finalScore: state.score,
            waveReached: state.wave
          }));
          triggerGameOver(state.score, state.wave);
        }
      } else {
        triggerGameOver(state.score, state.wave);
      }
    }
  };

  const triggerGameOver = (finalScore, waveReached) => {
    const state = stateRef.current;
    state.isLocalGameOver = true;
    GameAudio.stopMusic();
    GameAudio.play('explosionPlayer');
    
    // Add giant player ship destruction particle burst
    const canvas = canvasRef.current;
    if (canvas) {
      const x = canvas.width / 2;
      const y = canvas.height - 80;
      createExplosion(x, y, '#ff1111', 40, true);
    }

    if (!isMultiplayer && waveReached >= 100 && onSaveCheckpoint) {
      onSaveCheckpoint(100);
    }

    setTimeout(() => {
      onGameOver(finalScore, waveReached);
    }, 1500);
  };

  // Advance level/wave
  const advanceNextWave = () => {
    const state = stateRef.current;
    if (state.wave >= 100) return; // Wave 100 is the final impossible level
    
    // Partially heal player between waves (refill by 50)
    state.health = Math.min(100, state.health + 50);
    setHudState(prev => ({ ...prev, health: state.health }));
    
    const nextWaveNum = state.wave + 1;
    
    state.wave = nextWaveNum;
    onScoreUpdate(state.score, nextWaveNum); // Update parent wave immediately
    state.waveState = 'intro';
    state.waveTransitionTimer = 120;
    state.enemies = [];
    state.bullets = [];
    state.waveSpawnedCount = 0;
    state.waveTotalToSpawn = 10 + nextWaveNum * 4;
    
    state.targetNebulaColor = {
      h: (260 + nextWaveNum * 30) % 360,
      s: 60,
      l: 8 + (nextWaveNum % 4)
    };

    setHudState(prev => ({ ...prev, wave: nextWaveNum }));
    
    // Play wave start audio (except Wave 1 to allow smooth cutscene entry)
    if (nextWaveNum > 1) {
      GameAudio.play('emp');
    }

    if (isMultiplayer && socket) {
      socket.send(JSON.stringify({
        type: 'NEXT_WAVE',
        wave: nextWaveNum
      }));
    }
  };

  // Tick boss shield logic when active word dies
  // In the update loop we monitor boss words completion
  const checkBossShieldsCompleted = (completedEnemyId) => {
    const state = stateRef.current;
    if (state.waveState !== 'boss_fight' || !state.bossObj) return;

    const players = state.players || [];
    const isHost = !isMultiplayer || (players.find(p => p.socketId === socket?.id)?.isHost);
    const boss = state.bossObj;
    const shieldIndex = boss.words.findIndex(w => w.id === completedEnemyId);
    
    if (shieldIndex !== -1) {
      // Mark shield word complete
      boss.words[shieldIndex].active = false;
      boss.words[shieldIndex].completed = true;

      // Update boss general health percentage
      if (state.wave >= 100) {
        boss.health = 100;
        // Spark explosion on boss
        createExplosion(boss.x, boss.y, getColorHex(boss.words[shieldIndex].color), 30, true);
        
        if (!isMultiplayer || isHost) {
          // Regenerate this word slot with a fresh target word so it continues endlessly
          boss.words[shieldIndex].completed = false;
          boss.words[shieldIndex].word = getWordForEnemy('boss', state.wave, state.usedWords);
          boss.words[shieldIndex].targetIndex = 0;
          boss.words[shieldIndex].active = true;
          if (isMultiplayer && players && players.length > 0) {
            const colors = players.map(p => p.color).filter(Boolean);
            if (colors.length > 0) {
              boss.words[shieldIndex].color = colors[Math.floor(Math.random() * colors.length)];
            }
          }
          loadBossWordsAsEnemies(boss.words);
          
          if (isMultiplayer && socket) {
            socket.send(JSON.stringify({
              type: 'SYNC_BOSS_PHASE',
              phase: boss.phase,
              bossWords: boss.words,
              hostId: socket.id
            }));
          }
        }
        return;
      }

      const completedCount = boss.words.filter(w => w.completed).length;
      boss.health = Math.round(100 - (completedCount / boss.words.length) * 100);

      // Spark massive explosion on the boss itself
      createExplosion(boss.x, boss.y, getColorHex(boss.words[shieldIndex].color), 30, true);
      GameAudio.play('boss_hit');
      boss.lastHitTime = Date.now();

      // Check if all boss words completed
      if (completedCount >= boss.words.length) {
        // Boss destroyed!
        createExplosion(boss.x, boss.y, '#ffffff', 80, true);
        GameAudio.play('boss_explosion');
        
        // Spawn spinning metal chunks that fly away
        for (let c = 0; c < 7; c++) {
          const angle = Math.random() * Math.PI * 2;
          const force = 1.5 + Math.random() * 2.5;
          state.particles.push({
            x: boss.x + (Math.random() - 0.5) * 40,
            y: boss.y + (Math.random() - 0.5) * 20,
            vx: Math.cos(angle) * force,
            vy: Math.sin(angle) * force - 0.5,
            size: 4 + Math.random() * 8,
            color: 'rgba(168, 85, 247, 0.4)', // soft purple chunk
            alpha: 0.95,
            life: 60 + Math.random() * 40,
            type: 'chunk',
            angle: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.15
          });
        }
        
        state.bossObj = null;
        
        // Spawn shield claim orb animation
        if (!state.shieldClaims) state.shieldClaims = [];
        state.shieldClaims.push({
          x: boss.x,
          y: boss.y,
          progress: 0
        });
        
        // Wait, clear all remaining minions/bullets
        state.enemies = [];
        state.bullets = [];

        if (isMultiplayer && socket) {
          const canvas = canvasRef.current;
          const widthVal = canvas ? canvas.width : window.innerWidth;
          const heightVal = canvas ? canvas.height : window.innerHeight;
          socket.send(JSON.stringify({
            type: 'BOSS_DESTROYED',
            bossId: boss.id,
            x: boss.x / widthVal,
            y: boss.y / heightVal,
            color: boss.color
          }));
        }
        
        // Advance wave or docking station
        if (!isMultiplayer || isHost) {
          setTimeout(() => {
            handleWaveEndDetection();
          }, 1500);
        }
      } else {
        // Activate next word in cycle pattern
        const nextActive = boss.words.find(w => !w.completed);
        if (nextActive) {
          nextActive.active = true;
          loadBossWordsAsEnemies(boss.words);
          
          if (isHost && isMultiplayer && socket) {
            socket.send(JSON.stringify({
              type: 'SYNC_BOSS_PHASE',
              phase: boss.phase + 1,
              bossWords: boss.words,
              hostId: socket.id
            }));
          }
        }
      }
    }
  };

  // Core Canvas Drawing System
  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;
    const players = state.players || [];

    // Apply Screen Shake
    ctx.save();
    if (state.screenShake > 0.5) {
      const dx = (Math.random() - 0.5) * state.screenShake;
      const dy = (Math.random() - 0.5) * state.screenShake;
      ctx.translate(dx, dy);
    }

    // Clear Canvas with glowing nebula gradient
    ctx.fillStyle = `hsl(${state.nebulaColor.h}, ${state.nebulaColor.s}%, ${state.nebulaColor.l}%)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw deep background star grid
    const gridSize = 100;
    let yOffset = (state.waveTransitionTimer * 0.1) % gridSize;
    let strokeColor = `rgba(255, 255, 255, 0.025)`;
    let lineWidth = 1.0;

    if (state.waveState === 'intro' && state.waveTransitionTimer > 60) {
      const warpProgress = (state.waveTransitionTimer - 60) / 60; // 1.0 down to 0.0
      yOffset = (state.waveTransitionTimer * 12.0 * warpProgress) % gridSize;
      lineWidth = 1.0 + warpProgress * 1.0;
      strokeColor = `rgba(255, 255, 255, ${0.025 + warpProgress * 0.02})`;
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = yOffset; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw Parallax Scenery (wreckage, platforms, asteroids, planets on margins)
    state.scenery.forEach(item => {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(item.rotation);
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 1.2;

      if (item.type === 'asteroid' || item.type === 'rock') {
        ctx.beginPath();
        const pts = item.offsets.length;
        for (let j = 0; j < pts; j++) {
          const angle = (j / pts) * Math.PI * 2;
          const r = item.size * item.offsets[j];
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        
        // Internal crater details & surface crack lines
        ctx.beginPath();
        ctx.moveTo(-item.size * 0.2, -item.size * 0.1);
        ctx.lineTo(item.size * 0.1, item.size * 0.2);
        ctx.stroke();
        
        if (item.type === 'asteroid') {
          ctx.beginPath();
          ctx.arc(-item.size * 0.25, -item.size * 0.25, item.size * 0.12, 0, Math.PI * 2);
          ctx.arc(item.size * 0.2, item.size * 0.15, item.size * 0.16, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (item.type === 'platform') {
        // Detailed space platform girder structure
        ctx.beginPath();
        ctx.rect(-item.size * 0.7, -item.size * 0.15, item.size * 1.4, item.size * 0.3);
        ctx.stroke();
        // Cross struts
        ctx.beginPath();
        for (let sx = -item.size * 0.5; sx < item.size * 0.5; sx += item.size * 0.4) {
          ctx.moveTo(sx, -item.size * 0.15);
          ctx.lineTo(sx + item.size * 0.3, item.size * 0.15);
          ctx.moveTo(sx + item.size * 0.3, -item.size * 0.15);
          ctx.lineTo(sx, item.size * 0.15);
        }
        ctx.stroke();
        
        // Solar panels grid on sides
        ctx.beginPath();
        ctx.rect(-item.size * 0.6, -item.size * 0.28, item.size * 0.25, item.size * 0.12);
        ctx.rect(item.size * 0.35, -item.size * 0.28, item.size * 0.25, item.size * 0.12);
        ctx.stroke();
      } else if (item.type === 'wreckage') {
        // Fractured ship debris silhouette
        ctx.beginPath();
        ctx.moveTo(-item.size * 0.6, -item.size * 0.3);
        ctx.lineTo(item.size * 0.6, -item.size * 0.1);
        ctx.lineTo(item.size * 0.3, item.size * 0.4);
        ctx.lineTo(-item.size * 0.4, item.size * 0.3);
        ctx.closePath();
        ctx.stroke();
        
        // Exposed ship skeleton ribs & thruster nozzles
        ctx.beginPath();
        ctx.moveTo(-item.size * 0.2, -item.size * 0.25);
        ctx.lineTo(-item.size * 0.1, item.size * 0.32);
        ctx.moveTo(item.size * 0.1, -item.size * 0.2);
        ctx.lineTo(item.size * 0.15, item.size * 0.35);
        // Engine nozzles
        ctx.rect(-item.size * 0.3, -item.size * 0.32, item.size * 0.15, item.size * 0.08);
        ctx.stroke();

        // Loose wires hanging (bezier curves)
        ctx.beginPath();
        ctx.moveTo(-item.size * 0.1, item.size * 0.32);
        ctx.bezierCurveTo(-item.size * 0.2, item.size * 0.45, -item.size * 0.05, item.size * 0.5, -item.size * 0.12, item.size * 0.6);
        ctx.stroke();
      } else if (item.type === 'planet') {
        // Elegant celestial planet outline
        ctx.beginPath();
        ctx.arc(0, 0, item.size * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Surface craters details
        ctx.beginPath();
        ctx.arc(-item.size * 0.3, -item.size * 0.2, item.size * 0.1, 0, Math.PI * 2);
        ctx.arc(item.size * 0.25, item.size * 0.25, item.size * 0.15, 0, Math.PI * 2);
        ctx.stroke();
        
        // Crescent shadow curvature
        ctx.beginPath();
        ctx.arc(0, 0, item.size * 0.77, -Math.PI/3, Math.PI/2);
        ctx.stroke();

        if (item.hasRing) {
          ctx.beginPath();
          ctx.ellipse(0, 0, item.size * 1.35, item.size * 0.32, Math.PI / 6, 0, Math.PI * 2);
          ctx.ellipse(0, 0, item.size * 1.25, item.size * 0.28, Math.PI / 6, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (item.type === 'solarsystem') {
        // Star with orbiting planet
        ctx.beginPath();
        ctx.arc(0, 0, item.size * 0.25, 0, Math.PI * 2); // central star
        ctx.stroke();
        
        // Solar flares (short lines around star)
        for (let f = 0; f < 6; f++) {
          const angle = (f / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * item.size * 0.25, Math.sin(angle) * item.size * 0.25);
          ctx.lineTo(Math.cos(angle) * item.size * 0.32, Math.sin(angle) * item.size * 0.32);
          ctx.stroke();
        }

        // Orbit ellipse
        ctx.beginPath();
        ctx.ellipse(0, 0, item.size * 0.9, item.size * 0.35, Math.PI / 4, 0, Math.PI * 2);
        ctx.stroke();
        // Orbiting planet sphere
        const planetX = Math.cos(Date.now() * 0.0006 + item.size) * item.size * 0.9;
        const planetY = Math.sin(Date.now() * 0.0006 + item.size) * item.size * 0.35;
        ctx.beginPath();
        ctx.arc(planetX, planetY, item.size * 0.08, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    });

    // Draw active particle clouds
    state.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw shield claim orb animations
    if (state.shieldClaims && state.shieldClaims.length > 0) {
      const targetX = canvas.width / 2;
      const targetY = canvas.height - 80;
      state.shieldClaims.forEach(orb => {
        const curX = orb.x + (targetX - orb.x) * orb.progress;
        const curY = orb.y + (targetY - orb.y) * orb.progress;
        
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.75 * (1 - orb.progress * 0.3);
        
        ctx.beginPath();
        ctx.arc(curX, curY, 8 + Math.sin(Date.now() / 80) * 2, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(curX, curY, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
        ctx.restore();
      });
    }

    // Draw Lasers
    state.lasers.forEach(laser => {
      ctx.save();
      // Outer colored glow beam
      ctx.shadowBlur = 4;
      ctx.shadowColor = laser.color;
      ctx.strokeStyle = laser.color;
      ctx.globalAlpha = laser.alpha * 0.75;
      ctx.lineWidth = 2.0;

      ctx.beginPath();
      ctx.moveTo(laser.fromX, laser.fromY);
      ctx.lineTo(laser.toX, laser.toY);
      ctx.stroke();

      // Very thin elegant white core (hardly noticeable but adds crisp detail)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.7;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(laser.fromX, laser.fromY);
      ctx.lineTo(laser.toX, laser.toY);
      ctx.stroke();
      ctx.restore();
    });

    // Draw Boss
    if (state.waveState === 'boss_fight' && state.bossObj) {
      const boss = state.bossObj;
      ctx.save();
      ctx.translate(boss.x, boss.y);
      ctx.shadowBlur = 15;
      
      const bossTier = state.wave; // e.g. 10, 20, 30...
      let bossColor = 'purple';
      let bossLabel = 'COMMAND DREADNOUGHT';

      if (boss.type === 'mini_boss') {
        bossColor = boss.color || 'purple';
        bossLabel = `MINI-BOSS: ${boss.name}`;
      } else if (bossTier === 10) {
        bossColor = 'purple';
        bossLabel = 'DREADNOUGHT SENTINEL';
      } else if (bossTier === 20) {
        bossColor = 'blue';
        bossLabel = 'CHRONOS DOMINATOR';
      } else if (bossTier === 30) {
        bossColor = 'magenta';
        bossLabel = 'PLASMA LEVIATHAN';
      } else if (bossTier === 40) {
        bossColor = 'gold';
        bossLabel = 'HYPERION CARRIER';
      } else if (bossTier === 50) {
        bossColor = 'purple';
        bossLabel = 'SINGULARITY VOID';
      } else if (bossTier >= 100) {
        bossColor = 'red';
        bossLabel = 'VOID EMPEROR [FINAL]';
      } else {
        bossColor = 'purple';
        bossLabel = 'IMPERIAL OVERLORD';
      }

      ctx.shadowColor = getColorHex(bossColor);
      ctx.strokeStyle = getColorHex(bossColor);
      ctx.lineWidth = 3.0;

      // Draw custom visual designs based on boss type
      if (boss.type === 'mini_boss') {
        if (boss.name === 'AEGIS VINDICATOR') {
          // White defensive plate barge
          ctx.beginPath();
          ctx.moveTo(-boss.width / 2, -15);
          ctx.lineTo(-boss.width / 3, -boss.height / 2);
          ctx.lineTo(boss.width / 3, -boss.height / 2);
          ctx.lineTo(boss.width / 2, -15);
          ctx.lineTo(boss.width / 2, 20);
          ctx.lineTo(-boss.width / 2, 20);
          ctx.closePath();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.fill();
          ctx.stroke();

          // Rotating barrier shield arcs
          const angle = (Date.now() * 0.0018) % (Math.PI * 2);
          ctx.save();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3.0;
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(0, 0, 50, angle, angle + Math.PI * 0.75); // 75% segment arc
          ctx.stroke();
          ctx.restore();
        } else if (boss.name === 'WARP SPECTRE') {
          // Sleek dual-wing cyan energy ship
          ctx.beginPath();
          ctx.moveTo(0, -25);
          ctx.lineTo(-boss.width / 2, 10);
          ctx.lineTo(-20, -5);
          ctx.lineTo(0, 20);
          ctx.lineTo(20, -5);
          ctx.lineTo(boss.width / 2, 10);
          ctx.closePath();
          ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
          ctx.fill();
          ctx.stroke();
          
          // Center matrix core
          ctx.strokeStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.stroke();
        } else if (boss.name === 'THERMOBARIC DEVASTATOR') {
          // Heavy firebomber ship
          ctx.beginPath();
          ctx.rect(-boss.width / 2, -boss.height / 2, boss.width, boss.height);
          ctx.moveTo(-boss.width / 2, 0); ctx.lineTo(boss.width / 2, 0);
          ctx.stroke();
          
          // Exhaust ports
          ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
          ctx.fillRect(-15, 10, 30, 15);
        } else if (boss.name === 'EMP VOID-WEAVER') {
          // Spiked neon-yellow shock cruiser
          ctx.beginPath();
          ctx.moveTo(0, -30);
          ctx.lineTo(boss.width / 2, 10);
          ctx.lineTo(10, 5);
          ctx.lineTo(0, 30);
          ctx.lineTo(-10, 5);
          ctx.lineTo(-boss.width / 2, 10);
          ctx.closePath();
          ctx.fillStyle = 'rgba(251, 191, 36, 0.08)';
          ctx.fill();
          ctx.stroke();
          
          // Electric arcs radiating
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          for (let a = 0; a < 4; a++) {
            const ang = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 20;
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(ang) * dist, Math.sin(ang) * dist);
          }
          ctx.stroke();
        } else if (boss.name === 'MIRAGE PHANTOM') {
          // Ghostly split chassis
          ctx.beginPath();
          ctx.moveTo(-20, -20); ctx.lineTo(-boss.width / 2, 20); ctx.lineTo(-10, 10);
          ctx.moveTo(20, -20); ctx.lineTo(boss.width / 2, 20); ctx.lineTo(10, 10);
          ctx.stroke();
        } else {
          // Fallback mini-boss
          ctx.beginPath();
          ctx.rect(-boss.width / 2, -boss.height / 2, boss.width, boss.height);
          ctx.stroke();
        }
      } else if (bossTier === 20) {
        // Chronos Dominator
        const rot = Date.now() * 0.001;
        ctx.beginPath();
        ctx.ellipse(0, 0, boss.width * 0.45, boss.height * 0.45, rot, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.ellipse(0, 0, boss.width * 0.3, boss.height * 0.15, -rot * 1.5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Core hourglass
        ctx.beginPath();
        ctx.moveTo(-12, -22); ctx.lineTo(12, -22);
        ctx.lineTo(-12, 22); ctx.lineTo(12, 22);
        ctx.closePath();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
        ctx.fill();
        ctx.stroke();
      } else if (bossTier === 30) {
        // Plasma Leviathan
        // If cloaked phase, fade global alpha
        const cloakCycle = Math.sin(Date.now() / 150) * 0.5 + 0.5;
        ctx.globalAlpha = 0.12 + cloakCycle * 0.8;
        
        ctx.beginPath();
        ctx.moveTo(0, -boss.height / 2);
        ctx.lineTo(boss.width / 2, boss.height / 3);
        ctx.lineTo(-boss.width / 2, boss.height / 3);
        ctx.closePath();
        ctx.fillStyle = 'rgba(219, 39, 119, 0.08)';
        ctx.fill();
        ctx.stroke();

        // Pulsing plasma core lines
        ctx.strokeStyle = `rgba(219, 39, 119, ${0.3 + cloakCycle * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(0, -boss.height / 2); ctx.lineTo(0, boss.height / 3);
        ctx.moveTo(-boss.width * 0.25, 0); ctx.lineTo(boss.width * 0.25, 0);
        ctx.stroke();
      } else if (bossTier === 40) {
        // Hyperion Carrier
        ctx.beginPath();
        ctx.rect(-boss.width / 2, -boss.height / 2, boss.width, boss.height);
        ctx.fillStyle = 'rgba(217, 167, 82, 0.08)';
        ctx.fill();
        ctx.stroke();
        
        // Hangar flight decks
        ctx.strokeRect(-boss.width / 2 + 10, -boss.height / 3, 30, boss.height * 0.6);
        ctx.strokeRect(boss.width / 2 - 40, -boss.height / 3, 30, boss.height * 0.6);
      } else if (bossTier === 50) {
        // Singularity Void
        const rot = Date.now() * 0.0035;
        
        // Dark black hole sphere core
        ctx.fillStyle = 'rgba(6, 6, 10, 0.95)';
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Gravity accretion disks orbits
        ctx.beginPath();
        ctx.ellipse(0, 0, boss.width * 0.55, boss.height * 0.25, rot, 0, Math.PI * 2);
        ctx.ellipse(0, 0, boss.width * 0.55, boss.height * 0.25, -rot * 0.8, 0, Math.PI * 2);
        ctx.stroke();
      } else if (bossTier >= 100) {
        // Void Emperor - Colossal Wings
        ctx.beginPath();
        // Wing Left
        ctx.moveTo(0, -10);
        ctx.lineTo(-boss.width * 1.6, -boss.height / 2);
        ctx.lineTo(-boss.width * 1.8, boss.height / 4);
        ctx.lineTo(-boss.width * 0.6, boss.height / 3);
        ctx.lineTo(0, 10);
        // Wing Right
        ctx.moveTo(0, -10);
        ctx.lineTo(boss.width * 1.6, -boss.height / 2);
        ctx.lineTo(boss.width * 1.8, boss.height / 4);
        ctx.lineTo(boss.width * 0.6, boss.height / 3);
        ctx.lineTo(0, 10);
        ctx.closePath();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
        ctx.fill();
        ctx.stroke();

        // Glowing core spikes
        ctx.strokeStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(-15, 10); ctx.lineTo(-45, 55);
        ctx.moveTo(15, 10); ctx.lineTo(45, 55);
        ctx.moveTo(0, 15); ctx.lineTo(0, 65);
        ctx.stroke();
        
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 10, 16, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Sentinel & dreadnought chassis (Default / Tier 10)
        ctx.beginPath();
        ctx.moveTo(-boss.width / 2, -boss.height / 3);
        ctx.lineTo(-boss.width * 0.3, -boss.height / 2);
        ctx.lineTo(boss.width * 0.3, -boss.height / 2);
        ctx.lineTo(boss.width / 2, -boss.height / 3);
        ctx.lineTo(boss.width * 0.45, boss.height * 0.25);
        ctx.lineTo(boss.width * 0.25, boss.height * 0.5);
        ctx.lineTo(boss.width * 0.1, boss.height * 0.35);
        ctx.lineTo(-boss.width * 0.1, boss.height * 0.35);
        ctx.lineTo(-boss.width * 0.25, boss.height * 0.5);
        ctx.lineTo(-boss.width * 0.45, boss.height * 0.25);
        ctx.closePath();
        
        ctx.fillStyle = 'rgba(139, 92, 246, 0.08)';
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = 'rgba(139, 92, 246, 0.35)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(-boss.width * 0.4, -boss.height * 0.1);
        ctx.lineTo(-boss.width * 0.4, boss.height * 0.15);
        ctx.lineTo(-boss.width * 0.25, boss.height * 0.35);
        ctx.moveTo(boss.width * 0.4, -boss.height * 0.1);
        ctx.lineTo(boss.width * 0.4, boss.height * 0.15);
        ctx.lineTo(boss.width * 0.25, boss.height * 0.35);
        ctx.rect(-boss.width * 0.15, -boss.height * 0.35, boss.width * 0.3, boss.height * 0.15);
        ctx.stroke();

        ctx.fillStyle = '#cf4042';
        ctx.fillRect(-boss.width * 0.08, -boss.height * 0.3, boss.width * 0.16, 2);
      }

      // Draw health bar
      const barW = 200;
      const barH = 6;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(-barW / 2, -boss.height / 2 - 25, barW, barH);
      ctx.fillStyle = getColorHex(bossColor);
      ctx.fillRect(-barW / 2, -boss.height / 2 - 25, barW * (boss.health / 100), barH);

      // Label "BOSS"
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 12px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(bossLabel, 0, -boss.height / 2 - 35);

      // Boss forcefield bubble
      const hitElapsed = Date.now() - (boss.lastHitTime || 0);
      const isRippling = hitElapsed < 350;
      
      ctx.save();
      ctx.strokeStyle = `rgba(168, 85, 247, ${isRippling ? 0.35 : 0.18})`; // soft purple
      ctx.lineWidth = isRippling ? 2.5 : 1.2;
      ctx.shadowBlur = isRippling ? 8 : 2;
      ctx.shadowColor = getColorHex(bossColor);
      ctx.beginPath();
      const baseRadius = Math.max(boss.width, boss.height) * 0.65;
      const rippleSize = isRippling ? Math.sin((hitElapsed / 350) * Math.PI) * 4.5 : 0;
      ctx.arc(0, 0, baseRadius + rippleSize, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    }

    // Draw Shield-Linker linking lines first in absolute coordinates
    state.enemies.forEach(enemy => {
      if (enemy.type === 'shield_linker' && enemy.shieldLinkedEnemyId) {
        const target = state.enemies.find(e => e.id === enemy.shieldLinkedEnemyId);
        if (target) {
          ctx.save();
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#3b82f6';
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.55)'; // Pulsing blue linking line
          ctx.lineWidth = 2.0;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(enemy.x, enemy.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
          ctx.restore();
        }
      }
    });

    // Draw Enemies (Descending ships with words)
    state.enemies.forEach(enemy => {
      ctx.save();
      if (enemy.type === 'stealth_cloaker') {
        ctx.globalAlpha = enemy.opacity !== undefined ? enemy.opacity : 1.0;
      }
      let jitterX = 0;
      if (state.enemies.some(e => e.type === 'anomaly') && enemy.type !== 'anomaly') {
        jitterX = (Math.random() - 0.5) * 1.5;
      }
      ctx.translate(enemy.x + jitterX, enemy.y);
      
      // Draw protective shield bubble if linked
      if (enemy.isInvulnerable) {
        ctx.save();
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.7)';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.shadowBlur = 8;
      ctx.shadowColor = getColorHex(enemy.color);
      ctx.strokeStyle = getColorHex(enemy.color);
      ctx.lineWidth = 2.5; // Thicker lines for visibility

      const seed = parseInt(enemy.id, 36) || 0;

      // Draw procedural enemy design based on class - scaled up by 1.6x
      ctx.beginPath();
      if (enemy.type === 'stealth_cloaker') {
        // Spy drone shape
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(16, -10);
        ctx.lineTo(6, -4);
        ctx.lineTo(0, -12);
        ctx.lineTo(-6, -4);
        ctx.lineTo(-16, -10);
        ctx.closePath();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.stroke();
      } else if (enemy.type === 'replicator') {
        // Double diamond geometric shape
        ctx.beginPath();
        ctx.moveTo(0, 18);
        ctx.lineTo(12, 0);
        ctx.lineTo(0, -18);
        ctx.lineTo(-12, 0);
        ctx.closePath();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(0, -8);
        ctx.lineTo(6, 0);
        ctx.lineTo(0, 8);
        ctx.closePath();
        ctx.stroke();
      } else if (enemy.type === 'interceptor') {
        // Sleek forward-swept wing fighter (Elite - 40 variants)
        ctx.moveTo(0, 24);
        ctx.lineTo(20, -12);
        ctx.lineTo(10, -3);
        ctx.lineTo(4, -8);
        ctx.lineTo(-4, -8);
        ctx.lineTo(-10, -3);
        ctx.lineTo(-20, -12);
        ctx.closePath();
        ctx.stroke();

        // Seeded sub wings/spikes (40 variants)
        ctx.beginPath();
        if (seed % 3 === 0) {
          ctx.moveTo(12, -4);
          ctx.lineTo(24, 8);
          ctx.lineTo(16, 2);
          ctx.moveTo(-12, -4);
          ctx.lineTo(-24, 8);
          ctx.lineTo(-16, 2);
        } else if (seed % 3 === 1) {
          ctx.moveTo(15, -6);
          ctx.lineTo(22, -18);
          ctx.moveTo(-15, -6);
          ctx.lineTo(-22, -18);
        } else {
          ctx.moveTo(0, 24);
          ctx.lineTo(0, 32);
        }
        ctx.stroke();

        // Internal wing panel lines
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(-10, -3); ctx.lineTo(-4, -8);
        ctx.moveTo(10, -3); ctx.lineTo(4, -8);
        ctx.moveTo(0, 24); ctx.lineTo(0, 0);
        ctx.stroke();
        ctx.restore();
      } else if (enemy.type === 'cruiser') {
        // Hexagonal armored gunship cruiser (General - 30 variants)
        ctx.moveTo(0, 32);
        ctx.lineTo(22, 12);
        ctx.lineTo(26, -16);
        ctx.lineTo(8, -16);
        ctx.lineTo(5, -26);
        ctx.lineTo(-5, -26);
        ctx.lineTo(-8, -16);
        ctx.lineTo(-26, -16);
        ctx.lineTo(-22, 12);
        ctx.closePath();
        ctx.stroke();

        // Seeded shields/solar arrays (30 variants)
        ctx.beginPath();
        if (seed % 3 === 0) {
          ctx.rect(22, -8, 8, 16);
          ctx.rect(-30, -8, 8, 16);
        } else if (seed % 3 === 1) {
          ctx.moveTo(26, -10);
          ctx.lineTo(38, -10);
          ctx.lineTo(38, 5);
          ctx.lineTo(22, 5);
          ctx.moveTo(-26, -10);
          ctx.lineTo(-38, -10);
          ctx.lineTo(-38, 5);
          ctx.lineTo(-22, 5);
        } else {
          ctx.arc(0, -6, 12, 0, Math.PI * 2);
        }
        ctx.stroke();

        // Internal heavy chassis plate lines
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(-22, 12); ctx.lineTo(-8, -16);
        ctx.moveTo(22, 12); ctx.lineTo(8, -16);
        ctx.rect(-6, -6, 12, 12);
        ctx.stroke();
        ctx.restore();
      } else if (enemy.type === 'kamikaze') {
        // Draw spiked warning sphere
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw inner warning core
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Pulsing outer warning spikes
        const spikeCycle = Math.sin(Date.now() / 60) * 3 + 3;
        ctx.beginPath();
        for (let s = 0; s < 8; s++) {
          const ang = (s * Math.PI) / 4;
          ctx.moveTo(Math.cos(ang) * 16, Math.sin(ang) * 16);
          ctx.lineTo(Math.cos(ang) * (20 + spikeCycle), Math.sin(ang) * (20 + spikeCycle));
        }
        ctx.stroke();
      } else if (enemy.type === 'shield_linker') {
        // Draw support barge with solar frames
        ctx.beginPath();
        ctx.rect(-18, -12, 36, 24);
        ctx.moveTo(-18, -12); ctx.lineTo(-24, -18); ctx.lineTo(24, -18); ctx.lineTo(18, -12);
        ctx.moveTo(-18, 12); ctx.lineTo(-24, 18); ctx.lineTo(24, 18); ctx.lineTo(18, 12);
        ctx.closePath();
        ctx.stroke();
        
        // glowing projector core
        ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
      } else if (enemy.type === 'anomaly') {
        // Crystalline neon purple shape
        const crystalRot = Date.now() * 0.002;
        ctx.save();
        ctx.rotate(crystalRot);
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(20, 12);
        ctx.lineTo(-20, 12);
        ctx.closePath();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -22);
        ctx.moveTo(0, 0);
        ctx.lineTo(20, 12);
        ctx.moveTo(0, 0);
        ctx.lineTo(-20, 12);
        ctx.stroke();
        ctx.restore();

        // Draw expanding gravity rings
        if (enemy.pulseRings) {
          enemy.pulseRings.forEach(ring => {
            ctx.save();
            ctx.strokeStyle = `rgba(139, 92, 246, ${Math.max(0, 1.0 - ring.radius / 380)})`;
            ctx.shadowColor = '#8b5cf6';
            ctx.shadowBlur = 6;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          });
        }
      } else if (enemy.type === 'mirage_decoy') {
        // Mirage Decoy split hull
        ctx.save();
        ctx.strokeStyle = 'rgba(219, 39, 119, 0.7)';
        ctx.shadowColor = '#db2777';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-15, -15); ctx.lineTo(-45, 15); ctx.lineTo(-8, 8);
        ctx.moveTo(15, -15); ctx.lineTo(45, 15); ctx.lineTo(8, 8);
        ctx.stroke();
        ctx.restore();
      } else if (enemy.type === 'meteor') {
        // Draw multi-layered glowing flame tail pointing upwards (behind descent direction)
        ctx.save();
        const gradient = ctx.createLinearGradient(0, 0, 0, -38 - Math.random() * 14);
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.7)');   // Bright red hot base
        gradient.addColorStop(0.4, 'rgba(249, 115, 22, 0.5)'); // Orange mid-tail
        gradient.addColorStop(1, 'rgba(253, 224, 71, 0.0)');   // Fading yellow tip
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.quadraticCurveTo(0, -5, 0, -38 - Math.random() * 14);
        ctx.quadraticCurveTo(0, -5, 10, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Draw rotated craggy meteor core
        ctx.save();
        const angle = (enemy.seed || 0) + (enemy.y * 0.035);
        ctx.rotate(angle);
        
        ctx.fillStyle = '#b45309';    // Dark amber/brown rocky core
        ctx.strokeStyle = '#f97316';  // Glowing orange crust border
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        const numSides = 8;
        const radius = 12;
        const seedValue = parseInt(enemy.id.replace(/[^0-9]/g, '')) || 5;
        
        for (let j = 0; j < numSides; j++) {
          const theta = (j / numSides) * Math.PI * 2;
          const offset = 0.82 + 0.36 * Math.sin(seedValue * 0.7 + j * 1.3);
          const rx = Math.cos(theta) * radius * offset;
          const ry = Math.sin(theta) * radius * offset;
          if (j === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw glowing internal lava cracks
        ctx.strokeStyle = '#fde047'; // Bright yellow-orange cracks
        ctx.lineWidth = 1.0;
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#fde047';
        ctx.beginPath();
        ctx.moveTo(-4, -2); ctx.lineTo(2, 4);
        ctx.moveTo(3, -4); ctx.lineTo(-2, 3);
        ctx.stroke();
        ctx.restore();
      } else {
        // Drones - styled like a solar probe droid (Common - 50 variants)
        ctx.moveTo(0, 16);
        ctx.lineTo(13, 2);
        ctx.lineTo(8, -10);
        ctx.lineTo(-8, -10);
        ctx.lineTo(-13, 2);
        ctx.closePath();
        ctx.stroke();

        // Seeded antennae/lasers (50 variants)
        ctx.beginPath();
        if (seed % 3 === 0) {
          ctx.moveTo(8, -10);
          ctx.lineTo(12, -18);
          ctx.moveTo(-8, -10);
          ctx.lineTo(-12, -18);
        } else if (seed % 3 === 1) {
          ctx.moveTo(5, 8);
          ctx.lineTo(5, 16);
          ctx.moveTo(-5, 8);
          ctx.lineTo(-5, 16);
        } else {
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
        }
        ctx.stroke();

        // Internal circuit core lines
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.moveTo(0, -10); ctx.lineTo(0, 10);
        ctx.stroke();
        ctx.restore();
      }
      
      // Translucent solid fill so they are highly visible
      let fillStyle = 'rgba(255, 255, 255, 0.12)';
      if (enemy.color === 'red') fillStyle = 'rgba(255, 51, 102, 0.12)';
      if (enemy.color === 'blue') fillStyle = 'rgba(51, 204, 255, 0.12)';
      if (enemy.color === 'green') fillStyle = 'rgba(57, 255, 20, 0.12)';
      ctx.fillStyle = fillStyle;
      ctx.fill();

      ctx.restore();

      // Draw text word label centered above the ship
      ctx.save();
      if (enemy.type === 'stealth_cloaker') {
        ctx.globalAlpha = enemy.opacity !== undefined ? enemy.opacity : 1.0;
      }
      const isTargeted = state.activeWordId === enemy.id;
      ctx.font = isTargeted ? '700 21px Consolas, monospace' : '700 19px Consolas, monospace';
      ctx.textAlign = 'center';

      const word = enemy.word;
      const progressIndex = enemy.targetIndex;

      // Draw glow behind active letters
      if (isTargeted) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = getColorHex(enemy.color);
      }

      // Draw typed letters (dim/gray or glowing) and untyped letters
      const wordWidth = ctx.measureText(word).width;
      let gravOffset = 0;
      if (state.bossObj && state.wave === 50) {
        gravOffset = Math.sin(Date.now() / 220 + enemy.y * 0.015) * 22;
      }
      const startX = enemy.x + gravOffset - wordWidth / 2;

      ctx.textBaseline = 'bottom';
      let currentX = startX;

      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        const hasTyped = i < progressIndex;

        if (hasTyped) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'; // Typed letters dimmed
        } else if (enemy.isInvulnerable) {
          ctx.fillStyle = '#ef4444'; // Linked/Locked red color
        } else {
          ctx.fillStyle = getColorHex(enemy.color); // Target color for active letters
        }
        
        const letterPosX = currentX + ctx.measureText(char).width / 2;
        const letterPosY = enemy.y - 25; // Adjusted higher since ship is 1.6x larger
        
        // Draw solid black text outline first for maximum legibility on stars/grids
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText(char, letterPosX, letterPosY);
        
        // Fill letter
        ctx.fillText(char, letterPosX, letterPosY);
        
        currentX += ctx.measureText(char).width;
      }

      // Draw ticking countdown timer for Kamikazes above the word label
      if (enemy.type === 'kamikaze' && enemy.kamikazeTimer !== undefined) {
        ctx.fillStyle = '#ef4444';
        ctx.font = '700 11px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        if (enemy.isCharged) {
          ctx.fillText(`!!! OVERDRIVE !!!`, 0, -48);
        } else {
          const secondsLeft = (enemy.kamikazeTimer / 60).toFixed(1);
          ctx.fillText(`${secondsLeft}s`, 0, -48);
        }
      }

      // Draw split timer bar for Replicators
      if (enemy.type === 'replicator' && enemy.splitTimer !== undefined) {
        ctx.save();
        const pct = Math.max(0, enemy.splitTimer / enemy.splitMaxTimer);
        ctx.fillStyle = '#22c55e'; // green timer
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-25, -48, 50, 4);
        ctx.fillRect(-25, -48, 50 * pct, 4);
        
        ctx.fillStyle = '#22c55e';
        ctx.font = '700 9px Orbitron, sans-serif';
        ctx.fillText(`SPLIT: ${(enemy.splitTimer / 60).toFixed(1)}s`, 0, -54);
        ctx.restore();
      }

      ctx.restore();
    });

    // Draw single-character bullets (white)
    state.bullets.forEach(bullet => {
      ctx.save();
      ctx.translate(bullet.x, bullet.y);
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ffffff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;

      // Small glowing circle containing the single letter
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 13px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(bullet.letter.toUpperCase(), 0, 0);

      ctx.restore();

      // If bullet has velocity velocities, update them
      if (bullet.vx !== undefined && bullet.vy !== undefined) {
        let speedFactor = 1.0;
        if (bullet.type === 'temporal') {
          speedFactor = 0.35 + Math.sin(Date.now() / 140 + bullet.y * 0.04) * 0.65;
        }
        bullet.x += bullet.vx * speedFactor;
        bullet.y += bullet.vy * speedFactor;
      }
    });

    // Thermobaric Devastator fire lanes warnings/flames drawing
    if (state.bossObj && state.bossObj.name === 'THERMOBARIC DEVASTATOR') {
      const b = state.bossObj;
      if (b.targetFireLane) {
        let laneX = getShipX(b.targetFireLane, canvas.width);
        if (isMultiplayer && players && players.length > 0) {
          const targetPlayer = players.find(p => p.position === b.targetFireLane);
          if (targetPlayer) {
            laneX = state.playerPositions[targetPlayer.socketId] || getShipTargetX(targetPlayer.socketId, canvas.width);
          }
        }
        ctx.save();
        if (b.fireWarningTime > 0) {
          // Pulsing warning overlay
          const alpha = Math.abs(Math.sin(Date.now() / 60)) * 0.15;
          ctx.fillStyle = `rgba(249, 115, 22, ${alpha})`;
          ctx.fillRect(laneX - 60, 0, 120, canvas.height);
          
          ctx.fillStyle = '#f97316';
          ctx.font = '700 12px Orbitron, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('FIRE ZONE APPROACHING', laneX, canvas.height - 180);
        } else if (b.fireActiveTime > 0) {
          // Active fire wall
          const alpha = 0.15 + Math.random() * 0.1;
          ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
          ctx.fillRect(laneX - 60, 0, 120, canvas.height);
          
          // Draw crackling fire lines
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let f = 0; f < 5; f++) {
            ctx.moveTo(laneX - 40 + Math.random() * 80, canvas.height);
            ctx.lineTo(laneX - 40 + Math.random() * 80, canvas.height - 120 - Math.random() * 150);
          }
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // Draw Player Ship(s)
    const localPosition = isMultiplayer 
      ? players.find(p => p.socketId === socket?.id)?.position || 'center' 
      : 'center';

    const renderShip = (x, y, color, labelText, isDead = false, reviveTimer = 0) => {
      ctx.save();
      ctx.translate(x, y);

      // Scale ship size relative to a base canvas width of 1200px (ensuring uniform size across screens)
      const shipScale = canvas.width / 1200;
      ctx.scale(shipScale, shipScale);

      const getRgbFromHex = (hex) => {
        const cleanHex = hex.replace('#', '');
        const r = parseInt(cleanHex.substring(0, 2), 16);
        const g = parseInt(cleanHex.substring(2, 4), 16);
        const b = parseInt(cleanHex.substring(4, 6), 16);
        return `${r}, ${g}, ${b}`;
      };

      if (isDead) {
        ctx.globalAlpha = 0.5;
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#4b5563'; // Gray offline color
      } else {
        ctx.shadowBlur = 10;
        ctx.shadowColor = getColorHex(color);
        ctx.strokeStyle = getColorHex(color);
      }
      ctx.lineWidth = 2.5;

      // Draw procedural player design based on color - Modern Spacecraft
      ctx.beginPath();
      ctx.moveTo(0, -22); // Cockpit nose tip
      ctx.lineTo(5, -8);
      ctx.lineTo(20, 8); // swept right wing
      ctx.lineTo(8, 4);
      ctx.lineTo(6, 12); // right engine nozzle
      ctx.lineTo(3, 8);
      ctx.lineTo(-3, 8);
      ctx.lineTo(-6, 12); // left engine nozzle
      ctx.lineTo(-8, 4);
      ctx.lineTo(-20, 8); // swept left wing
      ctx.lineTo(-5, -8);
      ctx.closePath();
      ctx.stroke();

      // Secondary detailed wing panel stripes
      ctx.save();
      const currentAlpha = ctx.globalAlpha;
      const resolvedColor = isDead ? '#4b5563' : getColorHex(color);
      ctx.strokeStyle = resolvedColor;
      ctx.globalAlpha = 0.35 * currentAlpha;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      // Left wing panels
      ctx.moveTo(-5, -8);
      ctx.lineTo(-14, 4);
      ctx.lineTo(-8, 3);
      // Right wing panels
      ctx.moveTo(5, -8);
      ctx.lineTo(14, 4);
      ctx.lineTo(8, 3);
      // Center hull spine
      ctx.moveTo(0, -18);
      ctx.lineTo(0, 5);
      ctx.stroke();
      ctx.restore();

      // Glowing Cockpit Glass
      if (!isDead) {
        ctx.fillStyle = `rgba(${getRgbFromHex(resolvedColor)}, ${0.45 * currentAlpha})`;
        ctx.beginPath();
        ctx.ellipse(0, -4, 3, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Side Laser Cannons
      ctx.strokeStyle = resolvedColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-10, 0); ctx.lineTo(-10, -6);
      ctx.moveTo(10, 0); ctx.lineTo(10, -6);
      ctx.stroke();

      // Draw thruster fire particles procedurally
      if (!isDead) {
        ctx.fillStyle = `rgba(${getRgbFromHex(resolvedColor)}, ${0.3 * currentAlpha})`;
        ctx.beginPath();
        ctx.moveTo(-6, 7);
        ctx.lineTo(0, 7 + Math.random() * 15);
        ctx.lineTo(6, 7);
        ctx.closePath();
        ctx.fill();
      } else {
        // Procedural smoke puff emitter for damaged/dead ships (not too flashy)
        if (Math.random() < 0.08) {
          state.particles.push({
            x: x + (Math.random() - 0.5) * 12,
            y: y - 10,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -0.5 - Math.random() * 0.5,
            size: 1.2 + Math.random() * 1.5,
            color: 'rgba(100, 116, 139, 0.4)', // Slate smoke gray
            alpha: 0.5,
            life: 20 + Math.random() * 15
          });
        }
      }

      // Draw username under the ship small
      ctx.fillStyle = `rgba(138, 143, 163, ${currentAlpha})`;
      ctx.font = '400 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labelText, 0, 30);

      // Draw countdown timer under name at 50% opacity
      if (isDead && reviveTimer > 0) {
        const secLeft = Math.ceil(reviveTimer / 60);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.5)'; // 50% opacity red
        ctx.font = '500 10px Orbitron, sans-serif';
        ctx.fillText(`${secLeft}S`, 0, 44);
      }

      // Draw tactical shield bubble if active for this player
      if (labelText.includes('(You)') && state.shieldActive) {
        ctx.strokeStyle = '#a3e635'; // Neon lime
        ctx.shadowColor = '#a3e635';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw subtle passive shield sparks based on defense percent
      if (labelText.includes('(You)') && state.streak >= 10) {
        const defLvl = state.streak >= 50 ? 50 : Math.floor(state.streak / 10) * 10;
        const sparkOpacity = (defLvl / 50) * 0.16 + 0.04;
        const sparkCount = Math.floor(defLvl / 10);
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${sparkOpacity})`;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 4;
        ctx.lineWidth = 1.0;
        
        for (let s = 0; s < sparkCount; s++) {
          const sparkAngle = (s * (Math.PI * 2)) / sparkCount + (Date.now() * 0.002);
          const sparkDist = 24 + Math.sin(Date.now() / 100 + s) * 2;
          const sx = Math.cos(sparkAngle) * sparkDist;
          const sy = Math.sin(sparkAngle) * sparkDist;
          
          ctx.beginPath();
          ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Draw boss shield bubble if active for this player
      if (labelText.includes('(You)') && state.bossShieldActive) {
        ctx.strokeStyle = '#38bdf8'; // Sky blue neon
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 15;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(0, 0, 31, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    };

    // Update smooth positions for active players
    if (players) {
      players.forEach(p => {
        const targetX = getShipTargetX(p.socketId, canvas.width);
        if (state.playerPositions[p.socketId] === undefined) {
          state.playerPositions[p.socketId] = targetX;
        } else {
          state.playerPositions[p.socketId] += (targetX - state.playerPositions[p.socketId]) * 0.08;
        }
      });
    }

    // Update leaving ships positions
    if (state.leavingShips) {
      state.leavingShips.forEach(ship => {
        ship.y += ship.vy;
        ship.vy += 0.35; // drift back / accelerate downwards
        ship.opacity = Math.max(0, ship.opacity - 0.02);
      });
      state.leavingShips = state.leavingShips.filter(ship => ship.y < canvas.height + 150 && ship.opacity > 0);
    }

    if (isMultiplayer && players) {
      // Draw all active teammates in co-op
      players.forEach(p => {
        const sx = state.playerPositions[p.socketId] || getShipTargetX(p.socketId, canvas.width);
        let sy = canvas.height - 80;
        if (state.waveState === 'docking') {
          sy -= state.dockingShipYOffset;
        } else if (state.waveState === 'intro' && state.waveTransitionTimer > 30) {
          const delay = p.isHost ? 0 : 20;
          const activeTimer = state.waveTransitionTimer - 30;
          const startY = canvas.height + 100;
          const targetY = canvas.height - 80;
          if (activeTimer > delay) {
            const progress = (activeTimer - delay) / (90 - delay);
            sy = targetY + (startY - targetY) * Math.pow(progress, 2);
          } else {
            sy = targetY; // Fixes flickering for non-hosts
          }
        }
        
        const mateState = state.teammates.find(m => m.socketId === p.socketId);
        const isSelf = p.socketId === socket?.id;
        const myHealth = isSelf ? state.health : (mateState ? mateState.health : 100);
        const timer = isSelf ? state.reviveTimeRemaining : (mateState ? mateState.reviveTimeRemaining : 0);
        
        const suffix = isSelf ? ' (You)' : '';
        renderShip(sx, sy, p.color || shipColor, p.username + suffix, myHealth <= 0, timer);
      });

      // Draw leaving ships flying out of the screen
      if (state.leavingShips) {
        state.leavingShips.forEach(ship => {
          ctx.save();
          ctx.globalAlpha = ship.opacity;
          renderShip(ship.x, ship.y, ship.color, ship.username);
          ctx.restore();
        });
      }
    } else {
      // Draw single solo player ship
      let sy = canvas.height - 80;
      if (state.waveState === 'docking') {
        sy -= state.dockingShipYOffset;
      } else if (state.waveState === 'intro' && state.waveTransitionTimer > 30) {
        const activeTimer = state.waveTransitionTimer - 30;
        const progress = activeTimer / 90;
        const startY = canvas.height + 100;
        const targetY = canvas.height - 80;
        sy = targetY + (startY - targetY) * Math.pow(progress, 2);
      }
      renderShip(canvas.width / 2, sy, shipColor, username + ' (You)');
    }

    // Render Docking Space Station Hangar visual overlays
    if (state.waveState === 'docking') {
      ctx.save();
      // Draw massive space station hangar hull (low opacity vector lines)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1.5;
      
      const stationY = -120 + state.dockingShipYOffset * 0.75;
      ctx.beginPath();
      // Draw hanger ceiling
      ctx.rect(canvas.width * 0.15, stationY, canvas.width * 0.7, 80);
      ctx.stroke();

      // Hanger bay support trusses
      ctx.beginPath();
      for (let tx = canvas.width * 0.2; tx < canvas.width * 0.8; tx += 60) {
        ctx.rect(tx, stationY, 20, 80);
      }
      ctx.stroke();
      
      // Draw clamp arms and guide lasers for each ship
      const shipXCoords = isMultiplayer
        ? players.map(p => getShipX(p.position, canvas.width))
        : [canvas.width / 2];

      shipXCoords.forEach(shipX => {
        const shipY = canvas.height - 80 - state.dockingShipYOffset;

        // Alignment guide lasers (thin dashed cyan)
        if (state.dockingShipYOffset > 80) {
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
          ctx.lineWidth = 1.0;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(shipX - 25, stationY + 80);
          ctx.lineTo(shipX - 25, shipY);
          ctx.moveTo(shipX + 25, stationY + 80);
          ctx.lineTo(shipX + 25, shipY);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Mechanical clamps claws (grayish steel arms)
        if (state.dockingShipYOffset > 170) {
          ctx.strokeStyle = 'rgba(138, 143, 163, 0.6)';
          ctx.lineWidth = 3.0;
          ctx.beginPath();
          // Left clamp claw arm extending out
          ctx.moveTo(shipX - 44, shipY);
          ctx.lineTo(shipX - 20, shipY);
          // Right clamp claw arm
          ctx.moveTo(shipX + 44, shipY);
          ctx.lineTo(shipX + 20, shipY);
          ctx.stroke();

          // Spark particle puffs on impact (triggers once)
          if (!state.hasPuffedSteam) {
            createExplosion(shipX - 20, shipY, '#cbd5e1', 12);
            createExplosion(shipX + 20, shipY, '#cbd5e1', 12);
            state.hasPuffedSteam = true;
            
            // Checkpoint Auto-Save Trigger
            if (!isMultiplayer && state.wave % 10 === 0 && onSaveCheckpoint) {
              onSaveCheckpoint(state.wave);
            }
          }
        }
      });
      ctx.restore();
    }

    // Cutscenes & Banners (e.g. Wave transitions)
    if (state.waveState === 'intro' && (!state.anomalyWarningTimer || state.anomalyWarningTimer <= 0)) {
      ctx.save();
      // Sliding background grid flash
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fillRect(0, canvas.height * 0.35, canvas.width, canvas.height * 0.3);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.35);
      ctx.lineTo(canvas.width, canvas.height * 0.35);
      ctx.moveTo(0, canvas.height * 0.65);
      ctx.lineTo(canvas.width, canvas.height * 0.65);
      ctx.stroke();

      // Main Text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Flash title
      if (state.wave === 1) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 2.2rem Orbitron, sans-serif';
        const titleText = isMultiplayer ? "STRIKE TEAM VANGUARDZ" : "VANGUARDZ-01";
        ctx.fillText(titleText, canvas.width / 2, canvas.height * 0.44);

        ctx.fillStyle = isMultiplayer ? getColorHex('green') : getColorHex('red');
        ctx.font = '500 1.05rem Outfit, sans-serif';
        const subtitleText = isMultiplayer
          ? "Coordinates locked. Stand together, die together."
          : "Entering Sector S... You are on your own. For the fallen.";
        ctx.fillText(subtitleText, canvas.width / 2, canvas.height * 0.52);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 3rem Orbitron, sans-serif';
        ctx.fillText(`WAVE ${state.wave}`, canvas.width / 2, canvas.height * 0.46);

        ctx.fillStyle = getColorHex('blue');
        ctx.font = '400 1rem Outfit, sans-serif';
        ctx.fillText('INCOMING HOSTILE ATTACKS - PREPARE KEYBOARD', canvas.width / 2, canvas.height * 0.54);
      }

      ctx.restore();
    } else if (state.waveState === 'boss_warning') {
      ctx.save();
      // Blinking red alert screen
      const alpha = Math.abs(Math.sin(state.waveTransitionTimer * 0.08)) * 0.2;
      ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(255, 0, 0, 0.05)';
      ctx.fillRect(0, canvas.height * 0.35, canvas.width, canvas.height * 0.3);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.fillStyle = getColorHex('red');
      ctx.font = '900 3.2rem Orbitron, sans-serif';
      ctx.fillText(`WARNING`, canvas.width / 2, canvas.height * 0.45);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 1.2rem Outfit, sans-serif';
      ctx.fillText(`BOSS DREADNOUGHT APPROACHING`, canvas.width / 2, canvas.height * 0.55);

      ctx.restore();
    }

    // Render Meteor Shower Warning Alert Banner
    if (state.meteorShowerWarningTimer && state.meteorShowerWarningTimer > 0) {
      ctx.save();
      // Blinking orange alert screen
      const alpha = Math.abs(Math.sin(state.meteorShowerWarningTimer * 0.08)) * 0.15;
      ctx.fillStyle = `rgba(249, 115, 22, ${alpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.fillStyle = '#f97316'; // Orange warning
      ctx.font = '900 2.6rem Orbitron, sans-serif';
      ctx.fillText(`METEOR SHOWER DETECTED`, canvas.width / 2, canvas.height * 0.45);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '500 1.1rem Outfit, sans-serif';
      ctx.fillText(`DESTROY DRIFTING METEORS IMMEDIATELY`, canvas.width / 2, canvas.height * 0.53);

      ctx.restore();
    }

    // Render Quantum Anomaly Warning Alert Banner
    if (state.anomalyWarningTimer && state.anomalyWarningTimer > 0) {
      state.anomalyWarningTimer -= 1;
      ctx.save();
      // Blinking purple alert screen
      const alpha = Math.abs(Math.sin(state.anomalyWarningTimer * 0.08)) * 0.15;
      ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.fillStyle = '#8b5cf6'; // Purple warning
      ctx.font = '900 2.6rem Orbitron, sans-serif';
      ctx.fillText(`QUANTUM ANOMALY DETECTED`, canvas.width / 2, canvas.height * 0.45);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '500 1.1rem Outfit, sans-serif';
      ctx.fillText(`SYSTEM DISTORTION IN PROGRESS - CLEAR ANOMALY SHIELD`, canvas.width / 2, canvas.height * 0.53);

      ctx.restore();
    }

    // Draw Impact Frame Flash (brief screen invert color flash on hits)
    if (state.flashFrame > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${state.flashFrame * 0.15})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Render soft pulsing red vignette on low health
    if (state.health < 25 && state.health > 0) {
      ctx.save();
      const vignetteAlpha = (0.12 + Math.sin(Date.now() * 0.005) * 0.06) * ((25 - state.health) / 25);
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.4,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.75
      );
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0)');
      gradient.addColorStop(1, `rgba(239, 68, 68, ${vignetteAlpha})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // Draw local revive recovery ring
    if (state.reviveRingActive) {
      const myX = getLocalShipX(canvas.width);
      const myY = canvas.height - 80;
      ctx.save();
      ctx.strokeStyle = `rgba(34, 197, 94, ${1 - state.reviveRingRadius / 60})`;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(myX, myY, state.reviveRingRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw full-screen revive dim overlay & central countdown
    if (state.isReviving && state.reviveTimeRemaining > 0) {
      ctx.save();
      // Draw 50% opacity full screen dark overlay
      ctx.fillStyle = 'rgba(10, 10, 15, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw a clean system message and countdown in the center
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.font = '900 14px Orbitron, sans-serif';
      ctx.fillText('CRITICAL DAMAGE - SYSTEM RECOVERY IN PROGRESS', canvas.width / 2, canvas.height * 0.45);
      
      const secLeft = Math.ceil(state.reviveTimeRemaining / 60);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px Orbitron, sans-serif';
      ctx.fillText(secLeft.toString(), canvas.width / 2, canvas.height * 0.52);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '400 11px Outfit, sans-serif';
      ctx.fillText('STANDBY PILOT - WEAPONS OFFLINE', canvas.width / 2, canvas.height * 0.58);
      
      ctx.restore();
    }

    ctx.restore(); // Pop Screen Shake
  };

  // Check if target was boss shield
  const handleEnemyCompletion = (enemyId) => {
    // If it is a boss shield word
    if (enemyId.startsWith('boss-w-')) {
      const state = stateRef.current;
      const players = state.players || [];
      const isHost = !isMultiplayer || (players.find(p => p.socketId === socket?.id)?.isHost);
      if (isHost) {
        checkBossShieldsCompleted(enemyId);
      }
    }
  };

  const updateStreakShield = (streak) => {
    let defPercent = 0;
    if (streak >= 50) defPercent = 50;
    else if (streak >= 40) defPercent = 40;
    else if (streak >= 30) defPercent = 30;
    else if (streak >= 20) defPercent = 20;
    else if (streak >= 10) defPercent = 10;
    
    setHudState(prev => {
      if (prev.defPercent !== defPercent) {
        return { ...prev, defPercent };
      }
      return prev;
    });
  };

  const keyHandlerRef = useRef(handleKeyDown);
  useEffect(() => {
    keyHandlerRef.current = handleKeyDown;
  });

  const [paused, setPaused] = useState(false);
  const [pausingPlayers, setPausingPlayers] = useState([]);
  const [pausingSocketIds, setPausingSocketIds] = useState([]);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  const handlePauseRequest = () => {
    if (socket && isMultiplayer) {
      socket.send(JSON.stringify({ type: 'PAUSE_REQUEST' }));
    }
  };

  const handleResumeRequest = () => {
    if (socket && isMultiplayer) {
      socket.send(JSON.stringify({ type: 'RESUME_REQUEST' }));
    }
  };
  const [charge, setCharge] = useState(0);
  const [cooldowns, setCooldowns] = useState([0, 0, 0]);
  const [bossShields, setBossShields] = useState(0);
  const [bossShieldActiveTime, setBossShieldActiveTime] = useState(0);
  const [statusClocks, setStatusClocks] = useState({ overclock: 0, decoy: 0, nebula: 0, stabilizer: 0, overdrive: 0, reflector: 0, hologram: 0 });

  // Sync React state back to stateRef
  useEffect(() => {
    stateRef.current.isPaused = paused;
  }, [paused]);

  const togglePause = () => {
    if (stateRef.current.isLocalGameOver) return;
    GameAudio.play('click');
    setPaused(prev => {
      const next = !prev;
      if (!next) {
        // Refocus canvas after resuming to receive keypresses
        setTimeout(() => {
          canvasRef.current?.focus();
        }, 50);
      }
      return next;
    });
  };

  return (
    <div 
      className="game-screen" 
      onClick={() => canvasRef.current && canvasRef.current.focus()}
    >
      <canvas
        id="gameCanvas"
        ref={canvasRef}
        tabIndex="0"
      />

      {/* Tactical Skill HUD Overlay (Left Column - Under Multiplier) */}
      <div 
        style={{
          position: 'absolute',
          left: '1.5rem',
          top: '7.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '0.8rem',
          zIndex: 100,
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      >
        {/* Row containing Charge Bar & Boss Shield */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          {/* Vertical Charge Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
            <div 
              style={{
                width: '8px',
                height: '50px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '4px',
                position: 'relative',
                overflow: 'hidden',
                opacity: charge >= 100 ? 0.75 : 0.2,
                transition: 'opacity 0.3s ease, box-shadow 0.3s ease',
                boxShadow: charge >= 100 ? '0 0 10px rgba(74, 144, 226, 0.4)' : 'none'
              }}
            >
              <div 
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: `${charge}%`,
                  background: '#4a90e2',
                  transition: 'height 0.2s ease'
                }}
              />
            </div>
            <span 
              style={{ 
                fontFamily: 'var(--font-display)', 
                fontSize: '8px', 
                color: '#ffffff', 
                letterSpacing: '0.5px',
                opacity: charge >= 100 ? 0.75 : 0.25,
                transition: 'opacity 0.3s'
              }}
            >
              {charge}%
            </span>
          </div>

          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem',
              opacity: 0.75, // always glowing at 75%
              transition: 'opacity 0.3s'
            }}
          >
            {hudState.defPercent > 0 && (
              <span 
                style={{ 
                  fontSize: '7px', 
                  fontFamily: 'var(--font-display)', 
                  color: '#ffffff', 
                  opacity: 0.35,
                  letterSpacing: '0.5px',
                  marginBottom: '0.1rem'
                }}
              >
                {hudState.defPercent}% DEF
              </span>
            )}
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              {[0, 1, 2].map(sIdx => {
                const isClaimed = bossShields > sIdx;
                return (
                  <div 
                     key={sIdx}
                     style={{
                       width: '18px',
                       height: '18px',
                       borderRadius: '50%',
                       border: isClaimed ? '1px solid #38bdf8' : '1px dashed rgba(56, 189, 248, 0.15)',
                       background: isClaimed ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                       boxShadow: isClaimed ? '0 0 6px rgba(56, 189, 248, 0.4)' : 'none',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       opacity: isClaimed ? 0.75 : 0.15,
                       transition: 'all 0.3s ease'
                     }}
                   >
                     <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5">
                       <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                     </svg>
                   </div>
                 );
               })}
             </div>
          </div>

          {/* Active Boss Shield timer display next to it */}
          {bossShieldActiveTime > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginLeft: '0.2rem' }}>
              <span style={{ fontSize: '7px', fontFamily: 'var(--font-display)', color: '#38bdf8', opacity: 0.25, letterSpacing: '0.5px' }}>
                SHIELD
              </span>
              <span style={{ fontSize: '9px', fontFamily: 'var(--font-display)', color: '#38bdf8', opacity: 0.25, fontWeight: 700 }}>
                {bossShieldActiveTime}s
              </span>
            </div>
          )}
        </div>

        {/* Vertical Skill Slots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.2rem' }}>
          {[0, 1, 2].map(idx => {
            const skId = equippedSkills ? equippedSkills[idx] : null;
            const skill = SKILLS_DB.find(s => s.id === skId);
            if (!skill) return null;

            const empLock = stateRef.current && stateRef.current.empDrainedTimer > 0;
            const isUsable = charge >= skill.cost && cooldowns[idx] === 0 && !empLock;
            const isOnCooldown = cooldowns[idx] > 0;

            const getActiveDuration = (sId) => {
              if (sId === 'overclock') return statusClocks.overclock;
              if (sId === 'decoy_probe') return statusClocks.decoy;
              if (sId === 'nebula_veil') return statusClocks.nebula;
              if (sId === 'combo_stabilizer') return statusClocks.stabilizer;
              if (sId === 'overdrive_thruster') return statusClocks.overdrive;
              if (sId === 'reflector_shield') return statusClocks.reflector;
              if (sId === 'hologram_decoy') return statusClocks.hologram;
              if (sId === 'emp_discharge') return Math.ceil(stateRef.current.empFreezeTime / 1000);
              return 0;
            };

            const actTime = getActiveDuration(skill.id);

            let borderStyle = empLock ? '1px dashed #f59e0b' : `1px solid ${skill.color}`;
            let shadowStyle = empLock ? '0 0 8px #f59e0b35' : `0 0 6px ${skill.color}15`;
            if (isUsable) {
              shadowStyle = `0 0 10px ${skill.color}45`;
            }

            return (
              <div 
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem'
                }}
              >
                {/* Skill Circle */}
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    border: borderStyle,
                    background: 'rgba(5, 5, 8, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: empLock ? '#fbbf24' : skill.color,
                    opacity: empLock ? 0.65 : (isUsable ? 0.75 : 0.12),
                    boxShadow: shadowStyle,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {skill.svgIcon(empLock ? '#f59e0b' : skill.color)}

                  {empLock && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(245, 158, 11, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: '7.5px',
                        fontWeight: 900,
                        fontFamily: 'var(--font-display)',
                        letterSpacing: '0.5px'
                      }}
                    >
                      EMP
                    </div>
                  )}

                  {/* Cooldown Wipe Circle */}
                  {isOnCooldown && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0, 0, 0, 0.55)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {/* Faint Red Strike-off Slash Line */}
                      <div 
                        style={{
                          position: 'absolute',
                          width: '120%',
                          height: '1.5px',
                          background: '#cf4042',
                          transform: 'rotate(-45deg)',
                          opacity: 0.35
                        }}
                      />
                      
                      <span 
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '9px',
                          fontWeight: 700,
                          color: '#ffffff',
                          opacity: 0.6,
                          zIndex: 2
                        }}
                      >
                        {cooldowns[idx]}s
                      </span>
                    </div>
                  )}
                </div>

                {/* Active duration clock indicator next to it */}
                {actTime > 0 && (
                  <span 
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '7px',
                      color: skill.color,
                      opacity: 0.22,
                      fontWeight: 600,
                      letterSpacing: '0.5px',
                      marginLeft: '0.2rem'
                    }}
                  >
                    {actTime}s
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pause Menu Overlay in HTML/React when paused */}
      {paused && (
        <div 
          className="modal-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(2, 2, 6, 0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 90,
            pointerEvents: 'auto',
            backdropFilter: 'blur(12px)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="glass-panel" 
            style={{
              position: 'relative',
              width: '90%',
              maxWidth: '380px',
              background: 'rgba(5, 5, 12, 0.96)',
              border: '1px solid rgba(74, 144, 226, 0.15)',
              padding: '2.5rem 2rem',
              borderRadius: '4px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(74, 144, 226, 0.05)',
              animation: 'fadeIn 0.3s ease-out',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2rem'
            }}
          >
            {/* Cyber Corner Brackets */}
            <div style={{ position: 'absolute', top: '12px', left: '12px', width: '16px', height: '16px', borderTop: '2px solid rgba(74, 144, 226, 0.3)', borderLeft: '2px solid rgba(74, 144, 226, 0.3)' }} />
            <div style={{ position: 'absolute', top: '12px', right: '12px', width: '16px', height: '16px', borderTop: '2px solid rgba(74, 144, 226, 0.3)', borderRight: '2px solid rgba(74, 144, 226, 0.3)' }} />
            <div style={{ position: 'absolute', bottom: '12px', left: '12px', width: '16px', height: '16px', borderBottom: '2px solid rgba(74, 144, 226, 0.3)', borderLeft: '2px solid rgba(74, 144, 226, 0.3)' }} />
            <div style={{ position: 'absolute', bottom: '12px', right: '12px', width: '16px', height: '16px', borderBottom: '2px solid rgba(74, 144, 226, 0.3)', borderRight: '2px solid rgba(74, 144, 226, 0.3)' }} />

            {/* Header */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontFamily: 'var(--font-display)', 
                fontSize: '1.6rem', 
                fontWeight: 900, 
                color: '#ffffff', 
                letterSpacing: '5px', 
                textShadow: '0 0 15px rgba(74, 144, 226, 0.4)',
                marginBottom: '0.4rem',
                textTransform: 'uppercase'
              }}>
                Tactical Pause
              </div>
              <div style={{ 
                fontFamily: 'var(--font-body)', 
                fontSize: '0.75rem', 
                color: 'rgba(255, 255, 255, 0.4)', 
                letterSpacing: '1.5px', 
                textTransform: 'uppercase'
              }}>
                {isMultiplayer ? 'Co-op Session standby' : 'Solo Mission standby'}
              </div>
            </div>

            {/* Diagnostics Stats */}
            <div style={{ 
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              padding: '1.5rem 0'
            }}>
              {/* Wave */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.55)', letterSpacing: '0.5px' }}>Wave:</span>
                <span style={{ fontFamily: 'var(--font-display)', color: 'var(--neon-blue)', fontWeight: 'bold' }}>{hudState.wave}</span>
              </div>

              {/* Score */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.55)', letterSpacing: '0.5px' }}>Score:</span>
                <span style={{ fontFamily: 'var(--font-display)', color: 'var(--neon-yellow)', fontWeight: 'bold' }}>{hudState.score.toLocaleString()}</span>
              </div>

              {/* Multiplier */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.55)', letterSpacing: '0.5px' }}>Multiplier:</span>
                <span style={{ 
                  fontFamily: 'var(--font-display)', 
                  color: 'var(--neon-green)', 
                  fontWeight: 'bold',
                  textShadow: '0 0 8px rgba(46, 189, 89, 0.3)'
                }}>
                  {hudState.multiplier}x
                </span>
              </div>

              {/* Shield */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.55)', letterSpacing: '0.5px' }}>Shield:</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {stateRef.current.shieldActive && (
                    <span style={{ 
                      fontSize: '0.7rem', 
                      color: 'var(--neon-green)', 
                      border: '1px solid var(--neon-green)', 
                      padding: '1px 6px', 
                      borderRadius: '3px', 
                      textTransform: 'uppercase', 
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '0.5px'
                    }}>
                      Active
                    </span>
                  )}
                  <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                    {[0, 1, 2].map(sIdx => {
                      const isClaimed = bossShields > sIdx;
                      return (
                        <div 
                          key={sIdx}
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            border: isClaimed ? '1px solid #38bdf8' : '1px dashed rgba(56, 189, 248, 0.25)',
                            background: isClaimed ? 'rgba(56, 189, 248, 0.4)' : 'transparent',
                            boxShadow: isClaimed ? '0 0 6px rgba(56, 189, 248, 0.6)' : 'none',
                            opacity: isClaimed ? 1.0 : 0.25,
                            transition: 'all 0.3s ease'
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'center' }}>
              {isMultiplayer ? (
                <div style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                    Status: <span style={{ color: 'var(--neon-yellow)', fontWeight: 'bold' }}>STANDBY</span>
                    <br />
                    Paused by: <span style={{ color: 'var(--neon-blue)', fontWeight: 'bold' }}>{pausingPlayers.join(' & ')}</span>
                  </div>
                  {pausingSocketIds.includes(socket?.id) ? (
                    <>
                      <button
                        className="btn btn-blue"
                        style={{
                          width: '100%',
                          maxWidth: '280px',
                          padding: '0.8rem',
                          fontSize: '0.85rem',
                          fontFamily: 'var(--font-display)',
                          letterSpacing: '2px',
                          textTransform: 'uppercase',
                          borderRadius: '2px',
                          cursor: 'pointer'
                        }}
                        onClick={handleResumeRequest}
                      >
                        Resume Mission
                      </button>
                      {pausingPlayers.length > 1 && (
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>
                          Waiting for other pausing pilots to resume...
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '0.75rem', color: 'var(--neon-red)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem', fontWeight: 'bold' }}>
                        Waiting for pausing pilots to resume
                      </div>
                      <button
                        className="btn btn-red"
                        style={{
                          width: '100%',
                          maxWidth: '280px',
                          padding: '0.8rem',
                          fontSize: '0.85rem',
                          fontFamily: 'var(--font-display)',
                          letterSpacing: '2px',
                          textTransform: 'uppercase',
                          borderRadius: '2px',
                          cursor: 'pointer',
                          borderColor: 'var(--neon-red)',
                          background: 'rgba(239, 68, 68, 0.05)',
                          color: 'var(--neon-red)'
                        }}
                        onClick={handlePauseRequest}
                      >
                        Request Pause (Pause Also)
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <button
                  className="btn btn-blue"
                  style={{
                    width: '100%',
                    maxWidth: '280px',
                    padding: '0.8rem',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}
                  onClick={togglePause}
                >
                  Resume Mission
                </button>
              )}

              <button
                className="btn btn-red"
                style={{
                  width: '100%',
                  maxWidth: '280px',
                  padding: '0.8rem',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  GameAudio.play('click');
                  setShowQuitConfirm(true);
                }}
              >
                Abandon Mission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Themed Custom React Warning PopUp for Abandoning Mission */}
      {showQuitConfirm && (
        <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)', zIndex: 2000 }}>
          <div 
            style={{ 
              maxWidth: '440px',
              width: '100%',
              background: 'rgba(6, 6, 10, 0.98)',
              border: '1px solid var(--neon-red)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)',
              padding: '3.5rem 3rem',
              borderRadius: '2px',
              textAlign: 'center',
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--neon-red)', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
              ABANDON MISSION
            </div>
            
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', lineHeight: '1.7', color: '#dcdfe8', marginBottom: '3rem', fontWeight: 300, textAlign: 'center' }}>
              Are you sure you want to abort the current wave deployment and return to command? Unsaved score progress will be terminated.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn" 
                style={{ 
                  flex: 1, 
                  background: 'transparent', 
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  borderRadius: '2px',
                  letterSpacing: '1.5px',
                  fontSize: '0.85rem'
                }}
                onClick={() => { GameAudio.play('click'); setShowQuitConfirm(false); }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ 
                  flex: 1, 
                  background: 'transparent', 
                  border: '1px solid var(--neon-red)',
                  color: 'var(--neon-red)',
                  borderRadius: '2px',
                  letterSpacing: '2.5px',
                  fontSize: '0.85rem'
                }}
                onClick={() => { 
                  GameAudio.play('click'); 
                  setShowQuitConfirm(false);
                  setPaused(false);
                  onQuitToMenu(); 
                }}
              >
                Abort
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Sound Button */}
      <button
        className="game-top-btn"
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '9.5rem',
          background: 'rgba(12, 12, 28, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#ffffff',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          pointerEvents: 'auto',
          zIndex: 100,
          outline: 'none'
        }}
        onClick={(e) => {
          e.stopPropagation();
          onToggleMute();
        }}
      >
        {muted ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
        )}
      </button>

      {/* Pause Button */}
      <button
        className="game-top-btn"
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '6.5rem',
          background: 'rgba(12, 12, 28, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#ffffff',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          pointerEvents: 'auto',
          zIndex: 100,
          fontFamily: 'var(--font-display)',
          fontSize: '0.9rem',
          outline: 'none'
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (isMultiplayer) {
            if (pausingSocketIds.includes(socket?.id)) {
              handleResumeRequest();
            } else {
              handlePauseRequest();
            }
          } else {
            togglePause();
          }
        }}
      >
        {paused ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ transform: 'translateX(1px)' }}>
            <polygon points="5,3 19,12 5,21" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <rect x="5" y="4" width="4" height="16" />
            <rect x="15" y="4" width="4" height="16" />
          </svg>
        )}
      </button>

      <GameHUD
        score={hudState.score}
        multiplier={hudState.multiplier}
        wave={hudState.wave}
        isMultiplayer={isMultiplayer}
        maxPlayers={maxPlayers}
        teamPlayers={hudState.teammates}
        health={hudState.health}
        localPlayerId={socket?.id}
        localPlayerColor={shipColor}
      />
    </div>
  );
}
