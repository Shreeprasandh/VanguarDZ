import React from 'react';
import { GameAudio } from '../game/audio';

export default function StoryModal({ onClose }) {
  const handleClose = () => {
    GameAudio.play('click');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className="glass-panel" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          background: 'rgba(5, 5, 5, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '3rem',
          borderRadius: '2px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)',
          animation: 'fadeIn 0.4s ease-out'
        }}
      >
        <style>{`
          .story-title {
            font-family: var(--font-display);
            font-size: 1.4rem;
            letter-spacing: 4px;
            text-transform: uppercase;
            margin-bottom: 2rem;
            color: var(--text-primary);
            text-align: center;
          }
          .story-paragraph {
            font-family: var(--font-body);
            font-size: 1.05rem;
            line-height: 1.8;
            color: #dcdfe8;
            text-align: justify;
            margin-bottom: 1.5rem;
            letter-spacing: 0.5px;
            font-weight: 300;
          }
          .story-footer {
            font-family: var(--font-display);
            font-size: 0.9rem;
            letter-spacing: 2px;
            text-align: center;
            color: var(--neon-blue);
            margin-top: 2.5rem;
            font-style: italic;
          }
        `}</style>
        
        <div className="story-title">// THE VANGUARD INITIATIVE</div>
        
        <p className="story-paragraph">
          We and our friends are in war with another species, and they outnumber us in so much more.
          We planned on going on the offensive with a small group in the hope of stalling them, but our friends are not strong. Yet, they carry the unbreakable will to fight for their people.
        </p>
        
        <p className="story-paragraph">
          Seeing their resolve, you made a choice. Under the cover of cosmic dust, you sneaked away, venturing deep into the heart of enemy territory all by yourself. You hope to defeat them, or at least hold them off, finishing enough of their armada to open up a path for your friends.
        </p>

        <p className="story-paragraph">
          You knew the odds. You knew the final destination. You are ready to sacrifice everything...
        </p>
        
        <div className="story-footer">
          ...because we are him, and we will fight.
        </div>

        <button 
          className="btn" 
          style={{ 
            marginTop: '3rem', 
            background: 'transparent', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            borderRadius: '2px', 
            fontSize: '0.8rem',
            letterSpacing: '1px'
          }} 
          onClick={handleClose}
        >
          Return to Command
        </button>
      </div>
    </div>
  );
}
