/**
 * Gorgeous, high-performance 2D Canvas Hyperspeed Starfield
 * Fully interactive, responsive, and light/dark theme aware.
 * Zero external dependencies (no Three.js or postprocessing required).
 */

class HyperspeedBackground {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'hyperspeed-canvas';
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.stars = [];
    this.numStars = 200;
    this.maxDepth = 1000;
    this.baseSpeed = 8;
    this.speedBoost = 0;
    this.targetSpeedBoost = 0;
    
    // Interactive center with smooth interpolation (lerp)
    this.centerX = 0;
    this.centerY = 0;
    this.targetCenterX = 0;
    this.targetCenterY = 0;
    this.mouseActive = false;

    // Colors matching dark (cyberpunk red/white) and light (indigo/violet) themes
    this.colors = {
      dark: [
        'rgba(225, 6, 0, 0.95)',    // Primary red
        'rgba(255, 60, 60, 0.9)',    // Secondary bright red
        'rgba(255, 24, 1, 0.95)',   // Accent crimson
        'rgba(255, 255, 255, 0.95)', // White highlight
        'rgba(220, 220, 220, 0.85)'  // Silver trail
      ],
      light: [
        'rgba(79, 70, 229, 0.9)',    // Indigo
        'rgba(124, 58, 237, 0.9)',   // Purple
        'rgba(219, 39, 119, 0.85)',  // Pink
        'rgba(99, 102, 241, 0.95)',  // Bright violet
        'rgba(59, 130, 246, 0.9)'    // Soft blue
      ]
    };

    this.initStars();
    this.resize();
    this.bindEvents();
    this.animate();
  }

  getTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  initStars() {
    this.stars = [];
    const theme = this.getTheme();
    const activeColors = this.colors[theme];

    for (let i = 0; i < this.numStars; i++) {
      this.stars.push({
        x: (Math.random() - 0.5) * 1600,
        y: (Math.random() - 0.5) * 1600,
        z: Math.random() * this.maxDepth,
        prevZ: 0,
        color: activeColors[Math.floor(Math.random() * activeColors.length)],
        width: Math.random() * 2 + 1,
        // Slower stars in light mode, faster in dark mode
        speedFactor: Math.random() * 0.8 + 0.4
      });
      this.stars[i].prevZ = this.stars[i].z;
    }
  }

  resize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    this.canvas.width = this.width * (window.devicePixelRatio || 1);
    this.canvas.height = this.height * (window.devicePixelRatio || 1);
    this.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    if (!this.mouseActive) {
      this.targetCenterX = this.width / 2;
      this.targetCenterY = this.height / 2;
      this.centerX = this.targetCenterX;
      this.centerY = this.targetCenterY;
    }
  }

  bindEvents() {
    this.resize = this.resize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.onScroll = this.onScroll.bind(this);

    window.addEventListener('resize', this.resize);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseleave', this.onMouseLeave);
    window.addEventListener('scroll', this.onScroll, { passive: true });

    // Watch for theme changes to swap star colors
    this.observer = new MutationObserver(() => {
      const theme = this.getTheme();
      const activeColors = this.colors[theme];
      this.stars.forEach(star => {
        star.color = activeColors[Math.floor(Math.random() * activeColors.length)];
      });
    });
    this.observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  onMouseMove(e) {
    this.mouseActive = true;
    // Limit drift from center to 15% of screen size to keep warp effect clean
    const dx = e.clientX - this.width / 2;
    const dy = e.clientY - this.height / 2;
    this.targetCenterX = this.width / 2 + dx * 0.18;
    this.targetCenterY = this.height / 2 + dy * 0.18;
  }

  onMouseLeave() {
    this.mouseActive = false;
    this.targetCenterX = this.width / 2;
    this.targetCenterY = this.height / 2;
  }

  onScroll() {
    // Boost speed temporarily on scroll
    this.speedBoost = Math.min(this.speedBoost + 12, 40);
  }

  animate() {
    if (this.disposed) return;

    // Smoothly interpolate center point (easing)
    this.centerX += (this.targetCenterX - this.centerX) * 0.08;
    this.centerY += (this.targetCenterY - this.centerY) * 0.08;

    // Decay speed boost back to zero slowly
    this.speedBoost += (0 - this.speedBoost) * 0.05;

    const theme = this.getTheme();
    const currentSpeed = (theme === 'light' ? this.baseSpeed * 0.5 : this.baseSpeed) + this.speedBoost;

    // Clear canvas with a slightly transparent fill to create a motion blur/trail effect
    this.ctx.fillStyle = theme === 'light' ? 'rgba(248, 250, 252, 0.28)' : 'rgba(9, 7, 15, 0.28)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const fov = 200;

    for (let i = 0; i < this.numStars; i++) {
      const star = this.stars[i];

      // Save previous z for trail drawing
      star.prevZ = star.z;

      // Update z position
      star.z -= currentSpeed * star.speedFactor;

      // Recycle star when it gets too close to the screen
      if (star.z <= 0) {
        star.z = this.maxDepth;
        star.prevZ = star.z;
        star.x = (Math.random() - 0.5) * 1600;
        star.y = (Math.random() - 0.5) * 1600;
        // Make sure recycled stars spawn with current theme's colors
        const activeColors = this.colors[theme];
        star.color = activeColors[Math.floor(Math.random() * activeColors.length)];
      }

      // Calculate current 2D projection
      const px = ((star.x) / star.z) * fov + this.centerX;
      const py = ((star.y) / star.z) * fov + this.centerY;

      // Calculate previous 2D projection for drawing the line trail
      const prevPx = ((star.x) / star.prevZ) * fov + this.centerX;
      const prevPy = ((star.y) / star.prevZ) * fov + this.centerY;

      // Only draw if within screen boundaries
      if (px >= 0 && px <= this.width && py >= 0 && py <= this.height) {
        this.ctx.beginPath();
        this.ctx.moveTo(prevPx, prevPy);
        this.ctx.lineTo(px, py);
        
        // Draw glow effect for dark mode or main light line
        this.ctx.strokeStyle = star.color;
        this.ctx.lineWidth = star.width * (1 - star.z / this.maxDepth) * (theme === 'light' ? 0.75 : 1.2);
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
      }
    }

    requestAnimationFrame(() => this.animate());
  }

  dispose() {
    this.disposed = true;
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseleave', this.onMouseLeave);
    window.removeEventListener('scroll', this.onScroll);
    if (this.observer) this.observer.disconnect();
    this.container.replaceChildren();
  }
}

function initHyperspeed() {
  const container = document.getElementById('hyperspeed-bg');
  if (!container || container.dataset.ready) return;
  container.dataset.ready = 'true';
  window.hyperspeedBg = new HyperspeedBackground(container);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHyperspeed);
} else {
  initHyperspeed();
}
