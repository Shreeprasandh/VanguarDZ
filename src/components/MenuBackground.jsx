import React, { useEffect, useRef } from 'react';

export default function MenuBackground({ shipColor = 'blue' }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const trailHistory = useRef([]); // Stores last mouse positions

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Set initial canvas dimensions to match window viewport on mount.
    // This prevents the first handleResize execution from scaling coordinates out of bounds.
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const nodes = [];
    const nodeCount = 130;
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 0.8 + Math.random() * 1.2,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        baseAlpha: 0.05 + Math.random() * 0.12,
        alpha: 0,
        twinkleSpeed: 0.003 + Math.random() * 0.007,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Static background objects with custom opacities to indicate distance
    const bgObjects = [
      // 1. Planet (Left top) - Close/Bright
      {
        type: 'planet',
        x: window.innerWidth * 0.15,
        y: window.innerHeight * 0.25,
        radius: 50,
        vx: 0.015,
        vy: -0.008,
        opacity: 0.13
      },
      // 2. Orbital Satellite (Right top) - Mid
      {
        type: 'satellite',
        x: window.innerWidth * 0.82,
        y: window.innerHeight * 0.3,
        size: 65,
        vx: -0.01,
        vy: 0.01,
        opacity: 0.08
      },
      // 3. Cratered Asteroid (Mid top) - Far/Faint
      {
        type: 'asteroid',
        x: window.innerWidth * 0.72,
        y: window.innerHeight * 0.15,
        radius: 24,
        offsets: [6, -3, 8, 2, -5, 9, -7, -1],
        vx: 0.02,
        vy: 0.015,
        opacity: 0.05
      },
      // 4. Space Observatory Telescope (Left mid-bottom) - Mechanical structure (replaces old human-like wreckage)
      {
        type: 'telescope',
        x: window.innerWidth * 0.2,
        y: window.innerHeight * 0.65,
        size: 70,
        vx: -0.008,
        vy: -0.008,
        opacity: 0.12
      },
      // 5. Orbiting Solar System (Mid Bottom-Right) - Stationary to remain fully visible
      {
        type: 'solar',
        x: window.innerWidth * 0.62,
        y: window.innerHeight * 0.85,
        sunRadius: 16,
        orbitRadius: 60,
        orbitAngle: 0,
        orbitSpeed: 0.0008,
        vx: 0,
        vy: 0,
        opacity: 0.07
      },
      // 6. Communications Radar Array (Bottom Left) - Mid
      {
        type: 'comms_dish',
        x: window.innerWidth * 0.08,
        y: window.innerHeight * 0.85,
        size: 45,
        vx: 0.012,
        vy: -0.006,
        opacity: 0.08
      },
      // 7. Fighter Wing Debris (Bottom Right) - Close
      {
        type: 'wing_scrap',
        x: window.innerWidth * 0.82,
        y: window.innerHeight * 0.75,
        size: 50,
        vx: -0.015,
        vy: 0.008,
        opacity: 0.11
      },
      // 8. Distant Double Asteroids (Mid Left-Bottom) - Far
      {
        type: 'double_asteroid',
        x: window.innerWidth * 0.35,
        y: window.innerHeight * 0.88,
        radius: 12,
        vx: 0.008,
        vy: 0.012,
        opacity: 0.06
      },
      // 9. Detailed Ringed Planet (Mid Bottom-Left) - Close
      {
        type: 'ringed_planet',
        x: window.innerWidth * 0.22,
        y: window.innerHeight * 0.85,
        radius: 20,
        vx: 0.005,
        vy: -0.003,
        opacity: 0.10
      },
      // 10. Weather Satellite (Bottom Right Corner) - Mid
      {
        type: 'weather_satellite',
        x: window.innerWidth * 0.88,
        y: window.innerHeight * 0.86,
        size: 30,
        vx: -0.004,
        vy: 0.005,
        opacity: 0.09
      },
      // 11. Small Planet (Right Center) - Close
      {
        type: 'small_planet',
        x: window.innerWidth * 0.85,
        y: window.innerHeight * 0.5,
        radius: 14,
        vx: -0.005,
        vy: -0.005,
        opacity: 0.09
      }
    ];

    const handleResize = () => {
      const oldWidth = canvas.width;
      const oldHeight = canvas.height;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const newWidth = canvas.width;
      const newHeight = canvas.height;

      if (oldWidth > 0 && oldHeight > 0) {
        nodes.forEach(node => {
          node.x = (node.x / oldWidth) * newWidth;
          node.y = (node.y / oldHeight) * newHeight;
        });

        bgObjects.forEach(obj => {
          obj.x = (obj.x / oldWidth) * newWidth;
          obj.y = (obj.y / oldHeight) * newHeight;
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleResize);
    document.addEventListener('webkitfullscreenchange', handleResize);

    const trailParticles = [];

    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
      
      // Save trail history
      trailHistory.current.push({
        x: e.clientX,
        y: e.clientY
      });
      if (trailHistory.current.length > 20) {
        trailHistory.current.shift();
      }

      // Spawn trail spark particles
      for (let p = 0; p < 2; p++) {
        trailParticles.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 1.4,
          vy: (Math.random() - 0.5) * 1.4,
          size: 1.0 + Math.random() * 2.5,
          life: 35,
          maxLife: 35
        });
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Grid warping calculations
    const getWarpedPoint = (x, y, mx, my, mActive) => {
      if (!mActive) return { x, y };
      const dx = x - mx;
      const dy = y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const warpRadius = 200;
      
      if (dist < warpRadius) {
        const force = Math.pow((warpRadius - dist) / warpRadius, 2) * 12;
        const angle = Math.atan2(dy, dx);
        return {
          x: x + Math.cos(angle) * force,
          y: y + Math.sin(angle) * force
        };
      }
      return { x, y };
    };

    let animId;
    const render = () => {
      // Pure black canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mouse = mouseRef.current;
      
      const getShipColorStyle = (colorName) => {
        if (colorName === 'red') return { rgb: '207, 64, 66', hex: '#cf4042' };
        if (colorName === 'green') return { rgb: '46, 189, 89', hex: '#2ebd59' };
        return { rgb: '74, 144, 226', hex: '#4a90e2' }; // blue
      };
      const themeStyle = getShipColorStyle(shipColor);

      // Draw Warped Minimal Grid (1.2% transparency - extremely subtle)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.009)';
      ctx.lineWidth = 0.8;
      const gridSize = 120;
      
      // Draw vertical grid lines
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        for (let y = 0; y < canvas.height; y += 20) {
          const pt = getWarpedPoint(x, y, mouse.x, mouse.y, mouse.active);
          if (y === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }
      
      // Draw horizontal grid lines
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 20) {
          const pt = getWarpedPoint(x, y, mouse.x, mouse.y, mouse.active);
          if (x === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      // Draw background scenery objects with custom opacities to indicate distance
      bgObjects.forEach(obj => {
        obj.x += obj.vx;
        obj.y += obj.vy;

        // Keep objects strictly bounded within the safe margins of the viewport (no edge cut-offs!)
        const sizeVal = obj.radius || obj.size || 50;
        const marginX = sizeVal + 15;
        const marginY = sizeVal + 15;

        if (obj.x < marginX) {
          obj.x = marginX;
          obj.vx = Math.abs(obj.vx || 0.005); // bounce right
        } else if (obj.x > canvas.width - marginX) {
          obj.x = canvas.width - marginX;
          obj.vx = -Math.abs(obj.vx || 0.005); // bounce left
        }

        if (obj.y < marginY) {
          obj.y = marginY;
          obj.vy = Math.abs(obj.vy || 0.005); // bounce down
        } else if (obj.y > canvas.height - marginY) {
          obj.y = canvas.height - marginY;
          obj.vy = -Math.abs(obj.vy || 0.005); // bounce up
        }

        ctx.save();
        const baseOpacity = obj.opacity || 0.08;
        ctx.strokeStyle = `rgba(255, 255, 255, ${baseOpacity})`;
        ctx.lineWidth = 1.0;

        if (obj.type === 'planet') {
          // Planet circle
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
          ctx.stroke();
          
          // Layered diagonal rings
          ctx.beginPath();
          ctx.ellipse(obj.x, obj.y, obj.radius * 1.6, obj.radius * 0.3, Math.PI / 6, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(obj.x, obj.y, obj.radius * 1.45, obj.radius * 0.25, Math.PI / 6, 0, Math.PI * 2);
          ctx.stroke();

          // Internal Craters
          ctx.beginPath();
          ctx.arc(obj.x - 15, obj.y - 10, 6, 0, Math.PI * 2);
          ctx.arc(obj.x + 10, obj.y + 15, 8, 0, Math.PI * 2);
          ctx.arc(obj.x - 5, obj.y + 20, 4, 0, Math.PI * 2);
          ctx.stroke();
          
          // Planet surface crescent shadow curve
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, obj.radius - 2, -Math.PI / 3, Math.PI / 2);
          ctx.stroke();
        } else if (obj.type === 'satellite') {
          // Central satellite core cylinder
          ctx.beginPath();
          ctx.rect(obj.x - 6, obj.y - 12, 12, 24);
          ctx.stroke();
          // Satellite wing supports
          ctx.beginPath();
          ctx.moveTo(obj.x - 6, obj.y); ctx.lineTo(obj.x - 14, obj.y);
          ctx.moveTo(obj.x + 6, obj.y); ctx.lineTo(obj.x + 14, obj.y);
          ctx.stroke();
          // Solar array grids left and right
          ctx.beginPath();
          ctx.rect(obj.x - 30, obj.y - 8, 16, 16);
          ctx.rect(obj.x + 14, obj.y - 8, 16, 16);
          ctx.stroke();
          // Grid lines inside arrays
          ctx.beginPath();
          ctx.moveTo(obj.x - 22, obj.y - 8); ctx.lineTo(obj.x - 22, obj.y + 8);
          ctx.moveTo(obj.x + 22, obj.y - 8); ctx.lineTo(obj.x + 22, obj.y + 8);
          ctx.moveTo(obj.x - 30, obj.y); ctx.lineTo(obj.x - 14, obj.y);
          ctx.moveTo(obj.x + 14, obj.y); ctx.lineTo(obj.x + 30, obj.y);
          ctx.stroke();
          // Communication antenna dish on top
          ctx.beginPath();
          ctx.arc(obj.x, obj.y - 15, 5, 0, Math.PI, true);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(obj.x, obj.y - 15); ctx.lineTo(obj.x, obj.y - 20);
          ctx.stroke();
        } else if (obj.type === 'comms_dish') {
          // Ground support base truss
          ctx.beginPath();
          ctx.moveTo(obj.x - 10, obj.y + 14);
          ctx.lineTo(obj.x, obj.y + 2);
          ctx.lineTo(obj.x + 10, obj.y + 14);
          ctx.stroke();
          // Curved parabolic dish outline
          ctx.beginPath();
          ctx.arc(obj.x, obj.y - 4, 12, -Math.PI * 0.85, -Math.PI * 0.15);
          ctx.stroke();
          // Feed horn spike
          ctx.beginPath();
          ctx.moveTo(obj.x, obj.y - 12);
          ctx.lineTo(obj.x, obj.y - 20);
          ctx.stroke();
          // Small glowing beam receiver point
          ctx.beginPath();
          ctx.arc(obj.x, obj.y - 20, 1.5, 0, Math.PI * 2);
          ctx.stroke();
        } else if (obj.type === 'wing_scrap') {
          // Sharp delta wing panel debris
          ctx.beginPath();
          ctx.moveTo(obj.x - 15, obj.y - 15);
          ctx.lineTo(obj.x + 15, obj.y - 5);
          ctx.lineTo(obj.x - 5, obj.y + 15);
          ctx.closePath();
          ctx.stroke();
          // Interior panel lines
          ctx.beginPath();
          ctx.moveTo(obj.x - 10, obj.y - 10);
          ctx.lineTo(obj.x - 3, obj.y + 5);
          ctx.stroke();
          // Exposed wiring/cables hanging
          ctx.beginPath();
          ctx.moveTo(obj.x - 15, obj.y - 15);
          ctx.bezierCurveTo(obj.x - 25, obj.y - 12, obj.x - 20, obj.y - 2, obj.x - 22, obj.y + 5);
          ctx.stroke();
        } else if (obj.type === 'double_asteroid') {
          // Large rocky asteroid
          ctx.beginPath();
          ctx.arc(obj.x - 6, obj.y, 7, 0, Math.PI * 2);
          ctx.stroke();
          // Internal crater lines
          ctx.beginPath();
          ctx.arc(obj.x - 8, obj.y - 2, 1.5, 0, Math.PI * 2);
          ctx.stroke();
          // Small companion rock drifting nearby
          ctx.beginPath();
          ctx.arc(obj.x + 8, obj.y + 6, 3.5, 0, Math.PI * 2);
          ctx.stroke();
        } else if (obj.type === 'asteroid') {
          // Irregular rock silhouette
          ctx.beginPath();
          obj.offsets.forEach((off, idx) => {
            const angle = (idx / obj.offsets.length) * Math.PI * 2;
            const r = obj.radius + off;
            const rx = obj.x + Math.cos(angle) * r;
            const ry = obj.y + Math.sin(angle) * r;
            if (idx === 0) ctx.moveTo(rx, ry);
            else ctx.lineTo(rx, ry);
          });
          ctx.closePath();
          ctx.stroke();

          // Surface cracks
          ctx.beginPath();
          ctx.moveTo(obj.x - 8, obj.y - 8);
          ctx.lineTo(obj.x, obj.y - 2);
          ctx.lineTo(obj.x + 6, obj.y - 10);
          ctx.moveTo(obj.x - 12, obj.y + 2);
          ctx.lineTo(obj.x - 5, obj.y + 6);
          ctx.stroke();
          
          // Internal crater
          ctx.beginPath();
          ctx.arc(obj.x + 5, obj.y + 4, 3, 0, Math.PI * 2);
          ctx.stroke();
        } else if (obj.type === 'telescope') {
          // Telescope main cylinder tube
          ctx.beginPath();
          ctx.rect(obj.x - 10, obj.y - 20, 20, 40);
          ctx.stroke();
          // Diagonal solar array panel wings
          ctx.beginPath();
          ctx.rect(obj.x - 30, obj.y - 4, 20, 8);
          ctx.rect(obj.x + 10, obj.y - 4, 20, 8);
          ctx.stroke();
          // Support joints
          ctx.beginPath();
          ctx.moveTo(obj.x, obj.y + 20);
          ctx.lineTo(obj.x - 8, obj.y + 32);
          ctx.lineTo(obj.x + 8, obj.y + 32);
          ctx.stroke();
          // Front open lens cap ring
          ctx.beginPath();
          ctx.ellipse(obj.x, obj.y - 20, 10, 3, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (obj.type === 'ringed_planet') {
          // Central sphere
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, obj.radius || 20, 0, Math.PI * 2);
          ctx.stroke();
          // Planet rings
          ctx.beginPath();
          ctx.ellipse(obj.x, obj.y, (obj.radius || 20) * 1.8, (obj.radius || 20) * 0.45, Math.PI / 8, 0, Math.PI * 2);
          ctx.stroke();
          // Shadow surface crescent
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, (obj.radius || 20) - 2, Math.PI * 0.1, Math.PI * 0.9);
          ctx.stroke();
        } else if (obj.type === 'weather_satellite') {
          // Diamond body core
          ctx.beginPath();
          ctx.moveTo(obj.x, obj.y - 12);
          ctx.lineTo(obj.x + 12, obj.y);
          ctx.lineTo(obj.x, obj.y + 12);
          ctx.lineTo(obj.x - 12, obj.y);
          ctx.closePath();
          ctx.stroke();
          // Solar panels
          ctx.beginPath();
          ctx.rect(obj.x - 26, obj.y - 3, 14, 6);
          ctx.rect(obj.x + 12, obj.y - 3, 14, 6);
          ctx.stroke();
          // Bottom antenna dish
          ctx.beginPath();
          ctx.arc(obj.x, obj.y + 12, 4, 0, Math.PI);
          ctx.stroke();
        } else if (obj.type === 'small_planet') {
          // Small sphere
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, obj.radius || 12, 0, Math.PI * 2);
          ctx.stroke();
          // Diagonal shaded lines
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, (obj.radius || 12) - 2.5, Math.PI * 0.25, Math.PI * 0.95);
          ctx.stroke();
          // Small surface crater
          ctx.beginPath();
          ctx.arc(obj.x - 3, obj.y - 3, 2, 0, Math.PI * 2);
          ctx.stroke();
        } else if (obj.type === 'wreckage') {
          // Swept wing panels
          ctx.beginPath();
          ctx.moveTo(obj.x - 20, obj.y - 10);
          ctx.lineTo(obj.x + 20, obj.y - 15);
          ctx.lineTo(obj.x + 5, obj.y + 15);
          ctx.closePath();
          ctx.stroke();
        } else if (obj.type === 'solar') {
          // Center sun
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, obj.sunRadius, 0, Math.PI * 2);
          ctx.stroke();
          // Radiating solar flares
          for (let f = 0; f < 8; f++) {
            const angle = (f / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(obj.x + Math.cos(angle) * obj.sunRadius, obj.y + Math.sin(angle) * obj.sunRadius);
            ctx.lineTo(obj.x + Math.cos(angle) * (obj.sunRadius + 4), obj.y + Math.sin(angle) * (obj.sunRadius + 4));
            ctx.stroke();
          }

          // Orbit line
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, obj.orbitRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${baseOpacity * 0.25})`;
          ctx.stroke();

          // Orbiting planet node
          obj.orbitAngle += obj.orbitSpeed;
          const px = obj.x + Math.cos(obj.orbitAngle) * obj.orbitRadius;
          const py = obj.y + Math.sin(obj.orbitAngle) * obj.orbitRadius;
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${baseOpacity * 1.5})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(255, 255, 255, ${baseOpacity * 2.0})`;
          ctx.stroke();
        }

        ctx.restore();
      });

      // Draw Constellation Nodes and connections
      nodes.forEach((node, idx) => {
        node.x += node.vx;
        node.y += node.vy;

        // Wrap edges
        if (node.x < 0) node.x = canvas.width;
        if (node.x > canvas.width) node.x = 0;
        if (node.y < 0) node.y = canvas.height;
        if (node.y > canvas.height) node.y = 0;

        node.phase += node.twinkleSpeed;
        node.alpha = node.baseAlpha + Math.sin(node.phase) * 0.08;

        // Draw connections to nearby nodes
        for (let j = idx + 1; j < nodes.length; j++) {
          const target = nodes[j];
          const dx = node.x - target.x;
          const dy = node.y - target.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 140) {
            const connAlpha = (1 - dist / 140) * 0.03;
            ctx.strokeStyle = `rgba(255, 255, 255, ${connAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
          }
        }

        // Draw node
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.01, node.alpha)})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update and draw trail spark particles (glowing with ship color theme)
      for (let i = trailParticles.length - 1; i >= 0; i--) {
        const p = trailParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) {
          trailParticles.splice(i, 1);
        } else {
          ctx.save();
          const alpha = (p.life / p.maxLife) * 0.32; // slightly reduced transparency (made more solid)
          ctx.fillStyle = `rgba(${themeStyle.rgb}, ${alpha})`;
          ctx.shadowBlur = 4;
          ctx.shadowColor = themeStyle.hex;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Draw glowing double-ribbon mouse trail (with ship color theme and reduced transparency)
      const history = trailHistory.current;
      if (mouse.active && history.length > 1) {
        ctx.save();
        ctx.shadowBlur = 6;
        ctx.shadowColor = themeStyle.hex;
        
        for (let i = 1; i < history.length; i++) {
          const ptStart = history[i - 1];
          const ptEnd = history[i];
          
          // Width decreases towards the beginning of the history array (the tail)
          const taperWidth = 0.4 + (i / history.length) * 3.5; 
          // Opacity increases towards the current mouse position (the head)
          const stepAlpha = (i / history.length) * 0.28; // reduced transparency (from 0.15 to 0.28)
          
          ctx.beginPath();
          ctx.moveTo(ptStart.x, ptStart.y);
          ctx.lineTo(ptEnd.x, ptEnd.y);
          ctx.strokeStyle = `rgba(${themeStyle.rgb}, ${stepAlpha})`;
          ctx.lineWidth = taperWidth;
          ctx.stroke();

          // Outer secondary sub-glow ribbon
          ctx.beginPath();
          ctx.moveTo(ptStart.x + 2, ptStart.y - 2);
          ctx.lineTo(ptEnd.x + 2, ptEnd.y - 2);
          ctx.strokeStyle = `rgba(${themeStyle.rgb}, ${stepAlpha * 0.45})`;
          ctx.lineWidth = taperWidth * 0.5;
          ctx.stroke();
        }
        ctx.restore();

        // Draw modern crosshair concentric ring around cursor (reduced transparency)
        ctx.save();
        ctx.translate(mouse.x, mouse.y);
        ctx.strokeStyle = `rgba(${themeStyle.rgb}, 0.12)`; // slightly reduced transparency (made more solid)
        ctx.lineWidth = 1.0;
        // Inner circle
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.stroke();
        
        // Faint outer cursor cross lines
        ctx.beginPath();
        ctx.moveTo(-20, 0); ctx.lineTo(-12, 0);
        ctx.moveTo(12, 0); ctx.lineTo(20, 0);
        ctx.moveTo(0, -20); ctx.lineTo(0, -12);
        ctx.moveTo(0, 12); ctx.lineTo(0, 20);
        ctx.stroke();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleResize);
      document.removeEventListener('webkitfullscreenchange', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, [shipColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none'
      }}
    />
  );
}
