const PAGE_IMAGES = [
  { title: '交叉比率', file: '交叉比率.png' },
  { title: '安全存量', file: '安全存量.png' },
  { title: '步留率', file: '步留率.png' },
  { title: '坪效', file: '坪效.png' },
  { title: '枱帳 1', file: '枱帳_1.png' },
  { title: '枱帳 2', file: '枱帳_2.png' },
  { title: '范蠡的經營智慧', file: '范蠡的經營智慧.png' },
  { title: '孫子兵法在零售業分析', file: '孫子兵法在零售業分析.png' },
  { title: '真毛利', file: '真毛利.png' },
  { title: '貢獻度與投入資源要能夠平衡', file: '貢獻度與投入資源要能夠平衡.png' },
  { title: '商品敏感性與營業額', file: '商品敏感性與營業額.png' },
  { title: '粗毛利', file: '粗毛利.png' },
  { title: '零售ABCZ法', file: '零售ABCZ法.png' },
  { title: '銷售金額眾數', file: '銷售金額眾數.png' },
  { title: '駐足率', file: '駐足率.png' },
  { title: '膨脹率', file: '膨脹率.png' },
  { title: '總毛利率', file: '總毛利率.png' },
  { title: 'ABCZ分析', file: 'ABCZ分析.png' },
  { title: 'AISAS', file: 'AISAS.png' },
  { title: 'PESTEL分析', file: 'PESTEL分析.png' },
  { title: 'pi值', file: 'pi值.png' },
  { title: 'SKU', file: 'SKU.png' }
];

const DESKTOP_BREAKPOINT = 860;
const SWIPE_THRESHOLD = 70;
const THEMES = ['dark', 'light'];

function normalizeTheme(theme) {
  return THEMES.includes(theme) ? theme : 'dark';
}

function getNextTheme(theme) {
  return normalizeTheme(theme) === 'dark' ? 'light' : 'dark';
}

function isDoublePage(width) {
  return width >= DESKTOP_BREAKPOINT;
}

function normalizeStartIndex(index, doublePage) {
  const maxIndex = PAGE_IMAGES.length - 1;
  const clamped = Math.max(0, Math.min(index, maxIndex));
  if (!doublePage) {
    return clamped;
  }
  const spreadIndex = clamped % 2 === 0 ? clamped : clamped - 1;
  return Math.min(spreadIndex, PAGE_IMAGES.length - 2);
}

function createFlipBookState({ viewportWidth = 1280 } = {}) {
  const doublePage = isDoublePage(viewportWidth);
  return {
    viewportWidth,
    doublePage,
    currentIndex: 0,
    lightboxIndex: null
  };
}

function updateViewport(state, viewportWidth) {
  state.viewportWidth = viewportWidth;
  state.doublePage = isDoublePage(viewportWidth);
  state.currentIndex = normalizeStartIndex(state.currentIndex, state.doublePage);
  return state;
}

function getVisiblePages(state) {
  const start = normalizeStartIndex(state.currentIndex, state.doublePage);
  const count = state.doublePage ? 2 : 1;
  return PAGE_IMAGES.slice(start, start + count).map((page, offset) => ({
    ...page,
    index: start + offset
  }));
}

function goToPage(state, index) {
  state.currentIndex = normalizeStartIndex(index, state.doublePage);
  return state;
}

function goNext(state) {
  const step = state.doublePage ? 2 : 1;
  return goToPage(state, state.currentIndex + step);
}

function goPrevious(state) {
  const step = state.doublePage ? 2 : 1;
  return goToPage(state, state.currentIndex - step);
}

function handleKey(state, key) {
  if (key === 'ArrowRight') {
    goNext(state);
    return true;
  }
  if (key === 'ArrowLeft') {
    goPrevious(state);
    return true;
  }
  if (key === 'Escape' && state.lightboxIndex !== null) {
    closeLightbox(state);
    return true;
  }
  return false;
}

function handleSwipe(state, deltaX, deltaY) {
  if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY)) {
    return false;
  }
  if (deltaX > 0) {
    goNext(state);
  } else {
    goPrevious(state);
  }
  return true;
}

