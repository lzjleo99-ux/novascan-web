/* NOVASCAN hero — Apple-style frame-sequence scrubber
   160 WebP frames drawn to canvas, eased toward scroll target.
   Fallbacks: poster + autoplay mp4 (load fail) / static poster (reduced motion). */
(function () {
  const hero = document.getElementById('hero');
  if (!hero) return;
  const canvas = document.getElementById('heroCanvas');
  const poster = document.getElementById('heroPoster');
  const ctx = canvas.getContext('2d');
  const loader = hero.querySelector('.hero-load');
  const loadBar = hero.querySelector('.hero-load .bar i');
  const loadTxt = hero.querySelector('.hero-load span');
  const head = hero.querySelector('.hero-head');
  const end = hero.querySelector('.hero-end');
  const hint = hero.querySelector('.hero-hint');
  const caps = Array.from(hero.querySelectorAll('.hero-cap'));
  const timeEl = document.querySelector('.hp-time');
  const barEl = document.querySelector('.hp-bar i');

  const N = 160, FW = 1440, FH = 810, DUR = 16;
  // ?motion=1 forces the full scrub path (test hook / environments that force reduced motion)
  const reduced = !new URLSearchParams(location.search).has('motion') &&
    matchMedia('(prefers-reduced-motion: reduce)').matches;
  poster.src = 'assets/img/poster.jpg';

  /* ---------- frame loading ---------- */
  const frames = new Array(N);
  let loaded = 0, started = false, ext = 'webp';

  function srcOf(i) { return 'assets/img/frames/f' + String(i).padStart(3, '0') + '.' + ext; }
  function onOne() {
    loaded++;
    if (loadBar) loadBar.style.width = Math.round(loaded / N * 100) + '%';
    if (loadTxt) loadTxt.textContent = 'LOADING SEQUENCE ' + Math.round(loaded / N * 100) + '%';
    if (loaded >= N && !started) begin();
  }
  function loadAll() {
    for (let i = 0; i < N; i++) {
      const im = new Image();
      im.decoding = 'async';
      im.onload = onOne;
      im.onerror = () => { if (i === 0 && ext === 'webp') { ext = 'jpg'; loadAll(); } else onOne(); };
      im.src = srcOf(i);
      frames[i] = im;
    }
  }
  function begin() {
    started = true;
    if (loader) { loader.classList.add('done'); setTimeout(() => loader.remove(), 700); }
    onScroll();
    requestAnimationFrame(tick);
  }
  function leanFallback() {
    hero.classList.add('lean');
    if (loader) loader.remove();
    if (head) head.classList.remove('hide');
    const v = document.createElement('video');
    v.src = 'assets/video/scan-hero.mp4'; v.muted = true; v.loop = true;
    v.playsInline = true; v.autoplay = true; v.setAttribute('muted', '');
    v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.85';
    hero.querySelector('.hero-pin').prepend(v);
    canvas.remove();
    if (end) end.classList.add('show');
  }

  const probe = new Image();
  probe.onload = () => { if (!reduced) loadAll(); };
  probe.onerror = () => { ext = 'jpg'; reduced ? leanFallback() : (probe.src = srcOf(0), probe.onerror = leanFallback); };
  probe.src = srcOf(0);
  if (reduced) {
    hero.classList.add('lean');
    if (loader) loader.remove();
    if (head) head.classList.remove('hide');
    if (end) end.classList.add('show');
  }

  /* ---------- scrub ---------- */
  let target = 0, cur = -1, lastIdx = -1, raf = null;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  function onScroll() {
    const r = hero.getBoundingClientRect();
    const total = r.height - innerHeight;
    target = clamp(-r.top / Math.max(total, 1), 0, 1);
    if (started && raf === null) raf = requestAnimationFrame(tick);
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);

  function sizeCanvas() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const w = hero.clientWidth, h = hero.clientHeight;
    if (canvas.width !== w * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
    return dpr;
  }
  function draw(idx) {
    const dpr = sizeCanvas();
    const im = frames[idx];
    if (!im || !im.complete || !im.naturalWidth) {
      // nearest loaded frame
      for (let k = 1; k < N; k++) {
        const a = frames[idx - k], b = frames[idx + k];
        if (a && a.complete && a.naturalWidth) { draw0(a, dpr); return; }
        if (b && b.complete && b.naturalWidth) { draw0(b, dpr); return; }
      }
      return;
    }
    draw0(im, dpr);
  }
  function draw0(im, dpr) {
    const cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / FW, ch / FH);
    const dw = FW * s, dh = FH * s;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(im, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }
  /* overlay ranges on progress p (0..1) */
  const RANGES = [[0.20, 0.50], [0.55, 0.735]];
  function overlays(p) {
    if (head) head.classList.toggle('hide', p > 0.12);
    if (hint) hint.style.opacity = p > 0.03 ? 0 : 1;
    caps.forEach((c, i) => {
      const [a, b] = RANGES[i] || [2, 3];
      c.classList.toggle('show', p >= a && p <= b);
    });
    if (end) end.classList.toggle('show', p >= 0.82);
    if (barEl) barEl.style.width = (p * 100).toFixed(2) + '%';
    if (timeEl) {
      const t = p * DUR;
      timeEl.textContent = '00:' + String(Math.floor(t)).padStart(2, '0') + ' / 00:' + DUR;
    }
  }
  function tick() {
    const prev = cur;
    cur = cur < 0 ? target : cur + (target - cur) * 0.16;
    if (Math.abs(target - cur) < 0.0004) cur = target;
    const idx = clamp(Math.round(cur * (N - 1)), 0, N - 1);
    if (idx !== lastIdx || prev < 0) { draw(idx); lastIdx = idx; }
    overlays(cur);
    raf = (Math.abs(target - cur) > 0.00005 || cur === 0 || cur === 1) ? requestAnimationFrame(tick) : null;
    if (raf === null && cur === target) { /* idle until next scroll */ }
  }
})();
