import React, { useState } from 'react';
import { GameAudio } from '../game/audio';

export default function MainMenu({
  username,
  shipColor,
  onStartSolo,
  onCreateRoom,
  onJoinRoom,
  onOpenLeaderboard,
  onOpenEditProfile,
  onOpenStory
}) {
  const [showTeamOptions, setShowTeamOptions] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [hoveredBtn, setHoveredBtn] = useState(null); // 'solo', 'multi', 'leader', 'back', 'create', 'join'

  const handleButtonClick = () => {
    GameAudio.play('click');
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomCodeInput.length === 4) {
      handleButtonClick();
      onJoinRoom(roomCodeInput.toUpperCase());
    }
  };

  // Helper to draw a small pointing vector ship cursor next to the hovered button
  const renderPointer = (btnId) => {
    if (hoveredBtn !== btnId) return <div className="menu-btn-pointer" />;
    
    let strokeColor = 'var(--neon-blue)';
    if (shipColor === 'red') strokeColor = 'var(--neon-red)';
    if (shipColor === 'green') strokeColor = 'var(--neon-green)';

    return (
      <div className="menu-btn-pointer active" style={{ color: strokeColor }}>
        <svg width="14" height="14" viewBox="0 0 40 40" style={{ transform: 'rotate(90deg)', filter: `drop-shadow(0 0 3px ${strokeColor})` }}>
          <path d="M 20 5 L 32 30 L 20 23 L 8 30 Z" fill="currentColor" stroke="none" />
        </svg>
      </div>
    );
  };

  const getShipSvg = (color) => {
    let strokeColor = 'var(--neon-blue)';
    if (color === 'red') strokeColor = 'var(--neon-red)';
    if (color === 'green') strokeColor = 'var(--neon-green)';

    return (
      <svg className="menu-ship-floating" width="64" height="64" viewBox="0 0 40 40" style={{ filter: `drop-shadow(0 0 8px ${strokeColor})` }}>
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
        <path className="menu-ship-engine" d="M 16 23 L 20 34 L 24 23 Z" fill={strokeColor} opacity="0.4" />
      </svg>
    );
  };

  return (
    <div className="menu-layout-minimal" style={{ animation: 'fadeIn 0.6s ease-out' }}>
      {/* Self-contained premium animations */}
      <style>{`
        .menu-layout-minimal {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 480px;
          padding: 1rem;
        }
        
        .menu-ship-floating {
          animation: menuFloat 4s ease-in-out infinite;
          cursor: pointer;
        }

        .menu-ship-engine {
          animation: enginePulse 0.15s ease-in-out infinite alternate;
        }

        @keyframes menuFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @keyframes enginePulse {
          0% { transform: scaleY(0.85) translateY(-1px); opacity: 0.35; }
          100% { transform: scaleY(1.2) translateY(1px); opacity: 0.65; }
        }

        /* Borderless minimal styling */
        .menu-item-row {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          margin-bottom: 1.2rem;
          width: 100%;
        }

        .menu-btn-pointer {
          width: 32px;
          height: 14px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          margin-right: 12px;
          opacity: 0;
          transform: translateX(-8px);
          transition: all 0.25s cubic-bezier(0.19, 1, 0.22, 1);
        }

        .menu-btn-pointer.active {
          opacity: 1;
          transform: translateX(0);
        }

        .minimal-text-btn {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 500;
          letter-spacing: 4px;
          text-transform: uppercase;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0.4rem 0.5rem;
          position: relative;
          outline: none;
          text-align: left;
        }

        .minimal-text-btn:hover {
          color: var(--text-primary);
          letter-spacing: 6px;
        }

        .minimal-text-btn::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 1px;
          background: var(--text-primary);
          transition: all 0.25s ease;
          transform: translateX(-50%);
        }

        .minimal-text-btn:hover::after {
          width: 100%;
        }

        /* Leaderboard link styled smaller and subtle */
        .leaderboard-link {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          opacity: 0.35;
          font-family: var(--font-display);
          font-size: 0.8rem;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 2rem;
          outline: none;
        }

        .leaderboard-link:hover {
          opacity: 0.7;
          color: var(--neon-blue);
          text-shadow: 0 0 5px rgba(51, 204, 255, 0.4);
        }
      `}</style>

      {/* Futuristic Game Name VanguarD */}
      <h1 className="game-title" style={{ fontSize: '3.6rem', letterSpacing: '14px', marginBottom: '3rem' }}>
        Vanguar<span style={{ color: '#abb4c4', textShadow: '0 0 12px rgba(171, 180, 196, 0.5)' }}>D</span>
      </h1>
      
      {/* Dynamic Animated Avatar Profile Trigger */}
      <div 
        onClick={() => { handleButtonClick(); onOpenEditProfile(); }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '3.5rem',
          position: 'relative'
        }}
        title="Click to customize profile"
      >
        {getShipSvg(shipColor)}
        <span style={{ 
          fontFamily: 'var(--font-display)',
          fontSize: '0.85rem',
          fontWeight: '500',
          letterSpacing: '3px',
          color: 'var(--text-secondary)',
          marginTop: '1.2rem',
          textTransform: 'uppercase',
          transition: 'color 0.2s'
        }} className="profile-trigger-name">
          {username}
        </span>
      </div>

      {/* Main Buttons Block */}
      {!showTeamOptions ? (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="menu-item-row">
            {renderPointer('solo')}
            <button 
              className="minimal-text-btn"
              onMouseEnter={() => setHoveredBtn('solo')}
              onMouseLeave={() => setHoveredBtn(null)}
              onClick={() => { handleButtonClick(); onStartSolo(); }}
            >
              Solo
            </button>
          </div>
          
          <div className="menu-item-row">
            {renderPointer('multi')}
            <button 
              className="minimal-text-btn"
              onMouseEnter={() => setHoveredBtn('multi')}
              onMouseLeave={() => setHoveredBtn(null)}
              onClick={() => { handleButtonClick(); setShowTeamOptions(true); }}
            >
              Multiplayer
            </button>
          </div>

          <button 
            className="leaderboard-link"
            onClick={() => { handleButtonClick(); onOpenLeaderboard(); }}
          >
            // Leaderboard
          </button>
        </div>
      ) : (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease' }}>
          <div className="menu-item-row">
            {renderPointer('create')}
            <button 
              className="minimal-text-btn"
              onMouseEnter={() => setHoveredBtn('create')}
              onMouseLeave={() => setHoveredBtn(null)}
              onClick={() => { handleButtonClick(); onCreateRoom(); }}
            >
              Create Room
            </button>
          </div>

          <form onSubmit={handleJoin} style={{ width: '100%', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.8rem', textTransform: 'uppercase', fontFamily: 'var(--font-display)', letterSpacing: '2px', opacity: 0.6 }}>
              Enter Room Code
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '240px', justifyContent: 'center' }}>
              <input
                type="text"
                className="text-input"
                style={{ 
                  marginBottom: 0, 
                  textTransform: 'uppercase', 
                  fontFamily: 'var(--font-display)', 
                  letterSpacing: '4px', 
                  textAlign: 'center', 
                  fontSize: '1.2rem',
                  padding: '0.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '2px',
                  background: 'rgba(255,255,255,0.02)'
                }}
                placeholder="CODE"
                maxLength={4}
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.replace(/[^a-zA-Z]/g, '').substring(0, 4))}
              />
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ 
                  width: 'auto', 
                  marginBottom: 0, 
                  padding: '0 1.2rem',
                  borderRadius: '2px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  fontSize: '0.8rem',
                  letterSpacing: '1px'
                }}
                disabled={roomCodeInput.length !== 4}
              >
                Join
              </button>
            </div>
          </form>

          <div className="menu-item-row" style={{ marginTop: '2.5rem' }}>
            {renderPointer('back')}
            <button 
              className="minimal-text-btn"
              style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}
              onMouseEnter={() => setHoveredBtn('back')}
              onMouseLeave={() => setHoveredBtn(null)}
              onClick={() => { handleButtonClick(); setShowTeamOptions(false); }}
            >
              Back
            </button>
          </div>
        </div>
      )}
      
      {/* Story Link on Bottom Left (fixed position) */}
      <button 
        className="leaderboard-link"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          left: '1.5rem',
          marginTop: 0,
          opacity: 0.35,
          background: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-display)',
          fontSize: '0.8rem',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'all 0.2s',
          outline: 'none',
          zIndex: 20
        }}
        onClick={() => { handleButtonClick(); onOpenStory(); }}
      >
        // Story
      </button>
    </div>
  );
}
