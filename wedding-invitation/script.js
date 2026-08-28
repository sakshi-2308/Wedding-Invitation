/* ════════════════════════════════════════════════════════════
   LUXURY WEDDING INVITATION — script.js
   Vanilla JS only. Modular, commented, performance-first.
   ════════════════════════════════════════════════════════════ */
"use strict";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ────────────────────────────────────────────────────────────
   1 · MUSIC  (starts when the wax seal is tapped; button pauses/resumes)
   ──────────────────────────────────────────────────────────── */
const Music = (function musicController() {
  const btn   = $("#musicToggle");
  const audio = $("#bgMusic");

  function setUI(isPlaying) {
    btn.setAttribute("aria-pressed", String(isPlaying));
    btn.setAttribute("aria-label", isPlaying ? "Pause background music" : "Play background music");
  }

  function fadeVolume(el, target, ms) {
    const steps = 30, inc = target / steps;
    let i = 0;
    const t = setInterval(() => {
      el.volume = Math.min(target, el.volume + inc);
      if (++i >= steps) clearInterval(t);
    }, ms / steps);
  }

  async function play() {
    if (btn.getAttribute("aria-pressed") === "true") return;
    try {
      audio.volume = 0;
      await audio.play();
      setUI(true);
      fadeVolume(audio, 0.55, 1500);                 // gentle fade-in
    } catch {
      // Track missing — tell the user politely
      btn.animate([{ transform: "rotate(-8deg)" }, { transform: "rotate(8deg)" }, { transform: "rotate(0)" }], 300);
      console.info("Add your music file at assets/audio/song.mp3");
    }
  }

  function pause() {
    audio.pause();
    setUI(false);
  }

  btn.addEventListener("click", () => {
    const playing = btn.getAttribute("aria-pressed") === "true";
    playing ? pause() : play();
  });

  // Stop the track when the page is backgrounded/closed so it doesn't
  // keep playing after the user has switched away or "closed" the tab.
  let resumeOnReturn = false;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      resumeOnReturn = btn.getAttribute("aria-pressed") === "true";
      if (resumeOnReturn) pause();
    } else if (resumeOnReturn) {
      resumeOnReturn = false;
      play();
    }
  });
  window.addEventListener("pagehide", () => audio.pause());

  return { play, pause };
})();

/* ────────────────────────────────────────────────────────────
   2 · ENVELOPE OPENING
   Tap seal → wax melts → flap opens → card rises → site fades in
   ──────────────────────────────────────────────────────────── */
(function envelopeOpening() {
  const screen   = $("#envelopeScreen");
  const envelope = $("#envelope");
  const seal     = $("#waxSeal");
  const site     = $("#site");
  let opened = false;

  seal.addEventListener("click", () => {
    if (opened) return;
    opened = true;

    envelope.classList.add("opening");
    goldBurst();                                   // golden particles
    Music.play();                                  // song starts the moment the seal is tapped

    const delay = prefersReducedMotion ? 150 : 1900;
    setTimeout(() => {
      site.hidden = false;
      document.body.classList.remove("is-locked");
      screen.classList.add("done");
      // remove from DOM after the fade so it never blocks taps
      setTimeout(() => screen.remove(), 1600);
      Petals.start();                              // ambient petals begin with the site
    }, delay);
  }, { once: false });
})();

/* ────────────────────────────────────────────────────────────
   3 · AMBIENT PETALS  (single canvas, capped count, rAF)
   ──────────────────────────────────────────────────────────── */
