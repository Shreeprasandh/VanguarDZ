import React, { useState } from 'react';
import { GameAudio } from '../game/audio';
import { SKILLS_DB } from './SkillsData';

export default function ProfileEdit({ initialUsername, initialColor, initialSkills, onSave, onCancel }) {
  const [username, setUsername] = useState(initialUsername || '');
  const [color, setColor] = useState(initialColor || 'blue');
  const [skills, setSkills] = useState(initialSkills || ['emp_discharge', 'overclock', 'nebula_veil']);
  const [hoveredSkill, setHoveredSkill] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(0); // 0, 1, or 2

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    if (skills.length !== 3) return; // Must have exactly 3 equipped
    GameAudio.play('click');
    onSave(username.trim(), color, skills);
  };

  const handleOptionSelect = (c) => {
    GameAudio.play('click');
    setColor(c);
  };

  const handleSkillToggle = (skillId) => {
    GameAudio.play('click');
    setSkills(prev => {
      const next = [...prev];
      const otherIdx = next.indexOf(skillId);
      
      if (otherIdx !== -1) {
        // Skill is already equipped. Swap it with the current selected slot!
        const temp = next[selectedSlot];
        next[selectedSlot] = skillId;
        next[otherIdx] = temp;
      } else {
        // Place in currently selected slot
        next[selectedSlot] = skillId;
      }
      return next;
    });
    // Cycle focus to the next slot automatically
    setSelectedSlot(prev => (prev + 1) % 3);
  };

  const getShipSvg = (shipColor) => {
    let strokeColor = 'var(--neon-blue)';
    if (shipColor === 'red') strokeColor = 'var(--neon-red)';
    if (shipColor === 'green') strokeColor = 'var(--neon-green)';

    return (
      <svg width="24" height="24" viewBox="0 0 40 40" style={{ filter: `drop-shadow(0 0 4px ${strokeColor})` }}>
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
    <div className="modal-overlay" style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)', zIndex: 1000 }}>
      <div 
        className="glass-panel"
        style={{ 
          position: 'relative',
          maxWidth: '480px',
          width: '90%',
          background: 'rgba(5, 5, 8, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '2.5rem 1.8rem',
          borderRadius: '4px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)',
          textAlign: 'center',
          animation: 'fadeIn 0.4s ease-out'
        }}
      >
        {/* Futuristic Aesthetic Corner Brackets */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', width: '15px', height: '15px', borderTop: '2px solid rgba(255, 255, 255, 0.25)', borderLeft: '2px solid rgba(255, 255, 255, 0.25)' }} />
        <div style={{ position: 'absolute', top: '10px', right: '10px', width: '15px', height: '15px', borderTop: '2px solid rgba(255, 255, 255, 0.25)', borderRight: '2px solid rgba(255, 255, 255, 0.25)' }} />
        <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '15px', height: '15px', borderBottom: '2px solid rgba(255, 255, 255, 0.25)', borderLeft: '2px solid rgba(255, 255, 255, 0.25)' }} />
        <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '15px', height: '15px', borderBottom: '2px solid rgba(255, 255, 255, 0.25)', borderRight: '2px solid rgba(255, 255, 255, 0.25)' }} />

        <style>{`
          @media (max-width: 480px) {
            .glass-panel {
              padding: 1.5rem 1.2rem !important;
              width: 95% !important;
            }
            .skill-grid-container {
              grid-template-columns: repeat(5, 1fr) !important;
              gap: 0.4rem !important;
              max-height: 110px !important;
            }
            .console-input {
              margin-bottom: 1.2rem !important;
            }
            .console-label {
              margin-bottom: 0.5rem !important;
            }
          }
          .console-label {
            font-family: var(--font-display);
            font-size: 0.8rem;
            letter-spacing: 2.5px;
            text-transform: uppercase;
            color: var(--text-secondary);
            margin-bottom: 0.3rem;
            text-align: center;
            opacity: 0.6;
          }
          
          .console-input {
            width: 100%;
            background: transparent;
            border: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.12);
            color: #ffffff;
            font-family: var(--font-display);
            font-size: 1.2rem;
            letter-spacing: 4px;
            padding: 0.5rem 0;
            margin-bottom: 1rem;
            outline: none;
            text-align: center;
            text-transform: uppercase;
            transition: all 0.25s ease;
          }
          
          .console-input:focus {
            border-bottom: 1px solid var(--neon-blue);
          }

          .ship-option-circle {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.01);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.19, 1, 0.22, 1);
          }

          .ship-option-circle:hover {
            border-color: rgba(255, 255, 255, 0.25);
            background: rgba(255, 255, 255, 0.02);
            transform: scale(1.05);
          }

          .ship-option-circle.selected.blue {
            border-color: var(--neon-blue);
            box-shadow: 0 0 8px rgba(74, 144, 226, 0.25);
            background: rgba(74, 144, 226, 0.05);
          }

          .ship-option-circle.selected.red {
            border-color: var(--neon-red);
            box-shadow: 0 0 8px rgba(207, 64, 66, 0.25);
            background: rgba(207, 64, 66, 0.05);
          }

          .ship-option-circle.selected.green {
            border-color: var(--neon-green);
            box-shadow: 0 0 8px rgba(46, 189, 89, 0.25);
            background: rgba(46, 189, 89, 0.05);
          }

          .btn-console-submit {
            font-family: var(--font-display);
            font-size: 0.95rem;
            letter-spacing: 3px;
            text-transform: uppercase;
            color: #ffffff;
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.15);
            padding: 0.75rem 2rem;
            width: 100%;
            cursor: pointer;
            transition: all 0.2s;
            outline: none;
            border-radius: 2px;
          }

          .btn-console-submit:hover:not(:disabled) {
            border-color: #ffffff;
            background: rgba(255,255,255,0.03);
            letter-spacing: 4px;
          }

          .btn-console-submit:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }

          /* Scrollbar detailing */
          .skill-grid-container::-webkit-scrollbar {
            width: 3px;
          }
          .skill-grid-container::-webkit-scrollbar-track {
            background: transparent;
          }
          .skill-grid-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
          }
        `}</style>
        
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '1rem', color: '#ffffff' }}>
          PILOT IDENTITY
        </div>

        <form onSubmit={handleSubmit}>
          <div className="console-label">Callsign</div>
          <input
            type="text"
            className="console-input"
            value={username}
            onChange={(e) => setUsername(e.target.value.substring(0, 15))}
            placeholder="ENTER CALLSIGN"
            maxLength={15}
            required
            autoFocus
          />

          <div className="console-label" style={{ marginBottom: '0.4rem' }}>Spaceship Configuration</div>
          <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center', marginBottom: '1.2rem' }}>
            <div
              className={`ship-option-circle ${color === 'red' ? 'selected red' : ''}`}
              onClick={() => handleOptionSelect('red')}
            >
              {getShipSvg('red')}
            </div>
            <div
              className={`ship-option-circle ${color === 'blue' ? 'selected blue' : ''}`}
              onClick={() => handleOptionSelect('blue')}
            >
              {getShipSvg('blue')}
            </div>
            <div
              className={`ship-option-circle ${color === 'green' ? 'selected green' : ''}`}
              onClick={() => handleOptionSelect('green')}
            >
              {getShipSvg('green')}
            </div>
          </div>

          <div className="console-label" style={{ marginBottom: '0.4rem' }}>
            Equipped Loadout (Click Slot to Swap/Select)
          </div>
          
          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginBottom: '0.8rem' }}>
            {[0, 1, 2].map(idx => {
              const equippedId = skills[idx];
              const skillData = SKILLS_DB.find(s => s.id === equippedId);
              const isSlotSelected = selectedSlot === idx;
              
              return (
                <div
                  key={idx}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: isSlotSelected 
                      ? `2px solid #ffffff` 
                      : (skillData ? `1px solid ${skillData.color}` : '1px dashed rgba(255, 255, 255, 0.15)'),
                    background: isSlotSelected 
                      ? 'rgba(74, 144, 226, 0.15)' 
                      : 'rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: skillData ? skillData.color : 'transparent',
                    boxShadow: isSlotSelected
                      ? `0 0 8px #4a90e2`
                      : (skillData ? `0 0 4px ${skillData.color}22` : 'none'),
                    transform: isSlotSelected ? 'scale(1.05)' : 'none',
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

          {/* Inventory scrollable grid */}
          <div 
            className="skill-grid-container"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '0.6rem',
              maxHeight: '140px',
              overflowY: 'auto',
              padding: '0.6rem',
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '2px',
              marginBottom: '1rem'
            }}
          >
            {SKILLS_DB.map(s => {
              const isSelected = skills.includes(s.id);
              return (
                <div
                  key={s.id}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: isSelected ? `1.5px solid ${s.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isSelected ? `${s.color}11` : 'rgba(255,255,255,0.01)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: isSelected ? s.color : 'rgba(255,255,255,0.3)',
                    margin: 'auto',
                    boxShadow: isSelected ? `0 0 8px ${s.color}33` : 'none',
                    transition: 'all 0.2s'
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

          {/* Info read-out panel */}
          <div
            style={{
              height: '38px',
              fontFamily: 'var(--font-body)',
              fontSize: '0.72rem',
              lineHeight: '1.4',
              color: hoveredSkill ? '#ffffff' : 'rgba(255,255,255,0.25)',
              textAlign: 'center',
              marginBottom: '1rem',
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid rgba(255,255,255,0.03)',
              padding: '0.2rem 0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <button 
              type="submit" 
              className="btn-console-submit" 
              disabled={skills.length !== 3}
            >
              Establish Connection
            </button>
            {onCancel && (
              <button 
                type="button" 
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'rgba(255,255,255,0.3)', 
                  fontFamily: 'var(--font-display)', 
                  fontSize: '0.8rem', 
                  letterSpacing: '1.5px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  marginTop: '0.3rem',
                  outline: 'none'
                }} 
                onClick={() => { GameAudio.play('click'); onCancel(); }}
              >
                Abort
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
