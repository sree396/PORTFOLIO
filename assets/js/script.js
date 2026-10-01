const motionToggle = document.querySelector('.motion-toggle');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let savedMotionPreference = null;
try {
  const storedPreference = window.localStorage.getItem('portfolio-motion');
  if (storedPreference === 'on' || storedPreference === 'off') savedMotionPreference = storedPreference;
} catch {}

let motionDisabled = savedMotionPreference === 'off'
  || (savedMotionPreference === null && motionPreference.matches);

const applyMotionPreference = () => {
  document.documentElement.classList.toggle('motion-paused', motionDisabled);
  document.documentElement.classList.toggle('motion-user-enabled', savedMotionPreference === 'on');
  document.body.classList.toggle('motion-paused', motionDisabled);
  if (motionToggle) {
    motionToggle.setAttribute('aria-pressed', String(motionDisabled));
    motionToggle.setAttribute('aria-label', motionDisabled ? 'Turn animations on' : 'Turn animations off');
    motionToggle.dataset.tooltip = `Motion: ${motionDisabled ? 'off' : 'on'}`;
  }
  if (motionDisabled) {
    document.body.classList.remove('hero-entering');
    document.querySelectorAll('.page-reveal').forEach((element) => element.classList.add('is-revealed'));
    document.querySelector('.hero-art')?.classList.remove('is-floating', 'finish-hover-loop', 'is-portrait-hovered');
  }
  document.dispatchEvent(new CustomEvent('portfolio:motionchange', { detail: { disabled: motionDisabled } }));
};

applyMotionPreference();

motionToggle?.addEventListener('click', () => {
  motionDisabled = !motionDisabled;
  savedMotionPreference = motionDisabled ? 'off' : 'on';
  try { window.localStorage.setItem('portfolio-motion', savedMotionPreference); } catch {}
  applyMotionPreference();
});

motionPreference.addEventListener?.('change', (event) => {
  if (savedMotionPreference !== null) return;
  motionDisabled = event.matches;
  applyMotionPreference();
});

const themeToggle = document.querySelector('.theme-toggle');
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
let darkMood = false;
let themeTransitionTimer = null;
let themeSwapTimer = null;
let themeFadeFrame = null;
try { darkMood = window.localStorage.getItem('portfolio-theme') === 'dark'; } catch {}

const applyThemeState = () => {
  document.documentElement.classList.toggle('theme-dark', darkMood);
  themeToggle?.setAttribute('aria-pressed', String(darkMood));
  themeToggle?.setAttribute('aria-label', darkMood ? 'Turn dark mood off' : 'Turn dark mood on');
  if (themeToggle) themeToggle.dataset.tooltip = `Dark mood: ${darkMood ? 'on' : 'off'}`;
  if (themeColorMeta) themeColorMeta.content = darkMood ? '#101722' : '#1479e8';
  document.dispatchEvent(new CustomEvent('portfolio:themechange', { detail: { dark: darkMood } }));
};

applyThemeState();