const Petals = (() => {
  const canvas = $("#petalCanvas");
  const ctx = canvas.getContext("2d");
  const COLORS = ["#E8B4B8", "#F2D0A4", "#E3C98F", "#D9A5A5"];
  const MAX = window.innerWidth < 720 ? 14 : 24;   // fewer on phones
  let petals = [], running = false, raf = null;

  function resize() {
    canvas.width  = window.innerWidth  * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();

  function spawn(y = -20) {
    return {
      x: Math.random() * window.innerWidth,
      y,
      r: 4 + Math.random() * 6,
      vy: 0.35 + Math.random() * 0.7,
      vx: -0.3 + Math.random() * 0.6,
      rot: Math.random() * Math.PI * 2,
      vr: -0.01 + Math.random() * 0.02,
      sway: Math.random() * Math.PI * 2,
      color: COLORS[(Math.random() * COLORS.length) | 0],
    };
  }

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();                               // teardrop petal shape
    ctx.moveTo(0, -p.r);
    ctx.quadraticCurveTo(p.r, 0, 0, p.r);
    ctx.quadraticCurveTo(-p.r, 0, 0, -p.r);
    ctx.fill();
    ctx.restore();
  }

  function tick() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const p of petals) {
      p.sway += 0.02;
      p.x += p.vx + Math.sin(p.sway) * 0.4;
      p.y += p.vy;
      p.rot += p.vr;
      if (p.y > window.innerHeight + 20) Object.assign(p, spawn());
      drawPetal(p);
    }
    raf = requestAnimationFrame(tick);
  }

  // Pause when tab hidden — saves battery
  document.addEventListener("visibilitychange", () => {
    if (!running) return;
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(tick);
  });

  return {
    start() {
      if (running || prefersReducedMotion) return;
      running = true;
      petals = Array.from({ length: MAX }, () => spawn(Math.random() * window.innerHeight));
      tick();
    },
    /** One-off celebratory burst (used when the scratch card reveals) */
    burst(n = 40) {
      if (prefersReducedMotion) return;
      for (let i = 0; i < n; i++) {
        const p = spawn(-20 - Math.random() * 200);
        p.vy += 1.2;
        petals.push(p);
      }
      setTimeout(() => (petals.length = Math.min(petals.length, MAX)), 6000);
    },
  };
})();

/* ────────────────────────────────────────────────────────────
   4 · CURSOR SPARKLES + GOLD BURST  (skipped on touch/reduced-motion)
   ──────────────────────────────────────────────────────────── */
const sparkCanvas = $("#sparkleCanvas");
const sctx = sparkCanvas.getContext("2d");
let sparks = [];

function sparkResize() {
  sparkCanvas.width  = window.innerWidth  * devicePixelRatio;
  sparkCanvas.height = window.innerHeight * devicePixelRatio;
  sctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
window.addEventListener("resize", sparkResize, { passive: true });
sparkResize();

function sparkLoop() {
  sctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  sparks = sparks.filter(s => s.life > 0);
  for (const s of sparks) {
    s.x += s.vx; s.y += s.vy; s.vy += s.g; s.life -= 0.02;
    sctx.globalAlpha = Math.max(s.life, 0);
    sctx.fillStyle = s.color;
    sctx.beginPath();
    sctx.arc(s.x, s.y, Math.max(0, s.r * s.life), 0, Math.PI * 2);
    sctx.fill();
  }
  requestAnimationFrame(sparkLoop);
}
if (!prefersReducedMotion) sparkLoop();

function addSpark(x, y, opts = {}) {
  sparks.push({
    x, y,
    vx: (Math.random() - 0.5) * (opts.spread ?? 1.2),
    vy: (Math.random() - 0.5) * (opts.spread ?? 1.2) - (opts.lift ?? 0),
    g: opts.g ?? 0.01,
    r: 1 + Math.random() * (opts.size ?? 2),
    life: 1,
    color: opts.color ?? (Math.random() > 0.5 ? "#E3C98F" : "#C6A15B"),
  });
}

/** Golden particle burst from screen centre (envelope opening) */
function goldBurst() {
  if (prefersReducedMotion) return;
  const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
  for (let i = 0; i < 90; i++) {
    addSpark(cx + (Math.random() - 0.5) * 120, cy + (Math.random() - 0.5) * 90,
      { spread: 5, lift: 1.5, size: 2.6, g: 0.03 });
  }
}

// Subtle sparkle trail — pointer only, throttled
if (!prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
  let last = 0;
  window.addEventListener("pointermove", (e) => {
    const now = performance.now();
    if (now - last < 40 || sparks.length > 60) return; // throttle + cap
    last = now;
    addSpark(e.clientX, e.clientY, { spread: 0.8, size: 1.4 });
  }, { passive: true });
}

/* ────────────────────────────────────────────────────────────
   5 · SCROLL REVEALS  (IntersectionObserver)
   ──────────────────────────────────────────────────────────── */
(function scrollReveals() {
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (en.isIntersecting) {
        en.target.classList.add("in");
        io.unobserve(en.target);
      }
    }
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });

  $$("[data-reveal], .tl-item").forEach(el => io.observe(el));
})();

