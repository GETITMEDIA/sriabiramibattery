/* ==========================================================================
   Sri Abirami Battery — 2026 interactions & animations
   Needs: jQuery + Owl (carousels), optional GSAP + ScrollTrigger + Lenis.
   Every feature degrades gracefully: if a library is missing, content stays
   visible and usable.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var html = doc.documentElement;
  var body = doc.body;
  var $ = window.jQuery;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var isMobile = function () { return window.innerWidth < 768; };
  var isDesktop = function () { return window.innerWidth >= 1024; };
  var hasGsap = !reduceMotion && !!(window.gsap && window.ScrollTrigger);

  function qs(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }

  html.classList.add('js');

  /* ---------- Preloader ---------- */
  (function preloader() {
    var loader = qs('.x-loader');
    if (!loader) return;
    var pct = qs('.x-loader__pct', loader);
    var start = performance.now();
    var done = false;

    function finish() {
      if (done) return;
      done = true;
      html.classList.add('is-loaded');
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }
    if (reduceMotion) { finish(); return; }

    (function tick(now) {
      var p = Math.min(1, (now - start) / 1100);
      if (pct) pct.textContent = Math.round(p * 100) + '%';
      if (p < 1 && !done) requestAnimationFrame(tick);
    })(start);

    var minTime = 1150, maxTime = 1500;
    window.addEventListener('load', function () {
      setTimeout(finish, Math.max(0, minTime - (performance.now() - start)));
    });
    setTimeout(finish, maxTime);
    var skip = qs('.x-loader__skip', loader);
    if (skip) skip.addEventListener('click', finish);
  })();

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }

  function scrollToTarget(target) {
    var headerOffset = -90;
    if (lenis) lenis.scrollTo(target, { offset: headerOffset });
    else {
      var y = (typeof target === 'number') ? target : target.getBoundingClientRect().top + window.pageYOffset + headerOffset;
      window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  /* ---------- Theme toggle ---------- */
  qsa('[data-theme-toggle]').forEach(function (btn) {
    function sync() {
      var dark = html.getAttribute('data-theme') === 'dark';
      btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
      var icon = qs('i', btn);
      if (icon) icon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
    }
    sync();
    btn.addEventListener('click', function () {
      var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      try { localStorage.setItem('sab-theme', next); } catch (e) { /* storage unavailable */ }
      qsa('[data-theme-toggle]').forEach(function (b) {
        b.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
        var i = qs('i', b);
        if (i) i.className = next === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
      });
    });
  });

  /* ---------- Scroll-driven UI: header, progress bar, back-to-top ---------- */
  var header = qs('.x-header');
  var progress = qs('.x-progress');
  var toTop = qs('.x-totop');
  var batt = toTop ? qs('.x-batt', toTop) : null;
  var battPct = toTop ? qs('.x-totop__pct', toTop) : null;
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset;
    var max = Math.max(1, doc.documentElement.scrollHeight - window.innerHeight);
    var p = Math.min(1, y / max);
    if (header) header.classList.toggle('is-scrolled', y > 40);
    if (progress) progress.style.transform = 'scaleX(' + p + ')';
    if (toTop) toTop.classList.toggle('is-visible', y > 480);
    if (batt) {
      var pc = Math.round(p * 100);
      batt.style.setProperty('--p', p.toFixed(3));
      batt.setAttribute('data-level', pc >= 70 ? 'high' : pc >= 35 ? 'mid' : 'low');
      toTop.classList.toggle('is-full', pc >= 99);
      if (battPct) battPct.textContent = pc + '%';
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', function () { scrollToTarget(0); });

  /* ---------- Top bar search ---------- */
  qsa('.x-search').forEach(function (box) {
    var btn = qs('.x-search__btn', box);
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = box.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) { var input = qs('input', box); if (input) setTimeout(function () { input.focus(); }, 50); }
    });
    doc.addEventListener('click', function (e) {
      if (!box.contains(e.target)) { box.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
    });
  });

  /* ---------- Desktop dropdowns on touch screens: first tap opens ---------- */
  if (!window.matchMedia('(hover: hover)').matches) {
    qsa('.x-header .x-nav__list > li.has-sub > a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var li = a.parentElement;
        if (!li.classList.contains('is-open')) {
          e.preventDefault();
          qsa('.x-header .x-nav__list > li.is-open').forEach(function (o) { o.classList.remove('is-open'); });
          li.classList.add('is-open');
        }
      });
    });
    doc.addEventListener('click', function (e) {
      if (!e.target.closest('.x-header .has-sub')) {
        qsa('.x-header .x-nav__list > li.is-open').forEach(function (o) { o.classList.remove('is-open'); });
      }
    });
  }

  /* ---------- Mobile drawer (menu cloned from the desktop nav) ---------- */
  (function drawer() {
    var panel = qs('.x-drawer');
    var src = qs('.x-header .x-nav__list');
    var slot = qs('.x-drawer__nav');
    var toggler = qs('.x-burger');
    if (!panel || !src || !slot || !toggler) return;

    var list = src.cloneNode(true);
    qsa(':scope > li', list).forEach(function (li, i) {
      li.style.setProperty('--i', i);
      if (li.classList.contains('has-sub')) {
        var a = qs(':scope > a', li);
        var btn = doc.createElement('button');
        btn.type = 'button';
        btn.className = 'x-sub-toggle';
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Show ' + (a ? a.textContent.trim() : '') + ' menu');
        btn.innerHTML = '<i class="fas fa-angle-down" aria-hidden="true"></i>';
        li.insertBefore(btn, qs(':scope > .x-sub', li));
        btn.addEventListener('click', function () {
          var open = li.classList.toggle('is-open');
          btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
      }
    });
    slot.appendChild(list);

    function open() {
      body.classList.add('menu-open');
      panel.inert = false;
      panel.setAttribute('aria-hidden', 'false');
      toggler.setAttribute('aria-expanded', 'true');
      if (lenis) lenis.stop();
      var close = qs('.x-drawer__close', panel);
      if (close) setTimeout(function () { close.focus(); }, 100);
    }
    function close() {
      body.classList.remove('menu-open');
      panel.inert = true;
      panel.setAttribute('aria-hidden', 'true');
      toggler.setAttribute('aria-expanded', 'false');
      if (lenis) lenis.start();
    }
    panel.inert = true;
    toggler.addEventListener('click', open);
    qsa('.x-drawer__close, .x-drawer__backdrop', panel).forEach(function (el) {
      el.addEventListener('click', function () { close(); toggler.focus(); });
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('menu-open')) { close(); toggler.focus(); }
    });
    qsa('a', panel).forEach(function (a) { a.addEventListener('click', close); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1200 && body.classList.contains('menu-open')) close(); });
  })();

  /* ---------- Desktop nav: sliding hover pill ---------- */
  (function navPill() {
    var list = qs('.x-header .x-nav__list');
    if (!list) return;
    var pill = doc.createElement('span');
    pill.className = 'x-nav__pill';
    pill.setAttribute('aria-hidden', 'true');
    list.appendChild(pill);
    function moveTo(a) {
      if (!a) { pill.style.opacity = '0'; return; }
      var lr = list.getBoundingClientRect(), r = a.getBoundingClientRect();
      pill.style.width = r.width + 'px';
      pill.style.transform = 'translateX(' + (r.left - lr.left) + 'px)';
      pill.style.opacity = '1';
    }
    qsa(':scope > li', list).forEach(function (li) {
      var a = qs(':scope > a', li);
      if (!a) return;
      li.addEventListener('mouseenter', function () { moveTo(a); });
      a.addEventListener('focus', function () { moveTo(a); });
    });
    list.addEventListener('mouseleave', function () { moveTo(null); });
    list.addEventListener('focusout', function (e) { if (!list.contains(e.relatedTarget)) moveTo(null); });
  })();

  /* ---------- Split headline words (recurses into highlight spans) ---------- */
  function splitWords(el) {
    var i = 0;
    (function walk(parent) {
      Array.prototype.slice.call(parent.childNodes).forEach(function (node) {
        if (node.nodeType === 1) { if (node.tagName !== 'BR') walk(node); return; }
        if (node.nodeType !== 3) return;
        var frag = doc.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(doc.createTextNode(' ')); return; }
          var w = doc.createElement('span');
          var wi = doc.createElement('span');
          w.className = 'w';
          wi.className = 'wi';
          wi.style.setProperty('--i', i++);
          wi.textContent = part;
          w.appendChild(wi);
          frag.appendChild(w);
        });
        parent.replaceChild(frag, node);
      });
    })(el);
    el.classList.add('x-split');
  }
  qsa('[data-split]').forEach(splitWords);

  /* ---------- Hero slider (text + framed image, synced) ---------- */
  (function heroSlider() {
    var hero = qs('.x-hero');
    if (!hero) return;
    var slides = qsa('.x-hslide', hero);
    var imgs = qsa('.x-hero__img', hero);
    var dots = qsa('.x-hero__dot', hero);
    var num = qs('[data-hero-num]', hero);
    if (slides.length < 2) return;
    var DUR = 6500, idx = 0, timer = null, started = 0, remaining = DUR, paused = false;
    hero.style.setProperty('--dur', DUR + 'ms');

    function go(n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        var on = i === idx;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
        s.inert = !on;
      });
      imgs.forEach(function (im, i) { im.classList.toggle('is-active', i === idx); });
      dots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === idx);
        d.classList.toggle('is-done', i < idx);
        d.setAttribute('aria-selected', i === idx ? 'true' : 'false');
        var bar = qs('i', d);
        if (bar) { bar.style.display = 'none'; void bar.offsetWidth; bar.style.display = ''; }
      });
      if (num) num.textContent = ('0' + (idx + 1)).slice(-2);
      remaining = DUR;
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      if (reduceMotion || paused) return;
      started = performance.now();
      timer = setTimeout(function () { go(idx + 1); }, remaining);
    }
    function pause() {
      if (paused) return;
      paused = true;
      hero.classList.add('is-paused');
      clearTimeout(timer);
      remaining = Math.max(400, remaining - (performance.now() - started));
    }
    function resume() {
      if (!paused) return;
      paused = false;
      hero.classList.remove('is-paused');
      schedule();
    }

    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); }); });
    var prev = qs('[data-hero-prev]', hero), next = qs('[data-hero-next]', hero);
    if (prev) prev.addEventListener('click', function () { go(idx - 1); });
    if (next) next.addEventListener('click', function () { go(idx + 1); });
    // pause while the visitor reads/uses the buttons or controls
    qsa('.x-hero__btns, .x-hero__ctrl', hero).forEach(function (el) {
      el.addEventListener('mouseenter', pause);
      el.addEventListener('mouseleave', resume);
    });
    hero.addEventListener('focusin', pause);
    hero.addEventListener('focusout', function (e) { if (!hero.contains(e.relatedTarget)) resume(); });
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) pause(); else resume(); });

    // swipe on the image frame
    var frame = hero, sx = null;
    if (frame) {
      frame.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
      frame.addEventListener('touchend', function (e) {
        if (sx === null) return;
        var dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
        sx = null;
      });
    }
    if (reduceMotion) hero.classList.add('is-paused');
    go(0);
  })();

  /* ---------- Carousels (Owl) ---------- */
  function labelOwl($c, name) {
    $c.find('.owl-prev').removeAttr('role').attr('aria-label', 'Previous ' + name);
    $c.find('.owl-next').removeAttr('role').attr('aria-label', 'Next ' + name);
    $c.find('.owl-dot').each(function (i) { this.setAttribute('aria-label', name + ' ' + (i + 1)); });
  }
  if ($ && $.fn.owlCarousel) {
    var $testi = $('.x-testi__slider');
    if ($testi.length) {
      $testi.addClass('owl-carousel').owlCarousel({
        loop: true, margin: 24, smartSpeed: 800, nav: false, dots: true, dotsEach: 1,
        autoplay: !reduceMotion, autoplayTimeout: 4500, autoplayHoverPause: true,
        responsive: { 0: { items: 1 }, 768: { items: 2 }, 1024: { items: 3 } }
      });
      labelOwl($testi, 'testimonial');
    }
  }

  /* ---------- Logo marquee: duplicate the set for a seamless loop ---------- */
  qsa('.x-marquee__track').forEach(function (track) {
    qsa(':scope > *', track).forEach(function (item) {
      var copy = item.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      qsa('a', copy).forEach(function (a) { a.setAttribute('tabindex', '-1'); });
      track.appendChild(copy);
    });
  });

  /* ---------- Counters & progress bars (IntersectionObserver) ---------- */
  function whenVisible(els, cb, threshold) {
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(cb); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { io.unobserve(en.target); cb(en.target); }
      });
    }, { threshold: threshold || 0.35 });
    els.forEach(function (el) { io.observe(el); });
  }

  var counters = qsa('.count-text[data-stop]');
  counters.forEach(function (el) {
    el.dataset.final = el.textContent;
    if (!reduceMotion) el.textContent = '0' + (el.dataset.suffix || '');
  });
  whenVisible(counters, function (el) {
    var target = parseFloat(el.dataset.stop) || 0;
    var suffix = el.dataset.suffix || '';
    var dur = Math.max(1200, parseInt(el.dataset.speed, 10) || 1500);
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var t0 = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  });

  var bars = qsa('.x-bar__fill[data-percent]');
  bars.forEach(function (el) { el.style.setProperty('--p', (parseFloat(el.dataset.percent) || 0) / 100); });
  // observe the track: the fill starts at scaleX(0), which has no visible area
  whenVisible(bars.map(function (el) { return el.parentElement; }), function (track) {
    var fill = track.querySelector('.x-bar__fill');
    if (fill) fill.classList.add('is-in');
  }, 0.5);
  whenVisible(qsa('.x-skills__visual'), function (el) { el.classList.add('is-in'); }, 0.25);

  /* ---------- Lazy images: blur-up until loaded ---------- */
  qsa('img[loading="lazy"]').forEach(function (img) {
    if (img.complete && img.naturalWidth) return;
    img.classList.add('is-loading');
    var clear = function () { img.classList.remove('is-loading'); };
    img.addEventListener('load', clear, { once: true });
    img.addEventListener('error', clear, { once: true });
  });

  /* ---------- Newsletter form → WhatsApp chat ---------- */
  qsa('form[data-wa-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (form.elements.name && form.elements.name.value || '').trim();
      var email = (form.elements.email && form.elements.email.value || '').trim();
      var msg = 'Hi Sri Abirami Battery, I would like to subscribe for latest news and offers.' +
        (name ? '\nName: ' + name : '') + (email ? '\nEmail: ' + email : '');
      window.open(form.action + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
      form.reset();
    });
  });

  /* ---------- Button ripple ---------- */
  doc.addEventListener('pointerdown', function (e) {
    var btn = e.target.closest('.x-btn');
    if (!btn || reduceMotion) return;
    var r = btn.getBoundingClientRect();
    var size = Math.max(r.width, r.height) * 2;
    var s = doc.createElement('span');
    s.className = 'x-ripple';
    s.style.width = s.style.height = size + 'px';
    s.style.left = (e.clientX - r.left - size / 2) + 'px';
    s.style.top = (e.clientY - r.top - size / 2) + 'px';
    btn.appendChild(s);
    s.addEventListener('animationend', function () { s.remove(); });
  });

  /* ---------- Desktop-only pointer effects: magnetic, tilt, cursor ---------- */
  if (finePointer && !reduceMotion) {
    qsa('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.25;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.35;
        el.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });

    qsa('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        if (!isDesktop()) return;
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.classList.add('is-tilting');
        el.style.setProperty('--ry', (px * 7).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-py * 7).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('is-tilting');
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });

    if (isDesktop()) {
      var dot = doc.createElement('div');
      var ringEl = doc.createElement('div');
      dot.className = 'x-cursor';
      ringEl.className = 'x-cursor-ring';
      dot.setAttribute('aria-hidden', 'true');
      ringEl.setAttribute('aria-hidden', 'true');
      body.appendChild(dot);
      body.appendChild(ringEl);
      var mx = -100, my = -100, rx = -100, ry = -100, started = false;
      doc.addEventListener('pointermove', function (e) {
        mx = e.clientX; my = e.clientY;
        dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
        if (!started) { started = true; rx = mx; ry = my; html.classList.add('has-cursor'); }
        html.classList.remove('cursor-out');
      });
      doc.addEventListener('mouseleave', function () { html.classList.add('cursor-out'); });
      doc.addEventListener('mouseover', function (e) {
        ringEl.classList.toggle('is-hover', !!e.target.closest('a, button, [data-tilt], input'));
      });
      (function follow() {
        rx += (mx - rx) * 0.18;
        ry += (my - ry) * 0.18;
        ringEl.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px)';
        requestAnimationFrame(follow);
      })();
    }
  }

  /* ---------- Links: smooth anchors + page fade transition ---------- */
  doc.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest('a[href]');
    if (!a || a.hasAttribute('download') || a.hasAttribute('data-fancybox')) return;
    if (a.target && a.target !== '_self') return;
    var url;
    try { url = new URL(a.getAttribute('href'), window.location.href); } catch (err) { return; }
    if (url.origin !== window.location.origin || !/^https?:|^file:/.test(url.protocol)) return;

    var samePage = url.pathname === window.location.pathname && url.search === window.location.search;
    if (samePage && url.hash) {
      var target = url.hash.length > 1 ? doc.getElementById(decodeURIComponent(url.hash.slice(1))) : null;
      if (target) {
        e.preventDefault();
        scrollToTarget(target);
        if (history.replaceState) history.replaceState(null, '', url.hash);
      }
      return;
    }
    if (samePage) return;
    if (!/(\.html?|\/)$/.test(url.pathname) || reduceMotion) return;
    e.preventDefault();
    html.classList.add('is-leaving');
    setTimeout(function () { window.location.href = url.href; }, 260);
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) html.classList.remove('is-leaving'); });

  /* ---------- GSAP scroll animations ---------- */
  if (!hasGsap) return;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);

  var d = isMobile() ? 26 : 50;
  var from = {
    up: { y: d }, left: { x: -d }, right: { x: d },
    scale: { scale: 0.92 }, fade: {}
  };
  var revealEls = qsa('[data-reveal]');
  revealEls.forEach(function (el) {
    gsap.set(el, Object.assign({ autoAlpha: 0 }, from[el.dataset.reveal] || from.up));
  });
  ST.batch(revealEls, {
    start: 'top 88%',
    once: true,
    onEnter: function (batch) {
      gsap.to(batch, { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 1, ease: 'power3.out', stagger: 0.1, overwrite: true, clearProps: 'transform' });
    }
  });

  qsa('[data-clip]').forEach(function (el) {
    var img = qs('img', el);
    var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    tl.fromTo(el, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'power4.out', clearProps: 'clipPath' });
    if (img) tl.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 1.6, ease: 'power3.out', clearProps: 'transform' }, 0);
  });

  ST.matchMedia({
    '(min-width: 1024px)': function () {
      // Hero copy drifts up and fades as you scroll past it
      gsap.to('.x-hero__copy, .x-hero__ctrl', {
        yPercent: 14, opacity: 0.2, ease: 'none',
        scrollTrigger: { trigger: '.x-hero', start: 'top top', end: 'bottom top', scrub: true }
      });
      gsap.to('.x-hero__slides', {
        yPercent: 18, ease: 'none',
        scrollTrigger: { trigger: '.x-hero', start: 'top top', end: 'bottom top', scrub: true }
      });
      qsa('[data-parallax]').forEach(function (el) {
        var amt = parseFloat(el.dataset.parallax) || 40;
        gsap.fromTo(el, { y: amt }, {
          y: -amt, ease: 'none',
          scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
    }
  });

  // Working process: line draws, steps light up in order
  var steps = qs('.x-steps');
  if (steps) {
    var fill = qs('.x-steps__fill', steps);
    var items = qsa('.x-step', steps);
    var vertical = window.matchMedia('(max-width: 767px)');
    steps.classList.add('js-steps');
    ST.create({
      trigger: steps,
      start: 'top 75%',
      end: 'bottom 55%',
      onUpdate: function (self) {
        var p = self.progress;
        if (fill) fill.style.transform = vertical.matches ? 'scaleY(' + p + ')' : 'scaleX(' + p + ')';
        items.forEach(function (s, i) {
          s.classList.toggle('is-active', p >= (i / Math.max(1, items.length - 1)) * 0.97);
        });
      },
      onRefresh: function (self) { self.vars.onUpdate(self); }
    });
  }

  window.addEventListener('load', function () { ST.refresh(); });
})();
