// Sound effects and background music controller

class AudioManager {
  constructor() {
    this.sounds = {};
    this.music = null;
    this.muted = false;
    this.initialized = false;
    this.musicPlaying = false;
    
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
  }

  init() {
    if (this.initialized) return;
    
    // Preload sound effects using standard Audio elements
    Object.entries(this.soundPaths).forEach(([key, path]) => {
      this.sounds[key] = new Audio(path);
      this.sounds[key].preload = 'auto';
    });

    this.initialized = true;
  }

  play(soundName) {
    if (soundName === 'shield_activate') {
      if (this.muted) return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } catch (e) {}
      return;
    }
    if (soundName === 'shield_hit') {
      if (this.muted) return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
        gain1.connect(ctx.destination);
        
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(75, ctx.currentTime);
        osc2.frequency.linearRampToValueAtTime(35, ctx.currentTime + 0.15);
        gain2.gain.setValueAtTime(0.2, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.17);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        
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
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(t + 1.15);
      } catch (e) {}
      return;
    }

    if (soundName === 'meteor_explosion') {
      if (this.muted) return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
        gain.connect(ctx.destination);
        
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
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
        gain.connect(ctx.destination);
        
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
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
        
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(t + 0.2);
      } catch(e) {}
      return;
    }

    if (soundName === 'explosion_interceptor') {
      if (this.muted) return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
        gain.connect(ctx.destination);
        
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
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
        gain.connect(ctx.destination);
        
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
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
        gain1.connect(ctx.destination);
        gain2.connect(ctx.destination);
        
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
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
        gain.connect(ctx.destination);
        
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
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
        gain.connect(ctx.destination);
        
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
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(t + 0.5);
      } catch(e) {}
      return;
    }

    if (soundName === 'boss_hit') {
      if (this.muted) return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.linearRampToValueAtTime(60, t + 0.12);
        
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(t + 0.2);
      } catch(e) {}
      return;
    }

    if (soundName === 'boss_explosion') {
      if (this.muted) return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
          gain.connect(ctx.destination);
          
          osc.start(t + delay);
          osc.stop(t + delay + 0.5);
        }
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
  }

  startMenuTheme() {
    if (this.muted) return;
    this.stopMusic();
    this.stopMenuTheme();
    this.stopIngameSynthTheme();
    
    try {
      this.menuAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = this.menuAudioCtx;
      
      const delayNode = ctx.createDelay(2.0);
      const delayGain = ctx.createGain();
      delayNode.delayTime.setValueAtTime(0.4, ctx.currentTime);
      delayGain.gain.setValueAtTime(0.35, ctx.currentTime);
      
      delayNode.connect(delayGain);
      delayGain.connect(delayNode);
      delayGain.connect(ctx.destination);
      
      const playMelody = () => {
        if (!this.menuAudioCtx || ctx.state === 'suspended') return;
        const t = ctx.currentTime;
        const scale = [440, 523.25, 587.33, 659.25, 783.99, 880];
        const freq = scale[Math.floor(Math.random() * scale.length)];
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        
        gain.gain.setValueAtTime(0.025, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.connect(delayNode);
        
        osc.start(t);
        osc.stop(t + 1.3);
      };
      
      const progressions = [
        [220, 261.63, 329.63, 392],
        [174.61, 220, 261.63, 349.23],
        [261.63, 329.63, 392, 493.88],
        [196, 246.94, 293.66, 392]
      ];
      let progIdx = 0;
      
      const playChords = () => {
        if (!this.menuAudioCtx || ctx.state === 'suspended') return;
        const t = ctx.currentTime;
        const chord = progressions[progIdx];
        progIdx = (progIdx + 1) % progressions.length;
        
        chord.forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq / 2, t);
          
          gain.gain.setValueAtTime(0.0, t);
          gain.gain.linearRampToValueAtTime(0.03, t + 1.5);
          gain.gain.linearRampToValueAtTime(0.03, t + 4.5);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 6.0);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(t);
          osc.stop(t + 6.1);
        });
      };
      
      const playPulse = () => {
        if (!this.menuAudioCtx || ctx.state === 'suspended') return;
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, t);
        osc.frequency.exponentialRampToValueAtTime(20, t + 0.15);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
      };
      
      this.menuMelodyInterval = setInterval(playMelody, 800);
      this.menuChordInterval = setInterval(playChords, 6000);
      this.menuPulseInterval = setInterval(playPulse, 1500);
      
      playChords();
      playPulse();
    } catch (e) {
      console.error('Menu theme initialization failed:', e);
    }
  }

  stopMenuTheme() {
    if (this.menuMelodyInterval) clearInterval(this.menuMelodyInterval);
    if (this.menuChordInterval) clearInterval(this.menuChordInterval);
    if (this.menuPulseInterval) clearInterval(this.menuPulseInterval);
    this.menuMelodyInterval = null;
    this.menuChordInterval = null;
    this.menuPulseInterval = null;
    
    if (this.menuAudioCtx) {
      try {
        this.menuAudioCtx.close();
      } catch (e) {}
      this.menuAudioCtx = null;
    }
  }

  startIngameSynthTheme() {
    if (this.muted) return;
    this.stopMusic();
    this.stopMenuTheme();
    this.stopIngameSynthTheme();
    
    try {
      this.ingameAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = this.ingameAudioCtx;
      
      const bassNotes = [
        110.00, 110.00, 130.81, 146.83,
        110.00, 110.00, 98.00, 87.31
      ];
      let noteIdx = 0;
      
      const playBassBeat = () => {
        if (!this.ingameAudioCtx || ctx.state === 'suspended') return;
        const t = ctx.currentTime;
        const freq = bassNotes[noteIdx];
        noteIdx = (noteIdx + 1) % bassNotes.length;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq / 2, t);
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(150, t);
        
        gain.gain.setValueAtTime(0.0, t);
        gain.gain.linearRampToValueAtTime(0.06, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(t);
        osc.stop(t + 0.48);
      };
      
      const playHihat = () => {
        if (!this.ingameAudioCtx || ctx.state === 'suspended') return;
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(10000, t);
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(8000, t);
        
        gain.gain.setValueAtTime(0.004, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.06);
      };
      
      this.ingameBassInterval = setInterval(playBassBeat, 500);
      this.ingameHihatInterval = setInterval(playHihat, 250);
    } catch (e) {
      console.error('Ingame synth theme initialization failed:', e);
    }
  }

  stopIngameSynthTheme() {
    if (this.ingameBassInterval) clearInterval(this.ingameBassInterval);
    if (this.ingameHihatInterval) clearInterval(this.ingameHihatInterval);
    this.ingameBassInterval = null;
    this.ingameHihatInterval = null;
    
    if (this.ingameAudioCtx) {
      try {
        this.ingameAudioCtx.close();
      } catch (e) {}
      this.ingameAudioCtx = null;
    }
  }

  playMusic(trackName = 'endure') {
    if (!this.initialized) this.init();
    
    // Stop active music/synth modes first
    this.stopMusic();
    this.stopMenuTheme();
    this.stopIngameSynthTheme();

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
      this.musicPlaying = false;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      if (this.music) this.music.pause();
      this.stopMenuTheme();
      this.stopIngameSynthTheme();
    } else {
      if (this.music && this.musicPlaying) {
        this.music.play().catch(e => {});
      }
    }
    return this.muted;
  }
}

export const GameAudio = new AudioManager();