function openLightbox(state, index) {
  state.lightboxIndex = Math.max(0, Math.min(index, PAGE_IMAGES.length - 1));
  return state;
}

function closeLightbox(state) {
  state.lightboxIndex = null;
  return state;
}

function imagePath(page) {
  return `infographics/${encodeURIComponent(page.file)}`;
}

function applyTheme(theme, toggleButton) {
  const normalized = normalizeTheme(theme);
  document.documentElement.dataset.theme = normalized;
  if (!toggleButton) {
    return normalized;
  }

  const isLight = normalized === 'light';
  toggleButton.setAttribute('aria-pressed', String(isLight));
  const label = toggleButton.querySelector('[data-theme-label]');
  const icon = toggleButton.querySelector('[data-theme-icon]');
  if (label) {
    label.textContent = isLight ? '淺色' : '深色';
  }
  if (icon) {
    icon.textContent = isLight ? '☀' : '☾';
  }
  return normalized;
}

function getStoredTheme() {
  try {
    return localStorage.getItem('flipbook-theme');
  } catch (error) {
    return null;
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem('flipbook-theme', theme);
  } catch (error) {
    // Theme persistence is optional; the visible toggle still works without storage.
  }
}

function getPreferredTheme() {
  const stored = getStoredTheme();
  if (stored) {
    return normalizeTheme(stored);
  }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

function initFlipBook() {
  const els = {
    book: document.querySelector('[data-book]'),
    thumbnails: document.querySelector('[data-thumbnails]'),
    pageStatus: document.querySelector('[data-page-status]'),
    prev: document.querySelector('[data-prev]'),
    next: document.querySelector('[data-next]'),
    lightbox: document.querySelector('[data-lightbox]'),
    lightboxImage: document.querySelector('[data-lightbox-image]'),
    lightboxTitle: document.querySelector('[data-lightbox-title]'),
    lightboxStatus: document.querySelector('[data-lightbox-status]'),
    lightboxClose: document.querySelector('[data-lightbox-close]'),
    lightboxPrev: document.querySelector('[data-lightbox-prev]'),
    lightboxNext: document.querySelector('[data-lightbox-next]'),
    themeToggle: document.querySelector('[data-theme-toggle]')
  };

  if (!els.book || !els.thumbnails) {
    return;
  }

  const state = createFlipBookState({ viewportWidth: window.innerWidth });
  let touchStart = null;
  applyTheme(getPreferredTheme(), els.themeToggle);

  function renderPages() {
    const pages = getVisiblePages(state);
    els.book.innerHTML = '';
    els.book.classList.toggle('is-single', !state.doublePage);

    pages.forEach((page) => {
      const button = document.createElement('button');
      button.className = 'page';
      button.type = 'button';
      button.setAttribute('aria-label', `放大檢視 ${page.title}`);
      button.addEventListener('click', () => {
        openLightbox(state, page.index);
        renderLightbox();
      });

      const image = document.createElement('img');
      image.src = imagePath(page);
      image.alt = page.title;
      image.loading = page.index < 2 ? 'eager' : 'lazy';
      image.decoding = 'async';

      const caption = document.createElement('span');
      caption.className = 'page-caption';
      caption.textContent = `${page.index + 1}. ${page.title}`;

      button.append(image, caption);
      els.book.append(button);
    });

    updateChrome();
  }

  function renderThumbnails() {
    els.thumbnails.innerHTML = '';
    PAGE_IMAGES.forEach((page, index) => {
      const button = document.createElement('button');
      button.className = 'thumbnail';
      button.type = 'button';
      button.dataset.index = String(index);
      button.setAttribute('aria-label', `前往第 ${index + 1} 頁：${page.title}`);
      button.addEventListener('click', () => {
        goToPage(state, index);
        renderPages();
      });

      const image = document.createElement('img');
      image.src = imagePath(page);
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';

      const label = document.createElement('span');
      label.textContent = page.title;

      button.append(image, label);
      els.thumbnails.append(button);
    });
  }

  function updateChrome() {
    const visible = getVisiblePages(state);
    const first = visible[0].index + 1;
    const last = visible[visible.length - 1].index + 1;
    els.pageStatus.textContent = first === last
      ? `${first} / ${PAGE_IMAGES.length}`
      : `${first}-${last} / ${PAGE_IMAGES.length}`;

    els.prev.disabled = state.currentIndex === 0;
    els.next.disabled = state.currentIndex >= normalizeStartIndex(PAGE_IMAGES.length - 1, state.doublePage);

    document.querySelectorAll('.thumbnail').forEach((thumb) => {
      const index = Number(thumb.dataset.index);
      const active = visible.some((page) => page.index === index);
      thumb.classList.toggle('is-active', active);
      thumb.setAttribute('aria-current', active ? 'page' : 'false');
    });
  }

  function renderLightbox() {
    const isOpen = state.lightboxIndex !== null;
    els.lightbox.hidden = !isOpen;
    document.body.classList.toggle('has-lightbox', isOpen);
    if (!isOpen) {
      return;
    }

    const page = PAGE_IMAGES[state.lightboxIndex];
    els.lightboxImage.src = imagePath(page);
    els.lightboxImage.alt = page.title;
    els.lightboxTitle.textContent = page.title;
    els.lightboxStatus.textContent = `${state.lightboxIndex + 1} / ${PAGE_IMAGES.length}`;
    els.lightboxPrev.disabled = state.lightboxIndex === 0;
    els.lightboxNext.disabled = state.lightboxIndex === PAGE_IMAGES.length - 1;
    els.lightboxClose.focus();
  }

  els.prev.addEventListener('click', () => {
    goPrevious(state);
    renderPages();
  });

  els.next.addEventListener('click', () => {
    goNext(state);
    renderPages();
  });

  if (els.themeToggle) {
    els.themeToggle.addEventListener('click', () => {
      const nextTheme = getNextTheme(document.documentElement.dataset.theme);
      applyTheme(nextTheme, els.themeToggle);
      storeTheme(nextTheme);
    });
  }

  els.lightboxClose.addEventListener('click', () => {
    closeLightbox(state);
    renderLightbox();
  });

  els.lightboxPrev.addEventListener('click', () => {
    openLightbox(state, state.lightboxIndex - 1);
    renderLightbox();
  });

  els.lightboxNext.addEventListener('click', () => {
    openLightbox(state, state.lightboxIndex + 1);
    renderLightbox();
  });

  els.lightbox.addEventListener('click', (event) => {
    if (event.target === els.lightbox) {
      closeLightbox(state);
      renderLightbox();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (state.lightboxIndex !== null) {
      if (event.key === 'ArrowRight') {
        openLightbox(state, state.lightboxIndex + 1);
        renderLightbox();
        event.preventDefault();
      } else if (event.key === 'ArrowLeft') {
        openLightbox(state, state.lightboxIndex - 1);
        renderLightbox();
        event.preventDefault();
      } else if (handleKey(state, event.key)) {
        renderLightbox();
        event.preventDefault();
      }
      return;
    }

    if (handleKey(state, event.key)) {
      renderPages();
      event.preventDefault();
    }
  });

  window.addEventListener('resize', () => {
    updateViewport(state, window.innerWidth);
    renderPages();
  });

  els.book.addEventListener('touchstart', (event) => {
    const touch = event.changedTouches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });

  els.book.addEventListener('touchend', (event) => {
    if (!touchStart) {
      return;
    }
    const touch = event.changedTouches[0];
    const changed = handleSwipe(state, touchStart.x - touch.clientX, touchStart.y - touch.clientY);
    touchStart = null;
    if (changed) {
      renderPages();
    }
  }, { passive: true });

  renderThumbnails();
  renderPages();
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', initFlipBook);
}

if (typeof module !== 'undefined') {
  module.exports = {
    PAGE_IMAGES,
    createFlipBookState,
    updateViewport,
    getVisiblePages,
    goNext,
    goPrevious,
    goToPage,
    handleKey,
    handleSwipe,
    openLightbox,
    closeLightbox,
    normalizeTheme,
    getNextTheme
  };
}
