/* ============================================================================
   scroll-world — portable scroll-scrubbed camera-flight engine
   Adapted for Rancho Varadero (Astro) from .claude/skills/scroll-world/references/scrub-engine.js
   ----------------------------------------------------------------------------
   Same config, chain and behaviour as the reference engine (sections + connectors,
   scroll→currentTime with rAF smoothing, Blob loading, lazy prefetch, seam crossfade,
   pinned per-section copy, route rail, prefers-reduced-motion, phone hardening:
   seek-coalescing, iOS priming with playsinline/muted, poster kept until the clip
   paints, URL-bar resizes ignored on touch). Changes for this project:

   1. ES module (`export function mountScrollWorld`).
   2. Adopts server-rendered markup when present (scenes with their poster <img>,
      copy <article>s, route links, hint, track anchors), so the copy, the single h1
      and the first poster are in the static HTML (SEO, LCP, no-JS). Anything not
      rendered by the page is built exactly like the reference engine does.
   3. The stage lives in a `position: sticky` viewport inside the container instead of
      `position: fixed`, so normal page sections can follow the scroll world. Scroll
      math is relative to the container's top.
   4. Per-section `focus` (0–100): horizontal object-position of stills and clips.
      Matters when the 16:9 film is cropped (portrait phones). Connectors interpolate
      from the previous stop's focus to the next one across the leg, so the crop at a
      seam always matches the stop on the other side.
   5. Sections without `clip` (stops between connector legs) keep their still at
      identity transform (no Ken Burns zoom/offset): the still IS the neighbouring
      clip's first/last frame and must line up pixel for pixel at the seam. A
      connector whose clip has not loaded yet shows the previous stop's still with a
      slow push-in that starts at identity.
   6. Real crossfade at seams: later segments stack above earlier ones, so the incoming
      segment dissolves in over the `crossfade` band before its start (the reference
      engine always kept the current segment on top, which made seams hard cuts).
   7. Copy plateau: each stop's copy is fully visible for the middle half of the stop
      (the camera is resting there) instead of only peaking at the exact middle. The
      copy scrim fades with the copy, so legs play full bleed.
   8. `navigator.connection.saveData` behaves like prefers-reduced-motion: posters only.
   9. Clip downloads are queued (max 2 in flight, nearest first) so a long anchor jump
      doesn't fire every 8 MB clip at once.
  10. CSS ships as a static stylesheet (src/styles/scroll-world.css) in the `sw` cascade
      layer instead of being injected at runtime, so server-rendered markup is styled
      before JS. The page's utilities and unlayered theme tokens win over it. The
      html/body overflow rule was dropped (the page uses overflow-x: clip, which keeps
      sticky working).
  11. Sets `--sw-r` (0–1) on the container: the position along the route, for the dock's progress line.

   USAGE
     mountScrollWorld(container, {
       diveScroll: 0.9,   // viewport-heights of scroll per section (stop)
       connScroll: 1.4,   // ...per connector clip
       crossfade: 0.07,   // seam dissolve width (viewport-heights)
       nav: false, atmosphere: false, progress: false,
       hint: 'scroll',
       sections: [{ id, label, still, stillMobile, clip, clipMobile, focus, scroll, linger,
                    eyebrow, title, body, tags, cta }],
       connectors: [clipUrl, …],          // length = sections.length - 1 (nulls allowed)
       connectorsMobile: [clipUrl, …],    // optional
     });

   THEME (CSS custom properties)
     --sw-bg, --sw-ink, --sw-ink-soft, --sw-accent, --sw-font-display, --sw-font-body
   ========================================================================== */

