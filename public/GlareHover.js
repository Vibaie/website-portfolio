export class GlareHover {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      width: '100%',
      height: '100%',
      background: 'transparent',
      borderRadius: '15px',
      borderColor: 'transparent',
      glareColor: '#ffffff',
      glareOpacity: 0.3,
      glareAngle: -30,
      glareSize: 300,
      transitionDuration: 800,
      playOnce: false,
      className: '',
      style: {},
      ...options
    };

    this.createDom();
    this.addEventListeners();
  }

  createDom() {
    const hex = this.options.glareColor.replace('#', '');
    let rgba = this.options.glareColor;
    if (/^[\dA-Fa-f]{6}$/.test(hex)) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      rgba = `rgba(${r}, ${g}, ${b}, ${this.options.glareOpacity})`;
    } else if (/^[\dA-Fa-f]{3}$/.test(hex)) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      rgba = `rgba(${r}, ${g}, ${b}, ${this.options.glareOpacity})`;
    }

    this.overlay = document.createElement('div');
    this.overlay.className = 'glare-hover-overlay';
    
    Object.assign(this.overlay.style, {
      position: 'absolute',
      inset: 0,
      background: `linear-gradient(${this.options.glareAngle}deg,
          hsla(0,0%,0%,0) 60%,
          ${rgba} 70%,
          hsla(0,0%,0%,0) 100%)`,
      backgroundSize: `${this.options.glareSize}% ${this.options.glareSize}%, 100% 100%`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: '-100% -100%, 0 0',
      pointerEvents: 'none',
      zIndex: '2'
    });

    if (this.options.width !== '100%') this.container.style.width = this.options.width;
    if (this.options.height !== '100%') this.container.style.height = this.options.height;
    if (this.options.background !== 'transparent') this.container.style.background = this.options.background;
    if (this.options.borderRadius !== '') this.container.style.borderRadius = this.options.borderRadius;
    if (this.options.borderColor !== '') this.container.style.borderColor = this.options.borderColor;

    Object.assign(this.container.style, this.options.style);

    if (this.options.className) {
      this.options.className.split(' ').filter(Boolean).forEach(cls => {
        this.container.classList.add(cls);
      });
    }

    // Ensure relative/overflow hidden on container so glare is contained
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';

    this.container.appendChild(this.overlay);
  }

  animateIn = () => {
    const el = this.overlay;
    if (!el) return;

    el.style.transition = 'none';
    el.style.backgroundPosition = '-100% -100%, 0 0';
    // Trigger reflow to apply the transition-none state instantly
    void el.offsetWidth;
    el.style.transition = `${this.options.transitionDuration}ms ease`;
    el.style.backgroundPosition = '100% 100%, 0 0';
  };

  animateOut = () => {
    const el = this.overlay;
    if (!el) return;

    if (this.options.playOnce) {
      el.style.transition = 'none';
      el.style.backgroundPosition = '-100% -100%, 0 0';
    } else {
      el.style.transition = `${this.options.transitionDuration}ms ease`;
      el.style.backgroundPosition = '-100% -100%, 0 0';
    }
  };

  addEventListeners() {
    this.container.addEventListener('mouseenter', this.animateIn);
    this.container.addEventListener('mouseleave', this.animateOut);
  }

  destroy() {
    if (this.container) {
      this.container.removeEventListener('mouseenter', this.animateIn);
      this.container.removeEventListener('mouseleave', this.animateOut);
      if (this.overlay && this.overlay.parentNode === this.container) {
        this.container.removeChild(this.overlay);
      }
    }
  }
}

export default GlareHover;
