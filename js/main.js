'use strict';

/* ============================================================
   LOGIA TEÓFILO LEAL N° 115 · main.js
   Acto I: cinematográfico (smooth lerp + ease-out-expo + climax autónomo)
   Actos II–IV: IntersectionObserver para fade-in escalonado
============================================================ */

/* ─── CONFIGURACIÓN ─────────────────────────────────────── */
const CFG = {
  /* Typewriter */
  texto:        'Hay preguntas que el mundo exterior no puede responder.',
  typingMs:     65,
  bloqueoMs:    2400,
  skipHintMs:   1100,

  /* Zoom */
  scaleInicio:  0.35,
  scaleClimax:  1.02,
  lerpFactor:   0.052,

  /* Umbrales del carril (fracción 0→1) */
  auraStart:    0.20,
  climaxAt:     0.62,
  btnMostrarAt: 0.15,

  /* Tiempos del climax (ms) */
  pausaClimax:    420,
  durCrossfade:   750,
  offsetDestello: 380,
  durDestello:    550,
  inicioFundido:  1400,
  totalClimax:    2900,

  /* Fade-in de Actos II–IV */
  fadeDelay:    190,   // ms entre elementos escalonados
  fadeThresh:   0.15,  // porcentaje visible para disparar
};

/* ─── CONFIG PRELOADER ──────────────────────────────────── */
const PRE = {
  minSkipMs:  2200,  // mínimo antes de poder saltar
  durBarra:   2600,  // barra llena más despacio — más elegante
  pausaF1:    550,   // pausa tras barra: deja respirar
  durFade:    750,   // fade entre fases
  durF2:      2400,  // identidad visible más tiempo
  durPanel:   820,   // panel sube
  pausaPanel: 380,   // pausa cubierto antes de retirar
  durRetiro:  980,   // panel se retira
};

/* ─── DETECCIÓN DE SOPORTE ──────────────────────────────── */
const SUPPORTS_SDA = CSS.supports('animation-timeline', 'scroll()');

/* ─── DOM ───────────────────────────────────────────────── */
const D = {
  e01:          () => document.getElementById('escena-01'),
  acto2:        () => document.getElementById('acto2'),
  typewriterTxt:() => document.getElementById('typewriter-txt'),
  scrollDot:    () => document.getElementById('scroll-dot'),
  skipHint:     () => document.getElementById('skip-hint'),
  hazPartic:    () => document.getElementById('haz-particulas'),
  carril:       () => document.getElementById('puerta-carril'),
  puertaBg:     () => document.getElementById('puerta-bg'),
  puertaWrapper:() => document.getElementById('puerta-wrapper'),
  puertaCerrada:() => document.getElementById('puerta-cerrada'),
  puertaAura:   () => document.getElementById('puerta-aura'),
  logiaHeader:  () => document.getElementById('logia-header'),
  barraFill:    () => document.getElementById('barra-fill'),
  destello:     () => document.getElementById('destello'),
  btnContinuar: () => document.getElementById('btn-continuar'),
  overlay:      () => document.getElementById('overlay'),
};

/* ─── ESTADO ────────────────────────────────────────────── */
const S = {
  bloqueado:    true,
  typingOk:     false,
  tiempoInicio: 0,
  btnMostrado:  false,
  fase:         'approach', // 'approach' | 'climax' | 'completo'
};

/* ─── UTILS ─────────────────────────────────────────────── */
const clamp        = (v,a,b) => Math.max(a, Math.min(b, v));
const lerp         = (a,b,t) => a + (b-a) * t;
const easeOutExpo  = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
const easeInOutCub = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;


/* ════════════════════════════════════════════════════════════
   ACTO I — TYPEWRITER
════════════════════════════════════════════════════════════ */
function iniciarTypewriter() {
  const txt   = D.typewriterTxt();
  const chars = CFG.texto.split('');
  let i = 0, cancelado = false;

  txt.classList.add('visible');
  setTimeout(() => D.skipHint().classList.add('visible'), CFG.skipHintMs);

  const iv = setInterval(() => {
    if (cancelado) return;
    txt.textContent += chars[i++];
    if (i >= chars.length) { clearInterval(iv); finTyping(); }
  }, CFG.typingMs);

  S.cancelTyping = () => {
    cancelado = true; clearInterval(iv);
    txt.textContent = CFG.texto;
    finTyping();
  };
}