const setDarkMood = (enabled) => {
  darkMood = enabled;
  try { window.localStorage.setItem('portfolio-theme', darkMood ? 'dark' : 'light'); } catch {}

  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  if (themeTransitionTimer !== null) window.clearTimeout(themeTransitionTimer);
  if (themeSwapTimer !== null) window.clearTimeout(themeSwapTimer);
  if (themeFadeFrame !== null) window.cancelAnimationFrame(themeFadeFrame);
  themeTransitionTimer = null;
  themeSwapTimer = null;
  themeFadeFrame = null;
  root.classList.remove('theme-transitioning');
  header?.classList.remove('theme-fade-out');

  const updateTheme = applyThemeState;

  if (motionDisabled) {
    updateTheme();
    return;
  }

  const hasLiveCustomCursor = document.body.classList.contains('custom-cursor-active');
  if (!hasLiveCustomCursor && typeof document.startViewTransition === 'function') {
    const rect = themeToggle?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 32;
    root.style.setProperty('--theme-wipe-origin', `${x}px ${y}px`);
    root.style.setProperty('--theme-wipe-radius', `${radius}px`);
    try {
      const transition = document.startViewTransition(updateTheme);
      const clearWipeOrigin = () => {
        root.style.removeProperty('--theme-wipe-origin');
        root.style.removeProperty('--theme-wipe-radius');
      };
      transition.finished.then(clearWipeOrigin, clearWipeOrigin);
      return;
    } catch {
      root.style.removeProperty('--theme-wipe-origin');
      root.style.removeProperty('--theme-wipe-radius');
    }
  }

  root.classList.add('theme-transitioning');
  if (header) {
    header.classList.add('theme-fade-out');
    themeSwapTimer = window.setTimeout(() => {
      updateTheme();
      themeFadeFrame = window.requestAnimationFrame(() => {
        header.classList.remove('theme-fade-out');
        themeFadeFrame = null;
      });
      themeSwapTimer = null;
    }, 140);
  } else {
    updateTheme();
  }
  themeTransitionTimer = window.setTimeout(() => {
    root.classList.remove('theme-transitioning');
    themeTransitionTimer = null;
  }, 900);
};

themeToggle?.addEventListener('click', () => setDarkMood(!darkMood));

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');
const siteHeader = document.querySelector('.site-header');
let previousHeaderScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  if (!siteHeader) return;
  const currentY = window.scrollY;

  if (currentY <= siteHeader.offsetHeight + 20) {
    siteHeader.classList.remove('is-hidden');
    previousHeaderScrollY = currentY;
    return;
  }

  if (navigation.classList.contains('open')) {
    siteHeader.classList.remove('is-hidden');
    previousHeaderScrollY = currentY;
    return;
  }

  const movement = currentY - previousHeaderScrollY;
  if (movement >= 6) {
    siteHeader.classList.add('is-hidden');
    previousHeaderScrollY = currentY;
  } else if (movement <= -6) {
    siteHeader.classList.remove('is-hidden');
    previousHeaderScrollY = currentY;
  }
}, { passive: true });

const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
if (finePointer.matches) {
  const cursorMark = document.createElement('span');
  cursorMark.className = 'custom-cursor-mark';
  cursorMark.setAttribute('aria-hidden', 'true');
  cursorMark.innerHTML = '<i class="cursor-core"></i><i class="cursor-trail cursor-trail-one"></i><i class="cursor-trail cursor-trail-two"></i>';
  document.body.append(cursorMark);
  document.body.classList.toggle('custom-cursor-active', !motionDisabled);

  const cursorDots = Array.from(cursorMark.querySelectorAll('i'));
  const cursorPoints = cursorDots.map(() => ({ x: 0, y: 0 }));
  let cursorX = 0;
  let cursorY = 0;
  let cursorFrame = 0;
  let hasCursorPosition = false;

  const updateCursor = () => {
    cursorFrame = 0;
    cursorPoints[0].x = cursorX;
    cursorPoints[0].y = cursorY;
    cursorDots.forEach((dot, index) => {
      const point = cursorPoints[index];
      if (index > 0) {
        const leader = cursorPoints[index - 1];
        const easing = index === 1 ? 0.34 : 0.2;
        point.x += (leader.x - point.x) * easing;
        point.y += (leader.y - point.y) * easing;
      }
      dot.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
    });
    const trailStillMoving = cursorPoints.slice(1).some((point, index) => {
      const leader = cursorPoints[index];
      return Math.abs(leader.x - point.x) + Math.abs(leader.y - point.y) > 0.2;
    });
    if (trailStillMoving && cursorMark.classList.contains('is-visible')) {
      cursorFrame = window.requestAnimationFrame(updateCursor);
    }
  };

  window.addEventListener('pointermove', (event) => {
    if (motionDisabled || (event.pointerType !== 'mouse' && event.pointerType !== 'pen')) return;
    cursorX = event.clientX;
    cursorY = event.clientY;
    if (!hasCursorPosition) {
      cursorPoints.forEach((point) => {
        point.x = cursorX;
        point.y = cursorY;
      });
      hasCursorPosition = true;
    }
    cursorMark.classList.add('is-visible');
    if (!cursorFrame) cursorFrame = window.requestAnimationFrame(updateCursor);
  });

  const hideCursor = () => {
    cursorMark.classList.remove('is-visible');
    hasCursorPosition = false;
    if (cursorFrame) window.cancelAnimationFrame(cursorFrame);
    cursorFrame = 0;
  };
  document.addEventListener('portfolio:motionchange', () => {
    document.body.classList.toggle('custom-cursor-active', !motionDisabled);
    if (motionDisabled) hideCursor();
  });
  window.addEventListener('pointerout', (event) => {
    if (!event.relatedTarget) hideCursor();
  });
  window.addEventListener('blur', hideCursor);
}

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
  navigation.classList.toggle('open', !isOpen);
});

navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    navigation.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
  }
});

document.querySelector('#year').textContent = new Date().getFullYear();

const featuredPanel = document.querySelector('.projects-section');
if (featuredPanel) {
  const matchPanelHeights = () => {
    const panelHeight = Math.ceil(featuredPanel.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--portfolio-panel-height', `${panelHeight}px`);
  };
  matchPanelHeights();
  if ('ResizeObserver' in window) {
    const panelHeightObserver = new ResizeObserver(matchPanelHeights);
    panelHeightObserver.observe(featuredPanel);
  }
  document.fonts?.ready.then(matchPanelHeights);
}

const heroPortrait = document.querySelector('.hero-portrait');
const heroArt = document.querySelector('.hero-art');

const greetingRotator = document.querySelector('[data-greeting-rotator]');
if (greetingRotator) {
  const greetings = ['Hi,', 'Bonjour,', 'Ciao,', 'Konnichiwa,', 'Nǐ hǎo,', 'வணக்கம்,', 'Olá,', 'Oi,'];
  const rotationInterval = 2600;
  const staggerDuration = 22;
  const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter
    ? new Intl.Segmenter('en', { granularity: 'grapheme' })
    : null;
  const splitGreeting = (text) => segmenter
    ? Array.from(segmenter.segment(text), (part) => part.segment)
    : Array.from(text);

  const measure = document.createElement('span');
  measure.className = 'greeting-measure';
  measure.setAttribute('aria-hidden', 'true');
  greetingRotator.append(measure);

  let greetingIndex = 0;
  let greetingTimer = null;
  let greetingTransitionTimer = null;
  const setGreetingWidth = (text) => {
    measure.textContent = text;
    greetingRotator.style.width = `${Math.ceil(measure.getBoundingClientRect().width + 2)}px`;
  };
  const createGreeting = (text, state) => {
    const word = document.createElement('span');
    word.className = `greeting-word ${state}`;
    splitGreeting(text).forEach((character, index, characters) => {
      const letter = document.createElement('span');
      letter.className = 'greeting-letter';
      letter.textContent = character === ' ' ? '\u00a0' : character;
      letter.style.transitionDelay = `${(characters.length - index - 1) * staggerDuration}ms`;
      word.append(letter);
    });
    return word;
  };
  const showStaticGreeting = () => {
    greetingRotator.querySelectorAll('.greeting-word').forEach((word) => word.remove());
    const word = document.createElement('span');
    word.className = 'greeting-word is-current';
    word.textContent = greetings[greetingIndex];
    greetingRotator.insertBefore(word, measure);
    setGreetingWidth(greetings[greetingIndex]);
  };
  const showAnimatedGreeting = () => {
    greetingRotator.querySelectorAll('.greeting-word').forEach((word) => word.remove());
    const word = createGreeting(greetings[greetingIndex], 'is-current');
    greetingRotator.insertBefore(word, measure);
  };

  setGreetingWidth(greetings[greetingIndex]);
  document.fonts?.ready.then(() => setGreetingWidth(greetings[greetingIndex]));
  window.addEventListener('resize', () => setGreetingWidth(greetings[greetingIndex]), { passive: true });

  const scheduleGreeting = () => {
    if (!motionDisabled) greetingTimer = window.setTimeout(rotateGreeting, rotationInterval);
  };
  const rotateGreeting = () => {
    greetingTimer = null;
    if (motionDisabled) return;
    const nextIndex = (greetingIndex + 1) % greetings.length;
    const currentWord = greetingRotator.querySelector('.greeting-word.is-current');
    if (!currentWord) return;

    const outgoingLength = splitGreeting(greetings[greetingIndex]).length;
    currentWord.classList.remove('is-current');
    currentWord.classList.add('is-exiting');
    const exitDuration = 520 + Math.max(0, outgoingLength - 1) * staggerDuration;

    greetingTransitionTimer = window.setTimeout(() => {
      greetingTransitionTimer = null;
      if (motionDisabled) return;
      currentWord.remove();
      greetingIndex = nextIndex;
      setGreetingWidth(greetings[greetingIndex]);
      const nextWord = createGreeting(greetings[greetingIndex], 'is-entering');
      greetingRotator.insertBefore(nextWord, measure);
      void nextWord.offsetWidth;
      window.requestAnimationFrame(() => {
        nextWord.classList.remove('is-entering');
        nextWord.classList.add('is-current');
      });
      scheduleGreeting();
    }, exitDuration);
  };

  document.addEventListener('portfolio:motionchange', () => {
    if (greetingTimer !== null) window.clearTimeout(greetingTimer);
    if (greetingTransitionTimer !== null) window.clearTimeout(greetingTransitionTimer);
    greetingTimer = null;
    greetingTransitionTimer = null;
    if (motionDisabled) {
      showStaticGreeting();
    } else {
      showAnimatedGreeting();
      scheduleGreeting();
    }
  });

  if (motionDisabled) showStaticGreeting();
  else scheduleGreeting();
}

const variableProximityHeadings = document.querySelectorAll(
  '.about-grid h2, .project-copy h2, .work-heading h2, .education-section h2, .credentials-grid > div h2'
);
if (variableProximityHeadings.length) {
  const fromFontVariationSettings = "'wght' 400, 'opsz' 9";
  const toFontVariationSettings = "'wght' 1000, 'opsz' 40";
  const radius = 120;
  const fromSettings = new Map(
    fromFontVariationSettings.split(',').map((setting) => {
      const [axis, value] = setting.trim().split(' ');
      return [axis.replace(/['\"]/g, ''), Number(value)];
    })
  );
  const toSettings = new Map(
    toFontVariationSettings.split(',').map((setting) => {
      const [axis, value] = setting.trim().split(' ');
      return [axis.replace(/['\"]/g, ''), Number(value)];
    })
  );
  const axes = Array.from(fromSettings, ([axis, fromValue]) => ({
    axis,
    fromValue,
    toValue: toSettings.get(axis) ?? fromValue
  }));
  const letters = [];
  const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;
  const splitGraphemes = (text) => segmenter
    ? Array.from(segmenter.segment(text), (part) => part.segment)
    : Array.from(text);

  variableProximityHeadings.forEach((heading) => {
    const label = heading.innerText.replace(/\s+/g, ' ').trim();
    heading.classList.add('variable-proximity');
    heading.setAttribute('aria-label', label);

    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach((textNode) => {
      const fragment = document.createDocumentFragment();
      const parts = textNode.nodeValue.match(/\s+|\S+/g) || [];
      parts.forEach((part) => {
        if (/^\s+$/.test(part)) {
          fragment.append(document.createTextNode(part));
          return;
        }

        const word = document.createElement('span');
        word.className = 'variable-proximity-word';
        word.setAttribute('aria-hidden', 'true');
        splitGraphemes(part).forEach((grapheme) => {
          const letter = document.createElement('span');
          letter.className = 'variable-proximity-letter';
          letter.textContent = grapheme;
          letter.style.fontVariationSettings = fromFontVariationSettings;
          letters.push(letter);
          word.append(letter);
        });
        fragment.append(word);
      });
      textNode.replaceWith(fragment);
    });
  });

  let pointer = null;
  let framePending = false;
  const applyBaseSettings = () => {
    letters.forEach((letter) => {
      letter.style.fontVariationSettings = fromFontVariationSettings;
    });
  };
  const updateLetters = () => {
    framePending = false;
    if (!pointer || motionDisabled) return;

    letters.forEach((letter) => {
      const rect = letter.getBoundingClientRect();
      const distance = Math.hypot(
        pointer.x - (rect.left + rect.width / 2),
        pointer.y - (rect.top + rect.height / 2)
      );
      if (distance >= radius) {
        letter.style.fontVariationSettings = fromFontVariationSettings;
        return;
      }

      const influence = Math.min(Math.max(1 - distance / radius, 0), 1);
      const settings = axes.map(({ axis, fromValue, toValue }) => {
        const value = fromValue + (toValue - fromValue) * influence;
        return `'${axis}' ${value}`;
      }).join(', ');
      letter.style.fontVariationSettings = settings;
    });
  };
  document.addEventListener('pointermove', (event) => {
    if (motionDisabled || event.pointerType === 'touch') return;
    pointer = { x: event.clientX, y: event.clientY };
    if (!framePending) {
      framePending = true;
      window.requestAnimationFrame(updateLetters);
    }
  }, { passive: true });
  const resetProximity = () => {
    pointer = null;
    applyBaseSettings();
  };
  document.addEventListener('pointerout', (event) => {
    if (!event.relatedTarget) resetProximity();
  });
  document.addEventListener('portfolio:motionchange', () => {
    if (motionDisabled) resetProximity();
  });
  window.addEventListener('blur', resetProximity);
}

if (!motionDisabled) {
  document.body.classList.add('page-motion');
  document.body.classList.add('hero-entering');

  const finalAnnotation = document.querySelector('.phrase-days');
  const finishHeroArrival = () => document.body.classList.remove('hero-entering');
  if (finalAnnotation) {
    finalAnnotation.addEventListener('animationend', (event) => {
      if (event.animationName === 'annotation-arrive') finishHeroArrival();
    }, { once: true });
    window.setTimeout(finishHeroArrival, 2600);
  } else {
    finishHeroArrival();
  }

  const revealTargets = document.querySelectorAll(
    '.section-kicker, .about-grid, .values, .project-feature, .work-heading, .skills-layout, .education-list, .credentials-grid, .contact-inner, .site-footer'
  );

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });

    revealTargets.forEach((element, index) => {
      element.classList.add('page-reveal');
      element.style.setProperty('--reveal-delay', `${(index % 3) * 140}ms`);
      revealObserver.observe(element);
    });
  }
}

if (heroPortrait && heroArt) {
  heroPortrait.addEventListener('pointerenter', (event) => {
    if (motionDisabled || (event.pointerType !== 'mouse' && event.pointerType !== 'pen')) return;
    heroArt.classList.remove('finish-hover-loop');
    heroArt.classList.add('is-floating', 'is-portrait-hovered');
  });

  heroPortrait.addEventListener('pointerleave', () => {
    heroArt.classList.remove('is-portrait-hovered');
    if (!heroArt.classList.contains('is-floating')) return;
    if (motionDisabled) {
      heroArt.classList.remove('is-floating', 'finish-hover-loop', 'is-portrait-hovered');
      return;
    }
    heroArt.classList.add('finish-hover-loop');
  });

  heroArt.addEventListener('animationiteration', (event) => {
    if (event.animationName !== 'phrase-float' || !heroArt.classList.contains('finish-hover-loop')) return;
    heroArt.classList.remove('is-floating', 'finish-hover-loop');
  });

}
