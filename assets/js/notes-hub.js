// Notes Hub JavaScript
// ====================
// Embeds standalone HTML notes (same origin) in an auto-height iframe,
// and restyles them with the blog's fonts and colors.

(function () {
  const hub = document.querySelector('.nh');
  if (!hub) return;

  const cards = Array.from(hub.querySelectorAll('.nh-card'));
  const chapters = cards.map(card => ({
    no: Number(card.dataset.ch),
    title: card.dataset.title,
    url: card.getAttribute('href'),
    path: new URL(card.getAttribute('href'), location.href).pathname,
    card: card
  }));

  const viewer = hub.querySelector('.nh-viewer');
  const bar = viewer.querySelector('.nh-bar');
  const frame = viewer.querySelector('.nh-iframe');
  const prevBtn = viewer.querySelector('.nh-prev');
  const nextBtn = viewer.querySelector('.nh-next');
  const fullBtn = viewer.querySelector('.nh-full');
  const openLink = viewer.querySelector('.nh-open');
  const curNo = viewer.querySelector('.nh-current-no');
  const curTitle = viewer.querySelector('.nh-current-title');

  let current = -1;
  let holdUntil = 0;
  let resizeObs = null;
  let stepLinks = [];

  // --- Layout helpers ---

  function navbarBottom() {
    const nav = document.getElementById('navbar');
    return nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0;
  }

  function stickyOffset() {
    return navbarBottom() + bar.offsetHeight + 12;
  }

  function frameDoc() {
    try { return frame.contentDocument; } catch (e) { return null; }
  }

  function isFull() {
    return document.fullscreenElement === viewer;
  }

  function fit() {
    const doc = frameDoc();
    if (!doc || !doc.body) return;
    if (isFull()) {
      frame.style.height = '';
      return;
    }
    frame.style.height = Math.ceil(doc.body.getBoundingClientRect().height) + 'px';
  }

  function viewerY() {
    return viewer.getBoundingClientRect().top + window.pageYOffset - navbarBottom() - 12;
  }

  function scrollToViewer() {
    window.scrollTo({ top: viewerY(), behavior: 'smooth' });
    // Content above the viewer (fonts, card details) can still change
    // size for a moment; keep the viewer pinned until then or until the reader scrolls.
    holdUntil = Date.now() + 2500;
  }

  function holdViewer() {
    if (Date.now() < holdUntil) window.scrollTo({ top: viewerY(), behavior: 'instant' });
  }

  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(type =>
    window.addEventListener(type, () => { holdUntil = 0; }, { passive: true }));
  new ResizeObserver(holdViewer).observe(hub);

  // --- Theme sync: the notes read [data-theme] on their <html> ---

  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function blogMode() {
    return document.documentElement.getAttribute('data-mode') || (darkQuery.matches ? 'dark' : 'light');
  }

  // --- Blog look: the notes are restyled with the blog's own fonts and neutral
  // colors, read from the live page so they follow any later theme change.
  // Semantic colors (accent, wave, ...) are kept because the figures rely on them.

  function probe(tag, parent) {
    const el = document.createElement(tag);
    el.textContent = 'x';
    el.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none';
    parent.appendChild(el);
    const cs = getComputedStyle(el);
    const r = {
      family: cs.fontFamily, weight: cs.fontWeight, size: cs.fontSize,
      line: cs.lineHeight, color: cs.color
    };
    el.remove();
    return r;
  }

  function blogCss() {
    const content = hub.closest('.content') || document.body;
    const root = getComputedStyle(document.documentElement);
    const v = (name, fallback) => root.getPropertyValue(name).trim() || fallback;
    const p = probe('p', content);
    const h = probe('h2', content);
    const code = probe('code', content);

    hub.style.setProperty('--nh-mono', code.family);

    return [
      'html:root, html:root[data-theme] {',
      '  --bg: ' + v('--main-bg', '#fff') + ';',
      '  --panel: ' + v('--card-bg', '#fff') + ';',
      '  --fg: ' + v('--text-color', p.color) + ';',
      '  --atom: ' + v('--heading-color', h.color) + ';',
      '  --muted: ' + v('--text-muted-color', '#757575') + ';',
      '  --line: ' + v('--btn-border-color', '#e9ecef') + ';',
      '  --grid: ' + v('--main-border-color', '#f3f3f3') + ';',
      '  --font-body: ' + p.family + ';',
      '  --font-mono: ' + code.family + ';',
      '}',
      'body { font-size: ' + p.size + '; }',
      'html body h1, html body h2, html body h3 {',
      '  font-family: ' + h.family + ' !important;',
      '  font-weight: ' + h.weight + ' !important;',
      '  color: ' + v('--heading-color', h.color) + ';',
      '}',
      'html body b, html body strong { color: ' + v('--heading-color', h.color) + '; }'
    ].join('\n');
  }

  function syncTheme() {
    const doc = frameDoc();
    if (!doc || !doc.documentElement || !doc.head) return;
    let style = doc.getElementById('nh-blog-style');
    if (!style) {
      style = doc.createElement('style');
      style.id = 'nh-blog-style';
      doc.head.appendChild(style);
    }
    style.textContent = blogCss();
    // Setting data-theme also makes the notes re-read their colors for the canvases.
    doc.documentElement.setAttribute('data-theme', blogMode());
  }

  new MutationObserver(syncTheme).observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-mode']
  });
  darkQuery.addEventListener('change', syncTheme);

  // --- Step chips: replace the notes' own sticky TOC, which cannot stick inside an auto-height iframe ---

  function buildSteps(doc) {
    let row = bar.querySelector('.nh-steprow');
    if (!row) {
      row = document.createElement('div');
      row.className = 'nh-steprow';
      bar.appendChild(row);
    }
    row.innerHTML = '';
    stepLinks = [];

    doc.querySelectorAll('nav.toc a[href^="#"]').forEach(a => {
      const target = doc.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
      if (!target) return;
      const num = a.querySelector('b');
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'nh-step';
      if (num) {
        const b = document.createElement('b');
        b.textContent = num.textContent;
        chip.appendChild(b);
      }
      const label = a.textContent.replace(num ? num.textContent : '', '').trim();
      if (label) chip.appendChild(document.createTextNode(label));
      chip.addEventListener('click', () => scrollToTarget(target));
      row.appendChild(chip);
      stepLinks.push({ chip: chip, target: target });
    });
    row.hidden = stepLinks.length === 0;
    spy();
  }

  function scrollToTarget(target) {
    if (isFull()) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const y = frame.getBoundingClientRect().top + target.getBoundingClientRect().top + window.pageYOffset - stickyOffset();
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  function spy() {
    if (!stepLinks.length) return;
    const line = isFull() ? 80 : stickyOffset() + 40;
    const base = isFull() ? 0 : frame.getBoundingClientRect().top;
    let active = 0;
    stepLinks.forEach((s, k) => {
      if (base + s.target.getBoundingClientRect().top <= line) active = k;
    });
    stepLinks.forEach((s, k) => s.chip.classList.toggle('is-active', k === active));
  }

  window.addEventListener('scroll', spy, { passive: true });

  // In-page anchors inside the notes would try to scroll the (non-scrolling) iframe.
  function onFrameClick(e) {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || isFull()) return;
    const doc = frameDoc();
    const target = doc && doc.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
    if (!target) return;
    e.preventDefault();
    scrollToTarget(target);
  }

  // --- Chapter selection ---

  function setCurrent(i) {
    current = i;
    const c = chapters[i];
    chapters.forEach((x, k) => {
      if (k === i) x.card.setAttribute('aria-current', 'true');
      else x.card.removeAttribute('aria-current');
    });
    curNo.textContent = c.no + '장';
    curTitle.textContent = c.title;
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === chapters.length - 1;
    openLink.href = c.url;
    frame.title = c.no + '장. ' + c.title;
    history.replaceState(null, '', '#ch' + c.no);
  }

  function open(i, scroll) {
    if (i < 0 || i >= chapters.length) return;
    if (i !== current || !frame.getAttribute('src')) {
      viewer.classList.add('is-loading');
      frame.setAttribute('src', chapters[i].url);
    }
    setCurrent(i);
    if (scroll) scrollToViewer();
  }

  frame.addEventListener('load', () => {
    const doc = frameDoc();
    if (!doc || !doc.body || doc.location.href === 'about:blank') return;

    const i = chapters.findIndex(c => c.path === doc.location.pathname);
    if (i >= 0 && i !== current) {
      // Navigated by a link inside the notes (e.g. "2장으로")
      setCurrent(i);
      scrollToViewer();
    }

    syncTheme();
    doc.documentElement.style.overflow = isFull() ? '' : 'hidden';
    doc.addEventListener('click', onFrameClick);
    // Hide the frame while a link inside the notes loads the next page (avoids a flash of unstyled notes).
    doc.defaultView.addEventListener('pagehide', () => viewer.classList.add('is-loading'));
    doc.defaultView.addEventListener('scroll', spy, { passive: true });

    if (resizeObs) resizeObs.disconnect();
    resizeObs = new doc.defaultView.ResizeObserver(fit);
    resizeObs.observe(doc.body);
    fit();

    buildSteps(doc);
    holdViewer();
    viewer.classList.remove('is-loading');
  });

  window.addEventListener('resize', fit);

  cards.forEach((card, i) => {
    card.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      open(i, true);
    });
  });

  prevBtn.addEventListener('click', () => open(current - 1, true));
  nextBtn.addEventListener('click', () => open(current + 1, true));

  // --- Fullscreen (the whole viewer, so the toolbar stays usable) ---

  if (document.fullscreenEnabled && viewer.requestFullscreen) {
    fullBtn.addEventListener('click', () => {
      if (isFull()) document.exitFullscreen();
      else viewer.requestFullscreen();
    });
    document.addEventListener('fullscreenchange', () => {
      const on = isFull();
      viewer.classList.toggle('is-full', on);
      fullBtn.querySelector('i').className = on ? 'fas fa-compress' : 'fas fa-expand';
      fullBtn.setAttribute('aria-label', on ? '전체 화면 종료' : '전체 화면');
      fullBtn.title = fullBtn.getAttribute('aria-label');
      const doc = frameDoc();
      if (doc && doc.documentElement) doc.documentElement.style.overflow = on ? '' : 'hidden';
      fit();
      spy();
    });
  } else {
    fullBtn.hidden = true;
  }

  // --- Card details read from the notes themselves (stay correct when the notes change) ---

  function enrich() {
    chapters.forEach(c => {
      fetch(c.url)
        .then(r => (r.ok ? r.text() : Promise.reject(r.status)))
        .then(html => {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const steps = Array.from(doc.querySelectorAll('nav.toc a[href^="#s"]'))
            .filter(a => /^#s\d+$/.test(a.getAttribute('href'))).length;
          const figs = doc.querySelectorAll('canvas').length;
          const parts = [];
          if (steps) parts.push(steps + '단계');
          if (figs) parts.push('인터랙티브 그림 ' + figs + '개');
          c.card.querySelector('.nh-figs').textContent = parts.join(' / ');
        })
        .catch(() => { /* card keeps its static text */ });
    });
  }

  // --- Start ---

  viewer.hidden = false;

  const m = location.hash.match(/^#ch(\d+)$/);
  const fromHash = m ? chapters.findIndex(c => c.no === Number(m[1])) : -1;

  if (fromHash >= 0) {
    open(fromHash, true);
  } else {
    // Load the first chapter once the viewer comes near the screen.
    setCurrent(0);
    history.replaceState(null, '', location.pathname + location.search);
    const io = new IntersectionObserver(entries => {
      if (entries.some(en => en.isIntersecting)) {
        io.disconnect();
        if (!frame.getAttribute('src')) open(current, false);
      }
    }, { rootMargin: '600px 0px' });
    io.observe(viewer);
  }

  if ('requestIdleCallback' in window) requestIdleCallback(enrich);
  else setTimeout(enrich, 1500);
})();
