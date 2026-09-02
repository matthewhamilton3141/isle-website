/* ==========================================================================
   Isle — site behaviour

   Two things are drawn here rather than styled: the island, and the hole it
   sits in. The bar at the top of the page is painted as a solid light strip
   with the island's shape punched out of it, so the black island really is a
   cutout in the page.

   The replica does not open. On the page the island is a still life — the
   recording is where you watch it move — so there is no panel, no transport
   and no hover state to get wrong. What it does do is follow the page: each
   section names a state, and the marker and its word change as you pass.

   The outline is the same path the app draws (NotchShape.swift), and every
   marker comes from MarkerDesign.default(for:).
   ========================================================================== */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Markers -----------------------------------------------------------
     The block below is generated from the app's own Swift, so the replica
     can't drift from the island it's imitating. After changing
     MarkerDesign.swift, MarkerKind.swift, NotchShape.swift or
     NotchMetrics.swift, run:  node scripts/sync-from-swift.mjs

     Everything after it is the site's own editorial: which states to show and
     the word the island puts beside each one.
     ---------------------------------------------------------------------- */

  /* --- BEGIN GENERATED (scripts/sync-from-swift.mjs) --------- */
  var SWIFT = {
    /* Isle 0.3.2 — MarkerDesign.swift, MarkerKind.swift, NotchShape.swift, NotchMetrics.swift */
    dimension: 5,
    notch: { topCornerRadius: 8, bottomCornerRadius: 14 },
    markers: {
      disconnected: { title: "Disconnected", detail: "No active Claude Code session.", dots: "1111111111111111111111111", colorMode: "fixed", hex: "#8e8e93", anim: "pulse", speed: 1, intensity: 0.18, ghost: true },
      idle: { title: "Idle", detail: "Session ready, nothing happening.", dots: "1111111111111111111111111", colorMode: "palette", hex: "#8e8e93", anim: "pulse", speed: 1.6, intensity: 0.45, ghost: true },
      working: { title: "Working", detail: "Claude is actively doing something.", dots: "1111111111111111111111111", colorMode: "palette", hex: "#0a84ff", anim: "motion", speed: 3.2, intensity: 1, ghost: true },
      done: { title: "Done", detail: "Claude finished responding.", dots: "0000100010101000100000000", colorMode: "fixed", hex: "#34c759", anim: "solid", speed: 2, intensity: 1, ghost: true },
      needsApproval: { title: "Approve edit", detail: "Claude wants to run a tool or apply an edit.", dots: "0111000010001000000000100", colorMode: "fixed", hex: "#0a84ff", anim: "pulse", speed: 3.5, intensity: 1, ghost: true },
      needsQuestion: { title: "Question", detail: "Claude asked you a question.", dots: "0111000010001000000000100", colorMode: "fixed", hex: "#0a84ff", anim: "pulse", speed: 3.5, intensity: 1, ghost: true },
      planReview: { title: "Plan review", detail: "A plan is ready for you to review.", dots: "1111100000111110000011111", colorMode: "fixed", hex: "#32ade6", anim: "shimmer", speed: 2.4, intensity: 1, ghost: true },
      apiError: { title: "API error", detail: "The API returned an error.", dots: "1000101010001000101010001", colorMode: "fixed", hex: "#ff3b30", anim: "pulse", speed: 4, intensity: 1, ghost: true },
      serverError: { title: "Server error", detail: "A 5xx / overloaded response.", dots: "1000101010001000101010001", colorMode: "fixed", hex: "#ff3b30", anim: "blink", speed: 3, intensity: 1, ghost: true },
      rateLimited: { title: "Rate limited", detail: "Usage or rate limit reached.", dots: "0010000100001000000000100", colorMode: "fixed", hex: "#ff9f0a", anim: "blink", speed: 2, intensity: 1, ghost: true },
      networkOffline: { title: "Offline", detail: "No network connection.", dots: "1000101010001000101010001", colorMode: "fixed", hex: "#8e8e93", anim: "solid", speed: 1.5, intensity: 0.9, ghost: true },
      waitingInput: { title: "Waiting for input", detail: "Waiting on you to type.", dots: "0000000000101010000000000", colorMode: "palette", hex: "#0a84ff", anim: "shimmer", speed: 1.6, intensity: 1, ghost: true },
      success: { title: "Success", detail: "A task completed successfully.", dots: "0000100010101000100000000", colorMode: "fixed", hex: "#34c759", anim: "pulse", speed: 2.6, intensity: 1, ghost: true },
      warning: { title: "Warning", detail: "Something needs attention, non-blocking.", dots: "0010000100001000000000100", colorMode: "fixed", hex: "#ff9f0a", anim: "solid", speed: 2, intensity: 1, ghost: true },
      compacting: { title: "Compacting", detail: "Compacting the conversation context.", dots: "1111111111111111111111111", colorMode: "palette", hex: "#32ade6", anim: "compact", speed: 2.2, intensity: 0.9, ghost: true },
      paused: { title: "Paused", detail: "Session paused.", dots: "0101001010010100101001010", colorMode: "fixed", hex: "#8e8e93", anim: "solid", speed: 1, intensity: 0.7, ghost: true }
    }
  };
  /* --- END GENERATED ------------------------------------------------- */

  /* The app tints its `palette` markers and its waveform from the album
     artwork. The demo cover is drawn rather than decoded, so these are the
     stops of the gradient `.art` paints — read from the same custom properties
     the gradient uses, so the two can't drift apart. */
  var ART = ["--art-1", "--art-2", "--art-3"].map(function (name, i) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return /^#[0-9a-f]{6}$/i.test(v) ? v : ["#37d67a", "#25b6c9", "#4a7dff"][i];
  });

  var ART_RGB = ART.map(function (h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  });

  /* The gradient sampled at 0..1. */
  function artColor(t) {
    t = Math.min(1, Math.max(0, t));
    var seg = t * (ART_RGB.length - 1);
    var i = Math.min(ART_RGB.length - 2, Math.floor(seg));
    var f = seg - i, a = ART_RGB[i], b = ART_RGB[i + 1];
    return "rgb(" +
      Math.round(a[0] + (b[0] - a[0]) * f) + "," +
      Math.round(a[1] + (b[1] - a[1]) * f) + "," +
      Math.round(a[2] + (b[2] - a[2]) * f) + ")";
  }

  /* The animations the site can draw. MarkerDesign has one more, `compact`,
     which no shown state uses — anything unsupported rests on `solid`. */
  var ANIMS = { solid: 1, pulse: 1, blink: 1, shimmer: 1, motion: 1 };

  var SHOWN = {
    working:      { short: "Thinking…" },
    needsQuestion:{ short: "Question" },
    waitingInput: { short: "Waiting" },
    done:         { short: "Done" }
  };

  var MARKERS = {};
  Object.keys(SHOWN).forEach(function (kind) {
    var s = SWIFT.markers[kind];
    MARKERS[kind] = {
      title: s.title,
      short: SHOWN[kind].short,
      detail: s.detail,
      dots: s.dots,
      palette: s.colorMode === "palette",
      color: s.colorMode === "palette" ? artColor(0.5) : s.hex,
      anim: ANIMS[s.anim] ? s.anim : "solid",
      speed: s.speed,
      intensity: s.intensity,
      ghost: s.ghost
    };
  });

  window.IsleMarkers = MARKERS;

  /* --- Dot matrix ------------------------------------------------------- */

  var DIM = SWIFT.dimension;
  var jsGrids = [];

  /* A palette marker takes the cover's gradient across the grid, on the same
     diagonal `.art` runs it. A fixed one is one colour, as the app draws it. */
  function paintDot(dot, m, i) {
    if (!m.palette) { dot.style.color = ""; return; }
    var col = i % DIM, row = (i / DIM) | 0;
    dot.style.color = artColor((col + row) / (2 * (DIM - 1)));
  }

  function buildDots(kind, size) {
    var m = MARKERS[kind];
    var el = document.createElement("div");
    el.className = "dots" + (size ? " dots--" + size : "");
    el.style.color = m.color;
    el.style.opacity = String(m.intensity);
    el.dataset.kind = kind;
    el.dataset.ghost = m.ghost ? "1" : "0";

    for (var i = 0; i < m.dots.length; i++) {
      var d = document.createElement("i");
      d.className = "dots__dot";
      if (m.dots[i] === "1") d.dataset.lit = "1";
      paintDot(d, m, i);
      el.appendChild(d);
    }
    applyAnim(el, kind);
    return el;
  }

  function applyAnim(el, kind) {
    var m = MARKERS[kind];
    el.dataset.anim = m.anim === "motion" ? "" : m.anim;
    el.style.setProperty("--dur", (Math.min(3, Math.max(0.3, 3 / m.speed))).toFixed(2) + "s");

    // Per-dot phase offsets for shimmer. Always drop the inline opacity the
    // motion loop writes: a CSS animation overrides it on the lit dots, but an
    // unlit one would keep the value and stop reading as a ghost.
    var dots = el.children;
    for (var i = 0; i < dots.length; i++) {
      dots[i].style.animationDelay = m.anim === "shimmer" ? (i * 0.055).toFixed(3) + "s" : "";
      dots[i].style.opacity = "";
    }

    el.dataset.jsAnim = m.anim === "motion" ? m.anim : "";
    if (jsGrids.indexOf(el) === -1) jsGrids.push(el);
  }

  function setMarker(el, kind) {
    var m = MARKERS[kind];
    el.dataset.kind = kind;
    el.dataset.ghost = m.ghost ? "1" : "0";
    el.style.color = m.color;
    el.style.opacity = String(m.intensity);
    for (var i = 0; i < m.dots.length; i++) {
      if (m.dots[i] === "1") el.children[i].dataset.lit = "1";
      else delete el.children[i].dataset.lit;
      paintDot(el.children[i], m, i);
    }
    applyAnim(el, kind);
  }

  function setIslandWord(m) {
    document.querySelectorAll("[data-island-short]").forEach(function (n) {
      n.textContent = m.short;
      n.style.color = m.color;
    });
  }

  /* Thinking's `motion` is the one animation CSS can't express: an evolving
     plasma rather than a loop. One shared loop drives every grid showing it. */
  function tickGrids(t) {
    for (var g = 0; g < jsGrids.length; g++) {
      var el = jsGrids[g];
      if (el.dataset.jsAnim !== "motion" || !el.isConnected) continue;
      var m = MARKERS[el.dataset.kind];
      var dots = el.children;

      for (var i = 0; i < dots.length; i++) {
        var col = i % DIM, row = (i / DIM) | 0;
        var v = Math.sin(t * m.speed * 0.55 + col * 0.85 + Math.sin(t * 0.7 + row * 0.62) * 1.3);
        dots[i].style.opacity = (0.14 + (v * 0.5 + 0.5) * 0.86).toFixed(3);
      }
    }
  }

  /* --- The notch outline (NotchShape.swift) ----------------------------- */

  var BOX_W = 560;

  /* The app's shape, centred in a box `boxW` wide. */
  function notchPath(w, h, top, bottom, boxW) {
    var maxR = Math.min(w, h) / 2;
    top = Math.min(top, maxR);
    bottom = Math.min(bottom, maxR);
    var x = (boxW - w) / 2, y = 0;
    var r = x + w;

    return [
      "M", x, y,
      "Q", x + top, y, x + top, y + top,
      "L", x + top, y + h - bottom,
      "Q", x + top, y + h, x + top + bottom, y + h,
      "L", r - top - bottom, y + h,
      "Q", r - top, y + h, r - top, y + h - bottom,
      "L", r - top, y + top,
      "Q", r - top, y, r, y,
      "Z"
    ].map(function (n) { return typeof n === "number" ? n.toFixed(2) : n; }).join(" ");
  }

  /* --- The island and the hole it sits in --------------------------------
     The bar is a filled rectangle with the island subtracted from it, so the
     island is genuinely a cutout rather than a black box sitting on top.
     ---------------------------------------------------------------------- */

  function initIsland() {
    var mount = document.getElementById("island");
    var bar = document.querySelector(".bar");
    if (!mount || !bar) return null;

    var island = mount.querySelector(".island-fill");
    var layer = mount.querySelector(".island-layer");

    var sheet = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    sheet.setAttribute("class", "bar__sheet");
    sheet.setAttribute("aria-hidden", "true");
    sheet.setAttribute("preserveAspectRatio", "none");
    var hole = document.createElementNS("http://www.w3.org/2000/svg", "path");
    hole.setAttribute("fill-rule", "evenodd");
    hole.setAttribute("fill", "var(--sheet)");
    sheet.appendChild(hole);
    bar.insertBefore(sheet, bar.firstChild);

    // The sizes live in CSS custom properties and a breakpoint can change
    // them, so read them again whenever the window does.
    var M = { open: 0, cutout: 0, h: 0 };
    function readMetrics() {
      var css = getComputedStyle(document.documentElement);
      M.open = parseFloat(css.getPropertyValue("--collapsed-w"));
      M.cutout = parseFloat(css.getPropertyValue("--cutout-w"));
      M.h = parseFloat(css.getPropertyValue("--bar-h"));
    }
    readMetrics();

    /* The one piece of motion the page opens with: the island widens out of
       the camera housing, the way the app does the first time it has anything
       to show. The hole in the bar is the same path, so the menu bar opens
       with it. Then it holds still — nothing here expands again. */
    var w = reduced ? M.open : M.cutout;
    var v = 0;
    var settled = reduced;

    function draw() {
      var top = SWIFT.notch.topCornerRadius;
      var bottom = SWIFT.notch.bottomCornerRadius;
      island.setAttribute("d", notchPath(w, M.h, top, bottom, BOX_W));

      // The row is a fixed width and the layer clips it, so the contents are
      // uncovered by the opening edge rather than dragged along by it.
      layer.style.width = w + "px";
      var t = (w - M.cutout) / Math.max(1, M.open - M.cutout);
      layer.style.opacity = Math.max(0, Math.min(1, (t - 0.25) / 0.6)).toFixed(3);

      var W = bar.clientWidth, H = bar.clientHeight;
      if (!W || !H) return;
      sheet.setAttribute("viewBox", "0 0 " + W + " " + H);
      hole.setAttribute("d", "M0 0 H" + W + " V" + H + " H0 Z " + notchPath(w, M.h, top, bottom, W));
    }

    function step(dt) {
      if (settled) return;
      // Critically damped spring — the app's "system feel" without a curve.
      var k = 190, c = 2 * Math.sqrt(k) * 0.92;
      v += (-k * (w - M.open) - c * v) * dt;
      w += v * dt;
      if (Math.abs(w - M.open) < 0.4 && Math.abs(v) < 4) {
        w = M.open; v = 0; settled = true;
      }
      draw();
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        readMetrics();
        if (settled) w = M.open;
        draw();
      }, 120);
    });

    draw();
    return { step: step };
  }

  /* --- Waveform ---------------------------------------------------------- */

  function initWave(el, count) {
    el.innerHTML = "";
    var bars = [];
    for (var i = 0; i < count; i++) {
      var b = document.createElement("i");
      b.className = "wave__bar";
      // The app's equalizer takes its colours from the cover; so does this.
      b.style.background = artColor(count > 1 ? i / (count - 1) : 0.5);
      el.appendChild(b);
      bars.push(b);
    }
    return { el: el, bars: bars };
  }

  function tickWave(w, t, height) {
    for (var i = 0; i < w.bars.length; i++) {
      var v = 0.5 + 0.5 * Math.sin(t * 3.1 + i * 0.72) * Math.sin(t * 1.31 + i * 0.29);
      v = Math.max(0.1, Math.abs(v));
      w.bars[i].style.height = (3 + v * height).toFixed(1) + "px";
    }
  }

  /* --- The screen recording ---------------------------------------------- */

  function initDemo() {
    var stage = document.querySelector(".demo__stage");
    if (!stage) return;

    var video = stage.querySelector(".demo__video");
    if (!video) return;

    // The stand-in gives way as soon as there is a real file behind it —
    // metadata is proof enough, since the poster is showing by then.
    function ready() { stage.dataset.ready = "true"; }
    video.addEventListener("loadedmetadata", ready);
    video.addEventListener("loadeddata", ready);
    if (video.readyState >= 1) ready();

    // Twenty seconds of motion on a loop is exactly what reduced motion asks
    // you not to start on your own — hand over the poster and the controls.
    if (reduced) {
      video.autoplay = false;
      video.loop = false;
      video.controls = true;
      video.pause();
      return;
    }

    var played = video.play();
    if (played && played.catch) played.catch(function () {});
  }

  /* --- Copy buttons ------------------------------------------------------ */

  function initCopy() {
    document.querySelectorAll(".code").forEach(function (block) {
      var text = block.dataset.copy || block.textContent.replace(/^\$\s?/gm, "").trim();
      var btn = document.createElement("button");
      btn.className = "copy";
      btn.type = "button";
      btn.textContent = "Copy";
      btn.addEventListener("click", function () {
        navigator.clipboard.writeText(text).then(function () {
          btn.textContent = "Copied";
          btn.dataset.done = "true";
          setTimeout(function () { btn.textContent = "Copy"; delete btn.dataset.done; }, 1600);
        });
      });
      block.appendChild(btn);
    });
  }

  /* --- Marker catalogue rendering ---------------------------------------- */

  function renderCatalogue(host) {
    if (!host) return;

    var grid = document.createElement("div");
    grid.className = "markers";

    Object.keys(MARKERS).forEach(function (kind) {
      var m = MARKERS[kind];

      var card = document.createElement("button");
      card.className = "marker";
      card.type = "button";
      card.style.color = m.color;
      card.setAttribute("aria-pressed", "false");
      card.dataset.kind = kind;

      card.appendChild(buildDots(kind, "md"));

      var body = document.createElement("div");
      body.innerHTML =
        '<div class="marker__name">' + m.title + "</div>" +
        '<div class="marker__detail">' + m.detail + "</div>";
      card.appendChild(body);

      card.addEventListener("click", function () {
        host.querySelectorAll(".marker").forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        card.setAttribute("aria-pressed", "true");
        document.querySelectorAll("[data-island-glyph]").forEach(function (g) { setMarker(g, kind); });
        setIslandWord(m);
      });

      grid.appendChild(card);
    });

    host.appendChild(grid);
  }

  /* --- Mode previews -----------------------------------------------------
     The three shapes the island takes, drawn rather than described: the same
     notch path and the same parts as the live one, at rest.

     Claude on its own has no cover to tint from, so its palette markers fall
     back to fixed colours — amber while building, yellow while thinking.
     ---------------------------------------------------------------------- */

  var MODE_FALLBACK = { building: "#ff9f0a", thinking: "#ffd60a" };

  function npSide(parts) {
    var wrap = document.createElement("div");
    wrap.className = "np__side";
    parts.forEach(function (p) { wrap.appendChild(p); });
    return wrap;
  }

  function npArt() {
    var s = document.createElement("span");
    s.className = "art";
    return s;
  }

  function npWave() {
    var s = document.createElement("span");
    s.className = "wave";
    s.dataset.wave = "6";
    s.dataset.waveHeight = "12";
    return s;
  }

  function npGlyph(colour) {
    var g = buildDots("working");
    if (colour) {
      g.style.color = colour;
      for (var i = 0; i < g.children.length; i++) g.children[i].style.color = colour;
    }
    return g;
  }

  function npWord(colour, text) {
    var s = document.createElement("span");
    s.className = "np__word";
    s.textContent = text;
    if (colour) s.style.color = colour;
    return s;
  }

  /* On its own, an activity straddles the camera — art one side, waveform the
     other; marker one side, the state's name the other. Run both and each
     activity takes a side of its own instead. */
  var MODE_SIDES = {
    music: function () {
      return [npSide([npArt()]), npSide([npWave()])];
    },
    claude: function () {
      var y = MODE_FALLBACK.thinking;
      return [npSide([npGlyph(y)]), npSide([npWord(y, "Thinking\u2026")])];
    },
    both: function () {
      return [
        npSide([npArt(), npWave()]),
        npSide([npGlyph(null), npWord(null, "Thinking\u2026")])
      ];
    }
  };

  function renderModes() {
    document.querySelectorAll("[data-mode]").forEach(function (host) {
      var build = MODE_SIDES[host.dataset.mode];
      if (!build) return;

      var w = host.dataset.mode === "both" ? 356 : 268;
      var h = 38;

      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "np__shape");
      svg.setAttribute("viewBox", "0 0 " + w + " " + h);
      svg.setAttribute("aria-hidden", "true");
      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("fill", "var(--bezel)");
      path.setAttribute("d", notchPath(w, h, SWIFT.notch.topCornerRadius, SWIFT.notch.bottomCornerRadius, w));
      svg.appendChild(path);

      var sides = build();
      var row = document.createElement("div");
      row.className = "np__row";
      row.appendChild(sides[0]);

      var cam = document.createElement("span");
      cam.className = "camera";
      row.appendChild(cam);
      row.appendChild(sides[1]);

      host.style.setProperty("--np-w", w + "px");
      host.appendChild(svg);
      host.appendChild(row);
    });
  }

  /* --- Section-driven island state --------------------------------------- */

  function initScrollStates() {
    var sections = document.querySelectorAll("[data-marker]");
    if (!sections.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var kind = entry.target.dataset.marker;
        document.querySelectorAll("[data-island-glyph]").forEach(function (g) { setMarker(g, kind); });
        setIslandWord(MARKERS[kind]);
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });

    sections.forEach(function (s) { io.observe(s); });
  }

  /* --- Island markup (injected so every page carries the same replica) ---- */

  var ISLAND_HTML = [
    '<svg class="island-shape" viewBox="0 0 560 210" aria-hidden="true"><path class="island-fill" d=""/></svg>',
    '<div class="island-layer">',
      '<div class="collapsed-row">',
        '<div class="collapsed-row__left"><span class="art"></span><span class="wave" data-wave="6" data-wave-height="13"></span></div>',
        '<span class="camera"></span>',
        '<div class="collapsed-row__right"><span data-dots="working" data-island-glyph></span><span class="collapsed-row__word" data-island-short>Thinking…</span></div>',
      '</div>',
    '</div>'
  ].join("");

  function mountIsland() {
    if (document.body.dataset.island === "off" || document.getElementById("island")) return;
    var mount = document.createElement("div");
    mount.className = "island-mount";
    mount.id = "island";
    mount.setAttribute("aria-hidden", "true");
    mount.innerHTML = ISLAND_HTML;
    document.body.appendChild(mount);
  }

  /* --- Boot -------------------------------------------------------------- */

  document.addEventListener("DOMContentLoaded", function () {
    mountIsland();

    // Seed every static dot grid declared in the markup.
    document.querySelectorAll("[data-dots]").forEach(function (host) {
      var el = buildDots(host.dataset.dots, host.dataset.dotsSize || "");
      if (host.hasAttribute("data-island-glyph")) el.setAttribute("data-island-glyph", "");
      host.replaceWith(el);
    });

    var island = initIsland();
    renderModes();   // adds its own waveforms, so it runs before they are wired

    var waves = [];
    document.querySelectorAll("[data-wave]").forEach(function (el) {
      waves.push({
        w: initWave(el, parseInt(el.dataset.wave, 10) || 6),
        h: parseFloat(el.dataset.waveHeight) || 14
      });
    });

    renderCatalogue(document.getElementById("marker-catalogue"));
    setIslandWord(MARKERS.working);
    initDemo();
    initCopy();
    initScrollStates();

    if (reduced) {
      waves.forEach(function (w) { tickWave(w.w, 0, w.h); });
      tickGrids(0.8);
      return;
    }

    var visible = true;
    document.addEventListener("visibilitychange", function () { visible = !document.hidden; });

    var last = performance.now();

    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (visible) {
        var t = now / 1000;
        if (island) island.step(dt);
        for (var i = 0; i < waves.length; i++) tickWave(waves[i].w, t, waves[i].h);
        tickGrids(t);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
})();
