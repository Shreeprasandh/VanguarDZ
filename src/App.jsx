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
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [muted, setMuted] = useState(false);

  // Multiplayer room state
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  const socketRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);

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

  // Initialize Audio settings on first interaction
  useEffect(() => {
    const triggerAudioInit = () => {
      GameAudio.init();
      if (screen === 'menu' || screen === 'lobby') {
        GameAudio.playMusic('menu_theme');
      }
      window.removeEventListener('click', triggerAudioInit);
      window.removeEventListener('keydown', triggerAudioInit);
    };
    window.addEventListener('click', triggerAudioInit);
    window.addEventListener('keydown', triggerAudioInit);
    return () => {
      window.removeEventListener('click', triggerAudioInit);
      window.removeEventListener('keydown', triggerAudioInit);
    };
  }, [screen]);

  // Play menu theme music when on menu or lobby screens
  useEffect(() => {
    if (screen === 'menu' || screen === 'lobby') {
      GameAudio.playMusic('menu_theme');
    } else {
      GameAudio.stopMenuTheme();
    }
    return () => {
      GameAudio.stopMenuTheme();
    };
  }, [screen]);

  // Set up WebSocket Connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'localhost:3000'
      : window.location.host;
    
    const socketUrl = `${protocol}//${host}`;
    console.log(`Connecting to WebSocket: ${socketUrl}`);

    const connect = () => {
      const socket = new WebSocket(socketUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('WebSocket connected!');
        setSocketConnected(true);
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
              setIsMultiplayer(true);
              setScreen('lobby');
              break;

            case 'ROOM_JOINED':
              setRoomCode(data.roomCode);
              setPlayers(data.players);
              setIsMultiplayer(true);
              setScreen('lobby');
              break;

            case 'ROOM_PLAYERS_UPDATE':
              setPlayers(data.players);
              break;

            case 'GAME_STARTED':
              setPlayers(data.players);
              setScreen('playing');
              break;

            case 'ROOM_ERROR':
              alert(data.message);
              break;

            case 'COLOR_ERROR':
              alert(data.message);
              break;

            case 'INIT_DOCK':
              setGameStats(prev => ({ ...prev, wave: data.wave }));
              setScreen('docking');
              break;

            case 'LAUNCH_NEXT_WAVE':
              setGameStats(prev => ({ ...prev, wave: prev.wave + 1 }));
              setScreen('playing');
              break;
          }
        } catch (e) {
          console.error('Error handling global socket message:', e);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting in 3s...');
        setSocketConnected(false);
        setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error('WebSocket encountered an error:', err);
      };
    };

    connect();

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

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

  const handleStartSolo = () => {
    setIsMultiplayer(false);
    setGameStats({ score: 0, wave: 1 });
    setScreen('playing');
  };

  const handleDockStart = (completedWave) => {
    setGameStats(prev => ({ ...prev, wave: completedWave }));
    setScreen('docking');
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
      setScreen('playing');
    }
  };

  const handleCreateRoom = () => {
    if (socketRef.current && socketConnected) {
      socketRef.current.send(JSON.stringify({ type: 'CREATE_ROOM' }));
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
    setScreen('menu');
  };

  const handleScoreUpdate = (score, wave) => {
    setGameStats({ score, wave });
  };

  const handleGameOver = (finalScore, waveReached) => {
    setGameStats({ score: finalScore, wave: waveReached });
    setScreen('gameover');

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
      setScreen('menu');
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
        <div className="system-actions">
          <button 
            className="system-btn" 
            onClick={toggleMute} 
            title={muted ? 'Unmute Sound' : 'Mute Sound'}
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
            title="Diagnostic Manual / Rules"
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
    </div>
  );
}
