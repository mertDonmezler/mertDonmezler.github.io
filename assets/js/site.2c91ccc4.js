/* site.js — v11: film katmanı. GSAP + ScrollTrigger + Lenis (yerel kopyalar). Satır maskeleri, medya açılışı, parallax,
   sabitlenen yatay ray, yapışkan süreç medyası, karşıt yönlü şerit, hero klip döngüsü, gizlenen nav, video oynat/durdur,
   menü, galeri, form (Web3Forms → WhatsApp yedek). prefers-reduced-motion → hareket yok, her şey görünür. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement, RM = matchMedia('(prefers-reduced-motion: reduce)').matches, FINE = matchMedia('(pointer:fine)').matches;
  var DESK = function () { return innerWidth >= 1024; };
  var C = window.CS_CONFIG || {};
  var G = window.gsap, ST = window.ScrollTrigger, GS = !!(G && ST) && !RM;
  if (GS) { G.registerPlugin(ST); root.classList.add('gs'); } else root.classList.remove('gs');
  var NAVH = parseInt(getComputedStyle(root).getPropertyValue('--nav')) || 72;

  /* ---- Lenis (ince imleç) + GSAP ticker ---- */
  var lenis = null;
  if (!RM && window.Lenis && FINE) {
    lenis = new Lenis({ lerp: 0.11, smoothWheel: true }); root.classList.add('lenis');
    if (GS) { lenis.on('scroll', ST.update); G.ticker.add(function (t) { lenis.raf(t * 1000); }); G.ticker.lagSmoothing(0); }
    else (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
  }
  function scrollTo(target) { var el = typeof target === 'string' ? $(target) : target; if (!el) return; if (lenis) lenis.scrollTo(el, { offset: -NAVH - 8 }); else { var y = el.getBoundingClientRect().top + scrollY - NAVH - 8; scrollTo0(y); } }
  function scrollTo0(y) { try { window.scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' }); } catch (e) { window.scrollTo(0, y); } }
  $$('a[href^="#"]').forEach(function (a) { a.addEventListener('click', function (e) { var h = a.getAttribute('href'); if (h === '#top') { e.preventDefault(); if (lenis) lenis.scrollTo(0); else scrollTo0(0); return; } if (h.length > 1 && $(h)) { e.preventDefault(); scrollTo(h); } }); });

  /* ---- sayfa geçişi: iç bağlantıda kısa solma ---- */
  if (!RM) document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]'); if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if ((a.target && a.target !== '_self') || a.hasAttribute('download') || a.origin !== location.origin) return;
    var href = a.getAttribute('href'); if (!href || href[0] === '#' || /^(mailto|tel):/.test(href)) return;
    if (a.pathname === location.pathname && a.hash) return;
    e.preventDefault(); root.classList.add('leaving'); setTimeout(function () { location.href = a.href; }, 220);
  });
  addEventListener('pageshow', function (e) { if (e.persisted) root.classList.remove('leaving'); });

  /* ---- menü ---- */
  var bg = $('#burger'), dr = $('#drawer');
  function closeDr() { if (!dr) return; dr.hidden = true; bg.setAttribute('aria-expanded', 'false'); }
  if (bg && dr) {
    bg.addEventListener('click', function () { var open = bg.getAttribute('aria-expanded') !== 'true'; dr.hidden = !open; bg.setAttribute('aria-expanded', String(open)); if (open) nav.classList.remove('hide'); });
    $$('a', dr).forEach(function (a) { a.addEventListener('click', closeDr); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDr(); });
  }

  /* ---- nav: koyu hero üstünde saydam; aşağı kaydırırken gizlen, yukarıda geri gel ---- */
  var nav = $('#nav'), lastY = 0, wall = $('.hero-wall'), darkTop = !!wall || document.body.classList.contains('dark-top');
  if (nav && darkTop) nav.classList.add('over');
  function onScroll(y) {
    if (!nav) return; nav.classList.toggle('scrolled', y > 8 && !(darkTop && y < 40));
    if (darkTop) nav.classList.toggle('over', y < 40);
    if (dr && !dr.hidden) { nav.classList.remove('hide'); lastY = y; return; }
    if (y > lastY + 6 && y > 240) nav.classList.add('hide'); else if (y < lastY - 6 || y < 240) nav.classList.remove('hide');
    lastY = y;
  }
  if (lenis) lenis.on('scroll', function (e) { onScroll(e.scroll); }); else addEventListener('scroll', function () { onScroll(scrollY); }, { passive: true });

  /* ---- satır maskeleri: düz metinli h1/h2 otomatik sarılır; .in ile yükselir ---- */
  $$('h1, h2, .fcta h2').forEach(function (h) {
    if (h.querySelector('.msk') || h.children.length || !h.textContent.trim()) return;
    if (h.closest('.consent, .prose')) return;
    h.innerHTML = '<span class="msk"><span class="ln">' + h.innerHTML + '</span></span>';
  });
  function revealMasks(scope) { $$('.msk', scope).forEach(function (m, i) { m.style.transitionDelay = (i * 90) + 'ms'; var ln = m.querySelector('.ln'); if (ln) ln.style.transitionDelay = (i * 90) + 'ms'; m.classList.add('in'); }); }

  /* ---- hero girişi (video duvarı: panolar kademeli yükselir; metin maskeleri; alt şerit) ---- */
  var heroCopy = $('.hero-copy'), heroPanel = $('.hero-panel'), wpanels = $$('.hero-wall .wpanel'), heroFoot = $('.hero-foot');
  function heroIn() {
    if (heroPanel) heroPanel.classList.add('in');
    wpanels.forEach(function (p, i) { p.style.transitionDelay = (i * 140) + 'ms'; p.classList.add('in'); });
    if (heroCopy) { revealMasks(heroCopy); heroCopy.classList.add('in'); }
    if (heroFoot) heroFoot.classList.add('in');
  }
  if (GS) setTimeout(heroIn, 120); else heroIn();
  /* duvar videoları: yan panolar yalnız masaüstünde yüklenir */
  if (wall && innerWidth >= 960) $$('.wpanel.side video', wall).forEach(function (v) { if (v.preload === 'none') { v.preload = 'auto'; v.load(); var p = v.play(); if (p && p.catch) p.catch(function () { }); } });

  /* ---- hero klip döngüsü (1080p webm/mp4; sonrakiler görünürken yüklenir) ---- */
  (function () {
    if (!heroPanel || RM) return;
    var names = (heroPanel.dataset.clips || '').split(',').filter(Boolean); if (names.length < 2) return;
    var vids = [heroPanel.querySelector('video')], idx = 0, visible = true, timer = null;
    function make(n) { var v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'none'; v.className = 'alt'; v.poster = '/assets/video/' + n + '-poster.webp'; ['webm', 'mp4'].forEach(function (ext) { var s = document.createElement('source'); s.src = '/assets/video/' + n + '-1080.' + ext; s.type = 'video/' + ext; v.appendChild(s); }); heroPanel.appendChild(v); return v; }
    for (var i = 1; i < names.length; i++) vids.push(make(names[i]));
    function prep(v) { if (v.preload === 'none') { v.preload = 'auto'; v.load(); } }
    var busy = false;
    function next() {
      if (!visible || busy || document.hidden) return;
      var cur = vids[idx], nx = vids[(idx + 1) % vids.length];
      busy = true; prep(nx);
      var done = false, swap = function () { if (done) return; done = true; nx.classList.add('on'); cur.classList.remove('on'); setTimeout(function () { cur.pause(); busy = false; }, 1000); idx = (idx + 1) % vids.length; prep(vids[(idx + 1) % vids.length]); };
      /* yeni klip gerçekten kare vermeye başlayınca geçiş yap; 2 sn içinde başlamazsa vazgeç (pano boş kalmasın) */
      nx.addEventListener('playing', swap, { once: true });
      var p = nx.play(); if (p && p.catch) p.catch(function () { });
      setTimeout(function () { if (!done) { done = true; nx.removeEventListener('playing', swap); nx.pause(); busy = false; } }, 2000);
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { en.forEach(function (e) { visible = e.isIntersecting; var cur = vids[idx]; if (visible) { var p = cur.play(); if (p && p.catch) p.catch(function () { }); } else cur.pause(); }); }, { threshold: .1 }).observe(heroPanel);
    vids[0].addEventListener('playing', function () { setTimeout(function () { prep(vids[1]); }, 2500); }, { once: true });
    timer = setInterval(next, 9000);
  })();

  /* ---- görünürken yükselme (.rv) + medya açılışı (.rvm) + başlık maskeleri ---- */
  (function reveal() {
    var auto = $$('.sec .lede, .rail-head .lede, .strip-head .lede, .chapter .lede, .chapter .plain, .chapter .acts, .pgrid .prod, .cats .cat, .zones .zone, .facts .fact, .ccards .ccard, .cards3 .card3, .jrow .jtxt, .steps-list li, .row, .two > div, .paths .path, .cta, .band-in > div, .shero .cut, .gallery-main, .pdp-info, .proc-foot, .strip-foot, .fcta p, .fcta .acts, .rail-head .tl');
    auto.forEach(function (el) { if (!el.hasAttribute('data-rv') && !el.closest('[data-rv]') && !el.closest('.hero-copy')) el.classList.add('rv'); });
    $$('.ph, .jmed, .vpanel:not(.hero-panel), .pm-stack, .band > img, .band > video, .phero > video, .phero > img').forEach(function (el) { el.classList.add('rvm'); });
    var els = $$('[data-rv], .rv, .rvm, h1, h2').filter(function (el) { return !el.closest('.hero-copy'); });
    function show(el) { if (el.matches('h1, h2')) revealMasks(el); else el.classList.add('in'); }
    if (RM || !('IntersectionObserver' in window)) { els.forEach(show); return; }
    var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (!e.isIntersecting) return; var el = e.target; if (!el.matches('h1, h2, .rvm')) { var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0; el.style.transitionDelay = Math.min(sib, 5) * 70 + 'ms'; } show(el); io.unobserve(el); }); }, { rootMargin: '0px 0px -6% 0px', threshold: .06 });
    els.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight * .92 && r.bottom > 0) show(el); else io.observe(el); });
    setTimeout(function () { els.forEach(show); }, 6000);
  })();

  /* ---- GSAP: parallax, ray, süreç, şerit ---- */
  if (GS) {
    /* video duvarı: panolar farklı hızda kayar (derinlik), metin yukarı çekilip solar */
    if (wall) G.matchMedia().add('(min-width: 960px)', function () {
      var tws = $$('.wpanel', wall).map(function (p, i) { var m = p.querySelector('video, img'); var sp = [0.7, 1.15, 0.9][i] || 1; return m ? G.fromTo(m, { yPercent: -4 * sp }, { yPercent: 4 * sp, ease: 'none', scrollTrigger: { trigger: wall, start: 'top top', end: 'bottom top', scrub: true } }) : null; }).filter(Boolean);
      if (heroCopy) tws.push(G.to(heroCopy, { y: -90, opacity: 0, ease: 'none', scrollTrigger: { trigger: wall, start: 'top top', end: '70% top', scrub: true } }));
      return function () { tws.forEach(function (t) { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); }); };
    });
    /* hero (bölünmüş sürüm): kaydırırken pano geride kalır, metin hafif solar (derinlik) */
    if (heroPanel && heroCopy) G.matchMedia().add('(min-width: 960px)', function () {
      var t1 = G.to(heroPanel, { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.hero-split', start: 'top top', end: 'bottom top', scrub: true } });
      var t2 = G.to(heroCopy, { y: -70, opacity: .15, ease: 'none', scrollTrigger: { trigger: '.hero-split', start: 'top top', end: 'bottom top', scrub: true } });
      return function () { [t1, t2].forEach(function (t) { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); }); G.set([heroPanel, heroCopy], { clearProps: 'transform,opacity' }); };
    });
    /* parallax: [data-par] içindeki medya */
    $$('[data-par]').forEach(function (el) { var m = el.querySelector('img, video'); if (!m) return; G.fromTo(m, { yPercent: -6, scale: 1.14 }, { yPercent: 6, scale: 1.14, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } }); });
    /* ray: masaüstünde bölüm sabitlenir, kartlar yatay kayar */
    var rail = $('[data-rail]');
    if (rail) {
      var track = rail.querySelector('.rail-track'), sec = rail.closest('.rail-sec'), bar = $('.rail-bar i');
      var mm = G.matchMedia();
      mm.add('(min-width: 1024px)', function () {
        var dist = function () { return Math.max(0, track.scrollWidth - innerWidth); };
        var tw = G.to(track, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: { trigger: sec, start: 'top ' + NAVH, end: function () { return '+=' + dist(); }, pin: true, scrub: .8, anticipatePin: 1, invalidateOnRefresh: true, onUpdate: function (s) { if (bar) bar.style.width = (12 + 88 * s.progress) + '%'; } } });
        return function () { tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill(); G.set(track, { x: 0 }); };
      });
    }
    /* şerit: iki sıra karşıt yönde */
    var strip = $('[data-strip]');
    if (strip) {
      G.matchMedia().add('(min-width: 1024px)', function () {
        var tws = $$('.srow', strip).map(function (row) {
          var dir = +(row.dataset.dir || 1), d = function () { return Math.max(0, row.scrollWidth - innerWidth); };
          return G.fromTo(row, { x: function () { return dir > 0 ? 0 : -d(); } }, { x: function () { return dir > 0 ? -d() : 0; }, ease: 'none', scrollTrigger: { trigger: strip.closest('.strip-sec'), start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
        });
        return function () { tws.forEach(function (t) { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); }); };
      });
    }
    addEventListener('load', function () { ST.refresh(); });
  } else {
    var r0 = $('[data-rail]'); if (r0 && DESK()) r0.classList.add('native');
    var s0 = $('[data-strip]'); if (s0 && DESK()) s0.classList.add('native');
  }

  /* ---- süreç: ortadaki adım aktif, yapışkan medya değişir ---- */
  (function () {
    var proc = $('[data-proc]'); if (!proc) return;
    var steps = $$('.proc-steps li', proc), media = $$('.pm-stack [data-step]', proc), cap = $('[data-cap]', proc);
    function setStep(i) { steps.forEach(function (li, k) { li.classList.toggle('on', k === i); }); media.forEach(function (m, k) { m.classList.toggle('on', k === i); }); if (cap && steps[i]) cap.textContent = steps[i].dataset.cap || ''; }
    if (GS) steps.forEach(function (li, i) { ST.create({ trigger: li, start: 'top 55%', end: 'bottom 45%', onEnter: function () { setStep(i); }, onEnterBack: function () { setStep(i); } }); });
    else if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) setStep(steps.indexOf(e.target)); }); }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 }); steps.forEach(function (li) { io.observe(li); }); }
  })();

  /* ---- videolar: görünürken oynat ---- */
  (function () {
    var vids = $$('video[autoplay]'); if (!vids.length) return;
    if (RM) { vids.forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); }); return; }
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (en) { en.forEach(function (e) { var v = e.target; if (v.classList.contains('alt')) return; /* hero panosunu kendi döngüsü yönetir */ if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () { }); } else v.pause(); }); }, { threshold: .12 });
    vids.forEach(function (v) { io.observe(v); });
  })();

  /* ---- ürün galerisi ---- */
  (function () { var m = $('#gimg'), t = $('#gthumbs'); if (!m || !t) return; t.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; m.style.transition = 'opacity .15s'; m.style.opacity = '0'; setTimeout(function () { m.src = b.dataset.src; m.style.transition = 'opacity .3s'; m.style.opacity = '1'; }, 150); $$('button', t).forEach(function (x) { x.setAttribute('aria-current', String(x === b)); }); }); })();

  /* ---- form ---- */
  (function form() {
    var f = $('#qf'); if (!f) return;
    var msg = $('#qmsg'), seg = 'Spor salonu';
    $$('.seg button', f).forEach(function (b) { b.addEventListener('click', function () { $$('.seg button', f).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true'); seg = b.textContent.trim(); }); });
    try { var q = new URLSearchParams(location.search), u = q.get('urun'), g = q.get('grup'), nn = f.querySelector('[name=not]'); if (nn && (u || g) && !nn.value) nn.value = u ? 'İlgilendiğim ürün: ' + decodeURIComponent(u).replace(/-/g, ' ') : 'İlgilendiğim grup: ' + g.replace(/-/g, ' '); } catch (e) { }
    f.addEventListener('submit', function (e) {
      e.preventDefault(); if ((f.querySelector('[name=botcheck]') || {}).checked) return;
      var ad = f.ad.value.trim(), tel = f.tel.value.trim(), ek = [];
      if (!ad) ek.push('ad soyad'); if (!tel) ek.push('telefon'); if (!f.sehir.value.trim()) ek.push('şehir');
      if (ek.length) { msg.hidden = false; msg.className = 'msg err'; msg.innerHTML = '<b>Eksik alan var.</b>Lütfen şunları doldurun: ' + ek.join(', ') + '.'; return; }
      var ozet = ['Kullanım: ' + seg, 'Ad: ' + ad, 'Tel: ' + tel, 'Şehir: ' + f.sehir.value.trim(), f.m2.value ? 'Alan: ' + f.m2.value + ' m²' : '', f.butce.value ? 'Bütçe: ' + f.butce.value : '', f.zaman.value ? 'Zaman: ' + f.zaman.value : '', f.not.value.trim() ? 'Not: ' + f.not.value.trim() : ''].filter(Boolean).join('\n');
      var wa = 'https://wa.me/' + (C.WA_NUMBER || '905532448510') + '?text=' + encodeURIComponent('Teklif talebi\n' + ozet);
      if (!C.FORM_KEY) { location.href = wa; return; }
      var btn = f.querySelector('[type=submit]'), old = btn.textContent; btn.disabled = true; btn.textContent = 'Gönderiliyor…';
      fetch(C.FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ access_key: C.FORM_KEY, subject: 'canspor.com.tr — Teklif talebi (' + seg + ')', from_name: 'canspor.com.tr', name: ad, phone: tel, city: f.sehir.value.trim(), area_m2: f.m2.value, budget: f.butce.value, timeline: f.zaman.value, notes: f.not.value.trim(), usage: seg, message: ozet, botcheck: '' }) })
        .then(function (r) { return r.json(); }).then(function (j) { if (j && j.success) location.href = '/tesekkurler/'; else throw new Error(); })
        .catch(function () { btn.disabled = false; btn.textContent = old; msg.hidden = false; msg.className = 'msg err'; msg.innerHTML = '<b>Form gönderilemedi.</b>Tekrar deneyin ya da <a href="' + wa + '">WhatsApp’tan yazın</a>.'; });
    });
  })();
})();
