import React from 'react';
import { GameAudio } from '../game/audio';

export default function GameOver({ score, wave, isMultiplayer, teamPlayers, onReturnMenu }) {
  const handleReturn = () => {
    GameAudio.play('click');
    onReturnMenu();
  };

  const isSacrificeWave = wave >= 100;

  return (
    <div className="modal-overlay" style={{ background: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(10px)', zIndex: 1000 }}>
      <div 
        style={{ 
          maxWidth: '500px',
          width: '100%',
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: '2rem 1rem',
          textAlign: 'center',
          animation: 'fadeIn 0.5s ease-out'
        }}
      >
        <style>{`
          .defeat-title {
            font-family: var(--font-display);
            font-size: 1.7rem;
            letter-spacing: 5px;
            text-transform: uppercase;
            margin-bottom: 2rem;
            text-align: center;
          }
          
          .defeat-divider-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
            padding: 1rem 0.5rem;
            font-family: var(--font-display);
            letter-spacing: 2px;
            font-size: 0.95rem;
          }

          .defeat-divider-row:last-of-type {
            border-bottom: none;
          }

          .btn-defeat-action {
            font-family: var(--font-display);
            font-size: 0.95rem;
            letter-spacing: 3px;
            text-transform: uppercase;
            color: #ffffff;
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.15);
            padding: 0.8rem 2rem;
            width: 100%;
            cursor: pointer;
            transition: all 0.2s;
            outline: none;
            border-radius: 2px;
            margin-top: 3rem;
          }

          .btn-defeat-action:hover {
            border-color: var(--neon-red);
            background: rgba(207, 64, 66, 0.02);
            color: var(--neon-red);
            text-shadow: 0 0 5px rgba(207, 64, 66, 0.3);
            letter-spacing: 4px;
          }
        `}</style>

        {isSacrificeWave ? (
          <>
            <h1 className="defeat-title" style={{ color: 'var(--neon-blue)', textShadow: '0 0 10px rgba(74, 144, 226, 0.4)' }}>
              HERO SACRIFICED
            </h1>
            
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.05rem',
              lineHeight: '1.8',
              color: '#dcdfe8',
              textAlign: 'justify',
              marginBottom: '2.5rem',
              letterSpacing: '0.5px',
              borderTop: '1px dashed rgba(255, 255, 255, 0.12)',
              borderBottom: '1px dashed rgba(255, 255, 255, 0.12)',
              padding: '1.5rem 0.5rem',
              fontWeight: '300'
            }}>
              The hero sacrificed himself and paved a path for his friends, who then defeated the enemy army after a fierce battle. This victory belongs to the hero.
              <br /><br />
              Thank you, now your friends are safe.
            </div>

            <button className="btn-defeat-action" onClick={handleReturn}>
              Return to Main Menu to Start Over
            </button>
          </>
        ) : (
          <>
            <h1 className="defeat-title" style={{ color: 'var(--neon-red)', textShadow: '0 0 10px rgba(207, 64, 66, 0.4)' }}>
              SHIP DESTROYED
            </h1>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '0.95rem', letterSpacing: '0.5px', fontFamily: 'var(--font-body)', fontWeight: 300 }}>
              Your hull was vaporized by letter-bullet impacts.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <div className="defeat-divider-row">
                <span style={{ color: 'var(--text-secondary)' }}>MISSION SCORE</span>
                <span style={{ color: 'var(--neon-blue)', fontWeight: 'bold' }}>{score.toLocaleString()}</span>
              </div>
              
              <div className="defeat-divider-row">
                <span style={{ color: 'var(--text-secondary)' }}>WAVES CLEARED</span>
                <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{wave - 1}</span>
              </div>
            </div>

            {isMultiplayer && teamPlayers && teamPlayers.length > 0 && (
              <div style={{ marginTop: '2.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.2rem', fontFamily: 'var(--font-display)', opacity: 0.6 }}>
                  CO-OP SQUAD REPORTS
                </div>
                {teamPlayers.map((player) => (
                  <div key={player.socketId} className="defeat-divider-row" style={{ padding: '0.6rem 0.5rem', fontSize: '0.9rem' }}>
                    <span style={{ color: `var(--neon-${player.color})` }}>
                      {player.username}
                    </span>
                    <span style={{ color: 'var(--neon-blue)' }}>
                      {player.score.toLocaleString()} PTS
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button className="btn-defeat-action" onClick={handleReturn}>
              Return to command
            </button>
          </>
        )}
      </div>
    </div>
  );
}
