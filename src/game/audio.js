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

  playMusic(trackName = 'endure') {
    if (!this.initialized) this.init();
    
    // Stop active music first
    this.stopMusic();

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
    } else {
      if (this.music && this.musicPlaying) {
        this.music.play().catch(e => {});
      }
    }
    return this.muted;
  }
}

export const GameAudio = new AudioManager();
