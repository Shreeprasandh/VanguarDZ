import React, { useState, useEffect } from 'react';
import { GameAudio } from '../game/audio';
import { SKILLS_DB } from './SkillsData';

export default function DockingStation({
  username,
  shipColor,
  equippedSkills,
  isMultiplayer,
  players,
  socket,
  wave,
  onContinue
}) {
  const [selectedColor, setSelectedColor] = useState(shipColor);
  const [selectedSkills, setSelectedSkills] = useState(equippedSkills);
  const [ready, setReady] = useState(false);
  const [hoveredSkill, setHoveredSkill] = useState(null);

  // Sync color & skills changes to multiplayer server
  useEffect(() => {
    if (isMultiplayer && socket) {
      socket.send(JSON.stringify({
        type: 'DOCK_PLAYER_UPDATE',
        color: selectedColor,
        skills: selectedSkills,
        ready: ready
      }));
    }
  }, [selectedColor, selectedSkills, ready, isMultiplayer, socket]);

  const [selectedSlot, setSelectedSlot] = useState(0); // 0, 1, or 2

  const localPlayer = isMultiplayer && players
    ? players.find(p => p.socketId === socket?.id || p.username === username)
    : null;
  const isHost = localPlayer ? localPlayer.isHost : true;

  const handleSkillToggle = (skillId) => {
    GameAudio.play('click');
    setSelectedSkills(prev => {
      const next = [...prev];
      const otherIdx = next.indexOf(skillId);
      
      if (otherIdx !== -1) {
        // Swap skills between slots
        const temp = next[selectedSlot];
        next[selectedSlot] = skillId;
        next[otherIdx] = temp;
      } else {
        // Equip into current selected slot
        next[selectedSlot] = skillId;
      }
      return next;
    });
    // Auto-advance focused slot
    setSelectedSlot(prev => (prev + 1) % 3);
  };

  // Check color conflicts
  const colorsUsed = isMultiplayer ? players.map(p => p.color || 'blue') : [selectedColor];
  const colorConflict = isMultiplayer && new Set(colorsUsed).size !== players.length;

  const allPlayersReady = isMultiplayer
    ? players.every(p => p.dockReady)
    : true;

  const handleLaunch = () => {
    if (colorConflict) return;
    GameAudio.play('emp');
    onContinue(selectedColor, selectedSkills);
  };

  const getShipSvg = (colorName) => {
    let strokeColor = '#4a90e2';
    if (colorName === 'red') strokeColor = '#cf4042';
    if (colorName === 'green') strokeColor = '#2ebd59';

    return (
      <svg width="36" height="36" viewBox="0 0 40 40">
        <path
          d="M 20 6 L 32 28 L 20 22 L 8 28 Z"
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="18" r="2" fill={strokeColor} />
      </svg>
    );
  };

  return (
    <div className="modal-overlay" style={{ background: 'rgba(5, 5, 8, 0.94)', backdropFilter: 'blur(12px)', zIndex: 1200 }}>
      <div 
        className="glass-panel"
        style={{ 
          position: 'relative',
          maxWidth: '920px',
          width: '90%',
          background: 'rgba(5, 5, 8, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '2.5rem 1.8rem',
          borderRadius: '4px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)',
          animation: 'fadeIn 0.5s ease-out'
        }}
      >
        {/* Futuristic Aesthetic Corner Brackets */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', width: '15px', height: '15px', borderTop: '2px solid rgba(255, 255, 255, 0.25)', borderLeft: '2px solid rgba(255, 255, 255, 0.25)' }} />
        <div style={{ position: 'absolute', top: '10px', right: '10px', width: '15px', height: '15px', borderTop: '2px solid rgba(255, 255, 255, 0.25)', borderRight: '2px solid rgba(255, 255, 255, 0.25)' }} />
        <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '15px', height: '15px', borderBottom: '2px solid rgba(255, 255, 255, 0.25)', borderLeft: '2px solid rgba(255, 255, 255, 0.25)' }} />
        <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '15px', height: '15px', borderBottom: '2px solid rgba(255, 255, 255, 0.25)', borderRight: '2px solid rgba(255, 255, 255, 0.25)' }} />

        <style>{`
          .dock-grid {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 2.5rem;
            margin-top: 1.5rem;
            margin-bottom: 2rem;
          }
          @media (max-width: 768px) {
            .dock-grid {
              grid-template-columns: 1fr;
              gap: 1.5rem;
            }
          }
          
          .dock-header {
            font-family: var(--font-display);
            font-size: 1.3rem;
            letter-spacing: 5px;
            color: #ffffff;
            text-transform: uppercase;
            text-align: center;
            position: relative;
            margin-bottom: 0.5rem;
          }

          .dock-subtitle {
            font-family: var(--font-display);
            font-size: 0.8rem;
            letter-spacing: 2px;
            color: var(--neon-blue);
            text-transform: uppercase;
            text-align: center;
            margin-bottom: 2rem;
          }

          .dock-panel-title {
            font-family: var(--font-display);
            font-size: 0.85rem;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: var(--text-secondary);
            opacity: 0.7;
            margin-bottom: 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding-bottom: 0.4rem;
          }

          .color-circle {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255,255,255,0.01);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.25s;
          }
          .color-circle:hover {
            transform: scale(1.05);
            border-color: rgba(255,255,255,0.25);
          }
          .color-circle.selected.blue {
            border-color: #4a90e2;
            box-shadow: 0 0 12px rgba(74, 144, 226, 0.25);
          }
          .color-circle.selected.red {
            border-color: #cf4042;
            box-shadow: 0 0 12px rgba(207, 64, 66, 0.25);
          }
          .color-circle.selected.green {
            border-color: #2ebd59;
            box-shadow: 0 0 12px rgba(46, 189, 89, 0.25);
          }

          .telemetry-row {
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
            background: rgba(255, 255, 255, 0.01);
            border: 1px solid rgba(255, 255, 255, 0.04);
            padding: 1rem;
            border-radius: 2px;
            margin-bottom: 0.8rem;
          }

          .pilot-badge {
            display: flex;
            align-items: center;
            gap: 0.8rem;
            width: 100%;
          }

          .ready-glow {
            font-family: var(--font-display);
            font-size: 0.72rem;
            letter-spacing: 1px;
            color: #2ebd59;
            text-shadow: 0 0 4px rgba(46, 189, 89, 0.4);
            text-transform: uppercase;
            white-space: nowrap;
          }

          .pending-glow {
            font-family: var(--font-display);
            font-size: 0.72rem;
            letter-spacing: 1px;
            color: rgba(255, 255, 255, 0.35);
            text-transform: uppercase;
            white-space: nowrap;
          }

          .warn-banner {
            background: rgba(207, 64, 66, 0.05);
            border: 1px solid rgba(207, 64, 66, 0.25);
            color: #cf4042;
            font-family: var(--font-display);
            font-size: 0.8rem;
            letter-spacing: 2px;
            text-transform: uppercase;
            text-align: center;
            padding: 0.6rem;
            margin-bottom: 1.5rem;
            animation: pulse 1.5s infinite;
          }
        `}</style>

        {/* Diagonal high-tech brackets */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-10px', left: '-15px', width: '30px', height: '10px', borderTop: '1px solid rgba(255,255,255,0.15)', borderLeft: '1px solid rgba(255,255,255,0.15)' }} />
          <div style={{ position: 'absolute', top: '-10px', right: '-15px', width: '30px', height: '10px', borderTop: '1px solid rgba(255,255,255,0.15)', borderRight: '1px solid rgba(255,255,255,0.15)' }} />
          
          <div className="dock-header">Orbital Docking Station</div>
          <div className="dock-subtitle">WAVE {wave} COMPLETION - HARBOR MATRIX</div>
          
          {colorConflict && (
            <div className="warn-banner">
              [ HULL SIGNATURE COLLISION DETECTED - SELECT UNIQUE COLORS TO DEPLOY ]
            </div>
          )}

          <div className="dock-grid">
            {/* Left Loadout Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <div className="dock-panel-title">Spaceship Configuration</div>
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div
                    className={`color-circle ${selectedColor === 'red' ? 'selected red' : ''}`}
                    onClick={() => { GameAudio.play('click'); setSelectedColor('red'); }}
                  >
                    {getShipSvg('red')}
                  </div>
                  <div
                    className={`color-circle ${selectedColor === 'blue' ? 'selected blue' : ''}`}
                    onClick={() => { GameAudio.play('click'); setSelectedColor('blue'); }}
                  >
                    {getShipSvg('blue')}
                  </div>
                  <div
                    className={`color-circle ${selectedColor === 'green' ? 'selected green' : ''}`}
                    onClick={() => { GameAudio.play('click'); setSelectedColor('green'); }}
                  >
                    {getShipSvg('green')}
                  </div>
                </div>
              </div>

              <div>
                <div className="dock-panel-title">Equipped Loadout (Click Slot to Swap/Select)</div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.2rem' }}>
                  {[0, 1, 2].map(idx => {
                    const equippedId = selectedSkills[idx];
                    const skillData = SKILLS_DB.find(s => s.id === equippedId);
                    const isSlotSelected = selectedSlot === idx;
                    
                    return (
                      <div
                        key={idx}
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          border: isSlotSelected 
                            ? `2px solid #ffffff` 
                            : (skillData ? `1px solid ${skillData.color}` : '1px dashed rgba(255,255,255,0.2)'),
                          background: isSlotSelected
                            ? 'rgba(74, 144, 226, 0.15)'
                            : 'rgba(0,0,0,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isSlotSelected
                            ? `0 0 15px #4a90e2`
                            : (skillData ? `0 0 10px ${skillData.color}22` : 'none'),
                          color: skillData ? skillData.color : 'transparent',
                          transform: isSlotSelected ? 'scale(1.12)' : 'none',
                          transition: 'all 0.25s cubic-bezier(0.19, 1, 0.22, 1)',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          GameAudio.play('click');
                          setSelectedSlot(idx);
                        }}
                        onMouseEnter={() => skillData && setHoveredSkill(skillData)}
                        onMouseLeave={() => setHoveredSkill(null)}
                      >
                        {skillData ? skillData.svgIcon(skillData.color) : ''}
                      </div>
                    );
                  })}
                </div>

                <div 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(10, 1fr)',
                    gap: '0.4rem',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    padding: '0.6rem',
                    borderRadius: '2px',
                    marginBottom: '1rem'
                  }}
                >
                  {SKILLS_DB.map(s => {
                    const isSelected = selectedSkills.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: isSelected ? `1.5px solid ${s.color}` : '1px solid rgba(255,255,255,0.08)',
                          background: isSelected ? `${s.color}11` : 'rgba(255,255,255,0.01)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: isSelected ? s.color : 'rgba(255,255,255,0.3)',
                          boxShadow: isSelected ? `0 0 8px ${s.color}33` : 'none',
                          transition: 'all 0.2s',
                          margin: 'auto'
                        }}
                        onClick={() => handleSkillToggle(s.id)}
                        onMouseEnter={() => setHoveredSkill(s)}
                        onMouseLeave={() => setHoveredSkill(null)}
                      >
                        {s.svgIcon(isSelected ? s.color : 'rgba(255,255,255,0.3)')}
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    height: '52px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.8rem',
                    color: hoveredSkill ? '#ffffff' : 'rgba(255,255,255,0.25)',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255,255,255,0.03)',
                    padding: '0.4rem 0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '1.4'
                  }}
                >
                  {hoveredSkill ? (
                    <div>
                      <strong style={{ color: hoveredSkill.color, textTransform: 'uppercase', fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>
                        {hoveredSkill.name}
                      </strong>
                      {' '}[Cost: {hoveredSkill.cost}% | Cooldown: {hoveredSkill.cooldown}s] - {hoveredSkill.description}
                    </div>
                  ) : (
                    'Hover over any skill module to query diagnostic details'
                  )}
                </div>
              </div>
            </div>

            {/* Right Telemetry Panel */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="dock-panel-title">Hangar Docking Bays</div>
              {isMultiplayer ? (
                players.map((p, pIdx) => {
                  const pSkills = p.skills || [];
                  const pReady = p.dockReady;
                  return (
                    <div className="telemetry-row" key={p.socketId || pIdx}>
                      <div className="pilot-badge" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                          {getShipSvg(p.color || 'blue')}
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.username}
                          </span>
                        </div>
                        {pReady ? (
                          <span className="ready-glow">[ READY ]</span>
                        ) : (
                          <span className="pending-glow">[ CONFIGURING ]</span>
                        )}
                      </div>
                      
                      {/* Show equipped skills of other players */}
                      <div style={{ display: 'flex', gap: '0.5rem', paddingLeft: '2.6rem' }}>
                        {pSkills.map((skId, sIdx) => {
                          const sData = SKILLS_DB.find(sk => sk.id === skId);
                          if (!sData) return null;
                          return (
                            <div 
                              key={sIdx} 
                              style={{ width: '24px', height: '24px', borderRadius: '50%', border: `1px solid ${sData.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              {sData.svgIcon(sData.color)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="telemetry-row">
                  <div className="pilot-badge" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                      {getShipSvg(selectedColor)}
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        SOLO UNIT (YOU)
                      </span>
                    </div>
                    <span className="ready-glow">[ SYSTEMS ONLINE ]</span>
                  </div>
                </div>
              )}

              {/* Ready status check in multiplayer */}
              {isMultiplayer && (
                <button
                  className="btn"
                  style={{
                    marginTop: 'auto',
                    border: ready ? '1px solid #2ebd59' : '1px solid rgba(255,255,255,0.15)',
                    color: ready ? '#2ebd59' : 'rgba(255,255,255,0.5)',
                    background: 'transparent',
                    letterSpacing: '2px',
                    borderRadius: '2px',
                    textTransform: 'uppercase',
                    fontSize: '0.85rem',
                    padding: '0.8rem 0'
                  }}
                  onClick={() => {
                    GameAudio.play('click');
                    setReady(prev => !prev);
                  }}
                >
                  {ready ? 'Cancel Ready' : 'Lock Configuration (Ready)'}
                </button>
              )}
            </div>
          </div>

          {/* Action button at bottom */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            {!isHost ? (
              <div 
                style={{ 
                  textAlign: 'center', 
                  fontFamily: 'var(--font-display)', 
                  color: ready ? '#2ebd59' : 'rgba(255,255,255,0.4)', 
                  letterSpacing: '2px',
                  fontSize: '0.85rem',
                  padding: '1rem',
                  border: ready ? '1px dashed #2ebd59' : '1px dashed rgba(255,255,255,0.1)',
                  width: '100%',
                  maxWidth: '320px',
                  boxShadow: ready ? '0 0 10px rgba(46, 189, 89, 0.15)' : 'none',
                  textTransform: 'uppercase'
                }}
              >
                {!ready ? 'LOCK CONFIGURATION TO READY UP' : 'WAITING FOR SQUADRON LEADER TO LAUNCH...'}
              </div>
            ) : (
              <button
                className="btn btn-primary"
                style={{
                  maxWidth: '320px',
                  width: '100%',
                  padding: '0.9rem 0',
                  fontSize: '0.9rem',
                  letterSpacing: '3px',
                  background: 'transparent',
                  border: colorConflict || (isMultiplayer && !allPlayersReady) 
                    ? '1px solid rgba(255,255,255,0.08)' 
                    : '1px solid var(--neon-blue)',
                  color: colorConflict || (isMultiplayer && !allPlayersReady) 
                    ? 'rgba(255,255,255,0.2)' 
                    : 'var(--neon-blue)',
                  borderRadius: '2px',
                  textTransform: 'uppercase',
                  cursor: colorConflict || (isMultiplayer && !allPlayersReady) ? 'not-allowed' : 'pointer'
                }}
                disabled={colorConflict || (isMultiplayer && !allPlayersReady)}
                onClick={handleLaunch}
              >
                {isMultiplayer ? 'Launch Squadron' : 'Undock & Disengage'}
              </button>
            )}
          </div>

          <div style={{ position: 'absolute', bottom: '-10px', left: '-15px', width: '30px', height: '10px', borderBottom: '1px solid rgba(255,255,255,0.15)', borderLeft: '1px solid rgba(255,255,255,0.15)' }} />
          <div style={{ position: 'absolute', bottom: '-10px', right: '-15px', width: '30px', height: '10px', borderBottom: '1px solid rgba(255,255,255,0.15)', borderRight: '1px solid rgba(255,255,255,0.15)' }} />
        </div>
      </div>
    </div>
  );
}
