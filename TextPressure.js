/* TextPressure.js — Vanilla JS port of ReactBits TextPressure component
 * Uses Roboto Flex (Google Fonts) — a verified variable font with wght + wdth axes.
 * No external font file needed: loaded via <link> in HTML.
 */
(function (G) {
  'use strict';

  var FONT_FAMILY = "'Roboto Flex', sans-serif";

  /* Inject base styles once */
  (function injectStyles() {
    if (document.getElementById('tp-styles')) return;
    var s = document.createElement('style');
    s.id = 'tp-styles';
    s.textContent = [
      '.tp-wrap{position:relative;width:100%;}',
      '.tp-title{margin:0;text-align:center;user-select:none;white-space:nowrap;',
      'width:100%;display:flex;justify-content:space-between;',
      'text-transform:uppercase;transform-origin:center top;font-weight:100;}',
      '.tp-title span{display:inline-block;will-change:font-variation-settings;font-family:\'Roboto Flex\', sans-serif !important;}'
    ].join('');
    document.head.appendChild(s);
  })();

  function dist(a, b) {
    var dx = b.x - a.x, dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /* When cursor is ON the letter → maxVal; when cursor is FAR → minVal */
  function getAttr(d, maxDist, minVal, maxVal) {
    var val = maxVal - Math.abs((maxVal * d) / maxDist);
    return Math.max(minVal, val + minVal);
  }

  function TextPressure(container, opts) {
    opts = Object.assign({
      text: 'Hello!',
      textColor: '#ffffff',
      minFontSize: 20,
      weight: true,   // animates 'wght' axis
      width: true,    // animates 'wdth' axis  (Roboto Flex: 75–150)
      italic: false,  // Roboto Flex has no 'ital' axis — keep off
      alpha: false,
      scale: true
    }, opts || {});

    /* ── Build DOM ─────────────────────────────────────── */
    container.classList.add('tp-wrap');

    var h1 = document.createElement('h1');
    h1.className = 'tp-title';
    h1.style.fontFamily = FONT_FAMILY;
    h1.style.color = opts.textColor;

    var chars = opts.text.split('');
    var spans = chars.map(function (ch) {
      var sp = document.createElement('span');
      sp.textContent = ch === ' ' ? '\u00A0' : ch;
      sp.style.color = opts.textColor;
      /* Set a visible initial state so something renders before font-variation kicks in */
      sp.style.fontVariationSettings = "'wght' 400, 'wdth' 100";
      h1.appendChild(sp);
      return sp;
    });

    container.appendChild(h1);

    /* ── Font-size / scale ─────────────────────────────── */
    function setSize() {
      var cw = container.getBoundingClientRect().width;
      var ch = container.getBoundingClientRect().height;
      /* chars.length gives tighter fit for short words like "Hello!" */
      var fs = Math.max(opts.minFontSize, cw / chars.length);
      h1.style.fontSize = fs + 'px';
      h1.style.transform = 'scale(1,1)';
      h1.style.lineHeight = '1';

      if (opts.scale && ch > 0) {
        requestAnimationFrame(function () {
          var th = h1.getBoundingClientRect().height;
          if (th > 0) {
            var r = ch / th;
            h1.style.transform = 'scale(1,' + r + ')';
            h1.style.lineHeight = r;
          }
        });
      }
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setSize, 100);
    });

    /* Wait for font to load, THEN size and start animation */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        setSize();
        updateSpanCenters();
        startAnimation();
      });
    } else {
      /* Fallback for browsers without document.fonts */
      setTimeout(function () { setSize(); updateSpanCenters(); startAnimation(); }, 300);
    }

    /* ── Cached span positions (update on resize/scroll, not every frame) ── */
    var spanCenters = [];
    function updateSpanCenters() {
      spanCenters = spans.map(function (sp) {
        var r = sp.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      });
    }
    window.addEventListener('resize', updateSpanCenters);
    window.addEventListener('scroll', updateSpanCenters, { passive: true });

    /* ── Mouse tracking ────────────────────────────────── */
    var mouse  = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var cursor = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    function onMouseMove(e) { cursor.x = e.clientX; cursor.y = e.clientY; }
    function onTouchMove(e) { cursor.x = e.touches[0].clientX; cursor.y = e.touches[0].clientY; }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    /* ── Animation loop ────────────────────────────────── */
    var rafId;
    function startAnimation() {
      function animate() {
        /* Smooth cursor follow */
        mouse.x += (cursor.x - mouse.x) / 15;
        mouse.y += (cursor.y - mouse.y) / 15;

        /* Use full viewport diagonal so ANY cursor position drives the effect */
        var maxDist = Math.sqrt(
          window.innerWidth  * window.innerWidth +
          window.innerHeight * window.innerHeight
        ) / 1.4;

        spans.forEach(function (sp, i) {
          var center = spanCenters[i] || { x: 0, y: 0 };
          var d  = dist(mouse, center);

          /* Roboto Flex axes: wght 100–1000, wdth 75–150 */
          var wght = opts.weight ? Math.floor(getAttr(d, maxDist, 100, 900)) : 400;
          var wdth = opts.width  ? Math.floor(getAttr(d, maxDist, 75,  150)) : 100;
          var opac = opts.alpha  ? getAttr(d, maxDist, 0.3, 1).toFixed(2)   : '1';

          var fvs = "'wght' " + wght + ", 'wdth' " + wdth;
          if (sp.style.fontVariationSettings !== fvs) {
            sp.style.fontVariationSettings = fvs;
          }
          if (opts.alpha) sp.style.opacity = opac;
        });

        rafId = requestAnimationFrame(animate);
      }
      animate();
    }

    /* ── Cleanup ───────────────────────────────────────── */
    this.dispose = function () {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }

  G.TextPressure = TextPressure;
})(window);
