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
   Fase 1 (logo + barra) → Fase 2 (identidad) → panel sube
   → init() se llama → panel se retira → Acto I se revela
════════════════════════════════════════════════════════════ */
function iniciarPreloader() {
  const elPre   = document.getElementById('preloader');
  const elPanel = document.getElementById('pre-panel');
  const f1      = document.getElementById('pre-f1');
  const f2      = document.getElementById('pre-f2');
  const barra   = document.getElementById('pre-barra');
  const logoImg = document.getElementById('pre-logo-img');

  /* Si no existe el preloader en el DOM, arrancar directo */
  if (!elPre) { init(); return; }

  /* Logo: visible al cargar, fallback CSS si no existe */
  if (logoImg) {
    const mostrarLogo = () => { logoImg.style.opacity = '1'; };
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      mostrarLogo();
    } else {
      logoImg.addEventListener('load', mostrarLogo, { once: true });
      logoImg.addEventListener('error', () => { logoImg.style.display = 'none'; }, { once: true });
    }
    /* También el logo de la Fase 2 */
    const id2 = elPre.querySelector('.pre-id-logo');
    if (id2) {
      const mostrar2 = () => { id2.style.opacity = '1'; };
      if (id2.complete && id2.naturalWidth > 0) mostrar2();
      else {
        id2.addEventListener('load',  mostrar2, { once: true });
        id2.addEventListener('error', () => { id2.style.display = 'none'; }, { once: true });
      }
    }
  }

  let puedeSkip = false;
  let saltado   = false;

  setTimeout(() => { puedeSkip = true; }, PRE.minSkipMs);

  /* Skip: click, tecla o toque después del mínimo */
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

  /* ── FASE 1: Logo + barra ─────────────────────────────── */
  f1.classList.add('activa');

  let progBarra  = 0;
  const stepVal  = 100 / (PRE.durBarra / 16);
  const timerBar = setInterval(() => {
    if (saltado) { clearInterval(timerBar); return; }
    progBarra = Math.min(100, progBarra + stepVal);
    barra.style.width = progBarra + '%';
    if (progBarra >= 100) {
      clearInterval(timerBar);
      setTimeout(irAFase2, PRE.pausaF1);
    }
  }, 16);

  /* ── FASE 2: Identidad ────────────────────────────────── */
  function irAFase2() {
    if (saltado) return;
    f1.classList.remove('activa');
    setTimeout(() => {
      if (saltado) return;
      f2.classList.add('activa');
      setTimeout(cubrirConPanel, PRE.durF2);
    }, PRE.durFade);
  }

  /* ── PANEL CUBRE → init() → panel se retira ──────────── */
  function cubrirConPanel() {
    if (saltado) saltado = true; /* evitar doble llamada */
    limpiarSkip();
    f1.classList.remove('activa');
    f2.classList.remove('activa');
    elPanel.classList.add('cubriendo');

    setTimeout(() => {
      elPre.classList.add('oculto'); /* preloader desaparece */
      init();                        /* Acto I arranca debajo del panel */
      setTimeout(retirarPanel, PRE.pausaPanel);
    }, PRE.durPanel);
  }

  function retirarPanel() {
    elPanel.classList.remove('cubriendo');
    elPanel.classList.add('retirando');
    setTimeout(() => elPanel.remove(), PRE.durRetiro + 100);
  }

  /* ── SALTAR ───────────────────────────────────────────── */
  function saltar() {
    saltado = true;
    clearInterval(timerBar);
    barra.style.transition = 'width 0.28s ease-out';
    barra.style.width = '100%';
    f1.classList.remove('activa');
    f2.classList.remove('activa');
    setTimeout(cubrirConPanel, 320);
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
