/* ============================================================
   NOVASCAN — site config + interactions
   ★ 中文注释：这里是你以后唯一需要改联系方式的地方 ★
   ============================================================ */
const SITE = {
  brand: 'NOVASCAN',                  // 品牌名（全站替换）
  tagline: 'REALITY CAPTURE STUDIO',  // 品牌副标
  email: 'info@biopoly.rs',              // 联系邮箱
  phone: '+381 64 8086125',           // 电话（显示格式）
  whatsapp: '381648086125',           // WhatsApp 号码（纯数字，国际格式）
  viber: 'https://viber.me/381648086125', // Viber 聊天链接（Business 账号）
  address: 'Novi Sad, Serbia',        // 地址
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
    else if (k === 'viber') a.href = SITE.viber;
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

  /* ----- contact form (FormSubmit.co → info@biopoly.rs, no backend needed) -----
     Form posts via fetch to FormSubmit; on success the form data is emailed
     directly to SITE.email. First-ever submission triggers a one-time
     activation email — click the link in that email to start receiving. */
  const form = $('#quoteForm');
  if (form) form.addEventListener('submit', ev => {
    ev.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    const sr = document.documentElement.lang === 'sr';
    btn.textContent = sr ? 'Slanje…' : 'Sending…';
    btn.disabled = true;

    const data = new FormData(form);
    data.append('_subject', '3D Scanning Service Request — ' + (data.get('name') || 'Website enquiry'));
    data.append('_template', 'table');

    fetch('https://formsubmit.co/ajax/' + SITE.email, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    })
      .then(r => r.json())
      .then(j => {
        if (j.success === 'true' || j.success) {
          form.style.display = 'none';
          const ok = $('#formHint') || document.createElement('div');
          ok.id = 'formHint';
          ok.innerHTML =
            '<div class="panel rv in" style="text-align:center;padding:40px 24px">' +
            '<div style="font-size:42px;margin-bottom:12px">✓</div>' +
            '<h3 style="font:600 22px/1.3 var(--fd);margin-bottom:8px">' +
            (sr ? 'Hvala! Poruka je poslata.' : 'Thank you! Your message has been sent.') + '</h3>' +
            '<p style="color:var(--mut);font-size:14px;line-height:1.6">' +
            (sr ? 'Odgovaramo na <b>info@biopoly.rs</b> u toku dana. Proverite i spam folder ako ne vidite odgovor.'
                : 'We reply to <b>info@biopoly.rs</b> within the same day. Please also check your spam folder if you don\'t see a reply.') +
            '</p></div>';
          ok.style.marginTop = '0';
          form.parentNode.insertBefore(ok, form.nextSibling);
          ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          throw new Error('not successful');
        }
      })
      .catch(() => {
        btn.textContent = orig;
        btn.disabled = false;
        const hint = $('#formHint');
        if (hint) {
          const wa = 'https://wa.me/' + SITE.whatsapp + '?text=' + encodeURIComponent(
            'Name: ' + (data.get('name') || '-') + '\nEmail: ' + (data.get('email') || '-') +
            '\nPhone: ' + (data.get('phone') || '-') + '\nType: ' + (data.get('type') || '-') +
            '\nGoal: ' + (data.get('goal') || '-') + '\nSize: ' + (data.get('size') || '-') +
            '\n\n' + (data.get('msg') || ''));
          hint.innerHTML =
            '<p style="color:var(--acc);font-size:13px;margin-bottom:10px">' +
            (sr ? 'Greška pri slanju — pokušajte putem WhatsApp-a ili Viber-a:'
                : 'Submission error — please try via WhatsApp or Viber:') + '</p>' +
            '<a class="btn btn-ghost" target="_blank" href="' + wa + '">WhatsApp</a>' +
            ' <a class="btn btn-ghost" target="_blank" href="' + SITE.viber + '">Viber</a>';
        }
      });
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
