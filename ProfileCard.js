const ANIMATION_CONFIG = {
  INITIAL_DURATION: 1200,
  INITIAL_X_OFFSET: 70,
  INITIAL_Y_OFFSET: 60,
  DEVICE_BETA_OFFSET: 20,
  ENTER_TRANSITION_MS: 180
};

const clamp = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round = (v, precision = 3) => parseFloat(v.toFixed(precision));
const adjust = (v, fMin, fMax, tMin, tMax) => round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

export class ProfileCard {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      name: 'Azir Azrai',
      title: 'Cyber Security Student & Developer',
      handle: 'azirazrai',
      status: 'Online',
      contactText: 'Contact Me',
      avatarUrl: 'assets/images/profile-picture.png',
      showUserInfo: false,
      enableTilt: true,
      enableMobileTilt: false,
      mobileTiltSensitivity: 5,
      behindGlowEnabled: true,
      behindGlowColor: 'rgba(99, 102, 241, 0.4)',
      behindGlowSize: '50%',
      innerGradient: 'linear-gradient(145deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.2) 100%)',
      onContactClick: null,
      ...options
    };

    this.enterTimer = null;
    this.leaveRaf = null;
    this.createDom();
    this.initTiltEngine();
    this.addEventListeners();
    this.triggerInitialSequence();
  }

  createDom() {
    const cardRadius = '30px';
    this.wrap = document.createElement('div');
    this.wrap.className = 'profile-card-wrap relative touch-none';
    
    // Set custom CSS variables
    if (this.options.iconUrl && this.options.iconUrl !== '<Placeholder for icon URL>') {
      this.wrap.style.setProperty('--icon', `url(${this.options.iconUrl})`);
    }
    this.wrap.style.setProperty('--grain', this.options.grainUrl ? `url(${this.options.grainUrl})` : 'none');
    this.wrap.style.setProperty('--inner-gradient', this.options.innerGradient);
    this.wrap.style.setProperty('--behind-glow-color', this.options.behindGlowColor);
    this.wrap.style.setProperty('--behind-glow-size', this.options.behindGlowSize);
    
    this.wrap.style.setProperty('--pointer-x', '50%');
    this.wrap.style.setProperty('--pointer-y', '50%');
    this.wrap.style.setProperty('--pointer-from-center', '0');
    this.wrap.style.setProperty('--pointer-from-top', '0.5');
    this.wrap.style.setProperty('--pointer-from-left', '0.5');
    this.wrap.style.setProperty('--card-opacity', '0');
    this.wrap.style.setProperty('--rotate-x', '0deg');
    this.wrap.style.setProperty('--rotate-y', '0deg');
    this.wrap.style.setProperty('--background-x', '50%');
    this.wrap.style.setProperty('--background-y', '50%');
    this.wrap.style.setProperty('--card-radius', cardRadius);
    
    // Set sunpillar colors
    this.wrap.style.setProperty('--sunpillar-1', 'hsl(2, 100%, 73%)');
    this.wrap.style.setProperty('--sunpillar-2', 'hsl(53, 100%, 69%)');
    this.wrap.style.setProperty('--sunpillar-3', 'hsl(93, 100%, 69%)');
    this.wrap.style.setProperty('--sunpillar-4', 'hsl(176, 100%, 76%)');
    this.wrap.style.setProperty('--sunpillar-5', 'hsl(228, 100%, 74%)');
    this.wrap.style.setProperty('--sunpillar-6', 'hsl(283, 100%, 73%)');
    this.wrap.style.setProperty('--sunpillar-clr-1', 'var(--sunpillar-1)');
    this.wrap.style.setProperty('--sunpillar-clr-2', 'var(--sunpillar-2)');
    this.wrap.style.setProperty('--sunpillar-clr-3', 'var(--sunpillar-3)');
    this.wrap.style.setProperty('--sunpillar-clr-4', 'var(--sunpillar-4)');
    this.wrap.style.setProperty('--sunpillar-clr-5', 'var(--sunpillar-5)');
    this.wrap.style.setProperty('--sunpillar-clr-6', 'var(--sunpillar-6)');

    // Build DOM structure
    let behindGlowHtml = '';
    if (this.options.behindGlowEnabled) {
      behindGlowHtml = `
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 0; pointer-events: none; transition: opacity 200ms ease-out;
                    background: radial-gradient(circle at var(--pointer-x) var(--pointer-y), var(--behind-glow-color) 0%, transparent var(--behind-glow-size));
                    filter: blur(50px) saturate(1.1); opacity: calc(0.8 * var(--card-opacity));">
        </div>`;
    }

    let userInfoHtml = '';
    if (this.options.showUserInfo) {
      userInfoHtml = `
        <div style="position: absolute; bottom: 20px; left: 20px; right: 20px; z-index: 2; display: flex; align-items: center; justify-content: space-between;
                    backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px; padding: 12px 14px; pointer-events: auto;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 48px; height: 48px; border-radius: 50%; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
              <img src="${this.options.miniAvatarUrl || this.options.avatarUrl}"
                alt="${this.options.name} mini avatar"
                style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;" />
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
              <div style="font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.9); line-height: 1;">@${this.options.handle}</div>
              <div style="font-size: 13px; color: rgba(255,255,255,0.7); line-height: 1;">${this.options.status}</div>
            </div>
          </div>
          <button class="profile-card-btn" style="border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 16px; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.9); background: rgba(255,255,255,0.15); cursor: pointer; transition: all 0.2s;" type="button">
            ${this.options.contactText}
          </button>
        </div>`;
    }

    this.wrap.innerHTML = `
      ${behindGlowHtml}
      <div class="profile-card-shell" style="position: relative; z-index: 1;">
        <section class="profile-card-section" style="background-blend-mode: color-dodge, normal, normal, normal;">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: var(--inner-gradient); background-color: rgba(0, 0, 0, 0.9); border-radius: var(--card-radius); display: grid; width: 100%; height: 100%;">
            
            <!-- Shine layer -->
            <div class="profile-card-shine"></div>

            <!-- Glare layer -->
            <div class="profile-card-glare"></div>

            <!-- Avatar content -->
            <div style="mix-blend-mode: luminosity; transform: translateZ(2px); border-radius: var(--card-radius); pointer-events: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; overflow: visible;">
              <img class="profile-card-avatar-img"
                src="${this.options.avatarUrl}"
                alt="${this.options.name} avatar"
                style="width: 100%; position: absolute; left: 50%; bottom: -1px; transform-origin: 50% 100%; transform: translateX(calc(-50% + (var(--pointer-from-left) - 0.5) * 6px)) translateZ(0) scaleY(calc(1 + (var(--pointer-from-top) - 0.5) * 0.02)) scaleX(calc(1 + (var(--pointer-from-left) - 0.5) * 0.01)); border-radius: var(--card-radius); display: block;" />
              ${userInfoHtml}
            </div>

            <!-- Details content -->
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; transform: translate3d(calc(var(--pointer-from-left) * -6px + 3px), calc(var(--pointer-from-top) * -6px + 3px), 0.1px);
                        mix-blend-mode: luminosity; border-radius: var(--card-radius); pointer-events: none; overflow: hidden; z-index: 5;">
              <div style="width: 100%; position: absolute; top: 3em; display: flex; flex-direction: column; align-items: center; text-align: center;">
                <h3 class="font-semibold m-0"
                  style="font-size: 2.2rem; font-weight: 700; margin: 0; background-image: linear-gradient(to bottom, #fff, #6f6fbe);
                         -webkit-text-fill-color: transparent; -webkit-background-clip: text; background-clip: text;">
                  ${this.options.name}
                </h3>
                <p class="font-semibold"
                  style="position: relative; top: -5px; font-size: 14px; margin: 0 auto; background-image: linear-gradient(to bottom, #fff, #4a4ac0);
                         -webkit-text-fill-color: transparent; -webkit-background-clip: text; background-clip: text;">
                  ${this.options.title}
                </p>
              </div>
            </div>
            
          </div>
        </section>
      </div>`;

    this.shell = this.wrap.querySelector('.profile-card-shell');
    this.section = this.wrap.querySelector('.profile-card-section');

    this.container.appendChild(this.wrap);
    
    // Bind contact button if present
    if (this.options.showUserInfo) {
      const btn = this.wrap.querySelector('.profile-card-btn');
      if (btn && this.options.onContactClick) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.options.onContactClick();
        });
      }
    }
  }

  initTiltEngine() {
    if (!this.options.enableTilt) return;

    let rafId = null;
    let running = false;
    let lastTs = 0;

    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const DEFAULT_TAU = 0.14;
    const INITIAL_TAU = 0.6;
    let initialUntil = 0;

    const setVarsFromXY = (x, y) => {
      const shell = this.shell;
      const wrap = this.wrap;
      if (!shell || !wrap) return;

      const width = shell.clientWidth || 340;
      const height = shell.clientHeight || 480;

      const percentX = clamp((100 / width) * x);
      const percentY = clamp((100 / height) * y);

      const centerX = percentX - 50;
      const centerY = percentY - 50;

      const properties = {
        '--pointer-x': `${percentX}%`,
        '--pointer-y': `${percentY}%`,
        '--background-x': `${adjust(percentX, 0, 100, 35, 65)}%`,
        '--background-y': `${adjust(percentY, 0, 100, 35, 65)}%`,
        '--pointer-from-center': `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
        '--pointer-from-top': `${percentY / 100}`,
        '--pointer-from-left': `${percentX / 100}`,
        '--rotate-x': `${round(-(centerX / 5))}deg`,
        '--rotate-y': `${round(centerY / 4)}deg`
      };

      for (const [k, v] of Object.entries(properties)) wrap.style.setProperty(k, v);
    };

    const step = ts => {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      const tau = ts < initialUntil ? INITIAL_TAU : DEFAULT_TAU;
      const k = 1 - Math.exp(-dt / tau);

      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;

      setVarsFromXY(currentX, currentY);

      const stillFar = Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05;

      if (stillFar || document.hasFocus()) {
        rafId = requestAnimationFrame(step);
      } else {
        running = false;
        lastTs = 0;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      lastTs = 0;
      rafId = requestAnimationFrame(step);
    };

    this.tiltEngine = {
      setImmediate(x, y) {
        currentX = x;
        currentY = y;
        setVarsFromXY(currentX, currentY);
      },
      setTarget(x, y) {
        targetX = x;
        targetY = y;
        start();
      },
      toCenter() {
        const shell = shellRef.current || this.shell;
        if (!shell) return;
        this.setTarget(shell.clientWidth / 2, shell.clientHeight / 2);
      },
      beginInitial(durationMs) {
        initialUntil = performance.now() + durationMs;
        start();
      },
      getCurrent() {
        return { x: currentX, y: currentY, tx: targetX, ty: targetY };
      },
      cancel() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        running = false;
        lastTs = 0;
      }
    };

    const shellRef = { current: this.shell };
  }

  getOffsets(evt, el) {
    const rect = el.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  }

  addEventListeners() {
    if (!this.options.enableTilt || !this.tiltEngine) return;

    this.boundOnPointerEnter = (e) => {
      const shell = this.shell;
      shell.classList.add('active');
      shell.classList.add('entering');
      
      this.wrap.style.setProperty('--card-opacity', '1');
      this.section.style.transition = 'none';
      this.section.style.transform = 'translateZ(0) rotateX(var(--rotate-y)) rotateY(var(--rotate-x))';

      if (this.enterTimer) window.clearTimeout(this.enterTimer);
      this.enterTimer = window.setTimeout(() => {
        shell.classList.remove('entering');
      }, ANIMATION_CONFIG.ENTER_TRANSITION_MS);

      const { x, y } = this.getOffsets(e, shell);
      this.tiltEngine.setTarget(x, y);
    };

    this.boundOnPointerMove = (e) => {
      const shell = this.shell;
      const { x, y } = this.getOffsets(e, shell);
      this.tiltEngine.setTarget(x, y);
    };

    this.boundOnPointerLeave = () => {
      const shell = this.shell;
      
      this.section.style.transition = 'transform 1s ease';
      this.section.style.transform = 'translateZ(0) rotateX(0deg) rotateY(0deg)';
      
      this.tiltEngine.toCenter();

      const checkSettle = () => {
        const { x, y, tx, ty } = this.tiltEngine.getCurrent();
        const settled = Math.hypot(tx - x, ty - y) < 0.6;
        if (settled) {
          shell.classList.remove('active');
          this.wrap.style.setProperty('--card-opacity', '0');
          this.leaveRaf = null;
        } else {
          this.leaveRaf = requestAnimationFrame(checkSettle);
        }
      };

      if (this.leaveRaf) cancelAnimationFrame(this.leaveRaf);
      this.leaveRaf = requestAnimationFrame(checkSettle);
    };

    this.shell.addEventListener('pointerenter', this.boundOnPointerEnter);
    this.shell.addEventListener('pointermove', this.boundOnPointerMove);
    this.shell.addEventListener('pointerleave', this.boundOnPointerLeave);

    // Orientation Support
    this.boundOnDeviceOrientation = (e) => {
      const shell = this.shell;
      const { beta, gamma } = e;
      if (beta == null || gamma == null) return;

      const centerX = shell.clientWidth / 2;
      const centerY = shell.clientHeight / 2;
      const x = clamp(centerX + gamma * this.options.mobileTiltSensitivity, 0, shell.clientWidth);
      const y = clamp(
        centerY + (beta - ANIMATION_CONFIG.DEVICE_BETA_OFFSET) * this.options.mobileTiltSensitivity,
        0,
        shell.clientHeight
      );

      this.tiltEngine.setTarget(x, y);
    };

    this.boundOnOrientationClick = () => {
      if (!this.options.enableMobileTilt || location.protocol !== 'https:') return;
      const anyMotion = window.DeviceMotionEvent;
      if (anyMotion && typeof anyMotion.requestPermission === 'function') {
        anyMotion
          .requestPermission()
          .then(state => {
            if (state === 'granted') {
              window.addEventListener('deviceorientation', this.boundOnDeviceOrientation);
            }
          })
          .catch(console.error);
      } else {
        window.addEventListener('deviceorientation', this.boundOnDeviceOrientation);
      }
    };
    this.shell.addEventListener('click', this.boundOnOrientationClick);
  }

  triggerInitialSequence() {
    if (!this.tiltEngine) return;
    const shell = this.shell;
    const initialX = (shell.clientWidth || 340) - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;
    
    this.tiltEngine.setImmediate(initialX, initialY);
    this.tiltEngine.toCenter();
    this.tiltEngine.beginInitial(ANIMATION_CONFIG.INITIAL_DURATION);
  }

  destroy() {
    if (this.enterTimer) window.clearTimeout(this.enterTimer);
    if (this.leaveRaf) cancelAnimationFrame(this.leaveRaf);
    if (this.tiltEngine) this.tiltEngine.cancel();
    
    if (this.shell) {
      this.shell.removeEventListener('pointerenter', this.boundOnPointerEnter);
      this.shell.removeEventListener('pointermove', this.boundOnPointerMove);
      this.shell.removeEventListener('pointerleave', this.boundOnPointerLeave);
      this.shell.removeEventListener('click', this.boundOnOrientationClick);
    }
    
    window.removeEventListener('deviceorientation', this.boundOnDeviceOrientation);
    
    if (this.wrap && this.wrap.parentNode) {
      this.wrap.parentNode.removeChild(this.wrap);
    }
  }
}
