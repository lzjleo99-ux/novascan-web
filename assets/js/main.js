/* ============================================================
   NOVASCAN — site config + interactions
   ★ 中文注释：这里是你以后唯一需要改联系方式的地方 ★
   ============================================================ */
const SITE = {
  brand: 'NOVASCAN',                  // 品牌名（全站替换）
  tagline: 'REALITY CAPTURE STUDIO',  // 品牌副标
  email: 'hello@novascan.rs',         // TODO: 换成你的邮箱
  phone: '+381 60 000 0000',          // TODO: 换成你的电话（显示格式）
  whatsapp: '381600000000',           // TODO: WhatsApp 号码（纯数字，国际格式）
  address: 'Belgrade, Serbia',        // TODO: 详细地址
  instagram: '#',                     // TODO: 社交链接
  linkedin: '#',
};
/* ============================================================ */

(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ----- config injection ----- */
  $$('[data-cfg]').forEach(el => {
    const k = el.getAttribute('data-cfg');
    if (SITE[k] !== undefined) el.textContent = SITE[k];
  });
  $$('[data-cfg-href]').forEach(a => {
    const k = a.getAttribute('data-cfg-href');
    if (k === 'email') a.href = 'mailto:' + SITE.email;
    else if (k === 'phone') a.href = 'tel:' + SITE.phone.replace(/[^+\d]/g, '');
    else if (k === 'whatsapp') a.href = 'https://wa.me/' + SITE.whatsapp;
    else if (SITE[k] !== undefined) a.href = SITE[k];
  });

  /* ----- header ----- */
  const head = $('.site-head');
  const burger = $('.burger');
  const nav = $('nav.main');
  if (burger) burger.addEventListener('click', () => nav.classList.toggle('open'));
  const page = document.body.getAttribute('data-page');
  $$('nav.main a').forEach(a => { if (a.getAttribute('data-nav') === page) a.classList.add('on'); });

  /* ----- reveal on scroll ----- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.14 });
  $$('.rv').forEach(el => io.observe(el));

  /* ----- counters ----- */
  const fmt = () => new Intl.NumberFormat(document.documentElement.lang === 'sr' ? 'sr-Latn-RS' : 'en-US',
    { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, to = parseFloat(el.getAttribute('data-to'));
    const dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    const t0 = performance.now(), dur = 1400;
    (function step(t) {
      const k = Math.min(1, (t - t0) / dur), e2 = 1 - Math.pow(1 - k, 3);
      const v = (to * e2).toFixed(dec);
      el.textContent = new Intl.NumberFormat(document.documentElement.lang === 'sr' ? 'sr-Latn-RS' : 'en-US',
        { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(parseFloat(v));
      if (k < 1) requestAnimationFrame(step);
    })(t0);
    cio.unobserve(el);
  }), { threshold: 0.6 });
  $$('.count').forEach(el => cio.observe(el));

  /* ----- gallery ----- */
  const cases = $$('.case');
  $$('.filters button').forEach(b => b.addEventListener('click', () => {
    $$('.filters button').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    const f = b.getAttribute('data-f');
    cases.forEach(c => { c.style.display = (f === 'all' || c.getAttribute('data-cat') === f) ? '' : 'none'; });
  }));
  const modal = $('#caseModal');
  if (modal) {
    modal.addEventListener('click', e => { if (e.target === modal || e.target.classList.contains('bg') || e.target.classList.contains('x')) modal.classList.remove('open'); });
    addEventListener('keydown', e => { if (e.key === 'Escape') modal.classList.remove('open'); });
    cases.forEach(c => c.addEventListener('click', () => {
      $('#mImg').src = c.querySelector('img').src;
      $('#mTag').textContent = c.querySelector('.meta span').textContent;
      $('#mTitle').textContent = c.getAttribute('data-title');
      $('#mBody').textContent = c.getAttribute('data-body');
      $('#mDeliv').textContent = c.getAttribute('data-deliv');
      modal.classList.add('open');
    }));
  }

  /* ----- contact form (mailto + whatsapp, no backend needed) ----- */
  const form = $('#quoteForm');
  if (form) form.addEventListener('submit', ev => {
    ev.preventDefault();
    const d = Object.fromEntries(new FormData(form).entries());
    const body =
      'Name: ' + (d.name || '-') + '\n' +
      'Email: ' + (d.email || '-') + '\n' +
      'Phone: ' + (d.phone || '-') + '\n' +
      'Object type: ' + (d.type || '-') + '\n' +
      'Goal: ' + (d.goal || '-') + '\n' +
      'Size: ' + (d.size || '-') + '\n\n' + (d.msg || '');
    const wa = 'https://wa.me/' + SITE.whatsapp + '?text=' + encodeURIComponent(body);
    const hint = $('#formHint');
    if (hint) {
      hint.innerHTML =
        '<a class="btn btn-solid" href="mailto:' + SITE.email + '?subject=' +
        encodeURIComponent('Scan request — ' + (d.type || 'general')) + '&body=' + encodeURIComponent(body) +
        '">Open email draft</a> <a class="btn btn-ghost" target="_blank" href="' + wa + '">Send via WhatsApp</a>';
      hint.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      location.href = 'mailto:' + SITE.email + '?subject=' + encodeURIComponent('Scan request') + '&body=' + encodeURIComponent(body);
    }
  });

  /* ----- language ----- */
  function setLang(l) {
    document.documentElement.lang = l === 'sr' ? 'sr' : 'en';
    localStorage.setItem('nv-lang', l);
    $$('.lang button').forEach(b => b.classList.toggle('on', b.getAttribute('data-lang') === l));
    if (window.NV_I18N) window.NV_I18N.apply(l);
  }
  $$('.lang button').forEach(b => b.addEventListener('click', () => setLang(b.getAttribute('data-lang'))));
  setLang(localStorage.getItem('nv-lang') || 'en');
})();
