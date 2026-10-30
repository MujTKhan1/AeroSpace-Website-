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
  shared.lenis = lenis;
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    let target = id === '#top' ? 0 : document.querySelector(id);
    if (target === null) return;
    e.preventDefault();
    setMenu(false);
    // A pinned section is position: fixed; scroll to its spacer, which keeps its place in the page.
    if (target && target.parentElement.classList.contains('pin-spacer')) target = target.parentElement;
    if (lenis) lenis.scrollTo(target, { offset: id === '#top' ? 0 : -64, duration: 1.4 });
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

  // ---------- Footer notes sign-up (no endpoint is connected yet) ----------
  const notify = document.getElementById('notify-form');
  const notifyStatus = document.getElementById('notify-status');
  notify.addEventListener('submit', e => {
    e.preventDefault();
    const email = notify.elements.email;
    const ok = email.value.trim() !== '' && email.checkValidity();
    email.setAttribute('aria-invalid', String(!ok));
    notifyStatus.className = ok ? 'notify-status' : 'notify-status is-error';
    notifyStatus.textContent = ok ? "Thanks. Sign-up isn't connected yet, so nothing was sent." : 'Please enter a valid work email.';
    if (!ok) email.focus();
  });

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
  // Audiences: each row's hairline draws, then the role slides in from the left and the need from the right.
  const audTl = gsap.timeline({ scrollTrigger: { trigger: '.aud-table', start: 'top 80%' } });
  gsap.utils.toArray('.aud-row').forEach((row, i) => {
    const at = i * .12;
    audTl.fromTo(row, { '--line': 0 }, { '--line': 1, duration: 1, ease: 'expo.out' }, at)
      .from(row.querySelector('.aud-who'), { x: -60, autoAlpha: 0, duration: 1, ease: 'expo.out' }, at + .12)
      .from(row.querySelector('.aud-need'), { x: 60, autoAlpha: 0, duration: 1, ease: 'expo.out' }, at + .18)
      .from(row.querySelector('.aud-arrow'), { scale: 0, autoAlpha: 0, duration: .6, ease: 'back.out(3)', clearProps: 'transform' }, at + .3);
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

  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', () => {
    // Footer slides over the last section like a sheet: contact holds by its bottom edge (so its Send
    // button stays reachable), then recedes and dims beneath the footer. Phones scroll normally.
    // The footer fills the screen below the header, so the slide ends exactly at max scroll; its top
    // corners square off as it lands so the final state is a clean full screen.
    gsap.timeline({
      scrollTrigger: { trigger: '.contact', start: 'bottom bottom', end: 'max', pin: true, pinSpacing: false, scrub: true, invalidateOnRefresh: true, refreshPriority: -10 }
    })
      .to('.contact', { '--dim': .45, scale: .94, transformOrigin: '50% 100%', ease: 'none', duration: 1 }, 0)
      .to('.site-footer', { borderTopLeftRadius: 0, borderTopRightRadius: 0, ease: 'none', duration: .15 }, .85);

    // Footer wordmark drifts a little with the pointer.
    const card = document.querySelector('.foot-card');
    const markX = gsap.quickTo('.foot-mark svg', 'x', { duration: .8, ease: 'power3.out' });
    const onMove = e => { const r = card.getBoundingClientRect(); markX(((e.clientX - r.left) / r.width - .5) * -36); };
    const onLeave = () => markX(0);
    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', onLeave);
    return () => { card.removeEventListener('pointermove', onMove); card.removeEventListener('pointerleave', onLeave); };
  });

  // Contact satellite drifts gently.
  gsap.to('.contact-sat', { y: -40, rotate: -3, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: true } });

  // Footer: the band rises, link columns stagger in, and the wordmark rises with scroll.
  gsap.from('.notify', { y: 60, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.notify', start: 'top 88%' } });
  gsap.from('.foot-col', { y: 24, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.foot-cols', start: 'top 88%' } });
  gsap.fromTo('.foot-mark-inner', { yPercent: 55, autoAlpha: 0 }, {
    yPercent: 0, autoAlpha: 1, ease: 'none',
    scrollTrigger: { trigger: '.foot-card', start: 'top bottom', end: 'clamp(bottom bottom)', scrub: true }
  });

  // A one-shot reveal never fires if the page opens below it (a refresh mid-page restores the scroll
  // position, or a #section link), which would leave its content hidden even after scrolling back up.
  // Once a reveal's element is entirely above the viewport it is finished, so it can never be seen
  // mid-animation; class-based steps just run their onEnter. Scrubbed animations follow the scroll.
  // The browser's scroll restore can land without ScrollTrigger noticing (its cached position stays at
  // 0), so sync it first and measure against the real scroll position.
  const finishPassed = () => {
    ScrollTrigger.update();
    const y = scrollY;
    ScrollTrigger.getAll().forEach(t => {
      if (t.vars.scrub || y <= t.start) return;
      const a = t.animation;
      if (!a) { if (t.vars.onEnter) t.vars.onEnter(t); return; }
      // Above the viewport: finish it. On screen but never started: play it as normal.
      if (y > t.end) { if (a.progress() < 1) a.progress(1, false); }
      else if (a.progress() === 0 && !a.isActive()) a.play();
    });
  };
  let finishQueued = false;
  addEventListener('scroll', () => {
    if (finishQueued) return;
    finishQueued = true;
    setTimeout(() => { finishQueued = false; finishPassed(); }, 80);
  }, { passive: true });
  // ScrollTrigger restores saved progress at the end of a refresh, so check again once it settles.
  ScrollTrigger.addEventListener('refresh', () => setTimeout(finishPassed, 0));
  document.fonts.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => { ScrollTrigger.refresh(); setTimeout(finishPassed, 400); });
})();