function finTyping() {
  S.typingOk = true;
  D.typewriterTxt().classList.add('completo');
  setTimeout(() => {
    D.scrollDot().classList.add('visible');
    D.skipHint().classList.remove('visible');
  }, 300);
  const restante = Math.max(0, CFG.bloqueoMs - (Date.now() - S.tiempoInicio));
  setTimeout(desbloquear, restante);
}

function desbloquear() {
  S.bloqueado = false;
  document.body.style.overflow = '';
}

function skipIntro() {
  if (!S.typingOk) S.cancelTyping?.();
  if (S.bloqueado) desbloquear();
}


/* ════════════════════════════════════════════════════════════
   ACTO I — PARTÍCULAS (escena 02)
════════════════════════════════════════════════════════════ */
function crearParticulas() {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 16; i++) {
    const p = document.createElement('div');
    p.className = 'particula';
    p.style.cssText = [
      `left:${20 + Math.random() * 60}%`,
      `width:${1 + Math.random() * 2}px`,
      `height:${1 + Math.random() * 2}px`,
      `--dur:${8 + Math.random() * 10}s`,
      `--delay:${Math.random() * -12}s`,
    ].join(';');
    frag.appendChild(p);
  }
  D.hazPartic().appendChild(frag);
}


/* ════════════════════════════════════════════════════════════
   ACTO I — FONDO BLUR DESKTOP
════════════════════════════════════════════════════════════ */
function iniciarFondoDesktop() {
  const cerrada = D.puertaCerrada();
  const bg      = D.puertaBg();
  if (!cerrada || !bg) return;
  const asignar = () => { bg.style.backgroundImage = `url('${cerrada.src}')`; };
  if (cerrada.complete) asignar();
  else cerrada.addEventListener('load', asignar, { once: true });
}


/* ════════════════════════════════════════════════════════════
   ACTO I — BOTÓN CONTINUAR
════════════════════════════════════════════════════════════ */
function iniciarBtnContinuar() {
  D.btnContinuar().addEventListener('click', () => {
    D.btnContinuar().classList.add('completado');
    if (S.fase === 'approach') {
      rawProg = CFG.climaxAt + 0.01;
      dispararClimax();
    }
  });
}


/* ════════════════════════════════════════════════════════════
   ACTO I — LOOP CINEMATOGRÁFICO
   rawProg  = scroll real
   smoothProg = lo que se renderiza (con inercia)
════════════════════════════════════════════════════════════ */
let rawProg    = 0;
let smoothProg = 0;
let loopOk     = false;

