import React from 'react';
import { GameAudio } from '../game/audio';

export default function StoryModal({ onClose }) {
  const handleClose = () => {
    GameAudio.play('click');
    onClose();
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={handleClose}
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
        zIndex: 1000,
        backdropFilter: 'blur(8px)'
      }}
    >
      <div 
        className="glass-panel" 
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '90%',
          maxWidth: '430px',
          background: 'rgba(5, 5, 8, 0.97)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '2.5rem',
          borderRadius: '4px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)',
          animation: 'fadeIn 0.4s ease-out'
        }}
      >
        {/* Futuristic Aesthetic Corner Brackets */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', width: '15px', height: '15px', borderTop: '2px solid rgba(255, 255, 255, 0.25)', borderLeft: '2px solid rgba(255, 255, 255, 0.25)' }} />
        <div style={{ position: 'absolute', top: '10px', right: '10px', width: '15px', height: '15px', borderTop: '2px solid rgba(255, 255, 255, 0.25)', borderRight: '2px solid rgba(255, 255, 255, 0.25)' }} />
        <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '15px', height: '15px', borderBottom: '2px solid rgba(255, 255, 255, 0.25)', borderLeft: '2px solid rgba(255, 255, 255, 0.25)' }} />
        <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '15px', height: '15px', borderBottom: '2px solid rgba(255, 255, 255, 0.25)', borderRight: '2px solid rgba(255, 255, 255, 0.25)' }} />

        <style>{`
          .story-title {
            font-family: 'Outfit', sans-serif;
            font-size: 1.15rem;
            font-weight: 700;
            letter-spacing: 5px;
            text-transform: uppercase;
            margin-bottom: 1.8rem;
            color: #ffffff;
            text-align: center;
          }
          .story-paragraph {
            font-family: 'Georgia', serif;
            font-size: 0.95rem;
            line-height: 1.8;
            color: #d2d6e6;
            text-align: center;
            margin-bottom: 1.4rem;
            letter-spacing: 0.2px;
            font-weight: 300;
          }
          .story-footer {
            font-family: 'Outfit', sans-serif;
            font-size: 0.8rem;
            font-weight: 400;
            letter-spacing: 2px;
            text-align: center;
            color: #a2a6b8;
            margin-top: 2rem;
            font-style: italic;
            opacity: 0.85;
          }
          @media (max-width: 480px) {
            .glass-panel {
              padding: 1.5rem !important;
            }
            .story-title {
              font-size: 1rem !important;
              margin-bottom: 1.2rem !important;
            }
            .story-paragraph {
              font-size: 0.82rem !important;
              line-height: 1.6 !important;
              margin-bottom: 1rem !important;
            }
            .story-footer {
              font-size: 0.72rem !important;
              margin-top: 1.2rem !important;
            }
          }
        `}</style>
        
        <div className="story-title">THE VANGUARDZ INITIATIVE</div>
        
        <p className="story-paragraph">
          We watched our home world burn, a silent spark swallowed by the black ocean of space. The counselors told us that survival was enough, but to live on our knees is to fade into nothingness.
        </p>
        
        <p className="story-paragraph">
          Our friends carry the will to resist, but their ships are old, and their hearts are weary. If they engage the armada directly, they will be swept aside like space dust.
        </p>

        <p className="story-paragraph">
          So you made a choice. Under a shroud of stardust, you slipped into the dark alone, steering your fighter into the belly of the hostile empire. You do not seek glory—only to clear a path out of the shadows.
        </p>
        
        <div className="story-footer">
          ...we are the final shield. We will stand.
        </div>

        <style>{`
          .btn-story-launch {
            margin-top: 2.2rem;
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 2px;
            font-size: 0.75rem;
            letter-spacing: 2.2px;
            text-transform: uppercase;
            padding: 0.6rem 2rem;
            color: #ffffff;
            cursor: pointer;
            transition: all 0.2s;
            outline: none;
            font-family: var(--font-display);
          }
          .btn-story-launch:hover {
            border-color: #ffffff;
            background: rgba(255, 255, 255, 0.05);
            color: #ffffff;
            text-shadow: 0 0 8px rgba(255, 255, 255, 0.45);
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.22);
            letter-spacing: 3px;
          }
        `}</style>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button 
            className="btn-story-launch" 
            onClick={handleClose}
          >
            Launch Command
          </button>
        </div>
      </div>
    </div>
  );
}
