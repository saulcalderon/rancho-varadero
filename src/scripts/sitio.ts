// Animaciones de la página fuera del paseo. Sin librerías: el paseo ya trae su propio suavizado y nada debe pelear con él.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Entradas al hacer scroll (B7): IntersectionObserver, nunca un listener de scroll.
const reveal = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      reveal.unobserve(entry.target);
    }
  },
  { rootMargin: '0px 0px -10% 0px' },
);
document.querySelectorAll('[data-reveal]').forEach((el) => reveal.observe(el));

// Frase principal (B11): las palabras se encienden una a una, en orden de lectura, según el bloque cruza la pantalla.
// Un solo listener de scroll, pasivo y limitado a un frame con requestAnimationFrame, y solo mientras el bloque está cerca.
document.querySelectorAll<HTMLElement>('[data-words]').forEach((block) => {
  const words = [...block.querySelectorAll<HTMLElement>('[data-word]')];
  if (reduceMotion) {
    words.forEach((word) => word.classList.add('is-lit'));
    return;
  }
  let near = false;
  let queued = false;
  const update = () => {
    queued = false;
    const rect = block.getBoundingClientRect();
    const vh = window.innerHeight;
    // 0 cuando el bloque asoma por el 85 % de la pantalla, 1 cuando su final llega al 45 %.
    const progress = Math.min(1, Math.max(0, (vh * 0.85 - rect.top) / (rect.height + vh * 0.4)));
    const lit = Math.round(progress * words.length);
    words.forEach((word, i) => word.classList.toggle('is-lit', i < lit));
  };
  const onScroll = () => {
    if (near && !queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  };
  new IntersectionObserver(([entry]) => {
    near = entry.isIntersecting;
    if (near) onScroll();
  }).observe(block);
  window.addEventListener('scroll', onScroll, { passive: true });
});
