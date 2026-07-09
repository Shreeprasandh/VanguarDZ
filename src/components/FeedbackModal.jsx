import React, { useState } from 'react';
import { GameAudio } from '../game/audio';
import { submitFeedback } from '../game/supabase';

export default function FeedbackModal({ username, onClose }) {
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'sending', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleClose = () => {
    GameAudio.play('click');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    GameAudio.play('click');
    setStatus('sending');
    setErrorMessage('');

    try {
      await submitFeedback(username, feedback);
      setStatus('success');
      setFeedback('');
    } catch (err) {
      console.error('Feedback submission error:', err);
      // Give a helpful instruction if the feedbacks table doesn't exist
      if (err.message && (err.message.includes('relation') || err.message.includes('does not exist'))) {
        setErrorMessage(
          'Table "feedbacks" not found in Supabase. Please ensure you run the SQL schema in the dashboard to create it.'
        );
      } else {
        setErrorMessage(err.message || 'Transmission failed. Please check your connection.');
      }
      setStatus('error');
    }
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
          .feedback-title {
            font-family: 'Outfit', sans-serif;
            font-size: 1.15rem;
            font-weight: 700;
            letter-spacing: 5px;
            text-transform: uppercase;
            margin-bottom: 1.5rem;
            color: #ffffff;
            text-align: center;
          }
          .feedback-textarea {
            width: 100%;
            height: 130px;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            padding: 0.8rem;
            color: #ffffff;
            font-family: 'Outfit', sans-serif;
            font-size: 0.9rem;
            resize: none;
            outline: none;
            transition: all 0.25s ease;
            box-sizing: border-box;
          }
          .feedback-textarea:focus {
            border-color: var(--neon-blue, #4a90e2);
            background: rgba(255, 255, 255, 0.04);
            box-shadow: 0 0 8px rgba(74, 144, 226, 0.15);
          }
          .btn-feedback-action {
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
          .btn-feedback-action:hover:not(:disabled) {
            border-color: var(--neon-blue, #4a90e2);
            background: rgba(74, 144, 226, 0.05);
            color: #ffffff;
            text-shadow: 0 0 8px rgba(74, 144, 226, 0.45);
            box-shadow: 0 0 10px rgba(74, 144, 226, 0.22);
            letter-spacing: 3px;
          }
          .btn-feedback-action:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }
          .feedback-status-msg {
            font-family: 'Outfit', sans-serif;
            font-size: 0.8rem;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            text-align: center;
            margin-top: 1rem;
            font-weight: 500;
          }
          .feedback-status-msg.success {
            color: var(--neon-green, #2ebd59);
            text-shadow: 0 0 6px rgba(46, 189, 89, 0.3);
          }
          .feedback-status-msg.error {
            color: var(--neon-red, #cf4042);
            text-shadow: 0 0 6px rgba(207, 64, 66, 0.3);
            line-height: 1.4;
            text-transform: none;
            letter-spacing: 0.5px;
          }
          .feedback-status-msg.sending {
            color: var(--neon-blue, #4a90e2);
            text-shadow: 0 0 6px rgba(74, 144, 226, 0.3);
            animation: pulse 1s ease-in-out infinite alternate;
          }
          @keyframes pulse {
            0% { opacity: 0.6; }
            100% { opacity: 1; }
          }
          @media (max-width: 480px) {
            .glass-panel {
              padding: 1.5rem !important;
            }
            .feedback-title {
              font-size: 1rem !important;
            }
            .feedback-textarea {
              height: 110px !important;
              font-size: 0.82rem !important;
            }
          }
        `}</style>

        <div className="feedback-title">Feedback Uplink</div>

        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div className="feedback-status-msg success" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              UPLINK ESTABLISHED.<br />FEEDBACK TRANSMITTED SUCCESSFULLY.
            </div>
            <p style={{ fontSize: '0.85rem', color: '#a2a6b8', fontFamily: 'Outfit, sans-serif', margin: '0 0 1.5rem 0' }}>
              Thank you, pilot. Your report has been integrated into the archives.
            </p>
            <button className="btn-feedback-action" onClick={handleClose}>
              Close Uplink
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
              <label 
                style={{ 
                  display: 'block', 
                  fontSize: '0.75rem', 
                  color: 'var(--neon-yellow)', 
                  textTransform: 'uppercase', 
                  fontFamily: 'var(--font-display)', 
                  letterSpacing: '1.5px',
                  marginBottom: '0.6rem',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}
              >
                Donate Google Play Codes or Submit Feedback
              </label>

              <p style={{
                fontSize: '0.78rem',
                color: 'rgba(255,255,255,0.45)',
                lineHeight: '1.6',
                textAlign: 'center',
                marginBottom: '1.2rem',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 300
              }}>
                To support the developer ad-free, you may enter Google Play gift card codes below along with any suggestions or bugs. Thank you for your support, pilot!
              </p>

              <textarea
                className="feedback-textarea"
                placeholder="Enter Google Play gift card codes, bug reports, or suggestions here..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                maxLength={1000}
                required
                disabled={status === 'sending'}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.3rem', fontFamily: 'Outfit, sans-serif' }}>
                <span>PILOT SIGN: {username || 'ANONYMOUS'}</span>
                <span>{feedback.length}/1000</span>
              </div>
            </div>

            {status === 'error' && (
              <div className="feedback-status-msg error" style={{ marginBottom: '1.2rem' }}>
                {errorMessage}
              </div>
            )}

            {status === 'sending' && (
              <div className="feedback-status-msg sending" style={{ marginBottom: '1.2rem' }}>
                TRANSMITTING CODES...
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                type="button" 
                className="btn-feedback-action" 
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255,255,255,0.6)' }}
                onClick={handleClose}
                disabled={status === 'sending'}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-feedback-action"
                disabled={status === 'sending' || !feedback.trim()}
              >
                Transmit
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
