(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (window.gsap && !reduced.matches) {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.site-header', { opacity: 0, y: -12, duration: .8 })
      .from('.eyebrow', { opacity: 0, y: 14, duration: .7 }, .2)
      .from('h1 .line > span', { yPercent: 115, rotate: 3, duration: 1.15, stagger: .13 }, .35)
      .from('.hero-description', { opacity: 0, y: 18, duration: .8 }, .85)
      .from('.hero-actions', { opacity: 0, y: 18, duration: .8 }, 1.02)
      .from('.scene-tag, .scene-controls', { opacity: 0, duration: .65, stagger: .1 }, .9)
      .from('.hero-bottom, .capability-strip', { opacity: 0, y: 12, duration: .9, stagger: .1 }, 1.05);
    reduced.addEventListener('change', e => { if (e.matches) tl.progress(1).kill(); });
  }
  const dialog = document.getElementById('info-dialog');
  const content = document.getElementById('dialog-content');
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  let lastTrigger;
  function closeMenu() { mobileNav.hidden = true; menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Open navigation'); }
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    mobileNav.hidden = !open;
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  window.matchMedia('(min-width:761px)').addEventListener('change', e => { if (e.matches) closeMenu(); });
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-panel]');
    if (!trigger) return;
    const template = document.getElementById('panel-' + trigger.dataset.panel);
    if (!template) return;
    if (!dialog.open) lastTrigger = trigger;
    closeMenu();
    content.replaceChildren(template.content.cloneNode(true));
    document.getElementById('dialog-number').textContent = { approach: '01', expertise: '02', mission: '03', brief: '04', credits: '05' }[trigger.dataset.panel];
    if (!dialog.open) { dialog.showModal(); document.body.classList.add('dialog-open'); }
    dialog.scrollTop = 0;
    document.querySelector('.dialog-close').focus({ preventScroll: true });
    if (window.gsap && !reduced.matches) gsap.fromTo(content, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .35 });
  });
  document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog && (e.clientX < dialog.getBoundingClientRect().left || e.clientX > dialog.getBoundingClientRect().right || e.clientY < dialog.getBoundingClientRect().top || e.clientY > dialog.getBoundingClientRect().bottom)) dialog.close(); });
  dialog.addEventListener('close', () => { document.body.classList.remove('dialog-open'); if (lastTrigger?.getClientRects().length) lastTrigger.focus({ preventScroll: true }); else menuToggle.focus({ preventScroll: true }); });
  document.addEventListener('submit', e => {
    if (e.target.id !== 'brief-form') return;
    e.preventDefault();
    const data = new FormData(e.target);
    const note = `MISSION BEACON\nConversation briefing note\n\nProgramme / organisation: ${data.get('programme').trim()}\nFocus: ${data.get('focus')}\n\nContext\n${data.get('context').trim() || 'To be discussed.'}\n\nQuestions for the conversation\n- What is the approved engineering baseline?\n- What technical change is being proposed?\n- Which evidence and regulatory questions need qualified review?\n\nPrepared locally for your team. This note has not been sent.\n`;
    const url = URL.createObjectURL(new Blob([note], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'mission-beacon-briefing.txt'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    document.getElementById('brief-result').textContent = 'Your briefing note is ready to download. It has not been sent.';
  });
})();
