import React from 'react';
import { GameAudio } from '../game/audio';

export default function InfoPopup({ onClose }) {
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
          background: 'rgba(5, 5, 8, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '2.5rem',
          borderRadius: '4px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)',
          animation: 'fadeIn 0.4s ease-out'
        }}
      >
        {/* Futuristic Corner Brackets */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', width: '15px', height: '15px', borderTop: '2px solid rgba(255, 255, 255, 0.25)', borderLeft: '2px solid rgba(255, 255, 255, 0.25)' }} />
        <div style={{ position: 'absolute', top: '10px', right: '10px', width: '15px', height: '15px', borderTop: '2px solid rgba(255, 255, 255, 0.25)', borderRight: '2px solid rgba(255, 255, 255, 0.25)' }} />
        <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '15px', height: '15px', borderBottom: '2px solid rgba(255, 255, 255, 0.25)', borderLeft: '2px solid rgba(255, 255, 255, 0.25)' }} />
        <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '15px', height: '15px', borderBottom: '2px solid rgba(255, 255, 255, 0.25)', borderRight: '2px solid rgba(255, 255, 255, 0.25)' }} />

        <style>{`
          .info-title {
            font-family: 'Outfit', sans-serif;
            font-size: 1.1rem;
            font-weight: 700;
            letter-spacing: 4px;
            text-transform: uppercase;
            margin-bottom: 1.5rem;
            color: #ffffff;
            text-align: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            padding-bottom: 0.8rem;
          }
          .info-scroll-box {
            max-height: 280px;
            overflow-y: auto;
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE 10+ */
            padding-right: 0.2rem;
          }
          .info-scroll-box::-webkit-scrollbar {
            display: none; /* Safari/Chrome */
          }
          .info-section {
            margin-bottom: 1.2rem;
          }
          .info-section-title {
            font-family: 'Outfit', sans-serif;
            font-size: 0.82rem;
            font-weight: 600;
            color: #e2e8f0;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin-bottom: 0.4rem;
          }
          .info-text {
            font-family: 'Outfit', sans-serif;
            font-size: 0.82rem;
            line-height: 1.6;
            color: #a2a6b8;
            text-align: left;
            margin: 0;
            font-weight: 300;
          }
          .hotkey-badge {
            background: rgba(255, 255, 255, 0.08);
            color: #ffffff;
            padding: 0.1rem 0.35rem;
            border-radius: 3px;
            font-family: 'Outfit', sans-serif;
            font-weight: 500;
            font-size: 0.76rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          @media (max-width: 480px) {
            .glass-panel {
              padding: 1.5rem !important;
            }
            .info-title {
              font-size: 1rem !important;
              margin-bottom: 1rem !important;
            }
            .info-section-title {
              font-size: 0.76rem !important;
            }
            .info-text {
              font-size: 0.78rem !important;
            }
          }
        `}</style>
        
        <div className="info-title">FLIGHT MANUAL</div>
        
        <div className="info-scroll-box">
          <div className="info-section">
            <div className="info-section-title">Target Synchronization</div>
            <p className="info-text">
              Type the letters displayed under approaching imperial fighters to engage target locks. Precise keystrokes advance targeting matrices and charge defensive grids.
            </p>
          </div>

          <div className="info-section">
            <div className="info-section-title">Tactical Skills</div>
            <p className="info-text">
              Configure and carry 3 modular skills:
              <br />
              • Slot 1 Trigger Key: <span className="hotkey-badge">1</span>
              <br />
              • Slot 2 Trigger Key: <span className="hotkey-badge">2</span>
              <br />
              • Slot 3 Trigger Key: <span className="hotkey-badge">3</span>
              <br />
              Each skill consumes a portion of the tactical charge meter, which accumulates as you type words without mistakes.
            </p>
          </div>

          <div className="info-section">
            <div className="info-section-title">Defensive Boss Shield</div>
            <p className="info-text">
              Destroying command dreadnoughts rewards you with stored shield cores. Press <span className="hotkey-badge">5</span> or <span className="hotkey-badge">7</span> to activate a sky-blue energy barrier that absorbs up to 3 typographical mistakes or bullet impacts for 8 seconds.
            </p>
          </div>

          <div className="info-section">
            <div className="info-section-title">Parallax Station Docking</div>
            <p className="info-text">
              Every 5 waves, fighters dock at structural solar yards. Access the hanger bay here to realign equipped skill items and customize ship hull colors.
            </p>
          </div>

          <div className="info-section">
            <div className="info-section-title">System Interfacing</div>
            <p className="info-text">
              This simulator requires a physical keyboard linkage to align defense grids. Touch-screen interfaces are locked. Keep combo multipliers active for final score amplification.
            </p>
          </div>

          {/* Copyright & Designer credits (clean non-boxy Outfit font) */}
          <div className="info-section" style={{ marginTop: '1.5rem', borderTop: '1px dashed rgba(255, 255, 255, 0.05)', paddingTop: '0.8rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', fontFamily: "'Outfit', sans-serif", color: 'rgba(255, 255, 255, 0.3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.2rem', fontWeight: 500 }}>
              © 2026 Kaizzcer. All rights reserved.
            </div>
            <p style={{ fontStyle: 'italic', fontSize: '0.72rem', fontFamily: "'Outfit', sans-serif", color: 'rgba(255, 255, 255, 0.4)', margin: 0, fontWeight: 300 }}>
              " just a guy who wanted to play while typing practice... "
            </p>
          </div>
        </div>

        <style>{`
          .btn-acknowledge-manual {
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
          .btn-acknowledge-manual:hover {
            border-color: #ffffff;
            background: rgba(255, 255, 255, 0.05);
            color: #ffffff;
            text-shadow: 0 0 8px rgba(255, 255, 255, 0.45);
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.22);
            letter-spacing: 3px;
          }
        `}</style>

        <div style={{ display: 'flex', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '1.2rem', paddingTop: '1.2rem' }}>
          <button 
            className="btn-acknowledge-manual" 
            onClick={handleClose}
          >
            Acknowledge Manual
          </button>
        </div>
      </div>
    </div>
  );
}
