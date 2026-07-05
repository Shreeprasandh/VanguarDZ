import React from 'react';

export default function GameHUD({ score, multiplier, wave, isMultiplayer, teamPlayers, health = 100 }) {
  return (
    <div className="hud-container">
      <div className="hud-top">
        {/* Left Side: Score & Multiplier */}
        <div className="hud-group" style={{ opacity: 0.75 }}>
          <span className="hud-label">Score</span>
          <span className="hud-value" style={{ color: 'var(--neon-blue)', textShadow: 'var(--shadow-blue)' }}>
            {score.toLocaleString()}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.2rem' }}>
            <span className="hud-label" style={{ marginRight: '0.4rem' }}>Multiplier</span>
            <span className="hud-value" style={{ fontSize: '1.1rem', color: multiplier > 1 ? 'var(--neon-yellow)' : 'var(--text-primary)' }}>
              x{multiplier}
            </span>
          </div>
        </div>

        {/* Right Side: Wave & Health Bar */}
        <div className="hud-group" style={{ alignItems: 'flex-end', gap: '0.4rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', opacity: 0.75 }}>
            <span className="hud-label">Wave</span>
            <span className="hud-value" style={{ fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>
              {wave}
            </span>
          </div>

          {/* Vertical Health Bar (white color, 50% transparency) */}
          {(() => {
            const safeHealth = (typeof health === 'number' && !isNaN(health)) ? health : 100;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', marginTop: '1.6rem' }}>
                <div 
                  style={{
                    width: '8px',
                    height: '112px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '4px',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: 0.95,
                    boxShadow: '0 0 6px rgba(255, 255, 255, 0.1)'
                  }}
                  title={`Ship Integrity: ${Math.round(safeHealth)}%`}
                >
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '100%',
                      height: `${Math.max(0, Math.min(100, safeHealth))}%`,
                      background: 'rgba(255, 255, 255, 0.5)',
                      transition: 'height 0.15s ease'
                    }}
                  />
                </div>
                <span 
                  style={{ 
                    fontSize: '8px', 
                    fontFamily: 'var(--font-display)', 
                    color: '#ffffff', 
                    letterSpacing: '0.5px',
                    opacity: 0.5,
                    fontWeight: 'normal',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {Math.max(0, Math.round(safeHealth))}%
                </span>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Bottom Side: Team Stats (Only in co-op mode) */}
      {isMultiplayer && teamPlayers && teamPlayers.length > 0 && (
        <div className="multi-player-health-bars">
          <span className="hud-label" style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Teammates</span>
          {teamPlayers.map((player) => {
            const health = player.health !== undefined ? player.health : 100;
            return (
              <div key={player.socketId} className="teammate-health-row">
                <span className="teammate-name" style={{ color: `var(--neon-${player.color})` }}>
                  {player.username}
                </span>
                <div className="health-bar-container">
                  <div 
                    className={`health-bar-fill ${player.color}`} 
                    style={{ width: `${Math.max(0, health)}%` }}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem', fontFamily: 'var(--font-display)', width: '35px', textAlign: 'right' }}>
                  {Math.max(0, Math.round(health))}%
                </span>
                <span style={{ fontSize: '0.75rem', marginLeft: '0.8rem', color: 'var(--neon-blue)', width: '60px', textAlign: 'right' }}>
                  {player.score.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
