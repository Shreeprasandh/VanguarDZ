// Sound effects and background music controller

function connectPanner(ctx, gainNode, pan = 0) {
  if (pan !== 0) {
    try {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-1.0, Math.min(1.0, pan)), ctx.currentTime);
      gainNode.connect(panner);
      panner.connect(ctx.destination);
      return;
    } catch (e) {
      console.warn("StereoPanner connection failed, falling back to direct:", e);
    }
  }
  gainNode.connect(ctx.destination);
}

class AudioManager {
  constructor() {
    this.sounds = {};
    this.music = null;
    this.muted = true; // Start muted on first load to guarantee browser security compliance
    this.initialized = false;
    this.musicPlaying = false;
    this.currentTrack = null;
    this.activeMusicTheme = 'ingame';
    this.tempoTarget = 1.0;
    this.tempoCurrent = 1.0;
    this.volumeTarget = 0.7;
    
    // File paths relative to public directory
    this.soundPaths = {
      hit: 'media/sounds/hit.ogg',
      target: 'media/sounds/target.ogg',
      explosionSmall: 'media/sounds/explosion-small.ogg',
      explosion: 'media/sounds/explosion.ogg',
      explosionLarge: 'media/sounds/explosion-large.ogg',
      emp: 'media/sounds/emp.ogg',
      plasma: 'media/sounds/plasma.ogg',
      click: 'media/sounds/click.ogg',
      explosionPlayer: 'media/sounds/explosion-player.ogg',
      multi2: 'media/sounds/multi-2.ogg',
      multi3: 'media/sounds/multi-3.ogg'
    };

    this.musicPaths = {
      endure: 'media/music/endure.ogg',
      orientation: 'media/music/orientation.ogg'
    };

    // Menu and Ingame generative synth contexts and intervals
    this.menuAudioCtx = null;
    this.menuMelodyInterval = null;
    this.menuChordInterval = null;
    this.menuPulseInterval = null;

    this.ingameAudioCtx = null;
    this.ingameBassInterval = null;
    this.ingameHihatInterval = null;
    this.ingameChordInterval = null;
    this.ingameChimeInterval = null;
    this.audioBuffers = {};
    this.sfxAudioCtx = null;
    this.lastMenuChimeIdx = 4;
    this.lastIngameChimeIdx = 4;

    // Auto-resume contexts on user interactions to bypass browser autoplay suspension
    const resumeAll = () => {
      if (this.muted) return;
      
      if (this.sfxAudioCtx && this.sfxAudioCtx.state === 'suspended') {
        this.sfxAudioCtx.resume().then(() => {
          if (this.currentTrack === 'menu_theme' && this.startMenuSynthFn) {
            this.startMenuSynthFn();
          }
          if (this.currentTrack === 'ingame_synth' && this.startIngameSynthFn) {
            this.startIngameSynthFn();
          }
        }).catch(() => {});
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('click', resumeAll);
      window.addEventListener('keydown', resumeAll);
      window.addEventListener('touchstart', resumeAll);
    }
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;
    
    try {
      this.sfxAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) {
      console.error("Failed to initialize SFX AudioContext", e);
    }
    
    this.audioBuffers = {};
    
    // Preload sound effects using standard Audio elements as fallback, and Web Audio decode as primary
    Object.entries(this.soundPaths).forEach(([key, path]) => {
      this.sounds[key] = new Audio(path);
      this.sounds[key].preload = 'auto';
      
      if (this.sfxAudioCtx) {
        fetch(path)
          .then(response => response.arrayBuffer())
          .then(arrayBuffer => this.sfxAudioCtx.decodeAudioData(arrayBuffer))
          .then(audioBuffer => {
            this.audioBuffers[key] = audioBuffer;
          })
          .catch(err => {
            console.warn(`Failed to preload Web Audio buffer for ${key}:`, err);
          });
      }
    });
  }

  play(soundName, pan = 0) {
    if (!this.initialized) this.init();
    if (this.muted) return;

    if (soundName === 'plasma' || soundName === 'hit') {
      try {
        const ctx = this.sfxAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
        const t = ctx.currentTime;

        // Random pitch variation (90% to 110%) to simulate different key resonance across the plate
        const pitchVariation = 0.9 + Math.random() * 0.2;

        // 1. Metal contact leaf click (high-frequency noise click)
        const bufferSize = ctx.sampleRate * 0.02; // 20ms noise buffer
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(5500 * pitchVariation, t);
        noiseFilter.Q.setValueAtTime(3.0, t);

        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.0001;
        noiseGain.gain.setValueAtTime(0.0001, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.065, t + 0.002); // fast attack
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.008); // 8ms leaf click decay

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);

        // 2. Plastic switch bottoming thud (triangle wave thump)
        const thudOsc = ctx.createOscillator();
        thudOsc.type = 'triangle';
        thudOsc.frequency.setValueAtTime(300 * pitchVariation, t);
        thudOsc.frequency.exponentialRampToValueAtTime(150 * pitchVariation, t + 0.025);

        const thudFilter = ctx.createBiquadFilter();
        thudFilter.type = 'lowpass';
        thudFilter.frequency.setValueAtTime(400 * pitchVariation, t);

        const thudGain = ctx.createGain();
        thudGain.gain.value = 0.0001;
        thudGain.gain.setValueAtTime(0.0001, t);
        thudGain.gain.exponentialRampToValueAtTime(0.09, t + 0.003); // fast attack
        thudGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03); // 30ms bottom thud decay

        thudOsc.connect(thudFilter);
        thudFilter.connect(thudGain);

        // Spatial panning based on screen position
        const panner = ctx.createStereoPanner();
        const finalPan = Math.max(-1.0, Math.min(1.0, pan));
        panner.pan.setValueAtTime(finalPan, t);

        noiseGain.connect(panner);
        thudGain.connect(panner);
        panner.connect(ctx.destination);

        noiseNode.start(t);
        thudOsc.start(t);
        noiseNode.stop(t + 0.05);
        thudOsc.stop(t + 0.05);

        // Schedule auto-disconnect to prevent memory leak and periodic GC pop
        setTimeout(() => {
          try {
            noiseNode.disconnect();
            thudOsc.disconnect();
            noiseGain.disconnect();
            thudGain.disconnect();
            panner.disconnect();
          } catch (e) {}
        }, 150);
      } catch (e) {
        console.warn('Procedural mechanical key click failed, falling back:', e);
      }
      return;
    }

    // Check if we have the Web Audio buffer loaded
    const buffer = this.audioBuffers && this.audioBuffers[soundName];
    if (buffer && this.sfxAudioCtx) {
      try {
        const ctx = this.sfxAudioCtx;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        
        const gainNode = ctx.createGain();
        let baseVolume = 0.6;
        if (soundName === 'plasma') baseVolume = 0.25;
        if (soundName === 'laserPlayer') baseVolume = 0.15;
        if (soundName === 'hit') baseVolume = 0.45;
        gainNode.gain.setValueAtTime(baseVolume, ctx.currentTime);
        
        const panner = ctx.createStereoPanner();
        const finalPan = Math.max(-1.0, Math.min(1.0, pan));
        panner.pan.setValueAtTime(finalPan, ctx.currentTime);
        
        source.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(ctx.destination);
        
        source.start(0);

        // Schedule auto-disconnect to prevent memory leak and periodic GC pop
        source.onended = () => {
          try {
            source.disconnect();
            gainNode.disconnect();
            panner.disconnect();
          } catch (e) {}
        };
        return;
      } catch (e) {
        console.warn(`Web Audio playback failed for ${soundName}, falling back to HTML5 Audio:`, e);
      }
    }

    const originalConnect = GainNode.prototype.connect;
    if (pan !== 0) {
      GainNode.prototype.connect = function(destination) {
        if (destination === this.context.destination) {
          try {
            const panner = this.context.createStereoPanner();
            panner.pan.setValueAtTime(Math.max(-1.0, Math.min(1.0, pan)), this.context.currentTime);
            originalConnect.call(this, panner);
            originalConnect.call(panner, destination);
            return panner;
          } catch (e) {}
        }
        return originalConnect.apply(this, arguments);
      };
    }

    try {
      if (soundName === 'shield_activate') {
      if (this.muted) return;
      try {
        const ctx = this.sfxAudioCtx;
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        connectPanner(ctx, gain, pan);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } catch (e) {}
      return;
    }
    if (soundName === 'shield_hit') {
      if (this.muted) return;
      try {
        const ctx = this.sfxAudioCtx;
        if (!ctx) return;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();
        
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(1100, ctx.currentTime);
        osc1.frequency.linearRampToValueAtTime(450, ctx.currentTime + 0.2);
        gain1.gain.setValueAtTime(0.15, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc1.connect(gain1);
        connectPanner(ctx, gain1, pan);
        
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(75, ctx.currentTime);
        osc2.frequency.linearRampToValueAtTime(35, ctx.currentTime + 0.15);
        gain2.gain.setValueAtTime(0.2, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.17);
        osc2.connect(gain2);
        connectPanner(ctx, gain2, pan);
        
        osc1.start();
        osc1.stop(ctx.currentTime + 0.25);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.2);
      } catch (e) {}
      return;
    }
    if (soundName === 'meteor_warning') {
      if (this.muted) return;
      try {
        const ctx = this.sfxAudioCtx;
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        const t = ctx.currentTime;
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.linearRampToValueAtTime(380, t + 0.25);
        osc.frequency.linearRampToValueAtTime(220, t + 0.50);
        osc.frequency.linearRampToValueAtTime(380, t + 0.75);
        osc.frequency.linearRampToValueAtTime(220, t + 1.00);
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, t);
        
        gain.gain.setValueAtTime(0.0, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 0.05);
        gain.gain.linearRampToValueAtTime(0.12, t + 0.90);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.10);
        
        osc.connect(filter);
        filter.connect(gain);
        connectPanner(ctx, gain, pan);
        
        osc.start();
        osc.stop(t + 1.15);
      } catch (e) {}
      return;
    }

    if (soundName === 'meteor_explosion') {
      if (this.muted) return;
      try {
        const ctx = this.sfxAudioCtx;
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const noise = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        
        const t = ctx.currentTime;
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.exponentialRampToValueAtTime(20, t + 0.5);
        
        noise.type = 'triangle';
        noise.frequency.setValueAtTime(45, t);
        noise.frequency.linearRampToValueAtTime(10, t + 0.4);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, t);
        filter.frequency.exponentialRampToValueAtTime(40, t + 0.5);
        
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        
        osc.connect(filter);
        noise.connect(filter);
        filter.connect(gain);
        connectPanner(ctx, gain, pan);
        
        osc.start();
        osc.stop(t + 0.6);
        noise.start();
        noise.stop(t + 0.6);
      } catch (e) {}
      return;
    }

    if (soundName === 'enemy_shield_shatter') {
      if (this.muted) return;
      try {
        const ctx = this.sfxAudioCtx;
        if (!ctx) return;
        const t = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(2200, t);
        osc1.frequency.exponentialRampToValueAtTime(100, t + 0.35);
        
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(1800, t);
        osc2.frequency.exponentialRampToValueAtTime(300, t + 0.25);
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000, t);
        
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        connectPanner(ctx, gain, pan);
        
        osc1.start();
        osc2.start();
        osc1.stop(t + 0.45);
        osc2.stop(t + 0.45);
      } catch(e) {}
      return;
    }

    if (soundName === 'explosion_drone') {
      if (this.muted) return;
      try {
        const ctx = this.sfxAudioCtx;
        if (!ctx) return;
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
        
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        
        osc.connect(gain);
        connectPanner(ctx, gain, pan);
        
        osc.start();
        osc.stop(t + 0.2);
      } catch(e) {}
      return;
    }

    if (soundName === 'explosion_interceptor') {
      if (this.muted) return;
      try {
        const ctx = this.sfxAudioCtx;
        if (!ctx) return;
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const sweep = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(500, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.22);
        
        sweep.type = 'sine';
        sweep.frequency.setValueAtTime(800, t);
        sweep.frequency.linearRampToValueAtTime(100, t + 0.15);
        
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        
        osc.connect(gain);
        sweep.connect(gain);
        connectPanner(ctx, gain, pan);
        
        osc.start();
        sweep.start();
        osc.stop(t + 0.3);
        sweep.stop(t + 0.3);
      } catch(e) {}
      return;
    }

    if (soundName === 'explosion_kamikaze') {
      if (this.muted) return;
      try {
        const ctx = this.sfxAudioCtx;
        if (!ctx) return;
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const noise = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(20, t + 0.3);
        
        noise.type = 'square';
        noise.frequency.setValueAtTime(120, t);
        noise.frequency.linearRampToValueAtTime(800, t + 0.15);
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, t);
        
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
        
        osc.connect(gain);
        noise.connect(filter);
        filter.connect(gain);
        connectPanner(ctx, gain, pan);
        
        osc.start();
        noise.start();
        osc.stop(t + 0.35);
        noise.stop(t + 0.35);
      } catch(e) {}
      return;
    }

    if (soundName === 'explosion_cruiser') {
      if (this.muted) return;
      try {
        const ctx = this.sfxAudioCtx;
        if (!ctx) return;
        const t = ctx.currentTime;
        
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();
        
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(150, t);
        osc1.frequency.exponentialRampToValueAtTime(30, t + 0.3);
        gain1.gain.setValueAtTime(0.35, t);
        gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(90, t + 0.15);
        osc2.frequency.exponentialRampToValueAtTime(20, t + 0.55);
        gain2.gain.setValueAtTime(0.0, t);
        gain2.gain.setValueAtTime(0.3, t + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        
        osc1.connect(gain1);
        osc2.connect(gain2);
        connectPanner(ctx, gain1, pan);
        connectPanner(ctx, gain2, pan);
        
        osc1.start();
        osc2.start(t + 0.15);
        osc1.stop(t + 0.4);
        osc2.stop(t + 0.6);
      } catch(e) {}
      return;
    }

    if (soundName === 'explosion_linker') {
      if (this.muted) return;
      try {
        const ctx = this.sfxAudioCtx;
        if (!ctx) return;
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.22);
        
        const buzz = ctx.createOscillator();
        buzz.type = 'sawtooth';
        buzz.frequency.setValueAtTime(300, t);
        buzz.frequency.linearRampToValueAtTime(50, t + 0.2);
        
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
        
        osc.connect(gain);
        buzz.connect(gain);
        connectPanner(ctx, gain, pan);
        
        osc.start();
        buzz.start();
        osc.stop(t + 0.25);
        buzz.stop(t + 0.25);
      } catch(e) {}
      return;
    }

    if (soundName === 'anomaly_pulse') {
      if (this.muted) return;
      try {
        const ctx = this.sfxAudioCtx;
        if (!ctx) return;
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.linearRampToValueAtTime(450, t + 0.6);
        
        const modulator = ctx.createOscillator();
        modulator.type = 'sawtooth';
        modulator.frequency.setValueAtTime(12, t);
        
        const modGain = ctx.createGain();
        modGain.gain.setValueAtTime(50, t);
        
        modulator.connect(modGain);
        modGain.connect(osc.frequency);
        
        gain.gain.setValueAtTime(0.0, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
        
        osc.connect(gain);
        connectPanner(ctx, gain, pan);
        
        modulator.start();
        osc.start();
        modulator.stop(t + 0.7);
        osc.stop(t + 0.7);
      } catch(e) {}
      return;
    }

    if (soundName === 'boss_laser') {
      if (this.muted) return;
      try {
        const ctx = this.sfxAudioCtx;
        if (!ctx) return;
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(380, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.4);
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        
        gain.gain.setValueAtTime(0.0, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        
        osc.connect(filter);
        filter.connect(gain);
        connectPanner(ctx, gain, pan);
        
        osc.start();
        osc.stop(t + 0.5);
      } catch(e) {}
      return;
    }

    if (soundName === 'boss_hit') {
      if (this.muted) return;
      try {
        const ctx = this.sfxAudioCtx;
        if (!ctx) return;
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.linearRampToValueAtTime(60, t + 0.12);
        
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        
        osc.connect(gain);
        connectPanner(ctx, gain, pan);
        
        osc.start();
        osc.stop(t + 0.2);
      } catch(e) {}
      return;
    }

    if (soundName === 'boss_explosion') {
      if (this.muted) return;
      try {
        const ctx = this.sfxAudioCtx;
        if (!ctx) return;
        const t = ctx.currentTime;
        
        for (let i = 0; i < 3; i++) {
          const delay = i * 0.22;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = i % 2 === 0 ? 'sawtooth' : 'square';
          osc.frequency.setValueAtTime(120 - i * 30, t + delay);
          osc.frequency.exponentialRampToValueAtTime(20, t + delay + 0.4);
          
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(250 - i * 50, t + delay);
          
          gain.gain.setValueAtTime(0.0, t);
          gain.gain.setValueAtTime(0.35, t + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.45);
          
          osc.connect(filter);
          filter.connect(gain);
          connectPanner(ctx, gain, pan);
          
          osc.start(t + delay);
          osc.stop(t + delay + 0.5);
        }
      } catch(e) {}
      return;
    }

    if (soundName === 'laserPlayer') {
      if (this.muted) return;
      try {
        const ctx = this.sfxAudioCtx;
        if (!ctx) return;
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(400, t + 0.1);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        connectPanner(ctx, gain, pan);
        osc.start();
        osc.stop(t + 0.15);
      } catch(e) {}
      return;
    }

    if (soundName === 'laser') {
      if (this.muted) return;
      try {
        const ctx = this.sfxAudioCtx;
        if (!ctx) return;
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.15);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        connectPanner(ctx, gain, pan);
        osc.start();
        osc.stop(t + 0.2);
      } catch(e) {}
      return;
    }

    if (soundName === 'warning') {
      if (this.muted) return;
      try {
        const ctx = this.sfxAudioCtx;
        if (!ctx) return;
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.setValueAtTime(0, t + 0.1);
        osc.frequency.setValueAtTime(880, t + 0.15);
        
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.setValueAtTime(0.0, t + 0.1);
        gain.gain.setValueAtTime(0.12, t + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        
        osc.connect(gain);
        connectPanner(ctx, gain, pan);
        osc.start();
        osc.stop(t + 0.3);
      } catch(e) {}
      return;
    }

      if (!this.initialized) this.init();
      if (this.muted) return;

      const audio = this.sounds[soundName];
      if (audio) {
        // Clone audio node to allow playing multiple instances concurrently
        const playClone = audio.cloneNode();
        playClone.volume = soundName === 'plasma' ? 0.3 : 0.6;
        playClone.play().catch(err => {
          // Silently catch browser autoplay prevention errors
        });
      }
    } finally {
      if (pan !== 0) {
        GainNode.prototype.connect = originalConnect;
      }
    }
  }

  startMenuTheme() {
    if (this.muted) return;
    this.stopMusic();
    this.stopMenuTheme();
    this.stopIngameSynthTheme();
    
    try {
      this.menuAudioCtx = this.sfxAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const ctx = this.menuAudioCtx;
      
      // Master Gain for menu theme to allow smooth fading transitions
      this.menuMasterGain = ctx.createGain();
      this.menuMasterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      this.menuMasterGain.connect(ctx.destination);
      
      // Soothing Space Delay effect node
      const delayNode = ctx.createDelay(2.0);
      const feedbackNode = ctx.createGain();
      
      delayNode.delayTime.setValueAtTime(0.4, ctx.currentTime);
      feedbackNode.gain.setValueAtTime(0.35, ctx.currentTime);
      
      delayNode.connect(feedbackNode);
      feedbackNode.connect(delayNode);
      delayNode.connect(this.menuMasterGain);
      
      const progressions = [
        [220.00, 261.63, 329.63, 392.00], // Am7
        [174.61, 220.00, 261.63, 349.23], // Fmaj7
        [261.63, 329.63, 392.00, 493.88], // Cmaj7
        [196.00, 246.94, 293.66, 392.00], // G7
        [146.83, 174.61, 220.00, 293.66], // Dm7
        [220.00, 261.63, 329.63, 392.00], // Am7
        [174.61, 220.00, 261.63, 349.23], // Fmaj7
        [164.81, 207.65, 246.94, 329.63], // E7 (Haunting resolution!)
        [261.63, 329.63, 392.00, 493.88], // Cmaj7 (Section B shift)
        [196.00, 246.94, 293.66, 392.00], // G7
        [220.00, 261.63, 329.63, 392.00], // Am7
        [164.81, 196.00, 246.94, 329.63], // Em7
        [174.61, 220.00, 261.63, 349.23], // Fmaj7
        [261.63, 329.63, 392.00, 493.88], // Cmaj7
        [146.83, 174.61, 220.00, 293.66], // Dm7
        [164.81, 207.65, 246.94, 329.63]  // E7 (Return modulation)
      ];
      let progIdx = 0;
      
      const scaleBank = {
        0: [440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51], // Am7
        1: [440.00, 523.25, 659.25, 698.46, 783.99, 880.00, 1046.50, 1318.51],        // Fmaj7
        2: [493.88, 523.25, 659.25, 783.99, 880.00, 987.77, 1046.50, 1318.51],        // Cmaj7
        3: [392.00, 493.88, 587.33, 698.46, 783.99, 880.00, 987.77, 1174.66],        // G7
        4: [440.00, 523.25, 587.33, 698.46, 880.00, 1046.50, 1174.66, 1318.51],       // Dm7
        5: [440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51], // Am7
        6: [440.00, 523.25, 659.25, 698.46, 783.99, 880.00, 1046.50, 1318.51],        // Fmaj7
        7: [415.30, 493.88, 587.33, 659.25, 830.61, 987.77, 1318.51],                 // E7 (G# scale resolution)
        8: [493.88, 523.25, 659.25, 783.99, 880.00, 987.77, 1046.50, 1318.51],        // Cmaj7
        9: [392.00, 493.88, 587.33, 698.46, 783.99, 880.00, 987.77, 1174.66],        // G7
        10: [440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51], // Am7
        11: [329.63, 392.00, 440.00, 493.88, 587.33, 659.25, 783.99, 987.77],          // Em7
        12: [440.00, 523.25, 659.25, 698.46, 783.99, 880.00, 1046.50, 1318.51],        // Fmaj7
        13: [493.88, 523.25, 659.25, 783.99, 880.00, 987.77, 1046.50, 1318.51],        // Cmaj7
        14: [440.00, 523.25, 587.33, 698.46, 880.00, 1046.50, 1174.66, 1318.51],       // Dm7
        15: [415.30, 493.88, 587.33, 659.25, 830.61, 987.77, 1318.51]                 // E7
      };

      // Composition patterns: index pathways on the active scale bank
      const melodyPatterns = [
        { indices: [0, 2, 4, 3, 2], delays: [0.75, 1.5, 2.25, 3.0, 4.5] },
        { indices: [4, 3, 2, 1, 2], delays: [0.75, 1.5, 2.25, 3.0, 3.75] },
        { indices: [2, 4, 5, 4, 2], delays: [0.75, 1.5, 2.25, 3.0, 4.5] },
        { indices: [0, 1, 2, 3, 4, 2], delays: [0.75, 1.5, 2.25, 3.0, 3.75, 4.5] },
        { indices: [4, 5, 7, 5, 4], delays: [0.75, 1.5, 2.25, 3.0, 4.5] },
        { indices: [0, 2, 3, 2, 0], delays: [0.75, 1.5, 2.25, 3.0, 3.75] },
        { indices: [3, 5, 6, 5, 3], delays: [0.75, 1.5, 2.25, 3.0, 4.5] },
        { indices: [5, 4, 3, 2, 0], delays: [0.75, 1.5, 2.25, 3.0, 3.75, 4.5] },
        { indices: [1, 3, 5, 4, 2], delays: [0.75, 1.5, 2.25, 3.0, 4.5] }
      ];
      let patternIdx = 0;

      const playChords = (t) => {
        if (!this.menuAudioCtx || ctx.state === 'suspended') return;
        const chordIdxVal = progIdx;
        const chord = progressions[progIdx];
        progIdx = (progIdx + 1) % progressions.length;
        
        // Play single root note as a very soft, soothing backing pad
        const freq = chord[0];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.0001; // Prevent startup pop noise
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.015, t + 1.5);
        gain.gain.exponentialRampToValueAtTime(0.015, t + 4.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 5.9);
        
        osc.connect(gain);
        gain.connect(this.menuMasterGain);
        
        osc.start(t);
        osc.stop(t + 6.0);

        // Retrieve scale bank and selected melodic pattern
        const scale = scaleBank[chordIdxVal] || scaleBank[0];
        const pattern = melodyPatterns[patternIdx];
        patternIdx = (patternIdx + 1) % melodyPatterns.length;

        // Schedule the pre-composed melody notes
        pattern.indices.forEach((scaleIdx, index) => {
          const noteTime = t + pattern.delays[index];
          const noteFreq = scale[Math.min(scale.length - 1, scaleIdx)];
          const noteDur = 0.8; // beautiful holding duration

          const noteOsc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          noteGain.gain.value = 0.0001;
          
          noteOsc.type = 'sine';
          noteOsc.frequency.setValueAtTime(noteFreq, t); // set immediately
          
          noteGain.gain.setValueAtTime(0.0001, noteTime);
          noteGain.gain.exponentialRampToValueAtTime(0.02, noteTime + 0.03); // clickless 30ms attack
          noteGain.gain.exponentialRampToValueAtTime(0.02, noteTime + noteDur);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + noteDur + 0.45); // soft 450ms release
          
          noteOsc.connect(noteGain);
          noteGain.connect(this.menuMasterGain);
          noteGain.connect(delayNode);
          
          noteOsc.start(noteTime);
          noteOsc.stop(noteTime + noteDur + 0.5);
        });
      };
      
      this.nextMenuChordTime = ctx.currentTime + 0.05;
      const scheduler = () => {
        if (!this.menuAudioCtx || ctx.state === 'suspended') return;
        const scheduleAheadTime = 0.3; // schedule 300ms in advance to bypass GC pauses
        while (this.nextMenuChordTime < ctx.currentTime + scheduleAheadTime) {
          playChords(this.nextMenuChordTime);
          this.nextMenuChordTime += 6.0; // increment exactly by 6 seconds to prevent drift
        }
      };

      let started = false;
      const startSynth = () => {
        if (started) return;
        started = true;
        const t = ctx.currentTime;
        this.menuMasterGain.gain.setValueAtTime(0.0001, t);
        this.menuMasterGain.gain.exponentialRampToValueAtTime(1.0, t + 3.0);
        
        this.nextMenuChordTime = ctx.currentTime + 0.05;
        this.menuChordInterval = setInterval(scheduler, 100); // Check every 100ms
        scheduler();
      };

      this.startMenuSynthFn = startSynth;

      startSynth();
    } catch (e) {
      console.error('Menu theme initialization failed:', e);
    }
  }

  stopMenuTheme() {
    if (this.menuChordInterval) clearInterval(this.menuChordInterval);
    this.menuChordInterval = null;
    
    const ctx = this.menuAudioCtx;
    const gainNode = this.menuMasterGain;
    if (gainNode) {
      try {
        const t = this.sfxAudioCtx.currentTime;
        gainNode.gain.setValueAtTime(gainNode.gain.value, t);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 1.0); // fade out over 1.0s
        setTimeout(() => {
          try {
            gainNode.disconnect();
          } catch(e) {}
        }, 1100);
      } catch (e) {
        try {
          gainNode.disconnect();
        } catch(err) {}
      }
    }
    this.menuAudioCtx = null;
    this.menuMasterGain = null;
    this.startMenuSynthFn = null;
    if (this.currentTrack === 'menu_theme') {
      this.currentTrack = null;
      this.musicPlaying = false;
    }
  }

  startIngameSynthTheme() {
    if (this.muted) return;
    this.stopMusic();
    this.stopMenuTheme();
    this.stopIngameSynthTheme();
    
    try {
      this.ingameAudioCtx = this.sfxAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const ctx = this.ingameAudioCtx;
      
      this.tempoCurrent = 1.0;
      this.tempoTarget = 1.0;
      this.volumeTarget = 0.7;

      // Master Gain for in-game theme to allow smooth transitions
      this.ingameMasterGain = ctx.createGain();
      this.ingameMasterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      this.ingameMasterGain.connect(ctx.destination);
      
      const ingameChords = [
        [220.00, 261.63, 329.63], // Am
        [146.83, 174.61, 220.00], // Dm
        [261.63, 329.63, 392.00], // C
        [164.81, 196.00, 246.94], // Em
        [174.61, 220.00, 261.63], // F
        [196.00, 246.94, 293.66], // G
        [220.00, 261.63, 329.63], // Am
        [164.81, 196.00, 246.94]  // Em
      ];
      let chordIdx = 0;

      // Echo delay for ambient chimes
      const delayNode = ctx.createDelay(2.0);
      const delayGain = ctx.createGain();
      delayNode.delayTime.setValueAtTime(0.5, ctx.currentTime);
      delayGain.gain.setValueAtTime(0.25, ctx.currentTime);
      delayNode.connect(delayGain);
      delayGain.connect(delayNode);
      delayGain.connect(this.ingameMasterGain);

      const ingameChimesSetA = {
        0: [1318.51, 880.00, 1046.50], // Am: E6, A5, C6
        1: [1396.91, 880.00, 1174.66], // Dm: F6, A5, D6
        2: [1318.51, 783.99, 1046.50], // C: E6, G5, C6
        3: [1567.98, 987.77, 1318.51], // Em: G6, B5, E6
        4: [1396.91, 880.00, 1046.50], // F: F6, A5, C6
        5: [1567.98, 987.77, 1174.66], // G: G6, B5, D6
        6: [1318.51, 880.00, 1046.50], // Am: E6, A5, C6
        7: [1567.98, 987.77, 1318.51]  // Em: G6, B5, E6
      };

      const ingameChimesSetB = {
        0: [1046.50, 1318.51, 1760.00], // Am: C6, E6, A6
        1: [1174.66, 1396.91, 2093.00], // Dm: D6, F6, C7
        2: [1046.50, 1318.51, 1567.98], // C: C6, E6, G6
        3: [1318.51, 1567.98, 1975.53], // Em: E6, G6, B6
        4: [1046.50, 1396.91, 1760.00], // F: C6, F6, A6
        5: [1174.66, 1567.98, 1975.53], // G: D6, G6, B6
        6: [1046.50, 1318.51, 1760.00], // Am: C6, E6, A6
        7: [1318.51, 1567.98, 1975.53]  // Em: E6, G6, B6
      };

      const playChords = (t) => {
        if (!this.ingameAudioCtx || ctx.state === 'suspended') return;
        
        let chordDur = 4.0 / this.tempoCurrent;
        let activeChords = ingameChords;
        let activeChimesA = ingameChimesSetA;
        let activeChimesB = ingameChimesSetB;
        let padOscType = 'sine';
        let chimeOscType = 'sine';
        let octaveMultiplier = 1.0;
        
        if (this.activeMusicTheme === 'boss_void_emperor') {
          activeChords = [
            [110.00, 138.59, 164.81],
            [116.54, 146.83, 174.61],
            [110.00, 138.59, 164.81],
            [98.00, 123.47, 146.83]
          ];
          padOscType = 'sawtooth';
          chimeOscType = 'triangle';
          octaveMultiplier = 1.5;
        } else if (this.activeMusicTheme === 'boss_singularity') {
          activeChords = [
            [220.00, 293.66, 349.23],
            [196.00, 261.63, 311.13],
            [220.00, 293.66, 349.23],
            [246.94, 329.63, 392.00]
          ];
          padOscType = 'sine';
          chimeOscType = 'sine';
          octaveMultiplier = 1.0;
        } else if (this.activeMusicTheme === 'boss_dreadnought') {
          activeChords = [
            [110.00, 130.81, 155.56],
            [98.00, 116.54, 138.59],
            [110.00, 130.81, 164.81],
            [82.41, 103.83, 123.47]
          ];
          padOscType = 'triangle';
          chimeOscType = 'sine';
          octaveMultiplier = 1.25;
        } else if (this.activeMusicTheme === 'miniboss') {
          activeChords = [
            [146.83, 174.61, 220.00],
            [174.61, 220.00, 261.63],
            [196.00, 246.94, 293.66],
            [130.81, 164.81, 196.00]
          ];
          padOscType = 'sine';
          chimeOscType = 'triangle';
        }

        const activeChordIdx = chordIdx % activeChords.length;
        const chord = activeChords[activeChordIdx];
        chordIdx = (chordIdx + 1) % activeChords.length;
        
        // Play the 3 chord voices
        chord.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          gain.gain.value = 0.0001;
          
          osc.type = padOscType;
          osc.frequency.setValueAtTime(freq, t);
          
          gain.gain.setValueAtTime(0.0001, t);
          const maxVol = padOscType === 'sawtooth' ? 0.0022 : (padOscType === 'triangle' ? 0.004 : 0.006);
          gain.gain.exponentialRampToValueAtTime(maxVol, t + 0.8 / this.tempoCurrent);
          gain.gain.exponentialRampToValueAtTime(maxVol, t + 3.2 / this.tempoCurrent);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.9 / this.tempoCurrent);
          
          osc.connect(gain);
          gain.connect(this.ingameMasterGain);
          
          osc.start(t);
          osc.stop(t + chordDur);
        });

        // Add low sub bass drone for boss fights
        if (this.activeMusicTheme.startsWith('boss_')) {
          const bassOsc = ctx.createOscillator();
          const bassGain = ctx.createGain();
          bassOsc.type = this.activeMusicTheme === 'boss_void_emperor' ? 'sawtooth' : 'sine';
          const baseFreq = chord[0] / 2;
          bassOsc.frequency.setValueAtTime(baseFreq, t);
          
          bassGain.gain.setValueAtTime(0.0001, t);
          const bassVol = this.activeMusicTheme === 'boss_void_emperor' ? 0.012 : 0.022;
          bassGain.gain.exponentialRampToValueAtTime(bassVol, t + 0.1 / this.tempoCurrent);
          bassGain.gain.exponentialRampToValueAtTime(0.0001, t + chordDur - 0.2 / this.tempoCurrent);
          
          const lpFilter = ctx.createBiquadFilter();
          lpFilter.type = 'lowpass';
          lpFilter.frequency.setValueAtTime(130, t); // clean sub below 130Hz
          
          bassOsc.connect(lpFilter);
          lpFilter.connect(bassGain);
          bassGain.connect(this.ingameMasterGain);
          
          bassOsc.start(t);
          bassOsc.stop(t + chordDur);
        } else if (this.activeMusicTheme === 'miniboss') {
          // Pulsing syncopated bassline
          const pulses = 4;
          const pulseInterval = chordDur / pulses;
          for (let p = 0; p < pulses; p++) {
            const pulseTime = t + p * pulseInterval;
            const bassOsc = ctx.createOscillator();
            const bassGain = ctx.createGain();
            bassOsc.type = 'triangle';
            bassOsc.frequency.setValueAtTime(chord[0] / 2, pulseTime);
            
            bassGain.gain.setValueAtTime(0.0001, pulseTime);
            bassGain.gain.exponentialRampToValueAtTime(0.015, pulseTime + 0.05);
            bassGain.gain.exponentialRampToValueAtTime(0.0001, pulseTime + pulseInterval - 0.05);
            
            bassOsc.connect(bassGain);
            bassGain.connect(this.ingameMasterGain);
            
            bassOsc.start(pulseTime);
            bassOsc.stop(pulseTime + pulseInterval);
          }
        }

        // Play chimes
        const chimePitches = Math.random() < 0.5 ? activeChimesA[activeChordIdx] || activeChimesA[0] : activeChimesB[activeChordIdx] || activeChimesB[0];
        const chimeDelays = [0.6, 1.8, 3.0];
        
        if (chimePitches) {
          chimePitches.forEach((chimeFreq, idx) => {
            const chimeTime = t + chimeDelays[idx] / this.tempoCurrent;
            const chimeDur = 0.8 / this.tempoCurrent;

            const chimeOsc = ctx.createOscillator();
            const chimeGain = ctx.createGain();
            chimeGain.gain.value = 0.0001;

            chimeOsc.type = chimeOscType;
            chimeOsc.frequency.setValueAtTime(chimeFreq * octaveMultiplier, t);

            chimeGain.gain.setValueAtTime(0.0001, chimeTime);
            chimeGain.gain.exponentialRampToValueAtTime(0.0022, chimeTime + 0.025 / this.tempoCurrent);
            chimeGain.gain.exponentialRampToValueAtTime(0.0022, chimeTime + chimeDur);
            chimeGain.gain.exponentialRampToValueAtTime(0.0001, chimeTime + chimeDur + 0.4 / this.tempoCurrent);

            chimeOsc.connect(chimeGain);
            chimeGain.connect(this.ingameMasterGain);
            chimeGain.connect(delayNode);

            chimeOsc.start(chimeTime);
            chimeOsc.stop(chimeTime + chimeDur + 0.5);
          });
        }
      };
      
      this.nextIngameChordTime = ctx.currentTime + 0.05;
      const scheduler = () => {
        if (!this.ingameAudioCtx || ctx.state === 'suspended') return;
        
        // Ease tempo and volume targets smoothly to prevent clicks/pops
        this.tempoCurrent += (this.tempoTarget - this.tempoCurrent) * 0.05;
        const currentGain = this.ingameMasterGain.gain.value;
        const targetGain = this.volumeTarget * (this.activeMusicTheme.startsWith('boss_') ? 1.25 : 1.0);
        this.ingameMasterGain.gain.setValueAtTime(currentGain + (targetGain - currentGain) * 0.05, ctx.currentTime);

        const scheduleAheadTime = 0.3; // schedule 300ms in advance to bypass GC pauses
        while (this.nextIngameChordTime < ctx.currentTime + scheduleAheadTime) {
          playChords(this.nextIngameChordTime);
          this.nextIngameChordTime += 4.0 / this.tempoCurrent;
        }
      };

      let started = false;
      const startSynth = () => {
        if (started) return;
        started = true;
        const t = ctx.currentTime;
        this.ingameMasterGain.gain.setValueAtTime(0.0001, t);
        this.ingameMasterGain.gain.exponentialRampToValueAtTime(1.0, t + 3.0);
        
        this.nextIngameChordTime = ctx.currentTime + 0.05;
        this.ingameChordInterval = setInterval(scheduler, 100); // Check every 100ms
        scheduler();
      };

      this.startIngameSynthFn = startSynth;

      startSynth();
    } catch (e) {
      console.error('Ingame synth theme initialization failed:', e);
    }
  }

  stopIngameSynthTheme() {
    if (this.ingameChordInterval) clearInterval(this.ingameChordInterval);
    if (this.ingameChimeInterval) clearInterval(this.ingameChimeInterval);
    this.ingameChordInterval = null;
    this.ingameChimeInterval = null;
    
    const ctx = this.ingameAudioCtx;
    const gainNode = this.ingameMasterGain;
    if (gainNode) {
      try {
        const t = this.sfxAudioCtx.currentTime;
        gainNode.gain.setValueAtTime(gainNode.gain.value, t);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 1.0); // fade out over 1s
        setTimeout(() => {
          try {
            gainNode.disconnect();
          } catch(e) {}
        }, 1100);
      } catch (e) {
        try {
          gainNode.disconnect();
        } catch(err) {}
      }
    }
    this.ingameAudioCtx = null;
    this.ingameMasterGain = null;
    this.startIngameSynthFn = null;
    
    this.activeMusicTheme = 'ingame';
    this.tempoTarget = 1.0;
    this.tempoCurrent = 1.0;
    this.volumeTarget = 0.7;

    if (this.currentTrack === 'ingame_synth') {
      this.currentTrack = null;
      this.musicPlaying = false;
    }
  }

  setMusicTheme(theme) {
    this.activeMusicTheme = theme;
  }

  setMusicTempoTarget(tempo) {
    this.tempoTarget = tempo;
  }

  setMusicVolumeTarget(volume) {
    this.volumeTarget = volume;
  }

  playMusic(trackName = 'endure') {
    if (!this.initialized) this.init();
    
    if (this.currentTrack === trackName && this.musicPlaying) {
      if (trackName === 'menu_theme' && this.menuAudioCtx) {
        if (this.menuAudioCtx.state === 'suspended') {
          this.menuAudioCtx.resume().then(() => {
            if (this.startMenuSynthFn) this.startMenuSynthFn();
          }).catch(() => {});
        }
        return;
      }
      if (trackName === 'ingame_synth' && this.ingameAudioCtx) {
        if (this.ingameAudioCtx.state === 'suspended') {
          this.ingameAudioCtx.resume().then(() => {
            if (this.startIngameSynthFn) this.startIngameSynthFn();
          }).catch(() => {});
        }
        return;
      }
      if (this.music) {
        if (!this.muted) {
          this.music.play().catch(() => {});
        }
        return;
      }
    }

    // Stop active music/synth modes first
    this.stopMusic();
    this.stopMenuTheme();
    this.stopIngameSynthTheme();

    this.currentTrack = trackName;

    if (trackName === 'menu_theme') {
      this.startMenuTheme();
      this.musicPlaying = true;
      return;
    }

    if (trackName === 'ingame_synth') {
      this.startIngameSynthTheme();
      this.musicPlaying = true;
      return;
    }

    const trackPath = this.musicPaths[trackName];
    if (trackPath) {
      this.music = new Audio(trackPath);
      this.music.loop = true;
      this.music.volume = 0.4;
      this.musicPlaying = true;
      
      if (!this.muted) {
        this.music.play().catch(err => {
          // Handled via user interaction resume
        });
      }
    }
  }

  stopMusic() {
    if (this.music) {
      this.music.pause();
      this.music.currentTime = 0;
      this.music = null;
    }
    this.musicPlaying = false;
    if (this.currentTrack !== 'menu_theme' && this.currentTrack !== 'ingame_synth') {
      this.currentTrack = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      if (this.music) this.music.pause();
      const savedTrack = this.currentTrack;
      this.stopMenuTheme();
      this.stopIngameSynthTheme();
      this.currentTrack = savedTrack;
    } else {
      if (this.currentTrack) {
        const trackToPlay = this.currentTrack;
        this.currentTrack = null;
        this.playMusic(trackToPlay);
      }
    }
    return this.muted;
  }
}

export const GameAudio = new AudioManager();
