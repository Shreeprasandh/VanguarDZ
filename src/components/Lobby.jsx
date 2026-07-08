import React, { useState } from 'react';
import { GameAudio } from '../game/audio';

export default function Lobby({ roomCode, players, maxPlayers = 3, localPlayerId, localUsername, localShipColor, onSelectColor, onStartGame, onLeaveRoom, onOpenProfileEdit, onToggleReady }) {
  const [errorMessage, setErrorMessage] = useState(null);

  const localPlayerInRoom = players.find(p => p.socketId === localPlayerId) ||
                            players.find(p => p.username === localUsername);
  const isHost = localPlayerInRoom?.isHost || false;
  const localPlayerColor = localPlayerInRoom?.color || localShipColor || null;

  // Position slots
  const slots = maxPlayers === 2
    ? [
        { position: 'left', label: 'Squadron Leader' },
        { position: 'right', label: 'Wingman' }
      ]
    : [
        { position: 'center', label: 'Host' },
        { position: 'right', label: 'Wingman II' },
        { position: 'left', label: 'Wingman I' }
      ];

  const getPlayerInPosition = (pos) => {
    return players.find(p => p.position === pos);
  };


  const handleStart = () => {
    GameAudio.play('click');
    
    // Check for color conflicts
    const colorsList = players.map(p => p.color).filter(Boolean);
    const uniqueColors = new Set(colorsList);
    
    if (colorsList.length < players.length || uniqueColors.size !== colorsList.length) {
      setErrorMessage(
        "Multiple pilots have selected the same spacecraft signature. Each pilot must register a unique color configuration (Red, Blue, Green) to synchronize the co-op weapon grids."
      );
      return;
    }
    
    onStartGame();
  };

  const handleLeave = () => {
    GameAudio.play('click');
    onLeaveRoom();
  };

  const handleToggleReadyClick = () => {
    GameAudio.play('click');
    
    if (!localPlayerColor) {
      setErrorMessage("System diagnostic failure: You must select a defensive color configuration (Red, Blue, or Green) to initialize weapon sync before readying up.");
      return;
    }
    
    const isCurrentlyReady = localPlayerInRoom?.isReady || false;
    if (!isCurrentlyReady) {
      // Check if another player has the same color
      const conflictingPlayer = players.find(p => p.socketId !== localPlayerInRoom?.socketId && p.color === localPlayerColor);
      if (conflictingPlayer) {
        setErrorMessage(`Defensive Colour Conflict: Pilot [${conflictingPlayer.username}] has already registered the ${localPlayerColor.toUpperCase()} weapon signature. Please select a different spacecraft colour before registering.`);
        return;
      }
    }
    
    if (onToggleReady) {
      onToggleReady();
    }
  };

  const isLobbyFull = players.length === maxPlayers;
  const guests = players.filter(p => !p.isHost);
  const allOthersReady = guests.length > 0 && guests.every(p => p.isReady === true);
  const allPickedColors = players.every(p => p.color);
  const colorsList = players.map(p => p.color).filter(Boolean);
  const uniqueColors = new Set(colorsList);
  const noColorConflicts = uniqueColors.size === colorsList.length && colorsList.length === players.length;

  const canStart = isHost && players.length >= 2 && allOthersReady && allPickedColors && noColorConflicts;

  const getShipSvg = (color) => {
    let strokeColor = 'rgba(255, 255, 255, 0.15)';
    if (color === 'red') strokeColor = 'var(--neon-red)';
    if (color === 'blue') strokeColor = 'var(--neon-blue)';
    if (color === 'green') strokeColor = 'var(--neon-green)';

    return (
      <svg 
        className="lobby-ship-floating" 
        width="64" 
        height="64" 
        viewBox="0 0 40 40" 
        style={{ 
          filter: color ? `drop-shadow(0 0 8px ${strokeColor})` : 'none',
          animation: 'lobbyFloat 4s ease-in-out infinite',
          margin: '1.8rem 0 0.8rem 0'
        }}
      >
        {/* Hologram Scanner Ring */}
        <ellipse cx="20" cy="30" rx="14" ry="4" fill="none" stroke={strokeColor} strokeWidth="1" opacity="0.3" strokeDasharray="3 3" />
        {/* Ship Hull */}
        <path
          d="M 20 6 L 32 28 L 20 22 L 8 28 Z"
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Core light */}
        <circle cx="20" cy="18" r="2.5" fill={strokeColor} />
        {/* Engine Fire */}
        <path className="lobby-ship-engine" d="M 16 23 L 20 34 L 24 23 Z" fill={strokeColor} opacity="0.4" />
      </svg>
    );
  };

  return (
    <div className="lobby-layout-minimal" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <style>{`
        .lobby-layout-minimal {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 680px;
          padding: 1rem;
        }

        .lobby-grid-columns {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          width: 100%;
          margin: 3.5rem 0;
          position: relative;
        }

        @media (max-width: 480px) {
          .lobby-grid-columns {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
            margin: 1.5rem 0 !important;
          }
          .hologram-slot {
            border-left: none !important;
            border-bottom: 1px dashed rgba(255, 255, 255, 0.08) !important;
            padding: 1.2rem 1rem !important;
          }
          .hologram-slot:last-of-type {
            border-bottom: none !important;
          }
        }

        .hologram-slot {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem 1rem;
          border-left: 1px dashed rgba(255, 255, 255, 0.05);
          position: relative;
        }

        .hologram-slot:first-of-type {
          border-left: none;
        }

        .slot-title {
          font-family: var(--font-display);
          font-size: 0.75rem;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--text-secondary);
          opacity: 0.5;
          margin-bottom: 1.5rem;
        }

        .pilot-name {
          font-family: var(--font-display);
          font-size: 1rem;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #ffffff;
          font-weight: 500;
          margin-bottom: 0.4rem;
        }

        .role-indicator {
          font-family: var(--font-display);
          font-size: 0.65rem;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--neon-blue);
          border: 1px solid rgba(51, 204, 255, 0.2);
          padding: 0.15rem 0.5rem;
          border-radius: 2px;
          background: rgba(51, 204, 255, 0.02);
        }

        .hologram-ring {
          width: 60px;
          height: 12px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.06);
          margin-top: -10px;
          background: transparent;
        }

        .lobby-ship-engine {
          animation: enginePulse 0.15s ease-in-out infinite alternate;
        }

        @keyframes lobbyFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @keyframes enginePulse {
          0% { transform: scaleY(0.85) translateY(-1px); opacity: 0.35; }
          100% { transform: scaleY(1.2) translateY(1px); opacity: 0.65; }
        }

        /* Color choices */
        .console-pick-circle {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.15);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.19, 1, 0.22, 1);
          background: transparent;
        }

        .console-pick-circle.red {
          background: rgba(255, 51, 102, 0.2);
          border-color: rgba(255, 51, 102, 0.4);
        }

        .console-pick-circle.blue {
          background: rgba(51, 204, 255, 0.2);
          border-color: rgba(51, 204, 255, 0.4);
        }

        .console-pick-circle.green {
          background: rgba(57, 255, 20, 0.2);
          border-color: rgba(57, 255, 20, 0.4);
        }

        .console-pick-circle:hover {
          transform: scale(1.15);
        }

        .console-pick-circle.selected.red {
          border-color: var(--neon-red);
          box-shadow: 0 0 10px var(--neon-red);
          background: var(--neon-red);
        }

        .console-pick-circle.selected.blue {
          border-color: var(--neon-blue);
          box-shadow: 0 0 10px var(--neon-blue);
          background: var(--neon-blue);
        }

        .console-pick-circle.selected.green {
          border-color: var(--neon-green);
          box-shadow: 0 0 10px var(--neon-green);
          background: var(--neon-green);
        }

        .btn-console-action {
          font-family: var(--font-display);
          font-size: 0.95rem;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #ffffff;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 0.8rem 2rem;
          width: 100%;
          max-width: 320px;
          cursor: pointer;
          transition: all 0.2s;
          outline: none;
          border-radius: 2px;
        }

        .btn-console-action:hover:not(:disabled) {
          border-color: var(--neon-blue);
          background: rgba(51, 204, 255, 0.02);
          color: var(--neon-blue);
          text-shadow: 0 0 5px rgba(51, 204, 255, 0.3);
          letter-spacing: 4px;
        }

        .btn-console-action:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
      `}</style>

      {/* Header section */}
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', letterSpacing: '4px', textTransform: 'uppercase', color: '#ffffff' }}>
        CO-OP FREQUENCY ACTIVE
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', letterSpacing: '1.5px', fontFamily: 'var(--font-display)', marginTop: '0.6rem', opacity: 0.6 }}>
        TRANSMITTING ON CODE: {roomCode}
      </div>

      {/* Lobby Slots */}
      <div className="lobby-grid-columns" style={{ gridTemplateColumns: `repeat(${maxPlayers}, 1fr)` }}>
        {slots.map((slot) => {
          const player = getPlayerInPosition(slot.position);
          const isLocal = player?.socketId === localPlayerInRoom?.socketId;
          const playerColor = player ? (isLocal ? (player.color || localShipColor) : player.color) : null;

          return (
            <div key={slot.position} className="hologram-slot">
              <div className="slot-title">{slot.label}</div>
              
              {player ? (
                <>
                  <div className="pilot-name">{player.username}</div>
                  <div style={{ display: 'flex', gap: '0.3rem', height: '18px' }}>
                    {player.isHost && (
                      <span 
                        className="role-indicator"
                        style={{
                          color: playerColor ? `var(--neon-${playerColor})` : 'var(--neon-blue)',
                          borderColor: playerColor ? `rgba(${playerColor === 'red' ? '207, 64, 66' : playerColor === 'green' ? '46, 189, 89' : '74, 144, 226'}, 0.25)` : 'rgba(51, 204, 255, 0.2)',
                          background: playerColor ? `rgba(${playerColor === 'red' ? '207, 64, 66' : playerColor === 'green' ? '46, 189, 89' : '74, 144, 226'}, 0.02)` : 'rgba(51, 204, 255, 0.02)'
                        }}
                      >
                        Host
                      </span>
                    )}

                    {!player.isHost && (
                      <span 
                        className="role-indicator" 
                        style={{ 
                          borderColor: player.isReady ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)', 
                          color: player.isReady ? 'var(--neon-green)' : 'var(--neon-red)', 
                          background: player.isReady ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)' 
                        }}
                      >
                        {player.isReady ? 'Ready' : 'Not Ready'}
                      </span>
                    )}
                  </div>
                  
                  {getShipSvg(playerColor)}
                  
                  {isLocal ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '0.8rem', gap: '0.8rem' }}>
                      <div style={{ display: 'flex', gap: '0.8rem' }}>
                        {['blue', 'red', 'green'].map(c => (
                          <button
                            key={c}
                            onClick={() => {
                              GameAudio.play('click');
                              onSelectColor(c);
                            }}
                            className={`console-pick-circle ${c} ${playerColor === c ? 'selected' : ''}`}
                            style={{ outline: 'none' }}
                          />
                        ))}
                      </div>
                      <button
                        onClick={onOpenProfileEdit}
                        className="btn-profile-edit-lobby"
                        style={{
                          fontSize: '0.7rem',
                          color: playerColor ? `var(--neon-${playerColor})` : 'var(--neon-blue)',
                          border: playerColor ? `1px solid var(--neon-${playerColor})` : '1px solid rgba(255, 255, 255, 0.15)',
                          background: 'rgba(255, 255, 255, 0.02)',
                          padding: '0.35rem 0.9rem',
                          cursor: 'pointer',
                          borderRadius: '2px',
                          textTransform: 'uppercase',
                          letterSpacing: '1.5px',
                          fontFamily: 'var(--font-display)',
                          transition: 'all 0.2s',
                          outline: 'none',
                          boxShadow: playerColor ? `0 0 6px rgba(${playerColor === 'red' ? '207, 64, 66' : playerColor === 'green' ? '46, 189, 89' : '74, 144, 226'}, 0.15)` : 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = playerColor ? `rgba(${playerColor === 'red' ? '207, 64, 66' : playerColor === 'green' ? '46, 189, 89' : '74, 144, 226'}, 0.08)` : 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.boxShadow = playerColor ? `0 0 10px var(--neon-${playerColor})` : '0 0 8px rgba(51, 204, 255, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                          e.currentTarget.style.boxShadow = playerColor ? `0 0 6px rgba(${playerColor === 'red' ? '207, 64, 66' : playerColor === 'green' ? '46, 189, 89' : '74, 144, 226'}, 0.15)` : 'none';
                        }}
                      >
                        Callsign / Weapon Loadout
                      </button>
                    </div>
                  ) : playerColor ? (
                    <span style={{ fontSize: '0.75rem', color: `var(--neon-${playerColor})`, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '1px', marginTop: '1rem' }}>
                      {playerColor} Registered
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '1rem', opacity: 0.6 }}>
                      Syncing color...
                    </span>
                  )}
                </>
              ) : (
                <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-secondary)', animation: 'ping 1.5s infinite', marginBottom: '0.8rem', opacity: 0.4 }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', opacity: 0.4 }}>
                    Waiting for link...
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
        {isHost ? (
          <>
            <button 
              className="btn-console-action" 
              disabled={!canStart}
              onClick={handleStart}
              style={{
                borderColor: canStart ? 'var(--neon-green)' : 'rgba(255,255,255,0.15)',
                color: canStart ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: canStart ? '0 0 15px rgba(34, 197, 94, 0.25)' : 'none'
              }}
            >
              LAUNCH MISSION
            </button>
            {!canStart && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', opacity: 0.5, marginTop: '0.6rem', textAlign: 'center' }}>
                {!isLobbyFull 
                  ? `Launch disabled. Squadron requires exactly ${maxPlayers} linked fighters (current: ${players.length}/${maxPlayers}).` 
                  : !allOthersReady 
                    ? "Launch disabled. Waiting for all squadron members to Ready Up." 
                    : "Launch disabled. Check color conflict configuration (all pilots must have unique colors)."}
              </p>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '0.5rem' }}>
            <button
              className="btn-console-action"
              onClick={handleToggleReadyClick}
              style={{
                borderColor: localPlayerInRoom?.isReady ? 'var(--neon-green)' : 'var(--neon-red)',
                boxShadow: localPlayerInRoom?.isReady ? '0 0 15px rgba(34, 197, 94, 0.25)' : 'none',
                color: '#ffffff'
              }}
            >
              {localPlayerInRoom?.isReady ? 'READY (Cancel)' : 'READY FOR LAUNCH'}
            </button>
            <div style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.5, marginTop: '0.8rem' }}>
              Awaiting Host command launch...
            </div>
          </div>
        )}

        <button 
          className="btn" 
          onClick={handleLeave} 
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: 'rgba(255, 51, 102, 0.4)', 
            fontSize: '0.8rem', 
            letterSpacing: '1px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            outline: 'none',
            marginTop: '1rem'
          }}
        >
          Disconnect Link
        </button>
      </div>

      {/* Themed Custom React Warning PopUp for Color Conflict */}
      {errorMessage && (
        <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 2000 }}>
          <div 
            className="glass-panel" 
            style={{ 
              maxWidth: '460px',
              background: 'rgba(10, 5, 5, 0.98)',
              border: '1px solid rgba(255, 51, 102, 0.25)', // Glow alert red
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(255, 51, 102, 0.05)',
              padding: '3rem',
              borderRadius: '2px',
              textAlign: 'center',
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--neon-red)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
              PILOT REGISTRATION CONFLICT
            </div>
            
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', lineHeight: '1.7', color: '#dcdfe8', marginBottom: '2.5rem', fontWeight: 300, textAlign: 'justify' }}>
              {errorMessage}
            </p>
            
            <button 
              className="btn btn-primary" 
              style={{ 
                background: 'transparent', 
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                borderRadius: '2px',
                letterSpacing: '2px',
                fontSize: '0.85rem'
              }}
              onClick={() => { GameAudio.play('click'); setErrorMessage(null); }}
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
