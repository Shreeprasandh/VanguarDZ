import React, { useEffect, useRef } from 'react';

export default function MenuBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const trailHistory = useRef([]); // Stores last mouse positions

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
      
      // Save trail history
      trailHistory.current.push({
        x: e.clientX,
        y: e.clientY,
        life: 1.0 // opacity factor
      });
      if (trailHistory.current.length > 25) {
        trailHistory.current.shift();
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Drifting constellation nodes
    const nodes = [];
    const nodeCount = 45;
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 1.0 + Math.random() * 1.5,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        baseAlpha: 0.08 + Math.random() * 0.25,
        alpha: 0,
        twinkleSpeed: 0.005 + Math.random() * 0.012,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Grid warping calculations
    const getWarpedPoint = (x, y, mx, my, mActive) => {
      if (!mActive) return { x, y };
      const dx = x - mx;
      const dy = y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const warpRadius = 220;
      
      if (dist < warpRadius) {
        const force = Math.pow((warpRadius - dist) / warpRadius, 2) * 18;
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

      // Draw Warped Minimal Grid (2% transparency)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 0.8;
      const gridSize = 100;
      
      // Draw vertical grid lines
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        for (let y = 0; y < canvas.height; y += 15) {
          const pt = getWarpedPoint(x, y, mouse.x, mouse.y, mouse.active);
          if (y === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }
      
      // Draw horizontal grid lines
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 15) {
          const pt = getWarpedPoint(x, y, mouse.x, mouse.y, mouse.active);
          if (x === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

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
        node.alpha = node.baseAlpha + Math.sin(node.phase) * 0.1;

        // Draw connections to nearby nodes
        for (let j = idx + 1; j < nodes.length; j++) {
          const target = nodes[j];
          const dx = node.x - target.x;
          const dy = node.y - target.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 130) {
            const connAlpha = (1 - dist / 130) * 0.04;
            ctx.strokeStyle = `rgba(255, 255, 255, ${connAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
          }
        }

        // Draw connections to mouse cursor (very low transparency)
        if (mouse.active) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const mDist = Math.sqrt(dx * dx + dy * dy);
          if (mDist < 180) {
            const mConnAlpha = (1 - mDist / 180) * 0.04;
            ctx.strokeStyle = `rgba(51, 204, 255, ${mConnAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }

        // Draw node
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.01, node.alpha)})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update and Draw vector ribbon mouse trail (extremely low transparency 4%)
      const history = trailHistory.current;
      if (history.length > 1) {
        ctx.beginPath();
        ctx.moveTo(history[0].x, history[0].y);
        for (let i = 1; i < history.length; i++) {
          ctx.lineTo(history[i].x, history[i].y);
        }
        ctx.strokeStyle = 'rgba(51, 204, 255, 0.04)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Decay ribbon trail particles
      history.forEach(pt => {
        pt.life -= 0.04;
      });
      trailHistory.current = history.filter(pt => pt.life > 0);

      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none'
      }}
    />
  );
}
