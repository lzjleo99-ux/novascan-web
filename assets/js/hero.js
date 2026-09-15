/* NOVASCAN hero — Apple-style frame-sequence scrubber
   160 WebP frames drawn to canvas, eased toward scroll target.
   The scrub ALWAYS runs — it moves only when the user scrolls, so it is not
   the kind of autonomous animation prefers-reduced-motion should block.
   Fallback: poster + autoplay mp4 only when frames fail to load.
   Resilience: the rAF loop always runs (idle when hero is off-screen), so
   bfcache restores, missed scroll events and evicted frames self-heal. */
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
  poster.src = 'assets/img/poster.jpg';

  /* ---------- frame loading ---------- */
  const frames = new Array(N);
  let loaded = 0, started = false, ext = 'webp', reloading = false, stallTimer = null;

  function srcOf(i) { return 'assets/img/frames/f' + String(i).padStart(3, '0') + '.' + ext; }
  function onOne() {
    loaded++;
    if (loadBar) loadBar.style.width = Math.round(loaded / N * 100) + '%';
    if (loadTxt) loadTxt.textContent = 'LOADING SEQUENCE ' + Math.round(loaded / N * 100) + '%';
    if (loaded >= N && !started) begin();
  }
  function loadAll() {
    loaded = 0;
    if (stallTimer) clearTimeout(stallTimer);
    // safety: never let the loader block forever (slow network / dropped requests)
    stallTimer = setTimeout(() => { if (!started && loaded > 0) begin(); }, 8000);
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
    if (started) { lastIdx = -1; return; }   // re-load after eviction: just force a redraw
    started = true;
    if (stallTimer) clearTimeout(stallTimer);
    if (loader) { loader.classList.add('done'); setTimeout(() => loader.remove(), 700); }
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
  probe.onload = () => loadAll();
  probe.onerror = () => { ext = 'jpg'; probe.src = srcOf(0); probe.onerror = leanFallback; };
  probe.src = srcOf(0);

  /* ---------- scrub (self-healing loop) ---------- */
  let target = 0, cur = -1, lastIdx = -1;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  function sizeCanvas() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const pin = hero.querySelector('.hero-pin');   // 100vh sticky viewport, NOT the 430vh wrapper
    const w = pin.clientWidth, h = pin.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    }
    return dpr;
  }
  function draw(idx) {
    const dpr = sizeCanvas();
    const im = frames[idx];
    const ok = q => q && q.complete && q.naturalWidth > 0;
    if (!ok(im)) {
      // nearest usable frame
      for (let k = 1; k < N; k++) {
        const a = frames[idx - k], b = frames[idx + k];
        if (ok(a)) { draw0(a, dpr); return; }
        if (ok(b)) { draw0(b, dpr); return; }
      }
      // nothing usable at all (evicted cache, bfcache purge) → reload the sequence
      if (!reloading) { reloading = true; loadAll(); }
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
    requestAnimationFrame(tick);                 // always continue — self-healing
    const r = hero.getBoundingClientRect();
    if (r.bottom < -60 || r.top > innerHeight + 60) return;   // hero off-screen → idle
    const total = r.height - innerHeight;
    target = clamp(-r.top / Math.max(total, 1), 0, 1);
    const prev = cur;
    cur = cur < 0 ? target : cur + (target - cur) * 0.16;
    if (Math.abs(target - cur) < 0.0004) cur = target;
    const idx = clamp(Math.round(cur * (N - 1)), 0, N - 1);
    if (idx !== lastIdx || prev < 0) { draw(idx); lastIdx = idx; }
    overlays(cur);
  }
  /* bfcache restore: rekick a frozen mid-load, or force a fresh draw */
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    if (started) { cur = -1; lastIdx = -1; requestAnimationFrame(tick); }
    else { started = false; loadAll(); }   // load aborted when the page froze
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { cur = -1; lastIdx = -1; } });
})();
