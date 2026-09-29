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
  document.body.classList.add('custom-cursor-active');

  const cursorDots = Array.from(cursorMark.querySelectorAll('i'));
  const cursorPoints = cursorDots.map(() => ({ x: 0, y: 0 }));
  const reduceCursorMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
        if (reduceCursorMotion) {
          point.x = cursorX - (index === 1 ? 10 : 18);
          point.y = cursorY + (index === 1 ? 5 : 10);
        } else {
          const leader = cursorPoints[index - 1];
          const easing = index === 1 ? 0.34 : 0.2;
          point.x += (leader.x - point.x) * easing;
          point.y += (leader.y - point.y) * easing;
        }
      }
      dot.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
    });
    const trailStillMoving = cursorPoints.slice(1).some((point, index) => {
      const leader = cursorPoints[index];
      return Math.abs(leader.x - point.x) + Math.abs(leader.y - point.y) > 0.2;
    });
    if (!reduceCursorMotion && trailStillMoving && cursorMark.classList.contains('is-visible')) {
      cursorFrame = window.requestAnimationFrame(updateCursor);
    }
  };

  window.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    cursorX = event.clientX;
    cursorY = event.clientY;
    if (!hasCursorPosition) {
      cursorPoints.forEach((point, index) => {
        point.x = cursorX - (reduceCursorMotion && index ? (index === 1 ? 10 : 18) : 0);
        point.y = cursorY + (reduceCursorMotion && index ? (index === 1 ? 5 : 10) : 0);
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
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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

  setGreetingWidth(greetings[greetingIndex]);
  document.fonts?.ready.then(() => setGreetingWidth(greetings[greetingIndex]));
  window.addEventListener('resize', () => setGreetingWidth(greetings[greetingIndex]), { passive: true });

  const rotateGreeting = () => {
    const nextIndex = (greetingIndex + 1) % greetings.length;
    const currentWord = greetingRotator.querySelector('.greeting-word.is-current');
    if (!currentWord) return;

    if (reducedMotion.matches) {
      currentWord.textContent = greetings[nextIndex];
      greetingIndex = nextIndex;
      setGreetingWidth(greetings[greetingIndex]);
      window.setTimeout(rotateGreeting, rotationInterval);
      return;
    }

    const outgoingLength = splitGreeting(greetings[greetingIndex]).length;
    currentWord.classList.remove('is-current');
    currentWord.classList.add('is-exiting');
    const exitDuration = 520 + Math.max(0, outgoingLength - 1) * staggerDuration;

    window.setTimeout(() => {
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
      window.setTimeout(rotateGreeting, rotationInterval);
    }, exitDuration);
  };

  window.setTimeout(rotateGreeting, rotationInterval);
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

  if (!reducedMotion.matches) {
    let pointer = null;
    let framePending = false;
    const applyBaseSettings = () => {
      letters.forEach((letter) => {
        letter.style.fontVariationSettings = fromFontVariationSettings;
      });
    };
    const updateLetters = () => {
      framePending = false;
      if (!pointer) return;

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
      if (event.pointerType === 'touch') return;
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
    window.addEventListener('blur', resetProximity);
  }
}

if (!reducedMotion.matches) {
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
    if (reducedMotion.matches || (event.pointerType !== 'mouse' && event.pointerType !== 'pen')) return;
    heroArt.classList.remove('finish-hover-loop');
    heroArt.classList.add('is-floating', 'is-portrait-hovered');
  });

  heroPortrait.addEventListener('pointerleave', () => {
    heroArt.classList.remove('is-portrait-hovered');
    if (!heroArt.classList.contains('is-floating')) return;
    if (reducedMotion.matches) {
      heroArt.classList.remove('is-floating', 'finish-hover-loop', 'is-portrait-hovered');
      return;
    }
    heroArt.classList.add('finish-hover-loop');
  });

  heroArt.addEventListener('animationiteration', (event) => {
    if (event.animationName !== 'phrase-float' || !heroArt.classList.contains('finish-hover-loop')) return;
    heroArt.classList.remove('is-floating', 'finish-hover-loop');
  });

  reducedMotion.addEventListener?.('change', (event) => {
    if (event.matches) heroArt.classList.remove('is-floating', 'finish-hover-loop', 'is-portrait-hovered');
  });
}
