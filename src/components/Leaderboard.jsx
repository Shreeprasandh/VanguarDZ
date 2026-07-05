import React from 'react';

export default function Leaderboard({ leaderboard, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose} style={{ background: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(10px)', zIndex: 1000 }}>
      <div 
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          position: 'relative',
          maxWidth: '520px',
          width: '90%',
          background: 'rgba(5, 5, 8, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '2.5rem 1.8rem',
          borderRadius: '4px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)',
          textAlign: 'center',
          animation: 'fadeIn 0.3s ease-out'
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
            .leaderboard-title {
              font-size: 1.2rem !important;
              margin-bottom: 1.2rem !important;
            }
            .lb-row {
              font-size: 0.82rem !important;
              padding: 0.6rem 0.3rem !important;
            }
            .btn-lb-close {
              margin-top: 1.8rem !important;
            }
          }
          .leaderboard-title {
            font-family: var(--font-display);
            font-size: 1.6rem;
            letter-spacing: 5px;
            text-transform: uppercase;
            color: #ffffff;
            margin-bottom: 2rem;
            text-align: center;
          }

          .lb-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
            padding: 0.85rem 0.5rem;
            font-family: var(--font-display);
            letter-spacing: 1.5px;
            font-size: 0.92rem;
          }

          .lb-row:last-of-type {
            border-bottom: none;
          }

          .btn-lb-close {
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

          .btn-lb-close:hover {
            border-color: #ffffff;
            background: rgba(255, 255, 255, 0.05);
            color: #ffffff;
            text-shadow: 0 0 8px rgba(255, 255, 255, 0.45);
            letter-spacing: 4px;
          }
        `}</style>

        <h1 className="leaderboard-title">
          GLOBAL HIGH SCORES
        </h1>
        
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '2.5rem', fontFamily: 'var(--font-body)', fontWeight: 300 }}>
          Top pilot scores recorded across solo offensive deployments.
        </p>

        {leaderboard.length === 0 ? (
          <p style={{ padding: '2rem 0', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontStyle: 'italic', opacity: 0.5 }}>
            No high scores recorded on grid.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            {leaderboard.map((item, index) => (
              <div key={index} className="lb-row">
                <span style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', width: '24px', textAlign: 'left', fontSize: '0.8rem' }}>
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <span style={{ color: '#ffffff', fontWeight: 500 }}>
                    {item.username}
                  </span>
                </span>
                <span style={{ color: 'var(--neon-blue)', fontWeight: 'bold' }}>
                  {item.score.toLocaleString()} PTS
                </span>
              </div>
            ))}
          </div>
        )}

        <button className="btn-lb-close" onClick={onClose}>
          Close Terminal
        </button>
      </div>
    </div>
  );
}