/* ────────────────────────────────────────────────────────────
   5b · TIMELINE PROGRESS LINE  (fills as the timeline scrolls by)
   ──────────────────────────────────────────────────────────── */
(function timelineProgress() {
  const timeline = $(".timeline");
  if (!timeline) return;
  let queued = false;

  function update() {
    queued = false;
    const rect = timeline.getBoundingClientRect();
    const ref = window.innerHeight * 0.6;              // fill point: 60% down the viewport
    const progress = (ref - rect.top) / rect.height;
    timeline.style.setProperty("--tl-progress", Math.min(1, Math.max(0, progress)));
  }

  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
})();

/* ────────────────────────────────────────────────────────────
   6 · SCRATCH CARD  (canvas foil; works with mouse + touch)
   ──────────────────────────────────────────────────────────── */
(function scratchCard() {
  const card   = $("#scratchCard");
  const canvas = $("#scratchCanvas");
  const revealBtn = $("#revealAllBtn");
  if (!card || !canvas) return;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  let revealed = false, drawing = false, checkQueued = false;

  function paintFoil() {
    const rect = card.getBoundingClientRect();
    canvas.width  = rect.width  * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    ctx.globalCompositeOperation = "source-over";  // reset before repainting

    // Champagne-gold foil gradient
    const g = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    g.addColorStop(0, "#B08A3E");
    g.addColorStop(0.35, "#E9D6A0");
    g.addColorStop(0.55, "#C6A15B");
    g.addColorStop(0.8, "#8F6E2C");
    g.addColorStop(1, "#D9BE7F");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Soft speckle texture so it reads as foil
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? "#fff" : "#5E1723";
      ctx.fillRect(Math.random() * rect.width, Math.random() * rect.height, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "destination-out"; // scratching = erasing
  }

  // Repaint once the section is near the viewport (correct sizing)
  new IntersectionObserver((e, obs) => {
    if (e[0].isIntersecting) { paintFoil(); revealBtn.hidden = false; obs.disconnect(); }
  }, { rootMargin: "200px" }).observe(card);

  function scratchAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();
    card.classList.add("started");
  }

  function checkProgress() {
    if (revealed || checkQueued) return;
    checkQueued = true;
    // Sample a downscaled grid instead of every pixel — cheap on mobile
    setTimeout(() => {
      checkQueued = false;
      const { width, height } = canvas;
      const data = ctx.getImageData(0, 0, width, height).data;
      let clear = 0, total = 0;
      for (let i = 3; i < data.length; i += 4 * 24) { // stride sampling
        total++;
        if (data[i] === 0) clear++;
      }
      if (clear / total > 0.45) revealAll();
    }, 120);
  }

  function revealAll() {
    if (revealed) return;
    revealed = true;
    card.classList.add("revealed");
    revealBtn.hidden = true;
    Petals.burst(50);                              // celebratory petals
    // Confetti-style gold sparks over the card
    const r = card.getBoundingClientRect();
    for (let i = 0; i < 60; i++) {
      addSpark(r.left + Math.random() * r.width, r.top + Math.random() * r.height,
        { spread: 3, lift: 1.2, size: 2.2, g: 0.02 });
    }
  }

  // Pointer events cover mouse + touch + pen
  canvas.addEventListener("pointerdown", (e) => { drawing = true; canvas.setPointerCapture(e.pointerId); scratchAt(e.clientX, e.clientY); });
  let lastCheck = 0;
  canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    scratchAt(e.clientX, e.clientY);
    const now = performance.now();
    if (now - lastCheck > 700) { lastCheck = now; checkProgress(); } // reveal mid-scratch too
  });
  ["pointerup", "pointercancel"].forEach(ev =>
    canvas.addEventListener(ev, () => { drawing = false; checkProgress(); }));

  revealBtn.addEventListener("click", revealAll);
  window.addEventListener("resize", () => { if (!revealed) paintFoil(); }, { passive: true });
})();

