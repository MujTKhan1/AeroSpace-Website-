(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.site-header');
  const shared = (window.__beacon ||= { hero: 0 });
  const hasGsap = window.gsap && window.ScrollTrigger;

  // ---------- Mobile navigation ----------
  const toggle = document.querySelector('.menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    mobileNav.hidden = !open;
  }
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // ---------- Smooth scrolling ----------
  let lenis;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = time => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    const target = id === '#top' ? 0 : document.querySelector(id);
    if (target === null) return;
    e.preventDefault();
    setMenu(false);
    if (lenis) lenis.scrollTo(target, { offset: id === '#top' ? 0 : -40, duration: 1.4 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    if (target !== 0) history.replaceState(null, '', id);
  });

  // ---------- Contact form (no endpoint is connected yet) ----------
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let firstInvalid;
    for (const field of form.querySelectorAll('[required]')) {
      const ok = field.checkValidity() && field.value.trim() !== '';
      field.setAttribute('aria-invalid', String(!ok));
      if (!ok && !firstInvalid) firstInvalid = field;
    }
    if (firstInvalid) {
      status.className = 'form-status is-error';
      status.textContent = 'Please complete the required fields highlighted above.';
      firstInvalid.focus();
      return;
    }
    status.className = 'form-status';
    status.textContent = 'Thank you. This preview is not yet connected to an inquiry service, so nothing has been sent.';
  });
  form.addEventListener('input', e => { if (e.target.getAttribute('aria-invalid') === 'true' && e.target.checkValidity()) e.target.removeAttribute('aria-invalid'); });

  // ---------- Header theme ----------
  const shell = document.querySelector('.light-shell');
  const footer = document.querySelector('.site-footer');
  function updateHeader() {
    const y = header.offsetHeight / 2;
    header.classList.toggle('is-scrolled', scrollY > 20);
    const onLight = shell.getBoundingClientRect().top <= y && footer.getBoundingClientRect().top > y;
    header.dataset.theme = onLight ? 'light' : 'dark';
  }
  addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  if (!hasGsap || reduced) {
    root.classList.remove('motion');
    // Still let the static hero respond to the light page covering it.
    addEventListener('scroll', () => {
      shared.hero = Math.min(Math.max(scrollY / innerHeight, 0), 1);
      dispatchEvent(new Event('beacon:scroll'));
    }, { passive: true });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Split headings into masked words, keeping <em> styling.
  function splitWords(node) {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          const w = document.createElement('span'); w.className = 'w';
          const inner = document.createElement('span'); inner.textContent = part;
          w.append(inner); frag.append(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) splitWords(child);
    }
  }
  document.querySelectorAll('.split').forEach(el => { el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim()); splitWords(el); el.querySelectorAll('.w').forEach(w => w.setAttribute('aria-hidden', 'true')); });

  // ---------- Hero entrance ----------
  gsap.set('.hero-inner', { autoAlpha: 1 });
  root.classList.remove('motion');
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('.site-header', { y: -30, autoAlpha: 0, duration: 1.2 }, .1)
    .from('.hero-kicker', { y: 20, autoAlpha: 0, duration: 1.1 }, .3)
    .from('.hero-title .line > span', { yPercent: 110, duration: 1.5, stagger: .12 }, .35)
    .from('.hero-lede', { y: 24, autoAlpha: 0, duration: 1.3 }, .8)
    .from('.hero-actions > *', { y: 20, autoAlpha: 0, duration: 1.1, stagger: .08 }, .95)
    .from('.hero-foot', { autoAlpha: 0, duration: 1.4 }, 1.2)
    .from('#space-canvas', { scale: 1.08, duration: 2.6, ease: 'power3.out' }, 0);

  // Light page slides over the pinned hero.
  gsap.timeline({
    scrollTrigger: {
      trigger: shell, start: 'top bottom', end: 'top top', scrub: true,
      onUpdate: self => { shared.hero = self.progress; }
    }
  })
    .to('.hero-inner', { y: -120, autoAlpha: 0, ease: 'none' }, 0)
    .to('.hero-foot', { autoAlpha: 0, ease: 'none', duration: .4 }, 0)
    .to('.hero-stage', { scale: .94, filter: 'brightness(.45)', ease: 'none' }, 0);

  // ---------- Section reveals ----------
  gsap.utils.toArray('.split').forEach(el => {
    gsap.from(el.querySelectorAll('.w > span'), {
      yPercent: 105, duration: 1.1, ease: 'expo.out', stagger: .035,
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });
  gsap.utils.toArray('.reveal').forEach(el => {
    gsap.from(el, { y: 30, autoAlpha: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  ScrollTrigger.batch('.reveal-card', {
    start: 'top 88%',
    onEnter: batch => gsap.from(batch, { y: 60, autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: .1, overwrite: true }),
    once: true
  });
  ScrollTrigger.batch('.reveal-row', {
    start: 'top 92%',
    onEnter: batch => gsap.from(batch, { x: -30, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: .08 }),
    once: true
  });

  // Gap: the connection draws in, then breaks.
  gsap.timeline({ scrollTrigger: { trigger: '.gap-board', start: 'top 75%' } })
    .from('.gap-line', { scale: 0, duration: .9, ease: 'power2.inOut', stagger: .15 })
    .from('.gap-break', { scale: 0, rotate: -90, duration: .8, ease: 'back.out(2)' }, '-=.4')
    .from('.record-col-alert .status', { autoAlpha: 0, x: 10, duration: .5, stagger: .08 }, '-=.3');

  // Scenario table rows.
  gsap.from('.param-table tbody tr', { autoAlpha: 0, y: 16, duration: .8, ease: 'power3.out', stagger: .07, scrollTrigger: { trigger: '.param-table', start: 'top 80%' } });

  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', () => {
    // Baseline to proposed wipe, scrubbed with scroll.
    gsap.timeline({ scrollTrigger: { trigger: '.compare-frame', start: 'top 80%', end: 'bottom 40%', scrub: 1 } })
      .fromTo('.pane-b', { clipPath: 'inset(0 0 0 92%)' }, { clipPath: 'inset(0 0 0 50%)', ease: 'none' }, 0)
      .fromTo('.compare-divider', { left: '92%' }, { left: '50%', ease: 'none' }, 0)
      .from('.change-callout', { autoAlpha: 0, y: 10, duration: .2 }, .8);

    // Digest document settles flat as it arrives.
    gsap.fromTo('.digest-doc', { rotateX: 16, rotateZ: -2, y: 80, transformPerspective: 1200 }, {
      rotateX: 0, rotateZ: 0, y: 0, ease: 'none',
      scrollTrigger: { trigger: '.digest-doc', start: 'top 95%', end: 'center 55%', scrub: 1 }
    });

    // Method: pinned horizontal track.
    const list = document.querySelector('.method-list');
    const distance = () => Math.max(0, list.scrollWidth - document.querySelector('.method-track').clientWidth + 40);
    gsap.timeline({
      scrollTrigger: { trigger: '.method', start: 'top top', end: () => '+=' + distance(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
    })
      .to(list, { x: () => -distance(), ease: 'none' }, 0)
      .to('.method-progress span', { scaleX: 1, ease: 'none' }, 0);

    // Engagement cards rise at slightly different speeds.
    gsap.utils.toArray('.eng-card').forEach((card, i) => {
      gsap.to(card, { y: -24 * (i + 1) / 3, ease: 'none', scrollTrigger: { trigger: '.eng-grid', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });
  mm.add('(max-width: 860px)', () => {
    gsap.set('.pane-b', { clipPath: 'inset(0 0 0 50%)' });
    gsap.utils.toArray('.stage').forEach(stage => {
      gsap.from(stage, { y: 40, autoAlpha: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: stage, start: 'top 90%' } });
    });
  });

  // Contact satellite drifts gently.
  gsap.to('.contact-sat', { y: -40, rotate: -3, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: true } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