function iniciarLoop() {
  loopOk = true;
  function tick() {
    if (!loopOk) return;
    const diff = rawProg - smoothProg;
    if (Math.abs(diff) > 0.00005) {
      smoothProg += diff * CFG.lerpFactor;
      if (S.fase === 'approach') {
        aplicarZoom(smoothProg);
        aplicarAtmosfera(smoothProg);
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* Zoom: ease-out-expo → arranca rápido, frena dramáticamente al llegar */
function aplicarZoom(prog) {
  const wrapper = D.puertaWrapper();
  if (!wrapper) return;
  const p      = clamp(prog / CFG.climaxAt, 0, 1);
  const escala = lerp(CFG.scaleInicio, CFG.scaleClimax, easeOutExpo(p));
  wrapper.style.transform = `scale(${escala.toFixed(4)})`;
}

/* Aura dorada + activaciones secundarias */
function aplicarAtmosfera(prog) {
  const aura = D.puertaAura();
  if (aura) {
    const p = clamp((prog - CFG.auraStart) / (CFG.climaxAt - CFG.auraStart), 0, 1);
    aura.style.opacity = (easeInOutCub(p) * 0.55).toFixed(3);
  }
  if (prog > 0.01) D.puertaBg().classList.add('activo');
  if (prog >= CFG.btnMostrarAt && !S.btnMostrado) {
    S.btnMostrado = true;
    D.btnContinuar().classList.add('visible');
  }
  if (!SUPPORTS_SDA && prog > 0.12) D.logiaHeader().classList.add('visible');
}


/* ════════════════════════════════════════════════════════════
   ACTO I — OBSERVAR CARRIL
════════════════════════════════════════════════════════════ */
function observarCarril() {
  const carril = D.carril();
  if (!carril) return;
  let rafId = null;

  function actualizar() {
    const rect = carril.getBoundingClientRect();
    rawProg    = clamp(-rect.top / (carril.offsetHeight - window.innerHeight), 0, 1);

    if (rawProg >= CFG.climaxAt && S.fase === 'approach') dispararClimax();

    if (!SUPPORTS_SDA) {
      const fill = D.barraFill();
      if (fill) fill.style.height = `${rawProg * 100}%`;
    }
    rafId = null;
  }

  window.addEventListener('scroll', () => {
    if (!rafId) rafId = requestAnimationFrame(actualizar);
  }, { passive: true });

  requestAnimationFrame(actualizar);
}


/* ════════════════════════════════════════════════════════════
   ACTO I — CLIMAX
   Cronología:
    t=0ms    Scroll bloqueado. Puerta aterriza en scale(1.0).
    t=0–420ms Pausa dramática. Aura al máximo.
    t=420ms  Crossfade puerta cerrada → abierta (750ms).
    t=800ms  Destello de luz (550ms).
    t=1400ms Fundido a negro comienza.
    t=2900ms Transición al Acto II.
════════════════════════════════════════════════════════════ */
function dispararClimax() {
  if (S.fase !== 'approach') return;
  S.fase = 'climax';
  document.body.style.overflow = 'hidden';

  const wrapper  = D.puertaWrapper();
  const cerrada  = D.puertaCerrada();
  const destello = D.destello();
  const aura     = D.puertaAura();
  const overlay  = D.overlay();

  /* Aterrizaje con resorte */
  if (wrapper) {
    wrapper.style.transition = 'transform 0.55s cubic-bezier(0.34, 1.35, 0.64, 1)';
    wrapper.style.transform  = 'scale(1.0)';
    setTimeout(() => { if (wrapper) wrapper.style.transition = ''; }, 580);
  }

  /* Aura al máximo */
  if (aura) {
    aura.style.transition = 'opacity 0.7s ease-in';
    aura.style.opacity    = '0.8';
  }

  /* Crossfade */
  setTimeout(() => {
    if (cerrada) {
      cerrada.style.transition = `opacity ${CFG.durCrossfade}ms ease-in-out`;
      cerrada.style.opacity    = '0';
    }
    if (aura) {
      aura.style.transition = `opacity ${CFG.durCrossfade * 0.7}ms ease-in`;
      aura.style.opacity    = '1';
    }
  }, CFG.pausaClimax);

  /* Destello */
  setTimeout(() => {
    if (destello) {
      destello.classList.add('activo');
      setTimeout(() => destello.classList.remove('activo'), CFG.durDestello);
    }
  }, CFG.pausaClimax + CFG.offsetDestello);

  /* Fundido a negro */
  setTimeout(() => overlay.classList.add('activo'), CFG.inicioFundido);

  /* Transición al Acto II */
  setTimeout(() => {
    S.fase = 'completo';
    loopOk = false;
    document.body.style.overflow = '';
    iniciarTransicion();
  }, CFG.totalClimax);
}


/* ════════════════════════════════════════════════════════════
   TRANSICIÓN AL ACTO II
════════════════════════════════════════════════════════════ */
function iniciarTransicion() {
  const overlay = D.overlay();
  const acto2   = D.acto2();

  /* Cambiar fondo del overlay a crema antes de revelar el Acto II */
  overlay.style.background = 'var(--crema)';

  setTimeout(() => {
    if (acto2) acto2.scrollIntoView({ behavior: 'instant' });

    overlay.style.transition = 'opacity 1.3s ease-out';
    overlay.style.opacity    = '0';

    setTimeout(() => {
      overlay.classList.remove('activo');
      overlay.removeAttribute('style');
    }, 1600);
  }, 320);
}


/* ════════════════════════════════════════════════════════════
   ACTOS II–IV — FADE-IN con IntersectionObserver
   Cada elemento .fade-in recibe .visible cuando entra
   al viewport. data-delay (número) escala el stagger.
════════════════════════════════════════════════════════════ */
function iniciarObservadores() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el    = entry.target;
      const orden = parseInt(el.dataset.delay || '0', 10);
      setTimeout(() => el.classList.add('visible'), orden * CFG.fadeDelay);
      observer.unobserve(el);
    });
  }, { threshold: CFG.fadeThresh });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}


/* ════════════════════════════════════════════════════════════
   ENTRADAS — skip y bloqueo inicial
════════════════════════════════════════════════════════════ */
function configurarEntradas() {
  document.body.style.overflow = 'hidden';
  D.e01().addEventListener('click',    () => { if (S.bloqueado) skipIntro(); });
  document.addEventListener('keydown', () => { if (S.bloqueado) skipIntro(); });
  document.addEventListener('wheel',   () => { if (S.bloqueado) skipIntro(); }, { passive: true });
  document.addEventListener('touchstart', () => { if (S.bloqueado) skipIntro(); }, { passive: true });
}


