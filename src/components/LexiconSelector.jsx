import React, { useState, useEffect, useRef } from 'react';
import { GameAudio } from '../game/audio';
import { LEXICON_PACKS, getLexiconPack } from '../game/lexicons';

export default function LexiconSelector({ 
  activeLexicon = 'english', 
  shipColor, 
  onSelectLexicon 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const currentPack = getLexiconPack(activeLexicon);

  // Harmonize indicator dot color directly with pilot's ship color
  const resolvedShipColor = shipColor || (typeof window !== 'undefined' ? localStorage.getItem('cybertype_color') : null) || 'blue';
  const getShipDotColor = (color) => {
    switch (color) {
      case 'red':
        return '#cf4042'; // Muted Crimson
      case 'green':
        return '#2ebd59'; // Sage Emerald
      case 'purple':
        return '#8b5cf6'; // Indigo/Lavender
      case 'blue':
      default:
        return '#4a90e2'; // Sleek Slate Blue
    }
  };
  const dotColor = getShipDotColor(resolvedShipColor);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    GameAudio.play('click');
    setIsOpen(prev => !prev);
  };

  const handleSelect = (packId) => {
    GameAudio.play('click');
    if (onSelectLexicon) {
      onSelectLexicon(packId);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: isOpen ? 0.75 : 0.45,
          background: isOpen ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '4px',
          padding: '6px 10px',
          color: '#e2e8f0',
          fontFamily: "'Orbitron', monospace, sans-serif",
          fontSize: '11px',
          letterSpacing: '0.8px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
          userSelect: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.80';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = isOpen ? '0.75' : '0.45';
          e.currentTarget.style.background = isOpen ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        }}
      >
        <span style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: '9px', fontWeight: 600 }}>
          MODE:
        </span>
        <span style={{ fontWeight: 600, color: '#f8fafc' }}>
          {currentPack.label.toUpperCase()}
        </span>
        <svg 
          width="10" 
          height="10" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
            opacity: 0.45
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Floating Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: '200px',
            background: 'rgba(8, 10, 16, 0.61)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            borderRadius: '6px',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.45)',
            padding: '6px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          {LEXICON_PACKS.map((pack) => {
            const isSelected = pack.id === activeLexicon;
            return (
              <button
                key={pack.id}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(pack.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  border: isSelected ? '1px solid rgba(255, 255, 255, 0.10)' : '1px solid transparent',
                  borderRadius: '4px',
                  color: isSelected ? '#ffffff' : 'rgba(203, 213, 225, 0.75)',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.12s ease',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, letterSpacing: '0.2px' }}>
                    {pack.label}
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.28)', marginTop: '1px' }}>
                    {pack.description}
                  </div>
                </div>

                {isSelected && (
                  <span 
                    style={{ 
                      width: '5px', 
                      height: '5px', 
                      borderRadius: '50%', 
                      background: dotColor,
                      marginLeft: '8px',
                      opacity: 0.85
                    }} 
                  />
                )}
              </button>
            );
          })}

          {/* Subtle Solo Mode Note */}
          <div
            style={{
              paddingTop: '6px',
              marginTop: '4px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: '9px',
              color: 'rgba(255, 255, 255, 0.23)',
              fontFamily: "'Orbitron', monospace, sans-serif",
              letterSpacing: '0.6px',
              textAlign: 'center',
              textTransform: 'uppercase'
            }}
          >
            * applies to solo mode only
          </div>
        </div>
      )}
    </div>
  );
}
