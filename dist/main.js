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

  // ---------- Header (always dark; it only compacts once scrolled) ----------
  function updateHeader() { header.classList.toggle('is-scrolled', scrollY > 20); }
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
    .from('.hero-title .line > span', { yPercent: 110, duration: 1.5, stagger: .12 }, .35)
    .from('.hero-lede', { y: 24, autoAlpha: 0, duration: 1.3 }, .8)
    .from('.hero-actions > *', { y: 20, autoAlpha: 0, duration: 1.1, stagger: .08 }, .95)
    .from('.hero-foot', { autoAlpha: 0, duration: 1.4 }, 1.2)
    .from('#space-canvas', { scale: 1.08, duration: 2.6, ease: 'power3.out' }, 0);

  // Light page slides over the pinned hero.
  gsap.timeline({
    scrollTrigger: {
      trigger: '.light-shell', start: 'top bottom', end: 'top top', scrub: true,
      onUpdate: self => { shared.hero = self.progress; }
    }
  })
    .to('.hero-inner', { y: -120, autoAlpha: 0, ease: 'none' }, 0)
    .to('.hero-foot', { autoAlpha: 0, ease: 'none', duration: .4 }, 0)
    .to('.hero-stage', { scale: .97, ease: 'none' }, 0);

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
  ScrollTrigger.batch('.reveal-row', {
    start: 'top 92%',
    onEnter: batch => gsap.from(batch, { x: -30, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: .08 }),
    once: true
  });

  // Gap: the engineering record draws from Rev A to Rev B with scroll; the regulatory record stays at Rev A.
  const trace = document.querySelector('.trace');
  const traceSteps = trace.querySelectorAll('.trace-eng .trace-item, .trace-eng .trace-node-b');
  trace.classList.add('is-live');
  gsap.timeline({
    scrollTrigger: { trigger: trace, start: 'top 85%', end: 'top 30%', scrub: .6 },
    onUpdate() {
      const p = this.progress();
      traceSteps.forEach((el, i) => el.classList.toggle('is-on', p >= (i === traceSteps.length - 1 ? .98 : (i + .5) / (traceSteps.length - 1))));
      trace.classList.toggle('is-done', p >= .98);
    }
  }).fromTo('.trace-fill', { '--p': 0 }, { '--p': 1, ease: 'none' });
  gsap.from('.trace-reg .trace-item, .trace-reg .trace-node, .trace-reg .trace-rail', {
    autoAlpha: 0, y: 8, duration: .9, ease: 'expo.out', stagger: .07,
    scrollTrigger: { trigger: trace, start: 'top 72%' }
  });

  // Capabilities: whichever service crosses the middle of the screen becomes active.
  const capList = document.querySelector('.cap-list');
  const capItems = gsap.utils.toArray('.cap-item');
  const capLabels = document.querySelectorAll('.cap-label');
  const setCap = i => {
    capItems.forEach((el, j) => el.classList.toggle('is-active', i === j));
    capLabels.forEach((el, j) => el.classList.toggle('is-active', i === j));
  };
  capList.classList.add('is-live');
  capItems.forEach((item, i) => ScrollTrigger.create({ trigger: item, start: 'top 55%', end: 'bottom 55%', onToggle: self => self.isActive && setCap(i) }));

  // Method: the timeline draws downward and each stage lights as the line reaches it.
  const timeline = document.querySelector('.timeline');
  timeline.classList.add('is-live');
  gsap.fromTo('.tl-fill', { '--p': 0 }, { '--p': 1, ease: 'none', scrollTrigger: { trigger: timeline, start: 'top 60%', end: 'bottom 60%', scrub: .5 } });
  gsap.utils.toArray('.tl-step').forEach(step => {
    ScrollTrigger.create({ trigger: step, start: 'top 60%', onEnter: () => step.classList.add('is-on'), onLeaveBack: () => step.classList.remove('is-on') });
    gsap.from(step.querySelector('.tl-body'), { autoAlpha: 0, y: 30, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: step, start: 'top 82%' } });
  });

  // Statement: words brighten as it scrolls through.
  const statement = document.querySelector('.statement-text');
  statement.setAttribute('aria-label', statement.textContent.trim());
  splitWords(statement);
  statement.querySelectorAll('.w').forEach(w => w.setAttribute('aria-hidden', 'true'));
  gsap.fromTo(statement.querySelectorAll('.w > span'), { opacity: .15 }, {
    opacity: 1, ease: 'none', stagger: .1,
    scrollTrigger: { trigger: statement, start: 'top 80%', end: 'bottom 45%', scrub: true }
  });

  // Principles: the dividing rule draws, then both lists settle in.
  gsap.timeline({ scrollTrigger: { trigger: '.principle-split', start: 'top 75%' } })
    .from('.principle-rule', { scale: 0, transformOrigin: 'top left', duration: 1.2, ease: 'expo.inOut' })
    .from('.plain-list li', { autoAlpha: 0, y: 14, duration: .9, ease: 'expo.out', stagger: .06 }, .3);

  // Engagement: the scale fills and each stop lights in turn.
  const scale = document.querySelector('.scale');
  const scaleTl = gsap.timeline({ scrollTrigger: { trigger: scale, start: 'top 75%' } });
  scale.classList.add('is-live');
  scaleTl.fromTo('.scale-fill', { '--p': 0 }, { '--p': 1, duration: 2.2, ease: 'power2.inOut' }, 0);
  scale.querySelectorAll('.scale-stop').forEach((stop, i) => {
    scaleTl.call(() => stop.classList.add('is-on'), null, .15 + i * .8)
      .from(stop.querySelector('.scale-body'), { autoAlpha: 0, y: 18, duration: 1, ease: 'expo.out' }, .15 + i * .8);
  });

  // Starting point: baseline hairlines draw, the amber redline draws over them, then the cloud and marker land.
  gsap.timeline({ scrollTrigger: { trigger: '.redline', start: 'top 80%', end: 'center 40%', scrub: 1 } })
    .fromTo('.rl-draw', { strokeDashoffset: 1, strokeDasharray: 1 }, { strokeDashoffset: 0, ease: 'none', stagger: .08, duration: .5 })
    .from('.rl-fade', { autoAlpha: 0, duration: .3, stagger: .03 }, '-=.3')
    .fromTo('.rl-draw-b', { strokeDashoffset: 1, strokeDasharray: 1 }, { strokeDashoffset: 0, ease: 'none', stagger: .1, duration: .5 })
    .from('.rl-fade-b', { autoAlpha: 0, duration: .3, stagger: .05 }, '-=.2')
    .from('.rl-cloud', { autoAlpha: 0, scale: .7, svgOrigin: '300 118', duration: .35, ease: 'back.out(2)' })
    .from('.rl-mark', { autoAlpha: 0, scale: .4, svgOrigin: '392 72', duration: .3, ease: 'back.out(3)' }, '-=.1')
    .from('.redline-caption', { autoAlpha: 0, y: 8, duration: .3 });

  // Scenario table rows.
  gsap.from('.param-table tbody tr', { autoAlpha: 0, y: 16, duration: .8, ease: 'power3.out', stagger: .07, scrollTrigger: { trigger: '.param-table', start: 'top 80%' } });

  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', () => {
    // Digest document settles flat as it arrives.
    gsap.fromTo('.digest-doc', { rotateX: 16, rotateZ: -2, y: 80, transformPerspective: 1200 }, {
      rotateX: 0, rotateZ: 0, y: 0, ease: 'none',
      scrollTrigger: { trigger: '.digest-doc', start: 'top 95%', end: 'center 55%', scrub: 1 }
    });
  });

  // Contact satellite drifts gently.
  gsap.to('.contact-sat', { y: -40, rotate: -3, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: true } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