/* ════════════════════════════════════════════════════════════
   PRELOADER — Antesala ceremonial
   Secuencia:
   Logo aparece → barra se llena → barra fade-out / texto fade-in
   → panel sube → init() → panel se retira → Acto I se revela
   El logo no se mueve ni reaparece en ningún momento.
════════════════════════════════════════════════════════════ */
function iniciarPreloader() {
  const elPre      = document.getElementById('preloader');
  const elPanel    = document.getElementById('pre-panel');
  const barraEl    = document.getElementById('pre-barra');
  const barraTrack = document.getElementById('pre-barra-track');
  const identidad  = document.getElementById('pre-identidad');
  const logoImg    = document.getElementById('pre-logo-img');

  if (!elPre) { init(); return; }

  /* Logo: fade-in al cargar, fallback CSS si hay error */
  if (logoImg) {
    const mostrarLogo = () => { logoImg.style.opacity = '1'; };
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      mostrarLogo();
    } else {
      logoImg.addEventListener('load',  mostrarLogo, { once: true });
      logoImg.addEventListener('error', () => { logoImg.style.display = 'none'; }, { once: true });
    }
  }

  let puedeSkip   = false;
  let saltado     = false;
  let panelActivo = false; /* evita doble llamada a cubrirConPanel */

  setTimeout(() => { puedeSkip = true; }, PRE.minSkipMs);

  function intentarSaltar() {
    if (puedeSkip && !saltado) saltar();
  }
  document.addEventListener('click',      intentarSaltar);
  document.addEventListener('keydown',    intentarSaltar);
  document.addEventListener('touchstart', intentarSaltar, { passive: true });

  function limpiarSkip() {
    document.removeEventListener('click',      intentarSaltar);
    document.removeEventListener('keydown',    intentarSaltar);
    document.removeEventListener('touchstart', intentarSaltar);
  }

  /* ── Rellenar la barra ─────────────────────────────────── */
  let progBarra = 0;
  const stepVal = 100 / (PRE.durBarra / 16);
  const timer   = setInterval(() => {
    if (saltado) { clearInterval(timer); return; }
    progBarra = Math.min(100, progBarra + stepVal);
    barraEl.style.width = progBarra + '%';
    if (progBarra >= 100) {
      clearInterval(timer);
      setTimeout(mostrarIdentidad, PRE.pausaF1);
    }
  }, 16);

  /* ── Crossfade: barra desaparece, texto aparece ──────────
     El logo permanece fijo durante todo este momento.        */
  function mostrarIdentidad() {
    if (saltado) return;
    barraTrack.classList.add('oculta');
    setTimeout(() => {
      if (saltado) return;
      identidad.classList.add('visible');
      setTimeout(cubrirConPanel, PRE.durF2);
    }, Math.round(PRE.durFade * 0.55));
  }

  /* ── Panel sube → init() → panel se retira ────────────── */
  function cubrirConPanel() {
    if (panelActivo) return;
    panelActivo = true;
    limpiarSkip();
    elPanel.classList.add('cubriendo');
    setTimeout(() => {
      elPre.classList.add('oculto');
      init();
      setTimeout(retirarPanel, PRE.pausaPanel);
    }, PRE.durPanel);
  }

  function retirarPanel() {
    elPanel.classList.remove('cubriendo');
    elPanel.classList.add('retirando');
    setTimeout(() => elPanel.remove(), PRE.durRetiro + 100);
  }

  /* ── Skip: completa la barra y va directo al panel ─────── */
  function saltar() {
    saltado = true;
    clearInterval(timer);
    barraEl.style.transition = 'width 0.25s ease-out';
    barraEl.style.width      = '100%';
    setTimeout(cubrirConPanel, 340);
  }
}


/* ════════════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════════════ */
function init() {
  S.tiempoInicio = Date.now();

  configurarEntradas();
  crearParticulas();
  iniciarFondoDesktop();
  iniciarBtnContinuar();
  observarCarril();
  iniciarLoop();
  iniciarTypewriter();
  iniciarObservadores();

  console.info(`[Logia TL·115] SDA: ${SUPPORTS_SDA ? 'activo' : 'fallback JS'}`);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarPreloader);
} else {
  iniciarPreloader();
}
