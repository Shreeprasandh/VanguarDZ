import React, { useState } from 'react';
import { GameAudio } from '../game/audio';

export default function ProfileEdit({ initialUsername, initialColor, onSave, onCancel }) {
  const [username, setUsername] = useState(initialUsername || '');
  const [color, setColor] = useState(initialColor || 'blue');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    GameAudio.play('click');
    onSave(username.trim(), color);
  };

  const handleOptionSelect = (c) => {
    GameAudio.play('click');
    setColor(c);
  };

  const getShipSvg = (shipColor) => {
    let strokeColor = 'var(--neon-blue)';
    if (shipColor === 'red') strokeColor = 'var(--neon-red)';
    if (shipColor === 'green') strokeColor = 'var(--neon-green)';

    return (
      <svg width="44" height="44" viewBox="0 0 40 40" style={{ filter: `drop-shadow(0 0 6px ${strokeColor})` }}>
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
    <div className="modal-overlay" style={{ background: 'rgba(0, 0, 0, 0.88)', backdropFilter: 'blur(10px)', zIndex: 1000 }}>
      <div 
        style={{ 
          maxWidth: '440px',
          width: '100%',
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: '2rem 1rem',
          textAlign: 'center',
          animation: 'fadeIn 0.4s ease-out'
        }}
      >
        <style>{`
          .console-label {
            font-family: var(--font-display);
            font-size: 0.8rem;
            letter-spacing: 2.5px;
            text-transform: uppercase;
            color: var(--text-secondary);
            margin-bottom: 0.8rem;
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
            margin-bottom: 2.5rem;
            outline: none;
            text-align: center;
            text-transform: uppercase;
            transition: all 0.25s ease;
          }
          
          .console-input:focus {
            border-bottom: 1px solid var(--neon-blue);
          }

          .ship-option-circle {
            width: 68px;
            height: 68px;
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
            box-shadow: 0 0 15px rgba(74, 144, 226, 0.2);
            background: rgba(74, 144, 226, 0.05);
          }

          .ship-option-circle.selected.red {
            border-color: var(--neon-red);
            box-shadow: 0 0 15px rgba(207, 64, 66, 0.2);
            background: rgba(207, 64, 66, 0.05);
          }

          .ship-option-circle.selected.green {
            border-color: var(--neon-green);
            box-shadow: 0 0 15px rgba(46, 189, 89, 0.2);
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

          .btn-console-submit:hover {
            border-color: #ffffff;
            background: rgba(255,255,255,0.03);
            letter-spacing: 4px;
          }
        `}</style>
        
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '3rem', color: '#ffffff' }}>
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

          <div className="console-label" style={{ marginBottom: '1.5rem' }}>Spaceship Configuration</div>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '3.5rem' }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <button type="submit" className="btn-console-submit">
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
                  marginTop: '0.8rem',
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
