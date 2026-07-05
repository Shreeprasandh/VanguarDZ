import React, { useState, useEffect, useRef } from 'react';
import MainMenu from './components/MainMenu';
import ProfileEdit from './components/ProfileEdit';
import Leaderboard from './components/Leaderboard';
import Lobby from './components/Lobby';
import GameCanvas from './components/GameCanvas';
import GameOver from './components/GameOver';
import { GameAudio } from './game/audio';
import MenuBackground from './components/MenuBackground';
import StoryModal from './components/StoryModal';
import DockingStation from './components/DockingStation';
import InfoPopup from './components/InfoPopup';

export default function App() {
  // Profile settings (persisted in localStorage)
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('cybertype_username') || `Pilot-${Math.floor(1000 + Math.random() * 9000)}`;
  });
  const [shipColor, setShipColor] = useState(() => {
    return localStorage.getItem('cybertype_color') || 'blue';
  });
  const [equippedSkills, setEquippedSkills] = useState(() => {
    try {
      const saved = localStorage.getItem('cybertype_skills');
      return saved ? JSON.parse(saved) : ['emp_discharge', 'overclock', 'nebula_veil'];
    } catch(e) {
      return ['emp_discharge', 'overclock', 'nebula_veil'];
    }
  });

  // App routing state
  const [screen, setScreen] = useState('menu'); // 'menu', 'lobby', 'playing', 'gameover'
  const [transitionState, setTransitionState] = useState('idle'); // 'idle', 'warp-in', 'warp-out'
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [muted, setMuted] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Multiplayer room state
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [maxPlayers, setMaxPlayers] = useState(3);
  const [leaderboard, setLeaderboard] = useState([]);

  const socketRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [showServerWakeup, setShowServerWakeup] = useState(false);
  const [serverWakeupCountdown, setServerWakeupCountdown] = useState(45);

  // Gameplay scoring caches
  const [gameStats, setGameStats] = useState({ score: 0, wave: 1 });

  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const userAgentMobile = mobileRegex.test(navigator.userAgent);
      const touchMobile = navigator.maxTouchPoints > 0 && window.innerWidth <= 1024;
      setIsMobileDevice(userAgentMobile || touchMobile);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Manage background menu/lobby theme audio lifecycle
  useEffect(() => {
    GameAudio.init();

    // Auto-play menu theme immediately after startup if in menu/lobby
    const autoPlayTimer = setTimeout(() => {
      if (screen === 'menu' || screen === 'lobby') {
        GameAudio.playMusic('menu_theme');
      }
    }, 0);

    // Fallback user gesture to force play if blocked by browser
    const forcePlayOnInteraction = () => {
      if (screen === 'menu' || screen === 'lobby') {
        GameAudio.playMusic('menu_theme');
      }
      window.removeEventListener('click', forcePlayOnInteraction);
      window.removeEventListener('keydown', forcePlayOnInteraction);
      window.removeEventListener('touchstart', forcePlayOnInteraction);
      window.removeEventListener('mousemove', forcePlayOnInteraction);
      window.removeEventListener('mouseover', forcePlayOnInteraction);
    };

    window.addEventListener('click', forcePlayOnInteraction);
    window.addEventListener('keydown', forcePlayOnInteraction);
    window.addEventListener('touchstart', forcePlayOnInteraction);
    window.addEventListener('mousemove', forcePlayOnInteraction);
    window.addEventListener('mouseover', forcePlayOnInteraction);

    // Stop menu theme if leaving menu/lobby
    if (screen !== 'menu' && screen !== 'lobby') {
      clearTimeout(autoPlayTimer);
      GameAudio.stopMenuTheme();
    }

    return () => {
      clearTimeout(autoPlayTimer);
      window.removeEventListener('click', forcePlayOnInteraction);
      window.removeEventListener('keydown', forcePlayOnInteraction);
      window.removeEventListener('touchstart', forcePlayOnInteraction);
      window.removeEventListener('mousemove', forcePlayOnInteraction);
      window.removeEventListener('mouseover', forcePlayOnInteraction);
    };
  }, [screen]);

  // Set up WebSocket Connection
  useEffect(() => {
    const socketUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'ws://localhost:3000'
      : 'wss://vanguardz.onrender.com';
    console.log(`Connecting to WebSocket: ${socketUrl}`);

    let socketOpen = false;
    let wakeupTimer = null;

    const connect = () => {
      if (wakeupTimer) clearTimeout(wakeupTimer);
      wakeupTimer = setTimeout(() => {
        if (!socketOpen) {
          setShowServerWakeup(true);
        }
      }, 1800);

      const socket = new WebSocket(socketUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('WebSocket connected!');
        socketOpen = true;
        setSocketConnected(true);
        setShowServerWakeup(false);
        if (wakeupTimer) clearTimeout(wakeupTimer);
        // Register current username on connect
        socket.send(JSON.stringify({
          type: 'REGISTER',
          username: username
        }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'LEADERBOARD_UPDATE':
              setLeaderboard(data.leaderboard);
              break;

            case 'ROOM_CREATED':
              setRoomCode(data.roomCode);
              setPlayers(data.players);
              setMaxPlayers(data.maxPlayers || 3);
              setIsMultiplayer(true);
              changeScreenWithFade('lobby');
              break;

            case 'ROOM_JOINED':
              setRoomCode(data.roomCode);
              setPlayers(data.players);
              setMaxPlayers(data.maxPlayers || 3);
              setIsMultiplayer(true);
              changeScreenWithFade('lobby');
              break;

            case 'ROOM_PLAYERS_UPDATE':
              setPlayers(data.players);
              if (data.maxPlayers) {
                setMaxPlayers(data.maxPlayers);
              }
              break;

            case 'GAME_STARTED':
              setPlayers(data.players);
              if (data.maxPlayers) {
                setMaxPlayers(data.maxPlayers);
              }
              changeScreenWithFade('playing');
              break;

            case 'ROOM_ERROR':
              alert(data.message);
              break;

            case 'COLOR_ERROR':
              alert(data.message);
              break;

            case 'INIT_DOCK':
              setGameStats(prev => ({ ...prev, wave: data.wave }));
              changeScreenWithFade('docking');
              break;

            case 'LAUNCH_NEXT_WAVE':
              setGameStats(prev => ({ ...prev, wave: prev.wave + 1 }));
              changeScreenWithFade('playing');
              break;
          }
        } catch (e) {
          console.error('Error handling global socket message:', e);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting in 3s...');
        socketOpen = false;
        setSocketConnected(false);
        if (wakeupTimer) clearTimeout(wakeupTimer);
        setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error('WebSocket encountered an error:', err);
      };
    };

    connect();

    return () => {
      if (wakeupTimer) clearTimeout(wakeupTimer);
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  // Server wakeup countdown interval ticker
  useEffect(() => {
    let interval = null;
    if (showServerWakeup && !socketConnected) {
      setServerWakeupCountdown(45);
      interval = setInterval(() => {
        setServerWakeupCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (socketConnected) {
      setShowServerWakeup(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showServerWakeup, socketConnected]);

  // Update profile handler
  const handleSaveProfile = (newUsername, newColor, newSkills) => {
    setUsername(newUsername);
    setShipColor(newColor);
    if (newSkills) {
      setEquippedSkills(newSkills);
      localStorage.setItem('cybertype_skills', JSON.stringify(newSkills));
    }
    localStorage.setItem('cybertype_username', newUsername);
    localStorage.setItem('cybertype_color', newColor);
    setShowEditProfile(false);

    // Sync profile registration with WebSocket server
    if (socketRef.current && socketConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'REGISTER',
        username: newUsername,
        color: newColor
      }));
    }
  };

  // Handle transitions with subtle screen fade animations
  const changeScreenWithFade = (newScreen) => {
    setIsFirstLoad(false); // Clear first load state on any screen change
    setTransitionState('fade-in');
    setTimeout(() => {
      setScreen(newScreen);
      setTimeout(() => {
        setTransitionState('fade-out');
        setTimeout(() => {
          setTransitionState('idle');
        }, 500);
      }, 80);
    }, 500);
  };

  const handleStartSolo = () => {
    setIsMultiplayer(false);
    setGameStats({ score: 0, wave: 1 });
    changeScreenWithFade('playing');
  };

  const handleDockStart = (completedWave) => {
    setGameStats(prev => ({ ...prev, wave: completedWave }));
    changeScreenWithFade('docking');
  };

  const handleDockContinue = (newColor, newSkills) => {
    setShipColor(newColor);
    setEquippedSkills(newSkills);
    localStorage.setItem('cybertype_color', newColor);
    localStorage.setItem('cybertype_skills', JSON.stringify(newSkills));

    if (isMultiplayer && socketRef.current && socketConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'LAUNCH_NEXT_WAVE'
      }));
    } else {
      const nextWave = gameStats.wave + 1;
      setGameStats(prev => ({ ...prev, wave: nextWave }));
      changeScreenWithFade('playing');
    }
  };

  const handleCreateRoom = (maxPlayers = 3) => {
    if (socketRef.current && socketConnected) {
      socketRef.current.send(JSON.stringify({ 
        type: 'CREATE_ROOM',
        maxPlayers
      }));
    }
  };

  const handleJoinRoom = (code) => {
    if (socketRef.current && socketConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'JOIN_ROOM',
        roomCode: code
      }));
    }
  };

  const handleSelectColor = (color) => {
    if (socketRef.current && socketConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'SELECT_COLOR',
        color: color
      }));
    }
  };

  const handleStartGame = () => {
    if (socketRef.current && socketConnected) {
      socketRef.current.send(JSON.stringify({ type: 'START_GAME' }));
    }
  };

  const handleLeaveRoom = () => {
    if (socketRef.current && socketConnected) {
      socketRef.current.send(JSON.stringify({ type: 'LEAVE_ROOM' }));
    }
    setIsMultiplayer(false);
    setRoomCode('');
    setPlayers([]);
    changeScreenWithFade('menu');
  };

  const handleScoreUpdate = (score, wave) => {
    setGameStats({ score, wave });
  };

  const handleGameOver = (finalScore, waveReached) => {
    setGameStats({ score: finalScore, wave: waveReached });
    changeScreenWithFade('gameover');

    // Submit score to persistent leaderboard on game over if solo
    if (!isMultiplayer && socketRef.current && socketConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'SUBMIT_SCORE',
        username: username,
        score: finalScore
      }));
    }
  };

  const handleReturnMenu = () => {
    if (isMultiplayer) {
      handleLeaveRoom();
    } else {
      changeScreenWithFade('menu');
    }
    
    // Reset our scores back to 0 on the leaderboard
    if (socketRef.current && socketConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'UPDATE_SCORE',
        score: 0,
        level: 1
      }));
    }
  };

  const handleReturnLobby = () => {
    changeScreenWithFade('lobby');
  };

  const toggleMute = () => {
    const isMuted = GameAudio.toggleMute();
    setMuted(isMuted);
  };

  // Render logic helper
  const renderScreen = () => {
    switch (screen) {
      case 'menu':
        return (
          <MainMenu
            username={username}
            shipColor={shipColor}
            isMobileDevice={isMobileDevice}
            isFirstLoad={isFirstLoad}
            onStartSolo={handleStartSolo}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            onOpenEditProfile={() => setShowEditProfile(true)}
            onOpenStory={() => setShowStory(true)}
            onOpenInfo={() => setShowInfoPopup(true)}
          />
        );

      case 'lobby':
        return (
          <Lobby
            roomCode={roomCode}
            players={players}
            maxPlayers={maxPlayers}
            localPlayerId={socketRef.current ? socketRef.current.id : ''}
            onSelectColor={handleSelectColor}
            onStartGame={handleStartGame}
            onLeaveRoom={handleLeaveRoom}
          />
        );

      case 'playing':
        // Attach socket id for ship identification
        if (socketRef.current) {
          socketRef.current.id = players.find(p => p.username === username)?.socketId || 'local';
        }

        return (
          <GameCanvas
            username={username}
            shipColor={shipColor}
            isMultiplayer={isMultiplayer}
            roomCode={roomCode}
            players={players}
            socket={socketRef.current}
            onGameOver={handleGameOver}
            onScoreUpdate={handleScoreUpdate}
            muted={muted}
            onToggleMute={toggleMute}
            onQuitToMenu={handleReturnMenu}
            equippedSkills={equippedSkills}
            initialWave={gameStats.wave}
            initialScore={gameStats.score}
            onDockStart={handleDockStart}
          />
        );

      case 'docking':
        return (
          <DockingStation
            username={username}
            shipColor={shipColor}
            equippedSkills={equippedSkills}
            isMultiplayer={isMultiplayer}
            players={players}
            socket={socketRef.current}
            wave={gameStats.wave}
            onContinue={handleDockContinue}
          />
        );

      case 'gameover':
        return (
          <GameOver
            score={gameStats.score}
            wave={gameStats.wave}
            isMultiplayer={isMultiplayer}
            teamPlayers={players}
            onReturnMenu={handleReturnMenu}
            onReturnLobby={handleReturnLobby}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="app-container">


      {/* Background canvas visuals for main menu */}
      {screen !== 'playing' && <MenuBackground shipColor={shipColor} />}

      {/* Global Sound & Info Actions - Hide during play mode (GameCanvas renders its own grouped controls) */}
      {screen !== 'playing' && (
        <div 
          className={`system-actions ${isFirstLoad ? 'boot-ui-animate' : ''}`}
          style={{ opacity: isFirstLoad ? 0 : 1 }}
        >
          <button 
            className="system-btn" 
            onClick={toggleMute} 
            style={{ opacity: 0.35 }}
          >
            {muted ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            )}
          </button>
          <button 
            className="system-btn" 
            onClick={() => { GameAudio.play('click'); setShowInfoPopup(true); }} 
            style={{ opacity: 0.35 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>
        </div>
      )}

      {/* Primary Displayed Screen */}
      {renderScreen()}

      {/* Profile edit overlay */}
      {showEditProfile && (
        <ProfileEdit
          initialUsername={username}
          initialColor={shipColor}
          initialSkills={equippedSkills}
          onSave={handleSaveProfile}
          onCancel={() => setShowEditProfile(false)}
        />
      )}

      {/* Online leaderboard overlay */}
      {showLeaderboard && (
        <Leaderboard
          leaderboard={leaderboard}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* Story book overlay */}
      {showStory && (
        <StoryModal
          onClose={() => setShowStory(false)}
        />
      )}

      {/* Diagnostic Manual Info overlay */}
      {showInfoPopup && (
        <InfoPopup
          onClose={() => setShowInfoPopup(false)}
        />
      )}

      {/* Server Wakeup Overlay Modal */}
      {showServerWakeup && !socketConnected && (
        <div className="wakeup-overlay">
          <div className="wakeup-modal">
            <div className="wakeup-header">
              <span className="wakeup-glitch-text pulse-slow">[ SIGNAL INTERRUPT - WAKING CORE ]</span>
            </div>
            <div className="wakeup-progress-container">
              <div className="wakeup-spinner" />
              <div className="wakeup-countdown-box">
                <span className="wakeup-countdown-num">{serverWakeupCountdown}</span>
                <span className="wakeup-countdown-sec">sec</span>
              </div>
            </div>
            <div className="wakeup-title">ESTABLISHING HYPER-SPACE LINK</div>
            <p className="wakeup-text">
              Our remote multiplayer server runs on a smart sleep cycle to conserve energy. 
              Waking up the server cores and establishing client sync. Please stand by...
            </p>
            <div className="wakeup-footer">
              <div className="wakeup-signal-dot pulse-fast" />
              <span className="wakeup-status-label">INITIALIZING NEURAL LINK...</span>
            </div>
          </div>
        </div>
      )}

      {/* Subtle Screen Fade Transition Overlay */}
      <div className={`fade-transition-overlay ${transitionState}`} />
    </div>
  );
}