export function mountScrollWorld(container, config) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const noVideo = reduce || saveData;
  const coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const smallMQ = window.matchMedia('(max-width: 860px)');
  const isMobile = () => coarse || smallMQ.matches;
  const SECTIONS = config.sections || [];
  const CONNECTORS = config.connectors || [];
  const CONNECTORS_M = config.connectorsMobile || [];
  const DIVE_W = config.diveScroll || 1.3;
  const CONN_W = config.connScroll || 0.9;
  const CROSSFADE = config.crossfade != null ? config.crossfade : 0.12;
  const N = SECTIONS.length;
  if (!N) return;

  injectCSS();
  container.classList.add('sw-root');

  // ---- build the interleaved segment chain: stop0, conn0, stop1, … stopN-1 ----
  const SEGMENTS = [];
  SECTIONS.forEach((s, i) => {
    const focus = s.focus != null ? s.focus : 50;
    const dive = { kind: 'dive', si: i, clip: s.clip, clipM: s.clipMobile, still: s.still, stillM: s.stillMobile,
                   accent: s.accent, w: s.scroll || DIVE_W, linger: s.linger || 0, fx0: focus, fx1: focus };
    SEGMENTS.push(dive);
    s._seg = dive;
    if (i < N - 1 && CONNECTORS[i]) {
      const next = SECTIONS[i + 1];
      // The fallback still of a leg is the stop it leaves from (= the clip's first frame).
      SEGMENTS.push({ kind: 'conn', si: i, clip: CONNECTORS[i], clipM: CONNECTORS_M[i],
                      still: s.still, stillM: s.stillMobile, accent: next.accent, w: CONN_W,
                      fx0: focus, fx1: next.focus != null ? next.focus : 50 });
    }
  });
  const NSEG = SEGMENTS.length;

  // ---- DOM (adopt server-rendered nodes when present) ----
  const find = (sel) => container.querySelector(sel);
  const viewport = find('.sw-viewport') || el('div', 'sw-viewport');
  const sky = find('.sw-sky') || el('div', 'sw-sky');
  let particles = null;
  if (config.atmosphere !== false && !sky.children.length) {
    sky.appendChild(el('div', 'sw-sky__grad'));
    sky.appendChild(el('div', 'sw-sky__glow'));
    particles = el('div', 'sw-particles'); sky.appendChild(particles);
  }

  let scrollbarFill = null;
  const extras = [];
  if (config.progress) {
    const scrollbar = el('div', 'sw-scrollbar');
    scrollbarFill = el('span'); scrollbar.appendChild(scrollbarFill);
    extras.push(scrollbar);
  }

  const nav = el('nav', 'sw-nav');
  if (config.brand || config.nav !== false || (config.cta && config.cta.label)) {
    const topbar = el('div', 'sw-topbar');
    if (config.brand) {
      const brand = el('a', 'sw-brand'); brand.href = config.brand.href || '#';
      brand.appendChild(el('span', 'sw-brand__mark'));
      const nm = el('span', 'sw-brand__name'); nm.textContent = config.brand.name || ''; brand.appendChild(nm);
      topbar.appendChild(brand);
    }
    if (config.nav !== false) topbar.appendChild(nav);
    if (config.cta && config.cta.label) {
      const c = el('a', 'sw-topcta'); c.href = config.cta.href || '#'; c.textContent = config.cta.label;
      topbar.appendChild(c);
    }
    extras.push(topbar);
  }

  const stage = find('.sw-stage') || el('div', 'sw-stage');
  const copylayer = find('.sw-copylayer') || el('div', 'sw-copylayer');
  const route = find('.sw-route') || el('div', 'sw-route');
  let hint = find('.sw-hint');
  if (!hint) {
    hint = el('div', 'sw-hint');
    const hintText = el('span'); hintText.textContent = config.hint || 'scroll'; hint.appendChild(hintText);
    hint.appendChild(el('i'));
  }
  const track = find('.sw-track') || el('div', 'sw-track');

  [sky, ...extras, stage, copylayer, route, hint].forEach(n => { if (!n.parentNode) viewport.appendChild(n); });
  if (!viewport.parentNode) container.appendChild(viewport);
  if (!track.parentNode) container.appendChild(track);

  // segment scenes
  const preScenes = stage.querySelectorAll('.sw-scene');
  const adoptScenes = preScenes.length === NSEG;
  SEGMENTS.forEach((s, i) => {
    let scene, img;
    if (adoptScenes) {
      scene = preScenes[i];
      img = scene.querySelector('.sw-scene__still') || scene.appendChild(el('img', 'sw-scene__still'));
    } else {
      scene = el('div', 'sw-scene');
      img = el('img', 'sw-scene__still'); img.alt = ''; img.decoding = 'async'; img.loading = 'lazy';
      const poster = (isMobile() && s.stillM) ? s.stillM : s.still;
      if (poster) img.src = poster;
      scene.appendChild(img); stage.appendChild(scene);
    }
    scene.style.setProperty('--sw-accent', s.accent || '');
    scene.style.setProperty('--sw-fx', s.fx0 + '%');
    scene.dataset.seg = String(i);
    scene.dataset.kind = s.kind;
    s.el = scene; s.img = img; s.video = null; s.hasClip = false;
    s.loading = false; s.ready = false; s.cur = 0; s.target = 0; s.visible = false; s.fx = s.fx0;
  });

  // per-section copy / route / anchors
  const preCopies = copylayer.querySelectorAll('.sw-copy');
  const preDots = route.querySelectorAll('.sw-route__dot');
  const anchors = SECTIONS.map(s => (s.id && track.querySelector(`[data-sw-anchor="${cssEsc(s.id)}"]`)) || null);
  const copies = [], dots = [];
  SECTIONS.forEach((s, i) => {
    let c = preCopies.length === N ? preCopies[i] : null;
    if (!c) {
      c = el('article', 'sw-copy');
      c.innerHTML =
        `<span class="sw-copy__num">${pad(i + 1)} / ${pad(N)}</span>` +
        (s.eyebrow ? `<span class="sw-copy__eyebrow">${esc(s.eyebrow)}</span>` : '') +
        (s.title ? `<h2 class="sw-copy__title">${esc(s.title)}</h2>` : '') +
        (s.body ? `<p class="sw-copy__body">${esc(s.body)}</p>` : '') +
        (s.tags && s.tags.length ? `<ul class="sw-copy__tags">${s.tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '') +
        (s.cta ? `<div class="sw-copy__cta">${ctaBtns(s.cta)}</div>` : '');
      copylayer.appendChild(c);
    }
    c.style.setProperty('--sw-accent', s.accent || '');
    copies.push(c);

    let dot = preDots.length === N ? preDots[i] : null;
    if (!dot) {
      dot = el('button', 'sw-route__dot');
      dot.innerHTML = `<span class="sw-route__label">${esc(s.label || '')}</span><i></i>`;
      route.appendChild(dot);
    }
    // Anchor links scroll natively to the track anchor; buttons (built here) jump in JS.
    if (dot.tagName !== 'A' || !anchors[i]) {
      dot.addEventListener('click', (e) => { e.preventDefault(); jumpTo(i); });
    }
    dots.push(dot);

    if (config.nav !== false) {
      const b = el('button', 'sw-nav__item'); b.textContent = s.label || '';
      b.addEventListener('click', () => jumpTo(i)); nav.appendChild(b);
    }
  });

  // ---- math ----
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const lingerEase = (x, L) => { L = clamp(L); const c = x - 0.5; return (1 - L) * x + L * (4 * c * c * c + 0.5); };
  let vh = window.innerHeight, top0 = 0, totalW = 0, activeIndex = -1, ticking = false;
  let laidOutW = window.innerWidth;

  function layout() {
    vh = window.innerHeight;
    laidOutW = window.innerWidth;
    top0 = container.getBoundingClientRect().top + (window.scrollY || window.pageYOffset);
    let off = 0;
    SEGMENTS.forEach(s => { s.start = off * vh; off += s.w; s.end = off * vh; });
    totalW = off;
    track.style.height = (totalW * vh + vh) + 'px';   // +1vh so the last flight completes
    SECTIONS.forEach((s, i) => { if (anchors[i]) anchors[i].style.top = anchorY(i) + 'px'; });
    container.__sw = { vh, top0, totalW, segments: SEGMENTS.map(({ kind, si, start, end }) => ({ kind, si, start, end })) };
    read();
  }

  function anchorY(i) {
    if (i === 0) return 0;
    const seg = SECTIONS[i]._seg;
    return seg.start + (seg.end - seg.start) * 0.5;
  }

  function jumpTo(i) {
    window.scrollTo({ top: top0 + anchorY(i), behavior: reduce ? 'auto' : 'smooth' });
  }

  // ---- clip loading: queued, nearest first, max 2 in flight ----
  const pending = new Set();
  let inFlight = 0;
  function loadClip(s) {
    // Under prefers-reduced-motion / save-data the clips are never loaded: the stills stay
    // up and simply cross-dissolve as you scroll. No scrubbed motion, no decode cost.
    if (noVideo || s.loading || !s.clip || pending.has(s)) return;
    pending.add(s);
    pump();
  }
  function pump() {
    while (inFlight < 2 && pending.size) {
      const y = scrollPos();
      let best = null, bd = Infinity;
      pending.forEach(s => {
        const d = y < s.start ? s.start - y : (y > s.end ? y - s.end : 0);
        if (d < bd) { bd = d; best = s; }
      });
      pending.delete(best);
      // Scrolled away while it waited: drop it; read() re-queues it if we come back.
      if (bd > 2.2 * vh) continue;
      fetchClip(best);
    }
  }
  function fetchClip(s) {
    s.loading = true; inFlight++;
    const url = (isMobile() && s.clipM) ? s.clipM : s.clip;
    fetch(url).then(r => r.ok ? r.blob() : Promise.reject(new Error(r.status + ' ' + url)))
      .then(blob => {
        const v = document.createElement('video');
        v.className = 'sw-scene__video';
        v.muted = true; v.playsInline = true; v.preload = 'auto';
        v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
        v.setAttribute('aria-hidden', 'true'); v.setAttribute('tabindex', '-1');
        v.disablePictureInPicture = true; v.setAttribute('disableremoteplayback', '');
        v.src = URL.createObjectURL(blob);
        v.addEventListener('loadedmetadata', () => { s.ready = true; read(); });
        // Reveal the video (hide the still poster) only once a real frame has painted —
        // on iOS a seeked-but-never-played muted video stays blank.
        v.addEventListener('seeked', () => { s.el.classList.add('has-clip'); }, { once: true });
        v.addEventListener('loadeddata', () => { try { v.pause(); } catch (e) {} if (userReady) primeVideo(v); });
        s.el.appendChild(v); s.video = v; s.hasClip = true;
      })
      .catch(() => { s.loading = false; })
      .finally(() => { inFlight--; pump(); });
  }

  function scrollPos() { return (window.scrollY || window.pageYOffset) - top0; }

  function read() {
    const y = scrollPos();
    const fade = CROSSFADE * vh;
    let ci = 0;
    for (let i = 0; i < NSEG; i++) if (y >= SEGMENTS[i].start) ci = i;

    for (let i = 0; i < NSEG; i++) {
      const s = SEGMENTS[i];
      if (y > s.start - 1.6 * vh && y < s.end + 1.6 * vh) loadClip(s);
      // Server-rendered posters after the first one arrive as data-src: fetch them when the
      // segment gets close instead of all at once on landing.
      if (s.img.dataset.src && !s.img.getAttribute('src') && y > s.start - 2.4 * vh && y < s.end + 2.4 * vh) {
        s.img.src = s.img.dataset.src;
      }
      const local = clamp((y - s.start) / (s.end - s.start), 0, 1);
      s.target = s.linger ? lingerEase(local, s.linger) : local;
      let outside = 0;
      if (y < s.start) outside = s.start - y; else if (y > s.end) outside = y - s.end;
      const op = i === ci ? 1 : smooth(1 - outside / fade);
      s.el.style.opacity = op; s.visible = op > 0.001;
      // Later segments stack above earlier ones: the incoming one dissolves in over the
      // outgoing one during the crossfade band (frames match, so the blend is invisible).
      s.el.style.zIndex = String(100 + i);
      const fx = s.fx0 + (s.fx1 - s.fx0) * local;
      if (Math.abs(fx - s.fx) > 0.05) { s.fx = fx; s.el.style.setProperty('--sw-fx', fx.toFixed(2) + '%'); }
      if (s.clip && (!s.hasClip || !s.ready)) {
        // Fallback motion for a leg whose clip isn't ready: slow push-in from identity.
        s.img.style.transform = noVideo ? 'none' : `scale(${(1 + local * 0.1).toFixed(4)})`;
      }
    }

    let scrim = 0;
    for (let i = 0; i < N; i++) {
      const seg = SECTIONS[i]._seg;
      const pr = clamp((y - seg.start) / (seg.end - seg.start), 0, 1);
      const before = y < seg.start, after = y > seg.end;
      let cop;
      if (i === 0) cop = after ? 0 : smooth((1 - pr) / 0.35);            // greets on landing
      else if (i === N - 1) cop = before ? 0 : smooth(pr / 0.3);         // holds CTA at the end
      else cop = (before || after) ? 0 : smooth((0.5 - Math.abs(pr - 0.5)) / 0.25);
      const c = copies[i];
      c.style.opacity = cop;
      c.style.transform = reduce ? 'none' : `translate3d(0, ${((0.5 - pr) * 3).toFixed(3)}vh, 0)`;
      c.style.pointerEvents = cop > 0.5 ? 'auto' : 'none';
      c.style.visibility = cop > 0.001 ? 'visible' : 'hidden';
      scrim = Math.max(scrim, Math.min(1, cop * 1.6));   // the scrim leads the copy in and out
    }
    copylayer.style.setProperty('--sw-scrim', scrim.toFixed(3));

    const cur = SEGMENTS[ci];
    const near = clamp(cur.kind === 'dive' ? cur.si
      : (((y - cur.start) / (cur.end - cur.start)) > 0.5 ? cur.si + 1 : cur.si), 0, N - 1);
    if (near !== activeIndex) {
      activeIndex = near;
      dots.forEach((d, k) => {
        d.classList.toggle('is-active', k === near);
        if (k === near) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
      });
      nav.querySelectorAll('.sw-nav__item').forEach((n, k) => n.classList.toggle('is-active', k === near));
      if (SECTIONS[near].accent) container.style.setProperty('--sw-accent', SECTIONS[near].accent);
      container.dataset.stop = String(near);
    }
    // Route position for the dock line: 0 at the first stop, 1 at the last. A stop holds its value; a leg moves it
    // from its stop to the next one, so the line reaches each stop's label exactly when the camera arrives.
    const legT = cur.kind === 'conn' ? clamp((y - cur.start) / (cur.end - cur.start)) : 0;
    container.style.setProperty('--sw-r', (N > 1 ? (cur.si + legT) / (N - 1) : 0).toFixed(4));
    if (scrollbarFill) scrollbarFill.style.transform = `scaleX(${clamp(y / (totalW * vh))})`;
    hint.style.opacity = String(clamp(1 - y / (0.5 * vh)));
    if (particles) particles.style.transform = `translate3d(0, ${-y * 0.05}px, 0)`;
    ticking = false;
  }

  function raf() {
    const eps = isMobile() ? 0.02 : 0.008;   // coarser seek step on phones = fewer decodes
    for (let i = 0; i < NSEG; i++) {
      const s = SEGMENTS[i];
      if (!s.hasClip || !s.ready || !s.video) continue;
      // Never queue a seek while the decoder is still resolving the last one.
      if (s.video.seeking) continue;
      if (!s.visible && Math.abs(s.cur - s.target) < 0.002) continue;
      s.cur += (s.target - s.cur) * (reduce ? 1 : 0.18);
      const dur = s.video.duration || 1;
      const t = clamp(s.cur, 0, 0.999) * dur;
      if (Math.abs(s.video.currentTime - t) > eps) { try { s.video.currentTime = t; } catch (e) {} }
    }
    requestAnimationFrame(raf);
  }

  // iOS needs a user gesture before a muted video will decode/paint reliably. On the
  // first touch we prime every loaded clip (muted play→pause).
  let userReady = false;
  function primeVideo(v) {
    if (!isMobile() || !v) return;
    try { const p = v.play(); if (p && p.then) p.then(() => { try { v.pause(); } catch (e) {} }).catch(() => {}); }
    catch (e) {}
  }
  function onFirstGesture() {
    if (userReady) return;
    userReady = true;
    SEGMENTS.forEach(s => primeVideo(s.video));
  }
  window.addEventListener('pointerdown', onFirstGesture, { once: true, passive: true });
  window.addEventListener('touchstart', onFirstGesture, { once: true, passive: true });

  if (particles) seedParticles(particles, reduce || coarse);
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(read); } }, { passive: true });
  // Mobile browsers fire `resize` whenever the URL bar slides in/out; on touch only relayout
  // when the width actually changes (rotation also comes through orientationchange).
  function onResize() {
    if (coarse && window.innerWidth === laidOutW) return;
    layout();
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', layout);
  window.addEventListener('load', layout);
  layout();
  container.classList.add('is-mounted');
  // Deep link (e.g. /#reserva): anchors only get their position now, so scroll to it again.
  if (location.hash) {
    const target = anchors.find(a => a && '#' + a.id === decodeURIComponent(location.hash));
    if (target) window.scrollTo({ top: top0 + parseFloat(target.style.top || '0'), behavior: 'auto' });
  }
  requestAnimationFrame(raf);

  // ---- helpers ----
  function el(tag, cls) { const n = document.createElement(tag); if (cls) n.className = cls; return n; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function cssEsc(s) { return (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/"/g, '\\"'); }
  function ctaBtns(cta) {
    let h = '';
    if (cta.primary) h += `<a class="sw-btn sw-btn--primary" href="${esc(cta.primary.href || '#')}">${esc(cta.primary.label)}</a>`;
    if (cta.secondary) h += `<a class="sw-btn sw-btn--ghost" href="${esc(cta.secondary.href || '#')}">${esc(cta.secondary.label)}</a>`;
    return h;
  }
}

function seedParticles(host, reduce) {
  if (!host || reduce) return;
  const kinds = ['dot', 'dot', 'ring'];
  const seeds = [7, 23, 41, 58, 71, 88, 12, 34, 52, 66, 83, 95, 18, 29, 47, 63, 77, 91, 5, 38, 55, 69, 82, 97];
  for (let k = 0; k < 20; k++) {
    const s = document.createElement('span');
    s.className = 'sw-pt sw-pt--' + kinds[k % kinds.length];
    s.style.left = seeds[k % seeds.length] + 'vw';
    s.style.top = ((seeds[(k * 3) % seeds.length] * 1.3) % 100) + 'vh';
    s.style.setProperty('--sw-sc', (0.5 + ((seeds[(k * 5) % seeds.length] % 60) / 60) * 1.1).toFixed(2));
    const dur = 14 + (seeds[(k * 7) % seeds.length] % 22);
    s.style.animationDuration = dur + 's';
    s.style.animationDelay = (-(seeds[(k * 2) % seeds.length] % dur)) + 's';
    host.appendChild(s);
  }
}

function injectCSS() {
  // The engine's CSS ships as a static stylesheet (src/styles/scroll-world.css, imported by global.css) so the
  // server-rendered markup is styled before this script runs. Nothing to inject.
}
