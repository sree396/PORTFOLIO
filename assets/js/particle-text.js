(() => {
  const host = document.querySelector('[data-particle-text]');
  if (!host) return;

  const options = {
    text: 'Let’s build\nsomething useful.',
    particleSize: 2,
    density: 2,
    color: '#111111',
    highlightColor: '#1479e8',
    scatter: 180,
    gatherDuration: 1600,
    stagger: 420,
    pointerRepel: 40,
    repelRadius: 120,
    idleDrift: 0.2,
    trigger: 'mount',
    fontSize: 'clamp(4.5rem, 16vw, 12rem)',
    fontWeight: 800,
    fontFamily: 'inherit',
    glow: true
  };

  const canvas = document.createElement('canvas');
  canvas.className = 'particle-text__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.append(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  let reducedMotion = reducedMotionQuery.matches;
  let particles = [];
  let animationFrame = null;
  let resizeFrame = null;
  let buildId = 0;
  let gathering = false;
  let gatherStart = 0;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let pointer = { active: false, x: 0, y: 0, smoothX: 0, smoothY: 0 };

  const waitForFonts = async (font) => {
    if (!('fonts' in document)) return;
    try { await document.fonts.load(font); } catch {}
    await document.fonts.ready;
  };

  const startGather = (fromScatter = true) => {
    if (!particles.length) return;
    const spread = reducedMotion ? 0 : options.scatter;
    particles.forEach((particle) => {
      if (fromScatter) {
        const angle = particle.seed * Math.PI * 2;
        const distance = spread * (0.35 + particle.depth * 0.75);
        particle.x = particle.targetX + Math.cos(angle) * distance + (particle.depth - 0.5) * spread * 0.55;
        particle.y = particle.targetY + Math.sin(angle) * distance + (particle.seed - 0.5) * spread * 0.55;
      }
      particle.startX = particle.x;
      particle.startY = particle.y;
      particle.delay = reducedMotion ? 0 : particle.seed * options.stagger;
    });
    gatherStart = performance.now();
    gathering = true;
  };

  const drawParticle = (particle) => {
    ctx.fillStyle = particle.color;
    if (particle.size <= 2.1) {
      ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
      return;
    }
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const render = (now) => {
    animationFrame = null;
    ctx.clearRect(0, 0, width, height);
    ctx.shadowBlur = options.glow && !reducedMotion ? options.particleSize * 3 : 0;
    ctx.shadowColor = options.highlightColor;

    pointer.smoothX += (pointer.x - pointer.smoothX) * 0.18;
    pointer.smoothY += (pointer.y - pointer.smoothY) * 0.18;
    let complete = true;

    particles.forEach((particle) => {
      let baseX = particle.targetX;
      let baseY = particle.targetY;
      let progress = 1;

      if (gathering) {
        const local = (now - gatherStart - particle.delay) / Math.max(1, reducedMotion ? 1 : options.gatherDuration);
        progress = clamp(local, 0, 1);
        const eased = easeOutCubic(progress);
        baseX = particle.startX + (particle.targetX - particle.startX) * eased;
        baseY = particle.startY + (particle.targetY - particle.startY) * eased;
        if (progress < 1) complete = false;
      } else if (!reducedMotion && options.idleDrift > 0) {
        const time = now * 0.001;
        baseX += Math.sin(time * 0.9 + particle.seed * 10) * options.idleDrift * particle.depth;
        baseY += Math.cos(time * 0.75 + particle.depth * 10) * options.idleDrift * particle.depth;
      }

      if (pointer.active && !reducedMotion && options.pointerRepel > 0) {
        const dx = baseX - pointer.smoothX;
        const dy = baseY - pointer.smoothY;
        const distance = Math.hypot(dx, dy);
        if (distance > 0 && distance < options.repelRadius) {
          const force = Math.pow(1 - distance / options.repelRadius, 2) * options.pointerRepel;
          baseX += (dx / distance) * force;
          baseY += (dy / distance) * force;
        }
      }

      const follow = reducedMotion ? 1 : 0.22;
      particle.x += (baseX - particle.x) * follow;
      particle.y += (baseY - particle.y) * follow;
      ctx.globalAlpha = clamp(0.35 + progress * 0.65, 0, 1);
      drawParticle(particle);
    });

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    if (gathering && complete) gathering = false;
    if (particles.length && (!reducedMotion || gathering)) {
      animationFrame = window.requestAnimationFrame(render);
    }
  };

  const queueRender = () => {
    if (animationFrame === null && particles.length) {
      animationFrame = window.requestAnimationFrame(render);
    }
  };

  const sampleText = async () => {
    const currentBuild = ++buildId;
    const rect = host.getBoundingClientRect();
    width = Math.floor(rect.width);
    height = Math.floor(rect.height);
    if (!width || !height) return;

    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const computed = window.getComputedStyle(host);
    const family = options.fontFamily === 'inherit' ? computed.fontFamily || 'sans-serif' : options.fontFamily;
    const probe = document.createElement('span');
    probe.textContent = 'M';
    Object.assign(probe.style, {
      position: 'absolute', visibility: 'hidden', pointerEvents: 'none',
      fontSize: options.fontSize, fontWeight: String(options.fontWeight), fontFamily: family
    });
    host.append(probe);
    let fontSize = parseFloat(window.getComputedStyle(probe).fontSize) || 96;
    probe.remove();
    let font = `${options.fontWeight} ${fontSize}px ${family}`;
    await waitForFonts(font);
    if (currentBuild !== buildId) return;

    const offscreen = document.createElement('canvas');
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
    if (!offCtx) return;
    const lines = String(options.text).split(/\r?\n/);
    const maxTextWidth = width * 0.96;
    const measureLines = () => {
      offCtx.font = font;
      return lines.map((line) => offCtx.measureText(line));
    };
    let metrics = measureLines();
    let measuredWidth = Math.max(1, ...metrics.map((line) => line.width));
    if (measuredWidth > maxTextWidth) {
      fontSize = Math.max(18, fontSize * (maxTextWidth / measuredWidth));
      font = `${options.fontWeight} ${fontSize}px ${family}`;
      await waitForFonts(font);
      if (currentBuild !== buildId) return;
      metrics = measureLines();
      measuredWidth = Math.max(1, ...metrics.map((line) => line.width));
    }

    const ascent = Math.ceil(Math.max(...metrics.map((line) => line.actualBoundingBoxAscent || fontSize * 0.78)));
    const descent = Math.ceil(Math.max(...metrics.map((line) => line.actualBoundingBoxDescent || fontSize * 0.22)));
    const lineHeight = fontSize * 1.16;
    const padding = Math.max(12, Math.ceil(fontSize * 0.08));
    const textWidth = Math.max(1, Math.ceil(measuredWidth));
    const textHeight = Math.ceil(ascent + descent + lineHeight * (lines.length - 1));
    offscreen.width = textWidth + padding * 2;
    offscreen.height = textHeight + padding * 2;
    offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
    offCtx.font = font;
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'alphabetic';
    offCtx.fillStyle = '#fff';
    const centerX = offscreen.width / 2;
    lines.forEach((line, index) => {
      offCtx.fillText(line, centerX, padding + ascent + index * lineHeight);
    });

    const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
    const targets = [];
    const step = Math.max(2, Math.floor(options.density));
    for (let y = 0; y < offscreen.height; y += step) {
      for (let x = 0; x < offscreen.width; x += step) {
        const jitterX = Math.random() * step;
        const jitterY = Math.random() * step;
        const sampleX = Math.min(offscreen.width - 1, Math.floor(x + jitterX));
        const sampleY = Math.min(offscreen.height - 1, Math.floor(y + jitterY));
        const alpha = imageData.data[(sampleY * offscreen.width + sampleX) * 4 + 3];
        if (alpha > 40) {
          targets.push({
            x: width / 2 - offscreen.width / 2 + x + jitterX,
            y: height / 2 - offscreen.height / 2 + y + jitterY,
            alpha: alpha / 255,
            lineIndex: clamp(Math.floor((sampleY - padding) / lineHeight), 0, lines.length - 1)
          });
        }
      }
    }

    const maxParticles = Math.max(900, Math.min(5200, Math.floor((width * height) / 45)));
    const stride = Math.max(1, Math.ceil(targets.length / maxParticles));
    for (let index = targets.length - 1; index > 0; index -= 1) {
      const otherIndex = Math.floor(Math.random() * (index + 1));
      [targets[index], targets[otherIndex]] = [targets[otherIndex], targets[index]];
    }
    const selected = targets.filter((_, index) => index % stride === 0);
    particles = selected.map((target, index) => {
      const seed = Math.random();
      const depth = 0.45 + Math.random() * 0.9;
      const angle = seed * Math.PI * 2;
      const distance = (reducedMotion ? 0 : options.scatter) * (0.35 + depth * 0.75);
      const startX = target.x + Math.cos(angle) * distance + (seed - 0.5) * options.scatter * 0.45;
      const startY = target.y + Math.sin(angle) * distance + (depth - 0.9) * options.scatter * 0.45;
      return {
        x: reducedMotion ? target.x : startX,
        y: reducedMotion ? target.y : startY,
        startX, startY,
        targetX: target.x, targetY: target.y,
        size: Math.max(0.6, options.particleSize * (0.75 + target.alpha * 0.45)),
        color: target.lineIndex === 0 ? options.color : options.highlightColor,
        seed, depth, delay: seed * options.stagger
      };
    });

    pointer = { active: false, x: width / 2, y: height / 2, smoothX: width / 2, smoothY: height / 2 };
    if (reducedMotion) {
      particles.forEach((particle) => {
        particle.x = particle.targetX;
        particle.y = particle.targetY;
        particle.startX = particle.targetX;
        particle.startY = particle.targetY;
        particle.delay = 0;
      });
      gathering = false;
    } else {
      startGather(false);
    }
    queueRender();
  };

  const queueSample = () => {
    if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = null;
      sampleText();
    });
  };
  const handlePointerMove = (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
    queueRender();
  };
  const handlePointerEnter = (event) => {
    handlePointerMove(event);
    if (options.trigger === 'hover') startGather(true);
    queueRender();
  };
  const handlePointerLeave = () => {
    pointer.active = false;
    queueRender();
  };
  const handleReducedMotion = (event) => {
    reducedMotion = event.matches;
    sampleText();
  };

  canvas.addEventListener('pointerenter', handlePointerEnter);
  canvas.addEventListener('pointermove', handlePointerMove, { passive: true });
  canvas.addEventListener('pointerleave', handlePointerLeave);
  reducedMotionQuery.addEventListener?.('change', handleReducedMotion);
  let resizeObserver;
  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(queueSample);
    resizeObserver.observe(host);
  } else {
    window.addEventListener('resize', queueSample, { passive: true });
  }
  document.fonts?.ready.then(queueSample);
  sampleText();
})();
