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
import FeedbackModal from './components/FeedbackModal';
import DockingStation from './components/DockingStation';
import InfoPopup from './components/InfoPopup';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { loginPilot, registerPilot, saveCheckpoint, saveHighScore, supabase, getLeaderboard } from './game/supabase';
import { initDictionary } from './game/words';

export default function App() {
  const isElectron = window.navigator.userAgent.toLowerCase().includes('electron') || window.location.protocol === 'file:';
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
  const [showFeedback, setShowFeedback] = useState(false);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [muted, setMuted] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [menuHasSubmenu, setMenuHasSubmenu] = useState(false);

  // Authentication & Checkpoints State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginVisible, setLoginVisible] = useState(true);
  const [maxCheckpoint, setMaxCheckpoint] = useState(0);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [autoSaveToast, setAutoSaveToast] = useState(false);
  const [showAuthFailureModal, setShowAuthFailureModal] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);

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
  const [localSocketId, setLocalSocketId] = useState('');

  // Gameplay scoring caches
  const [gameStats, setGameStats] = useState({ score: 0, wave: 1 });
  const [bossShieldsCount, setBossShieldsCount] = useState(0);

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

  useEffect(() => {
    initDictionary();
  }, []);

  // Restore session from sessionStorage, local storage backup, or guest memory on mount
  useEffect(() => {
    const savedSession = sessionStorage.getItem('vanguardz_session');
    if (savedSession) {
      try {
        const data = JSON.parse(savedSession);
        setUsername(data.username);
        setMaxCheckpoint(data.maxCheckpoint || 0);
        setIsLoggedIn(true);
        setLoginVisible(false);
        return;
      } catch (e) {
        console.error('Error parsing session data:', e);
      }
    }

    const checkActiveSession = async () => {
      const lastUsername = localStorage.getItem('cybertype_username');
      const isLoggedInFlag = localStorage.getItem('vanguardz_logged_in');
      
      if (lastUsername && (isLoggedInFlag === 'true' || lastUsername.toUpperCase().startsWith('GUEST'))) {
        const localKey = `vanguardz_checkpoint_${lastUsername.toLowerCase()}`;
        const localMax = parseInt(localStorage.getItem(localKey) || '0', 10);
        let bestCheckpoint = localMax;
        
        const isGuest = lastUsername.toUpperCase().startsWith('GUEST');
        if (!isGuest && supabase) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('max_unlocked_checkpoint')
              .eq('username', lastUsername.toLowerCase())
              .maybeSingle();
              
            if (profile) {
              const serverMax = profile.max_unlocked_checkpoint || 0;
              bestCheckpoint = Math.max(serverMax, localMax);
              
              if (localMax > serverMax) {
                saveCheckpoint(lastUsername, localMax).catch(err => 
                  console.error('Failed to sync local checkpoint to server:', err)
                );
              }
            }
          } catch (err) {
            console.error('Failed to check database checkpoint on mount:', err);
          }
        }
        
        setUsername(lastUsername);
        setMaxCheckpoint(bestCheckpoint);
        setIsLoggedIn(true);
        setLoginVisible(false);
        sessionStorage.setItem('vanguardz_session', JSON.stringify({
          username: lastUsername,
          maxCheckpoint: bestCheckpoint
        }));
      }
    };

    checkActiveSession();
  }, []);

  // Sync local ship color continuously when the players array updates
  useEffect(() => {
    if (isMultiplayer && players && players.length > 0) {
      const activeSelf = players.find(p => p.socketId === localSocketId || p.socketId === socketRef.current?.id);
      if (activeSelf && activeSelf.color && activeSelf.color !== shipColor) {
        setShipColor(activeSelf.color);
        localStorage.setItem('cybertype_color', activeSelf.color);
      }
    }
  }, [players, localSocketId, isMultiplayer, shipColor]);

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

  // Global Escape key handler for Back navigation and Exit game triggers
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (screen === 'playing') return; // Let GameCanvas handle in-game pause

        e.preventDefault();

        // 1. Close Exit Confirmation modal if open
        if (showExitConfirm) {
          setShowExitConfirm(false);
          return;
        }

        // 2. Close active overlays/modals
        if (showEditProfile) { setShowEditProfile(false); return; }
        if (showLeaderboard) { setShowLeaderboard(false); return; }
        if (showStory) { setShowStory(false); return; }
        if (showFeedback) { setShowFeedback(false); return; }
        if (showInfoPopup) { setShowInfoPopup(false); return; }

        // 3. Handle screen specific Back actions
        if (screen === 'lobby') {
          handleLeaveRoom();
          return;
        }
        if (screen === 'docking') {
          handleDockContinue();
          return;
        }
        if (screen === 'gameover') {
          handleReturnMenu();
          return;
        }

        // 4. Handle Main Menu back/exit actions
        if (screen === 'menu') {
          if (menuHasSubmenu) {
            window.dispatchEvent(new CustomEvent('menu-back'));
          } else {
            // Trigger Exit confirmation popup
            setShowExitConfirm(true);
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    screen,
    showExitConfirm,
    showEditProfile,
    showLeaderboard,
    showStory,
    showFeedback,
    showInfoPopup,
    menuHasSubmenu
  ]);

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
        // Register current username and color on connect
        socket.send(JSON.stringify({
          type: 'REGISTER',
          username: username,
          color: shipColor
        }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'REGISTERED':
              socket.id = data.socketId;
              setLocalSocketId(data.socketId);
              break;

            case 'ROOM_CREATED':
              setRoomCode(data.roomCode);
              setPlayers(data.players);
              setMaxPlayers(data.maxPlayers || 3);
              setIsMultiplayer(true);
              changeScreenWithFade('lobby');
              // Sync profile immediately on room creation
              socket.send(JSON.stringify({
                type: 'UPDATE_PROFILE',
                username: username,
                color: shipColor,
                skills: equippedSkills
              }));
              break;

            case 'ROOM_JOINED':
              setRoomCode(data.roomCode);
              setPlayers(data.players);
              setMaxPlayers(data.maxPlayers || 3);
              setIsMultiplayer(true);
              changeScreenWithFade('lobby');
              // Sync profile immediately on room join
              socket.send(JSON.stringify({
                type: 'UPDATE_PROFILE',
                username: username,
                color: shipColor,
                skills: equippedSkills
              }));
              break;

            case 'ROOM_PLAYERS_UPDATE':
              setPlayers(data.players);
              if (data.maxPlayers) {
                setMaxPlayers(data.maxPlayers);
              }
              break;

            case 'GAME_STARTED': {
              setPlayers(data.players);
              setGameStats({ score: 0, wave: 1 });
              if (data.maxPlayers) {
                setMaxPlayers(data.maxPlayers);
              }
              // Sync local ship color with the color assigned in the lobby
              const localPlayer = data.players.find(p => p.socketId === data.socketId || p.socketId === localSocketId);
              if (localPlayer && localPlayer.color) {
                setShipColor(localPlayer.color);
                localStorage.setItem('cybertype_color', localPlayer.color);
              }
              changeScreenWithFade('playing');
              break;
            }

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

      if (roomCode) {
        socketRef.current.send(JSON.stringify({
          type: 'UPDATE_PROFILE',
          username: newUsername,
          color: newColor,
          skills: newSkills
        }));
      }
    }
  };

  const handleToggleReady = () => {
    if (socketRef.current && socketConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'TOGGLE_READY'
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

  const handleGuestLogin = () => {
    const guestUser = 'GUEST_PILOT';
    setUsername(guestUser);
    localStorage.setItem('cybertype_username', guestUser);
    
    const localKey = `vanguardz_checkpoint_${guestUser.toLowerCase()}`;
    const localMax = parseInt(localStorage.getItem(localKey) || '0', 10);
    setMaxCheckpoint(localMax);

    sessionStorage.setItem('vanguardz_session', JSON.stringify({
      username: guestUser,
      maxCheckpoint: localMax
    }));

    setLoginVisible(false);
    setTimeout(() => {
      setIsLoggedIn(true);
    }, 500);
    GameAudio.play('click');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      setAuthError('All fields are required.');
      return;
    }
    setAuthError('');
    setAuthLoading(true);
    try {
      if (isRegisterMode) {
        const res = await registerPilot(loginUsername, loginPassword);
        setUsername(res.username);
        localStorage.setItem('cybertype_username', res.username);
        localStorage.setItem('vanguardz_logged_in', 'true');
        
        // Merge offline progress if exists on this device
        const localKey = `vanguardz_checkpoint_${res.username.toLowerCase()}`;
        const localMax = parseInt(localStorage.getItem(localKey) || '0', 10);
        setMaxCheckpoint(localMax);

        if (localMax > 0) {
          saveCheckpoint(res.username, localMax).catch(err => 
            console.error('Failed to sync local checkpoint to server:', err)
          );
        }

        sessionStorage.setItem('vanguardz_session', JSON.stringify({
          username: res.username,
          maxCheckpoint: localMax
        }));

        setLoginVisible(false);
        setTimeout(() => {
          setIsLoggedIn(true);
        }, 500);
        GameAudio.play('click');
      } else {
        const res = await loginPilot(loginUsername, loginPassword);
        setUsername(res.username);
        localStorage.setItem('cybertype_username', res.username);
        localStorage.setItem('vanguardz_logged_in', 'true');
        
        // Use the highest of the server checkpoint or the local storage backup
        const localKey = `vanguardz_checkpoint_${res.username.toLowerCase()}`;
        const localMax = parseInt(localStorage.getItem(localKey) || '0', 10);
        const bestCheckpoint = Math.max(res.maxCheckpoint || 0, localMax);
        setMaxCheckpoint(bestCheckpoint);

        // If local backup was higher than what server returned, sync it back to server
        if (localMax > (res.maxCheckpoint || 0)) {
          saveCheckpoint(res.username, localMax).catch(err => 
            console.error('Failed to sync local checkpoint to server:', err)
          );
        }

        sessionStorage.setItem('vanguardz_session', JSON.stringify({
          username: res.username,
          maxCheckpoint: bestCheckpoint
        }));

        setLoginVisible(false);
        setTimeout(() => {
          setIsLoggedIn(true);
        }, 500);
        GameAudio.play('click');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.message || '';
      setAuthError(errMsg);
      if (!isRegisterMode && !errMsg.toLowerCase().includes('rate limit')) {
        setShowAuthFailureModal(true);
      } else if (!isRegisterMode) {
        // If it's a rate limit error during login, keep it in the form to display clearly
        setAuthError(errMsg);
      } else {
        setAuthError(errMsg || 'Registration failed. Choose a different callsign.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveCheckpoint = async (checkpointLevel) => {
    if (isMultiplayer) return;

    const isGuest = username ? username.toUpperCase().startsWith('GUEST') : true;
    if (isGuest) return; // Guests get no save points!

    setAutoSaveToast(true);
    setTimeout(() => setAutoSaveToast(false), 2500);

    if (!username) return;

    // Always backup to localStorage for the current pilot
    const localKey = `vanguardz_checkpoint_${username.toLowerCase()}`;
    const localMax = parseInt(localStorage.getItem(localKey) || '0', 10);
    if (checkpointLevel > localMax) {
      localStorage.setItem(localKey, checkpointLevel.toString());
    }

    try {
      // Only call Supabase if it's not a guest account
      const isGuest = username.toUpperCase().startsWith('GUEST');
      if (!isGuest) {
        await saveCheckpoint(username, checkpointLevel);
      }
      
      if (checkpointLevel > maxCheckpoint) {
        setMaxCheckpoint(checkpointLevel);
        const savedSession = sessionStorage.getItem('vanguardz_session');
        if (savedSession) {
          try {
            const data = JSON.parse(savedSession);
            data.maxCheckpoint = checkpointLevel;
            sessionStorage.setItem('vanguardz_session', JSON.stringify(data));
          } catch (err) {
            console.error('Session update error:', err);
          }
        }
      }
    } catch (e) {
      console.error('Failed to save checkpoint to server:', e);
      // Fallback: update UI state even if server fails
      if (checkpointLevel > maxCheckpoint) {
        setMaxCheckpoint(checkpointLevel);
        const savedSession = sessionStorage.getItem('vanguardz_session');
        if (savedSession) {
          try {
            const data = JSON.parse(savedSession);
            data.maxCheckpoint = checkpointLevel;
            sessionStorage.setItem('vanguardz_session', JSON.stringify(data));
          } catch (err) {
            console.error('Session update error:', err);
          }
        }
      }
    }
  };

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('vanguardz_session');
      localStorage.removeItem('vanguardz_logged_in');
    } catch (e) {
      console.error('Logout error:', e);
    }
    setIsLoggedIn(false);
    setLoginVisible(true);
    setMaxCheckpoint(0);
    setScreen('menu');
    setShowLogoutConfirmModal(false);
    
    // Clear overlay triggers
    setShowEditProfile(false);
    setShowLeaderboard(false);
    setShowStory(false);
    setShowInfoPopup(false);
    
    GameAudio.play('click');
  };

  const handleOpenLeaderboard = () => {
    setShowLeaderboard(true);
    getLeaderboard()
      .then(data => {
        if (data && data.length > 0) {
          setLeaderboard(data);
        }
      })
      .catch(err => {
        console.error('Failed to load leaderboard from Supabase:', err);
      });
  };

  const handleStartSolo = (startingWave = 1) => {
    setIsMultiplayer(false);
    setGameStats({ score: 0, wave: startingWave });
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
        maxPlayers,
        username,
        color: shipColor,
        skills: equippedSkills
      }));
    }
  };

  const handleJoinRoom = (code) => {
    if (socketRef.current && socketConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'JOIN_ROOM',
        roomCode: code,
        username,
        color: shipColor,
        skills: equippedSkills
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

  const [typingStats, setTypingStats] = useState([]);

  const handleGameOver = (finalScore, waveReached, stats) => {
    setGameStats({ score: finalScore, wave: waveReached });
    setTypingStats(stats || []);
    setBossShieldsCount(0);
    changeScreenWithFade('gameover');

    // Submit score to persistent leaderboard on game over if solo
    if (!isMultiplayer && socketRef.current && socketConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'SUBMIT_SCORE',
        username: username,
        score: finalScore
      }));
    }

    // Save high score to Supabase if logged in (not a guest)
    const isGuest = username ? username.toUpperCase().startsWith('GUEST') : true;
    if (!isGuest && isLoggedIn) {
      saveHighScore(username, finalScore).catch(err => {
        console.error('Failed to save high score to Supabase:', err);
      });
    }
  };

  const handleReturnMenu = () => {
    setBossShieldsCount(0);
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
        if (!isLoggedIn) return null;
        return (
          <MainMenu
            username={username}
            shipColor={shipColor}
            isMobileDevice={isMobileDevice}
            isFirstLoad={isFirstLoad}
            onStartSolo={handleStartSolo}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onOpenLeaderboard={handleOpenLeaderboard}
            onOpenEditProfile={() => setShowEditProfile(true)}
            onOpenStory={() => setShowStory(true)}
            onOpenFeedback={() => setShowFeedback(true)}
            onOpenInfo={() => setShowInfoPopup(true)}
            maxCheckpoint={maxCheckpoint}
            onQuitGame={() => setShowExitConfirm(true)}
            onSubmenuChange={setMenuHasSubmenu}
          />
        );

      case 'lobby':
        return (
          <Lobby
            roomCode={roomCode}
            players={players}
            maxPlayers={maxPlayers}
            localPlayerId={localSocketId}
            localUsername={username}
            localShipColor={shipColor}
            onSelectColor={handleSelectColor}
            onStartGame={handleStartGame}
            onLeaveRoom={handleLeaveRoom}
            onOpenProfileEdit={() => setShowEditProfile(true)}
            onToggleReady={handleToggleReady}
          />
        );

      case 'playing':
        // Attach socket id for ship identification
        if (socketRef.current) {
          socketRef.current.id = localSocketId || 'local';
        }

        return (
          <GameCanvas
            username={username}
            shipColor={shipColor}
            isMultiplayer={isMultiplayer}
            maxPlayers={maxPlayers}
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
            onSaveCheckpoint={handleSaveCheckpoint}
            bossShieldsCount={bossShieldsCount}
            onBossShieldsChange={setBossShieldsCount}
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
            typingStats={typingStats}
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
          style={{ 
            opacity: isFirstLoad ? 0 : 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.8rem'
          }}
        >
          {/* Main system action buttons (Speaker / Info / Logout) */}
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            {isLoggedIn && (
              <button 
                className="system-btn" 
                onClick={() => { GameAudio.play('click'); setShowLogoutConfirmModal(true); }} 
                style={{ opacity: 0.35 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
              </button>
            )}
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


        </div>
      )}

      {/* Checkpoint Auto-Save Toast Overlay */}
      {autoSaveToast && (
        <div className="autosave-toast">
          [ SYSTEM PROGRESS SECURED - CHECKPOINT AUTOSAVED ]
        </div>
      )}

      {/* Login Screen Overlay */}
      {screen === 'menu' && (loginVisible || !isLoggedIn) && (
        <div className={`login-page-container ${!loginVisible ? 'fade-out' : ''}`}>
          {/* Left Column: Story */}
          <div className="story-column glass-panel" style={{ padding: '2.5rem', background: 'rgba(5, 5, 8, 0.85)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '10px', left: '10px', width: '15px', height: '15px', borderTop: '2px solid rgba(255, 255, 255, 0.25)', borderLeft: '2px solid rgba(255, 255, 255, 0.25)' }} />
            <div style={{ position: 'absolute', top: '10px', right: '10px', width: '15px', height: '15px', borderTop: '2px solid rgba(255, 255, 255, 0.25)', borderRight: '2px solid rgba(255, 255, 255, 0.25)' }} />
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '15px', height: '15px', borderBottom: '2px solid rgba(255, 255, 255, 0.25)', borderLeft: '2px solid rgba(255, 255, 255, 0.25)' }} />
            <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '15px', height: '15px', borderBottom: '2px solid rgba(255, 255, 255, 0.25)', borderRight: '2px solid rgba(255, 255, 255, 0.25)' }} />

            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '1.5rem', color: '#ffffff', textAlign: 'center' }}>
              THE VANGUARDZ INITIATIVE
            </div>
            
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', lineHeight: '1.7', color: '#d2d6e6', textAlign: 'justify', marginBottom: '1rem', fontWeight: 300 }}>
              We watched our home world burn, a silent spark swallowed by the black ocean of space. The counselors told us that survival was enough, but to live on our knees is to fade into nothingness.
            </p>
            
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', lineHeight: '1.7', color: '#d2d6e6', textAlign: 'justify', marginBottom: '1rem', fontWeight: 300 }}>
              Our friends carry the will to resist, but their ships are old, and their hearts are weary. If they engage the armada directly, they will be swept aside like space dust.
            </p>

            <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', lineHeight: '1.7', color: '#d2d6e6', textAlign: 'justify', marginBottom: '1rem', fontWeight: 300 }}>
              So you made a choice. Under a shroud of stardust, you slipped into the dark alone, steering your fighter into the belly of the hostile empire. You do not seek glory—only to clear a path out of the shadows.
            </p>
            
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '2px', textAlign: 'center', color: '#a2a6b8', marginTop: '1.5rem', fontStyle: 'italic', opacity: 0.85 }}>
              ...we are the final shield. We will stand.
            </div>
          </div>

          {/* Right Column: Central Login Box */}
          <div className="login-column glass-panel" style={{ padding: '2.5rem', background: 'rgba(5, 5, 8, 0.85)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '10px', left: '10px', width: '15px', height: '15px', borderTop: '2px solid rgba(255, 255, 255, 0.25)', borderLeft: '2px solid rgba(255, 255, 255, 0.25)' }} />
            <div style={{ position: 'absolute', top: '10px', right: '10px', width: '15px', height: '15px', borderTop: '2px solid rgba(255, 255, 255, 0.25)', borderRight: '2px solid rgba(255, 255, 255, 0.25)' }} />
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '15px', height: '15px', borderBottom: '2px solid rgba(255, 255, 255, 0.25)', borderLeft: '2px solid rgba(255, 255, 255, 0.25)' }} />
            <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '15px', height: '15px', borderBottom: '2px solid rgba(255, 255, 255, 0.25)', borderRight: '2px solid rgba(255, 255, 255, 0.25)' }} />

            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '1.8rem', textAlign: 'center' }}>
              {isRegisterMode ? 'REGISTER PILOT' : 'PILOT LOGIN'}
            </div>

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', fontFamily: 'var(--font-display)', letterSpacing: '1px', opacity: 0.8 }}>
                Callsign (Username)
              </div>
              <input
                type="text"
                className="text-input"
                placeholder="PILOT CALLSIGN"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
              />

              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', fontFamily: 'var(--font-display)', letterSpacing: '1px', opacity: 0.8 }}>
                Access Key (Password)
              </div>
              <input
                type="password"
                className="text-input"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />

              {authError && (
                <div style={{ color: '#ff4444', fontSize: '0.75rem', marginBottom: '1.2rem', fontFamily: 'var(--font-display)', letterSpacing: '0.5px' }}>
                  {authError}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.8rem', fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase' }}
                disabled={authLoading}
              >
                {authLoading ? 'Verifying...' : isRegisterMode ? 'REGISTER & DEPLOY' : 'ESTABLISH LINK'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', margin: '1.2rem 0 0.8rem 0' }}>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }} />
              <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.3)', margin: '0 0.5rem', fontFamily: 'var(--font-display)' }}>OR</span>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }} />
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ 
                width: '100%', 
                padding: '0.8rem', 
                fontSize: '0.85rem', 
                letterSpacing: '2px', 
                textTransform: 'uppercase',
                background: 'rgba(74, 144, 226, 0.1)',
                border: '1px solid var(--neon-blue)',
                color: 'var(--neon-blue)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderRadius: '4px',
                boxShadow: '0 0 5px rgba(74, 144, 226, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(74, 144, 226, 0.2)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(74, 144, 226, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(74, 144, 226, 0.1)';
                e.currentTarget.style.boxShadow = '0 0 5px rgba(74, 144, 226, 0.2)';
              }}
              onClick={handleGuestLogin}
            >
              PLAY OFFLINE (GUEST MODE)
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
              <span
                onClick={() => {
                  setAuthError('');
                  setIsRegisterMode(!isRegisterMode);
                }}
                className="login-toggle-text"
              >
                {isRegisterMode ? 'Already registered? Pilot Login' : 'First deployment? Register callsign'}
              </span>
              <p style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.28)', margin: '0.8rem 0 0 0', letterSpacing: '0.5px', fontFamily: 'var(--font-display)', textTransform: 'uppercase', lineHeight: '1.4' }}>
                New pilots must register a callsign to track saved checkpoints and secure leaderboards.
              </p>
            </div>
          </div>
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

      {/* Feedback Uplink overlay */}
      {showFeedback && (
        <FeedbackModal
          username={username}
          onClose={() => setShowFeedback(false)}
        />
      )}

      {/* Diagnostic Manual Info overlay */}
      {showInfoPopup && (
        <InfoPopup
          onClose={() => setShowInfoPopup(false)}
        />
      )}

      {/* Exit Game Confirmation Overlay */}
      {showExitConfirm && (
        <div 
          className="modal-overlay" 
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.85)', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            backdropFilter: 'blur(8px)' 
          }}
        >
          <div 
            className="glass-panel" 
            style={{ 
              maxWidth: '380px', 
              width: '90%', 
              padding: '2.5rem 1.8rem', 
              textAlign: 'center', 
              position: 'relative', 
              border: '1px solid rgba(239, 68, 68, 0.25)',
              background: 'rgba(5, 5, 8, 0.98)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)',
              borderRadius: '4px'
            }}
          >
            {/* Corner brackets */}
            <div style={{ position: 'absolute', top: '10px', left: '10px', width: '12px', height: '12px', borderTop: '2px solid var(--neon-red)', borderLeft: '2px solid var(--neon-red)' }} />
            <div style={{ position: 'absolute', top: '10px', right: '10px', width: '12px', height: '12px', borderTop: '2px solid var(--neon-red)', borderRight: '2px solid var(--neon-red)' }} />
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '12px', height: '12px', borderBottom: '2px solid var(--neon-red)', borderLeft: '2px solid var(--neon-red)' }} />
            <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '12px', height: '12px', borderBottom: '2px solid var(--neon-red)', borderRight: '2px solid var(--neon-red)' }} />

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--neon-red)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '1rem', textShadow: '0 0 8px rgba(239, 68, 68, 0.3)' }}>
              Exit Simulator?
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '2.2rem', fontWeight: 300 }}>
              Are you sure you want to terminate the defensive targeting matrix and close VanguarDZ?
            </p>

            <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, margin: 0, fontSize: '0.82rem', letterSpacing: '1px', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '0.6rem' }}
                onClick={() => { GameAudio.play('click'); setShowExitConfirm(false); }}
              >
                Abort
              </button>
              <button 
                className="btn" 
                style={{ flex: 1, margin: 0, fontSize: '0.82rem', letterSpacing: '1px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--neon-red)', color: 'var(--neon-red)', padding: '0.6rem' }}
                onClick={() => {
                  GameAudio.play('click');
                  window.close();
                }}
              >
                Confirm Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Failure Modal Popup */}
      {showAuthFailureModal && (
        <div 
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(2, 2, 4, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(8px)'
          }}
        >
          <div 
            className="glass-panel"
            style={{
              position: 'relative',
              width: '90%',
              maxWidth: '380px',
              background: 'rgba(5, 5, 8, 0.98)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '2.2rem',
              borderRadius: '4px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)',
              textAlign: 'center',
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            {/* Corner Brackets */}
            <div style={{ position: 'absolute', top: '10px', left: '10px', width: '15px', height: '15px', borderTop: '2px solid rgba(255, 255, 255, 0.25)', borderLeft: '2px solid rgba(255, 255, 255, 0.25)' }} />
            <div style={{ position: 'absolute', top: '10px', right: '10px', width: '15px', height: '15px', borderTop: '2px solid rgba(255, 255, 255, 0.25)', borderRight: '2px solid rgba(255, 255, 255, 0.25)' }} />
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '15px', height: '15px', borderBottom: '2px solid rgba(255, 255, 255, 0.25)', borderLeft: '2px solid rgba(255, 255, 255, 0.25)' }} />
            <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '15px', height: '15px', borderBottom: '2px solid rgba(255, 255, 255, 0.25)', borderRight: '2px solid rgba(255, 255, 255, 0.25)' }} />

            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--neon-red)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '1.2rem' }}>
              NO USER DETECTED
            </div>

            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', lineHeight: '1.6', color: '#a2a6b8', margin: '0 0 2.2rem 0', fontWeight: 300 }}>
              The entered callsign and access key do not match any active pilot profiles in the database.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                className="btn" 
                style={{ 
                  flex: 1, 
                  padding: '0.6rem', 
                  fontSize: '0.75rem', 
                  letterSpacing: '1.5px', 
                  textTransform: 'uppercase',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'transparent',
                  color: '#ffffff'
                }}
                onClick={() => {
                  GameAudio.play('click');
                  setShowAuthFailureModal(false);
                }}
              >
                Retry
              </button>
              <button 
                className="btn btn-primary" 
                style={{ 
                  flex: 1.2, 
                  padding: '0.6rem', 
                  fontSize: '0.75rem', 
                  letterSpacing: '1.5px', 
                  textTransform: 'uppercase'
                }}
                onClick={() => {
                  GameAudio.play('click');
                  setIsRegisterMode(true);
                  setShowAuthFailureModal(false);
                }}
              >
                Sign Up
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0 0.8rem 0' }}>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }} />
              <span style={{ fontSize: '0.6rem', color: 'rgba(255, 255, 255, 0.25)', margin: '0 0.5rem', fontFamily: 'var(--font-display)' }}>OR</span>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }} />
            </div>

            <button 
              className="btn" 
              style={{ 
                width: '100%', 
                padding: '0.6rem', 
                fontSize: '0.75rem', 
                letterSpacing: '1.5px', 
                textTransform: 'uppercase',
                border: '1px solid var(--neon-blue)',
                background: 'rgba(74, 144, 226, 0.05)',
                color: 'var(--neon-blue)',
                cursor: 'pointer'
              }}
              onClick={() => {
                setShowAuthFailureModal(false);
                handleGuestLogin();
              }}
            >
              Play Offline (Guest Mode)
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal Overlay */}
      {showLogoutConfirmModal && (
        <div 
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(2, 2, 4, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(8px)'
          }}
        >
          <div 
            className="glass-panel"
            style={{
              position: 'relative',
              width: '90%',
              maxWidth: '380px',
              background: 'rgba(5, 5, 8, 0.98)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '2.2rem',
              borderRadius: '4px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)',
              textAlign: 'center',
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            {/* Corner Brackets */}
            <div style={{ position: 'absolute', top: '10px', left: '10px', width: '15px', height: '15px', borderTop: '2px solid rgba(255, 255, 255, 0.25)', borderLeft: '2px solid rgba(255, 255, 255, 0.25)' }} />
            <div style={{ position: 'absolute', top: '10px', right: '10px', width: '15px', height: '15px', borderTop: '2px solid rgba(255, 255, 255, 0.25)', borderRight: '2px solid rgba(255, 255, 255, 0.25)' }} />
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '15px', height: '15px', borderBottom: '2px solid rgba(255, 255, 255, 0.25)', borderLeft: '2px solid rgba(255, 255, 255, 0.25)' }} />
            <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '15px', height: '15px', borderBottom: '2px solid rgba(255, 255, 255, 0.25)', borderRight: '2px solid rgba(255, 255, 255, 0.25)' }} />

            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--neon-red)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '1.2rem' }}>
              TERMINATE SESSION
            </div>

            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', lineHeight: '1.6', color: '#a2a6b8', margin: '0 0 2.2rem 0', fontWeight: 300 }}>
              Are you sure you want to disconnect your uplink and return to the authorization gateway?
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                className="btn" 
                style={{ 
                  flex: 1, 
                  padding: '0.6rem', 
                  fontSize: '0.75rem', 
                  letterSpacing: '1.5px', 
                  textTransform: 'uppercase',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'transparent',
                  color: '#ffffff'
                }}
                onClick={() => {
                  GameAudio.play('click');
                  setShowLogoutConfirmModal(false);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ 
                  flex: 1.2, 
                  padding: '0.6rem', 
                  fontSize: '0.75rem', 
                  letterSpacing: '1.5px', 
                  textTransform: 'uppercase'
                }}
                onClick={handleLogout}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Server Wakeup Overlay Modal */}
      {showServerWakeup && !socketConnected && (
        <div className="wakeup-overlay">
          <div className="wakeup-modal">
            {/* Futuristic Corner Brackets */}
            <div style={{ position: 'absolute', top: '10px', left: '10px', width: '15px', height: '15px', borderTop: '2px solid rgba(255, 255, 255, 0.15)', borderLeft: '2px solid rgba(255, 255, 255, 0.15)' }} />
            <div style={{ position: 'absolute', top: '10px', right: '10px', width: '15px', height: '15px', borderTop: '2px solid rgba(255, 255, 255, 0.15)', borderRight: '2px solid rgba(255, 255, 255, 0.15)' }} />
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '15px', height: '15px', borderBottom: '2px solid rgba(255, 255, 255, 0.15)', borderLeft: '2px solid rgba(255, 255, 255, 0.15)' }} />
            <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '15px', height: '15px', borderBottom: '2px solid rgba(255, 255, 255, 0.15)', borderRight: '2px solid rgba(255, 255, 255, 0.15)' }} />

            <div className="wakeup-header">
              <span className="wakeup-glitch-text pulse-slow">SIGNAL INTERRUPT</span>
            </div>
            <div className="wakeup-progress-container">
              <div className="wakeup-spinner" />
              <div className="wakeup-countdown-box">
                <span className="wakeup-countdown-num">{serverWakeupCountdown}</span>
              </div>
            </div>
            <div className="wakeup-title">ESTABLISHING CONNECTION</div>
            <p className="wakeup-text">
              The multiplayer service is currently waking up to establish a sync link. 
              This process can take up to a minute. Thank you for your patience.
            </p>
            <div className="wakeup-footer">
              <div className="wakeup-signal-dot pulse-fast" />
              <span className="wakeup-status-label">Reconnecting...</span>
            </div>
          </div>
        </div>
      )}

      {/* Subtle Screen Fade Transition Overlay */}
      <div className={`fade-transition-overlay ${transitionState}`} />
      <Analytics />
      <SpeedInsights />
    </div>
  );
}
