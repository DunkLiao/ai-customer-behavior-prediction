const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  PAGE_IMAGES,
  createFlipBookState,
  getVisiblePages,
  goNext,
  goPrevious,
  goToPage,
  handleKey,
  handleSwipe,
  openLightbox,
  closeLightbox,
  normalizeTheme,
  getNextTheme,
  getImageSources,
  getDownloadTarget
} = require('../script');

test('includes every infographic in the intended reading order', () => {
  assert.equal(PAGE_IMAGES.length, 22);
  assert.deepEqual(
    PAGE_IMAGES.map((page) => page.file),
    [
      '交叉比率.png',
      '安全存量.png',
      '步留率.png',
      '坪效.png',
      '枱帳_1.png',
      '枱帳_2.png',
      '范蠡的經營智慧.png',
      '孫子兵法在零售業分析.png',
      '真毛利.png',
      '貢獻度與投入資源要能夠平衡.png',
      '商品敏感性與營業額.png',
      '粗毛利.png',
      '零售ABCZ法.png',
      '銷售金額眾數.png',
      '駐足率.png',
      '膨脹率.png',
      '總毛利率.png',
      'ABCZ分析.png',
      'AISAS.png',
      'PESTEL分析.png',
      'pi值.png',
      'SKU.png'
    ]
  );
});

test('each infographic has optimized full-size and thumbnail assets', () => {
  for (const page of PAGE_IMAGES) {
    assert.match(page.webpFile, /\.webp$/);
    assert.match(page.thumbnailFile, /\.webp$/);
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'infographics', 'webp', page.webpFile)));
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'infographics', 'thumbs', page.thumbnailFile)));
  }
});

test('image sources keep WebP primary assets and PNG fallbacks', () => {
  const page = PAGE_IMAGES[0];

  assert.deepEqual(getImageSources(page, 'full'), {
    primary: 'infographics/webp/交叉比率.webp',
    fallback: 'infographics/交叉比率.png',
    width: 1536,
    height: 1024
  });
  assert.deepEqual(getImageSources(page, 'thumbnail'), {
    primary: 'infographics/thumbs/交叉比率.webp',
    fallback: 'infographics/交叉比率.png',
    width: 300,
    height: 200
  });
});

test('lightbox sources use the original PNG without a WebP primary', () => {
  const page = PAGE_IMAGES[0];

  assert.deepEqual(getImageSources(page, 'original'), {
    primary: 'infographics/交叉比率.png',
    fallback: 'infographics/交叉比率.png',
    width: 1536,
    height: 1024
  });
});

test('desktop mode shows a two-page spread and advances by spreads', () => {
  const state = createFlipBookState({ viewportWidth: 1280 });

  assert.deepEqual(getVisiblePages(state).map((page) => page.index), [0, 1]);

  goNext(state);
  assert.deepEqual(getVisiblePages(state).map((page) => page.index), [2, 3]);

  goPrevious(state);
  assert.deepEqual(getVisiblePages(state).map((page) => page.index), [0, 1]);
});

test('mobile mode shows one page and advances one page at a time', () => {
  const state = createFlipBookState({ viewportWidth: 390 });

  assert.deepEqual(getVisiblePages(state).map((page) => page.index), [0]);

  goNext(state);
  assert.deepEqual(getVisiblePages(state).map((page) => page.index), [1]);

  goPrevious(state);
  assert.deepEqual(getVisiblePages(state).map((page) => page.index), [0]);
});

test('navigation clamps to valid page indexes', () => {
  const state = createFlipBookState({ viewportWidth: 1280 });

  goToPage(state, 999);
  assert.equal(state.currentIndex, 20);
  assert.deepEqual(getVisiblePages(state).map((page) => page.index), [20, 21]);

  goToPage(state, -10);
  assert.equal(state.currentIndex, 0);
});

test('keyboard and swipe controls update the current page', () => {
  const state = createFlipBookState({ viewportWidth: 390 });

  assert.equal(handleKey(state, 'ArrowRight'), true);
  assert.equal(state.currentIndex, 1);
  assert.equal(handleKey(state, 'ArrowLeft'), true);
  assert.equal(state.currentIndex, 0);
  assert.equal(handleKey(state, 'Tab'), false);

  assert.equal(handleSwipe(state, 120, 12), true);
  assert.equal(state.currentIndex, 1);
  assert.equal(handleSwipe(state, -120, 8), true);
  assert.equal(state.currentIndex, 0);
  assert.equal(handleSwipe(state, 20, 0), false);
});