/* ────────────────────────────────────────────────────────────
   7 · COUNTDOWN  — reads ISO date from #countdown[data-date]
   ──────────────────────────────────────────────────────────── */
(function countdown() {
  const section = $("#countdown");
  const target = new Date(section.dataset.date).getTime();
  const els = { d: $("#cdDays"), h: $("#cdHours"), m: $("#cdMins"), s: $("#cdSecs") };
  const pad = n => String(n).padStart(2, "0");

  function update() {
    const diff = target - Date.now();
    if (isNaN(target)) return;
    if (diff <= 0) {
      els.d.textContent = els.h.textContent = els.m.textContent = els.s.textContent = "00";
      clearInterval(timer);
      return;
    }
    els.d.textContent = pad(Math.floor(diff / 864e5));
    els.h.textContent = pad(Math.floor(diff / 36e5) % 24);
    els.m.textContent = pad(Math.floor(diff / 6e4) % 60);
    els.s.textContent = pad(Math.floor(diff / 1e3) % 60);
  }
  update();
  const timer = setInterval(update, 1000);
})();

/* ────────────────────────────────────────────────────────────
   8 · GALLERY — carousel arrows + lightbox with zoom
   ──────────────────────────────────────────────────────────── */
(function gallery() {
  const track = $("#galleryTrack");
  const items = $$(".g-item", track);
  const lb = $("#lightbox"), stage = $("#lbStage");
  let index = 0;

  // Arrow scrolling
  const step = () => track.firstElementChild.getBoundingClientRect().width + 16;
  $("#galPrev").addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
  $("#galNext").addEventListener("click", () => track.scrollBy({ left:  step(), behavior: "smooth" }));

  // Lightbox
  function render() {
    const item = items[index];
    stage.innerHTML = "";
    const img = item.querySelector("img");
    const vid = item.querySelector("video");
    if (img) {
      const big = img.cloneNode();
      big.classList.remove("media-img");   // drop absolute/cover sizing so the lightbox can fit the whole image
      big.loading = "eager";
      big.addEventListener("click", () => big.classList.toggle("lb-zoomed")); // tap to zoom
      stage.appendChild(big);
    } else if (vid) {
      const v = vid.cloneNode(true);
      v.classList.remove("media-video");   // drop absolute/cover sizing so the lightbox can fit the whole video
      v.controls = true; v.autoplay = true; v.muted = false;
      stage.appendChild(v);
    } else {
      stage.appendChild(item.querySelector(".media-placeholder").cloneNode(true)); // placeholder demo
    }
  }
  function open(i) { index = i; render(); lb.hidden = false; document.body.style.overflow = "hidden"; $("#lbClose").focus(); }
  function close()  { lb.hidden = true; stage.innerHTML = ""; document.body.style.overflow = ""; }
  const nav = dir => { index = (index + dir + items.length) % items.length; render(); };

  items.forEach((item, i) => {
    item.addEventListener("click", () => open(i));
    item.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); } });
  });
  $("#lbClose").addEventListener("click", close);
  $("#lbPrev").addEventListener("click", () => nav(-1));
  $("#lbNext").addEventListener("click", () => nav(1));
  lb.addEventListener("click", e => { if (e.target === lb) close(); });
  document.addEventListener("keydown", e => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") nav(-1);
    if (e.key === "ArrowRight") nav(1);
  });

  // Swipe left/right inside the lightbox (mobile)
  let touchX = null;
  lb.addEventListener("touchstart", e => (touchX = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) nav(dx > 0 ? -1 : 1);
    touchX = null;
  }, { passive: true });
})();

/* ────────────────────────────────────────────────────────────
   9 · LAZY-LOAD VIDEOS you add later
   Any <video data-lazy data-src="..."> starts loading only
   when it approaches the viewport.
   ──────────────────────────────────────────────────────────── */
(function lazyVideos() {
  const vids = $$("video[data-lazy]");
  if (!vids.length) return;
  const io = new IntersectionObserver((entries, obs) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      const v = en.target;
      v.src = v.dataset.src;
      v.load();
      if (v.hasAttribute("autoplay")) v.play().catch(() => {});
      obs.unobserve(v);
    }
  }, { rootMargin: "300px" });
  vids.forEach(v => io.observe(v));
})();
