import React, { useState } from 'react';
import { GameAudio } from '../game/audio';

export default function MainMenu({
  username,
  shipColor,
  isMobileDevice = false,
  isFirstLoad = false,
  onStartSolo,
  onCreateRoom,
  onJoinRoom,
  onOpenLeaderboard,
  onOpenEditProfile,
  onOpenStory,
  onOpenFeedback,
  maxCheckpoint = 0
}) {
  const [showTeamOptions, setShowTeamOptions] = useState(false);
  const [showSoloCheckpoints, setShowSoloCheckpoints] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [hoveredBtn, setHoveredBtn] = useState(null); // 'solo', 'multi', 'leader', 'back', 'create', 'join'

  const isGuest = username ? username.toUpperCase().startsWith('GUEST') : true;

  let shipStrokeColor = 'var(--neon-blue)';
  if (shipColor === 'red') shipStrokeColor = 'var(--neon-red)';
  if (shipColor === 'green') shipStrokeColor = 'var(--neon-green)';

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

  // Small pointing vector ship cursor next to the hovered button
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

        .menu-item-row {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          margin-bottom: 1.5rem;
          width: 100%;
        }

        .minimal-btn-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .menu-btn-pointer {
          position: absolute;
          right: 100%;
          margin-right: 12px;
          top: 50%;
          transform: translateY(-50%) translateX(-10px);
          width: 14px;
          height: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: all 0.25s cubic-bezier(0.19, 1, 0.22, 1);
        }

        .menu-btn-pointer.active {
          opacity: 1;
          transform: translateY(-50%) translateX(0);
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
          text-align: center;
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
          text-shadow: 0 0 5px rgba(74, 144, 226, 0.4);
        }
      `}</style>

      {/* Decorative Title Block */}
      <div 
        className={isFirstLoad ? 'boot-ui-animate' : ''}
        style={{ 
          position: 'relative', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          marginBottom: isMobileDevice ? '1.8rem' : '4rem', 
          transition: 'margin-bottom 0.3s ease',
          opacity: isFirstLoad ? 0 : 1
        }}
      >
        {/* Sleek top corner lines */}
        <div style={{ position: 'absolute', top: '-15px', left: '-20px', width: '24px', height: '8px', borderTop: '1px solid rgba(255,255,255,0.12)', borderLeft: '1px solid rgba(255,255,255,0.12)' }} />
        <div style={{ position: 'absolute', top: '-15px', right: '-20px', width: '24px', height: '8px', borderTop: '1px solid rgba(255,255,255,0.12)', borderRight: '1px solid rgba(255,255,255,0.12)' }} />
        
        <h1 className="game-title" style={{ fontSize: isMobileDevice ? '2.4rem' : '3.6rem', letterSpacing: isMobileDevice ? '8px' : '14px', margin: '0', padding: isMobileDevice ? '0 0 0 8px' : '0 0 0 14px', textTransform: 'uppercase', color: '#ffffff', transition: 'font-size 0.3s' }}>
          Vanguar<span style={{ color: 'var(--neon-yellow)', textShadow: '0 0 8px rgba(217, 167, 82, 0.35)' }}>DZ</span>
        </h1>
        <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-display)', letterSpacing: '6px', color: 'rgba(255, 255, 255, 0.22)', textTransform: 'uppercase', marginTop: '0.8rem' }}>
          Defensive Targeting Matrix
        </span>

        {/* Sleek bottom corner lines */}
        <div style={{ position: 'absolute', bottom: '-15px', left: '-20px', width: '24px', height: '8px', borderBottom: '1px solid rgba(255,255,255,0.12)', borderLeft: '1px solid rgba(255,255,255,0.12)' }} />
        <div style={{ position: 'absolute', bottom: '-15px', right: '-20px', width: '24px', height: '8px', borderBottom: '1px solid rgba(255,255,255,0.12)', borderRight: '1px solid rgba(255,255,255,0.12)' }} />
      </div>
      
      {isMobileDevice ? (
        /* Mobile/Tablet Block Box instead of buttons */
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div 
            style={{
              width: '100%',
              maxWidth: '430px',
              padding: '2.5rem 2rem',
              background: 'rgba(5, 5, 8, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '4px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              margin: '1.5rem 0'
            }}
          >
            {/* Corner brackets */}
            <div style={{ position: 'absolute', top: '10px', left: '10px', width: '15px', height: '15px', borderTop: '2px solid rgba(255, 255, 255, 0.25)', borderLeft: '2px solid rgba(255, 255, 255, 0.25)' }} />
            <div style={{ position: 'absolute', top: '10px', right: '10px', width: '15px', height: '15px', borderTop: '2px solid rgba(255, 255, 255, 0.25)', borderRight: '2px solid rgba(255, 255, 255, 0.25)' }} />
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '15px', height: '15px', borderBottom: '2px solid rgba(255, 255, 255, 0.25)', borderLeft: '2px solid rgba(255, 255, 255, 0.25)' }} />
            <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '15px', height: '15px', borderBottom: '2px solid rgba(255, 255, 255, 0.25)', borderRight: '2px solid rgba(255, 255, 255, 0.25)' }} />

            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.35)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '1.2rem' }}>
              NOTICE
            </div>

            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '0.82rem', lineHeight: '1.6', color: '#a2a6b8', margin: 0, fontWeight: 300 }}>
              This tactical simulator requires a physical keyboard linkage to align and synchronize defensive targeting grids. Please return using a desktop system or terminal equipped with a hardware keyboard.
            </p>
          </div>

          {/* Centered actions at the bottom of the page */}
          <div 
            style={{
              position: 'fixed',
              bottom: '2.5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '1.8rem',
              alignItems: 'center',
              zIndex: 20
            }}
          >
            <button 
              className="leaderboard-link"
              style={{ margin: 0, opacity: 0.65, fontSize: '0.85rem' }}
              onClick={() => { handleButtonClick(); onOpenStory(); }}
            >
              Story
            </button>
            <button 
              className="leaderboard-link"
              style={{ margin: 0, opacity: 0.65, fontSize: '0.85rem' }}
              onClick={() => { handleButtonClick(); onOpenFeedback(); }}
            >
              Feedback
            </button>
            <button 
              className="leaderboard-link"
              style={{ margin: 0, opacity: 0.65, fontSize: '0.85rem' }}
              onClick={() => { handleButtonClick(); onOpenLeaderboard(); }}
            >
              Leaderboard
            </button>
          </div>
        </div>
      ) : (
        /* Desktop menu layout */
        <>
          {/* Dynamic Animated Avatar Profile Trigger */}
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
          >
            <div 
              className={isFirstLoad ? 'boot-ship-animate' : ''}
              style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}
            >
              {getShipSvg(shipColor)}
              {isFirstLoad && (
                <div 
                  className="ship-trail ship-trail-animate" 
                  style={{ '--ship-glow': shipStrokeColor }}
                >
                  <div className="spark spark-1" />
                  <div className="spark spark-2" />
                  <div className="spark spark-3" />
                </div>
              )}
            </div>
            <span 
              className={`profile-trigger-name ${isFirstLoad ? 'boot-ui-animate' : ''}`}
              style={{ 
                fontFamily: 'var(--font-display)',
                fontSize: '0.85rem',
                fontWeight: '500',
                letterSpacing: '3px',
                color: 'var(--text-secondary)',
                marginTop: '1.2rem',
                textTransform: 'uppercase',
                transition: 'color 0.2s',
                opacity: isFirstLoad ? 0 : 1
              }}
            >
              {username}
            </span>
          </div>

          {/* Main Buttons Block */}
          {!showTeamOptions && !showSoloCheckpoints ? (
            <div 
              className={isFirstLoad ? 'boot-ui-animate' : ''} 
              style={{ 
                width: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                opacity: isFirstLoad ? 0 : 1 
              }}
            >
              <div className="menu-item-row">
                <div className="minimal-btn-wrapper">
                  {renderPointer('solo')}
                  <button 
                    className="minimal-text-btn"
                    onMouseEnter={() => setHoveredBtn('solo')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    onClick={() => {
                      handleButtonClick();
                      if (isGuest) {
                        onStartSolo(1);
                      } else {
                        setShowSoloCheckpoints(true);
                      }
                    }}
                  >
                    Solo
                  </button>
                </div>
              </div>
              
              <div className="menu-item-row">
                <div className="minimal-btn-wrapper">
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
              </div>

              <div className="menu-item-row" style={{ marginTop: '0.5rem' }}>
                <div className="minimal-btn-wrapper">
                  {renderPointer('leader')}
                  <button 
                    className="minimal-text-btn"
                    style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '3px' }}
                    onMouseEnter={() => setHoveredBtn('leader')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    onClick={() => { handleButtonClick(); onOpenLeaderboard(); }}
                  >
                    Leaderboard
                  </button>
                </div>
              </div>
            </div>
          ) : showSoloCheckpoints ? (
            <div className="checkpoint-menu-container" style={{ width: '100%' }}>
              <div className="menu-item-row">
                <div className="minimal-btn-wrapper">
                  {renderPointer('new_mission')}
                  <button 
                    className="minimal-text-btn"
                    onMouseEnter={() => setHoveredBtn('new_mission')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    onClick={() => { handleButtonClick(); onStartSolo(1); }}
                  >
                    New Mission
                  </button>
                </div>
              </div>
              
              <div className="checkpoint-title-small">Saved Mission</div>
              
              <div className="checkpoints-grid">
                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(val => {
                  const isUnlocked = val <= maxCheckpoint;
                  return (
                    <button
                      key={val}
                      onClick={() => {
                        if (isUnlocked) {
                          handleButtonClick();
                          onStartSolo(val === 100 ? 100 : val + 1);
                        }
                      }}
                      className={`checkpoint-box ${isUnlocked ? 'unlocked' : ''}`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>

              <div className="menu-item-row" style={{ marginTop: '1.5rem' }}>
                <div className="minimal-btn-wrapper">
                  {renderPointer('back_solo')}
                  <button 
                    className="minimal-text-btn"
                    style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}
                    onMouseEnter={() => setHoveredBtn('back_solo')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    onClick={() => { handleButtonClick(); setShowSoloCheckpoints(false); }}
                  >
                    Back
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease' }}>
              <div className="menu-item-row">
                <div className="minimal-btn-wrapper">
                  {renderPointer('create_2p')}
                  <button 
                    className="minimal-text-btn"
                    onMouseEnter={() => setHoveredBtn('create_2p')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    onClick={() => { handleButtonClick(); onCreateRoom(2); }}
                  >
                    Create 2P Room
                  </button>
                </div>
              </div>

              <div className="menu-item-row" style={{ marginTop: '0.5rem' }}>
                <div className="minimal-btn-wrapper">
                  {renderPointer('create_3p')}
                  <button 
                    className="minimal-text-btn"
                    onMouseEnter={() => setHoveredBtn('create_3p')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    onClick={() => { handleButtonClick(); onCreateRoom(3); }}
                  >
                    Create 3P Room
                  </button>
                </div>
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
                    value={roomCodeInput.toUpperCase()}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4))}
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
                <div className="minimal-btn-wrapper">
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
            </div>
          )}
          
          {/* Story Link on Bottom Left (fixed position for desktop) */}
          <div 
            className={isFirstLoad ? 'boot-ui-animate' : ''}
            style={{
              position: 'fixed',
              bottom: '1.5rem',
              left: '1.5rem',
              zIndex: 20,
              opacity: isFirstLoad ? 0 : 1
            }}
          >
            <button 
              className="leaderboard-link"
              style={{
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
                outline: 'none'
              }}
              onClick={() => { handleButtonClick(); onOpenStory(); }}
            >
              Story
            </button>
          </div>

          {/* Feedback Link on Bottom Right (fixed position for desktop) */}
          <div 
            className={isFirstLoad ? 'boot-ui-animate' : ''}
            style={{
              position: 'fixed',
              bottom: '1.5rem',
              right: '1.5rem',
              zIndex: 20,
              opacity: isFirstLoad ? 0 : 1
            }}
          >
            <button 
              className="leaderboard-link"
              style={{
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
                outline: 'none'
              }}
              onClick={() => { handleButtonClick(); onOpenFeedback(); }}
            >
              Feedback
            </button>
          </div>
        </>
      )}
    </div>
  );
}