test('lightbox opens on a valid image and closes without changing the page', () => {
  const state = createFlipBookState({ viewportWidth: 1280 });

  openLightbox(state, 6);
  assert.equal(state.lightboxIndex, 6);

  closeLightbox(state);
  assert.equal(state.lightboxIndex, null);
  assert.equal(state.currentIndex, 0);
});

test('small mobile layout keeps page navigation over the book instead of a second row', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  const smallMobileBlock = css.match(/@media \(max-width: 560px\) \{[\s\S]*?\n\}/)?.[0] ?? '';
  const stageBlock = css.match(/@media \(max-width: 560px\) \{[\s\S]*?\.stage\s*\{([\s\S]*?)\n  \}/)?.[1] ?? '';
  const navButtonBlock = css.match(/@media \(max-width: 560px\) \{[\s\S]*?\.nav-button\s*\{([\s\S]*?)\n  \}/)?.[1] ?? '';

  assert.match(stageBlock, /position: relative;/);
  assert.match(navButtonBlock, /position: absolute;/);
  assert.doesNotMatch(navButtonBlock, /grid-row: 2;/);
  assert.match(smallMobileBlock, /\.thumbnail\s*\{[\s\S]*flex-basis: 98px;/);
});

test('page includes course context in the header and creator credit in the footer', () => {
  const html = fs.readFileSync('index.html', 'utf8');

  assert.match(html, /參加工研院2026年8\/19、8\/26 客戶數據分析/);
  assert.match(html, /AI解讀消費者歷史數據高效行銷實作應用班\(臺北班\)/);
  assert.match(html, /perplexity查詢後利用chatgpt產生資訊圖表/);
  assert.match(html, /@工研院2026年8\/19、8\/26 客戶數據分析/);
  assert.match(html, /Created by Dunk/);
});

test('theme helpers normalize and toggle light and dark modes', () => {
  assert.equal(normalizeTheme('light'), 'light');
  assert.equal(normalizeTheme('dark'), 'dark');
  assert.equal(normalizeTheme('unexpected'), 'dark');
  assert.equal(normalizeTheme(null), 'dark');
  assert.equal(getNextTheme('dark'), 'light');
  assert.equal(getNextTheme('light'), 'dark');
});

test('page exposes a theme toggle and light theme styles', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const css = fs.readFileSync('styles.css', 'utf8');

  assert.match(html, /data-theme-toggle/);
  assert.match(html, /aria-label="切換深淺色模式"/);
  assert.match(css, /\[data-theme="light"\]/);
  assert.match(css, /color-scheme: light;/);
});

test('light theme keeps control text readable on pale controls', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  const controlThemeBlock = css.match(/\[data-theme="light"\] \.theme-toggle,[\s\S]*?\n\}/)?.[0] ?? '';

  assert.match(controlThemeBlock, /\[data-theme="light"\] \.status/);
  assert.match(controlThemeBlock, /\[data-theme="light"\] \.nav-button/);
  assert.match(controlThemeBlock, /color: var\(--text\);/);
});

test('page caption stays readable on its dark overlay in light theme', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  const pageCaptionBlock = css.match(/\.page-caption\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

  assert.match(pageCaptionBlock, /background: rgba\(22, 22, 20, 0\.78\);/);
  assert.match(pageCaptionBlock, /color: var\(--paper\);/);
});

test('lightbox image stays fully contained within its available area', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const css = fs.readFileSync('styles.css', 'utf8');
  const containerTag = html.match(/<div[^>]*data-lightbox-image-container[^>]*>/)?.[0] ?? '';
  const containerBlock = css.match(/\.lightbox-image-container\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  const imageBlock = css.match(/\.lightbox-image-container img\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

  assert.match(containerTag, /class="lightbox-image-container"/);
  assert.match(containerBlock, /position: relative;/);
  assert.match(containerBlock, /grid-column: 2;/);
  assert.match(containerBlock, /grid-row: 2;/);
  assert.doesNotMatch(containerBlock, /position: fixed;/);
  assert.match(imageBlock, /position: absolute;/);
  assert.match(imageBlock, /width: 100%;/);
  assert.match(imageBlock, /height: 100%;/);
  assert.match(imageBlock, /object-fit: contain;/);
});

test('download target resolves the original PNG href and file name', () => {
  const page = PAGE_IMAGES[0];

  assert.deepEqual(getDownloadTarget(page), {
    href: 'infographics/%E4%BA%A4%E5%8F%89%E6%AF%94%E7%8E%87.png',
    fileName: '交叉比率.png'
  });
});

test('lightbox provides a download control', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const css = fs.readFileSync('styles.css', 'utf8');

  assert.match(html, /data-lightbox-download/);
  assert.match(html, /aria-label="下載圖片"/);
  assert.match(css, /\.lightbox-actions\s*\{/);
});
